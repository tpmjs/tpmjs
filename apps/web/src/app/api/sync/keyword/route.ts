import { prisma } from '@tpmjs/db';
import { fetchLatestPackageWithMetadata, searchByKeyword } from '@tpmjs/npm-client';
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
 * POST /api/sync/keyword
 * Sync tools by searching NPM for 'tpmjs' keyword
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
    // Search for packages with 'tpmjs' keyword
    const searchResults = await searchByKeyword({
      keyword: 'tpmjs',
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
            isOfficial: pkg.keywords?.includes('tpmjs') || false,
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
            isOfficial: pkg.keywords?.includes('tpmjs') || false,
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
                parameters: undefined,
                returns: undefined,
                aiAgent: undefined,
              }));
            toolDiscoverySource = 'auto';
            console.log(
              `Auto-discovered ${toolsToProcess.length} tools for ${pkg.name}: ${toolsToProcess.map((t) => t.name).join(', ')}`
            );
          } else {
            console.log(`Failed to auto-discover tools for ${pkg.name}: ${exportsResult.error}`);
            // Skip this package if we can't discover tools
            skipped++;
            skippedPackages.push({
              name: pkg.name,
              author: authorName,
              reason: `auto-discovery failed: ${exportsResult.error}`,
            });
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
