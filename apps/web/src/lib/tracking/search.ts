import { prisma } from '@tpmjs/db';

export interface TrackSearchParams {
  query: string;
  resultCount: number;
  latencyMs: number;
  userId?: string;
  sessionId?: string;
}

/**
 * Track a search query (fire-and-forget pattern).
 * Never throws - failures are logged but don't break the main operation.
 */
export function trackSearch(params: TrackSearchParams): void {
  prisma.searchLog
    .create({
      data: {
        query: params.query.substring(0, 500),
        resultCount: params.resultCount,
        latencyMs: params.latencyMs,
        userId: params.userId,
        sessionId: params.sessionId,
      },
    })
    .catch((error) => {
      console.error('[trackSearch] Failed to record search event:', error);
    });
}

/**
 * Clean up old search logs.
 * Intended to be called from a cron job.
 */
export async function cleanupOldSearchLogs(daysToKeep = 90): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);

  const result = await prisma.searchLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  return result.count;
}
