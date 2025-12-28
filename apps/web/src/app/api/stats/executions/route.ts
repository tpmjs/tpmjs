import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '~/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/stats/executions
 * Detailed execution (simulation) statistics and analytics
 *
 * Returns:
 * - Execution counts and success rates
 * - Performance timing metrics
 * - Token usage analytics
 * - Most executed tools
 * - Execution trends over time
 * - Error analysis
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
    const last1h = new Date(now.getTime() - 60 * 60 * 1000);
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      // Total counts
      totalExecutions,
      successCount,
      errorCount,
      timeoutCount,
      pendingCount,
      runningCount,

      // Time-based counts
      execLast1h,
      execLast24h,
      execLast7d,
      execLast30d,

      // Timing statistics
      timingStats,

      // Token usage aggregates
      tokenStats,

      // Most executed tools
      mostExecutedTools,

      // Recent executions
      recentExecutions,

      // Execution by status (last 24h)
      statusBreakdown24h,

      // Hourly trends (last 24h)
      hourlyTrends,

      // Daily trends (last 7 days)
      dailyTrends,

      // Top errors
      topErrors,

      // Model usage breakdown
      modelUsage,
    ] = await Promise.all([
      // Total counts
      prisma.simulation.count(),
      prisma.simulation.count({ where: { status: 'success' } }),
      prisma.simulation.count({ where: { status: 'error' } }),
      prisma.simulation.count({ where: { status: 'timeout' } }),
      prisma.simulation.count({ where: { status: 'pending' } }),
      prisma.simulation.count({ where: { status: 'running' } }),

      // Time-based counts
      prisma.simulation.count({ where: { createdAt: { gte: last1h } } }),
      prisma.simulation.count({ where: { createdAt: { gte: last24h } } }),
      prisma.simulation.count({ where: { createdAt: { gte: last7d } } }),
      prisma.simulation.count({ where: { createdAt: { gte: last30d } } }),

      // Timing stats for successful executions
      prisma.simulation.aggregate({
        where: {
          status: 'success',
          executionTimeMs: { not: null },
        },
        _avg: { executionTimeMs: true, agentSteps: true },
        _min: { executionTimeMs: true },
        _max: { executionTimeMs: true },
        _count: true,
      }),

      // Token usage stats
      prisma.tokenUsage.aggregate({
        _sum: {
          inputTokens: true,
          outputTokens: true,
          totalTokens: true,
          estimatedCost: true,
        },
        _avg: {
          inputTokens: true,
          outputTokens: true,
          totalTokens: true,
          estimatedCost: true,
        },
        _min: { totalTokens: true },
        _max: { totalTokens: true },
        _count: true,
      }),

      // Most executed tools (top 20)
      prisma.simulation.groupBy({
        by: ['toolId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 20,
      }),

      // Recent executions (last 20)
      prisma.simulation.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          status: true,
          executionTimeMs: true,
          agentSteps: true,
          model: true,
          createdAt: true,
          completedAt: true,
          tool: {
            select: {
              name: true,
              package: { select: { npmPackageName: true } },
            },
          },
          tokenUsage: {
            select: {
              totalTokens: true,
              estimatedCost: true,
            },
          },
        },
      }),

      // Status breakdown last 24h
      prisma.simulation.groupBy({
        by: ['status'],
        where: { createdAt: { gte: last24h } },
        _count: { id: true },
      }),

      // Hourly trends (last 24h)
      prisma.$queryRaw<
        {
          hour: Date;
          total: bigint;
          success: bigint;
          error: bigint;
        }[]
      >`
        SELECT
          DATE_TRUNC('hour', created_at) as hour,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
          SUM(CASE WHEN status IN ('error', 'timeout') THEN 1 ELSE 0 END) as error
        FROM simulations
        WHERE created_at >= ${last24h}
        GROUP BY DATE_TRUNC('hour', created_at)
        ORDER BY hour DESC
      `,

      // Daily trends (last 7 days)
      prisma.$queryRaw<
        {
          date: Date;
          total: bigint;
          success: bigint;
          error: bigint;
          avg_time_ms: number | null;
        }[]
      >`
        SELECT
          DATE(created_at) as date,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
          SUM(CASE WHEN status IN ('error', 'timeout') THEN 1 ELSE 0 END) as error,
          AVG(CASE WHEN status = 'success' THEN execution_time_ms END) as avg_time_ms
        FROM simulations
        WHERE created_at >= ${last7d}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `,

      // Top errors (most common error messages)
      prisma.$queryRaw<{ error: string; count: bigint }[]>`
        SELECT
          SUBSTRING(error, 1, 200) as error,
          COUNT(*) as count
        FROM simulations
        WHERE status IN ('error', 'timeout')
          AND error IS NOT NULL
          AND created_at >= ${last7d}
        GROUP BY SUBSTRING(error, 1, 200)
        ORDER BY count DESC
        LIMIT 10
      `,

      // Model usage breakdown
      prisma.simulation.groupBy({
        by: ['model'],
        where: { model: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
    ]);

    // Get tool details for most executed
    const toolIds = mostExecutedTools.map((t) => t.toolId);
    const toolDetails = await prisma.tool.findMany({
      where: { id: { in: toolIds } },
      select: {
        id: true,
        name: true,
        package: { select: { npmPackageName: true } },
      },
    });
    const toolMap = new Map(toolDetails.map((t) => [t.id, t]));

    // Format most executed tools
    const formattedMostExecuted = mostExecutedTools.map((item) => {
      const tool = toolMap.get(item.toolId);
      return {
        toolId: item.toolId,
        packageName: tool?.package.npmPackageName ?? 'unknown',
        toolName: tool?.name ?? 'unknown',
        executionCount: item._count.id,
      };
    });

    // Calculate success rate
    const completedCount = successCount + errorCount + timeoutCount;
    const successRate =
      completedCount > 0 ? ((successCount / completedCount) * 100).toFixed(2) : '0.00';

    // Format status breakdown
    const statusBreakdownMap: Record<string, number> = {};
    for (const item of statusBreakdown24h) {
      statusBreakdownMap[item.status] = item._count.id;
    }

    // Format hourly trends
    const formattedHourlyTrends = hourlyTrends.map((h) => ({
      hour: h.hour,
      total: Number(h.total),
      success: Number(h.success),
      error: Number(h.error),
      successRate:
        Number(h.total) > 0 ? ((Number(h.success) / Number(h.total)) * 100).toFixed(2) : '0.00',
    }));

    // Format daily trends
    const formattedDailyTrends = dailyTrends.map((d) => ({
      date: d.date,
      total: Number(d.total),
      success: Number(d.success),
      error: Number(d.error),
      avgTimeMs: d.avg_time_ms ? Math.round(d.avg_time_ms) : null,
      successRate:
        Number(d.total) > 0 ? ((Number(d.success) / Number(d.total)) * 100).toFixed(2) : '0.00',
    }));

    // Format recent executions
    const formattedRecentExecutions = recentExecutions.map((exec) => ({
      id: exec.id,
      packageName: exec.tool.package.npmPackageName,
      toolName: exec.tool.name,
      status: exec.status,
      executionTimeMs: exec.executionTimeMs,
      agentSteps: exec.agentSteps,
      model: exec.model,
      tokens: exec.tokenUsage?.totalTokens ?? null,
      costUsd: exec.tokenUsage?.estimatedCost
        ? Number(exec.tokenUsage.estimatedCost).toFixed(6)
        : null,
      createdAt: exec.createdAt,
      completedAt: exec.completedAt,
    }));

    // Format top errors
    const formattedErrors = topErrors.map((e) => ({
      error: e.error,
      count: Number(e.count),
    }));

    // Format model usage
    const formattedModelUsage = modelUsage.map((m) => ({
      model: m.model,
      count: m._count.id,
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
          // Overview
          overview: {
            totalExecutions,
            successRate: `${successRate}%`,
            byStatus: {
              success: successCount,
              error: errorCount,
              timeout: timeoutCount,
              pending: pendingCount,
              running: runningCount,
            },
          },

          // Activity
          activity: {
            last1h: execLast1h,
            last24h: execLast24h,
            last7d: execLast7d,
            last30d: execLast30d,
            statusBreakdown24h: statusBreakdownMap,
          },

          // Performance
          performance: {
            timing: {
              avgMs: timingStats._avg.executionTimeMs
                ? Math.round(timingStats._avg.executionTimeMs)
                : null,
              minMs: timingStats._min.executionTimeMs,
              maxMs: timingStats._max.executionTimeMs,
              sampleSize: timingStats._count,
            },
            avgAgentSteps: timingStats._avg.agentSteps
              ? Number(timingStats._avg.agentSteps.toFixed(2))
              : null,
          },

          // Token usage
          tokens: {
            totalRecorded: tokenStats._count,
            totals: {
              inputTokens: tokenStats._sum.inputTokens || 0,
              outputTokens: tokenStats._sum.outputTokens || 0,
              totalTokens: tokenStats._sum.totalTokens || 0,
              estimatedCostUsd: tokenStats._sum.estimatedCost
                ? Number(tokenStats._sum.estimatedCost).toFixed(4)
                : '0.0000',
            },
            averages: {
              inputTokens: tokenStats._avg.inputTokens
                ? Math.round(tokenStats._avg.inputTokens)
                : null,
              outputTokens: tokenStats._avg.outputTokens
                ? Math.round(tokenStats._avg.outputTokens)
                : null,
              totalTokens: tokenStats._avg.totalTokens
                ? Math.round(tokenStats._avg.totalTokens)
                : null,
              costUsd: tokenStats._avg.estimatedCost
                ? Number(tokenStats._avg.estimatedCost).toFixed(6)
                : null,
            },
            range: {
              minTokens: tokenStats._min.totalTokens,
              maxTokens: tokenStats._max.totalTokens,
            },
          },

          // Model usage
          modelUsage: formattedModelUsage,

          // Trends
          trends: {
            hourly: formattedHourlyTrends,
            daily: formattedDailyTrends,
          },

          // Top tools
          topTools: formattedMostExecuted,

          // Recent executions
          recentExecutions: formattedRecentExecutions,

          // Error analysis
          errors: {
            totalErrors: errorCount + timeoutCount,
            topErrors: formattedErrors,
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
    console.error('Error fetching execution stats:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'EXECUTION_STATS_ERROR',
          message: 'Failed to fetch execution statistics',
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
