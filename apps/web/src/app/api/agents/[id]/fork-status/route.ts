import { prisma } from '@tpmjs/db';
import { AGENT_LIMITS } from '@tpmjs/types/agent';
import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';

import { apiNotFound, apiSuccess, apiUnauthorized } from '~/lib/api-response';
import { auth } from '~/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/agents/[id]/fork-status
 * Check if the current user has forked this agent
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const requestId = crypto.randomUUID();

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return apiUnauthorized('Authentication required', requestId);
  }

  const { id } = await context.params;

  // Get the source agent
  const agent = await prisma.agent.findUnique({
    where: { id },
    select: { id: true, userId: true, isPublic: true },
  });

  if (!agent) {
    return apiNotFound('Agent', requestId);
  }

  const isOwner = agent.userId === session.user.id;

  // If owner, they can't fork their own agent
  if (isOwner) {
    return apiSuccess(
      {
        hasFork: false,
        fork: null,
        isOwner: true,
        canFork: false,
      },
      { requestId }
    );
  }

  // Check if user already has a fork of this agent
  const existingFork = await prisma.agent.findFirst({
    where: {
      userId: session.user.id,
      forkedFromId: id,
    },
    select: { id: true, uid: true, name: true },
  });

  // Check if user can fork (within limits)
  let canFork = false;
  if (!existingFork && agent.isPublic) {
    const existingCount = await prisma.agent.count({
      where: { userId: session.user.id },
    });
    canFork = existingCount < AGENT_LIMITS.MAX_AGENTS_PER_USER;
  }

  return apiSuccess(
    {
      hasFork: !!existingFork,
      fork: existingFork
        ? {
            id: existingFork.id,
            uid: existingFork.uid,
            name: existingFork.name,
          }
        : null,
      isOwner: false,
      canFork,
    },
    { requestId }
  );
}
