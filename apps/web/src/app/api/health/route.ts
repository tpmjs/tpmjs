import { type NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '~/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/health
 * Simple health check endpoint that doesn't touch the database
 */
export async function GET(request: NextRequest) {
  // Check rate limit
  const rateLimitResponse = checkRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    build: {
      // Vercel provides these at runtime
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
      commitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE || 'local',
      deploymentUrl: process.env.VERCEL_URL || 'localhost',
    },
    env: {
      hasDatabase: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
    },
  });
}
