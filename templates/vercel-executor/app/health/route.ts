/**
 * Health Check Endpoint (root path)
 *
 * GET /health
 * TPMJS expects health at /health, not /api/health
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  version: string;
  info?: {
    runtime?: string;
    region?: string;
    timestamp?: string;
  };
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  return NextResponse.json({
    status: 'ok',
    version: '1.0.0',
    info: {
      runtime: 'vercel-sandbox',
      region: process.env.VERCEL_REGION || 'unknown',
      timestamp: new Date().toISOString(),
    },
  });
}
