import { prisma } from '@tpmjs/db';
import { fetchLatestPackageWithMetadata, searchByKeyword } from '@tpmjs/npm-client';
import { validateTpmjsField } from '@tpmjs/types/tpmjs';
import { type NextRequest, NextResponse } from 'next/server';
import { env } from '~/env';
import { performHealthCheck } from '~/lib/health-check/health-check-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for cron jobs

/**
 * POST /api/sync/keyword
 * Sync tools by searching NPM for 'tpmjs-tool' keyword
 *
 * This endpoint is called by Vercel Cron (every 15 minutes)
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
  let skipped = 0;
  let errors = 0;
  const errorMessages: string[] = [];
  const skippedPackages: Array<{ name: string; author: string; reason: string }> = [];

  try {
    // Search for packages with 'tpmjs-tool' keyword
    const searchResults = await searchByKeyword({
      keyword: 'tpmjs-tool',
      size: 250, // Get up to 250 packages per sync
    });

    // Process each package
    for (const result of searchResults) {
      try {
        // Fetch full package metadata with README
        const pkg = await fetchLatestPackageWithMetadata(result.package.name);

        // Skip if package not found
        if (!pkg) {
          skipped++;
          skippedPackages.push({
            name: result.package.name,
            author: 'unknown',
            reason: 'package not found',
          });
          continue;
        }

        // Extract author name
        const authorName =
          typeof pkg.author === 'string'
            ? pkg.author
            : typeof pkg.author === 'object' && pkg.author?.name
              ? pkg.author.name
              : 'unknown';

        // Check if package has tpmjs field
        if (!pkg.tpmjs) {
          skipped++;
          skippedPackages.push({
            name: pkg.name,
            author: authorName,
            reason: 'missing tpmjs field',
          });
          continue;
        }

        // Validate tpmjs field (supports both new multi-tool and legacy formats)
        const validation = validateTpmjsField(pkg.tpmjs);
        if (!validation.valid || !validation.packageData || !validation.tools) {
          skipped++;
          skippedPackages.push({
            name: pkg.name,
            author: authorName,
            reason: 'invalid tpmjs field',
          });
          continue;
        }

        // Log auto-migration from legacy format
        if (validation.wasLegacyFormat) {
          console.log(`Auto-migrated legacy package: ${pkg.name}`);
        }

        // Extract repository URL and GitHub stars
        const githubStars: number | null = null;

        // Upsert Package record
        const packageRecord = await prisma.package.upsert({
          where: { npmPackageName: pkg.name },
          create: {
            npmPackageName: pkg.name,
            npmVersion: pkg.version,
            npmPublishedAt: pkg.publishedAt ? new Date(pkg.publishedAt) : new Date(),
            npmDescription: pkg.description ?? undefined,
            npmRepository: pkg.repository ?? undefined,
            npmHomepage: pkg.homepage ?? undefined,
            npmLicense: pkg.license ?? undefined,
            npmKeywords: pkg.topLevelKeywords || pkg.keywords || [],
            npmReadme: pkg.readme ?? undefined,
            npmAuthor: pkg.author ?? undefined,
            npmMaintainers: pkg.maintainers ?? undefined,
            category: validation.packageData.category,
            env: validation.packageData.env ?? undefined,
            frameworks: validation.packageData.frameworks || [],
            tier: validation.tier || 'minimal',
            discoveryMethod: 'keyword',
            isOfficial: pkg.keywords?.includes('tpmjs-tool') || false,
            npmDownloadsLastMonth: 0, // Will be updated by metrics sync
            githubStars: githubStars,
          },
          update: {
            npmVersion: pkg.version,
            npmPublishedAt: pkg.publishedAt ? new Date(pkg.publishedAt) : new Date(),
            npmDescription: pkg.description ?? undefined,
            npmRepository: pkg.repository ?? undefined,
            npmHomepage: pkg.homepage ?? undefined,
            npmLicense: pkg.license ?? undefined,
            npmKeywords: pkg.topLevelKeywords || pkg.keywords || [],
            npmReadme: pkg.readme ?? undefined,
            npmAuthor: pkg.author ?? undefined,
            npmMaintainers: pkg.maintainers ?? undefined,
            category: validation.packageData.category,
            env: validation.packageData.env ?? undefined,
            frameworks: validation.packageData.frameworks || [],
            tier: validation.tier || 'minimal',
            isOfficial: pkg.keywords?.includes('tpmjs-tool') || false,
          },
        });

        // Get existing tools for this package
        const existingTools = await prisma.tool.findMany({
          where: { packageId: packageRecord.id },
        });

        // Upsert each tool in the tools array
        for (const toolDef of validation.tools) {
          const upsertedTool = await prisma.tool.upsert({
            where: {
              packageId_exportName: {
                packageId: packageRecord.id,
                exportName: toolDef.exportName,
              },
            },
            create: {
              packageId: packageRecord.id,
              exportName: toolDef.exportName,
              description: toolDef.description,
              // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility workaround
              parameters: toolDef.parameters ? (toolDef.parameters as any) : undefined,
              // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility workaround
              returns: toolDef.returns ? (toolDef.returns as any) : undefined,
              // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility workaround
              aiAgent: toolDef.aiAgent ? (toolDef.aiAgent as any) : undefined,
              qualityScore: null, // Will be calculated by metrics sync
            },
            update: {
              description: toolDef.description,
              // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility workaround
              parameters: toolDef.parameters ? (toolDef.parameters as any) : undefined,
              // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility workaround
              returns: toolDef.returns ? (toolDef.returns as any) : undefined,
              // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility workaround
              aiAgent: toolDef.aiAgent ? (toolDef.aiAgent as any) : undefined,
            },
          });

          // Trigger immediate health check (non-blocking)
          performHealthCheck(upsertedTool.id, 'sync').catch((err) => {
            console.error(
              `Health check failed for ${pkg.name}/${toolDef.exportName} (${upsertedTool.id}):`,
              err
            );
          });
        }

        // Delete orphaned tools (tools removed from package.json)
        const orphanedTools = existingTools.filter(
          (existingTool) =>
            !validation.tools?.some((toolDef) => toolDef.exportName === existingTool.exportName)
        );

        if (orphanedTools.length > 0) {
          await prisma.tool.deleteMany({
            where: {
              id: { in: orphanedTools.map((t) => t.id) },
            },
          });
          console.log(`Deleted ${orphanedTools.length} orphaned tools from package: ${pkg.name}`);
        }

        processed++;
      } catch (error) {
        errors++;
        const errorMsg = `Failed to process ${result.package.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errorMessages.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // Update checkpoint with last run timestamp
    await prisma.syncCheckpoint.upsert({
      where: { source: 'keyword-search' },
      create: {
        source: 'keyword-search',
        checkpoint: {
          lastRun: new Date().toISOString(),
          packagesFound: searchResults.length,
        },
      },
      update: {
        checkpoint: {
          lastRun: new Date().toISOString(),
          packagesFound: searchResults.length,
        },
      },
    });

    // Log sync operation
    await prisma.syncLog.create({
      data: {
        source: 'keyword-search',
        status: errors > 0 ? 'partial' : 'success',
        processed,
        skipped,
        errors,
        message:
          errors > 0
            ? `Processed with errors: ${errorMessages.slice(0, 3).join('; ')}`
            : `Successfully processed ${processed} packages`,
        metadata: {
          durationMs: Date.now() - startTime,
          packagesFound: searchResults.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        processed,
        skipped,
        errors,
        packagesFound: searchResults.length,
        durationMs: Date.now() - startTime,
        errorMessages: errorMessages.slice(0, 5), // Include first 5 error messages
        skippedPackages: skippedPackages, // Include all skipped package names
      },
    });
  } catch (error) {
    console.error('Keyword search sync failed:', error);

    // Log failed sync
    await prisma.syncLog.create({
      data: {
        source: 'keyword-search',
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
