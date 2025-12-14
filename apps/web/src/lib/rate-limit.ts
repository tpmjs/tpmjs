import { type NextRequest, NextResponse } from 'next/server';
import { env } from '~/env';

/**
 * Simple in-memory rate limiter using sliding window
 *
 * Note: This is suitable for moderate traffic. For high-traffic production,
 * consider using a distributed solution like Upstash Redis or Vercel KV.
 */

interface RateLimitEntry {
  timestamps: number[];
}

// Store rate limit data in memory (per serverless instance)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup interval to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_STORE_SIZE = 10000; // Prevent unbounded growth

let lastCleanup = Date.now();

/**
 * Clean up old entries from the rate limit store
 */
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  const cutoff = now - 60 * 1000; // Remove entries older than 1 minute
  let removedCount = 0;

  for (const [key, entry] of rateLimitStore.entries()) {
    entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);
    if (entry.timestamps.length === 0) {
      rateLimitStore.delete(key);
      removedCount++;
    }
  }

  // If store is still too large, remove oldest entries
  if (rateLimitStore.size > MAX_STORE_SIZE) {
    const entries = Array.from(rateLimitStore.entries());
    entries.sort((a, b) => {
      const aLatest = Math.max(...a[1].timestamps);
      const bLatest = Math.max(...b[1].timestamps);
      return aLatest - bLatest;
    });

    const toRemove = entries.slice(0, Math.floor(MAX_STORE_SIZE * 0.2));
    for (const [key] of toRemove) {
      rateLimitStore.delete(key);
      removedCount++;
    }
  }

  lastCleanup = now;
  if (removedCount > 0) {
    console.log(`[Rate Limit] Cleaned up ${removedCount} entries`);
  }
}

/**
 * Get client identifier from request (IP address)
 */
function getClientId(request: NextRequest): string {
  // Try to get real IP from headers (Vercel sets these)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  if (realIp) {
    return realIp;
  }

  // Fallback to connection info (less reliable in serverless)
  return 'unknown';
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /**
   * Maximum requests allowed in the window
   */
  limit: number;

  /**
   * Time window in seconds
   */
  windowSeconds: number;
}

/**
 * Default rate limit: 100 requests per minute
 */
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  limit: 100,
  windowSeconds: 60,
};

/**
 * Strict rate limit for expensive operations: 20 requests per minute
 */
export const STRICT_RATE_LIMIT: RateLimitConfig = {
  limit: 20,
  windowSeconds: 60,
};

/**
 * Check if a request should be rate limited
 *
 * @param request - Next.js request object
 * @param config - Rate limit configuration
 * @returns null if allowed, NextResponse with 429 if rate limited
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): NextResponse | null {
  // Skip rate limiting for cron jobs (authenticated with CRON_SECRET)
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (env.CRON_SECRET && token === env.CRON_SECRET) {
    return null; // Allow cron jobs to bypass rate limiting
  }

  // Periodic cleanup
  cleanup();

  const clientId = getClientId(request);
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const cutoff = now - windowMs;

  // Get or create rate limit entry
  let entry = rateLimitStore.get(clientId);
  if (!entry) {
    entry = { timestamps: [] };
    rateLimitStore.set(clientId, entry);
  }

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);

  // Check if limit exceeded
  if (entry.timestamps.length >= config.limit) {
    const oldestInWindow = entry.timestamps[0] || now;
    const resetTime = oldestInWindow + windowMs;
    const retryAfterSeconds = Math.ceil((resetTime - now) / 1000);

    return NextResponse.json(
      {
        success: false,
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again in ${retryAfterSeconds} seconds.`,
        retryAfter: retryAfterSeconds,
        limit: config.limit,
        window: config.windowSeconds,
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfterSeconds.toString(),
          'X-RateLimit-Limit': config.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
        },
      }
    );
  }

  // Add current timestamp
  entry.timestamps.push(now);

  // Request is allowed
  return null;
}

/**
 * Get current rate limit status for debugging
 */
export function getRateLimitStatus(
  request: NextRequest,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
) {
  const clientId = getClientId(request);
  const entry = rateLimitStore.get(clientId);
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const cutoff = now - windowMs;

  const recentRequests = entry?.timestamps.filter((ts) => ts > cutoff).length || 0;
  const remaining = Math.max(0, config.limit - recentRequests);

  return {
    clientId,
    limit: config.limit,
    remaining,
    used: recentRequests,
    resetAt: new Date(now + windowMs),
  };
}
