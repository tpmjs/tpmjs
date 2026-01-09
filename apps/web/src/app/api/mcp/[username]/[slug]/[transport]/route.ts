import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';

import { handleInitialize, handleToolsCall, handleToolsList } from '~/lib/mcp/handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const DB_TIMEOUT_MS = 10000; // 10 second timeout for database queries

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
 * Find a public collection by username and slug
 */
async function getPublicCollectionByUsernameAndSlug(username: string, slug: string) {
  return withTimeout(
    prisma.collection.findFirst({
      where: {
        slug,
        isPublic: true,
        user: { username },
      },
      select: { id: true, name: true, description: true },
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
  body: JsonRpcRequest
): Promise<JsonRpcResponse> {
  const requestId = body.id ?? null;

  switch (body.method) {
    case 'initialize':
      return handleInitialize(collectionName, requestId);

    case 'tools/list':
      return await handleToolsList(collectionId, requestId);

    case 'tools/call':
      return await handleToolsCall(
        collectionId,
        body.params as { name: string; arguments?: Record<string, unknown> },
        requestId
      );

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
  collectionName: string
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

  const response = await processJsonRpcRequest(collectionId, collectionName, body);
  return NextResponse.json(response);
}

/**
 * POST /api/mcp/[username]/[slug]/sse
 * SSE transport - Server-Sent Events for streaming
 */
async function handleSseTransport(
  request: NextRequest,
  collectionId: string,
  collectionName: string
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

  const response = await processJsonRpcRequest(collectionId, collectionName, body);

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

    const collection = await getPublicCollectionByUsernameAndSlug(username, slug);

    if (!collection) {
      return NextResponse.json(
        { jsonrpc: '2.0', error: { code: -32001, message: 'Collection not found' }, id: null },
        { status: 404 }
      );
    }

    if (transport === 'sse') {
      return handleSseTransport(request, collection.id, collection.name);
    }

    return handleHttpTransport(request, collection.id, collection.name);
  } catch (error) {
    console.error('[MCP POST] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32603, message }, id: null },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mcp/[username]/[slug]/[transport]
 * Returns server info (for http) or establishes SSE connection (for sse)
 */
export async function GET(_request: NextRequest, context: RouteContext): Promise<Response> {
  try {
    const { username, slug, transport } = await context.params;

    if (transport !== 'http' && transport !== 'sse') {
      return NextResponse.json({ error: `Invalid transport: ${transport}` }, { status: 400 });
    }

    const collection = await getPublicCollectionByUsernameAndSlug(username, slug);

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
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
