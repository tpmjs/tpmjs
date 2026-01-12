import { prisma } from '@tpmjs/db';
import { AddBridgeToolToCollectionSchema, COLLECTION_LIMITS } from '@tpmjs/types/collection';
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
 * GET /api/collections/[id]/bridge-tools
 * List all bridge tools in a collection
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();
  const { id: collectionId } = await context.params;

  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

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

    // Verify collection exists and user owns it
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: {
        bridgeTools: {
          orderBy: { createdAt: 'asc' },
        },
        user: {
          include: {
            bridgeConnection: true,
          },
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

    // Get available bridge tools from the user's bridge connection
    interface BridgeTool {
      serverId: string;
      serverName: string;
      name: string;
      description?: string;
      inputSchema?: Record<string, unknown>;
    }

    const availableBridgeTools =
      (collection.user.bridgeConnection?.tools as unknown as BridgeTool[]) || [];
    const bridgeStatus = collection.user.bridgeConnection?.status || 'disconnected';

    // Enrich collection bridge tools with definitions
    const enrichedTools = collection.bridgeTools.map((bt) => {
      const definition = availableBridgeTools.find(
        (t) => t.serverId === bt.serverId && t.name === bt.toolName
      );
      return {
        id: bt.id,
        serverId: bt.serverId,
        toolName: bt.toolName,
        displayName: bt.displayName,
        note: bt.note,
        createdAt: bt.createdAt,
        // Include definition info if available
        serverName: definition?.serverName,
        description: definition?.description,
        available: !!definition && bridgeStatus === 'connected',
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        bridgeTools: enrichedTools,
        bridgeStatus,
        availableTools: bridgeStatus === 'connected' ? availableBridgeTools : [],
      },
      meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
    });
  } catch (error) {
    console.error('[API Error] GET /api/collections/[id]/bridge-tools:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to list bridge tools' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/collections/[id]/bridge-tools
 * Add a bridge tool to a collection
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();
  const { id: collectionId } = await context.params;

  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

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

    // Verify collection exists and user owns it
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: {
        _count: { select: { bridgeTools: true } },
        user: {
          include: {
            bridgeConnection: true,
          },
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

    // Parse and validate request body
    const body = await request.json();
    const parseResult = AddBridgeToolToCollectionSchema.safeParse(body);

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

    // Check bridge tool limit
    if (collection._count.bridgeTools >= COLLECTION_LIMITS.MAX_BRIDGE_TOOLS_PER_COLLECTION) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LIMIT_EXCEEDED',
            message: `Maximum ${COLLECTION_LIMITS.MAX_BRIDGE_TOOLS_PER_COLLECTION} bridge tools per collection`,
          },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 400 }
      );
    }

    // Check if the user has a bridge connection with this tool
    const bridgeConnection = collection.user.bridgeConnection;
    if (!bridgeConnection) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_BRIDGE',
            message: 'No bridge connection found. Please start the bridge CLI first.',
          },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 400 }
      );
    }

    interface BridgeTool {
      serverId: string;
      serverName: string;
      name: string;
      description?: string;
    }

    const availableTools = (bridgeConnection.tools as unknown as BridgeTool[]) || [];
    const bridgeTool = availableTools.find((t) => t.serverId === serverId && t.name === toolName);

    if (!bridgeTool) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TOOL_NOT_FOUND',
            message: `Tool ${toolName} from server ${serverId} not found in your bridge connection`,
          },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 404 }
      );
    }

    // Check if tool is already in collection
    const existingEntry = await prisma.collectionBridgeTool.findUnique({
      where: {
        collectionId_serverId_toolName: {
          collectionId,
          serverId,
          toolName,
        },
      },
    });

    if (existingEntry) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_TOOL',
            message: 'This bridge tool is already in the collection',
          },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 409 }
      );
    }

    // Add bridge tool to collection
    const collectionBridgeTool = await prisma.collectionBridgeTool.create({
      data: {
        collectionId,
        serverId,
        toolName,
        displayName: displayName || null,
        note: note || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: collectionBridgeTool.id,
          serverId: collectionBridgeTool.serverId,
          toolName: collectionBridgeTool.toolName,
          displayName: collectionBridgeTool.displayName,
          note: collectionBridgeTool.note,
          createdAt: collectionBridgeTool.createdAt,
          serverName: bridgeTool.serverName,
          description: bridgeTool.description,
        },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API Error] POST /api/collections/[id]/bridge-tools:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to add bridge tool' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}
