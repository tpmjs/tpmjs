import { prisma } from '@tpmjs/db';
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
 * GET /api/agents/[id]/like
 * Check if the current user has liked this agent
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

    const like = await prisma.agentLike.findUnique({
      where: {
        userId_agentId: {
          userId: session.user.id,
          agentId: id,
        },
      },
    });

    const agent = await prisma.agent.findUnique({
      where: { id },
      select: { likeCount: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        liked: !!like,
        likeCount: agent?.likeCount ?? 0,
      },
      meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
    });
  } catch (error) {
    console.error('[API Error] GET /api/agents/[id]/like:', error);
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
 * POST /api/agents/[id]/like
 * Like an agent
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

    // Check agent exists and get name for activity log
    const agent = await prisma.agent.findUnique({
      where: { id },
      select: { id: true, name: true, likeCount: true },
    });

    if (!agent) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Agent not found' },
          meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
        },
        { status: 404 }
      );
    }

    // Check if already liked
    const existingLike = await prisma.agentLike.findUnique({
      where: {
        userId_agentId: {
          userId: session.user.id,
          agentId: id,
        },
      },
    });

    if (existingLike) {
      return NextResponse.json({
        success: true,
        data: {
          liked: true,
          likeCount: agent.likeCount,
        },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      });
    }

    // Create like and increment count atomically
    const [, updatedAgent] = await prisma.$transaction([
      prisma.agentLike.create({
        data: {
          userId: session.user.id,
          agentId: id,
        },
      }),
      prisma.agent.update({
        where: { id },
        data: { likeCount: { increment: 1 } },
      }),
    ]);

    // Log activity (fire-and-forget)
    logActivity({
      userId: session.user.id,
      type: 'AGENT_LIKED',
      targetName: agent.name,
      targetType: 'agent',
      agentId: id,
    });

    return NextResponse.json({
      success: true,
      data: {
        liked: true,
        likeCount: updatedAgent.likeCount,
      },
      meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
    });
  } catch (error) {
    console.error('[API Error] POST /api/agents/[id]/like:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to like agent' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agents/[id]/like
 * Unlike an agent
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

    // Check if liked and get agent info for activity log
    const existingLike = await prisma.agentLike.findUnique({
      where: {
        userId_agentId: {
          userId: session.user.id,
          agentId: id,
        },
      },
    });

    if (!existingLike) {
      const agent = await prisma.agent.findUnique({
        where: { id },
        select: { likeCount: true },
      });

      return NextResponse.json({
        success: true,
        data: {
          liked: false,
          likeCount: agent?.likeCount ?? 0,
        },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      });
    }

    // Get agent name for activity log
    const agent = await prisma.agent.findUnique({
      where: { id },
      select: { name: true },
    });

    // Delete like and decrement count atomically
    const [, updatedAgent] = await prisma.$transaction([
      prisma.agentLike.delete({
        where: {
          userId_agentId: {
            userId: session.user.id,
            agentId: id,
          },
        },
      }),
      prisma.agent.update({
        where: { id },
        data: { likeCount: { decrement: 1 } },
      }),
    ]);

    // Log activity (fire-and-forget)
    if (agent) {
      logActivity({
        userId: session.user.id,
        type: 'AGENT_UNLIKED',
        targetName: agent.name,
        targetType: 'agent',
        agentId: id,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        liked: false,
        likeCount: Math.max(0, updatedAgent.likeCount),
      },
      meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
    });
  } catch (error) {
    console.error('[API Error] DELETE /api/agents/[id]/like:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to unlike agent' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}
