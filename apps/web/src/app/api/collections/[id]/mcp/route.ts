import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';

import { handleInitialize, handleToolsCall, handleToolsList } from '~/lib/mcp/handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface JsonRpcRequest {
  jsonrpc: string;
  method: string;
  params?: unknown;
  id?: string | number;
}

/**
 * POST /api/collections/[id]/mcp
 * MCP JSON-RPC endpoint for tool execution
 */
export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { id } = await context.params;

  // Validate collection exists and is public
  const collection = await prisma.collection.findUnique({
    where: { id, isPublic: true },
    select: { id: true, name: true },
  });

  if (!collection) {
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32001, message: 'Collection not found' }, id: null },
      { status: 404 }
    );
  }

  let body: JsonRpcRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null },
      { status: 400 }
    );
  }

  const requestId = body.id ?? null;

  switch (body.method) {
    case 'initialize':
      return NextResponse.json(handleInitialize(collection.name, requestId));

    case 'tools/list':
      return NextResponse.json(await handleToolsList(id, requestId));

    case 'tools/call':
      return NextResponse.json(
        await handleToolsCall(
          id,
          body.params as { name: string; arguments?: Record<string, unknown> },
          requestId
        )
      );

    case 'notifications/initialized':
    case 'ping':
      // Acknowledge notifications
      return NextResponse.json({ jsonrpc: '2.0', id: requestId, result: {} });

    default:
      return NextResponse.json({
        jsonrpc: '2.0',
        id: requestId,
        error: { code: -32601, message: `Method not found: ${body.method}` },
      });
  }
}

/**
 * GET /api/collections/[id]/mcp
 * Returns server info (optional but helpful for discovery)
 */
export async function GET(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { id } = await context.params;

  const collection = await prisma.collection.findUnique({
    where: { id, isPublic: true },
    select: { id: true, name: true, description: true },
  });

  if (!collection) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
  }

  return NextResponse.json({
    name: `TPMJS: ${collection.name}`,
    description: collection.description,
    protocol: 'mcp',
    transport: 'streamable-http',
    endpoint: `/api/collections/${id}/mcp`,
  });
}
