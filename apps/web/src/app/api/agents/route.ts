import { prisma } from '@tpmjs/db';
import { AGENT_LIMITS, CreateAgentSchema } from '@tpmjs/types/agent';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import { logActivity } from '~/lib/activity';
import { auth } from '~/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Generate a URL-friendly UID from a name
 */
function generateUid(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

/**
 * GET /api/agents
 * List all agents owned by the authenticated user
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number.parseInt(searchParams.get('limit') || '20'), 50);
    const offset = Number.parseInt(searchParams.get('offset') || '0');

    const agents = await prisma.agent.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        uid: true,
        name: true,
        description: true,
        provider: true,
        modelId: true,
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
      orderBy: { updatedAt: 'desc' },
      take: limit + 1,
      skip: offset,
    });

    const hasMore = agents.length > limit;
    const data = hasMore ? agents.slice(0, limit) : agents;

    return NextResponse.json({
      success: true,
      data: data.map((a) => ({
        ...a,
        toolCount: a._count.tools,
        collectionCount: a._count.collections,
        _count: undefined,
      })),
      pagination: {
        limit,
        offset,
        count: data.length,
        hasMore,
      },
    });
  } catch (error) {
    console.error('Failed to list agents:', error);
    return NextResponse.json({ success: false, error: 'Failed to list agents' }, { status: 500 });
  }
}

/**
 * POST /api/agents
 * Create a new agent
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CreateAgentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check agent limit
    const agentCount = await prisma.agent.count({
      where: { userId: session.user.id },
    });
    if (agentCount >= AGENT_LIMITS.MAX_AGENTS_PER_USER) {
      return NextResponse.json(
        { success: false, error: `Maximum ${AGENT_LIMITS.MAX_AGENTS_PER_USER} agents allowed` },
        { status: 400 }
      );
    }

    const {
      name,
      uid,
      description,
      provider,
      modelId,
      systemPrompt,
      temperature,
      maxToolCallsPerTurn,
      maxMessagesInContext,
      isPublic,
      collectionIds,
      toolIds,
    } = parsed.data;

    // Generate UID if not provided
    let finalUid = uid || generateUid(name);

    // Check for UID uniqueness
    const existingByUid = await prisma.agent.findUnique({ where: { uid: finalUid } });
    if (existingByUid) {
      // Append random suffix if UID exists
      finalUid = `${finalUid}-${Math.random().toString(36).slice(2, 6)}`;
    }

    // Check for name uniqueness within user's agents
    const existingByName = await prisma.agent.findFirst({
      where: { userId: session.user.id, name },
    });
    if (existingByName) {
      return NextResponse.json(
        { success: false, error: 'An agent with this name already exists' },
        { status: 409 }
      );
    }

    // Create agent with auto-like (user likes their own agent)
    const agent = await prisma.$transaction(async (tx) => {
      const newAgent = await tx.agent.create({
        data: {
          userId: session.user.id,
          uid: finalUid,
          name,
          description,
          provider,
          modelId,
          systemPrompt,
          temperature,
          maxToolCallsPerTurn,
          maxMessagesInContext,
          isPublic,
          likeCount: 1, // Start with 1 like (from owner)
          collections: collectionIds?.length
            ? {
                create: collectionIds.map((collectionId, index) => ({
                  collectionId,
                  position: index,
                })),
              }
            : undefined,
          tools: toolIds?.length
            ? {
                create: toolIds.map((toolId, index) => ({
                  toolId,
                  position: index,
                })),
              }
            : undefined,
        },
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

      // Auto-like the agent
      await tx.agentLike.create({
        data: {
          userId: session.user.id,
          agentId: newAgent.id,
        },
      });

      return newAgent;
    });

    // Log activity (fire-and-forget)
    logActivity({
      userId: session.user.id,
      type: 'AGENT_CREATED',
      targetName: agent.name,
      targetType: 'agent',
      agentId: agent.id,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...agent,
          toolCount: agent._count.tools,
          collectionCount: agent._count.collections,
          _count: undefined,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create agent:', error);
    return NextResponse.json({ success: false, error: 'Failed to create agent' }, { status: 500 });
  }
}
