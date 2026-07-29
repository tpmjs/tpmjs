/**
 * Trending ranking engine.
 *
 * "Trending" here means *momentum over a recent window* — page views over the
 * last {@link TREND_WINDOW_DAYS} days plus tool executions over the last
 * {@link EXECUTION_WINDOW_DAYS} days — with all-time popularity (npm downloads,
 * quality score, community likes) used to break ties and to rank the long tail.
 *
 * The registry is young and recent activity is often sparse, so the ranking is
 * deliberately *graceful*: momentum dominates when it exists, but a tool with no
 * recent signal still gets a stable, credible position from its baseline
 * popularity. When too few tools show momentum we surface a `dataMode` of
 * `'sparse'` so the page can honestly disclose that the board leans on all-time
 * popularity rather than pretending thin numbers are a trend.
 *
 * The pure functions in this module (scoring, movement, formatting, data-mode)
 * are unit-tested in `trending.test.ts`; {@link getTrendingTools} is the thin
 * Prisma-backed shell that assembles candidates and delegates to them.
 */

import { prisma } from '@tpmjs/db';
import { defaultToolDiscoveryFilter } from '~/lib/tool-health-policy';

/** View momentum window (days). */
export const TREND_WINDOW_DAYS = 7;
/** Execution momentum window (days) — executions are rarer, so a wider window. */
export const EXECUTION_WINDOW_DAYS = 30;
/** An execution is worth this many views of momentum (stronger intent signal). */
export const EXECUTION_MOMENTUM_WEIGHT = 3;
/** Momentum is multiplied by this so it dominates the baseline popularity term. */
export const MOMENTUM_SCORE_MULTIPLIER = 10;
/** Minimum |growth| vs. the previous window to count as up/down rather than steady. */
export const MOVEMENT_THRESHOLD = 0.15;
/** Fewer momentum-bearing tools than this ⇒ `dataMode: 'sparse'`. */
export const MIN_LIVE_MOMENTUM_TOOLS = 5;

const DAY_MS = 24 * 60 * 60 * 1000;

export type HealthStatus = 'HEALTHY' | 'BROKEN' | 'UNKNOWN';
export type TrendDirection = 'new' | 'up' | 'down' | 'steady';
export type TrendingDataMode = 'live' | 'sparse';

/** Raw per-tool signals that feed the ranking. `qualityScore` is 0–1. */
export interface TrendingSignals {
  recentViews: number;
  previousViews: number;
  recentExecutions: number;
  downloads: number;
  qualityScore: number | null;
  likeCount: number;
}

/** A tool considered for the leaderboard, plus its display metadata. */
export interface TrendingCandidate {
  toolId: string;
  toolName: string;
  description: string;
  packageName: string;
  npmVersion: string | null;
  category: string;
  isOfficial: boolean;
  importHealth: HealthStatus;
  executionHealth: HealthStatus;
  githubStars: number | null;
  averageRating: number | null;
  ratingCount: number;
  signals: TrendingSignals;
}

/** A ranked leaderboard entry. */
export interface RankedTrendingEntry extends TrendingCandidate {
  rank: number;
  momentum: number;
  trendingScore: number;
  movement: TrendDirection;
  movementDeltaPct: number | null;
  hasRecentActivity: boolean;
}

export interface TrendingResult {
  entries: RankedTrendingEntry[];
  dataMode: TrendingDataMode;
  windowDays: number;
  executionWindowDays: number;
  totalRecentViews: number;
  totalRecentExecutions: number;
  candidateCount: number;
  generatedAt: string;
}

/**
 * Recent-window momentum: views + weighted executions. Negative inputs are
 * clamped to zero so a bad signal can never drag a tool below baseline order.
 */
export function computeMomentum(signals: TrendingSignals): number {
  const views = Math.max(0, signals.recentViews);
  const executions = Math.max(0, signals.recentExecutions);
  return views + executions * EXECUTION_MOMENTUM_WEIGHT;
}

/**
 * All-time popularity term used to order tools that share (or lack) momentum.
 * Downloads and likes are log-scaled so a viral package can't swamp everything;
 * `qualityScore` is expected on a 0–1 scale.
 */
