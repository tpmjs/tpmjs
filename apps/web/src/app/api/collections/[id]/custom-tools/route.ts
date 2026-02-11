import { prisma } from '@tpmjs/db';
import { AddCustomToolToCollectionSchema, COLLECTION_LIMITS } from '@tpmjs/types/collection';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';

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
  params: Promise<{ id: string }>;
}

/**
 * GET /api/collections/[id]/custom-tools
 * List custom tools in a collection
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();
  const { id: collectionId } = await context.params;

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

    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: {
        customTools: {
          include: { server: { select: { id: true, name: true, url: true, status: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!collection) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Collection not found' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 404 }
      );
    }

    if (collection.userId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        customTools: collection.customTools.map((ct) => ({
          id: ct.id,
          serverId: ct.serverId,
          toolName: ct.toolName,
          displayName: ct.displayName,
          note: ct.note,
          createdAt: ct.createdAt,
          server: ct.server,
        })),
      },
      meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
    });
  } catch (error) {
    console.error('[API Error] GET /api/collections/[id]/custom-tools:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to list custom tools' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/collections/[id]/custom-tools
 * Add a custom tool to a collection
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();
  const { id: collectionId } = await context.params;

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

    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: { _count: { select: { customTools: true } } },
    });

    if (!collection) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Collection not found' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 404 }
      );
    }

    if (collection.userId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parseResult = AddCustomToolToCollectionSchema.safeParse(body);

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

    const { serverId, toolName, displayName, note } = parseResult.data;

    // Check limit
    if (collection._count.customTools >= COLLECTION_LIMITS.MAX_CUSTOM_TOOLS_PER_COLLECTION) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LIMIT_EXCEEDED',
            message: `Maximum ${COLLECTION_LIMITS.MAX_CUSTOM_TOOLS_PER_COLLECTION} custom tools per collection`,
          },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 400 }
      );
    }

    // Verify the server exists and belongs to the user
    const server = await prisma.customMcpServer.findUnique({
      where: { id: serverId },
    });

    if (!server || server.userId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Custom MCP server not found' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 404 }
      );
    }

    // Verify the tool exists in the server's cached tools
    interface CachedTool {
      name: string;
      description?: string;
    }
    const cachedTools = (server.tools as unknown as CachedTool[]) || [];
    const toolExists = cachedTools.some((t) => t.name === toolName);

    if (!toolExists) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TOOL_NOT_FOUND',
            message: `Tool "${toolName}" not found in server's tool list. Try syncing the server first.`,
          },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 404 }
      );
    }

    // Check for duplicates
    const existing = await prisma.collectionCustomTool.findUnique({
      where: {
        collectionId_serverId_toolName: { collectionId, serverId, toolName },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DUPLICATE_TOOL', message: 'This tool is already in the collection' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 409 }
      );
    }

    const customTool = await prisma.collectionCustomTool.create({
      data: {
        collectionId,
        serverId,
        toolName,
        displayName: displayName || null,
        note: note || null,
      },
      include: { server: { select: { id: true, name: true, url: true, status: true } } },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: customTool.id,
          serverId: customTool.serverId,
          toolName: customTool.toolName,
          displayName: customTool.displayName,
          note: customTool.note,
          createdAt: customTool.createdAt,
          server: customTool.server,
        },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API Error] POST /api/collections/[id]/custom-tools:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to add custom tool' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}
