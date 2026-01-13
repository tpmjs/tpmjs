import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '~/lib/api-keys/middleware';

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
 * GET /api/user/likes/tools
 * Get tools liked by the current user
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();

  try {
    const authResult = await authenticateRequest();

    if (!authResult.authenticated || !authResult.userId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number.parseInt(searchParams.get('limit') || '20', 10), 1), 50);
    const offset = Math.max(Number.parseInt(searchParams.get('offset') || '0', 10), 0);

    const likes = await prisma.toolLike.findMany({
      where: { userId: authResult.userId },
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
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      skip: offset,
    });

    const hasMore = likes.length > limit;
    const data = hasMore ? likes.slice(0, limit) : likes;

    return NextResponse.json({
      success: true,
      data: data.map((like) => ({
        id: like.id,
        likedAt: like.createdAt,
        tool: {
          id: like.tool.id,
          name: like.tool.name,
          description: like.tool.description,
          likeCount: like.tool.likeCount,
          package: like.tool.package,
        },
      })),
      pagination: {
        limit,
        offset,
        hasMore,
      },
      meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
    });
  } catch (error) {
    console.error('[API Error] GET /api/user/likes/tools:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch liked tools' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}
