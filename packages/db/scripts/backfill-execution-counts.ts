/**
 * One-time backfill script to populate denormalized execution/conversation/message counts.
 *
 * Run with: cd packages/db && npx tsx scripts/backfill-execution-counts.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: one-time backfill script
async function main() {
  console.log('Starting execution count backfill...');

  // 1. Tool execution counts
  const toolCounts = await prisma.executionEvent.groupBy({
    by: ['toolId'],
    where: { toolId: { not: null } },
    _count: { id: true },
  });

  let updated = 0;
  for (const tc of toolCounts) {
    if (!tc.toolId || tc._count.id === 0) continue;
    try {
      await prisma.tool.update({
        where: { id: tc.toolId },
        data: { executionCount: tc._count.id },
      });
      updated++;
    } catch {
      // Entity may have been deleted
    }
  }
  console.log(`Updated ${updated} tools with execution counts`);

  // 2. Collection execution counts
  const collectionCounts = await prisma.executionEvent.groupBy({
    by: ['collectionId'],
    where: { collectionId: { not: null } },
    _count: { id: true },
  });

  updated = 0;
  for (const cc of collectionCounts) {
    if (!cc.collectionId || cc._count.id === 0) continue;
    try {
      await prisma.collection.update({
        where: { id: cc.collectionId },
        data: { executionCount: cc._count.id },
      });
      updated++;
    } catch {
      // Entity may have been deleted
    }
  }
  console.log(`Updated ${updated} collections with execution counts`);

  // 3. Agent execution counts
  const agentExecCounts = await prisma.executionEvent.groupBy({
    by: ['agentId'],
    where: { agentId: { not: null } },
    _count: { id: true },
  });

  updated = 0;
  for (const ac of agentExecCounts) {
    if (!ac.agentId || ac._count.id === 0) continue;
    try {
      await prisma.agent.update({
        where: { id: ac.agentId },
        data: { executionCount: ac._count.id },
      });
      updated++;
    } catch {
      // Entity may have been deleted
    }
  }
  console.log(`Updated ${updated} agents with execution counts`);

  // 4. Conversation counts per agent
  const conversationCounts = await prisma.conversation.groupBy({
    by: ['agentId'],
    _count: { id: true },
  });

  updated = 0;
  for (const cc of conversationCounts) {
    if (cc._count.id === 0) continue;
    try {
      await prisma.agent.update({
        where: { id: cc.agentId },
        data: { conversationCount: cc._count.id },
      });
      updated++;
    } catch {
      // Entity may have been deleted
    }
  }
  console.log(`Updated ${updated} agents with conversation counts`);

  // 5. Message counts per agent
  const messageCounts = await prisma.message.groupBy({
    by: ['conversationId'],
    _count: { id: true },
  });

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

  updated = 0;
  for (const [agentId, count] of agentMessageMap) {
    try {
      await prisma.agent.update({
        where: { id: agentId },
        data: { messageCount: count },
      });
      updated++;
    } catch {
      // Entity may have been deleted
    }
  }
  console.log(`Updated ${updated} agents with message counts`);

  console.log('Backfill complete!');
}

main()
  .catch((e) => {
    console.error('Backfill failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
