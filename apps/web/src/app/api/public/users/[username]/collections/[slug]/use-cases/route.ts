/**
 * Collection Use Cases API
 *
 * GET /api/public/users/[username]/collections/[slug]/use-cases
 * Get all use cases for a specific collection
 */

import { prisma } from '@tpmjs/db';
import type { NextRequest } from 'next/server';

import { apiForbidden, apiInternalError, apiNotFound, apiSuccess } from '~/lib/api-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type RouteContext = {
  params: Promise<{ username: string; slug: string }>;
};

/**
 * GET /api/public/users/[username]/collections/[slug]/use-cases
 * Get all use cases for a specific collection
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const requestId = crypto.randomUUID();

  try {
    const { username: rawUsername, slug } = await context.params;
    const username = rawUsername.startsWith('@') ? rawUsername.slice(1) : rawUsername;

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const persona = searchParams.get('persona');
    const industry = searchParams.get('industry');
    const category = searchParams.get('category');
    const searchQuery = searchParams.get('search');
    const sort = (searchParams.get('sort') || 'rank') as 'rank' | 'quality' | 'runs' | 'recent';
    const limit = Math.min(Number.parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = Number.parseInt(searchParams.get('offset') || '0', 10);

    // Find the user first
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true },
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
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        isPublic: true,
      },
    });

    if (!collection) {
      return apiNotFound('Collection', requestId);
    }

    // Only return if public
    if (!collection.isPublic) {
      return apiForbidden('This collection is not public', requestId);
    }

    // Build where clause for use cases
    const where: Record<string, unknown> = {
      scenario: {
        collectionId: collection.id,
      },
    };

    if (persona) {
      where.personas = {
        some: {
          persona: { slug: persona },
        },
      };
    }

    if (industry) {
      where.industries = {
        some: {
          industry: { slug: industry },
        },
      };
    }

    if (category) {
      where.categories = {
        some: {
          category: { slug: category },
        },
      };
    }

    if (searchQuery) {
      where.OR = [
        { marketingTitle: { contains: searchQuery, mode: 'insensitive' } },
        { marketingDesc: { contains: searchQuery, mode: 'insensitive' } },
        { businessValue: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    // Build order by
    const orderBy: {
      rankScore?: 'asc' | 'desc';
      socialProof?: { qualityScore?: 'asc' | 'desc'; totalRuns?: 'asc' | 'desc' };
      createdAt?: 'asc' | 'desc';
    } = {};
    if (sort === 'quality') {
      orderBy.socialProof = { qualityScore: 'desc' };
    } else if (sort === 'runs') {
      orderBy.socialProof = { totalRuns: 'desc' };
    } else if (sort === 'recent') {
      orderBy.createdAt = 'desc';
    } else {
      orderBy.rankScore = 'desc';
    }

    // Get total count
    const total = await prisma.useCase.count({ where });

    // Fetch use cases
    const useCases = await prisma.useCase.findMany({
      where,
      include: {
        personas: {
          select: {
            persona: {
              select: {
                slug: true,
                name: true,
              },
            },
          },
        },
        industries: {
          select: {
            industry: {
              select: {
                slug: true,
                name: true,
              },
            },
          },
        },
        categories: {
          select: {
            category: {
              select: {
                slug: true,
                name: true,
                type: true,
              },
            },
          },
        },
        socialProof: true,
        scenario: {
          select: {
            id: true,
            prompt: true,
            name: true,
            tags: true,
            qualityScore: true,
            totalRuns: true,
            lastRunStatus: true,
            collection: {
              select: {
                id: true,
                name: true,
                slug: true,
                user: {
                  select: {
                    username: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy,
      take: limit,
      skip: offset,
    });

    return apiSuccess(
      {
        collection: {
          id: collection.id,
          slug: collection.slug,
          name: collection.name,
          description: collection.description,
        },
        useCases,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
      { requestId }
    );
  } catch (error) {
    console.error(
      '[API Error] GET /api/public/users/[username]/collections/[slug]/use-cases:',
      error
    );
    return apiInternalError('Failed to fetch use cases', requestId);
  }
}
