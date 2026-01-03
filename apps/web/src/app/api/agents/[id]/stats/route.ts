/**
 * Agent Statistics Endpoint
 *
 * GET: Retrieve aggregated statistics for an agent's conversations
 */

import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type RouteContext = {
  params: Promise<{ id: string }>;
};

interface AgentStats {
  agent: {
    id: string;
    uid: string;
    name: string;
    provider: string;
    modelId: string;
    createdAt: string;
  };
  conversations: {
    total: number;
    last24h: number;
    last7d: number;
    last30d: number;
  };
  messages: {
    total: number;
    byRole: {
      user: number;
      assistant: number;
      tool: number;
      system: number;
    };
    last24h: number;
    last7d: number;
  };
  tokens: {
    totalInput: number;
    totalOutput: number;
    total: number;
    averagePerConversation: number;
    last24h: {
      input: number;
      output: number;
    };
    last7d: {
      input: number;
      output: number;
    };
  };
  tools: {
    totalCalls: number;
    uniqueToolsUsed: number;
    topTools: Array<{
      name: string;
      count: number;
    }>;
    last24h: number;
  };
  activity: {
    firstConversation: string | null;
    lastConversation: string | null;
    averageMessagesPerConversation: number;
    longestConversation: {
      id: string;
      slug: string;
      messageCount: number;
    } | null;
  };
}

/**
 * GET /api/agents/[id]/stats
 * Retrieve aggregated statistics for an agent (accepts id or uid)
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex aggregation queries needed for stats
export async function GET(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { id: idOrUid } = await context.params;

  try {
    // Fetch agent by id or uid
    const agent = await prisma.agent.findFirst({
      where: {
        OR: [{ id: idOrUid }, { uid: idOrUid }],
      },
      select: {
        id: true,
        uid: true,
        name: true,
        provider: true,
        modelId: true,
        createdAt: true,
      },
    });

    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Conversation stats
    const [totalConversations, convLast24h, convLast7d, convLast30d] = await Promise.all([
      prisma.conversation.count({ where: { agentId: agent.id } }),
      prisma.conversation.count({ where: { agentId: agent.id, createdAt: { gte: last24h } } }),
      prisma.conversation.count({ where: { agentId: agent.id, createdAt: { gte: last7d } } }),
      prisma.conversation.count({ where: { agentId: agent.id, createdAt: { gte: last30d } } }),
    ]);

    // Message stats
    const [totalMessages, userMessages, assistantMessages, toolMessages, msgLast24h, msgLast7d] =
      await Promise.all([
        prisma.message.count({ where: { conversation: { agentId: agent.id } } }),
        prisma.message.count({ where: { conversation: { agentId: agent.id }, role: 'USER' } }),
        prisma.message.count({ where: { conversation: { agentId: agent.id }, role: 'ASSISTANT' } }),
        prisma.message.count({ where: { conversation: { agentId: agent.id }, role: 'TOOL' } }),
        prisma.message.count({
          where: { conversation: { agentId: agent.id }, createdAt: { gte: last24h } },
        }),
        prisma.message.count({
          where: { conversation: { agentId: agent.id }, createdAt: { gte: last7d } },
        }),
      ]);

    // Token stats using aggregate
    const [tokenTotals, tokensLast24h, tokensLast7d] = await Promise.all([
      prisma.message.aggregate({
        where: { conversation: { agentId: agent.id } },
        _sum: { inputTokens: true, outputTokens: true },
      }),
      prisma.message.aggregate({
        where: { conversation: { agentId: agent.id }, createdAt: { gte: last24h } },
        _sum: { inputTokens: true, outputTokens: true },
      }),
      prisma.message.aggregate({
        where: { conversation: { agentId: agent.id }, createdAt: { gte: last7d } },
        _sum: { inputTokens: true, outputTokens: true },
      }),
    ]);

    const totalInput = tokenTotals._sum.inputTokens || 0;
    const totalOutput = tokenTotals._sum.outputTokens || 0;

    // Tool usage stats
    const toolMessages2 = await prisma.message.findMany({
      where: { conversation: { agentId: agent.id }, role: 'TOOL' },
      select: { toolName: true, createdAt: true },
    });

    const toolCounts: Record<string, number> = {};
    let toolLast24h = 0;

    for (const tm of toolMessages2) {
      if (tm.toolName) {
        toolCounts[tm.toolName] = (toolCounts[tm.toolName] || 0) + 1;
      }
      if (tm.createdAt >= last24h) {
        toolLast24h++;
      }
    }

    const topTools = Object.entries(toolCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Activity stats
    const [firstConv, lastConv, longestConv] = await Promise.all([
      prisma.conversation.findFirst({
        where: { agentId: agent.id },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
      prisma.conversation.findFirst({
        where: { agentId: agent.id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
      prisma.conversation.findFirst({
        where: { agentId: agent.id },
        orderBy: { messages: { _count: 'desc' } },
        select: {
          id: true,
          slug: true,
          _count: { select: { messages: true } },
        },
      }),
    ]);

    const stats: AgentStats = {
      agent: {
        id: agent.id,
        uid: agent.uid,
        name: agent.name,
        provider: agent.provider,
        modelId: agent.modelId,
        createdAt: agent.createdAt.toISOString(),
      },
      conversations: {
        total: totalConversations,
        last24h: convLast24h,
        last7d: convLast7d,
        last30d: convLast30d,
      },
      messages: {
        total: totalMessages,
        byRole: {
          user: userMessages,
          assistant: assistantMessages,
          tool: toolMessages,
          system: 0, // System messages are inline, not stored separately
        },
        last24h: msgLast24h,
        last7d: msgLast7d,
      },
      tokens: {
        totalInput,
        totalOutput,
        total: totalInput + totalOutput,
        averagePerConversation:
          totalConversations > 0 ? Math.round((totalInput + totalOutput) / totalConversations) : 0,
        last24h: {
          input: tokensLast24h._sum.inputTokens || 0,
          output: tokensLast24h._sum.outputTokens || 0,
        },
        last7d: {
          input: tokensLast7d._sum.inputTokens || 0,
          output: tokensLast7d._sum.outputTokens || 0,
        },
      },
      tools: {
        totalCalls: toolMessages,
        uniqueToolsUsed: Object.keys(toolCounts).length,
        topTools,
        last24h: toolLast24h,
      },
      activity: {
        firstConversation: firstConv?.createdAt.toISOString() || null,
        lastConversation: lastConv?.createdAt.toISOString() || null,
        averageMessagesPerConversation:
          totalConversations > 0 ? Math.round(totalMessages / totalConversations) : 0,
        longestConversation: longestConv
          ? {
              id: longestConv.id,
              slug: longestConv.slug,
              messageCount: longestConv._count.messages,
            }
          : null,
      },
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Failed to fetch agent stats:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
  }
}
