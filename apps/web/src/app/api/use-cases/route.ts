/**
 * Use Cases API - Global Directory
 *
 * GET /api/use-cases - List all use cases with filtering and pagination
 */

import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface UseCaseWithRelations {
  id: string;
  slug: string;
  marketingTitle: string;
  marketingDesc: string;
  roiEstimate: string | null;
  businessValue: string | null;
  rankScore: number;
  createdAt: Date;
  lastRegeneratedAt: Date | null;
  personas: Array<{ persona: { slug: string; name: string } }>;
  industries: Array<{ industry: { slug: string; name: string } }>;
  categories: Array<{ category: { slug: string; name: string; type: string } }>;
  socialProof: {
    qualityScore: number;
    totalRuns: number;
    consecutivePasses: number;
    lastRunStatus: string | null;
    lastRunAt: Date | null;
    successRate: number | null;
    lastRunAgo: string | null;
  } | null;
  scenario: {
    id: string;
    prompt: string;
    name: string | null;
    tags: string[];
    collection: {
      id: string;
      name: string;
      slug: string | null;
      user: {
        username: string | null;
      };
    } | null;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const persona = searchParams.get('persona');
    const industry = searchParams.get('industry');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = (searchParams.get('sort') || 'rank') as 'rank' | 'quality' | 'runs' | 'recent';
    const limit = Math.min(Number.parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = Number.parseInt(searchParams.get('offset') || '0', 10);

    // Build where clause
    const where: Record<string, unknown> = {};

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

    if (search) {
      where.OR = [
        { marketingTitle: { contains: search, mode: 'insensitive' } },
        { marketingDesc: { contains: search, mode: 'insensitive' } },
        { businessValue: { contains: search, mode: 'insensitive' } },
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

    // Transform response
    const transformedUseCases: UseCaseWithRelations[] = useCases.map((uc) => ({
      id: uc.id,
      slug: uc.slug,
      marketingTitle: uc.marketingTitle,
      marketingDesc: uc.marketingDesc,
      roiEstimate: uc.roiEstimate,
      businessValue: uc.businessValue,
      rankScore: uc.rankScore,
      createdAt: uc.createdAt,
      lastRegeneratedAt: uc.lastRegeneratedAt,
      personas: uc.personas,
      industries: uc.industries,
      categories: uc.categories,
      socialProof: uc.socialProof,
      scenario: uc.scenario,
    }));

    return NextResponse.json({
      success: true,
      data: {
        useCases: transformedUseCases,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
