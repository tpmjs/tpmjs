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
 * GET /api/public/collections
 * Get public collections sorted by like count
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

    const collections = await prisma.collection.findMany({
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
          select: { tools: true },
        },
      },
      orderBy: [orderBy, { createdAt: 'desc' }],
      take: limit + 1,
      skip: offset,
    });

    const hasMore = collections.length > limit;
    const data = hasMore ? collections.slice(0, limit) : collections;

    return NextResponse.json({
      success: true,
      data: data.map((collection) => ({
        id: collection.id,
        slug: collection.slug,
        name: collection.name,
        description: collection.description,
        likeCount: collection.likeCount,
        toolCount: collection._count.tools,
        createdAt: collection.createdAt,
        createdBy: collection.user,
      })),
      pagination: {
        limit,
        offset,
        hasMore,
      },
      meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
    });
  } catch (error) {
    console.error('[API Error] GET /api/public/collections:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch public collections' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}
