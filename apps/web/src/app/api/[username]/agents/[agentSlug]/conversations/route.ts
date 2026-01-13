/**
 * Agent Conversations List Endpoint (Username/Slug-based version)
 *
 * GET: List all conversations for an agent
 *
 * Example: /api/ajax/agents/tpmjs-discord/conversations
 */

import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type RouteContext = {
  params: Promise<{ username: string; agentSlug: string }>;
};

/**
 * GET /api/[username]/agents/[agentSlug]/conversations
 * List all conversations for an agent
 */
export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { username, agentSlug } = await context.params;
  const { searchParams } = new URL(request.url);

  const limit = Math.min(Number.parseInt(searchParams.get('limit') || '20', 10), 100);
  const offset = Number.parseInt(searchParams.get('offset') || '0', 10);

  try {
    // Fetch agent by username and slug
    const agent = await prisma.agent.findFirst({
      where: {
        uid: agentSlug,
        user: { username },
      },
      select: { id: true },
    });

    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }

    // Fetch conversations with message count
    const conversations = await prisma.conversation.findMany({
      where: { agentId: agent.id },
      orderBy: { updatedAt: 'desc' },
      take: limit + 1,
      skip: offset,
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    const hasMore = conversations.length > limit;
    const data = hasMore ? conversations.slice(0, limit) : conversations;

    return NextResponse.json({
      success: true,
      data: data.map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        messageCount: c._count.messages,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      pagination: {
        limit,
        offset,
        hasMore,
      },
    });
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
