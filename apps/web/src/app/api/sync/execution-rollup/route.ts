import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireCronAuth } from '~/lib/cron-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * POST /api/sync/execution-rollup
 * Daily cron: aggregates ExecutionEvent counts into denormalized fields
 * on Tool, Collection, and Agent models.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: cron handler with sequential entity type processing
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  const unauthorized = requireCronAuth(request);
  if (unauthorized) return unauthorized;

  try {
    let totalUpdated = 0;

    // 1. Aggregate execution counts by toolId
    const toolCounts = await prisma.executionEvent.groupBy({
      by: ['toolId'],
      where: { toolId: { not: null } },
      _count: { id: true },
    });

    for (const tc of toolCounts) {
      if (!tc.toolId || tc._count.id === 0) continue;
      try {
        await prisma.tool.update({
          where: { id: tc.toolId },
          data: { executionCount: tc._count.id },
        });
        totalUpdated++;
      } catch {
        // Entity may have been deleted - skip silently
      }
    }

    // 2. Aggregate execution counts by collectionId
    const collectionCounts = await prisma.executionEvent.groupBy({
      by: ['collectionId'],
      where: { collectionId: { not: null } },
      _count: { id: true },
    });

    for (const cc of collectionCounts) {
      if (!cc.collectionId || cc._count.id === 0) continue;
      try {
        await prisma.collection.update({
          where: { id: cc.collectionId },
          data: { executionCount: cc._count.id },
        });
        totalUpdated++;
      } catch {
        // Entity may have been deleted - skip silently
      }
    }

    // 3. Aggregate execution counts by agentId (agent_run events)
    const agentExecCounts = await prisma.executionEvent.groupBy({
      by: ['agentId'],
      where: { agentId: { not: null } },
      _count: { id: true },
    });

    for (const ac of agentExecCounts) {
      if (!ac.agentId || ac._count.id === 0) continue;
      try {
        await prisma.agent.update({
          where: { id: ac.agentId },
          data: { executionCount: ac._count.id },
        });
        totalUpdated++;
      } catch {
        // Entity may have been deleted - skip silently
      }
    }

    // 4. Count conversations per agent
    const conversationCounts = await prisma.conversation.groupBy({
      by: ['agentId'],
      _count: { id: true },
    });

    for (const cc of conversationCounts) {
      if (cc._count.id === 0) continue;
      try {
        await prisma.agent.update({
          where: { id: cc.agentId },
          data: { conversationCount: cc._count.id },
        });
        totalUpdated++;
      } catch {
        // Entity may have been deleted - skip silently
      }
    }

    // 5. Count messages per agent (via conversations)
    const messageCounts = await prisma.message.groupBy({
      by: ['conversationId'],
      _count: { id: true },
    });

    // Aggregate messages by agent
    const agentMessageMap = new Map<string, number>();
    if (messageCounts.length > 0) {
      const conversationIds = messageCounts.map((mc) => mc.conversationId);
      const conversations = await prisma.conversation.findMany({
        where: { id: { in: conversationIds } },
        select: { id: true, agentId: true },
      });
      const convToAgent = new Map(conversations.map((c) => [c.id, c.agentId]));

      for (const mc of messageCounts) {
        const agentId = convToAgent.get(mc.conversationId);
        if (agentId) {
          agentMessageMap.set(agentId, (agentMessageMap.get(agentId) || 0) + mc._count.id);
        }
      }
    }

    for (const [agentId, count] of agentMessageMap) {
      try {
        await prisma.agent.update({
          where: { id: agentId },
          data: { messageCount: count },
        });
        totalUpdated++;
      } catch {
        // Entity may have been deleted - skip silently
      }
    }

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        totalUpdated,
        durationMs,
      },
    });
  } catch (error) {
    console.error('[sync/execution-rollup] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
