import { prisma } from '@tpmjs/db';
import { fetchDownloadStats, fetchGitHubStarsFromRepository } from '@tpmjs/npm-client';
import { type NextRequest, NextResponse } from 'next/server';
import { requireCronAuth } from '~/lib/cron-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for cron jobs

const BATCH_SIZE = 5;

/**
 * POST /api/sync/metrics
 * Update download stats and quality scores for all packages and tools
 *
 * This endpoint is called by Vercel Cron (daily)
 * Requires Authorization: Bearer <CRON_SECRET>
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex but straightforward CRUD operation
export async function POST(request: NextRequest) {
  const unauthorized = requireCronAuth(request);
  if (unauthorized) return unauthorized;

  const startTime = Date.now();
  let processed = 0;
  let skipped = 0;
  let errors = 0;
  const errorMessages: string[] = [];

  try {
    const packages = await prisma.package.findMany({
      include: {
        tools: true,
      },
    });

    // Process packages in batches of BATCH_SIZE concurrently
    for (let i = 0; i < packages.length; i += BATCH_SIZE) {
      const batch = packages.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (pkg) => {
          // Fetch downloads and GitHub stars in parallel for each package.
          // Either fetcher returns null when the value is UNKNOWN (rate
          // limit / API outage) — in that case we keep the previously stored
          // value rather than overwriting good data with 0.
          const [downloads, githubStars] = await Promise.all([
            fetchDownloadStats(pkg.npmPackageName),
            fetchGitHubStarsFromRepository(
              pkg.npmRepository as { type?: string; url?: string } | string | null
            ),
          ]);

          const packageData: { npmDownloadsLastMonth?: number; githubStars?: number } = {};
          if (downloads !== null) packageData.npmDownloadsLastMonth = downloads;
          if (githubStars !== null) packageData.githubStars = githubStars;

          if (Object.keys(packageData).length > 0) {
            await prisma.package.update({
              where: { id: pkg.id },
              data: packageData,
            });
          }

          // Calculate and update quality score for each tool in this package,
          // using the freshest known values (fetched, else previously stored).
          const effectiveDownloads = downloads ?? pkg.npmDownloadsLastMonth ?? 0;
          const effectiveStars = githubStars ?? pkg.githubStars ?? 0;
          for (const tool of pkg.tools) {
            const qualityScore = calculateQualityScore({
              tier: pkg.tier,
              downloads: effectiveDownloads,
              githubStars: effectiveStars,
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

          // A package where both values were unknown counts as skipped
          return {
            name: pkg.npmPackageName,
            allUnknown: downloads === null && githubStars === null,
          };
        })
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          if (result.value.allUnknown) {
            skipped++;
          } else {
            processed++;
          }
        } else {
          errors++;
          const errorMsg = `Failed to process package: ${result.reason instanceof Error ? result.reason.message : 'Unknown error'}`;
          errorMessages.push(errorMsg);
          console.error(errorMsg);
        }
      }

      // Pace the sweep — stay under npm/GitHub burst limits
      if (i + BATCH_SIZE < packages.length) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    try {
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
    } catch (checkpointError) {
      console.error('Failed to update sync checkpoint:', checkpointError);
    }

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

    try {
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
    } catch (logError) {
      console.error('Failed to create sync error log:', logError);
    }

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
