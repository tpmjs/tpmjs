import { prisma } from '@tpmjs/db';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 10;

// Only show these activity types publicly (positive actions, not deletions/unlikes)
const PUBLIC_ACTIVITY_TYPES = [
  'TOOL_LIKED',
  'TOOL_EXECUTED',
  'COLLECTION_CREATED',
  'COLLECTION_FORKED',
  'COLLECTION_TOOL_ADDED',
  'COLLECTION_TOOLS_BULK_ADDED',
  'AGENT_CREATED',
  'AGENT_FORKED',
  'AGENT_LIKED',
  'AGENT_CONVERSATION_STARTED',
  'COLLECTION_LIKED',
] as const;

/**
 * GET /api/activity/public
 * Returns recent public activity for the homepage activity stream.
 * Cached for 30 seconds with stale-while-revalidate.
 */
export async function GET() {
  try {
    const activities = await prisma.userActivity.findMany({
      where: {
        type: { in: [...PUBLIC_ACTIVITY_TYPES] },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        type: true,
        targetName: true,
        targetType: true,
        createdAt: true,
        user: {
          select: {
            username: true,
            name: true,
          },
        },
      },
    });

    const data = activities.map((a) => ({
      id: a.id,
      type: mapActivityType(a.type),
      username: a.user.username || a.user.name,
      targetName: a.targetName,
      targetType: a.targetType,
      createdAt: a.createdAt,
    }));

    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          'Cache-Control': 's-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('[activity/public] Error:', error);
    return NextResponse.json({ success: true, data: [] });
  }
}

function mapActivityType(type: string): 'invoked' | 'published' | 'updated' {
  switch (type) {
    case 'TOOL_LIKED':
    case 'TOOL_EXECUTED':
    case 'COLLECTION_LIKED':
    case 'AGENT_LIKED':
    case 'AGENT_CONVERSATION_STARTED':
      return 'invoked';
    case 'COLLECTION_CREATED':
    case 'AGENT_CREATED':
      return 'published';
    case 'COLLECTION_FORKED':
    case 'AGENT_FORKED':
    case 'COLLECTION_TOOL_ADDED':
    case 'COLLECTION_TOOLS_BULK_ADDED':
      return 'updated';
    default:
      return 'updated';
  }
}
