import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireCronAuth } from '~/lib/cron-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/sync/stats-snapshot
 * Captures a daily snapshot of registry statistics for historical tracking.
 * Should be run once per day via cron.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: cron handler with many parallel queries
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  const unauthorized = requireCronAuth(request);
  if (unauthorized) return unauthorized;

  try {
    // Get today's date at midnight UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Check if we already have a snapshot for today
    const existingSnapshot = await prisma.statsSnapshot.findUnique({
      where: { date: today },
    });

    if (existingSnapshot) {
      return NextResponse.json({
        success: true,
        message: 'Snapshot already exists for today',
        data: { date: today.toISOString(), id: existingSnapshot.id },
      });
    }

    // Time boundaries for daily counts
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Registry-wide totals and distributions are transactional projections.
    // Never COUNT or materialize the complete tools/packages tables here.
    const [fixedCounters, categoryCounters] = await Promise.all([
      prisma.registryCounter.findMany({
        where: {
          metric: {
            in: [
              'total_tools',
              'total_packages',
              'official_tools',
              'official_packages',
              'tools_with_schema',
              'total_npm_downloads',
              'total_github_stars',
              'public_collections',
              'public_agents',
              'total_simulations',
              'tier_packages',
              'import_health',
              'execution_health',
              'quality_bucket',
            ],
          },
        },
      }),
      prisma.registryCounter.findMany({
        where: { metric: 'category_tools', value: { gt: 0 } },
        orderBy: [{ value: 'desc' }, { dimension: 'asc' }],
        take: 100,
      }),
    ]);
    const counter = (metric: string, dimension = '') =>
      Number(
        fixedCounters.find((row) => row.metric === metric && row.dimension === dimension)?.value ??
          0
      );

    const totalTools = counter('total_tools');
    const totalPackages = counter('total_packages');
    const officialTools = counter('official_tools');
    const officialPackages = counter('official_packages');
    const toolsWithSchema = counter('tools_with_schema');
    const importHealthy = counter('import_health', 'HEALTHY');
    const importBroken = counter('import_health', 'BROKEN');
    const importUnknown = counter('import_health', 'UNKNOWN');
    const executionHealthy = counter('execution_health', 'HEALTHY');
    const executionBroken = counter('execution_health', 'BROKEN');
    const executionUnknown = counter('execution_health', 'UNKNOWN');

    // Day/window-bounded event statistics remain index-backed reads.
    const [
      // Daily execution stats
      dailyExecutions,
      dailySuccessful,
      dailyFailed,
      avgExecutionTime,

      // Daily token usage
      dailyTokens,

      // Daily health checks
      dailyHealthChecks,

      // Social proof
      activeDevsResult,

      // Execution events (daily)
      eventToolCallsCount,
      eventAgentRunsCount,

      // Active user counts
      dauResult,
      wauResult,
      mauResult,

      // Search metrics
      searchCountResult,
      avgSearchLatencyResult,
      topSearchQueriesResult,

      // MCP unique clients
      mcpUniqueClientsResult,

      // ML tracking metrics
      errorCategoryResults,
      conversationStatusResults,
      contextMetricsResult,
      dailyConversationCount,
    ] = await Promise.all([
      // Daily execution stats
      prisma.simulation.count({
        where: { createdAt: { gte: yesterday, lt: today } },
      }),
      prisma.simulation.count({
        where: { createdAt: { gte: yesterday, lt: today }, status: 'success' },
      }),
      prisma.simulation.count({
        where: {
          createdAt: { gte: yesterday, lt: today },
          status: { in: ['error', 'timeout'] },
        },
      }),
      prisma.simulation.aggregate({
        where: {
          createdAt: { gte: yesterday, lt: today },
          status: 'success',
          executionTimeMs: { not: null },
        },
        _avg: { executionTimeMs: true },
      }),

      // Daily token usage
      prisma.tokenUsage.aggregate({
        where: { createdAt: { gte: yesterday, lt: today } },
        _sum: {
          inputTokens: true,
          outputTokens: true,
          totalTokens: true,
          estimatedCost: true,
        },
      }),

      // Daily health checks
      prisma.healthCheck.count({
        where: { createdAt: { gte: yesterday, lt: today } },
      }),

      // Social proof fields
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT user_id) AS count
        FROM user_activities WHERE created_at >= ${weekStart}
      `,

      // Execution events (daily counts from ExecutionEvent table)
      prisma.executionEvent.count({
        where: { createdAt: { gte: yesterday, lt: today }, eventType: 'tool_call' },
      }),
      prisma.executionEvent.count({
        where: { createdAt: { gte: yesterday, lt: today }, eventType: 'agent_run' },
      }),

      // DAU - distinct users active in last 24h
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT user_id) AS count
        FROM user_activities WHERE created_at >= ${yesterday} AND created_at < ${today}
      `,
      // WAU - distinct users active in last 7 days
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT user_id) AS count
        FROM user_activities WHERE created_at >= ${weekStart}
      `,
      // MAU - distinct users active in last 30 days
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT user_id) AS count
        FROM user_activities WHERE created_at >= ${monthStart}
      `,

      // Search volume (last 24h)
      prisma.searchLog.count({
        where: { createdAt: { gte: yesterday, lt: today } },
      }),
      // Average search latency
      prisma.searchLog.aggregate({
        where: { createdAt: { gte: yesterday, lt: today } },
        _avg: { latencyMs: true },
      }),
      // Top 10 search queries by frequency
      prisma.$queryRaw<{ query: string; count: bigint }[]>`
        SELECT query, COUNT(*) as count
        FROM search_logs
        WHERE created_at >= ${yesterday} AND created_at < ${today}
        GROUP BY query
        ORDER BY count DESC
        LIMIT 10
      `,

      // MCP unique clients (distinct userId or sessionId from ExecutionEvent where source starts with 'mcp')
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT COALESCE(user_id, 'anon')) as count
        FROM execution_events
        WHERE source LIKE 'mcp_%'
          AND created_at >= ${weekStart}
      `,

      // Error category distribution (daily)
      prisma.executionEvent.groupBy({
        by: ['errorCategory'],
        where: {
          createdAt: { gte: yesterday, lt: today },
          status: { in: ['error', 'timeout'] },
          errorCategory: { not: null },
        },
        _count: { id: true },
      }),

      // Conversation status breakdown (daily)
      prisma.conversation.groupBy({
        by: ['status'],
        where: { createdAt: { gte: yesterday, lt: today } },
        _count: { id: true },
      }),

      // Context metrics (daily agent runs)
      prisma.executionEvent.aggregate({
        where: {
          createdAt: { gte: yesterday, lt: today },
          eventType: 'agent_run',
        },
        _avg: {
          contextMessageCount: true,
          contextTokenCount: true,
          availableToolCount: true,
        },
      }),

      // Total conversations (daily)
      prisma.conversation.count({
        where: { createdAt: { gte: yesterday, lt: today } },
      }),
    ]);

    const tiersMinimal = counter('tier_packages', 'minimal');
    const tiersRich = counter('tier_packages', 'rich');
    const totalNpmDownloads = counter('total_npm_downloads');
    const totalGithubStars = counter('total_github_stars');
    const publicCollectionsCount = counter('public_collections');
    const publicAgentsCount = counter('public_agents');
    const totalSimulationsCount = counter('total_simulations');
    const categories = Object.fromEntries(
      categoryCounters.map((row) => [row.dimension, Number(row.value)])
    );
    const qualityDist = Object.fromEntries(
      fixedCounters
        .filter((row) => row.metric === 'quality_bucket' && row.value > 0n)
        .map((row) => [row.dimension, Number(row.value)])
    );

    // Create the snapshot
    const snapshot = await prisma.statsSnapshot.create({
      data: {
        date: today,

        // Registry overview
        totalTools,
        totalPackages,
        officialTools,
        officialPackages,
        toolsWithSchema,

        // Downloads & stars
        totalNpmDownloads,
        totalGithubStars,

        // Health status
        importHealthy,
        importBroken,
        importUnknown,
        executionHealthy,
        executionBroken,
        executionUnknown,

        // Quality distribution
        qualityDistribution: qualityDist,

        // Tiers
        tiersMinimal,
        tiersRich,

        // Daily execution stats
        executionsTotal: dailyExecutions,
        executionsSuccessful: dailySuccessful,
        executionsFailed: dailyFailed,
        executionsAvgTimeMs: avgExecutionTime._avg.executionTimeMs
          ? Math.round(avgExecutionTime._avg.executionTimeMs)
          : null,

        // Daily token usage
        tokensInput: BigInt(dailyTokens._sum.inputTokens || 0),
        tokensOutput: BigInt(dailyTokens._sum.outputTokens || 0),
        tokensTotal: BigInt(dailyTokens._sum.totalTokens || 0),
        tokensCostUsd: dailyTokens._sum.estimatedCost,

        // Daily health checks
        healthChecksRun: dailyHealthChecks,

        // Categories
        categories,

        // Social proof
        activeDevs7d: Number(activeDevsResult[0]?.count ?? 0),
        totalCollections: publicCollectionsCount,
        totalAgents: publicAgentsCount,
        totalSimulations: totalSimulationsCount,

        // Execution event counts
        eventToolCalls: eventToolCallsCount,
        eventAgentRuns: eventAgentRunsCount,

        // Active user counts
        dauCount: Number(dauResult[0]?.count ?? 0),
        wauCount: Number(wauResult[0]?.count ?? 0),
        mauCount: Number(mauResult[0]?.count ?? 0),

        // Search metrics
        searchCount: searchCountResult,
        avgSearchLatencyMs: avgSearchLatencyResult._avg.latencyMs
          ? Math.round(avgSearchLatencyResult._avg.latencyMs)
          : null,
        topSearchQueries: topSearchQueriesResult.map((r) => ({
          query: r.query,
          count: Number(r.count),
        })),

        // MCP unique clients
        mcpUniqueClients: Number(mcpUniqueClientsResult[0]?.count ?? 0),

        // ML tracking metrics
        errorCategories: Object.fromEntries(
          errorCategoryResults.map((e) => [e.errorCategory, e._count.id])
        ),
        conversationStatuses: Object.fromEntries(
          conversationStatusResults.map((c) => [c.status, c._count.id])
        ),
        avgContextMessages: contextMetricsResult._avg.contextMessageCount
          ? Math.round(contextMetricsResult._avg.contextMessageCount)
          : null,
        avgContextTokens: contextMetricsResult._avg.contextTokenCount
          ? Math.round(contextMetricsResult._avg.contextTokenCount)
          : null,
        avgAvailableTools: contextMetricsResult._avg.availableToolCount ?? null,
        totalConversationsDay: dailyConversationCount,
      },
    });

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        id: snapshot.id,
        date: snapshot.date,
        totalTools: snapshot.totalTools,
        totalPackages: snapshot.totalPackages,
        executionsTotal: snapshot.executionsTotal,
        processingTimeMs: processingTime,
      },
    });
  } catch (error) {
    console.error('Error creating stats snapshot:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SNAPSHOT_ERROR',
          message: 'Failed to create stats snapshot',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve recent snapshots
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get('days') || '30', 10), 365);

  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const snapshots = await prisma.statsSnapshot.findMany({
      where: { date: { gte: since } },
      orderBy: { date: 'asc' },
    });

    // Convert BigInt to number for JSON serialization
    const serializedSnapshots = snapshots.map((s) => ({
      ...s,
      tokensInput: Number(s.tokensInput),
      tokensOutput: Number(s.tokensOutput),
      tokensTotal: Number(s.tokensTotal),
    }));

    return NextResponse.json({
      success: true,
      data: {
        snapshots: serializedSnapshots,
        count: snapshots.length,
        days,
      },
    });
  } catch (error) {
    console.error('Error fetching stats snapshots:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch stats snapshots',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
