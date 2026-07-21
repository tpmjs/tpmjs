/**
 * POST /api/registry/execute
 *
 * Execute a TPMJS tool by toolId. This is the primary execution endpoint
 * for external agents (Omega, MCP clients, custom agents) to run tools
 * from the TPMJS registry.
 *
 * Authentication: Optional but recommended.
 *   - Unauthenticated: 100 executions/hour (IP-based rate limit)
 *   - Authenticated: Tier-based limits (FREE=1000/hr, PRO=10000/hr)
 *
 * Request:
 *   POST /api/registry/execute
 *   Authorization: Bearer tpmjs_sk_... (optional)
 *   Content-Type: application/json
 *
 *   {
 *     "toolId": "@tpmjs/tools-resend::sendEmail",
 *     "params": { "from": "...", "to": "...", "subject": "..." },
 *     "env": { "RESEND_API_KEY": "re_..." }
 *   }
 *
 * Response:
 *   {
 *     "success": true,
 *     "toolId": "@tpmjs/tools-resend::sendEmail",
 *     "result": { ... },
 *     "executionTimeMs": 1234,
 *     "meta": {
 *       "package": "@tpmjs/tools-resend",
 *       "version": "0.1.0",
 *       "authenticated": true
 *     }
 *   }
 */

import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getClientMetadata } from '~/lib/api-keys/middleware';
import {
  checkApiKeyRateLimit,
  createRateLimitResponse,
  getRateLimitHeaders,
} from '~/lib/api-keys/rate-limit';
import { executorAuthHeaders } from '~/lib/executors/internal-auth';
import { checkRateLimit } from '~/lib/rate-limit';
import { trackExecution } from '~/lib/tracking/executions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const EXECUTOR_URL =
  process.env.TPMJS_EXECUTOR_URL ||
  process.env.RAILWAY_EXECUTOR_URL ||
  'https://executor.tpmjs.com';

/** Rate limit for unauthenticated execute requests: 100/hour */
const UNAUTHED_EXECUTE_LIMIT = {
  limit: 100,
  windowSeconds: 3600,
  prefix: 'registry-exec',
} as const;

