import { prisma } from '@tpmjs/db';
import { UpdateAgentSchema } from '@tpmjs/types/agent';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '~/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/agents/[id]
 * Get a single agent's details
 */
export async function GET(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const { id } = await context.params;

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        collections: {
          include: {
            collection: {
              select: {
                id: true,
                name: true,
                _count: { select: { tools: true } },
              },
            },
          },
          orderBy: { position: 'asc' },
        },
        tools: {
          include: {
            tool: {
              select: {
                id: true,
                name: true,
                description: true,
                package: {
                  select: {
                    npmPackageName: true,
                    category: true,
                  },
                },
              },
            },
          },
          orderBy: { position: 'asc' },
        },
        _count: {
          select: {
            tools: true,
            collections: true,
            conversations: true,
          },
        },
      },
    });

    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }

    // Check access - owner or public
    const isOwner = session?.user?.id === agent.userId;
    if (!isOwner && !agent.isPublic) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...agent,
        isOwner,
        toolCount: agent._count.tools,
        collectionCount: agent._count.collections,
        conversationCount: agent._count.conversations,
        collections: agent.collections.map((ac) => ({
          id: ac.id,
          collectionId: ac.collectionId,
          position: ac.position,
          addedAt: ac.addedAt,
          collection: {
            ...ac.collection,
            toolCount: ac.collection._count.tools,
          },
        })),
        tools: agent.tools.map((at) => ({
          id: at.id,
          toolId: at.toolId,
          position: at.position,
          addedAt: at.addedAt,
          tool: at.tool,
        })),
        _count: undefined,
      },
    });
  } catch (error) {
    console.error('Failed to get agent:', error);
    return NextResponse.json({ success: false, error: 'Failed to get agent' }, { status: 500 });
  }
}

/**
 * PATCH /api/agents/[id]
 * Update an agent's configuration
 */
export async function PATCH(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = UpdateAgentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check ownership
    const existing = await prisma.agent.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Check UID uniqueness if being changed
    if (parsed.data.uid) {
      const existingByUid = await prisma.agent.findFirst({
        where: { uid: parsed.data.uid, id: { not: id } },
      });
      if (existingByUid) {
        return NextResponse.json({ success: false, error: 'UID already in use' }, { status: 409 });
      }
    }

    // Check name uniqueness if being changed
    if (parsed.data.name) {
      const existingByName = await prisma.agent.findFirst({
        where: { userId: session.user.id, name: parsed.data.name, id: { not: id } },
      });
      if (existingByName) {
        return NextResponse.json(
          { success: false, error: 'An agent with this name already exists' },
          { status: 409 }
        );
      }
    }

    const agent = await prisma.agent.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        uid: true,
        name: true,
        description: true,
        provider: true,
        modelId: true,
        systemPrompt: true,
        temperature: true,
        maxToolCallsPerTurn: true,
        maxMessagesInContext: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tools: true,
            collections: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...agent,
        toolCount: agent._count.tools,
        collectionCount: agent._count.collections,
        _count: undefined,
      },
    });
  } catch (error) {
    console.error('Failed to update agent:', error);
    return NextResponse.json({ success: false, error: 'Failed to update agent' }, { status: 500 });
  }
}

/**
 * DELETE /api/agents/[id]
 * Delete an agent and all its conversations
 */
export async function DELETE(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Check ownership
    const existing = await prisma.agent.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    await prisma.agent.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Failed to delete agent:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete agent' }, { status: 500 });
  }
}
