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
import { handleInitialize, handleToolsCall, handleToolsList } from '~/lib/mcp/handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const DB_TIMEOUT_MS = 10000; // 10 second timeout for database queries

// Authentication is required for all MCP operations
const REQUIRE_AUTH = true;

interface RouteContext {
  params: Promise<{ username: string; slug: string; transport: string }>;
}

interface JsonRpcRequest {
  jsonrpc: string;
  method: string;
  params?: unknown;
  id?: string | number;
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
 * Find a user by username
 */
async function getUserByUsername(username: string) {
  return withTimeout(
    prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true },
    }),
    DB_TIMEOUT_MS,
    `Database query timed out after ${DB_TIMEOUT_MS}ms`
  );
}

/**
 * Find a collection by user ID and slug or collection ID
 * Supports both human-readable slugs and collection IDs for flexibility
 * Returns the collection regardless of public/private status - authorization is checked separately
 */
async function getCollectionByUserIdAndSlugOrId(userId: string, slugOrId: string) {
  return withTimeout(
    prisma.collection.findFirst({
      where: {
        userId,
        OR: [{ slug: slugOrId }, { id: slugOrId }],
      },
      select: { id: true, name: true, description: true, userId: true, isPublic: true },
    }),
    DB_TIMEOUT_MS,
    `Database query timed out after ${DB_TIMEOUT_MS}ms`
  );
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string };
}

/**
 * Process a JSON-RPC request and return the response
 */
async function processJsonRpcRequest(
  collectionId: string,
  collectionName: string,
  body: JsonRpcRequest,
  isOwner: boolean
): Promise<JsonRpcResponse> {
  const requestId = body.id ?? null;

  switch (body.method) {
    case 'initialize':
      return handleInitialize(collectionName, requestId);

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

      return await handleToolsCall(collectionId, params, requestId, callerEnvVars);
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
 * POST /api/mcp/[username]/[slug]/http
 * Streamable HTTP transport - JSON-RPC over HTTP
 */
async function handleHttpTransport(
  request: NextRequest,
  collectionId: string,
  collectionName: string,
  isOwner: boolean
): Promise<NextResponse> {
  let body: JsonRpcRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null },
      { status: 400 }
    );
  }

  const response = await processJsonRpcRequest(collectionId, collectionName, body, isOwner);
  return NextResponse.json(response);
}

/**
 * POST /api/mcp/[username]/[slug]/sse
 * SSE transport - Server-Sent Events for streaming
 */
async function handleSseTransport(
  request: NextRequest,
  collectionId: string,
  collectionName: string,
  isOwner: boolean
): Promise<Response> {
  let body: JsonRpcRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(
      `data: ${JSON.stringify({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null })}\n\n`,
      {
        status: 400,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      }
    );
  }

  const response = await processJsonRpcRequest(collectionId, collectionName, body, isOwner);

  // For SSE, we send the response as an event and then close
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send the JSON-RPC response as an SSE event
      const eventData = `data: ${JSON.stringify(response)}\n\n`;
      controller.enqueue(encoder.encode(eventData));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

/**
 * GET /api/mcp/[username]/[slug]/sse
 * SSE endpoint for establishing event stream connection
 */