export async function POST(request: NextRequest) {
  const startTime = performance.now();

  // --- Auth (optional) ---
  const authResult = await authenticateRequest();
  const isAuthenticated = authResult.authenticated && !!authResult.userId;

  // --- Rate Limiting ---
  if (isAuthenticated && authResult.userId) {
    const identifier = authResult.apiKeyId || authResult.userId;
    const rateResult = await checkApiKeyRateLimit(identifier, authResult.tier || 'FREE');
    if (!rateResult.allowed) {
      return createRateLimitResponse(rateResult);
    }
  } else {
    const rateLimitResponse = checkRateLimit(request, UNAUTHED_EXECUTE_LIMIT);
    if (rateLimitResponse) return rateLimitResponse;
  }

  // --- Parse & Validate Body ---
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON' },
      },
      { status: 400 }
    );
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INVALID_BODY', message: 'Request body must be an object' },
      },
      { status: 400 }
    );
  }

  const { toolId, params, env } = body as {
    toolId?: unknown;
    params?: unknown;
    env?: unknown;
  };

  // Validate toolId
  if (!toolId || typeof toolId !== 'string') {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MISSING_TOOL_ID',
          message: 'toolId is required and must be a string in format "package::exportName"',
        },
      },
      { status: 400 }
    );
  }

  // Parse toolId format: "package::exportName"
  const separatorIndex = toolId.lastIndexOf('::');
  if (separatorIndex === -1 || separatorIndex === 0 || separatorIndex === toolId.length - 2) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_TOOL_ID',
          message: `Invalid toolId format "${toolId}". Expected "package::exportName" (e.g. "@tpmjs/tools-resend::sendEmail")`,
        },
      },
      { status: 400 }
    );
  }

  const packageName = toolId.substring(0, separatorIndex);
  const exportName = toolId.substring(separatorIndex + 2);

  // Validate params
  if (
    params !== undefined &&
    (typeof params !== 'object' || params === null || Array.isArray(params))
  ) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INVALID_PARAMS', message: 'params must be a JSON object' },
      },
      { status: 400 }
    );
  }

  // Validate env
  if (env !== undefined && (typeof env !== 'object' || env === null || Array.isArray(env))) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_ENV',
          message: 'env must be a JSON object of string key-value pairs',
        },
      },
      { status: 400 }
    );
  }

  const safeParams = (params as Record<string, unknown>) || {};
  const safeEnv = (env as Record<string, string>) || {};

  // --- Look up tool metadata ---
  let toolDbId: string;
  let version: string;

  try {
    const tool = await prisma.tool.findFirst({
      where: {
        isActive: true,
        name: exportName,
        package: { npmPackageName: packageName },
      },
      select: {
        id: true,
        package: {
          select: { npmVersion: true },
        },
      },
    });

    if (!tool) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'TOOL_NOT_FOUND', message: `Active registry tool not found: ${toolId}` },
        },
        { status: 404 }
      );
    }

    toolDbId = tool.id;
    version = tool.package.npmVersion;
  } catch (error) {
    console.warn(`[REGISTRY EXECUTE] DB lookup failed for ${toolId}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'REGISTRY_UNAVAILABLE', message: 'Registry lookup temporarily unavailable' },
      },
      { status: 503 }
    );
  }

  const importUrl = `https://esm.sh/${packageName}@${version}`;

  // --- Execute via executor service ---
  let executorResult: {
    success: boolean;
    output?: unknown;
    result?: unknown;
    error?: unknown;
    executionTimeMs?: number;
  };

  try {
    const executorResponse = await fetch(`${EXECUTOR_URL}/execute-tool`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...executorAuthHeaders() },
      body: JSON.stringify({
        packageName,
        name: exportName,
        version,
        importUrl,
        params: safeParams,
        env: safeEnv,
      }),
      signal: AbortSignal.timeout(55000),
    });

    if (!executorResponse.ok && executorResponse.status >= 500) {
      const errorText = await executorResponse.text().catch(() => 'Unknown executor error');
      executorResult = {
        success: false,
        error: {
          code: 'EXECUTOR_ERROR',
          message: `Executor returned ${executorResponse.status}: ${errorText}`,
        },
      };
    } else {
      executorResult = await executorResponse.json();
    }
  } catch (error) {
    const durationMs = Math.round(performance.now() - startTime);

    // Track failed execution
    trackExecution({
      eventType: 'tool_call',
      source: isAuthenticated ? 'mcp_http' : 'mcp_http',
      userId: authResult.userId,
      apiKeyId: authResult.apiKeyId,
      toolId: toolDbId,
      toolName: exportName,
      packageName,
      status: error instanceof Error && error.name === 'TimeoutError' ? 'timeout' : 'error',
      durationMs,
      errorCode:
        error instanceof Error && error.name === 'TimeoutError'
          ? 'TIMEOUT'
          : 'EXECUTOR_UNREACHABLE',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      // ML training data
      inputArgs: params,
    });

    const isTimeout = error instanceof Error && error.name === 'TimeoutError';
    return NextResponse.json(
      {
        success: false,
        toolId,
        error: {
          code: isTimeout ? 'EXECUTION_TIMEOUT' : 'EXECUTOR_UNREACHABLE',
          message: isTimeout
            ? 'Tool execution timed out after 55 seconds'
            : `Failed to reach executor service: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
        executionTimeMs: durationMs,
        meta: { package: packageName, version, authenticated: isAuthenticated },
      },
      { status: isTimeout ? 504 : 502 }
    );
  }

  const durationMs = Math.round(performance.now() - startTime);
  const isSuccess = executorResult.success === true;
  const output = executorResult.output ?? executorResult.result ?? null;

  // Normalize error from executor (can be string or object)
  let errorPayload: { code: string; message: string } | null = null;
  if (!isSuccess) {
    if (typeof executorResult.error === 'string') {
      errorPayload = { code: 'TOOL_ERROR', message: executorResult.error };
    } else if (executorResult.error && typeof executorResult.error === 'object') {
      const e = executorResult.error as { code?: string; message?: string };
      errorPayload = {
        code: e.code || 'TOOL_ERROR',
        message: e.message || 'Tool execution failed',
      };
    } else {
      errorPayload = { code: 'TOOL_ERROR', message: 'Tool execution failed' };
    }
  }

  // --- Track execution (fire-and-forget) ---
  await getClientMetadata();
  trackExecution({
    eventType: 'tool_call',
    source: isAuthenticated ? 'mcp_http' : 'mcp_http',
    userId: authResult.userId,
    apiKeyId: authResult.apiKeyId,
    toolId: toolDbId,
    toolName: exportName,
    packageName,
    status: isSuccess ? 'success' : 'error',
    durationMs,
    errorCode: errorPayload?.code,
    errorMessage: errorPayload?.message,
    // ML training data
    inputArgs: params,
    outputSummary: isSuccess ? output : errorPayload,
  });

  // --- Build response ---
  const responseBody: Record<string, unknown> = {
    success: isSuccess,
    toolId,
    ...(isSuccess ? { result: output } : {}),
    ...(errorPayload ? { error: errorPayload } : {}),
    executionTimeMs: durationMs,
    meta: {
      package: packageName,
      version,
      authenticated: isAuthenticated,
    },
  };

  // Add rate limit headers for authenticated users
  const responseHeaders: Record<string, string> = {};
  if (isAuthenticated && authResult.userId) {
    const identifier = authResult.apiKeyId || authResult.userId;
    const rateStatus = await checkApiKeyRateLimit(identifier, authResult.tier || 'FREE');
    Object.assign(responseHeaders, getRateLimitHeaders(rateStatus));
  }

  return NextResponse.json(responseBody, {
    status: isSuccess ? 200 : 422,
    headers: responseHeaders,
  });
}