export function computeBaselinePopularity(signals: TrendingSignals): number {
  const downloads = Math.max(0, signals.downloads);
  const likes = Math.max(0, signals.likeCount);
  const quality = signals.qualityScore == null ? 0 : Math.max(0, Math.min(1, signals.qualityScore));
  return 2 * Math.log10(downloads + 1) + 3 * quality + Math.log10(likes + 1);
}

/** Composite score: momentum dominates, baseline popularity fills the tail. */
export function computeTrendingScore(
  signals: TrendingSignals,
  momentum: number = computeMomentum(signals)
): number {
  return momentum * MOMENTUM_SCORE_MULTIPLIER + computeBaselinePopularity(signals);
}

/**
 * Movement of the current window vs. the previous one. Only meaningful when the
 * tool has current-window views; a tool with no recent views reports `steady`
 * (the caller hides the indicator entirely for popularity-only rows).
 */
export function computeMovement(
  recent: number,
  previous: number
): { direction: TrendDirection; deltaPct: number | null } {
  if (recent <= 0) return { direction: 'steady', deltaPct: null };
  if (previous <= 0) return { direction: 'new', deltaPct: null };
  const deltaPct = (recent - previous) / previous;
  if (deltaPct >= MOVEMENT_THRESHOLD) return { direction: 'up', deltaPct };
  if (deltaPct <= -MOVEMENT_THRESHOLD) return { direction: 'down', deltaPct };
  return { direction: 'steady', deltaPct };
}

/**
 * Score and sort candidates. Stable ordering: trendingScore, then raw momentum,
 * then downloads, then name — so the board never shuffles between identical runs.
 */
export function rankTrending(candidates: TrendingCandidate[]): RankedTrendingEntry[] {
  const scored: RankedTrendingEntry[] = candidates.map((candidate) => {
    const momentum = computeMomentum(candidate.signals);
    const trendingScore = computeTrendingScore(candidate.signals, momentum);
    const { direction, deltaPct } = computeMovement(
      candidate.signals.recentViews,
      candidate.signals.previousViews
    );
    return {
      ...candidate,
      momentum,
      trendingScore,
      movement: direction,
      movementDeltaPct: deltaPct,
      hasRecentActivity: momentum > 0,
      rank: 0,
    };
  });

  scored.sort(
    (a, b) =>
      b.trendingScore - a.trendingScore ||
      b.momentum - a.momentum ||
      b.signals.downloads - a.signals.downloads ||
      a.toolName.localeCompare(b.toolName)
  );

  for (let i = 0; i < scored.length; i++) {
    // biome-ignore lint/style/noNonNullAssertion: index is within bounds
    scored[i]!.rank = i + 1;
  }

  return scored;
}

/** Enough tools showing momentum ⇒ 'live'; otherwise honestly 'sparse'. */
export function deriveDataMode(entries: Array<{ momentum: number }>): TrendingDataMode {
  const withMomentum = entries.filter((entry) => entry.momentum > 0).length;
  return withMomentum >= MIN_LIVE_MOMENTUM_TOOLS ? 'live' : 'sparse';
}

