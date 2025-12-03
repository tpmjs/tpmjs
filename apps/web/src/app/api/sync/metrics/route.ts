import { prisma } from '@tpmjs/db';
import { fetchDownloadStats } from '@tpmjs/npm-client';
import { type NextRequest, NextResponse } from 'next/server';
import { env } from '~/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for cron jobs

/**
 * POST /api/sync/metrics
 * Update download stats and quality scores for all packages and tools
 *
 * This endpoint is called by Vercel Cron (every hour)
 * Requires Authorization: Bearer <CRON_SECRET>
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex but straightforward CRUD operation
export async function POST(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (env.CRON_SECRET && token !== env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  let processed = 0;
  const skipped = 0;
  let errors = 0;
  const errorMessages: string[] = [];

  try {
    // Get all packages with their tools from database
    const packages = await prisma.package.findMany({
      include: {
        tools: true,
      },
    });

    // Process each package
    for (const pkg of packages) {
      try {
        // Fetch download stats from NPM (package-level metric)
        const downloads = await fetchDownloadStats(pkg.npmPackageName);

        // Update package metrics
        await prisma.package.update({
          where: { id: pkg.id },
          data: {
            npmDownloadsLastMonth: downloads,
            // githubStars would be updated here if we had GitHub API integration
          },
        });

        // Calculate and update quality score for each tool in this package
        for (const tool of pkg.tools) {
          const qualityScore = calculateQualityScore({
            tier: pkg.tier, // Tier is at package level
            downloads, // Package downloads
            githubStars: pkg.githubStars || 0, // Package stars
            hasParameters: !!tool.parameters,
            hasReturns: !!tool.returns,
            hasAiAgent: !!tool.aiAgent,
          });

          await prisma.tool.update({
            where: { id: tool.id },
            data: {
              qualityScore,
            },
          });
        }

        processed++;
      } catch (error) {
        errors++;
        const errorMsg = `Failed to process ${pkg.npmPackageName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errorMessages.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // Update checkpoint with last run timestamp
    await prisma.syncCheckpoint.upsert({
      where: { source: 'metrics' },
      create: {
        source: 'metrics',
        checkpoint: {
          lastRun: new Date().toISOString(),
          totalPackages: packages.length,
          totalTools: packages.reduce((sum, pkg) => sum + pkg.tools.length, 0),
        },
      },
      update: {
        checkpoint: {
          lastRun: new Date().toISOString(),
          totalPackages: packages.length,
          totalTools: packages.reduce((sum, pkg) => sum + pkg.tools.length, 0),
        },
      },
    });

    // Log sync operation
    await prisma.syncLog.create({
      data: {
        source: 'metrics',
        status: errors > 0 ? 'partial' : 'success',
        processed,
        skipped,
        errors,
        message:
          errors > 0
            ? `Processed with errors: ${errorMessages.slice(0, 3).join('; ')}`
            : `Successfully updated metrics for ${processed} packages`,
        metadata: {
          durationMs: Date.now() - startTime,
          totalPackages: packages.length,
          totalTools: packages.reduce((sum, pkg) => sum + pkg.tools.length, 0),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        processed,
        skipped,
        errors,
        totalPackages: packages.length,
        totalTools: packages.reduce((sum, pkg) => sum + pkg.tools.length, 0),
        durationMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('Metrics sync failed:', error);

    // Log failed sync
    await prisma.syncLog.create({
      data: {
        source: 'metrics',
        status: 'error',
        processed,
        skipped,
        errors: errors + 1,
        message: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          durationMs: Date.now() - startTime,
        },
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate quality score based on multiple factors
 * Returns a value between 0.00 and 1.00
 *
 * Score components:
 * - Tier (0.4 minimal, 0.6 rich)
 * - Downloads (logarithmic, max 0.2)
 * - GitHub stars (logarithmic, max 0.1)
 * - Tool metadata richness (0.1 for each: parameters, returns, aiAgent)
 */
function calculateQualityScore(params: {
  tier: string;
  downloads: number;
  githubStars: number;
  hasParameters: boolean;
  hasReturns: boolean;
  hasAiAgent: boolean;
}): number {
  const { tier, downloads, githubStars, hasParameters, hasReturns, hasAiAgent } = params;

  // Base score from tier
  const tierScore = tier === 'rich' ? 0.6 : 0.4;

  // Downloads score (logarithmic scale, max 0.2)
  const downloadsScore = Math.min(0.2, Math.log10(downloads + 1) / 15);

  // GitHub stars score (logarithmic scale, max 0.1)
  const starsScore = Math.min(0.1, Math.log10(githubStars + 1) / 10);

  // Tool metadata richness score (max 0.1)
  let richnessScore = 0;
  if (hasParameters) richnessScore += 0.04;
  if (hasReturns) richnessScore += 0.03;
  if (hasAiAgent) richnessScore += 0.03;

  // Total score (capped at 1.00)
  const totalScore = Math.min(1.0, tierScore + downloadsScore + starsScore + richnessScore);

  // Round to 2 decimal places
  return Math.round(totalScore * 100) / 100;
}
