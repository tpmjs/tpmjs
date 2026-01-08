import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';

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
 * GET /api/public/collections/[id]
 * Get a single public collection with its tools
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();
  const { id } = await context.params;

  try {
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
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

    if (!collection.isPublic) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'This collection is not public' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: collection.id,
        slug: collection.slug,
        name: collection.name,
        description: collection.description,
        likeCount: collection.likeCount,
        toolCount: collection._count.tools,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
        createdBy: collection.user,
        tools: collection.tools.map((ct) => ({
          id: ct.id,
          toolId: ct.toolId,
          position: ct.position,
          note: ct.note,
          addedAt: ct.addedAt,
          tool: {
            id: ct.tool.id,
            name: ct.tool.name,
            description: ct.tool.description,
            likeCount: ct.tool.likeCount,
            package: ct.tool.package,
          },
        })),
      },
      meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
    });
  } catch (error) {
    console.error('[API Error] GET /api/public/collections/[id]:', error);
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
