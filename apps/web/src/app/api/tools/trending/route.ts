import { type NextRequest, NextResponse } from 'next/server';
import {
  EXECUTION_WINDOW_DAYS,
  getTrendingTools,
  type RankedTrendingEntry,
  TREND_WINDOW_DAYS,
} from '~/lib/trending';

export const runtime = 'nodejs';
// Cache at the edge/CDN and revalidate every 15 minutes — the underlying board
// is ISR-backed and does not need per-request recomputation.
export const revalidate = 900;
export const maxDuration = 60;

const API_VERSION = '2.0.0';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    version: string;
    timestamp: string;
    requestId?: string;
    window?: {
      dataMode: 'live' | 'sparse';
      viewWindowDays: number;
      executionWindowDays: number;
      totalRecentViews: number;
      totalRecentExecutions: number;
    };
  };
  pagination?: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

function serializeEntry(entry: RankedTrendingEntry) {
  return {
    id: entry.toolId,
    name: entry.toolName,
    description: entry.description,
    rank: entry.rank,
    trendingScore: Math.round(entry.trendingScore * 100) / 100,
    momentum: entry.momentum,
    movement: entry.movement,
    movementDeltaPct: entry.movementDeltaPct,
    hasRecentActivity: entry.hasRecentActivity,
    recentViews: entry.signals.recentViews,
    previousViews: entry.signals.previousViews,
    recentExecutions: entry.signals.recentExecutions,
    qualityScore: entry.signals.qualityScore,
    averageRating: entry.averageRating,
    ratingCount: entry.ratingCount,
    likeCount: entry.signals.likeCount,
    importHealth: entry.importHealth,
    executionHealth: entry.executionHealth,
    package: {
      npmPackageName: entry.packageName,
      npmVersion: entry.npmVersion,
      category: entry.category,
      isOfficial: entry.isOfficial,
      npmDownloadsLastMonth: entry.signals.downloads,
      githubStars: entry.githubStars,
    },
  };
}

/**
 * GET /api/tools/trending
 *
 * Trending tools ranked by *recent momentum* — page views over the last
 * {@link TREND_WINDOW_DAYS} days plus tool executions over the last
 * {@link EXECUTION_WINDOW_DAYS} days — with all-time popularity (downloads,
 * quality, likes) breaking ties and ordering the long tail. When recent signal
 * is thin, `meta.window.dataMode` is `'sparse'` to signal the popularity blend.
 *
 * Query params: `limit` (1–50, default 20), `offset` (default 0),
 * `category` (optional filter).
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();
  const { searchParams } = new URL(request.url);

  try {
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 20));
    const offset = Math.max(0, Number(searchParams.get('offset')) || 0);
    const category = searchParams.get('category');

    // Rank the whole discoverable set, then apply category filter + pagination.
    const result = await getTrendingTools(Number.MAX_SAFE_INTEGER);

    const filtered = category
      ? result.entries.filter((entry) => entry.category === category)
      : result.entries;

    const page = filtered.slice(offset, offset + limit);
    const hasMore = offset + limit < filtered.length;

    return NextResponse.json({
      success: true,
      data: page.map(serializeEntry),
      meta: {
        version: API_VERSION,
        timestamp: new Date().toISOString(),
        requestId,
        window: {
          dataMode: result.dataMode,
          viewWindowDays: TREND_WINDOW_DAYS,
          executionWindowDays: EXECUTION_WINDOW_DAYS,
          totalRecentViews: result.totalRecentViews,
          totalRecentExecutions: result.totalRecentExecutions,
        },
      },
      pagination: { limit, offset, hasMore },
    });
  } catch (error) {
    console.error('[API Error] GET /api/tools/trending:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get trending tools' },
        meta: { version: API_VERSION, timestamp: new Date().toISOString(), requestId },
      },
      { status: 500 }
    );
  }
}
