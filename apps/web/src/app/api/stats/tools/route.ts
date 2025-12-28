import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '~/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/stats/tools
 * Top tools by various metrics
 *
 * Query params:
 * - sortBy: 'quality' | 'downloads' | 'executions' | 'recent' (default: 'quality')
 * - limit: number (default: 20, max: 100)
 * - category: filter by category
 * - health: 'healthy' | 'broken' | 'unknown' - filter by health status
 *
 * Returns:
 * - Top tools by quality score
 * - Top tools by npm downloads
 * - Most executed tools
 * - Recently added tools
 * - Tool category distribution
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Check rate limit
  const rateLimitResponse = checkRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'quality';
    const limit = Math.min(Number.parseInt(searchParams.get('limit') || '20', 10), 100);
    const category = searchParams.get('category');
    const healthFilter = searchParams.get('health');

    const now = new Date();

    // Build where clause
    const whereClause: Record<string, unknown> = {};
    if (category) {
      whereClause.package = { category };
    }
    if (healthFilter === 'healthy') {
      whereClause.importHealth = 'HEALTHY';
      whereClause.executionHealth = 'HEALTHY';
    } else if (healthFilter === 'broken') {
      whereClause.OR = [{ importHealth: 'BROKEN' }, { executionHealth: 'BROKEN' }];
    } else if (healthFilter === 'unknown') {
      whereClause.OR = [{ importHealth: 'UNKNOWN' }, { executionHealth: 'UNKNOWN' }];
    }

    // Determine sort order
    let orderBy: Record<string, unknown>[];
    switch (sortBy) {
      case 'downloads':
        orderBy = [{ package: { npmDownloadsLastMonth: 'desc' } }, { qualityScore: 'desc' }];
        break;
      case 'recent':
        orderBy = [{ createdAt: 'desc' }];
        break;
      case 'quality':
      default:
        orderBy = [{ qualityScore: 'desc' }, { package: { npmDownloadsLastMonth: 'desc' } }];
        break;
    }

    // For execution sorting, we need a different query
    let tools;
    let executionCounts: Map<string, number> = new Map();

    if (sortBy === 'executions') {
      // Get execution counts first
      const execGroups = await prisma.simulation.groupBy({
        by: ['toolId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: limit * 2, // Get more to account for filtering
      });

      const toolIds = execGroups.map((g) => g.toolId);
      executionCounts = new Map(execGroups.map((g) => [g.toolId, g._count.id]));

      tools = await prisma.tool.findMany({
        where: {
          id: { in: toolIds },
          ...whereClause,
        },
        take: limit,
        include: {
          package: {
            select: {
              npmPackageName: true,
              npmVersion: true,
              npmDownloadsLastMonth: true,
              githubStars: true,
              category: true,
              tier: true,
              isOfficial: true,
              npmHomepage: true,
              npmRepository: true,
            },
          },
        },
      });

      // Sort by execution count
      tools.sort((a, b) => (executionCounts.get(b.id) || 0) - (executionCounts.get(a.id) || 0));
    } else {
      tools = await prisma.tool.findMany({
        where: whereClause,
        orderBy,
        take: limit,
        include: {
          package: {
            select: {
              npmPackageName: true,
              npmVersion: true,
              npmDownloadsLastMonth: true,
              githubStars: true,
              category: true,
              tier: true,
              isOfficial: true,
              npmHomepage: true,
              npmRepository: true,
            },
          },
          _count: {
            select: { simulations: true },
          },
        },
      });
    }

    // Get execution counts for non-execution sorted queries
    if (sortBy !== 'executions') {
      const toolIds = tools.map((t) => t.id);
      const execGroups = await prisma.simulation.groupBy({
        by: ['toolId'],
        where: { toolId: { in: toolIds } },
        _count: { id: true },
      });
      executionCounts = new Map(execGroups.map((g) => [g.toolId, g._count.id]));
    }

    // Get category distribution
    const categoryDistribution = await prisma.package.groupBy({
      by: ['category'],
      _count: true,
      orderBy: { _count: { category: 'desc' } },
    });

    // Format tools response
    const formattedTools = tools.map((tool, index) => ({
      rank: index + 1,
      id: tool.id,
      name: tool.name,
      description: tool.description,
      qualityScore: tool.qualityScore ? Number(tool.qualityScore) : null,
      importHealth: tool.importHealth,
      executionHealth: tool.executionHealth,
      lastHealthCheck: tool.lastHealthCheck,
      hasExtractedSchema: tool.schemaSource === 'extracted',
      package: {
        name: tool.package.npmPackageName,
        version: tool.package.npmVersion,
        category: tool.package.category,
        tier: tool.package.tier,
        isOfficial: tool.package.isOfficial,
        npmDownloadsLastMonth: tool.package.npmDownloadsLastMonth,
        githubStars: tool.package.githubStars,
        homepage: tool.package.npmHomepage,
        repository: tool.package.npmRepository,
      },
      executionCount: executionCounts.get(tool.id) || 0,
      createdAt: tool.createdAt,
    }));

    // Format category distribution
    const formattedCategories = categoryDistribution.map((cat) => ({
      category: cat.category,
      packageCount: cat._count,
    }));

    const processingTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        meta: {
          version: '1.0.0',
          timestamp: now.toISOString(),
          processingTimeMs: processingTime,
        },
        data: {
          query: {
            sortBy,
            limit,
            category: category || null,
            healthFilter: healthFilter || null,
          },
          resultCount: formattedTools.length,
          tools: formattedTools,
          categoryDistribution: formattedCategories,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
          'X-Processing-Time': `${processingTime}ms`,
        },
      }
    );
  } catch (error) {
    console.error('Error fetching tool stats:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'TOOL_STATS_ERROR',
          message: 'Failed to fetch tool statistics',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        meta: {
          version: '1.0.0',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
