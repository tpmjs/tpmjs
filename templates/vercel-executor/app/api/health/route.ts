/**
 * Health Check Endpoint
 *
 * GET /api/health
 * Returns the health status of the executor
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  version?: string;
  info?: Record<string, unknown>;
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  return NextResponse.json({
    status: 'ok',
    version: '1.0.0',
    info: {
      runtime: 'vercel-sandbox',
      region: 'iad1',
      timestamp: new Date().toISOString(),
    },
  });
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
