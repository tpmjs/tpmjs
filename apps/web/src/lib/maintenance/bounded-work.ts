import { type HealthStatus, Prisma, prisma } from '@tpmjs/db';

export const HEALTH_SLICE_DEFAULT = 20;
export const HEALTH_SLICE_MAX = 100;
export const METRICS_SLICE_DEFAULT = 5;
export const METRICS_SLICE_MAX = 20;
export const QUALITY_SLICE_DEFAULT = 500;
export const QUALITY_SLICE_MAX = 2_000;

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export function boundedPositiveInt(
  raw: string | null | undefined,
  fallback: number,
  maximum: number
): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
}

function stableJitter(key: string, windowMs: number): number {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % windowMs;
}

/**
 * Periodic checks are a bounded freshness budget, not a promise to execute
 * every tool every day. Newly published and on-demand tools can be enqueued
 * immediately; the background lane revisits definitive results without waves.
 */
export function nextHealthCheckAt(toolId: string, status: HealthStatus, now = new Date()): Date {
  const [base, jitterWindow] =
    status === 'HEALTHY'
      ? [7 * DAY_MS, 12 * HOUR_MS]
      : status === 'BROKEN'
        ? [DAY_MS, 6 * HOUR_MS]
        : [15 * MINUTE_MS, 15 * MINUTE_MS];
  return new Date(now.getTime() + base + stableJitter(toolId, jitterWindow));
}

export function retryHealthCheckAt(toolId: string, now = new Date()): Date {
  return new Date(now.getTime() + 30 * MINUTE_MS + stableJitter(toolId, 15 * MINUTE_MS));
}

export function nextMetricsAt(packageId: string, now = new Date()): Date {
  return new Date(now.getTime() + DAY_MS + stableJitter(packageId, 12 * HOUR_MS));
}

export function retryMetricsAt(packageId: string, now = new Date()): Date {
  return new Date(now.getTime() + HOUR_MS + stableJitter(packageId, HOUR_MS));
}

export async function leaseDueToolIds(owner: string, limit: number): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    WITH due AS (
      SELECT id
      FROM tools
      WHERE health_check_next_at <= CURRENT_TIMESTAMP
        AND (health_check_lease_until IS NULL OR health_check_lease_until <= CURRENT_TIMESTAMP)
      ORDER BY health_check_next_at, id
      FOR UPDATE SKIP LOCKED
      LIMIT ${limit}
    )
    UPDATE tools AS t
    SET health_check_lease_until = CURRENT_TIMESTAMP + INTERVAL '20 minutes',
        health_check_leased_by = ${owner}
    FROM due
    WHERE t.id = due.id
    RETURNING t.id
  `);
  return rows.map((row) => row.id);
}

export async function releaseHealthLease(
  toolId: string,
  owner: string,
  nextAt = retryHealthCheckAt(toolId)
): Promise<void> {
  await prisma.tool.updateMany({
    where: { id: toolId, healthCheckLeasedBy: owner },
    data: {
      healthCheckNextAt: nextAt,
      healthCheckLeaseUntil: null,
      healthCheckLeasedBy: null,
    },
  });
}

export async function leaseDuePackageIds(owner: string, limit: number): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    WITH due AS (
      SELECT id
      FROM packages
      WHERE metrics_next_at <= CURRENT_TIMESTAMP
        AND (metrics_lease_until IS NULL OR metrics_lease_until <= CURRENT_TIMESTAMP)
      ORDER BY metrics_next_at, id
      FOR UPDATE SKIP LOCKED
      LIMIT ${limit}
    )
    UPDATE packages AS p
    SET metrics_lease_until = CURRENT_TIMESTAMP + INTERVAL '20 minutes',
        metrics_leased_by = ${owner}
    FROM due
    WHERE p.id = due.id
    RETURNING p.id
  `);
  return rows.map((row) => row.id);
}

export async function releaseMetricsLease(
  packageId: string,
  owner: string,
  nextAt = retryMetricsAt(packageId)
): Promise<void> {
  await prisma.package.updateMany({
    where: { id: packageId, metricsLeasedBy: owner },
    data: {
      metricsNextAt: nextAt,
      metricsLeaseUntil: null,
      metricsLeasedBy: null,
    },
  });
}

/**
 * Propagate package metric versions into a finite tool slice in one SQL
 * statement. This replaces per-tool Prisma updates and remains bounded even if
 * one package exports an enormous tool surface.
 */
export async function refreshQualityScoreSlice(limit: number): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    WITH work AS (
      SELECT t.id,
             p.metrics_version,
             LEAST(
               1.0::numeric,
               (CASE WHEN p.tier = 'rich' THEN 0.6 ELSE 0.4 END)::numeric
               + LEAST(0.2::numeric, log(10::numeric, (GREATEST(COALESCE(p.npm_downloads_last_month, 0), 0) + 1)::numeric) / 15)
               + LEAST(0.1::numeric, log(10::numeric, (GREATEST(COALESCE(p.github_stars, 0), 0) + 1)::numeric) / 10)
               + CASE WHEN t.parameters IS NOT NULL THEN 0.04 ELSE 0 END
               + CASE WHEN t.returns IS NOT NULL THEN 0.03 ELSE 0 END
               + CASE WHEN t.ai_agent IS NOT NULL THEN 0.03 ELSE 0 END
             ) AS score
      FROM tools AS t
      JOIN packages AS p ON p.id = t.package_id
      WHERE t.quality_metrics_version < p.metrics_version
      ORDER BY t.quality_metrics_version, t.id
      FOR UPDATE OF t SKIP LOCKED
      LIMIT ${limit}
    )
    UPDATE tools AS t
    SET quality_score = round(work.score, 2),
        quality_metrics_version = work.metrics_version
    FROM work
    WHERE t.id = work.id
    RETURNING t.id
  `);
  return rows.length;
}
