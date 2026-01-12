import type { UserTier } from '@prisma/client';
import { kv } from '@vercel/kv';
import { RATE_LIMITS_BY_TIER } from './index';

/**
 * Rate limiting for API keys using Vercel KV
 *
 * Each API key has a rate limit based on the user's tier.
 * Limits are enforced per hour (rolling window).
 */

// Check if Vercel KV is available
const isKVAvailable = !!process.env.KV_REST_API_URL;

// In-memory fallback for development
const memoryStore = new Map<string, { count: number; windowStart: number }>();

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
 * Check rate limit for an API key using Vercel KV
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

  if (isKVAvailable) {
    return checkRateLimitKV(key, limit, windowMs, resetAt);
  }

  return checkRateLimitMemory(key, limit, windowStart, resetAt);
}

/**
 * Check rate limit using Vercel KV (distributed)
 */
async function checkRateLimitKV(
  key: string,
  limit: number,
  windowMs: number,
  resetAt: Date
): Promise<RateLimitResult> {
  try {
    // Increment counter atomically
    const current = await kv.incr(key);

    // Set expiry on first request in window
    if (current === 1) {
      await kv.expire(key, Math.ceil(windowMs / 1000) + 60); // Add 60s buffer
    }

    const remaining = Math.max(0, limit - current);
    const allowed = current <= limit;

    return {
      allowed,
      remaining,
      resetAt,
      limit,
      current,
    };
  } catch (error) {
    console.error('[API Key Rate Limit] KV error:', error);
    // On error, allow the request but log the issue
    return {
      allowed: true,
      remaining: limit,
      resetAt,
      limit,
      current: 0,
    };
  }
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

  // Cleanup old entries periodically
  if (Math.random() < 0.01) {
    // 1% chance per request
    cleanupMemoryStore(windowStart);
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
