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
  pagination?: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tools/[id]/reviews
 * Get reviews for a tool
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();
  const { id } = await context.params;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 20));
    const offset = Math.max(0, Number(searchParams.get('offset')) || 0);
    const sort = searchParams.get('sort') || 'recent'; // 'recent', 'helpful', 'highest', 'lowest'

    // Check tool exists
    const tool = await prisma.tool.findUnique({
      where: { id },
      select: { id: true, reviewCount: true },
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

    // Build order by clause
    let orderBy: Record<string, 'asc' | 'desc'>[];
    switch (sort) {
      case 'helpful':
        orderBy = [{ helpfulCount: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'highest':
        orderBy = [{ rating: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'lowest':
        orderBy = [{ rating: 'asc' }, { createdAt: 'desc' }];
        break;
      case 'recent':
      default:
        orderBy = [{ createdAt: 'desc' }];
    }

    // Fetch reviews with user info
    const reviews = await prisma.toolReview.findMany({
      where: {
        toolId: id,
        isApproved: true,
        isHidden: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
      },
      orderBy,
      take: limit + 1,
      skip: offset,
    });

    const hasMore = reviews.length > limit;
    const actualReviews = hasMore ? reviews.slice(0, limit) : reviews;

    return NextResponse.json({
      success: true,
      data: actualReviews.map((review) => ({
        id: review.id,
        title: review.title,
        content: review.content,
        rating: review.rating,
        helpfulCount: review.helpfulCount,
        createdAt: review.createdAt.toISOString(),
        updatedAt: review.updatedAt.toISOString(),
        user: {
          id: review.user.id,
          name: review.user.name,
          image: review.user.image,
          username: review.user.username,
        },
      })),
      meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      pagination: {
        limit,
        offset,
        hasMore,
      },
    });
  } catch (error) {
    console.error('[API Error] GET /api/tools/[id]/reviews:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get reviews' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tools/[id]/reviews
 * Create or update a review for a tool
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();
  const { id } = await context.params;

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

    // Parse request body
    const body = await request.json();
    const { title, content, rating } = body;

    // Validate content
    if (typeof content !== 'string' || content.trim().length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CONTENT',
            message: 'Review content must be at least 10 characters',
          },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONTENT_TOO_LONG',
            message: 'Review content must be less than 5000 characters',
          },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 400 }
      );
    }

    // Validate title if provided
    if (title !== undefined && title !== null) {
      if (typeof title !== 'string') {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'INVALID_TITLE', message: 'Title must be a string' },
            meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
          },
          { status: 400 }
        );
      }
      if (title.length > 200) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'TITLE_TOO_LONG', message: 'Title must be less than 200 characters' },
            meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
          },
          { status: 400 }
        );
      }
    }

    // Validate rating
    if (typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_RATING', message: 'Rating must be an integer between 1 and 5' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 400 }
      );
    }

    // Check tool exists
    const tool = await prisma.tool.findUnique({
      where: { id },
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

    // Check if user already has a review
    const existingReview = await prisma.toolReview.findUnique({
      where: {
        userId_toolId: {
          userId: session.user.id,
          toolId: id,
        },
      },
    });

    let review: {
      id: string;
      title: string | null;
      content: string;
      rating: number;
      helpfulCount: number;
      createdAt: Date;
      updatedAt: Date;
      user: { id: string; name: string | null; image: string | null; username: string | null };
    } | null = null;
    await prisma.$transaction(async (tx) => {
      if (existingReview) {
        // Update existing review
        review = await tx.toolReview.update({
          where: { id: existingReview.id },
          data: {
            title: title?.trim() || null,
            content: content.trim(),
            rating,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                username: true,
              },
            },
          },
        });
      } else {
        // Create new review
        review = await tx.toolReview.create({
          data: {
            userId: session.user.id,
            toolId: id,
            title: title?.trim() || null,
            content: content.trim(),
            rating,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                username: true,
              },
            },
          },
        });

        // Increment review count
        await tx.tool.update({
          where: { id },
          data: { reviewCount: { increment: 1 } },
        });
      }

      // Also update rating aggregate (upsert the rating)
      await tx.toolRating.upsert({
        where: {
          userId_toolId: {
            userId: session.user.id,
            toolId: id,
          },
        },
        create: {
          userId: session.user.id,
          toolId: id,
          rating,
        },
        update: {
          rating,
        },
      });

      // Recalculate average rating
      const aggregates = await tx.toolRating.aggregate({
        where: { toolId: id },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.tool.update({
        where: { id },
        data: {
          averageRating: aggregates._avg.rating,
          ratingCount: aggregates._count.rating,
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        id: review!.id,
        title: review!.title,
        content: review!.content,
        rating: review!.rating,
        helpfulCount: review!.helpfulCount,
        createdAt: review!.createdAt.toISOString(),
        updatedAt: review!.updatedAt.toISOString(),
        user: {
          id: review!.user.id,
          name: review!.user.name,
          image: review!.user.image,
          username: review!.user.username,
        },
      },
      meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
    });
  } catch (error) {
    console.error('[API Error] POST /api/tools/[id]/reviews:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create review' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tools/[id]/reviews
 * Delete user's review for a tool
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();
  const { id } = await context.params;

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

    // Check if review exists
    const existingReview = await prisma.toolReview.findUnique({
      where: {
        userId_toolId: {
          userId: session.user.id,
          toolId: id,
        },
      },
    });

    if (!existingReview) {
      return NextResponse.json({
        success: true,
        data: { deleted: false, message: 'No review to delete' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      });
    }

    // Delete review and update count
    await prisma.$transaction([
      prisma.toolReview.delete({
        where: { id: existingReview.id },
      }),
      prisma.tool.update({
        where: { id },
        data: { reviewCount: { decrement: 1 } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: { deleted: true },
      meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
    });
  } catch (error) {
    console.error('[API Error] DELETE /api/tools/[id]/reviews:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to delete review' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}
