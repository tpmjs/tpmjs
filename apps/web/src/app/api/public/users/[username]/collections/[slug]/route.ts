import { prisma } from '@tpmjs/db';
import type { NextRequest } from 'next/server';

import { apiForbidden, apiInternalError, apiNotFound, apiSuccess } from '~/lib/api-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ username: string; slug: string }>;
};

/**
 * GET /api/public/users/[username]/collections/[slug]
 * Get a public collection by username and slug
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const requestId = crypto.randomUUID();

  try {
    const { username: rawUsername, slug } = await context.params;
    const username = rawUsername.startsWith('@') ? rawUsername.slice(1) : rawUsername;

    // Find the user first
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, name: true, image: true },
    });

    if (!user || !user.username) {
      return apiNotFound('User', requestId);
    }

    // Find the collection by slug belonging to this user
    const collection = await prisma.collection.findFirst({
      where: {
        slug,
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
                likeCount: true,
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
          take: 100,
        },
        _count: {
          select: { tools: true },
        },
      },
    });

    if (!collection) {
      return apiNotFound('Collection', requestId);
    }

    // Only return if public
    if (!collection.isPublic) {
      return apiForbidden('This collection is not public', requestId);
    }

    return apiSuccess(
      {
        id: collection.id,
        slug: collection.slug,
        name: collection.name,
        description: collection.description,
        likeCount: collection.likeCount,
        toolCount: collection._count.tools,
        createdAt: collection.createdAt.toISOString(),
        createdBy: {
          id: user.id,
          username: user.username,
          name: user.name,
          image: user.image,
        },
        tools: collection.tools.map((ct) => ({
          id: ct.id,
          toolId: ct.toolId,
          position: ct.position,
          note: ct.note,
          tool: ct.tool,
        })),
      },
      { requestId }
    );
  } catch (error) {
    console.error('[API Error] GET /api/public/users/[username]/collections/[slug]:', error);
    return apiInternalError('Failed to fetch collection', requestId);
  }
}