function handleSseGet(
  username: string,
  slug: string,
  collectionName: string,
  collectionDescription: string | null
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send server info as initial event
      const serverInfo = {
        type: 'server_info',
        name: `TPMJS: ${collectionName}`,
        description: collectionDescription,
        protocol: 'mcp',
        transport: 'sse',
        endpoint: `/api/mcp/${username}/${slug}/sse`,
      };
      const eventData = `data: ${JSON.stringify(serverInfo)}\n\n`;
      controller.enqueue(encoder.encode(eventData));
      // Keep connection open for future events
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

/**
 * POST /api/mcp/[username]/[slug]/[transport]
 * MCP JSON-RPC endpoint for tool execution
 */
export async function POST(request: NextRequest, context: RouteContext): Promise<Response> {
  const startTime = Date.now();
  let authResult: Awaited<ReturnType<typeof authenticateRequest>> | null = null;

  try {
    const { username, slug, transport } = await context.params;

    if (transport !== 'http' && transport !== 'sse') {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          error: { code: -32001, message: `Invalid transport: ${transport}` },
          id: null,
        },
        { status: 400 }
      );
    }

    // Authenticate the request
    authResult = await authenticateRequest();

    // Check if auth is required
    if (REQUIRE_AUTH && !authResult.authenticated) {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          error: { code: -32000, message: authResult.error || 'Authentication required' },
          id: null,
        },
        { status: 401 }
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

    // Log warning for unauthenticated requests (soft launch)
    if (!authResult.authenticated && !REQUIRE_AUTH) {
      console.warn(
        `[MCP] Unauthenticated request to /${username}/${slug}/${transport} - ` +
          'API key authentication will be required in a future update'
      );
    }

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

    // Then find the collection by user ID and slug/ID
    const collection = await getCollectionByUserIdAndSlugOrId(user.id, slug);

    if (!collection) {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          error: {
            code: -32001,
            message: `Collection '${slug}' not found for user '${username}'.`,
          },
          id: null,
        },
        { status: 404 }
      );
    }

    // Authorization check:
    // - Owners can always access their own collections (public or private)
    // - Non-owners can access PUBLIC collections with their own env vars
    const isOwner = authResult.userId === collection.userId;

    if (!isOwner) {
      if (!collection.isPublic) {
        // Private collection, not the owner - don't reveal existence
        return NextResponse.json(
          { jsonrpc: '2.0', error: { code: -32001, message: 'Collection not found' }, id: null },
          { status: 404 }
        );
      }
      // Public collection - non-owners can access but must provide their own env vars
      // The env vars are validated per-tool in handleToolsCall
    }

    let response: Response;
    if (transport === 'sse') {
      response = await handleSseTransport(request, collection.id, collection.name, isOwner);
    } else {
      response = await handleHttpTransport(request, collection.id, collection.name, isOwner);
    }

    // Track usage for authenticated requests
    if (authResult.authenticated && authResult.userId) {
      const clientMeta = await getClientMetadata();
      trackUsage({
        apiKeyId: authResult.apiKeyId,
        userId: authResult.userId,
        endpoint: `/api/mcp/${username}/${slug}/${transport}`,
        method: 'POST',
        statusCode: response.status,
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
        response.headers.set(key, value);
      }
    }

    return response;
  } catch (error) {
    console.error('[MCP POST] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';

    // Track error for authenticated requests
    if (authResult?.authenticated && authResult.userId) {
      const { username, slug, transport } = await context.params;
      const clientMeta = await getClientMetadata();
      trackUsage({
        apiKeyId: authResult.apiKeyId,
        userId: authResult.userId,
        endpoint: `/api/mcp/${username}/${slug}/${transport}`,
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
 * GET /api/mcp/[username]/[slug]/[transport]
 * Returns server info (for http) or establishes SSE connection (for sse)
 * Allows owners to access their private collections when authenticated
 */
export async function GET(_request: NextRequest, context: RouteContext): Promise<Response> {
  try {
    const { username, slug, transport } = await context.params;

    if (transport !== 'http' && transport !== 'sse') {
      return NextResponse.json({ error: `Invalid transport: ${transport}` }, { status: 400 });
    }

    // First, find the user by username
    const user = await getUserByUsername(username);

    if (!user) {
      return NextResponse.json(
        { error: `User '${username}' not found. Check the username in your MCP endpoint URL.` },
        { status: 404 }
      );
    }

    // Then find the collection
    const collection = await getCollectionByUserIdAndSlugOrId(user.id, slug);

    if (!collection) {
      return NextResponse.json(
        { error: `Collection '${slug}' not found for user '${username}'.` },
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

    if (transport === 'sse') {
      return handleSseGet(username, slug, collection.name, collection.description);
    }

    // HTTP transport - return server info
    return NextResponse.json({
      name: `TPMJS: ${collection.name}`,
      description: collection.description,
      protocol: 'mcp',
      transport: 'http',
      endpoint: `/api/mcp/${username}/${slug}/http`,
    });
  } catch (error) {
    console.error('[MCP GET] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
