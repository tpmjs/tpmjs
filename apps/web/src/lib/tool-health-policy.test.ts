import { describe, expect, it } from 'vitest';
import {
  brokenToolExecutionError,
  compareSearchHits,
  defaultToolDiscoveryFilter,
  describeToolHealth,
  healthRankTier,
  importFailureStreakUpdate,
  isPersistentlyImportBroken,
  isToolBroken,
  PERSISTENT_IMPORT_FAILURE_THRESHOLD,
  shouldIncludePersistentlyBrokenTools,
} from './tool-health-policy';

describe('persistent import-failure policy', () => {
  it('updates the streak atomically from definitive import evidence', () => {
    expect(importFailureStreakUpdate('BROKEN')).toEqual({
      consecutiveImportFailures: { increment: 1 },
    });
    expect(importFailureStreakUpdate('HEALTHY')).toEqual({
      consecutiveImportFailures: 0,
    });
    expect(importFailureStreakUpdate('UNKNOWN')).toEqual({});
  });

  it('quarantines a tool only after the configured evidence threshold', () => {
    expect(isPersistentlyImportBroken(PERSISTENT_IMPORT_FAILURE_THRESHOLD - 1)).toBe(false);
    expect(isPersistentlyImportBroken(PERSISTENT_IMPORT_FAILURE_THRESHOLD)).toBe(true);
    expect(defaultToolDiscoveryFilter()).toEqual({
      isActive: true,
      consecutiveImportFailures: { lt: PERSISTENT_IMPORT_FAILURE_THRESHOLD },
    });
  });

  it('keeps explicit broken-tool and diagnostic requests complete', () => {
    expect(
      shouldIncludePersistentlyBrokenTools({
        includePersistentBroken: false,
        brokenOnly: true,
        importHealth: null,
      })
    ).toBe(true);
    expect(
      shouldIncludePersistentlyBrokenTools({
        includePersistentBroken: false,
        brokenOnly: false,
        importHealth: 'BROKEN',
      })
    ).toBe(true);
    expect(
      shouldIncludePersistentlyBrokenTools({
        includePersistentBroken: false,
        brokenOnly: false,
        importHealth: null,
      })
    ).toBe(false);
  });
});

describe('isToolBroken', () => {
  it('is broken when either health signal failed', () => {
    expect(isToolBroken({ importHealth: 'BROKEN', executionHealth: 'HEALTHY' })).toBe(true);
    expect(isToolBroken({ importHealth: 'HEALTHY', executionHealth: 'BROKEN' })).toBe(true);
    expect(isToolBroken({ importHealth: 'HEALTHY', executionHealth: 'HEALTHY' })).toBe(false);
    expect(isToolBroken({ importHealth: 'UNKNOWN', executionHealth: null })).toBe(false);
    expect(isToolBroken({})).toBe(false);
  });
});

describe('healthRankTier', () => {
  it('keeps healthy and inconclusive tools in the top tier, demotes broken', () => {
    expect(healthRankTier({ importHealth: 'HEALTHY', executionHealth: 'HEALTHY' })).toBe(0);
    expect(healthRankTier({ importHealth: 'UNKNOWN' })).toBe(0);
    expect(healthRankTier({ importHealth: 'BROKEN' })).toBe(1);
  });
});

