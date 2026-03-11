/**
 * GET /api/skills/questions
 *
 * List all skill questions for a collection with pagination
 */

import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const collectionId = searchParams.get('collectionId');
  const limitParam = searchParams.get('limit');
  const offsetParam = searchParams.get('offset');
  const skillSlug = searchParams.get('skill');

  const limit = Math.min(50, Math.max(1, parseInt(limitParam || '20', 10)));
  const offset = Math.max(0, parseInt(offsetParam || '0', 10));

  if (!collectionId) {
    return NextResponse.json({ error: 'collectionId is required' }, { status: 400 });
  }

  try {
    // Verify collection exists and is public
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      select: {
        id: true,
        isPublic: true,
        name: true,
        slug: true,
        user: { select: { username: true } },
      },
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    if (!collection.isPublic) {
      return NextResponse.json({ error: 'Collection is not public' }, { status: 403 });
    }

    // Build where clause
    const where: {
      collectionId: string;
      skillNodes?: { some: { skill: { slug: string } } };
    } = { collectionId };

    // Filter by skill if provided
    if (skillSlug) {
      where.skillNodes = {
        some: {
          skill: { slug: skillSlug },
        },
      };
    }

    // Fetch questions with pagination
    const questions = await prisma.skillQuestion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // Fetch one extra to check hasMore
      skip: offset,
      select: {
        id: true,
        question: true,
        answer: true,
        confidence: true,
        similarCount: true,
        tags: true,
        createdAt: true,
        skillNodes: {
          select: {
            relevance: true,
            skill: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        toolNodes: {
          select: {
            relevance: true,
            tool: {
              select: {
                id: true,
                name: true,
                package: {
                  select: {
                    npmPackageName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const hasMore = questions.length > limit;
    const data = hasMore ? questions.slice(0, limit) : questions;

    return NextResponse.json({
      success: true,
      data,
      collection: {
        id: collection.id,
        name: collection.name,
        slug: collection.slug,
        username: collection.user.username,
      },
      pagination: {
        limit,
        offset,
        hasMore,
      },
    });
  } catch (error) {
    console.error('[Skills Questions List Error]:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}
