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
  // Deployment URL provenance. The image bakes TPMJS_DEPLOYMENT_URL; when it is
  // absent (e.g. a build path that doesn't set it), fall back to the canonical
  // production origin instead of the misleading 'localhost' — only a genuine
  // non-production build reports 'localhost'.
  const deploymentUrl =
    process.env.TPMJS_DEPLOYMENT_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://tpmjs.com' : 'localhost');

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    build: {
      commitSha: process.env.TPMJS_COMMIT_SHA?.slice(0, 7) || 'local',
      commitMessage: process.env.TPMJS_COMMIT_MESSAGE || 'local',
      deploymentUrl,
    },
    env: {
      hasDatabase: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
    },
  });
}
