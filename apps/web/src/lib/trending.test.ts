import { describe, expect, it } from 'vitest';
import {
  computeBaselinePopularity,
  computeMomentum,
  computeMovement,
  computeTrendingScore,
  deriveDataMode,
  EXECUTION_MOMENTUM_WEIGHT,
  formatCompactNumber,
  formatDeltaPct,
  MIN_LIVE_MOMENTUM_TOOLS,
  rankTrending,
  type TrendingCandidate,
  type TrendingSignals,
} from './trending';

function signals(overrides: Partial<TrendingSignals> = {}): TrendingSignals {
  return {
    recentViews: 0,
    previousViews: 0,
    recentExecutions: 0,
    downloads: 0,
    qualityScore: null,
    likeCount: 0,
    ...overrides,
  };
}

function candidate(
  toolName: string,
  overrides: Partial<TrendingSignals> = {},
  extra: Partial<TrendingCandidate> = {}
): TrendingCandidate {
  return {
    toolId: `id-${toolName}`,
    toolName,
    description: `desc ${toolName}`,
    packageName: `pkg-${toolName}`,
    npmVersion: '1.0.0',
    category: 'utility',
    isOfficial: false,
    importHealth: 'HEALTHY',
    executionHealth: 'HEALTHY',
    githubStars: null,
    averageRating: null,
    ratingCount: 0,
    signals: signals(overrides),
    ...extra,
  };
}

describe('computeMomentum', () => {
  it('weights executions more heavily than views', () => {
    expect(computeMomentum(signals({ recentViews: 5 }))).toBe(5);
    expect(computeMomentum(signals({ recentExecutions: 1 }))).toBe(EXECUTION_MOMENTUM_WEIGHT);
    expect(computeMomentum(signals({ recentViews: 2, recentExecutions: 3 }))).toBe(
      2 + 3 * EXECUTION_MOMENTUM_WEIGHT
    );
  });

  it('clamps negative signals to zero', () => {
    expect(computeMomentum(signals({ recentViews: -10, recentExecutions: -4 }))).toBe(0);
  });
});

describe('computeBaselinePopularity', () => {
  it('is zero for a brand-new tool with no popularity', () => {
    expect(computeBaselinePopularity(signals())).toBe(0);
  });

  it('rewards downloads, quality (0–1), and likes monotonically', () => {
    const base = computeBaselinePopularity(signals());
    expect(computeBaselinePopularity(signals({ downloads: 1000 }))).toBeGreaterThan(base);
    expect(computeBaselinePopularity(signals({ qualityScore: 0.9 }))).toBeGreaterThan(base);
    expect(computeBaselinePopularity(signals({ likeCount: 50 }))).toBeGreaterThan(base);
  });

  it('clamps out-of-range quality into the 0–1 band', () => {
    expect(computeBaselinePopularity(signals({ qualityScore: 5 }))).toBe(
      computeBaselinePopularity(signals({ qualityScore: 1 }))
    );
    expect(computeBaselinePopularity(signals({ qualityScore: -1 }))).toBe(
      computeBaselinePopularity(signals({ qualityScore: 0 }))
    );
  });
});

describe('computeTrendingScore', () => {
  it('lets any recent momentum outrank a purely popular tool', () => {
    const hot = computeTrendingScore(signals({ recentViews: 3 }));
    const popular = computeTrendingScore(
      signals({ downloads: 100_000, qualityScore: 1, likeCount: 200 })
    );
    expect(hot).toBeGreaterThan(popular);
  });

  it('falls back to baseline popularity when there is no momentum', () => {
    const a = computeTrendingScore(signals({ downloads: 10_000 }));
    const b = computeTrendingScore(signals({ downloads: 100 }));
    expect(a).toBeGreaterThan(b);
  });
});

describe('computeMovement', () => {
  it('flags a tool with no prior views as new', () => {
    expect(computeMovement(4, 0)).toEqual({ direction: 'new', deltaPct: null });
  });

  it('reports up/down beyond the threshold and steady within it', () => {
    expect(computeMovement(20, 10).direction).toBe('up');
    expect(computeMovement(5, 10).direction).toBe('down');
    expect(computeMovement(10, 10).direction).toBe('steady');
    expect(computeMovement(11, 10).direction).toBe('steady'); // +10% < 15% threshold
  });

  it('has no direction/delta when there is no current-window activity', () => {
    expect(computeMovement(0, 25)).toEqual({ direction: 'steady', deltaPct: null });
  });

  it('computes the delta percentage for a real change', () => {
    expect(computeMovement(15, 10).deltaPct).toBeCloseTo(0.5);
  });
});

describe('rankTrending', () => {
  it('orders momentum tools above popularity tools and assigns sequential ranks', () => {
    const ranked = rankTrending([
      candidate('popular-quiet', { downloads: 500_000, qualityScore: 1, likeCount: 100 }),
      candidate('hot-new', { recentViews: 8, previousViews: 0 }),
      candidate('warm', { recentExecutions: 2 }),
    ]);

    expect(ranked.map((r) => r.toolName)).toEqual(['hot-new', 'warm', 'popular-quiet']);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3]);
    expect(ranked[0]?.movement).toBe('new');
    expect(ranked[0]?.hasRecentActivity).toBe(true);
    expect(ranked[2]?.hasRecentActivity).toBe(false);
  });

  it('is deterministic for tied scores (stable tie-break by name)', () => {
    const a = rankTrending([candidate('bbb'), candidate('aaa')]).map((r) => r.toolName);
    const b = rankTrending([candidate('aaa'), candidate('bbb')]).map((r) => r.toolName);
    expect(a).toEqual(['aaa', 'bbb']);
    expect(b).toEqual(['aaa', 'bbb']);
  });
});

describe('deriveDataMode', () => {
  it('is sparse when fewer than the threshold of tools have momentum', () => {
    const entries = Array.from({ length: MIN_LIVE_MOMENTUM_TOOLS - 1 }, () => ({ momentum: 5 }));
    expect(deriveDataMode(entries)).toBe('sparse');
  });

  it('is live once enough tools carry momentum', () => {
    const entries = [
      ...Array.from({ length: MIN_LIVE_MOMENTUM_TOOLS }, () => ({ momentum: 1 })),
      { momentum: 0 },
      { momentum: 0 },
    ];
    expect(deriveDataMode(entries)).toBe('live');
  });
});

describe('formatCompactNumber', () => {
  it('formats thousands and millions and leaves small numbers intact', () => {
    expect(formatCompactNumber(950)).toBe('950');
    expect(formatCompactNumber(1500)).toBe('1.5K');
    expect(formatCompactNumber(12_000)).toBe('12K');
    expect(formatCompactNumber(2_500_000)).toBe('2.5M');
  });

  it('is safe for non-finite input', () => {
    expect(formatCompactNumber(Number.NaN)).toBe('0');
  });
});

describe('formatDeltaPct', () => {
  it('renders a signed percentage or null', () => {
    expect(formatDeltaPct(0.5)).toBe('+50%');
    expect(formatDeltaPct(-0.2)).toBe('-20%');
    expect(formatDeltaPct(null)).toBeNull();
  });
});
