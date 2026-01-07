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
 * GET /api/user/likes/agents
 * Get agents liked by the current user
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

    const likes = await prisma.agentLike.findMany({
      where: { userId: session.user.id },
      include: {
        agent: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: { tools: true, collections: true },
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
        agent: {
          id: like.agent.id,
          uid: like.agent.uid,
          name: like.agent.name,
          description: like.agent.description,
          isPublic: like.agent.isPublic,
          likeCount: like.agent.likeCount,
          provider: like.agent.provider,
          modelId: like.agent.modelId,
          toolCount: like.agent._count.tools,
          collectionCount: like.agent._count.collections,
          createdBy: like.agent.user,
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
    console.error('[API Error] GET /api/user/likes/agents:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch liked agents' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}
