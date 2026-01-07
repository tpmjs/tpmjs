import { prisma } from '@tpmjs/db';
import { AddToolToCollectionSchema, COLLECTION_LIMITS } from '@tpmjs/types/collection';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { logActivity } from '~/lib/activity';
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
 * POST /api/collections/[id]/tools
 * Add a tool to a collection
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
      include: { _count: { select: { tools: true } } },
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
    const parseResult = AddToolToCollectionSchema.safeParse(body);

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

    const { toolId, note, position } = parseResult.data;

    // Check tool limit
    if (collection._count.tools >= COLLECTION_LIMITS.MAX_TOOLS_PER_COLLECTION) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LIMIT_EXCEEDED',
            message: `Maximum ${COLLECTION_LIMITS.MAX_TOOLS_PER_COLLECTION} tools per collection`,
          },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 400 }
      );
    }

    // Verify tool exists
    const tool = await prisma.tool.findUnique({
      where: { id: toolId },
      include: {
        package: {
          select: {
            id: true,
            npmPackageName: true,
            category: true,
          },
        },
      },
    });

    if (!tool) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Tool not found' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 404 }
      );
    }

    // Check if tool is already in collection
    const existingEntry = await prisma.collectionTool.findUnique({
      where: {
        collectionId_toolId: {
          collectionId,
          toolId,
        },
      },
    });

    if (existingEntry) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DUPLICATE_TOOL', message: 'Tool is already in this collection' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 409 }
      );
    }

    // Get max position if not specified
    const maxPosition =
      position ??
      (await prisma.collectionTool.count({
        where: { collectionId },
      }));

    // Add tool to collection
    const collectionTool = await prisma.collectionTool.create({
      data: {
        collectionId,
        toolId,
        note: note || null,
        position: maxPosition,
      },
    });

    // Log activity (fire-and-forget)
    logActivity({
      userId: session.user.id,
      type: 'COLLECTION_TOOL_ADDED',
      targetName: collection.name,
      targetType: 'collection',
      collectionId,
      toolId,
      metadata: { toolName: tool.name },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: collectionTool.id,
          toolId: collectionTool.toolId,
          position: collectionTool.position,
          note: collectionTool.note,
          addedAt: collectionTool.addedAt,
          tool: {
            id: tool.id,
            name: tool.name,
            description: tool.description,
            package: tool.package,
          },
        },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API Error] POST /api/collections/[id]/tools:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to add tool to collection' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}
