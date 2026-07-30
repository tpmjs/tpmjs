import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';

import { API_KEY_SCOPES } from '~/lib/api-keys';
import { authenticateRequest, getClientMetadata, hasScope } from '~/lib/api-keys/middleware';
import {
  checkApiKeyRateLimit,
  createRateLimitResponse,
  getRateLimitHeaders,
} from '~/lib/api-keys/rate-limit';
import { trackUsage } from '~/lib/api-keys/usage';
import {
  handleInitialize,
  handleToolsCall,
  handleToolsList,
  type TrackingContext,
} from '~/lib/mcp/handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const DB_TIMEOUT_MS = 10000; // 10 second timeout for database queries

interface RouteContext {
  params: Promise<{ username: string; slug: string }>;
}

interface JsonRpcRequest {
  jsonrpc: string;
  method: string;
  params?: unknown;
  id?: string | number;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string };
}

/**
 * Wrap a promise with a timeout
 */
function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), ms)),
  ]);
}

/**
 * Find a user by username (strips @ prefix if present)
 */
async function getUserByUsername(username: string) {
  // Strip @ prefix if present (from pretty URLs like /@username)
  const cleanUsername = username.startsWith('@') ? username.slice(1) : username;

  return withTimeout(
    prisma.user.findUnique({
      where: { username: cleanUsername },
      select: { id: true, username: true },
    }),
    DB_TIMEOUT_MS,
    `Database query timed out after ${DB_TIMEOUT_MS}ms`
  );
}

/**
 * Find a collection by user ID and slug
 */
async function getCollectionByUserIdAndSlug(userId: string, slug: string) {
  return withTimeout(
    prisma.collection.findFirst({
      where: {
        userId,
        slug,
      },
      select: { id: true, name: true, description: true, userId: true, isPublic: true },
    }),
    DB_TIMEOUT_MS,
    `Database query timed out after ${DB_TIMEOUT_MS}ms`
  );
}

/**
 * Process a JSON-RPC request and return the response
 */
async function processJsonRpcRequest(
  collectionId: string,
  collectionName: string,
  body: JsonRpcRequest,
  isOwner: boolean,
  trackingCtx?: TrackingContext
): Promise<JsonRpcResponse> {
  const requestId = body.id ?? null;

  switch (body.method) {
    case 'initialize': {
      const params = body.params as { protocolVersion?: string } | undefined;
      return handleInitialize(collectionName, requestId, params?.protocolVersion);
    }

    case 'tools/list':
      return await handleToolsList(collectionId, requestId);

    case 'tools/call': {
      const params = body.params as {
        name: string;
        arguments?: Record<string, unknown>;
        env?: Record<string, string>;
      };

      // For non-owners, use caller-provided env vars (or empty if not provided)
      // For owners, callerEnvVars is undefined so handleToolsCall uses stored env vars
      const callerEnvVars = isOwner ? undefined : params.env || {};

      return await handleToolsCall(collectionId, params, requestId, callerEnvVars, trackingCtx);
    }

    case 'notifications/initialized':
    case 'ping':
      return { jsonrpc: '2.0', id: requestId, result: {} };

    default:
      return {
        jsonrpc: '2.0',
        id: requestId,
        error: { code: -32601, message: `Method not found: ${body.method}` },
      };
  }
}

/**
 * POST /@username/collections/[slug]/mcp
 * MCP JSON-RPC endpoint (HTTP transport only)
 *
 * Authentication:
 * - Public collections: No auth required
 * - Private collections: Requires Authorization: Bearer header with valid API key
 */
