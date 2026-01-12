import { prisma } from '@tpmjs/db';

/**
 * Usage tracking for API keys
 *
 * Tracks individual requests and maintains hourly summaries.
 * All tracking is non-blocking to avoid impacting request latency.
 */

/**
 * Event data for usage tracking
 */
export interface UsageEvent {
  /** API key ID (required for API key auth) */
  apiKeyId?: string;
  /** User ID (required) */
  userId: string;
  /** Request endpoint (e.g., "/api/mcp/user/collection/streamable-http") */
  endpoint: string;
  /** HTTP method */
  method: string;
  /** HTTP status code */
  statusCode: number;
  /** Request latency in milliseconds */
  latencyMs: number;
  /** Resource type (e.g., "mcp", "agent", "bridge", "collection") */
  resourceType?: string;
  /** Resource ID (e.g., collection ID, agent ID) */
  resourceId?: string;
  /** Input tokens (for LLM requests) */
  tokensIn?: number;
  /** Output tokens (for LLM requests) */
  tokensOut?: number;
  /** Model used (for LLM requests) */
  model?: string;
  /** Error code if request failed */
  errorCode?: string;
  /** Error message if request failed */
  errorMessage?: string;
  /** User agent string */
  userAgent?: string | null;
  /** Client IP address */
  ipAddress?: string | null;
}

/**
 * Track API usage (fire and forget - non-blocking)
 *
 * This function returns immediately and tracks usage in the background.
 * Errors are logged but don't affect the calling code.
 *
 * @param event - Usage event data
 *
 * @example
 * trackUsage({
 *   apiKeyId: auth.apiKeyId,
 *   userId: auth.userId,
 *   endpoint: '/api/mcp/...',
 *   method: 'POST',
 *   statusCode: 200,
 *   latencyMs: 150,
 *   resourceType: 'mcp',
 *   resourceId: collectionId,
 * });
 */
export function trackUsage(event: UsageEvent): void {
  // Fire and forget - don't await
  trackUsageAsync(event).catch((error) => {
    console.error('[Usage Tracking] Error tracking usage:', error);
  });
}

/**
 * Async implementation of usage tracking
 */
async function trackUsageAsync(event: UsageEvent): Promise<void> {
  const now = new Date();

  // 1. Create individual record (only if authenticated via API key)
  if (event.apiKeyId) {
    await prisma.apiUsageRecord.create({
      data: {
        apiKeyId: event.apiKeyId,
        endpoint: event.endpoint,
        method: event.method,
        statusCode: event.statusCode,
        latencyMs: event.latencyMs,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        tokensIn: event.tokensIn,
        tokensOut: event.tokensOut,
        model: event.model,
        errorCode: event.errorCode,
        errorMessage: event.errorMessage,
        userAgent: event.userAgent?.substring(0, 500), // Truncate to fit DB column
        ipAddress: event.ipAddress?.substring(0, 45),
      },
    });
  }

  // 2. Update hourly summary (upsert)
  const hourStart = new Date(now);
  hourStart.setMinutes(0, 0, 0);

  const isSuccess = event.statusCode < 400;
  const isError = event.statusCode >= 400;

  // Create a normalized endpoint for summary (remove dynamic segments)
  const normalizedEndpoint = normalizeEndpoint(event.endpoint);

  await prisma.apiUsageSummary.upsert({
    where: {
      userId_apiKeyId_periodType_periodStart: {
        userId: event.userId,
        apiKeyId: event.apiKeyId || '',
        periodType: 'hourly',
        periodStart: hourStart,
      },
    },
    create: {
      userId: event.userId,
      apiKeyId: event.apiKeyId,
      periodType: 'hourly',
      periodStart: hourStart,
      totalRequests: 1,
      successRequests: isSuccess ? 1 : 0,
      errorRequests: isError ? 1 : 0,
      endpointCounts: { [normalizedEndpoint]: 1 },
      totalTokensIn: event.tokensIn || 0,
      totalTokensOut: event.tokensOut || 0,
      avgLatencyMs: event.latencyMs,
    },
    update: {
      totalRequests: { increment: 1 },
      successRequests: { increment: isSuccess ? 1 : 0 },
      errorRequests: { increment: isError ? 1 : 0 },
      totalTokensIn: { increment: event.tokensIn || 0 },
      totalTokensOut: { increment: event.tokensOut || 0 },
      // Note: For proper running average, we'd need to fetch current values
      // For now, we'll update avgLatencyMs via a background job
    },
  });

  // Update endpoint counts separately (JSON increment isn't supported directly)
  // We do this via raw SQL for efficiency
  try {
    await prisma.$executeRaw`
      UPDATE api_usage_summaries
      SET endpoint_counts = jsonb_set(
        COALESCE(endpoint_counts, '{}'::jsonb),
        ${`{${normalizedEndpoint}}`}::text[],
        (COALESCE((endpoint_counts->${normalizedEndpoint})::int, 0) + 1)::text::jsonb
      )
      WHERE user_id = ${event.userId}
        AND COALESCE(api_key_id, '') = ${event.apiKeyId || ''}
        AND period_type = 'hourly'
        AND period_start = ${hourStart}
    `;
  } catch {
    // Ignore JSON update errors - the main counts are still accurate
  }
}

