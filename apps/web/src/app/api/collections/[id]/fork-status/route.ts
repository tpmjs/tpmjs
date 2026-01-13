import { prisma } from '@tpmjs/db';
import { COLLECTION_LIMITS } from '@tpmjs/types/collection';
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
 * GET /api/collections/[id]/fork-status
 * Check if the current user has forked this collection
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const requestId = crypto.randomUUID();

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return apiUnauthorized('Authentication required', requestId);
  }

  const { id } = await context.params;

  // Get the source collection
  const collection = await prisma.collection.findUnique({
    where: { id },
    select: { id: true, userId: true, isPublic: true },
  });

  if (!collection) {
    return apiNotFound('Collection', requestId);
  }

  const isOwner = collection.userId === session.user.id;

  // If owner, they can't fork their own collection
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

  // Check if user already has a fork of this collection
  const existingFork = await prisma.collection.findFirst({
    where: {
      userId: session.user.id,
      forkedFromId: id,
    },
    select: { id: true, slug: true, name: true },
  });

  // Check if user can fork (within limits)
  let canFork = false;
  if (!existingFork && collection.isPublic) {
    const existingCount = await prisma.collection.count({
      where: { userId: session.user.id },
    });
    canFork = existingCount < COLLECTION_LIMITS.MAX_COLLECTIONS_PER_USER;
  }

  return apiSuccess(
    {
      hasFork: !!existingFork,
      fork: existingFork
        ? {
            id: existingFork.id,
            slug: existingFork.slug,
            name: existingFork.name,
          }
        : null,
      isOwner: false,
      canFork,
    },
    { requestId }
  );
}
