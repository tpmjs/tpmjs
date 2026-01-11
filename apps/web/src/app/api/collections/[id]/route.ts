import { Prisma, prisma } from '@tpmjs/db';
import { UpdateCollectionSchema } from '@tpmjs/types/collection';
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
 * GET /api/collections/[id]
 * Get a single collection with its tools
 *
 * Query params:
 * - toolsLimit: Max tools to return (default: 50, max: 100)
 * - toolsOffset: Offset for tools pagination (default: 0)
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();
  const { id } = await context.params;

  // Parse pagination params for tools
  const { searchParams } = new URL(request.url);
  const toolsLimit = Math.min(
    Math.max(Number.parseInt(searchParams.get('toolsLimit') || '50', 10), 1),
    100
  );
  const toolsOffset = Math.max(Number.parseInt(searchParams.get('toolsOffset') || '0', 10), 0);

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

    // Fetch collection with paginated tools
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        tools: {
          include: {
            tool: {
              include: {
                package: {
                  select: {
                    id: true,
                    npmPackageName: true,
                    category: true,
                  },
                },
              },
            },
          },
          orderBy: { position: 'asc' },
          take: toolsLimit + 1, // Fetch one extra to check hasMore
          skip: toolsOffset,
        },
        _count: { select: { tools: true } },
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

    // Check ownership (unless collection is public)
    if (collection.userId !== session.user.id && !collection.isPublic) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 403 }
      );
    }

    // Check if there are more tools
    const hasMoreTools = collection.tools.length > toolsLimit;
    const paginatedTools = hasMoreTools ? collection.tools.slice(0, toolsLimit) : collection.tools;

    return NextResponse.json({
      success: true,
      data: {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        isPublic: collection.isPublic,
        toolCount: collection._count.tools,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
        isOwner: collection.userId === session.user.id,
        tools: paginatedTools.map((ct) => ({
          id: ct.id,
          toolId: ct.toolId,
          position: ct.position,
          note: ct.note,
          addedAt: ct.addedAt,
          tool: {
            id: ct.tool.id,
            name: ct.tool.name,
            description: ct.tool.description,
            package: ct.tool.package,
          },
        })),
      },
      meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      pagination: {
        toolsLimit,
        toolsOffset,
        toolsReturned: paginatedTools.length,
        hasMoreTools,
      },
    });
  } catch (error) {
    console.error('[API Error] GET /api/collections/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch collection' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/collections/[id]
 * Update a collection
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Multiple validation checks required
export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();
  const { id } = await context.params;

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

    // Check collection exists and ownership
    const existingCollection = await prisma.collection.findUnique({
      where: { id },
    });

    if (!existingCollection) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Collection not found' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 404 }
      );
    }

    if (existingCollection.userId !== session.user.id) {
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
    const parseResult = UpdateCollectionSchema.safeParse(body);

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

    const { name, description, isPublic, executorType, executorConfig, envVars } = parseResult.data;

    // If name is being changed, check for duplicates
    if (name && name !== existingCollection.name) {
      const duplicateName = await prisma.collection.findFirst({
        where: {
          userId: session.user.id,
          name: { equals: name, mode: 'insensitive' },
          id: { not: id },
        },
      });

      if (duplicateName) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_NAME',
              message: 'A collection with this name already exists',
            },
            meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
          },
          { status: 409 }
        );
      }
    }

    // Update collection (transform null to Prisma.JsonNull for JSON fields)
    const collection = await prisma.collection.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isPublic !== undefined && { isPublic }),
        ...(executorType !== undefined && { executorType }),
        ...(executorConfig !== undefined && {
          executorConfig: executorConfig === null ? Prisma.JsonNull : executorConfig,
        }),
        ...(envVars !== undefined && {
          envVars: envVars === null ? Prisma.JsonNull : envVars,
        }),
      },
      include: {
        _count: { select: { tools: true } },
      },
    });

    // Log activity (fire-and-forget)
    logActivity({
      userId: session.user.id,
      type: 'COLLECTION_UPDATED',
      targetName: collection.name,
      targetType: 'collection',
      collectionId: collection.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        isPublic: collection.isPublic,
        toolCount: collection._count.tools,
        executorType: collection.executorType,
        executorConfig: collection.executorConfig,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
      },
      meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
    });
  } catch (error) {
    console.error('[API Error] PATCH /api/collections/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to update collection' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/collections/[id]
 * Delete a collection
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();
  const { id } = await context.params;

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

    // Check collection exists and ownership
    const collection = await prisma.collection.findUnique({
      where: { id },
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

    // Store name for activity log before deletion
    const collectionName = collection.name;

    // Delete collection (cascade will delete CollectionTools)
    await prisma.collection.delete({
      where: { id },
    });

    // Log activity (fire-and-forget) - note: collectionId not included since it's deleted
    logActivity({
      userId: session.user.id,
      type: 'COLLECTION_DELETED',
      targetName: collectionName,
      targetType: 'collection',
    });

    return NextResponse.json({
      success: true,
      data: { deleted: true },
      meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
    });
  } catch (error) {
    console.error('[API Error] DELETE /api/collections/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to delete collection' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}
