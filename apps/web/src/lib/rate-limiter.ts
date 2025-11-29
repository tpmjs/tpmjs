/**
 * Rate limiter service for tool playground executions
 * Prevents abuse by limiting requests per IP address
 */

import { prisma } from '@tpmjs/db';

const RATE_LIMIT_WINDOW_MS = 3600000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 executions per hour

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Check if an IP address has exceeded the rate limit
 */
export async function checkRateLimit(ipAddress: string): Promise<RateLimitResult> {
  const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

  // Count simulations from this IP in the last hour
  const count = await prisma.simulation.count({
    where: {
      ipAddress,
      createdAt: {
        gte: oneHourAgo,
      },
    },
  });

  const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - count);
  const allowed = count < RATE_LIMIT_MAX_REQUESTS;
  const resetAt = new Date(Date.now() + RATE_LIMIT_WINDOW_MS);

  return {
    allowed,
    remaining,
    resetAt,
  };
}

/**
 * Get client IP address from request headers
 */
export function getClientIP(request: Request): string {
  // Try various headers for IP address (in order of priority)
  const headers = request.headers;

  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to unknown
  return 'unknown';
}
