import { prisma } from '@tpmjs/db';
import { fetchChanges, fetchLatestPackageWithMetadata } from '@tpmjs/npm-client';
import { validateTpmjsField } from '@tpmjs/types/tpmjs';
import { type NextRequest, NextResponse } from 'next/server';
import { env } from '~/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for cron jobs

/**
 * POST /api/sync/changes
 * Sync tools from NPM changes feed
 *
 * This endpoint is called by Vercel Cron (every 2 minutes)
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

  try {
    // Get last checkpoint
    const checkpoint = await prisma.syncCheckpoint.findUnique({
      where: { source: 'changes-feed' },
    });

    const lastSeq = checkpoint?.checkpoint
      ? String((checkpoint.checkpoint as { lastSeq?: string })?.lastSeq || '0')
      : '0';

    // Fetch changes from NPM (limit to 100 per run to avoid timeouts)
    const changesResult = await fetchChanges({
      since: lastSeq,
      limit: 100,
      includeDocs: false,
    });

    // Process each change
    for (const change of changesResult.results) {
      try {
        // Fetch full package metadata with README
        const pkg = await fetchLatestPackageWithMetadata(change.id);

        // Skip if package not found
        if (!pkg) {
          skipped++;
          continue;
        }

        // Check if package has tpmjs field
        if (!pkg.tpmjs) {
          skipped++;
          continue;
        }

        // Validate tpmjs field (supports both new multi-tool and legacy formats)
        const validation = validateTpmjsField(pkg.tpmjs);
        if (!validation.valid || !validation.packageData || !validation.tools) {
          skipped++;
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
            discoveryMethod: 'changes-feed',
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
          await prisma.tool.upsert({
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
          console.log(
            `Deleted ${orphanedTools.length} orphaned tools from package: ${pkg.name}`
          );
        }

        processed++;
      } catch (error) {
        errors++;
        const errorMsg = `Failed to process ${change.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errorMessages.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // Update checkpoint with new sequence
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

    // Log sync operation
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

    // Log failed sync
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
