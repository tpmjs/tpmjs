import { prisma } from '@tpmjs/db';
import { AGENT_LIMITS, AddCollectionToAgentSchema } from '@tpmjs/types/agent';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '~/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/agents/[id]/collections
 * List collections attached to an agent
 */
export async function GET(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const { id } = await context.params;

    const agent = await prisma.agent.findUnique({
      where: { id },
      select: { userId: true, isPublic: true },
    });

    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }

    const isOwner = session?.user?.id === agent.userId;
    if (!isOwner && !agent.isPublic) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const collections = await prisma.agentCollection.findMany({
      where: { agentId: id },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            description: true,
            _count: { select: { tools: true } },
          },
        },
      },
      orderBy: { position: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: collections.map((ac) => ({
        id: ac.id,
        collectionId: ac.collectionId,
        position: ac.position,
        addedAt: ac.addedAt,
        collection: {
          id: ac.collection.id,
          name: ac.collection.name,
          description: ac.collection.description,
          toolCount: ac.collection._count.tools,
        },
      })),
    });
  } catch (error) {
    console.error('Failed to get agent collections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get agent collections' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents/[id]/collections
 * Add a collection to an agent
 */
export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = AddCollectionToAgentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check agent ownership
    const agent = await prisma.agent.findUnique({
      where: { id },
      select: { userId: true, _count: { select: { collections: true } } },
    });
    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }
    if (agent.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Check collection limit
    if (agent._count.collections >= AGENT_LIMITS.MAX_COLLECTIONS_PER_AGENT) {
      return NextResponse.json(
        {
          success: false,
          error: `Maximum ${AGENT_LIMITS.MAX_COLLECTIONS_PER_AGENT} collections per agent`,
        },
        { status: 400 }
      );
    }

    // Check collection exists and user has access
    const collection = await prisma.collection.findUnique({
      where: { id: parsed.data.collectionId },
      select: {
        id: true,
        name: true,
        userId: true,
        isPublic: true,
        _count: { select: { tools: true } },
      },
    });
    if (!collection) {
      return NextResponse.json({ success: false, error: 'Collection not found' }, { status: 404 });
    }
    if (collection.userId !== session.user.id && !collection.isPublic) {
      return NextResponse.json(
        { success: false, error: 'Collection access denied' },
        { status: 403 }
      );
    }

    // Check if already added
    const existing = await prisma.agentCollection.findUnique({
      where: {
        agentId_collectionId: { agentId: id, collectionId: parsed.data.collectionId },
      },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Collection already added to agent' },
        { status: 409 }
      );
    }

    // Get next position
    const maxPosition = await prisma.agentCollection.aggregate({
      where: { agentId: id },
      _max: { position: true },
    });
    const position = parsed.data.position ?? (maxPosition._max.position ?? -1) + 1;

    const agentCollection = await prisma.agentCollection.create({
      data: {
        agentId: id,
        collectionId: parsed.data.collectionId,
        position,
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            _count: { select: { tools: true } },
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: agentCollection.id,
          collectionId: agentCollection.collectionId,
          position: agentCollection.position,
          addedAt: agentCollection.addedAt,
          collection: {
            ...agentCollection.collection,
            toolCount: agentCollection.collection._count.tools,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to add collection to agent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add collection' },
      { status: 500 }
    );
  }
}
