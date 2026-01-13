import { prisma } from '@tpmjs/db';
import { AGENT_LIMITS, CloneAgentSchema } from '@tpmjs/types/agent';
import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';

import { logActivity } from '~/lib/activity';
import {
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
 * Generate a URL-friendly UID from a name
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

/**
 * Generate a unique UID for an agent (globally unique)
 */
async function generateUniqueUid(baseName: string): Promise<string> {
  let uid = slugify(baseName);
  if (!uid) uid = 'agent';

  // Check if uid exists globally
  const existing = await prisma.agent.findUnique({
    where: { uid },
    select: { id: true },
  });

  if (!existing) return uid;

  // Append numbers until unique
  let counter = 1;
  while (counter < 1000) {
    const candidate = `${uid.slice(0, 46)}-${counter}`;
    const exists = await prisma.agent.findUnique({
      where: { uid: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
    counter++;
  }

  // Fallback: use random suffix
  return `${uid.slice(0, 42)}-${Date.now().toString(36)}`;
}

/**
 * POST /api/agents/[id]/clone
 * Clone a public agent to the current user's account
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const requestId = crypto.randomUUID();

  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return apiUnauthorized('Authentication required', requestId);
    }

    const { id } = await context.params;

    // Get the source agent
    const sourceAgent = await prisma.agent.findUnique({
      where: { id },
      include: {
        tools: {
          select: { toolId: true, position: true },
        },
        collections: {
          select: { collectionId: true, position: true },
        },
      },
    });

    if (!sourceAgent) {
      return apiNotFound('Agent', requestId);
    }

    // Only public agents can be cloned
    if (!sourceAgent.isPublic) {
      return apiForbidden('Only public agents can be cloned', requestId);
    }

    // Don't allow cloning your own agent
    if (sourceAgent.userId === session.user.id) {
      return apiValidationError('Cannot clone your own agent', undefined, requestId);
    }

    // Check agent limit
    const existingCount = await prisma.agent.count({
      where: { userId: session.user.id },
    });

    if (existingCount >= AGENT_LIMITS.MAX_AGENTS_PER_USER) {
      return apiValidationError(
        `Maximum ${AGENT_LIMITS.MAX_AGENTS_PER_USER} agents allowed`,
        undefined,
        requestId
      );
    }

    // Parse optional body for custom name/uid
    let customName: string | undefined;
    let customUid: string | undefined;

    try {
      const body = await request.json();
      const parsed = CloneAgentSchema.safeParse(body);
      if (parsed.success) {
        customName = parsed.data.name;
        customUid = parsed.data.uid;
      }
    } catch {
      // No body or invalid JSON - use defaults
    }

    // Generate name and uid
    const name = customName || `${sourceAgent.name} (copy)`;
    const uid = customUid || (await generateUniqueUid(name));

    // Verify uid uniqueness
    if (customUid) {
      const existingUid = await prisma.agent.findUnique({
        where: { uid: customUid },
        select: { id: true },
      });
      if (existingUid) {
        return apiValidationError('UID is already taken', { uid: customUid }, requestId);
      }
    }

    // Create the forked agent with all its relationships
    // NOTE: envVars and executorConfig are NOT copied - user must add their own
    const forkedAgent = await prisma.$transaction(async (tx) => {
      // Create the agent with fork reference
      const newAgent = await tx.agent.create({
        data: {
          userId: session.user.id,
          uid,
          name,
          description: sourceAgent.description,
          provider: sourceAgent.provider,
          modelId: sourceAgent.modelId,
          systemPrompt: sourceAgent.systemPrompt,
          temperature: sourceAgent.temperature,
          maxToolCallsPerTurn: sourceAgent.maxToolCallsPerTurn,
          maxMessagesInContext: sourceAgent.maxMessagesInContext,
          isPublic: false, // Forked agents start as private
          likeCount: 1, // Start with 1 like (from owner)
          forkedFromId: sourceAgent.id, // Track fork origin
          // NOTE: envVars is intentionally NOT copied - user adds their own API keys
          // NOTE: executorConfig is intentionally NOT copied - user configures their own
        },
      });

      // Increment fork count on source agent
      await tx.agent.update({
        where: { id: sourceAgent.id },
        data: { forkCount: { increment: 1 } },
      });

      // Auto-like the agent
      await tx.agentLike.create({
        data: {
          userId: session.user.id,
          agentId: newAgent.id,
        },
      });

      // Clone tool relationships
      if (sourceAgent.tools.length > 0) {
        await tx.agentTool.createMany({
          data: sourceAgent.tools.map((at) => ({
            agentId: newAgent.id,
            toolId: at.toolId,
            position: at.position,
          })),
        });
      }

      // Clone collection relationships (only user's own collections)
      const userCollectionIds = await tx.collection.findMany({
        where: {
          userId: session.user.id,
          id: { in: sourceAgent.collections.map((ac) => ac.collectionId) },
        },
        select: { id: true },
      });

      if (userCollectionIds.length > 0) {
        const validCollectionIds = new Set(userCollectionIds.map((c) => c.id));
        await tx.agentCollection.createMany({
          data: sourceAgent.collections
            .filter((ac) => validCollectionIds.has(ac.collectionId))
            .map((ac) => ({
              agentId: newAgent.id,
              collectionId: ac.collectionId,
              position: ac.position,
            })),
        });
      }

      return newAgent;
    });

    // Log activity as FORK
    logActivity({
      userId: session.user.id,
      type: 'AGENT_FORKED',
      targetName: forkedAgent.name,
      targetType: 'agent',
      agentId: forkedAgent.id,
      metadata: {
        sourceAgentId: sourceAgent.id,
        sourceAgentName: sourceAgent.name,
      },
    });

    return apiSuccess(
      {
        id: forkedAgent.id,
        uid: forkedAgent.uid,
        name: forkedAgent.name,
        description: forkedAgent.description,
        isPublic: forkedAgent.isPublic,
        forkedFromId: forkedAgent.forkedFromId,
        createdAt: forkedAgent.createdAt,
      },
      { requestId, status: 201 }
    );
  } catch (error) {
    console.error('[API Error] POST /api/agents/[id]/clone:', error);
    return apiInternalError('Failed to clone agent', requestId);
  }
}