/**
 * Normalize endpoint for aggregation
 *
 * Replaces dynamic segments (IDs, slugs) with placeholders.
 * This groups similar requests together in summaries.
 *
 * @param endpoint - Raw endpoint path
 * @returns Normalized endpoint
 */
function normalizeEndpoint(endpoint: string): string {
  return (
    (endpoint.split('?')[0] ?? endpoint)
      // Replace UUIDs and CUIDs with placeholder
      .replace(/\/[a-z0-9]{20,}/gi, '/:id')
      // Replace numeric IDs
      .replace(/\/\d+/g, '/:id')
      // Limit length
      .substring(0, 100)
  );
}

/**
 * Create a usage tracker wrapper for route handlers
 *
 * This makes it easy to track usage in route handlers.
 *
 * @param userId - User ID
 * @param apiKeyId - Optional API key ID
 * @returns Object with track method and helper functions
 *
 * @example
 * const tracker = createUsageTracker(auth.userId, auth.apiKeyId);
 * tracker.track({
 *   endpoint: '/api/mcp/...',
 *   method: 'POST',
 *   statusCode: 200,
 *   latencyMs: 150,
 * });
 */
export function createUsageTracker(userId: string, apiKeyId?: string) {
  const startTime = Date.now();

  return {
    /**
     * Track a usage event
     */
    track(
      event: Omit<UsageEvent, 'userId' | 'apiKeyId'> & {
        userId?: string;
        apiKeyId?: string;
      }
    ) {
      trackUsage({
        ...event,
        userId: event.userId || userId,
        apiKeyId: event.apiKeyId || apiKeyId,
      });
    },

    /**
     * Track completion with automatic latency calculation
     */
    trackCompletion(
      event: Omit<UsageEvent, 'userId' | 'apiKeyId' | 'latencyMs'> & {
        userId?: string;
        apiKeyId?: string;
        latencyMs?: number;
      }
    ) {
      trackUsage({
        ...event,
        userId: event.userId || userId,
        apiKeyId: event.apiKeyId || apiKeyId,
        latencyMs: event.latencyMs || Date.now() - startTime,
      });
    },

    /**
     * Get elapsed time since tracker creation
     */
    getElapsedMs() {
      return Date.now() - startTime;
    },
  };
}

/**
 * Cleanup old usage records (called by cron job)
 *
 * Deletes individual records older than 30 days.
 * Summaries are kept for longer-term analytics.
 *
 * @param daysToKeep - Number of days to keep records (default 30)
 * @returns Number of records deleted
 */
export async function cleanupOldUsageRecords(daysToKeep = 30): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);

  const result = await prisma.apiUsageRecord.deleteMany({
    where: {
      createdAt: {
        lt: cutoff,
      },
    },
  });

  return result.count;
}
