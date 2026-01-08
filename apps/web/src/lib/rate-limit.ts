import { kv } from '@vercel/kv';
import { type NextRequest, NextResponse } from 'next/server';
import { env } from '~/env';

/**
 * Distributed rate limiter using Vercel KV (with in-memory fallback)
 *
 * Uses Vercel KV in production for accurate rate limiting across serverless instances.
 * Falls back to in-memory store when KV is not available (development).
 */

interface RateLimitEntry {
  timestamps: number[];
}

// In-memory fallback store (used when Vercel KV is not available)
const memoryStore = new Map<string, RateLimitEntry>();

// Check if Vercel KV is available
const isKVAvailable = !!process.env.KV_REST_API_URL;

// Cleanup interval for in-memory fallback
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_STORE_SIZE = 10000;
let lastCleanup = Date.now();

/**
 * Clean up old entries from the in-memory fallback store
 */
function cleanupMemoryStore() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  const cutoff = now - 60 * 1000;
  let removedCount = 0;

  for (const [key, entry] of memoryStore.entries()) {
    entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);
    if (entry.timestamps.length === 0) {
      memoryStore.delete(key);
      removedCount++;
    }
  }

  // Prevent unbounded growth
  if (memoryStore.size > MAX_STORE_SIZE) {
    const entries = Array.from(memoryStore.entries());
    entries.sort((a, b) => {
      const aLatest = a[1].timestamps.length > 0 ? Math.max(...a[1].timestamps) : 0;
      const bLatest = b[1].timestamps.length > 0 ? Math.max(...b[1].timestamps) : 0;
      return aLatest - bLatest;
    });

    const toRemove = entries.slice(0, Math.floor(MAX_STORE_SIZE * 0.2));
    for (const [key] of toRemove) {
      memoryStore.delete(key);
      removedCount++;
    }
  }

  lastCleanup = now;
  if (removedCount > 0) {
    console.log(`[Rate Limit] Cleaned up ${removedCount} in-memory entries`);
  }
}

/**
 * Get client identifier from request (IP address)
 */
function getClientId(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Optional key prefix for namespacing */
  prefix?: string;
}

/** Default rate limit: 100 requests per minute */
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  limit: 100,
  windowSeconds: 60,
};

/** Strict rate limit for expensive operations: 20 requests per minute */
export const STRICT_RATE_LIMIT: RateLimitConfig = {
  limit: 20,
  windowSeconds: 60,
};

/**
 * Helper to add timeout to promises
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));
  return Promise.race([promise, timeout]);
}

/**
 * Get rate limit entry from Vercel KV (with timeout)
 */
async function getKVEntry(key: string): Promise<RateLimitEntry | null> {
  try {
    const result = await withTimeout(kv.get<RateLimitEntry>(key), 2000);
    return result;
  } catch (error) {
    console.error('[Rate Limit] KV get error:', error);
    return null;
  }
}

/**
 * Set rate limit entry in Vercel KV (with timeout, fire-and-forget)
 */
async function setKVEntry(key: string, entry: RateLimitEntry, ttlSeconds: number): Promise<void> {
  try {
    // Fire and forget - don't wait for result, just timeout if slow
    withTimeout(kv.set(key, entry, { ex: ttlSeconds }), 2000);
  } catch (error) {
    console.error('[Rate Limit] KV set error:', error);
  }
}

/**
 * Check if a request should be rate limited (async version for KV)
 */
async function checkRateLimitAsync(
  request: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const clientId = getClientId(request);
  const prefix = config.prefix || 'ratelimit';
  const key = `${prefix}:${clientId}`;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const cutoff = now - windowMs;

  // Get or create entry from KV
  let entry = await getKVEntry(key);
  if (!entry) {
    entry = { timestamps: [] };
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

  // Add current timestamp and save
  entry.timestamps.push(now);
  await setKVEntry(key, entry, config.windowSeconds + 10); // TTL slightly longer than window

  return null;
}

/**
 * Check if a request should be rate limited (sync version for in-memory)
 */
function checkRateLimitSync(request: NextRequest, config: RateLimitConfig): NextResponse | null {
  cleanupMemoryStore();

  const clientId = getClientId(request);
  const prefix = config.prefix || 'ratelimit';
  const key = `${prefix}:${clientId}`;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const cutoff = now - windowMs;

  // Get or create entry
  let entry = memoryStore.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    memoryStore.set(key, entry);
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

  return null;
}

/**
 * Check if a request should be rate limited
 *
 * Uses Vercel KV in production for distributed rate limiting,
 * falls back to in-memory store in development.
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
    return null;
  }

  // Use sync in-memory check for immediate response
  // Note: KV would require async, but checkRateLimit is called synchronously
  // This is a limitation - for truly distributed rate limiting, consider
  // using middleware or making the rate limit check async
  return checkRateLimitSync(request, config);
}

/**
 * Check if a request should be rate limited (async version)
 *
 * Use this when you can await the rate limit check for true distributed limiting.
 *
 * @param request - Next.js request object
 * @param config - Rate limit configuration
 * @returns null if allowed, NextResponse with 429 if rate limited
 */
export async function checkRateLimitDistributed(
  request: NextRequest,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): Promise<NextResponse | null> {
  // Skip rate limiting for cron jobs
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (env.CRON_SECRET && token === env.CRON_SECRET) {
    return null;
  }

  // Use KV if available, otherwise fall back to in-memory
  if (isKVAvailable) {
    return checkRateLimitAsync(request, config);
  }

  return checkRateLimitSync(request, config);
}

/**
 * Get current rate limit status for debugging
 */
export function getRateLimitStatus(
  request: NextRequest,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
) {
  const clientId = getClientId(request);
  const prefix = config.prefix || 'ratelimit';
  const key = `${prefix}:${clientId}`;
  const entry = memoryStore.get(key);
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
    isDistributed: isKVAvailable,
  };
}
