/**
 * Execute Tool Endpoint
 *
 * POST /api/execute-tool
 * Executes a TPMJS tool with the provided parameters
 */

import { type ExecuteToolRequest, executeTool } from '@/lib/executor';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds max

/**
 * Verify API key if configured
 */
function verifyApiKey(request: NextRequest): boolean {
  const apiKey = process.env.EXECUTOR_API_KEY;

  // If no API key is configured, allow all requests
  if (!apiKey) {
    return true;
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return false;
  }

  // Expect "Bearer <api-key>" format
  const [type, token] = authHeader.split(' ');
  if (type !== 'Bearer' || token !== apiKey) {
    return false;
  }

  return true;
}

/**
 * Validate the request body
 */
function validateRequest(body: unknown): body is ExecuteToolRequest {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const req = body as Record<string, unknown>;

  return (
    typeof req.packageName === 'string' &&
    req.packageName.length > 0 &&
    typeof req.name === 'string' &&
    req.name.length > 0 &&
    typeof req.params === 'object' &&
    req.params !== null
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Verify API key if configured
  if (!verifyApiKey(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', executionTimeMs: 0 },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    // Validate request
    if (!validateRequest(body)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request. Required: packageName, name, params',
          executionTimeMs: 0,
        },
        { status: 400 }
      );
    }

    // Execute the tool
    const result = await executeTool(body);

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        executionTimeMs: 0,
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
