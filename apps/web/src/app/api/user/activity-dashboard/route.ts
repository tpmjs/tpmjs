import { prisma } from '@tpmjs/db';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/user/activity-dashboard
 * Returns all dashboard data in one request.
 *
 * Query params:
 * - period: '7d' | '30d' | '90d' (default '30d')
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [
      executionSummary,
      conversationCount,
      apiUsageSummary,
      executionTimeline,
      topTools,
      topAgents,
      recentErrors,
    ] = await Promise.all([
      // 1. Execution summary
      prisma.executionEvent.groupBy({
        by: ['status'],
        where: { userId, createdAt: { gte: since } },
        _count: { id: true },
      }),

      // 2. Conversation count (via user's agents)
      prisma.conversation.count({
        where: {
          agent: { userId },
          createdAt: { gte: since },
        },
      }),

      // 3. API usage summary
      prisma.apiUsageSummary.aggregate({
        where: { userId, periodStart: { gte: since } },
        _sum: {
          totalRequests: true,
          totalTokensIn: true,
          totalTokensOut: true,
        },
      }),

      // 4. Execution timeline (group by date)
      prisma.$queryRaw<
        Array<{
          date: string;
          tool_calls: bigint;
          agent_runs: bigint;
          successes: bigint;
          errors: bigint;
        }>
      >`
        SELECT
          DATE(created_at) as date,
          COUNT(*) FILTER (WHERE event_type = 'tool_call') as tool_calls,
          COUNT(*) FILTER (WHERE event_type = 'agent_run') as agent_runs,
          COUNT(*) FILTER (WHERE status = 'success') as successes,
          COUNT(*) FILTER (WHERE status = 'error') as errors
        FROM execution_events
        WHERE user_id = ${userId}
          AND created_at >= ${since}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,

      // 5. Top tools
      prisma.executionEvent.groupBy({
        by: ['toolName', 'packageName'],
        where: { userId, createdAt: { gte: since }, toolName: { not: null } },
        _count: { id: true },
        _max: { createdAt: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // 6. Top agents
      prisma.agent.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          uid: true,
          conversationCount: true,
          messageCount: true,
          _count: {
            select: {
              conversations: {
                where: { createdAt: { gte: since } },
              },
            },
          },
        },
        orderBy: { conversationCount: 'desc' },
        take: 10,
      }),

      // 7. Recent errors
      prisma.executionEvent.groupBy({
        by: ['toolName', 'errorMessage'],
        where: {
          userId,
          status: 'error',
          createdAt: { gte: since },
          toolName: { not: null },
        },
        _count: { id: true },
        _max: { createdAt: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    // Calculate summary
    const totalExecutions = executionSummary.reduce((sum, e) => sum + e._count.id, 0);
    const successCount = executionSummary.find((e) => e.status === 'success')?._count.id ?? 0;
    const successRate =
      totalExecutions > 0 ? Math.round((successCount / totalExecutions) * 100) : 0;
    const totalTokens =
      (apiUsageSummary._sum.totalTokensIn ?? 0) + (apiUsageSummary._sum.totalTokensOut ?? 0);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalToolExecutions: totalExecutions,
          totalAgentConversations: conversationCount,
          totalApiRequests: apiUsageSummary._sum.totalRequests ?? 0,
          successRate,
          totalTokensUsed: totalTokens,
        },
        executionTimeline: executionTimeline.map((row) => ({
          date: row.date,
          toolCalls: Number(row.tool_calls),
          agentRuns: Number(row.agent_runs),
          successes: Number(row.successes),
          errors: Number(row.errors),
        })),
        topTools: topTools.map((t) => ({
          toolName: t.toolName,
          packageName: t.packageName,
          count: t._count.id,
          lastUsed: t._max.createdAt,
        })),
        topAgents: topAgents.map((a) => ({
          agentName: a.name,
          agentUid: a.uid,
          agentId: a.id,
          conversationCount: a._count.conversations,
          totalConversations: a.conversationCount,
          messageCount: a.messageCount,
        })),
        recentErrors: recentErrors.map((e) => ({
          toolName: e.toolName,
          errorMessage: e.errorMessage,
          count: e._count.id,
          lastOccurred: e._max.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('[activity-dashboard] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activity dashboard' },
      { status: 500 }
    );
  }
}