/** Compact human number: 1234 → "1.2K", 2_500_000 → "2.5M". */
export function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${Math.round(value)}`;
}

/** Signed percentage label for a movement delta, or null when not derivable. */
export function formatDeltaPct(deltaPct: number | null): string | null {
  if (deltaPct == null || !Number.isFinite(deltaPct)) return null;
  const pct = Math.round(deltaPct * 100);
  return `${pct > 0 ? '+' : ''}${pct}%`;
}

/** Midnight boundary `days` days before `from` (used for DATE-typed columns). */
function dateDaysAgo(from: Date, days: number): Date {
  const d = new Date(from.getTime() - days * DAY_MS);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function toNumberOrNull(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeHealth(value: string | null | undefined): HealthStatus {
  return value === 'HEALTHY' || value === 'BROKEN' ? value : 'UNKNOWN';
}

/**
 * Assemble the trending leaderboard from live registry data.
 *
 * Fetches windowed view sums, windowed execution counts, and the set of
 * discoverable tools, then delegates all scoring to the pure helpers above.
 * The candidate set is bounded by the registry size (discoverable tools only),
 * which is small enough to rank in full on each ISR revalidation.
 */
export async function getTrendingTools(limit = 40): Promise<TrendingResult> {
  const now = new Date();
  const windowStart = dateDaysAgo(now, TREND_WINDOW_DAYS);
  const previousWindowStart = dateDaysAgo(now, TREND_WINDOW_DAYS * 2);
  const executionWindowStart = new Date(now.getTime() - EXECUTION_WINDOW_DAYS * DAY_MS);

  const [recentViewRows, previousViewRows, executionRows, tools] = await Promise.all([
    prisma.pageView.groupBy({
      by: ['entityId'],
      where: { entityType: 'tool', date: { gte: windowStart } },
      _sum: { viewCount: true },
    }),
    prisma.pageView.groupBy({
      by: ['entityId'],
      where: { entityType: 'tool', date: { gte: previousWindowStart, lt: windowStart } },
      _sum: { viewCount: true },
    }),
    prisma.executionEvent.groupBy({
      by: ['toolId'],
      where: { toolId: { not: null }, createdAt: { gte: executionWindowStart } },
      _count: { _all: true },
    }),
    prisma.tool.findMany({
      where: defaultToolDiscoveryFilter(),
      select: {
        id: true,
        name: true,
        description: true,
        qualityScore: true,
        likeCount: true,
        averageRating: true,
        ratingCount: true,
        importHealth: true,
        executionHealth: true,
        package: {
          select: {
            npmPackageName: true,
            npmVersion: true,
            category: true,
            isOfficial: true,
            npmDownloadsLastMonth: true,
            githubStars: true,
          },
        },
      },
    }),
  ]);

  const recentViews = new Map<string, number>();
  for (const row of recentViewRows) recentViews.set(row.entityId, row._sum.viewCount ?? 0);

  const previousViews = new Map<string, number>();
  for (const row of previousViewRows) previousViews.set(row.entityId, row._sum.viewCount ?? 0);

  const recentExecutions = new Map<string, number>();
  for (const row of executionRows) {
    if (row.toolId) recentExecutions.set(row.toolId, row._count._all);
  }

  const candidates: TrendingCandidate[] = tools.map((tool) => ({
    toolId: tool.id,
    toolName: tool.name,
    description: tool.description ?? '',
    packageName: tool.package.npmPackageName,
    npmVersion: tool.package.npmVersion ?? null,
    category: tool.package.category,
    isOfficial: tool.package.isOfficial,
    importHealth: normalizeHealth(tool.importHealth),
    executionHealth: normalizeHealth(tool.executionHealth),
    githubStars: tool.package.githubStars ?? null,
    averageRating: toNumberOrNull(tool.averageRating),
    ratingCount: tool.ratingCount,
    signals: {
      recentViews: recentViews.get(tool.id) ?? 0,
      previousViews: previousViews.get(tool.id) ?? 0,
      recentExecutions: recentExecutions.get(tool.id) ?? 0,
      downloads: tool.package.npmDownloadsLastMonth ?? 0,
      qualityScore: toNumberOrNull(tool.qualityScore),
      likeCount: tool.likeCount,
    },
  }));

  const ranked = rankTrending(candidates);
  const dataMode = deriveDataMode(ranked);

  let totalRecentViews = 0;
  for (const value of recentViews.values()) totalRecentViews += value;
  let totalRecentExecutions = 0;
  for (const value of recentExecutions.values()) totalRecentExecutions += value;

  return {
    entries: ranked.slice(0, Math.max(1, limit)),
    dataMode,
    windowDays: TREND_WINDOW_DAYS,
    executionWindowDays: EXECUTION_WINDOW_DAYS,
    totalRecentViews,
    totalRecentExecutions,
    candidateCount: ranked.length,
    generatedAt: now.toISOString(),
  };
}
