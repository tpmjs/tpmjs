import { prisma } from '@tpmjs/db';
import { UpdateAgentSchema } from '@tpmjs/types/agent';
import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';

import { logActivity } from '~/lib/activity';
import {
  apiConflict,
  apiForbidden,
  apiInternalError,
  apiNotFound,
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
} from '~/lib/api-response';
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
export async function GET(_request: NextRequest, context: RouteContext) {
  const requestId = crypto.randomUUID();

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
          take: 50, // Limit to prevent excessive data fetch
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
          take: 100, // Limit to prevent excessive data fetch
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
      return apiNotFound('Agent', requestId);
    }

    // Check access - owner or public
    const isOwner = session?.user?.id === agent.userId;
    if (!isOwner && !agent.isPublic) {
      return apiForbidden('Access denied', requestId);
    }

    return apiSuccess(
      {
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
      { requestId }
    );
  } catch (error) {
    console.error('Failed to get agent:', error);
    return apiInternalError('Failed to get agent', requestId);
  }
}

/**
 * PATCH /api/agents/[id]
 * Update an agent's configuration
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const requestId = crypto.randomUUID();

  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return apiUnauthorized('Authentication required', requestId);
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = UpdateAgentSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(
        'Invalid request body',
        { errors: parsed.error.flatten().fieldErrors },
        requestId
      );
    }

    // Check ownership
    const existing = await prisma.agent.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing) {
      return apiNotFound('Agent', requestId);
    }
    if (existing.userId !== session.user.id) {
      return apiForbidden('Access denied', requestId);
    }

    // Check UID uniqueness if being changed
    if (parsed.data.uid) {
      const existingByUid = await prisma.agent.findFirst({
        where: { uid: parsed.data.uid, id: { not: id } },
      });
      if (existingByUid) {
        return apiConflict('UID already in use', requestId);
      }
    }

    // Check name uniqueness if being changed
    if (parsed.data.name) {
      const existingByName = await prisma.agent.findFirst({
        where: { userId: session.user.id, name: parsed.data.name, id: { not: id } },
      });
      if (existingByName) {
        return apiConflict('An agent with this name already exists', requestId);
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

    // Log activity (fire-and-forget)
    logActivity({
      userId: session.user.id,
      type: 'AGENT_UPDATED',
      targetName: agent.name,
      targetType: 'agent',
      agentId: agent.id,
    });

    return apiSuccess(
      {
        ...agent,
        toolCount: agent._count.tools,
        collectionCount: agent._count.collections,
        _count: undefined,
      },
      { requestId }
    );
  } catch (error) {
    console.error('Failed to update agent:', error);
    return apiInternalError('Failed to update agent', requestId);
  }
}

/**
 * DELETE /api/agents/[id]
 * Delete an agent and all its conversations
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const requestId = crypto.randomUUID();

  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return apiUnauthorized('Authentication required', requestId);
    }

    const { id } = await context.params;

    // Check ownership and get name for activity log
    const existing = await prisma.agent.findUnique({
      where: { id },
      select: { userId: true, name: true },
    });
    if (!existing) {
      return apiNotFound('Agent', requestId);
    }
    if (existing.userId !== session.user.id) {
      return apiForbidden('Access denied', requestId);
    }

    await prisma.agent.delete({ where: { id } });

    // Log activity (fire-and-forget) - note: agentId is not included since agent is deleted
    logActivity({
      userId: session.user.id,
      type: 'AGENT_DELETED',
      targetName: existing.name,
      targetType: 'agent',
    });

    return apiSuccess({ deleted: true }, { requestId });
  } catch (error) {
    console.error('Failed to delete agent:', error);
    return apiInternalError('Failed to delete agent', requestId);
  }
}
