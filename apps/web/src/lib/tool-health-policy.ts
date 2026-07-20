export type ImportHealthVerdict = 'HEALTHY' | 'BROKEN' | 'UNKNOWN';

export type ImportFailureStreakUpdate =
  | { consecutiveImportFailures: { increment: number } }
  | { consecutiveImportFailures: 0 }
  | Record<string, never>;

/** Number of consecutive definitive import failures before default discovery quarantines a tool. */
export const PERSISTENT_IMPORT_FAILURE_THRESHOLD = 3;

/**
 * Build the atomic database update for one import-health verdict.
 *
 * UNKNOWN is inconclusive infrastructure evidence, so it must not hide a tool
 * or erase prior evidence. A successful import immediately restores discovery.
 */
export function importFailureStreakUpdate(verdict: ImportHealthVerdict): ImportFailureStreakUpdate {
  if (verdict === 'BROKEN') {
    return { consecutiveImportFailures: { increment: 1 } };
  }
  if (verdict === 'HEALTHY') {
    return { consecutiveImportFailures: 0 };
  }
  return {};
}

export function isPersistentlyImportBroken(consecutiveImportFailures: number): boolean {
  return consecutiveImportFailures >= PERSISTENT_IMPORT_FAILURE_THRESHOLD;
}

/** Prisma-compatible filter used by every default tool-discovery surface. */
export function defaultToolDiscoveryFilter(): {
  consecutiveImportFailures: { lt: number };
} {
  return {
    consecutiveImportFailures: { lt: PERSISTENT_IMPORT_FAILURE_THRESHOLD },
  };
}

/** Explicit broken-tool requests remain an evidence and recovery surface. */
export function shouldIncludePersistentlyBrokenTools(input: {
  includePersistentBroken: boolean;
  brokenOnly: boolean;
  importHealth: string | null;
}): boolean {
  return input.includePersistentBroken || input.brokenOnly || input.importHealth === 'BROKEN';
}
