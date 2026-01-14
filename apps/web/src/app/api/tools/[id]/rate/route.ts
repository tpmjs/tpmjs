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

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tools/[id]/rate
 * Get the current user's rating for this tool and aggregate stats
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();
  const { id } = await context.params;

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Get tool rating stats (always available)
    const tool = await prisma.tool.findUnique({
      where: { id },
      select: {
        averageRating: true,
        ratingCount: true,
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

    // Get user's rating if logged in
    let userRating: number | null = null;
    if (session) {
      const rating = await prisma.toolRating.findUnique({
        where: {
          userId_toolId: {
            userId: session.user.id,
            toolId: id,
          },
        },
      });
      userRating = rating?.rating ?? null;
    }

    return NextResponse.json({
      success: true,
      data: {
        userRating,
        averageRating: tool.averageRating ? Number(tool.averageRating) : null,
        ratingCount: tool.ratingCount,
      },
      meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
    });
  } catch (error) {
    console.error('[API Error] GET /api/tools/[id]/rate:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get rating' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tools/[id]/rate
 * Rate a tool (1-5 stars)
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
    const rating = body.rating;

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

    // Upsert rating and recalculate aggregates
    await prisma.$transaction(async (tx) => {
      // Upsert user's rating
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

      // Update tool with new aggregates
      await tx.tool.update({
        where: { id },
        data: {
          averageRating: aggregates._avg.rating,
          ratingCount: aggregates._count.rating,
        },
      });
    });

    // Get updated stats
    const updatedTool = await prisma.tool.findUnique({
      where: { id },
      select: {
        averageRating: true,
        ratingCount: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        userRating: rating,
        averageRating: updatedTool?.averageRating ? Number(updatedTool.averageRating) : null,
        ratingCount: updatedTool?.ratingCount ?? 0,
      },
      meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
    });
  } catch (error) {
    console.error('[API Error] POST /api/tools/[id]/rate:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to rate tool' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tools/[id]/rate
 * Remove user's rating for a tool
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

    // Check if rating exists
    const existingRating = await prisma.toolRating.findUnique({
      where: {
        userId_toolId: {
          userId: session.user.id,
          toolId: id,
        },
      },
    });

    if (!existingRating) {
      const tool = await prisma.tool.findUnique({
        where: { id },
        select: { averageRating: true, ratingCount: true },
      });

      return NextResponse.json({
        success: true,
        data: {
          userRating: null,
          averageRating: tool?.averageRating ? Number(tool.averageRating) : null,
          ratingCount: tool?.ratingCount ?? 0,
        },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      });
    }

    // Delete rating and recalculate aggregates
    await prisma.$transaction(async (tx) => {
      await tx.toolRating.delete({
        where: {
          userId_toolId: {
            userId: session.user.id,
            toolId: id,
          },
        },
      });

      // Recalculate average rating
      const aggregates = await tx.toolRating.aggregate({
        where: { toolId: id },
        _avg: { rating: true },
        _count: { rating: true },
      });

      // Update tool with new aggregates
      await tx.tool.update({
        where: { id },
        data: {
          averageRating: aggregates._avg.rating,
          ratingCount: aggregates._count.rating,
        },
      });
    });

    // Get updated stats
    const updatedTool = await prisma.tool.findUnique({
      where: { id },
      select: {
        averageRating: true,
        ratingCount: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        userRating: null,
        averageRating: updatedTool?.averageRating ? Number(updatedTool.averageRating) : null,
        ratingCount: updatedTool?.ratingCount ?? 0,
      },
      meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
    });
  } catch (error) {
    console.error('[API Error] DELETE /api/tools/[id]/rate:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to remove rating' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}
