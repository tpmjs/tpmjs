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
  isActive: true;
  consecutiveImportFailures: { lt: number };
} {
  return {
    isActive: true,
    consecutiveImportFailures: { lt: PERSISTENT_IMPORT_FAILURE_THRESHOLD },
  };
}

/** Retired package exports remain durable evidence but are never executable. */
export function activeToolFilter(): { isActive: true } {
  return { isActive: true };
}

/** Explicit broken-tool requests remain an evidence and recovery surface. */
export function shouldIncludePersistentlyBrokenTools(input: {
  includePersistentBroken: boolean;
  brokenOnly: boolean;
  importHealth: string | null;
}): boolean {
  return input.includePersistentBroken || input.brokenOnly || input.importHealth === 'BROKEN';
}

// ---------------------------------------------------------------------------
// Honest visibility + ranking demotion for chronically broken tools.
//
// Discovery surfaces (search + browse) do NOT delist broken tools — data
// preservation is a hard rule and an exact-name search must still find its
// tool. Instead broken tools are *demoted below every healthy match* and
// *labeled* with the same health evidence the executor already records
// (import_health / consecutive_import_failures / last_health_check). Curated
// surfaces (the homepage featured grid and the /trending leaderboard) remain
// free to exclude them outright.
// ---------------------------------------------------------------------------

type HealthValue = 'HEALTHY' | 'BROKEN' | 'UNKNOWN' | null | undefined;

/** Minimal health signal shape shared by every ranking/labeling helper. */
export interface ToolHealthSignal {
  importHealth?: HealthValue;
  executionHealth?: HealthValue;
}

/** Full health evidence used to render an honest, data-derived explanation. */
export interface ToolHealthEvidence extends ToolHealthSignal {
  consecutiveImportFailures?: number | null;
  lastHealthCheck?: string | Date | null;
}

/** A tool is "broken" for display/ranking when either health check failed. */
export function isToolBroken(signal: ToolHealthSignal): boolean {
  return signal.importHealth === 'BROKEN' || signal.executionHealth === 'BROKEN';
}

/**
 * Discovery-ranking tier. Healthy and inconclusive (UNKNOWN) tools share the
 * top tier (0); broken tools are demoted to tier 1 so they sort after every
 * healthy match without ever being removed.
 */
export function healthRankTier(signal: ToolHealthSignal): 0 | 1 {
  return isToolBroken(signal) ? 1 : 0;
}

/**
 * Comparator for scored search hits: demote broken tools below all healthy
 * ones, then order by relevance score within a tier. Broken tools are never
 * dropped — an exact-name match still surfaces, just at the bottom.
 */
export function compareSearchHits(
  a: ToolHealthSignal & { score: number },
  b: ToolHealthSignal & { score: number }
): number {
  const tierDiff = healthRankTier(a) - healthRankTier(b);
  if (tierDiff !== 0) return tierDiff;
  return b.score - a.score;
}

/** UTC calendar date (YYYY-MM-DD) of a health check, or null when unknown. */
function toIsoDate(value?: string | Date | null): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

/** Rendered, data-derived health state for badges, cards, and banners. */
export interface ToolHealthPresentation {
  isBroken: boolean;
  isPersistent: boolean;
  consecutiveImportFailures: number;
  lastCheckedDate: string | null;
  /** Short badge caption, or null when the tool is healthy. */
  badgeLabel: 'Broken' | null;
  /** Honest one-line explanation, or null when the tool is healthy. */
  summary: string | null;
}

/**
 * Derive an honest, purely data-driven description of a tool's health — no
 * hardcoded package names, only the recorded health columns. The summary reads
 * e.g. "Failing to import for 1,716 consecutive checks — last checked
 * 2026-07-28."
 */
export function describeToolHealth(evidence: ToolHealthEvidence): ToolHealthPresentation {
  const failures = Math.max(0, evidence.consecutiveImportFailures ?? 0);
  const lastCheckedDate = toIsoDate(evidence.lastHealthCheck);
  const broken = isToolBroken(evidence);

  if (!broken) {
    return {
      isBroken: false,
      isPersistent: false,
      consecutiveImportFailures: failures,
      lastCheckedDate,
      badgeLabel: null,
      summary: null,
    };
  }

  let lead: string;
  if (evidence.importHealth === 'BROKEN') {
    lead =
      failures > 0
        ? `Failing to import for ${failures.toLocaleString('en-US')} consecutive check${failures === 1 ? '' : 's'}`
        : 'Failing to import';
  } else {
    lead = 'Failing to execute with test parameters';
  }

  const summary = `${lead}${lastCheckedDate ? ` — last checked ${lastCheckedDate}` : ''}.`;

  return {
    isBroken: true,
    isPersistent: isPersistentlyImportBroken(failures),
    consecutiveImportFailures: failures,
    lastCheckedDate,
    badgeLabel: 'Broken',
    summary,
  };
}

/** Structured, honest error returned when a chronically broken tool is executed. */
export interface BrokenToolExecutionError {
  code: 'TOOL_BROKEN';
  message: string;
}

/**
 * Guard for execution surfaces (registry execute, MCP execute_tool). Returns an
 * honest structured error when a tool is *persistently* import-broken so agents
 * get "tool currently broken since <date>" instead of a raw import stack trace.
 * Transient (sub-threshold) failures are allowed through so a recovering tool
 * can heal on the next successful run.
 */
export function brokenToolExecutionError(
  evidence: ToolHealthEvidence & { toolLabel?: string }
): BrokenToolExecutionError | null {
  const failures = Math.max(0, evidence.consecutiveImportFailures ?? 0);
  if (evidence.importHealth !== 'BROKEN' || !isPersistentlyImportBroken(failures)) {
    return null;
  }

  const label = evidence.toolLabel ? `"${evidence.toolLabel}" ` : '';
  const lastChecked = toIsoDate(evidence.lastHealthCheck);
  const since = lastChecked ? ` (last checked ${lastChecked})` : '';

  return {
    code: 'TOOL_BROKEN',
    message:
      `Tool ${label}is currently broken: its package has failed to import on ` +
      `${failures.toLocaleString('en-US')} consecutive health checks${since}. ` +
      'It remains in the registry and will execute again automatically once a health check passes.',
  };
}
