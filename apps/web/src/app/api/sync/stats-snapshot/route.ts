import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/sync/stats-snapshot
 * Captures a daily snapshot of registry statistics for historical tracking.
 * Should be run once per day via cron.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

    // Gather all statistics in parallel
    const [
      // Tool and package counts
      totalTools,
      totalPackages,
      officialTools,
      officialPackages,
      toolsWithSchema,

      // Health status counts
      importHealthy,
      importBroken,
      importUnknown,
      executionHealthy,
      executionBroken,
      executionUnknown,

      // Package data for aggregations
      packages,

      // Daily execution stats
      dailyExecutions,
      dailySuccessful,
      dailyFailed,
      avgExecutionTime,

      // Daily token usage
      dailyTokens,

      // Daily health checks
      dailyHealthChecks,

      // Quality distribution
      qualityDistribution,
    ] = await Promise.all([
      // Tool counts
      prisma.tool.count(),
      prisma.package.count(),
      prisma.tool.count({ where: { package: { isOfficial: true } } }),
      prisma.package.count({ where: { isOfficial: true } }),
      prisma.tool.count({ where: { schemaSource: 'extracted' } }),

      // Health status
      prisma.tool.count({ where: { importHealth: 'HEALTHY' } }),
      prisma.tool.count({ where: { importHealth: 'BROKEN' } }),
      prisma.tool.count({ where: { importHealth: 'UNKNOWN' } }),
      prisma.tool.count({ where: { executionHealth: 'HEALTHY' } }),
      prisma.tool.count({ where: { executionHealth: 'BROKEN' } }),
      prisma.tool.count({ where: { executionHealth: 'UNKNOWN' } }),

      // Package data
      prisma.package.findMany({
        select: {
          tier: true,
          category: true,
          npmDownloadsLastMonth: true,
          githubStars: true,
          _count: { select: { tools: true } },
        },
      }),

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

      // Quality score distribution
      prisma.$queryRaw<{ bucket: string; count: bigint }[]>`
        SELECT
          CASE
            WHEN quality_score IS NULL THEN 'unscored'
            WHEN quality_score < 0.3 THEN 'low'
            WHEN quality_score < 0.5 THEN 'medium-low'
            WHEN quality_score < 0.7 THEN 'medium'
            WHEN quality_score < 0.9 THEN 'high'
            ELSE 'excellent'
          END as bucket,
          COUNT(*) as count
        FROM tools
        GROUP BY
          CASE
            WHEN quality_score IS NULL THEN 'unscored'
            WHEN quality_score < 0.3 THEN 'low'
            WHEN quality_score < 0.5 THEN 'medium-low'
            WHEN quality_score < 0.7 THEN 'medium'
            WHEN quality_score < 0.9 THEN 'high'
            ELSE 'excellent'
          END
      `,
    ]);

    // Aggregate package data
    let tiersMinimal = 0;
    let tiersRich = 0;
    let totalNpmDownloads = 0;
    let totalGithubStars = 0;
    const categories: Record<string, number> = {};

    for (const pkg of packages) {
      if (pkg.tier === 'minimal') tiersMinimal++;
      if (pkg.tier === 'rich') tiersRich++;
      totalNpmDownloads += pkg.npmDownloadsLastMonth || 0;
      totalGithubStars += pkg.githubStars || 0;

      if (pkg.category) {
        categories[pkg.category] = (categories[pkg.category] || 0) + pkg._count.tools;
      }
    }

    // Format quality distribution
    const qualityDist: Record<string, number> = {};
    for (const row of qualityDistribution) {
      qualityDist[row.bucket] = Number(row.count);
    }

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
