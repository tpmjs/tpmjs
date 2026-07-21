import type { UserTier } from '@prisma/client';
import { RATE_LIMITS_BY_TIER } from './index';

/**
 * Rate limiting for API keys in the self-hosted web process.
 *
 * Each API key has a rate limit based on the user's tier.
 * Limits are enforced per hour (rolling window).
 */

// Production runs one web process, so this bounded store is shared by every
// API route without depending on a remote platform service.
const memoryStore = new Map<string, { count: number; windowStart: number }>();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const MAX_STORE_SIZE = 10000;
let lastCleanup = Date.now();

/**
 * Result of a rate limit check
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Remaining requests in the current window */
  remaining: number;
  /** When the rate limit resets (window end) */
  resetAt: Date;
  /** Total limit for the window */
  limit: number;
  /** Current request count in window */
  current: number;
}

/**
 * Get the hourly window start time (aligned to clock hour)
 */
function getHourlyWindowStart(): number {
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  return Math.floor(now / hourMs) * hourMs;
}

/**
 * Check the rate limit for an API key.
 *
 * @param identifier - API key ID or user ID (for session auth)
 * @param tier - User's tier for determining rate limit
 * @param customLimit - Optional custom limit (overrides tier default)
 * @returns RateLimitResult with allowed status and metadata
 *
 * @example
 * const result = await checkApiKeyRateLimit(apiKeyId, 'FREE');
 * if (!result.allowed) {
 *   return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 });
 * }
 */
export async function checkApiKeyRateLimit(
  identifier: string,
  tier: UserTier,
  customLimit?: number | null
): Promise<RateLimitResult> {
  const limit = customLimit ?? RATE_LIMITS_BY_TIER[tier];
  const windowMs = 60 * 60 * 1000; // 1 hour
  const windowStart = getHourlyWindowStart();
  const windowEnd = windowStart + windowMs;
  const resetAt = new Date(windowEnd);

  const key = `apikey:ratelimit:${identifier}:${windowStart}`;

  return checkRateLimitMemory(key, limit, windowStart, resetAt);
}

/**
 * Check rate limit using in-memory store (fallback)
 */
function checkRateLimitMemory(
  key: string,
  limit: number,
  windowStart: number,
  resetAt: Date
): RateLimitResult {
  let entry = memoryStore.get(key);

  // Reset if window has changed
  if (!entry || entry.windowStart !== windowStart) {
    entry = { count: 0, windowStart };
    memoryStore.set(key, entry);
  }

  // Increment count
  entry.count++;

  const remaining = Math.max(0, limit - entry.count);
  const allowed = entry.count <= limit;

  const now = Date.now();
  if (now - lastCleanup >= CLEANUP_INTERVAL_MS || memoryStore.size > MAX_STORE_SIZE) {
    cleanupMemoryStore(windowStart);
    lastCleanup = now;
  }

  return {
    allowed,
    remaining,
    resetAt,
    limit,
    current: entry.count,
  };
}

/**
 * Cleanup old entries from memory store
 */
function cleanupMemoryStore(currentWindowStart: number): void {
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.windowStart < currentWindowStart) {
      memoryStore.delete(key);
    }
  }

  // Map iteration order is insertion order, so evict the oldest active keys
  // deterministically if a single clock-hour receives unusually high churn.
  const overflow = memoryStore.size - MAX_STORE_SIZE;
  if (overflow > 0) {
    const keys = memoryStore.keys();
    for (let index = 0; index < overflow; index++) {
      const oldest = keys.next().value;
      if (oldest === undefined) break;
      memoryStore.delete(oldest);
    }
  }
}

/**
 * Get rate limit headers for a response
 *
 * @param result - Rate limit result
 * @returns Headers object to add to response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt.getTime() / 1000).toString(),
  };
}

/**
 * Create a rate limited response (429)
 *
 * @param result - Rate limit result
 * @returns Response with 429 status and rate limit headers
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  const retryAfterSeconds = Math.ceil((result.resetAt.getTime() - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: `Too many requests. Please try again in ${retryAfterSeconds} seconds.`,
      retryAfter: retryAfterSeconds,
      limit: result.limit,
      remaining: 0,
      resetAt: result.resetAt.toISOString(),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfterSeconds.toString(),
        ...getRateLimitHeaders(result),
      },
    }
  );
}
