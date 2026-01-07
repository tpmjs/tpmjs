import { prisma } from '@tpmjs/db';
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

/**
 * GET /api/user/likes/collections
 * Get collections liked by the current user
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();

  try {
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

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number.parseInt(searchParams.get('limit') || '20', 10), 1), 50);
    const offset = Math.max(Number.parseInt(searchParams.get('offset') || '0', 10), 0);

    const likes = await prisma.collectionLike.findMany({
      where: { userId: session.user.id },
      include: {
        collection: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: { tools: true },
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
        collection: {
          id: like.collection.id,
          name: like.collection.name,
          description: like.collection.description,
          isPublic: like.collection.isPublic,
          likeCount: like.collection.likeCount,
          toolCount: like.collection._count.tools,
          createdBy: like.collection.user,
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
    console.error('[API Error] GET /api/user/likes/collections:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch liked collections' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}