describe('compareSearchHits', () => {
  const healthyHigh = { importHealth: 'HEALTHY' as const, score: 5 };
  const healthyLow = { importHealth: 'HEALTHY' as const, score: 1 };
  const brokenHigh = { importHealth: 'BROKEN' as const, score: 100 };
  const brokenLow = { importHealth: 'BROKEN' as const, score: 2 };

  it('ranks every healthy tool above every broken tool regardless of score', () => {
    const ranked = [brokenHigh, healthyLow, brokenLow, healthyHigh].sort(compareSearchHits);
    expect(ranked).toEqual([healthyHigh, healthyLow, brokenHigh, brokenLow]);
  });

  it('orders by score within a health tier', () => {
    expect(compareSearchHits(healthyHigh, healthyLow)).toBeLessThan(0);
    expect(compareSearchHits(brokenLow, brokenHigh)).toBeGreaterThan(0);
  });

  it('never drops a broken exact-name hit — it only sorts it last', () => {
    // A broken tool with a huge exact-name boost still appears, just after healthy hits.
    const results = [brokenHigh, healthyLow].sort(compareSearchHits);
    expect(results).toContain(brokenHigh);
    expect(results.indexOf(brokenHigh)).toBeGreaterThan(results.indexOf(healthyLow));
  });
});

describe('describeToolHealth', () => {
  it('returns no label or summary for a healthy tool', () => {
    const health = describeToolHealth({ importHealth: 'HEALTHY', executionHealth: 'HEALTHY' });
    expect(health).toMatchObject({ isBroken: false, badgeLabel: null, summary: null });
  });

  it('derives an honest import-failure summary from the recorded columns', () => {
    const health = describeToolHealth({
      importHealth: 'BROKEN',
      consecutiveImportFailures: 1716,
      lastHealthCheck: '2026-07-28T09:15:00.000Z',
    });
    expect(health.isBroken).toBe(true);
    expect(health.isPersistent).toBe(true);
    expect(health.consecutiveImportFailures).toBe(1716);
    expect(health.lastCheckedDate).toBe('2026-07-28');
    expect(health.badgeLabel).toBe('Broken');
    expect(health.summary).toBe(
      'Failing to import for 1,716 consecutive checks — last checked 2026-07-28.'
    );
  });

  it('singularizes a single failure and tolerates a missing check date', () => {
    const health = describeToolHealth({ importHealth: 'BROKEN', consecutiveImportFailures: 1 });
    expect(health.summary).toBe('Failing to import for 1 consecutive check.');
    expect(health.lastCheckedDate).toBeNull();
  });

  it('describes an execution failure distinctly from an import failure', () => {
    const health = describeToolHealth({
      importHealth: 'HEALTHY',
      executionHealth: 'BROKEN',
      lastHealthCheck: new Date('2026-07-29T00:00:00.000Z'),
    });
    expect(health.summary).toBe(
      'Failing to execute with test parameters — last checked 2026-07-29.'
    );
  });

  it('is not persistent below the shared threshold', () => {
    const health = describeToolHealth({
      importHealth: 'BROKEN',
      consecutiveImportFailures: PERSISTENT_IMPORT_FAILURE_THRESHOLD - 1,
    });
    expect(health.isBroken).toBe(true);
    expect(health.isPersistent).toBe(false);
  });
});

describe('brokenToolExecutionError', () => {
  it('short-circuits a persistently import-broken tool with an honest error', () => {
    const error = brokenToolExecutionError({
      importHealth: 'BROKEN',
      consecutiveImportFailures: 858,
      lastHealthCheck: '2026-07-28T00:00:00.000Z',
      toolLabel: 'skinnyCow',
    });
    expect(error?.code).toBe('TOOL_BROKEN');
    expect(error?.message).toContain('"skinnyCow"');
    expect(error?.message).toContain('858 consecutive health checks');
    expect(error?.message).toContain('last checked 2026-07-28');
  });

  it('lets a transient (sub-threshold) failure through so it can self-heal', () => {
    expect(
      brokenToolExecutionError({
        importHealth: 'BROKEN',
        consecutiveImportFailures: PERSISTENT_IMPORT_FAILURE_THRESHOLD - 1,
      })
    ).toBeNull();
  });

  it('does not block an execution-only failure (may still work with real params)', () => {
    expect(
      brokenToolExecutionError({
        importHealth: 'HEALTHY',
        executionHealth: 'BROKEN',
        consecutiveImportFailures: 0,
      })
    ).toBeNull();
  });
});
