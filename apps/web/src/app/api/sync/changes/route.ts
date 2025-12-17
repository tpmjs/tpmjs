import { prisma } from '@tpmjs/db';
import { fetchChanges, fetchLatestPackageWithMetadata } from '@tpmjs/npm-client';
import { validateTpmjsField } from '@tpmjs/types/tpmjs';
import type { TpmjsToolDefinition } from '@tpmjs/types/tpmjs';
import { type NextRequest, NextResponse } from 'next/server';
import { env } from '~/env';
import { performHealthCheck } from '~/lib/health-check/health-check-service';
import {
  convertJsonSchemaToParameters,
  extractToolSchema,
  listToolExports,
} from '~/lib/schema-extraction';

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

    // Fetch changes from NPM (limit to 30 per run to allow time for schema extraction)
    const changesResult = await fetchChanges({
      since: lastSeq,
      limit: 30,
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

        // Determine the tools to process
        let toolsToProcess: TpmjsToolDefinition[] = validation.tools || [];
        let toolDiscoverySource: 'auto' | 'manual' = 'manual';

        // If tools need auto-discovery, call the executor to list exports
        if (validation.needsAutoDiscovery) {
          console.log(`Auto-discovering tools for ${pkg.name}...`);
          const exportsResult = await listToolExports(pkg.name, pkg.version, null);

          if (exportsResult.success) {
            // Convert discovered tools to TpmjsToolDefinition format
            toolsToProcess = exportsResult.tools
              .filter((t) => t.isValidTool)
              .map((t) => ({
                name: t.name,
                description: t.description,
              }));
            toolDiscoverySource = 'auto';
            console.log(
              `Auto-discovered ${toolsToProcess.length} tools for ${pkg.name}: ${toolsToProcess.map((t) => t.name).join(', ')}`
            );
          } else {
            console.log(`Failed to auto-discover tools for ${pkg.name}: ${exportsResult.error}`);
            // Skip this package if we can't discover tools
            skipped++;
            continue;
          }
        }

        // Upsert each tool
        for (const toolDef of toolsToProcess) {
          // Get tool name from validated schema
          const toolName = toolDef.name;
          if (!toolName) {
            console.warn(`Skipping tool without name in ${pkg.name}`);
            continue;
          }

          const upsertedTool = await prisma.tool.upsert({
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
              qualityScore: null, // Will be calculated by metrics sync
              // Schema will be extracted below
              schemaSource: toolDef.parameters ? 'author' : null,
              toolDiscoverySource,
            },
            update: {
              description: toolDef.description || undefined,
              // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility workaround
              parameters: toolDef.parameters ? (toolDef.parameters as any) : undefined,
              // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility workaround
              returns: toolDef.returns ? (toolDef.returns as any) : undefined,
              // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility workaround
              aiAgent: toolDef.aiAgent ? (toolDef.aiAgent as any) : undefined,
              toolDiscoverySource,
            },
          });

          // Extract schema synchronously from executor
          const schemaResult = await extractToolSchema(pkg.name, toolName, pkg.version, null);

          if (schemaResult.success) {
            // Update tool with extracted schema (and description if not provided)
            await prisma.tool.update({
              where: { id: upsertedTool.id },
              data: {
                // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility workaround
                inputSchema: schemaResult.inputSchema as any,
                // Also update parameters array for backward compatibility
                // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility workaround
                parameters: convertJsonSchemaToParameters(schemaResult.inputSchema) as any,
                schemaSource: 'extracted',
                schemaExtractedAt: new Date(),
                // Update description if not provided by author
                ...(!toolDef.description && schemaResult.description
                  ? { description: schemaResult.description }
                  : {}),
              },
            });
            console.log(`Schema extracted for ${pkg.name}/${toolName}`);
          } else {
            // Extraction failed - mark schema source appropriately
            console.log(
              `Schema extraction failed for ${pkg.name}/${toolName}: ${schemaResult.error}`
            );
            await prisma.tool.update({
              where: { id: upsertedTool.id },
              data: {
                schemaSource: toolDef.parameters ? 'author' : null,
              },
            });
          }

          // Trigger health check (non-blocking) for execution testing
          performHealthCheck(upsertedTool.id, 'sync').catch((err) => {
            console.error(
              `Health check failed for ${pkg.name}/${toolName} (${upsertedTool.id}):`,
              err
            );
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
