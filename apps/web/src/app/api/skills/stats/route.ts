/**
 * GET /api/skills/stats
 *
 * Get skill statistics for a collection
 */

import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const collectionId = searchParams.get('collectionId');

  if (!collectionId) {
    return NextResponse.json({ error: 'collectionId is required' }, { status: 400 });
  }

  try {
    // Verify collection exists and is public
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      select: { id: true, isPublic: true },
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    if (!collection.isPublic) {
      return NextResponse.json({ error: 'Collection is not public' }, { status: 403 });
    }

    // Fetch stats in parallel
    const [totalQuestions, totalSkills, topSkills] = await Promise.all([
      prisma.skillQuestion.count({ where: { collectionId } }),
      prisma.skill.count({ where: { collectionId } }),
      prisma.skill.findMany({
        where: { collectionId },
        orderBy: { questionCount: 'desc' },
        take: 10,
        select: {
          name: true,
          questionCount: true,
          confidence: true,
        },
      }),
    ]);

    return NextResponse.json({
      totalQuestions,
      totalSkills,
      topSkills,
    });
  } catch (error) {
    console.error('[Skills Stats Error]:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
