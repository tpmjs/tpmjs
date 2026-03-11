/**
 * GET /api/skills/activity
 *
 * Fetch recent skill questions for a collection (anonymized for activity feed)
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
  const limit = Math.min(50, Math.max(1, parseInt(limitParam || '10', 10)));

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

    // Fetch recent questions with skill links (anonymized - no agent info)
    const questions = await prisma.skillQuestion.findMany({
      where: { collectionId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        question: true,
        answer: true,
        confidence: true,
        similarCount: true,
        tags: true,
        createdAt: true,
        // Include skills but not agent info for privacy
        skillNodes: {
          select: {
            skill: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('[Skills Activity Error]:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}
