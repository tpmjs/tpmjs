import { prisma } from '@tpmjs/db';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { discoverRemoteTools } from '~/lib/mcp/remote-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const API_VERSION = '1.0.0';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    version: string;
    timestamp: string;
    requestId?: string;
  };
}

interface RouteContext {
  params: Promise<{ serverId: string }>;
}

/**
 * POST /api/custom-mcp-servers/[serverId]/sync
 * Re-discover tools from the remote MCP server
 */
export async function POST(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();
  const { serverId } = await context.params;

  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 401 }
      );
    }

    const server = await prisma.customMcpServer.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Server not found' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 404 }
      );
    }

    if (server.userId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 403 }
      );
    }

    try {
      const tools = await discoverRemoteTools({
        url: server.url,
        authType: server.authType as 'bearer' | 'header' | null,
        authHeader: server.authHeader,
        authToken: server.authToken,
      });

      const updated = await prisma.customMcpServer.update({
        where: { id: serverId },
        data: {
          tools: JSON.parse(JSON.stringify(tools)),
          status: 'synced',
          lastSyncAt: new Date(),
          lastSyncError: null,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: updated.id,
          name: updated.name,
          status: 'synced',
          tools,
          toolCount: tools.length,
          lastSyncAt: updated.lastSyncAt,
        },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      });
    } catch (syncError) {
      const errorMessage =
        syncError instanceof Error ? syncError.message : 'Failed to connect to server';

      await prisma.customMcpServer.update({
        where: { id: serverId },
        data: {
          status: 'error',
          lastSyncError: errorMessage,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SYNC_FAILED',
            message: errorMessage,
          },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('[API Error] POST /api/custom-mcp-servers/[serverId]/sync:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to sync server' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}
