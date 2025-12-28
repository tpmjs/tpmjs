import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '~/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/stats/health
 * Detailed health check statistics and analytics
 *
 * Returns:
 * - Current health status distribution
 * - Health check history and trends
 * - Broken tools with error details
 * - Health check timing statistics
 * - Health check coverage metrics
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Check rate limit
  const rateLimitResponse = checkRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      // Current status distribution
      totalTools,
      importHealthy,
      importBroken,
      importUnknown,
      executionHealthy,
      executionBroken,
      executionUnknown,

      // Tools never checked
      neverChecked,

      // Health check history
      checksLast24h,
      checksLast7d,
      totalChecks,

      // Check type breakdown
      importChecks,
      executionChecks,
      fullChecks,

      // Recent health check results
      recentChecks,

      // Broken tools with details
      brokenTools,

      // Health check timing stats
      checkTimingStats,

      // Daily health check trends (last 7 days)
      dailyTrends,
    ] = await Promise.all([
      // Total tools
      prisma.tool.count(),

      // Import health distribution
      prisma.tool.count({ where: { importHealth: 'HEALTHY' } }),
      prisma.tool.count({ where: { importHealth: 'BROKEN' } }),
      prisma.tool.count({ where: { importHealth: 'UNKNOWN' } }),

      // Execution health distribution
      prisma.tool.count({ where: { executionHealth: 'HEALTHY' } }),
      prisma.tool.count({ where: { executionHealth: 'BROKEN' } }),
      prisma.tool.count({ where: { executionHealth: 'UNKNOWN' } }),

      // Never checked tools
      prisma.tool.count({ where: { lastHealthCheck: null } }),

      // Health check counts
      prisma.healthCheck.count({ where: { createdAt: { gte: last24h } } }),
      prisma.healthCheck.count({ where: { createdAt: { gte: last7d } } }),
      prisma.healthCheck.count(),

      // Check types
      prisma.healthCheck.count({ where: { checkType: 'IMPORT' } }),
      prisma.healthCheck.count({ where: { checkType: 'EXECUTION' } }),
      prisma.healthCheck.count({ where: { checkType: 'FULL' } }),

      // Recent checks (last 20)
      prisma.healthCheck.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          checkType: true,
          triggerSource: true,
          importStatus: true,
          executionStatus: true,
          overallStatus: true,
          importTimeMs: true,
          executionTimeMs: true,
          createdAt: true,
          tool: {
            select: {
              name: true,
              package: {
                select: { npmPackageName: true },
              },
            },
          },
        },
      }),

      // Broken tools with error details
      prisma.tool.findMany({
        where: {
          OR: [{ importHealth: 'BROKEN' }, { executionHealth: 'BROKEN' }],
        },
        select: {
          id: true,
          name: true,
          importHealth: true,
          executionHealth: true,
          healthCheckError: true,
          lastHealthCheck: true,
          package: {
            select: { npmPackageName: true },
          },
        },
        orderBy: { lastHealthCheck: 'desc' },
        take: 50,
      }),

      // Timing statistics
      prisma.healthCheck.aggregate({
        _avg: {
          importTimeMs: true,
          executionTimeMs: true,
        },
        _min: {
          importTimeMs: true,
          executionTimeMs: true,
        },
        _max: {
          importTimeMs: true,
          executionTimeMs: true,
        },
      }),

      // Daily trends (raw SQL for date grouping)
      prisma.$queryRaw<
        {
          date: Date;
          total: bigint;
          healthy: bigint;
          broken: bigint;
        }[]
      >`
        SELECT
          DATE(created_at) as date,
          COUNT(*) as total,
          SUM(CASE WHEN overall_status = 'HEALTHY' THEN 1 ELSE 0 END) as healthy,
          SUM(CASE WHEN overall_status = 'BROKEN' THEN 1 ELSE 0 END) as broken
        FROM health_checks
        WHERE created_at >= ${last7d}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `,
    ]);

    // Calculate coverage percentage
    const checkedTools = totalTools - neverChecked;
    const coveragePercent =
      totalTools > 0 ? ((checkedTools / totalTools) * 100).toFixed(2) : '0.00';

    // Calculate health rates
    const importHealthRate =
      totalTools > 0 ? ((importHealthy / totalTools) * 100).toFixed(2) : '0.00';
    const executionHealthRate =
      totalTools > 0 ? ((executionHealthy / totalTools) * 100).toFixed(2) : '0.00';

    // Format broken tools
    const formattedBrokenTools = brokenTools.map((tool) => ({
      id: tool.id,
      packageName: tool.package.npmPackageName,
      toolName: tool.name,
      importHealth: tool.importHealth,
      executionHealth: tool.executionHealth,
      error: tool.healthCheckError,
      lastChecked: tool.lastHealthCheck,
    }));

    // Format recent checks
    const formattedRecentChecks = recentChecks.map((check) => ({
      id: check.id,
      packageName: check.tool.package.npmPackageName,
      toolName: check.tool.name,
      checkType: check.checkType,
      triggerSource: check.triggerSource,
      importStatus: check.importStatus,
      executionStatus: check.executionStatus,
      overallStatus: check.overallStatus,
      importTimeMs: check.importTimeMs,
      executionTimeMs: check.executionTimeMs,
      timestamp: check.createdAt,
    }));

    // Format daily trends
    const formattedTrends = dailyTrends.map((day) => ({
      date: day.date,
      total: Number(day.total),
      healthy: Number(day.healthy),
      broken: Number(day.broken),
      healthRate:
        Number(day.total) > 0
          ? ((Number(day.healthy) / Number(day.total)) * 100).toFixed(2)
          : '0.00',
    }));

    const processingTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        meta: {
          version: '1.0.0',
          timestamp: now.toISOString(),
          processingTimeMs: processingTime,
        },
        data: {
          // Current status
          currentStatus: {
            totalTools,
            import: {
              healthy: importHealthy,
              broken: importBroken,
              unknown: importUnknown,
              healthRate: `${importHealthRate}%`,
            },
            execution: {
              healthy: executionHealthy,
              broken: executionBroken,
              unknown: executionUnknown,
              healthRate: `${executionHealthRate}%`,
            },
          },

          // Coverage metrics
          coverage: {
            checkedTools,
            neverChecked,
            coveragePercent: `${coveragePercent}%`,
          },

          // Check history
          checkHistory: {
            totalChecks,
            last24h: checksLast24h,
            last7d: checksLast7d,
            byType: {
              import: importChecks,
              execution: executionChecks,
              full: fullChecks,
            },
          },

          // Timing statistics
          timing: {
            import: {
              avgMs: checkTimingStats._avg.importTimeMs
                ? Math.round(checkTimingStats._avg.importTimeMs)
                : null,
              minMs: checkTimingStats._min.importTimeMs,
              maxMs: checkTimingStats._max.importTimeMs,
            },
            execution: {
              avgMs: checkTimingStats._avg.executionTimeMs
                ? Math.round(checkTimingStats._avg.executionTimeMs)
                : null,
              minMs: checkTimingStats._min.executionTimeMs,
              maxMs: checkTimingStats._max.executionTimeMs,
            },
          },

          // Daily trends
          dailyTrends: formattedTrends,

          // Recent checks
          recentChecks: formattedRecentChecks,

          // Broken tools
          brokenTools: {
            count: brokenTools.length,
            tools: formattedBrokenTools,
          },
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          'X-Processing-Time': `${processingTime}ms`,
        },
      }
    );
  } catch (error) {
    console.error('Error fetching health stats:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'HEALTH_STATS_ERROR',
          message: 'Failed to fetch health statistics',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        meta: {
          version: '1.0.0',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
