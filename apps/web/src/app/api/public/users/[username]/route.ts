import { prisma } from '@tpmjs/db';
import type { NextRequest } from 'next/server';

import { apiInternalError, apiNotFound, apiSuccess } from '~/lib/api-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ username: string }>;
};

/**
 * GET /api/public/users/[username]
 * Get a user's public profile by username
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const requestId = crypto.randomUUID();

  try {
    const { username: rawUsername } = await context.params;
    // Handle @ prefix
    const username = rawUsername.startsWith('@') ? rawUsername.slice(1) : rawUsername;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        image: true,
        agents: {
          where: { isPublic: true },
          select: {
            id: true,
            uid: true,
            name: true,
            description: true,
            likeCount: true,
            _count: { select: { tools: true } },
          },
          orderBy: { likeCount: 'desc' },
          take: 20,
        },
        collections: {
          where: { isPublic: true },
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            likeCount: true,
            _count: { select: { tools: true } },
          },
          orderBy: { likeCount: 'desc' },
          take: 20,
        },
      },
    });

    if (!user || !user.username) {
      return apiNotFound('User', requestId);
    }

    return apiSuccess(
      {
        id: user.id,
        username: user.username,
        name: user.name,
        image: user.image,
        agents: user.agents.map((a) => ({
          id: a.id,
          uid: a.uid,
          name: a.name,
          description: a.description,
          likeCount: a.likeCount,
          toolCount: a._count.tools,
        })),
        collections: user.collections.map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          description: c.description,
          likeCount: c.likeCount,
          toolCount: c._count.tools,
        })),
      },
      { requestId }
    );
  } catch (error) {
    console.error('[API Error] GET /api/public/users/[username]:', error);
    return apiInternalError('Failed to fetch user profile', requestId);
  }
}
