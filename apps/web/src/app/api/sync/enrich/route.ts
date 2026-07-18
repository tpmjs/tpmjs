import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireCronAuth } from '~/lib/cron-auth';
import { extractSignature } from '~/lib/enrichment/signature-extractor';
import { extractTags } from '~/lib/enrichment/tag-extractor';
import { performHealthCheck } from '~/lib/health-check/health-check-service';
import {
  convertJsonSchemaToParameters,
  extractToolSchema,
  listToolExports,
} from '~/lib/schema-extraction';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const TIME_BUDGET_MS = 45_000; // Stop starting new work after 45s (leaves 15s buffer)
const RETRY_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour before retrying failed extractions

/**
 * POST /api/sync/enrich
 * Enrichment queue processor: extracts schemas and runs health checks for tools
 * that haven't been enriched yet. Also handles auto-discovery for packages with no tools.
 *
 * Called by Vercel Cron (every 2 minutes) or GitHub Actions.
 * Requires Authorization: Bearer <CRON_SECRET>
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex but straightforward queue processing
export async function POST(request: NextRequest) {
  const unauthorized = requireCronAuth(request);
  if (unauthorized) return unauthorized;

  const startTime = Date.now();
  let enriched = 0;
  let discovered = 0;
  let errors = 0;
  let skipped = 0;
  const errorMessages: string[] = [];

  try {
    const now = new Date();
    const retryCutoff = new Date(now.getTime() - RETRY_COOLDOWN_MS);

    // Phase 1: Auto-discover tools for packages that have 0 tools.
    // Failures are tracked per-package with exponential backoff (1h doubling,
    // capped at 7 days) so permanently-broken packages can't pin the head of
    // the queue and starve everything behind them.
    const discoveryCandidates = await prisma.package.findMany({
      where: {
        tools: { none: {} },
      },
      orderBy: { toolDiscoveryAttemptAt: { sort: 'asc', nulls: 'first' } },
      take: 25,
    });

    const MAX_DISCOVERY_BACKOFF_MS = 7 * 24 * 60 * 60 * 1000;
    const packagesNeedingDiscovery = discoveryCandidates
      .filter((pkg) => {
        if (!pkg.toolDiscoveryAttemptAt) return true;
        const backoff = Math.min(
          RETRY_COOLDOWN_MS * 2 ** Math.max(0, pkg.toolDiscoveryFailures - 1),
          MAX_DISCOVERY_BACKOFF_MS
        );
        return now.getTime() - pkg.toolDiscoveryAttemptAt.getTime() > backoff;
      })
      .slice(0, 5);

    for (const pkg of packagesNeedingDiscovery) {
      if (Date.now() - startTime > TIME_BUDGET_MS) {
        console.log('Time budget exceeded during auto-discovery phase, stopping');
        break;
      }

      try {
        // Mark attempt time before starting (prevents concurrent processing)
        await prisma.package.update({
          where: { id: pkg.id },
          data: { toolDiscoveryAttemptAt: new Date() },
        });

        console.log(`Auto-discovering tools for ${pkg.npmPackageName}...`);
        const exportsResult = await listToolExports(
          pkg.npmPackageName,
          pkg.npmVersion,
          pkg.env as Record<string, unknown> | null
        );

        if (!exportsResult.success) {
          console.log(
            `Failed to auto-discover tools for ${pkg.npmPackageName}: ${exportsResult.error}`
          );
          await prisma.package.update({
            where: { id: pkg.id },
            data: {
              toolDiscoveryFailures: { increment: 1 },
              toolDiscoveryError: exportsResult.error?.slice(0, 1000) ?? 'Unknown error',
            },
          });
          errors++;
          errorMessages.push(
            `Auto-discovery failed for ${pkg.npmPackageName}: ${exportsResult.error}`
          );
          continue;
        }

        const validTools = exportsResult.tools.filter((t) => t.isValidTool);

        for (const tool of validTools) {
          await prisma.tool.upsert({
            where: {
              packageId_name: {
                packageId: pkg.id,
                name: tool.name,
              },
            },
            create: {
              packageId: pkg.id,
              name: tool.name,
              description: tool.description || 'No description provided',
              qualityScore: null,
              schemaSource: null,
              toolDiscoverySource: 'auto',
            },
            update: {
              description: tool.description || undefined,
              toolDiscoverySource: 'auto',
            },
          });
        }

        console.log(
          `Auto-discovered ${validTools.length} tools for ${pkg.npmPackageName}: ${validTools.map((t) => t.name).join(', ')}`
        );
        await prisma.package.update({
          where: { id: pkg.id },
          data: { toolDiscoveryFailures: 0, toolDiscoveryError: null },
        });
        discovered++;
      } catch (error) {
        errors++;
        const errorMsg = `Auto-discovery error for ${pkg.npmPackageName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errorMessages.push(errorMsg);
        console.error(errorMsg);
        await prisma.package
          .update({
            where: { id: pkg.id },
            data: {
              toolDiscoveryFailures: { increment: 1 },
              toolDiscoveryError: errorMsg.slice(0, 1000),
            },
          })
          .catch(() => {
            // best-effort failure bookkeeping
          });
      }
    }

    // Phase 2: Enrich tools that need schema extraction
    const toolsToEnrich = await prisma.tool.findMany({
      where: {
        schemaSource: null,
        OR: [
          { schemaExtractionAttemptAt: null },
          { schemaExtractionAttemptAt: { lt: retryCutoff } },
        ],
      },
      include: { package: true },
      take: 10, // Fetch a few more than we'll likely process
      orderBy: { createdAt: 'asc' }, // Oldest first
    });

    for (const tool of toolsToEnrich) {
      if (Date.now() - startTime > TIME_BUDGET_MS) {
        console.log('Time budget exceeded during enrichment phase, stopping');
        skipped += toolsToEnrich.length - enriched;
        break;
      }

      try {
        // Mark attempt time before starting (prevents concurrent processing)
        await prisma.tool.update({
          where: { id: tool.id },
          data: { schemaExtractionAttemptAt: now },
        });

        console.log(`Extracting schema for ${tool.package.npmPackageName}/${tool.name}...`);

        const schemaResult = await extractToolSchema(
          tool.package.npmPackageName,
          tool.name,
          tool.package.npmVersion,
          tool.package.env as Record<string, unknown> | null
        );

        if (schemaResult.success) {
          // Extract enriched metadata
          const effectiveDescription =
            tool.description === 'No description provided' && schemaResult.description
              ? schemaResult.description
              : tool.description;
          const tags = extractTags({
            name: tool.name,
            description: effectiveDescription,
            package: {
              npmKeywords: tool.package.npmKeywords,
              category: tool.package.category,
              npmPackageName: tool.package.npmPackageName,
            },
          });
          const signature = extractSignature(schemaResult.inputSchema);

          await prisma.tool.update({
            where: { id: tool.id },
            data: {
              // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility workaround
              inputSchema: schemaResult.inputSchema as any,
              // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility workaround
              parameters: convertJsonSchemaToParameters(schemaResult.inputSchema) as any,
              schemaSource: 'extracted',
              schemaExtractedAt: new Date(),
              schemaExtractionError: null,
              tags,
              ...(signature && { signature }),
              // Update description if not already set meaningfully
              ...(tool.description === 'No description provided' && schemaResult.description
                ? { description: schemaResult.description }
                : {}),
            },
          });
          console.log(`Schema extracted for ${tool.package.npmPackageName}/${tool.name}`);

          // Trigger health check after successful extraction
          performHealthCheck(tool.id, 'enrich').catch((err) => {
            console.error(
              `Health check failed for ${tool.package.npmPackageName}/${tool.name}:`,
              err
            );
          });

          enriched++;
        } else {
          await prisma.tool.update({
            where: { id: tool.id },
            data: {
              schemaExtractionError: schemaResult.error,
            },
          });
          console.log(
            `Schema extraction failed for ${tool.package.npmPackageName}/${tool.name}: ${schemaResult.error}`
          );
          errors++;
          errorMessages.push(`${tool.package.npmPackageName}/${tool.name}: ${schemaResult.error}`);
        }
      } catch (error) {
        errors++;
        const errorMsg = `${tool.package.npmPackageName}/${tool.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errorMessages.push(errorMsg);
        console.error(`Enrichment error: ${errorMsg}`);
      }
    }

    // Log sync operation
    // Phase: Backfill tags for tools with extracted schema but no tags
    let tagsBackfilled = 0;
    if (Date.now() - startTime < TIME_BUDGET_MS) {
      const toolsNeedingTags = await prisma.tool.findMany({
        where: {
          schemaSource: 'extracted',
          tags: { isEmpty: true },
        },
        include: { package: true },
        take: 20,
      });

      const tagUpdates = [];
      for (const tool of toolsNeedingTags) {
        if (Date.now() - startTime >= TIME_BUDGET_MS) break;
        const tags = extractTags({
          name: tool.name,
          description: tool.description,
          package: {
            npmKeywords: tool.package.npmKeywords,
            category: tool.package.category,
            npmPackageName: tool.package.npmPackageName,
          },
        });
        const signature = tool.signature || extractSignature(tool.inputSchema) || undefined;
        tagUpdates.push(
          prisma.tool.update({
            where: { id: tool.id },
            data: { tags, ...(signature && { signature }) },
          })
        );
        tagsBackfilled++;
      }
      if (tagUpdates.length > 0) {
        await prisma.$transaction(tagUpdates);
      }
    }

    await prisma.syncLog.create({
      data: {
        source: 'enrichment',
        status: errors > 0 ? 'partial' : 'success',
        processed: enriched + discovered,
        skipped,
        errors,
        message:
          errors > 0
            ? `Enriched ${enriched} tools, discovered ${discovered} packages. Errors: ${errorMessages.slice(0, 3).join('; ')}`
            : `Enriched ${enriched} tools, discovered ${discovered} packages`,
        metadata: {
          durationMs: Date.now() - startTime,
          enriched,
          discovered,
          toolsInQueue: toolsToEnrich.length,
          packagesNeedingDiscovery: packagesNeedingDiscovery.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        enriched,
        discovered,
        skipped,
        errors,
        durationMs: Date.now() - startTime,
        errorMessages: errorMessages.slice(0, 5),
        tagsBackfilled,
      },
    });
  } catch (error) {
    console.error('Enrichment sync failed:', error);

    await prisma.syncLog.create({
      data: {
        source: 'enrichment',
        status: 'error',
        processed: enriched + discovered,
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
        error: 'Enrichment failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
