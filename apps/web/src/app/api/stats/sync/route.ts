import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '~/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/stats/sync
 * Sync operation statistics and status
 *
 * Returns:
 * - Current checkpoint status for each sync source
 * - Recent sync operations with success/failure rates
 * - Sync timing statistics
 * - Error analysis for failed syncs
 * - NPM changes feed pending count
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
      // Checkpoints
      checkpoints,

      // Recent logs by source
      changesFeedLogs,
      keywordLogs,
      metricsLogs,

      // Total counts
      totalSyncs,
      successfulSyncs,
      failedSyncs,
      partialSyncs,

      // Counts by time period
      syncsLast24h,
      syncsLast7d,

      // Aggregate stats
      aggregateStats,

      // Sync logs for error analysis
      errorLogs,
    ] = await Promise.all([
      // Get all checkpoints
      prisma.syncCheckpoint.findMany(),

      // Recent changes-feed logs
      prisma.syncLog.findMany({
        where: { source: 'changes-feed' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),

      // Recent keyword search logs
      prisma.syncLog.findMany({
        where: { source: 'keyword-search' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),

      // Recent metrics logs
      prisma.syncLog.findMany({
        where: { source: 'metrics' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),

      // Total sync counts
      prisma.syncLog.count(),
      prisma.syncLog.count({ where: { status: 'success' } }),
      prisma.syncLog.count({ where: { status: 'error' } }),
      prisma.syncLog.count({ where: { status: 'partial' } }),

      // Time-based counts
      prisma.syncLog.count({ where: { createdAt: { gte: last24h } } }),
      prisma.syncLog.count({ where: { createdAt: { gte: last7d } } }),

      // Aggregate processing stats
      prisma.syncLog.aggregate({
        _sum: {
          processed: true,
          skipped: true,
          errors: true,
        },
        _avg: {
          processed: true,
        },
      }),

      // Recent error logs for analysis
      prisma.syncLog.findMany({
        where: {
          OR: [{ status: 'error' }, { status: 'partial' }],
          createdAt: { gte: last7d },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          source: true,
          status: true,
          message: true,
          errors: true,
          createdAt: true,
          metadata: true,
        },
      }),
    ]);

    // Format checkpoints
    const checkpointStatus: Record<string, unknown> = {};
    for (const checkpoint of checkpoints) {
      const data = checkpoint.checkpoint as Record<string, unknown>;
      checkpointStatus[checkpoint.source] = {
        lastUpdated: checkpoint.updatedAt,
        ...data,
      };
    }

    // Helper to format sync logs
    const formatSyncLogs = (logs: typeof changesFeedLogs) =>
      logs.map((log) => ({
        status: log.status,
        processed: log.processed,
        skipped: log.skipped,
        errors: log.errors,
        message: log.message,
        timestamp: log.createdAt,
        durationMs: (log.metadata as Record<string, unknown>)?.durationMs ?? null,
        metadata: log.metadata,
      }));

    // Calculate success rate
    const completedSyncs = successfulSyncs + failedSyncs + partialSyncs;
    const successRate =
      completedSyncs > 0 ? ((successfulSyncs / completedSyncs) * 100).toFixed(2) : '0.00';

    // Calculate average duration from recent logs
    const allRecentLogs = [...changesFeedLogs, ...keywordLogs, ...metricsLogs];
    const durations = allRecentLogs
      .map((log) => (log.metadata as Record<string, unknown>)?.durationMs)
      .filter((d): d is number => typeof d === 'number');
    const avgDuration =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : null;

    // Format error logs
    const formattedErrors = errorLogs.map((log) => ({
      source: log.source,
      status: log.status,
      message: log.message,
      errorCount: log.errors,
      timestamp: log.createdAt,
    }));

    // Sync frequency (operations per day last 7 days)
    const syncsPerDay = syncsLast7d > 0 ? (syncsLast7d / 7).toFixed(2) : '0.00';

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
          checkpoints: checkpointStatus,

          // Overview
          overview: {
            totalOperations: totalSyncs,
            successRate: `${successRate}%`,
            byStatus: {
              success: successfulSyncs,
              error: failedSyncs,
              partial: partialSyncs,
            },
            last24h: syncsLast24h,
            last7d: syncsLast7d,
            avgOperationsPerDay: syncsPerDay,
          },

          // Processing statistics
          processing: {
            totalProcessed: aggregateStats._sum.processed || 0,
            totalSkipped: aggregateStats._sum.skipped || 0,
            totalErrors: aggregateStats._sum.errors || 0,
            avgProcessedPerOperation: aggregateStats._avg.processed
              ? Math.round(aggregateStats._avg.processed)
              : null,
          },

          // Timing
          timing: {
            avgDurationMs: avgDuration,
          },

          // By source
          bySource: {
            'changes-feed': {
              recentOperations: formatSyncLogs(changesFeedLogs),
              lastRun: changesFeedLogs[0]?.createdAt ?? null,
              checkpoint: checkpointStatus['changes-feed'] ?? null,
            },
            'keyword-search': {
              recentOperations: formatSyncLogs(keywordLogs),
              lastRun: keywordLogs[0]?.createdAt ?? null,
              checkpoint: checkpointStatus['keyword-search'] ?? null,
            },
            metrics: {
              recentOperations: formatSyncLogs(metricsLogs),
              lastRun: metricsLogs[0]?.createdAt ?? null,
              checkpoint: checkpointStatus.metrics ?? null,
            },
          },

          // Recent errors
          recentErrors: formattedErrors,
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
    console.error('Error fetching sync stats:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SYNC_STATS_ERROR',
          message: 'Failed to fetch sync statistics',
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
