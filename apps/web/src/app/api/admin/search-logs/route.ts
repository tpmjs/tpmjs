import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '~/lib/admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * GET /api/admin/search-logs
 * Recent searches, top queries, search volume chart data
 * Requires ADMIN role.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (response) {
    if (response instanceof Response) return response;
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(30, Math.max(1, parseInt(searchParams.get('days') || '7', 10)));
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [recentSearches, topQueries, dailyVolume] = await Promise.all([
      // Recent searches (last 50)
      prisma.searchLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          query: true,
          resultCount: true,
          latencyMs: true,
          createdAt: true,
        },
      }),

      // Top queries by frequency
      prisma.$queryRaw<{ query: string; count: bigint; avg_latency: number }[]>`
        SELECT query, COUNT(*) as count, AVG(latency_ms)::int as avg_latency
        FROM search_logs
        WHERE created_at >= ${since}
        GROUP BY query
        ORDER BY count DESC
        LIMIT 20
      `,

      // Daily search volume for chart
      prisma.$queryRaw<{ date: Date; count: bigint; avg_latency: number }[]>`
        SELECT DATE(created_at) as date, COUNT(*) as count, AVG(latency_ms)::int as avg_latency
        FROM search_logs
        WHERE created_at >= ${since}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
    ]);

    return NextResponse.json({
      success: true,
      data: {
        recentSearches,
        topQueries: topQueries.map((q) => ({
          query: q.query,
          count: Number(q.count),
          avgLatency: q.avg_latency,
        })),
        dailyVolume: dailyVolume.map((d) => ({
          date: d.date,
          count: Number(d.count),
          avgLatency: d.avg_latency,
        })),
        period: { days },
      },
    });
  } catch (error) {
    console.error('[Admin Search Logs Error]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
