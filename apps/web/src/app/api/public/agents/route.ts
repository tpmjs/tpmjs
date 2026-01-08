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

/**
 * GET /api/public/agents
 * Get public agents sorted by like count
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number.parseInt(searchParams.get('limit') || '20', 10), 1), 50);
    const offset = Math.max(Number.parseInt(searchParams.get('offset') || '0', 10), 0);
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'likes'; // 'likes' | 'recent' | 'tools'

    const where = {
      isPublic: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const orderBy =
      sort === 'recent'
        ? { createdAt: 'desc' as const }
        : sort === 'tools'
          ? { tools: { _count: 'desc' as const } }
          : { likeCount: 'desc' as const };

    const agents = await prisma.agent.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
        _count: {
          select: { tools: true, collections: true },
        },
      },
      orderBy: [orderBy, { createdAt: 'desc' }],
      take: limit + 1,
      skip: offset,
    });

    const hasMore = agents.length > limit;
    const data = hasMore ? agents.slice(0, limit) : agents;

    return NextResponse.json({
      success: true,
      data: data.map((agent) => ({
        id: agent.id,
        uid: agent.uid,
        name: agent.name,
        description: agent.description,
        provider: agent.provider,
        modelId: agent.modelId,
        likeCount: agent.likeCount,
        toolCount: agent._count.tools,
        collectionCount: agent._count.collections,
        createdAt: agent.createdAt,
        createdBy: agent.user,
      })),
      pagination: {
        limit,
        offset,
        hasMore,
      },
      meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
    });
  } catch (error) {
    console.error('[API Error] GET /api/public/agents:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch public agents' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}
