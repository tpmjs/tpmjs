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
 * GET /api/tools/[id]/like
 * Check if the current user has liked this tool
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

    const like = await prisma.toolLike.findUnique({
      where: {
        userId_toolId: {
          userId: session.user.id,
          toolId: id,
        },
      },
    });

    const tool = await prisma.tool.findUnique({
      where: { id },
      select: { likeCount: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        liked: !!like,
        likeCount: tool?.likeCount ?? 0,
      },
      meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
    });
  } catch (error) {
    console.error('[API Error] GET /api/tools/[id]/like:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to check like status' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tools/[id]/like
 * Like a tool
 */
export async function POST(
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

    // Check if already liked
    const existingLike = await prisma.toolLike.findUnique({
      where: {
        userId_toolId: {
          userId: session.user.id,
          toolId: id,
        },
      },
    });

    if (existingLike) {
      return NextResponse.json({
        success: true,
        data: {
          liked: true,
          likeCount: tool.likeCount,
        },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      });
    }

    // Create like and increment count atomically
    const [, updatedTool] = await prisma.$transaction([
      prisma.toolLike.create({
        data: {
          userId: session.user.id,
          toolId: id,
        },
      }),
      prisma.tool.update({
        where: { id },
        data: { likeCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        liked: true,
        likeCount: updatedTool.likeCount,
      },
      meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
    });
  } catch (error) {
    console.error('[API Error] POST /api/tools/[id]/like:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to like tool' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tools/[id]/like
 * Unlike a tool
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

    // Check if liked
    const existingLike = await prisma.toolLike.findUnique({
      where: {
        userId_toolId: {
          userId: session.user.id,
          toolId: id,
        },
      },
    });

    if (!existingLike) {
      const tool = await prisma.tool.findUnique({
        where: { id },
        select: { likeCount: true },
      });

      return NextResponse.json({
        success: true,
        data: {
          liked: false,
          likeCount: tool?.likeCount ?? 0,
        },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      });
    }

    // Delete like and decrement count atomically
    const [, updatedTool] = await prisma.$transaction([
      prisma.toolLike.delete({
        where: {
          userId_toolId: {
            userId: session.user.id,
            toolId: id,
          },
        },
      }),
      prisma.tool.update({
        where: { id },
        data: { likeCount: { decrement: 1 } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        liked: false,
        likeCount: Math.max(0, updatedTool.likeCount),
      },
      meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
    });
  } catch (error) {
    console.error('[API Error] DELETE /api/tools/[id]/like:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to unlike tool' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}
