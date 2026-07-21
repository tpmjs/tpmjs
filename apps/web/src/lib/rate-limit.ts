import { type NextRequest, NextResponse } from 'next/server';

/**
 * Bounded in-process rate limiter for the self-hosted web service.
 *
 * Production runs one Next.js process, so a process-local sliding window is
 * the authoritative limiter without a network round trip or remote state.
 */

interface RateLimitEntry {
  timestamps: number[];
  windowMs: number;
}

// One bounded store shared by all requests in the Next.js process.
const memoryStore = new Map<string, RateLimitEntry>();

// Cleanup interval for the process-local store.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_STORE_SIZE = 10000;
let lastCleanup = Date.now();

/**
 * Clean up old entries from the process-local store.
 */
function cleanupMemoryStore() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  let removedCount = 0;

  for (const [key, entry] of memoryStore.entries()) {
    const cutoff = now - entry.windowMs;
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
export function getClientId(request: NextRequest): string {
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

/** Default rate limit: 1000 requests per minute */
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  limit: 1000,
  windowSeconds: 60,
};

/** Strict rate limit for expensive operations: 200 requests per minute */
export const STRICT_RATE_LIMIT: RateLimitConfig = {
  limit: 200,
  windowSeconds: 60,
};

/** AI generation rate limit: 50 requests per hour (expensive AI operations) */
export const AI_GENERATION_RATE_LIMIT: RateLimitConfig = {
  limit: 50,
  windowSeconds: 3600, // 1 hour
  prefix: 'ai-gen',
};

function isAuthenticatedScheduler(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  const cronSecret = process.env.CRON_SECRET;
  return Boolean(cronSecret && token === cronSecret);
}

/**
 * Check if a request should be rate limited in this process.
 */
function checkRateLimitInProcess(
  request: NextRequest,
  config: RateLimitConfig
): NextResponse | null {
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
    entry = { timestamps: [], windowMs };
    memoryStore.set(key, entry);
  } else {
    // A prefix may be reused with a changed configuration after a deploy.
    entry.windowMs = windowMs;
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
 * @param request - Next.js request object
 * @param config - Rate limit configuration
 * @returns null if allowed, NextResponse with 429 if rate limited
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): NextResponse | null {
  // Skip rate limiting for cron jobs (authenticated with CRON_SECRET)
  if (isAuthenticatedScheduler(request)) {
    return null;
  }

  return checkRateLimitInProcess(request, config);
}

/**
 * Async-compatible rate-limit entry point for existing route handlers.
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
  if (isAuthenticatedScheduler(request)) {
    return null;
  }

  return checkRateLimitInProcess(request, config);
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
    isDistributed: false,
  };
}
