import { describe, expect, it } from 'vitest';
import {
  defaultToolDiscoveryFilter,
  importFailureStreakUpdate,
  isPersistentlyImportBroken,
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
