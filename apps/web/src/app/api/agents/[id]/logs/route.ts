/**
 * Agent Conversation Logs Endpoint
 *
 * GET: Retrieve recent conversation activity logs for an agent
 */

import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type RouteContext = {
  params: Promise<{ id: string }>;
};

const SANDBOX_TOOL_NAMES = ['shellExec', 'readFile', 'writeFile', 'listFiles'];

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'message' | 'tool_call' | 'tool_result' | 'conversation_start';
  conversationId: string;
  conversationSlug: string;
  role?: string;
  content?: string;
  toolName?: string;
  toolCallId?: string;
  toolResult?: Record<string, unknown>;
  toolInput?: Record<string, unknown>;
  inputTokens?: number;
  outputTokens?: number;
}

/**
 * GET /api/agents/[id]/logs
 * Retrieve recent conversation activity logs (accepts id or uid)
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex query logic needed for flexible log filtering
export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { id: idOrUid } = await context.params;
  const { searchParams } = new URL(request.url);

  const limit = Math.min(Number.parseInt(searchParams.get('limit') || '100', 10), 500);
  const offset = Number.parseInt(searchParams.get('offset') || '0', 10);
  const conversationSlug = searchParams.get('conversation') || undefined;
  const type = searchParams.get('type') || undefined; // 'message' | 'tool_call' | 'all'
  const sandbox = searchParams.get('sandbox') === 'true';

  try {
    // Fetch agent by id or uid
    const agent = await prisma.agent.findFirst({
      where: {
        OR: [{ id: idOrUid }, { uid: idOrUid }],
      },
      select: { id: true, name: true, uid: true },
    });

    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }

    // Sandbox mode: separate queries for TOOL results and ASSISTANT inputs
    if (sandbox) {
      const conversationFilter = {
        agentId: agent.id,
        ...(conversationSlug && { slug: conversationSlug }),
      };

      // Query 1: TOOL messages for sandbox tools
      const toolMessages = await prisma.message.findMany({
        where: {
          conversation: conversationFilter,
          role: 'TOOL',
          toolName: { in: SANDBOX_TOOL_NAMES },
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        skip: offset,
        include: {
          conversation: { select: { id: true, slug: true, title: true } },
        },
      });

      const hasMore = toolMessages.length > limit;
      const sliced = hasMore ? toolMessages.slice(0, limit) : toolMessages;

      // Collect toolCallIds to look up inputs
      const toolCallIds = sliced.map((m) => m.toolCallId).filter((id): id is string => id != null);

      // Query 2: ASSISTANT messages with matching toolCalls (for input extraction)
      const toolInputMap = new Map<string, Record<string, unknown>>();
      if (toolCallIds.length > 0) {
        // Get conversation IDs from the tool messages
        const conversationIds = [...new Set(sliced.map((m) => m.conversationId))];
        const assistantMessages = await prisma.message.findMany({
          where: {
            conversationId: { in: conversationIds },
            role: 'ASSISTANT',
          },
          select: { toolCalls: true },
          orderBy: { createdAt: 'desc' },
          take: 200,
        });

        const toolCallIdSet = new Set(toolCallIds);
        for (const msg of assistantMessages) {
          if (msg.toolCalls && Array.isArray(msg.toolCalls)) {
            for (const tc of msg.toolCalls as Array<{
              id?: string;
              toolCallId?: string;
              name?: string;
              toolName?: string;
              args?: Record<string, unknown>;
              input?: Record<string, unknown>;
            }>) {
              const tcId = tc.id || tc.toolCallId;
              if (tcId && toolCallIdSet.has(tcId)) {
                toolInputMap.set(tcId, tc.args || tc.input || {});
              }
            }
          }
        }
      }

      const logs: LogEntry[] = sliced.map((msg) => {
        const tcId = msg.toolCallId || undefined;

        // Parse toolResult JSON
        let parsedResult: Record<string, unknown> | undefined;
        if (msg.toolResult && typeof msg.toolResult === 'object') {
          parsedResult = msg.toolResult as Record<string, unknown>;
        } else if (msg.content) {
          try {
            parsedResult = JSON.parse(msg.content);
          } catch {
            parsedResult = { output: msg.content };
          }
        }

        return {
          id: msg.id,
          timestamp: msg.createdAt.toISOString(),
          type: 'tool_result' as const,
          conversationId: msg.conversation.id,
          conversationSlug: msg.conversation.slug,
          toolName: msg.toolName || undefined,
          toolCallId: tcId,
          toolResult: parsedResult,
          toolInput: tcId ? toolInputMap.get(tcId) : undefined,
          content: msg.content.slice(0, 200),
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          agent: { id: agent.id, uid: agent.uid, name: agent.name },
          logs,
          pagination: { limit, offset, hasMore },
        },
      });
    }

    // Build role filter based on type
    const roleFilter =
      type === 'tool_call'
        ? { in: ['TOOL' as const] }
        : type === 'message'
          ? { in: ['USER' as const, 'ASSISTANT' as const] }
          : undefined;

    // Fetch messages with conversation info
    const messages = await prisma.message.findMany({
      where: {
        conversation: {
          agentId: agent.id,
          ...(conversationSlug && { slug: conversationSlug }),
        },
        ...(roleFilter && { role: roleFilter }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      skip: offset,
      include: {
        conversation: {
          select: {
            id: true,
            slug: true,
            title: true,
          },
        },
      },
    });

    const hasMore = messages.length > limit;
    const data = hasMore ? messages.slice(0, limit) : messages;

    // Transform to log entries
    const logs: LogEntry[] = data.map((msg) => {
      const base = {
        id: msg.id,
        timestamp: msg.createdAt.toISOString(),
        conversationId: msg.conversation.id,
        conversationSlug: msg.conversation.slug,
      };

      if (msg.role === 'TOOL') {
        return {
          ...base,
          type: 'tool_result' as const,
          toolName: msg.toolName || undefined,
          toolCallId: msg.toolCallId || undefined,
          content: msg.content.slice(0, 500), // Truncate for logs view
        };
      }

      return {
        ...base,
        type: 'message' as const,
        role: msg.role,
        content: msg.content.slice(0, 500), // Truncate for logs view
        inputTokens: msg.inputTokens || undefined,
        outputTokens: msg.outputTokens || undefined,
      };
    });

    // Get unique tool calls from assistant messages
    const assistantMessages = data.filter((m) => m.role === 'ASSISTANT' && m.toolCalls);
    const toolCallLogs: LogEntry[] = [];

    for (const msg of assistantMessages) {
      if (msg.toolCalls && Array.isArray(msg.toolCalls)) {
        for (const tc of msg.toolCalls as Array<{
          id?: string;
          toolCallId?: string;
          name?: string;
          toolName?: string;
        }>) {
          toolCallLogs.push({
            id: `${msg.id}-${tc.id || tc.toolCallId}`,
            timestamp: msg.createdAt.toISOString(),
            type: 'tool_call',
            conversationId: msg.conversation.id,
            conversationSlug: msg.conversation.slug,
            toolName: tc.name || tc.toolName,
            toolCallId: tc.id || tc.toolCallId,
          });
        }
      }
    }

    // Merge and sort all logs
    const allLogs = [...logs, ...toolCallLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      success: true,
      data: {
        agent: {
          id: agent.id,
          uid: agent.uid,
          name: agent.name,
        },
        logs: allLogs.slice(0, limit),
        pagination: {
          limit,
          offset,
          hasMore,
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch agent logs:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch logs' }, { status: 500 });
  }
}
