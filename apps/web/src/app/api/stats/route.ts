import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '~/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/stats
 * Comprehensive statistics about the TPMJS registry
 *
 * Returns complete developer-focused metrics including:
 * - Registry totals (tools, packages, downloads)
 * - Health status distribution
 * - Quality score distribution
 * - Category breakdown
 * - Tier breakdown (minimal vs rich)
 * - Recent activity
 * - Execution statistics
 * - Token usage statistics
 * - Sync operation status
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Check rate limit
  const rateLimitResponse = checkRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // Time boundaries
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Run all aggregations in parallel for performance
    const [
      // Tool counts
      totalTools,
      officialToolCount,
      toolsWithSchema,

      // Health status counts
      healthyImportCount,
      brokenImportCount,
      unknownImportCount,
      healthyExecutionCount,
      brokenExecutionCount,
      unknownExecutionCount,

      // Package data for aggregations
      packages,

      // Recent activity
      toolsLast24h,
      toolsLast7d,
      toolsLast30d,
      packagesLast7d,

      // Simulation statistics
      totalSimulations,
      successfulSimulations,
      failedSimulations,
      simulationsLast24h,
      simulationsLast7d,

      // Execution time stats (successful simulations only)
      executionTimeStats,

      // Token usage aggregates
      tokenUsageStats,

      // Recent sync logs
      recentSyncLogs,

      // Sync checkpoints
      syncCheckpoints,

      // Health check history
      healthChecksLast24h,
      healthChecksLast7d,

      // Quality score distribution
      qualityScoreDistribution,
    ] = await Promise.all([
      // Total tools
      prisma.tool.count(),

      // Official tools
      prisma.tool.count({
        where: { package: { isOfficial: true } },
      }),

      // Tools with extracted schema
      prisma.tool.count({
        where: { schemaSource: 'extracted' },
      }),

      // Health status distribution - Import
      prisma.tool.count({ where: { importHealth: 'HEALTHY' } }),
      prisma.tool.count({ where: { importHealth: 'BROKEN' } }),
      prisma.tool.count({ where: { importHealth: 'UNKNOWN' } }),

      // Health status distribution - Execution
      prisma.tool.count({ where: { executionHealth: 'HEALTHY' } }),
      prisma.tool.count({ where: { executionHealth: 'BROKEN' } }),
      prisma.tool.count({ where: { executionHealth: 'UNKNOWN' } }),

      // Package data for category/tier/download aggregations
      prisma.package.findMany({
        select: {
          category: true,
          tier: true,
          npmDownloadsLastMonth: true,
          githubStars: true,
          isOfficial: true,
          _count: { select: { tools: true } },
        },
      }),

      // Recent tools
      prisma.tool.count({ where: { createdAt: { gte: last24h } } }),
      prisma.tool.count({ where: { createdAt: { gte: last7d } } }),
      prisma.tool.count({ where: { createdAt: { gte: last30d } } }),
      prisma.package.count({ where: { createdAt: { gte: last7d } } }),

      // Simulation counts
      prisma.simulation.count(),
      prisma.simulation.count({ where: { status: 'success' } }),
      prisma.simulation.count({ where: { status: { in: ['error', 'timeout'] } } }),
      prisma.simulation.count({ where: { createdAt: { gte: last24h } } }),
      prisma.simulation.count({ where: { createdAt: { gte: last7d } } }),

      // Execution time statistics (only for successful simulations with timing data)
      prisma.simulation.aggregate({
        where: {
          status: 'success',
          executionTimeMs: { not: null },
        },
        _avg: { executionTimeMs: true },
        _min: { executionTimeMs: true },
        _max: { executionTimeMs: true },
      }),

      // Token usage aggregates
      prisma.tokenUsage.aggregate({
        _sum: {
          inputTokens: true,
          outputTokens: true,
          totalTokens: true,
          estimatedCost: true,
        },
        _avg: {
          totalTokens: true,
          estimatedCost: true,
        },
        _count: true,
      }),

      // Recent sync logs (last 10)
      prisma.syncLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          source: true,
          status: true,
          processed: true,
          skipped: true,
          errors: true,
          createdAt: true,
          metadata: true,
        },
      }),

      // Sync checkpoints
      prisma.syncCheckpoint.findMany({
        select: {
          source: true,
          checkpoint: true,
          updatedAt: true,
        },
      }),

      // Health checks last 24h
      prisma.healthCheck.count({ where: { createdAt: { gte: last24h } } }),
      prisma.healthCheck.count({ where: { createdAt: { gte: last7d } } }),

      // Quality score distribution (buckets)
      prisma.$queryRaw<{ bucket: string; count: bigint }[]>`
        SELECT
          CASE
            WHEN quality_score IS NULL THEN 'unscored'
            WHEN quality_score < 0.3 THEN 'low'
            WHEN quality_score < 0.5 THEN 'medium-low'
            WHEN quality_score < 0.7 THEN 'medium'
            WHEN quality_score < 0.9 THEN 'high'
            ELSE 'excellent'
          END as bucket,
          COUNT(*) as count
        FROM tools
        GROUP BY
          CASE
            WHEN quality_score IS NULL THEN 'unscored'
            WHEN quality_score < 0.3 THEN 'low'
            WHEN quality_score < 0.5 THEN 'medium-low'
            WHEN quality_score < 0.7 THEN 'medium'
            WHEN quality_score < 0.9 THEN 'high'
            ELSE 'excellent'
          END
        ORDER BY
          MIN(CASE
            WHEN quality_score IS NULL THEN 0
            WHEN quality_score < 0.3 THEN 1
            WHEN quality_score < 0.5 THEN 2
            WHEN quality_score < 0.7 THEN 3
            WHEN quality_score < 0.9 THEN 4
            ELSE 5
          END)
      `,
    ]);

    // Aggregate package data
    const categories: Record<string, number> = {};
    const tiers = { minimal: 0, rich: 0 };
    let totalDownloads = 0;
    let totalGithubStars = 0;
    let totalPackages = 0;
    let officialPackages = 0;

    for (const pkg of packages) {
      totalPackages++;

      // Category breakdown (by tool count)
      if (pkg.category) {
        categories[pkg.category] = (categories[pkg.category] || 0) + pkg._count.tools;
      }

      // Tier breakdown (by package count)
      if (pkg.tier === 'minimal') {
        tiers.minimal++;
      } else if (pkg.tier === 'rich') {
        tiers.rich++;
      }

      // Download totals
      totalDownloads += pkg.npmDownloadsLastMonth || 0;
      totalGithubStars += pkg.githubStars || 0;

      if (pkg.isOfficial) {
        officialPackages++;
      }
    }

    // Format quality score distribution
    const qualityDistribution: Record<string, number> = {};
    for (const row of qualityScoreDistribution) {
      qualityDistribution[row.bucket] = Number(row.count);
    }

    // Calculate execution success rate
    const executionSuccessRate =
      totalSimulations > 0 ? ((successfulSimulations / totalSimulations) * 100).toFixed(2) : '0.00';

    // Format sync checkpoint data
    const syncStatus: Record<string, unknown> = {};
    for (const checkpoint of syncCheckpoints) {
      syncStatus[checkpoint.source] = {
        lastRun: checkpoint.updatedAt,
        ...(checkpoint.checkpoint as Record<string, unknown>),
      };
    }

    // Build response
    const processingTime = Date.now() - startTime;

    const response = {
      success: true,
      meta: {
        version: '2.0.0',
        timestamp: now.toISOString(),
        processingTimeMs: processingTime,
      },
      data: {
        // Overview
        overview: {
          totalTools,
          totalPackages,
          officialTools: officialToolCount,
          officialPackages,
          toolsWithExtractedSchema: toolsWithSchema,
          totalNpmDownloads: totalDownloads,
          totalGithubStars,
        },

        // Health status
        health: {
          import: {
            healthy: healthyImportCount,
            broken: brokenImportCount,
            unknown: unknownImportCount,
          },
          execution: {
            healthy: healthyExecutionCount,
            broken: brokenExecutionCount,
            unknown: unknownExecutionCount,
          },
          healthChecksLast24h,
          healthChecksLast7d,
        },

        // Quality distribution
        quality: {
          distribution: qualityDistribution,
        },

        // Category breakdown
        categories,

        // Tier breakdown
        tiers,

        // Recent activity
        recentActivity: {
          toolsAddedLast24h: toolsLast24h,
          toolsAddedLast7d: toolsLast7d,
          toolsAddedLast30d: toolsLast30d,
          packagesAddedLast7d: packagesLast7d,
        },

        // Execution statistics
        executions: {
          total: totalSimulations,
          successful: successfulSimulations,
          failed: failedSimulations,
          successRate: `${executionSuccessRate}%`,
          last24h: simulationsLast24h,
          last7d: simulationsLast7d,
          timing: {
            avgMs: executionTimeStats._avg.executionTimeMs
              ? Math.round(executionTimeStats._avg.executionTimeMs)
              : null,
            minMs: executionTimeStats._min.executionTimeMs,
            maxMs: executionTimeStats._max.executionTimeMs,
          },
        },

        // Token usage
        tokens: {
          totalRecorded: tokenUsageStats._count,
          totals: {
            inputTokens: tokenUsageStats._sum.inputTokens || 0,
            outputTokens: tokenUsageStats._sum.outputTokens || 0,
            totalTokens: tokenUsageStats._sum.totalTokens || 0,
            estimatedCostUsd: tokenUsageStats._sum.estimatedCost
              ? Number(tokenUsageStats._sum.estimatedCost).toFixed(4)
              : '0.0000',
          },
          averages: {
            tokensPerExecution: tokenUsageStats._avg.totalTokens
              ? Math.round(tokenUsageStats._avg.totalTokens)
              : null,
            costPerExecutionUsd: tokenUsageStats._avg.estimatedCost
              ? Number(tokenUsageStats._avg.estimatedCost).toFixed(6)
              : null,
          },
        },

        // Sync status
        sync: {
          status: syncStatus,
          recentOperations: recentSyncLogs.map((log) => ({
            source: log.source,
            status: log.status,
            processed: log.processed,
            skipped: log.skipped,
            errors: log.errors,
            timestamp: log.createdAt,
            durationMs: (log.metadata as Record<string, unknown>)?.durationMs ?? null,
          })),
        },
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'X-Processing-Time': `${processingTime}ms`,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'STATS_ERROR',
          message: 'Failed to fetch registry statistics',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        meta: {
          version: '2.0.0',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
