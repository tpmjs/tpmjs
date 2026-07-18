import { prisma } from '@tpmjs/db';
import { fetchChanges, fetchLatestPackageWithMetadata } from '@tpmjs/npm-client';
import { validateTpmjsField } from '@tpmjs/types/tpmjs';
import { type NextRequest, NextResponse } from 'next/server';
import { requireCronAuth } from '~/lib/cron-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/sync/changes
 * Discovery-only sync: monitors NPM changes feed, upserts packages and tools.
 * Does NOT call the executor for schema extraction or health checks — that's handled by /api/sync/enrich.
 *
 * Called by Vercel Cron (every 4 hours) or GitHub Actions.
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
    const checkpoint = await prisma.syncCheckpoint.findUnique({
      where: { source: 'changes-feed' },
    });

    const lastSeq = checkpoint?.checkpoint
      ? String((checkpoint.checkpoint as { lastSeq?: string })?.lastSeq || '0')
      : '0';

    // Increased limit since we no longer spend time on schema extraction
    const changesResult = await fetchChanges({
      since: lastSeq,
      limit: 100,
      includeDocs: false,
    });

    for (const change of changesResult.results) {
      try {
        const pkg = await fetchLatestPackageWithMetadata(change.id);

        if (!pkg) {
          skipped++;
          continue;
        }

        if (!pkg.tpmjs) {
          skipped++;
          continue;
        }

        const validation = validateTpmjsField(pkg.tpmjs);
        if (!validation.valid || !validation.packageData) {
          skipped++;
          continue;
        }

        if (validation.wasLegacyFormat) {
          console.log(`Auto-migrated legacy package: ${pkg.name}`);
        }

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
            discoveryMethod: 'changes-feed',
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
            category: validation.packageData.category,
            env: validation.packageData.env ?? undefined,
            frameworks: validation.packageData.frameworks || [],
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
        const errorMsg = `Failed to process ${change.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errorMessages.push(errorMsg);
        console.error(errorMsg);
      }
    }

    await prisma.syncCheckpoint.upsert({
      where: { source: 'changes-feed' },
      create: {
        source: 'changes-feed',
        checkpoint: {
          lastSeq: changesResult.lastSeq,
          lastRun: new Date().toISOString(),
        },
      },
      update: {
        checkpoint: {
          lastSeq: changesResult.lastSeq,
          lastRun: new Date().toISOString(),
        },
      },
    });

    await prisma.syncLog.create({
      data: {
        source: 'changes-feed',
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
          lastSeq: changesResult.lastSeq,
          pending: changesResult.pending,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        processed,
        skipped,
        errors,
        lastSeq: changesResult.lastSeq,
        pending: changesResult.pending,
        durationMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('Changes feed sync failed:', error);

    try {
      await prisma.syncLog.create({
        data: {
          source: 'changes-feed',
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
      console.error('Failed to write sync log (DB may be unavailable):', logError);
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
