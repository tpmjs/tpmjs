/**
 * Individual Use Case API
 *
 * GET /api/use-cases/[id] - Get a single use case by ID or slug
 */

import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface UseCaseDetail {
  id: string;
  slug: string;
  marketingTitle: string;
  marketingDesc: string;
  roiEstimate: string | null;
  businessValue: string | null;
  problemStatement: string | null;
  solutionNarrative: string | null;
  rankScore: number;
  createdAt: Date;
  lastRegeneratedAt: Date | null;
  personas: Array<{
    persona: { slug: string; name: string; description: string | null; icon: string | null };
  }>;
  industries: Array<{ industry: { slug: string; name: string; description: string | null } }>;
  categories: Array<{
    category: { slug: string; name: string; type: string; description: string | null };
  }>;
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
    description: string | null;
    tags: string[];
    qualityScore: number;
    totalRuns: number;
    lastRunStatus: string | null;
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

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;

    // Find by ID or slug
    const useCase = await prisma.useCase.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        personas: {
          include: {
            persona: {
              select: {
                slug: true,
                name: true,
                description: true,
                icon: true,
              },
            },
          },
        },
        industries: {
          include: {
            industry: {
              select: {
                slug: true,
                name: true,
                description: true,
              },
            },
          },
        },
        categories: {
          include: {
            category: {
              select: {
                slug: true,
                name: true,
                type: true,
                description: true,
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
            description: true,
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
    });

    if (!useCase) {
      return NextResponse.json({ success: false, error: 'Use case not found' }, { status: 404 });
    }

    // Transform response
    const transformedUseCase: UseCaseDetail = {
      id: useCase.id,
      slug: useCase.slug,
      marketingTitle: useCase.marketingTitle,
      marketingDesc: useCase.marketingDesc,
      roiEstimate: useCase.roiEstimate,
      businessValue: useCase.businessValue,
      problemStatement: useCase.problemStatement,
      solutionNarrative: useCase.solutionNarrative,
      rankScore: useCase.rankScore,
      createdAt: useCase.createdAt,
      lastRegeneratedAt: useCase.lastRegeneratedAt,
      personas: useCase.personas,
      industries: useCase.industries,
      categories: useCase.categories,
      socialProof: useCase.socialProof,
      scenario: useCase.scenario,
    };

    return NextResponse.json({
      success: true,
      data: transformedUseCase,
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
