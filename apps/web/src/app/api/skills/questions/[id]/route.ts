/**
 * GET /api/skills/questions/[id]
 *
 * Fetch a single skill question with full details
 */

import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    // Fetch the question with all related data
    const question = await prisma.skillQuestion.findUnique({
      where: { id },
      select: {
        id: true,
        question: true,
        answer: true,
        confidence: true,
        similarCount: true,
        tags: true,
        answerTokens: true,
        createdAt: true,
        updatedAt: true,
        collection: {
          select: {
            id: true,
            name: true,
            slug: true,
            isPublic: true,
            user: {
              select: {
                username: true,
              },
            },
          },
        },
        skillNodes: {
          select: {
            relevance: true,
            skill: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                questionCount: true,
              },
            },
          },
          orderBy: { relevance: 'desc' },
        },
        toolNodes: {
          select: {
            relevance: true,
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
          orderBy: { relevance: 'desc' },
        },
      },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Check if collection is public
    if (!question.collection.isPublic) {
      return NextResponse.json(
        { error: 'Question belongs to a private collection' },
        { status: 403 }
      );
    }

    // Fetch similar questions (based on same skills)
    const skillIds = question.skillNodes.map((sn) => sn.skill.id);
    const similarQuestions =
      skillIds.length > 0
        ? await prisma.skillQuestion.findMany({
            where: {
              id: { not: id },
              collectionId: question.collection.id,
              skillNodes: {
                some: {
                  skillId: { in: skillIds },
                },
              },
            },
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              question: true,
              confidence: true,
              createdAt: true,
            },
          })
        : [];

    return NextResponse.json({
      success: true,
      data: {
        ...question,
        similarQuestions,
      },
    });
  } catch (error) {
    console.error('[Skills Question Detail Error]:', error);
    return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 });
  }
}
