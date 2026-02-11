import { prisma } from '@tpmjs/db';
import { AddCustomMcpServerSchema, COLLECTION_LIMITS } from '@tpmjs/types/collection';
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

/**
 * GET /api/custom-mcp-servers
 * List user's custom MCP servers
 */
export async function GET(_request: NextRequest): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();

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

    const servers = await prisma.customMcpServer.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        url: true,
        authType: true,
        authHeader: true,
        status: true,
        tools: true,
        lastSyncAt: true,
        lastSyncError: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const serversWithCount = servers.map((s) => ({
      ...s,
      toolCount: Array.isArray(s.tools) ? (s.tools as unknown[]).length : 0,
    }));

    return NextResponse.json({
      success: true,
      data: { servers: serversWithCount },
      meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
    });
  } catch (error) {
    console.error('[API Error] GET /api/custom-mcp-servers:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to list custom MCP servers' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/custom-mcp-servers
 * Add a new custom MCP server and discover its tools
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();

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

    const body = await request.json();
    const parseResult = AddCustomMcpServerSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: { errors: parseResult.error.flatten().fieldErrors },
          },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 400 }
      );
    }

    const { name, url, authType, authHeader, authToken } = parseResult.data;

    // Check server limit
    const serverCount = await prisma.customMcpServer.count({
      where: { userId: session.user.id },
    });

    if (serverCount >= COLLECTION_LIMITS.MAX_CUSTOM_SERVERS_PER_USER) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LIMIT_EXCEEDED',
            message: `Maximum ${COLLECTION_LIMITS.MAX_CUSTOM_SERVERS_PER_USER} custom MCP servers per user`,
          },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 400 }
      );
    }

    // Check for duplicate URL
    const existing = await prisma.customMcpServer.findUnique({
      where: { userId_url: { userId: session.user.id, url } },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DUPLICATE', message: 'You already have a server with this URL' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 409 }
      );
    }

    // Create the server record
    const server = await prisma.customMcpServer.create({
      data: {
        userId: session.user.id,
        name,
        url,
        authType: authType ?? null,
        authHeader: authHeader ?? null,
        authToken: authToken ?? null,
        status: 'pending',
      },
    });

    // Try to discover tools immediately
    try {
      const tools = await discoverRemoteTools({
        url,
        authType: authType ?? null,
        authHeader: authHeader ?? null,
        authToken: authToken ?? null,
      });

      await prisma.customMcpServer.update({
        where: { id: server.id },
        data: {
          tools: JSON.parse(JSON.stringify(tools)),
          status: 'synced',
          lastSyncAt: new Date(),
          lastSyncError: null,
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: {
            id: server.id,
            name: server.name,
            url: server.url,
            status: 'synced',
            tools,
            toolCount: tools.length,
            lastSyncAt: new Date().toISOString(),
          },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 201 }
      );
    } catch (syncError) {
      const errorMessage =
        syncError instanceof Error ? syncError.message : 'Failed to connect to server';

      await prisma.customMcpServer.update({
        where: { id: server.id },
        data: {
          status: 'error',
          lastSyncError: errorMessage,
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: {
            id: server.id,
            name: server.name,
            url: server.url,
            status: 'error',
            tools: [],
            toolCount: 0,
            lastSyncError: errorMessage,
          },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('[API Error] POST /api/custom-mcp-servers:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to add custom MCP server' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}