export async function POST(request: NextRequest, context: RouteContext): Promise<Response> {
  const startTime = Date.now();
  let authResult: Awaited<ReturnType<typeof authenticateRequest>> | null = null;

  try {
    const { username, slug } = await context.params;

    // First, find the user by username
    const user = await getUserByUsername(username);

    if (!user) {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          error: {
            code: -32001,
            message: `User '${username}' not found. Check the username in your MCP endpoint URL.`,
          },
          id: null,
        },
        { status: 404 }
      );
    }

    // Then find the collection by user ID and slug
    const collection = await getCollectionByUserIdAndSlug(user.id, slug);

    if (!collection) {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          error: {
            code: -32001,
            message: `Collection '${slug}' not found for user '${user.username}'.`,
          },
          id: null,
        },
        { status: 404 }
      );
    }

    // Authenticate the request
    authResult = await authenticateRequest();

    // Determine if the authenticated user is the owner
    const isOwner = authResult.authenticated && authResult.userId === collection.userId;

    // Authorization check:
    // - Owners can always access their own collections (public or private)
    // - Non-owners can access PUBLIC collections without auth
    // - Private collections require auth as the owner
    if (!isOwner && !collection.isPublic) {
      // Private collection, not the owner - require authentication
      if (!authResult.authenticated) {
        return NextResponse.json(
          {
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: 'Authentication required. Add header: Authorization: Bearer YOUR_API_KEY',
            },
            id: null,
          },
          { status: 401 }
        );
      }
      // Authenticated but not the owner of a private collection - don't reveal existence
      return NextResponse.json(
        { jsonrpc: '2.0', error: { code: -32001, message: 'Collection not found' }, id: null },
        { status: 404 }
      );
    }

    // Check scope if authenticated
    if (authResult.authenticated && !hasScope(authResult, API_KEY_SCOPES.MCP_EXECUTE)) {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          error: { code: -32000, message: 'Missing required scope: mcp:execute' },
          id: null,
        },
        { status: 403 }
      );
    }

    // Rate limit if authenticated via API key
    if (authResult.authenticated && authResult.apiKeyId) {
      const rateLimitResult = await checkApiKeyRateLimit(
        authResult.apiKeyId,
        authResult.tier || 'FREE'
      );

      if (!rateLimitResult.allowed) {
        return createRateLimitResponse(rateLimitResult);
      }
    }

    // Parse JSON-RPC request body
    let body: JsonRpcRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null },
        { status: 400 }
      );
    }

    // Notifications (JSON-RPC messages with no id, e.g. notifications/initialized)
    // MUST get HTTP 202 Accepted with no body per the MCP streamable-HTTP spec.
    // Returning a JSON-RPC response with `id: null` makes strict clients (e.g.
    // codex's Rust MCP client) error and kill the session.
    const isNotification = body.id === undefined || body.id === null;
    if (isNotification && body.method !== 'initialize') {
      return new NextResponse(null, { status: 202 });
    }

    // Build tracking context for execution event tracking
    const trackingCtx: TrackingContext = {
      userId: authResult.authenticated ? (authResult.userId ?? undefined) : undefined,
      apiKeyId: authResult.authenticated ? (authResult.apiKeyId ?? undefined) : undefined,
      collectionId: collection.id,
      source: 'mcp_http',
    };

    // Process the request
    const response = await processJsonRpcRequest(
      collection.id,
      collection.name,
      body,
      isOwner,
      trackingCtx
    );
    // Deliberately STATELESS: no Mcp-Session-Id header. The server holds no
    // per-session state, and returning a session id makes strict clients (e.g.
    // codex's Rust MCP client) enter stateful mode — they then open a
    // server->client GET SSE stream we don't offer (405) and issue a session
    // DELETE, and when that channel is unavailable they abort their tool calls
    // (verified: the tool call never reaches the server). Omitting the header
    // keeps such clients on the stateless POST-request/JSON-response path.
    const jsonResponse = NextResponse.json(response);

    // Track usage for authenticated requests
    if (authResult.authenticated && authResult.userId) {
      const clientMeta = await getClientMetadata();
      trackUsage({
        apiKeyId: authResult.apiKeyId,
        userId: authResult.userId,
        endpoint: `/@${user.username}/collections/${slug}/mcp`,
        method: 'POST',
        statusCode: jsonResponse.status,
        latencyMs: Date.now() - startTime,
        resourceType: 'mcp',
        resourceId: collection.id,
        userAgent: clientMeta.userAgent,
        ipAddress: clientMeta.ipAddress,
      });
    }

    // Add rate limit headers for authenticated requests
    if (authResult.authenticated && authResult.apiKeyId) {
      const rateLimitResult = await checkApiKeyRateLimit(
        authResult.apiKeyId,
        authResult.tier || 'FREE'
      );
      const headers = getRateLimitHeaders(rateLimitResult);
      for (const [key, value] of Object.entries(headers)) {
        jsonResponse.headers.set(key, value);
      }
    }

    return jsonResponse;
  } catch (error) {
    console.error('[MCP POST] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';

    // Track error for authenticated requests
    if (authResult?.authenticated && authResult.userId) {
      const { username, slug } = await context.params;
      const clientMeta = await getClientMetadata();
      trackUsage({
        apiKeyId: authResult.apiKeyId,
        userId: authResult.userId,
        endpoint: `/@${username}/collections/${slug}/mcp`,
        method: 'POST',
        statusCode: 500,
        latencyMs: Date.now() - startTime,
        resourceType: 'mcp',
        errorCode: 'INTERNAL_ERROR',
        errorMessage: message,
        userAgent: clientMeta.userAgent,
        ipAddress: clientMeta.ipAddress,
      });
    }

    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32603, message }, id: null },
      { status: 500 }
    );
  }
}

/**
 * GET /@username/collections/[slug]/mcp
 *
 * A spec-compliant MCP client issues GET (with `Accept: text/event-stream`) to
 * open a server-initiated SSE stream. This endpoint does not offer one, so per
 * the MCP streamable-HTTP spec we MUST return 405 Method Not Allowed for such
 * requests. Plain (non-SSE) GETs still receive a human-friendly info document.
 */
export async function GET(request: NextRequest, context: RouteContext): Promise<Response> {
  const acceptsEventStream = (request.headers.get('accept') || '').includes('text/event-stream');
  if (acceptsEventStream) {
    return new NextResponse(null, { status: 405, headers: { Allow: 'POST' } });
  }

  try {
    const { username, slug } = await context.params;

    // First, find the user by username
    const user = await getUserByUsername(username);

    if (!user) {
      return NextResponse.json(
        { error: `User '${username}' not found. Check the username in your MCP endpoint URL.` },
        { status: 404 }
      );
    }

    // Then find the collection
    const collection = await getCollectionByUserIdAndSlug(user.id, slug);

    if (!collection) {
      return NextResponse.json(
        { error: `Collection '${slug}' not found for user '${user.username}'.` },
        { status: 404 }
      );
    }

    // For GET requests, check if user can access this collection:
    // - Public collections are accessible to anyone
    // - Private collections are only accessible to the owner (when authenticated)
    if (!collection.isPublic) {
      const authResult = await authenticateRequest();
      if (!authResult.authenticated || authResult.userId !== collection.userId) {
        // Don't reveal existence of private collections
        return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
      }
    }

    // Return server info
    return NextResponse.json({
      name: `TPMJS: ${collection.name}`,
      description: collection.description,
      protocol: 'mcp',
      transport: 'http',
      endpoint: `/@${user.username}/collections/${slug}/mcp`,
    });
  } catch (error) {
    console.error('[MCP GET] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
