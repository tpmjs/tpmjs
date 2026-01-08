import { prisma } from '@tpmjs/db';
import type { NextRequest } from 'next/server';

import { apiForbidden, apiInternalError, apiNotFound, apiSuccess } from '~/lib/api-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ username: string; uid: string }>;
};

/**
 * GET /api/public/users/[username]/agents/[uid]
 * Get a public agent by username and uid
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const requestId = crypto.randomUUID();

  try {
    const { username: rawUsername, uid } = await context.params;
    const username = rawUsername.startsWith('@') ? rawUsername.slice(1) : rawUsername;

    // Find the user first
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, name: true, image: true },
    });

    if (!user || !user.username) {
      return apiNotFound('User', requestId);
    }

    // Find the agent by uid belonging to this user
    const agent = await prisma.agent.findFirst({
      where: {
        uid,
        userId: user.id,
      },
      include: {
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
          take: 50,
        },
        collections: {
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
          take: 20,
        },
        _count: {
          select: { tools: true, collections: true },
        },
      },
    });

    if (!agent) {
      return apiNotFound('Agent', requestId);
    }

    // Only return if public
    if (!agent.isPublic) {
      return apiForbidden('This agent is not public', requestId);
    }

    return apiSuccess(
      {
        id: agent.id,
        uid: agent.uid,
        name: agent.name,
        description: agent.description,
        provider: agent.provider,
        modelId: agent.modelId,
        systemPrompt: agent.systemPrompt,
        temperature: agent.temperature,
        likeCount: agent.likeCount,
        toolCount: agent._count.tools,
        collectionCount: agent._count.collections,
        createdAt: agent.createdAt.toISOString(),
        createdBy: {
          id: user.id,
          username: user.username,
          name: user.name,
          image: user.image,
        },
        tools: agent.tools.map((at) => ({
          id: at.id,
          toolId: at.toolId,
          position: at.position,
          tool: at.tool,
        })),
        collections: agent.collections.map((ac) => ({
          id: ac.id,
          collectionId: ac.collectionId,
          collection: {
            id: ac.collection.id,
            name: ac.collection.name,
            description: ac.collection.description,
            toolCount: ac.collection._count.tools,
          },
        })),
      },
      { requestId }
    );
  } catch (error) {
    console.error('[API Error] GET /api/public/users/[username]/agents/[uid]:', error);
    return apiInternalError('Failed to fetch agent', requestId);
  }
}
