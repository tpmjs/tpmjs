import { prisma } from '@tpmjs/db';
import { fetchLatestPackageWithMetadata, searchByKeyword } from '@tpmjs/npm-client';
import { validateTpmjsField } from '@tpmjs/types/tpmjs';
import { type NextRequest, NextResponse } from 'next/server';
import { env } from '~/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/sync/keyword
 * Discovery-only sync: searches NPM for 'tpmjs' keyword, upserts packages and tools.
 * Does NOT call the executor for schema extraction or health checks — that's handled by /api/sync/enrich.
 *
 * Called by Vercel Cron (every 6 hours) or GitHub Actions.
 * Requires Authorization: Bearer <CRON_SECRET>
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex but straightforward CRUD operation
export async function POST(request: NextRequest) {
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
    const searchResults = await searchByKeyword({
      keyword: 'tpmjs',
      size: 250,
    });

    for (const result of searchResults) {
      try {
        const pkg = await fetchLatestPackageWithMetadata(result.package.name);

        if (!pkg) {
          skipped++;
          skippedPackages.push({
            name: result.package.name,
            author: 'unknown',
            reason: 'package not found',
          });
          continue;
        }

        const authorName =
          typeof pkg.author === 'string'
            ? pkg.author
            : typeof pkg.author === 'object' && pkg.author?.name
              ? pkg.author.name
              : 'unknown';

        // Validate tpmjs field or use auto-discovery defaults
        let validation: ReturnType<typeof validateTpmjsField>;

        if (!pkg.tpmjs) {
          console.log(
            `Package ${pkg.name} has tpmjs keyword but no tpmjs field - using auto-discovery`
          );
          validation = {
            valid: true,
            tier: 'minimal',
            packageData: {
              category: 'utilities',
            },
            tools: [],
            needsAutoDiscovery: true,
            wasLegacyFormat: false,
          };
        } else {
          validation = validateTpmjsField(pkg.tpmjs);
          if (!validation.valid || !validation.packageData) {
            skipped++;
            skippedPackages.push({
              name: pkg.name,
              author: authorName,
              reason: 'invalid tpmjs field',
            });
            continue;
          }

          if (validation.wasLegacyFormat) {
            console.log(`Auto-migrated legacy package: ${pkg.name}`);
          }
        }

        // biome-ignore lint/style/noNonNullAssertion: guaranteed by validation check above
        const packageData = validation.packageData!;

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
            category: packageData.category,
            env: packageData.env ?? undefined,
            frameworks: packageData.frameworks || [],
            tier: validation.tier || 'minimal',
            discoveryMethod: 'keyword',
            isOfficial: pkg.keywords?.includes('tpmjs') || false,
            npmDownloadsLastMonth: 0,
            githubStars: null,
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
            category: packageData.category,
            env: packageData.env ?? undefined,
            frameworks: packageData.frameworks || [],
            tier: validation.tier || 'minimal',
            isOfficial: pkg.keywords?.includes('tpmjs') || false,
          },
        });

        // For auto-discovery packages, skip tool creation — enrichment will handle it
        if (validation.needsAutoDiscovery) {
          console.log(
            `Package ${pkg.name} needs auto-discovery — enrichment will handle tool creation`
          );
          processed++;
          continue;
        }

        // Upsert tools from the tpmjs.tools array (manual discovery only)
        const toolsToProcess = validation.tools || [];

        const existingTools = await prisma.tool.findMany({
          where: { packageId: packageRecord.id },
        });

        for (const toolDef of toolsToProcess) {
          const toolName = toolDef.name;
          if (!toolName) {
            console.warn(`Skipping tool without name in ${pkg.name}`);
            continue;
          }

          await prisma.tool.upsert({
            where: {
              packageId_name: {
                packageId: packageRecord.id,
                name: toolName,
              },
            },
            create: {
              packageId: packageRecord.id,
              name: toolName,
              description: toolDef.description || 'No description provided',
              // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility workaround
              parameters: toolDef.parameters ? (toolDef.parameters as any) : undefined,
              // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility workaround
              returns: toolDef.returns ? (toolDef.returns as any) : undefined,
              // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility workaround
              aiAgent: toolDef.aiAgent ? (toolDef.aiAgent as any) : undefined,
              qualityScore: null,
              schemaSource: toolDef.parameters ? 'author' : null,
              toolDiscoverySource: 'manual',
            },
            update: {
              description: toolDef.description || undefined,
              // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility workaround
              parameters: toolDef.parameters ? (toolDef.parameters as any) : undefined,
              // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility workaround
              returns: toolDef.returns ? (toolDef.returns as any) : undefined,
              // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility workaround
              aiAgent: toolDef.aiAgent ? (toolDef.aiAgent as any) : undefined,
              toolDiscoverySource: 'manual',
            },
          });
        }

        // Delete orphaned tools (tools removed from package.json)
        const orphanedTools = existingTools.filter(
          (existingTool) => !toolsToProcess.some((toolDef) => toolDef.name === existingTool.name)
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
        errorMessages: errorMessages.slice(0, 5),
        skippedPackages: skippedPackages,
      },
    });
  } catch (error) {
    console.error('Keyword search sync failed:', error);

    try {
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
    } catch (logError) {
      console.error('Failed to write sync log (DB unavailable):', logError);
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
