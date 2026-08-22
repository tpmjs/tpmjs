/**
 * Server-side queries behind the admin monitoring API.
 *
 * Everything here is read-only and bounded: windows are capped, lists are limited, and
 * UNION feeds limit each branch before sorting. Raw counts are cast to int/float in SQL
 * so rows serialise as plain numbers (Postgres bigint would otherwise arrive as BigInt).
 * No secret material is ever selected (env var *names* only, never values or tokens).
 */

import { Prisma, prisma } from '@tpmjs/db';
import { env } from '~/env';
import { RATE_LIMITS_BY_TIER } from '~/lib/api-keys';
import { executorAuthHeaders } from '~/lib/executors/internal-auth';
import type {
  ActivityFeed,
  ActivityItem,
  AdminAgent,
  AdminCollection,
  AdminConversation,
  AdminCustomServer,
  AdminOverview,
  AgentsAdmin,
  ApiKeyUsage,
  ApiUsageStats,
  BrokenTool,
  CollectionsAdmin,
  ExecutionRow,
  ExecutionStats,
  ExecutorHealth,
  HealthDistributionRow,
  HealthOverview,
  NamedCount,
  SearchAdmin,
  SeriesPoint,
  SyncRunSummary,
  WindowStats,
} from './types';

const MAX_HOURS = 24 * 30;

export function clampHours(raw: string | null, fallback = 24): number {
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, MAX_HOURS);
}

export function clampInt(raw: string | null, fallback: number, max: number): number {
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.min(parsed, max);
}

const iso = (value: Date | string | null | undefined): string | null =>
  value ? new Date(value).toISOString() : null;
const isoNow = (value: Date | string): string => new Date(value).toISOString();

/** Fill missing hourly buckets with zeros so charts keep a continuous axis. */
function fillHourly(
  rows: Array<{ at: Date; value: number; secondary?: number }>,
  hours: number
): SeriesPoint[] {
  const byHour = new Map<number, { value: number; secondaryValue?: number }>();
  for (const row of rows) {
    byHour.set(new Date(row.at).getTime(), { value: row.value, secondaryValue: row.secondary });
  }
  const out: SeriesPoint[] = [];
  const end = new Date();
  end.setUTCMinutes(0, 0, 0);
  for (let i = hours - 1; i >= 0; i--) {
    const bucket = end.getTime() - i * 3_600_000;
    const hit = byHour.get(bucket);
    out.push({
      at: new Date(bucket).toISOString(),
      value: hit?.value ?? 0,
      secondaryValue: hit?.secondaryValue ?? 0,
    });
  }
  return out;
}

// ---------------------------------------------------------------- windows

async function executionWindow(hours: number, label: string): Promise<WindowStats> {
  const [row] = await prisma.$queryRaw<
    Array<{ total: number; success: number; error: number; p50: number | null; p95: number | null }>
  >(Prisma.sql`
    SELECT count(*)::int AS total,
           count(*) FILTER (WHERE status = 'success')::int AS success,
           count(*) FILTER (WHERE status <> 'success')::int AS error,
           percentile_cont(0.5) WITHIN GROUP (ORDER BY duration_ms)::float8 AS p50,
           percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms)::float8 AS p95
    FROM execution_events
    WHERE created_at > now() - make_interval(hours => ${hours})
  `);
  return {
    window: label,
    hours,
    total: row?.total ?? 0,
    success: row?.success ?? 0,
    error: row?.error ?? 0,
    p50Ms: row?.p50 ?? null,
    p95Ms: row?.p95 ?? null,
  };
}

async function apiUsageWindow(hours: number, label: string): Promise<WindowStats> {
  const [row] = await prisma.$queryRaw<
    Array<{ total: number; success: number; error: number; p50: number | null; p95: number | null }>
  >(Prisma.sql`
    SELECT count(*)::int AS total,
           count(*) FILTER (WHERE status_code < 400)::int AS success,
           count(*) FILTER (WHERE status_code >= 400)::int AS error,
           percentile_cont(0.5) WITHIN GROUP (ORDER BY latency_ms)::float8 AS p50,
           percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms)::float8 AS p95
    FROM api_usage_records
    WHERE created_at > now() - make_interval(hours => ${hours})
  `);
  return {
    window: label,
    hours,
    total: row?.total ?? 0,
    success: row?.success ?? 0,
    error: row?.error ?? 0,
    p50Ms: row?.p50 ?? null,
    p95Ms: row?.p95 ?? null,
  };
}

async function executionHourly(hours: number): Promise<SeriesPoint[]> {
  const rows = await prisma.$queryRaw<
    Array<{ at: Date; value: number; secondary: number }>
  >(Prisma.sql`
    SELECT date_trunc('hour', created_at) AS at,
           count(*)::int AS value,
           count(*) FILTER (WHERE status <> 'success')::int AS secondary
    FROM execution_events
    WHERE created_at > now() - make_interval(hours => ${hours})
    GROUP BY 1 ORDER BY 1
  `);
  return fillHourly(rows, hours);
}

// ---------------------------------------------------------------- executor

export async function executorHealth(): Promise<ExecutorHealth> {
  const url = env.RAILWAY_EXECUTOR_URL ?? null;
  if (!url) {
    return {
      reachable: false,
      url: null,
      implementationVersion: null,
      protocolVersion: null,
      status: null,
      latencyMs: null,
      error: 'RAILWAY_EXECUTOR_URL not configured',
    };
  }
  const started = Date.now();
  try {
    const res = await fetch(`${url}/health`, {
      headers: { Accept: 'application/json', ...executorAuthHeaders() },
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const str = (key: string): string | null =>
      typeof body[key] === 'string' ? (body[key] as string) : null;
    return {
      reachable: res.ok,
      url,
      implementationVersion: str('implementationVersion'),
      protocolVersion: str('protocolVersion'),
      status: str('status') ?? `HTTP ${res.status}`,
      latencyMs: Date.now() - started,
      error: res.ok ? null : `HTTP ${res.status}`,
    };
  } catch (error) {
    return {
      reachable: false,
      url,
      implementationVersion: null,
      protocolVersion: null,
      status: null,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : 'fetch failed',
    };
  }
}

// ---------------------------------------------------------------- sync runs

async function latestSyncRuns(): Promise<SyncRunSummary[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      source: string;
      status: string;
      processed: number;
      skipped: number;
      errors: number;
      message: string | null;
      created_at: Date;
    }>
  >(Prisma.sql`
    SELECT DISTINCT ON (source) source, status, processed, skipped, errors, message, created_at
    FROM sync_logs
    WHERE created_at > now() - interval '14 days'
    ORDER BY source, created_at DESC
  `);
  return rows.map((r) => ({
    source: r.source,
    status: r.status,
    processed: r.processed,
    skipped: r.skipped,
    errors: r.errors,
    message: r.message,
    createdAt: isoNow(r.created_at),
  }));
}

// ---------------------------------------------------------------- overview

interface RegistryCounts {
  toolsActive: number;
  toolsRetired: number;
  packages: number;
  officialPackages: number;
  toolsHealthy: number;
  toolsBroken: number;
  toolsUnknown: number;
}

async function registryCounts(): Promise<RegistryCounts> {
  const [r] = await prisma.$queryRaw<Array<RegistryCounts>>(Prisma.sql`
    SELECT (SELECT count(*) FROM tools WHERE is_active)::int AS "toolsActive",
           (SELECT count(*) FROM tools WHERE NOT is_active)::int AS "toolsRetired",
           (SELECT count(*) FROM packages)::int AS packages,
           (SELECT count(*) FROM packages WHERE is_official)::int AS "officialPackages",
           (SELECT count(*) FROM tools WHERE is_active AND import_health = 'HEALTHY' AND coalesce(execution_health::text, '') <> 'BROKEN')::int AS "toolsHealthy",
           (SELECT count(*) FROM tools WHERE is_active AND (import_health = 'BROKEN' OR execution_health = 'BROKEN'))::int AS "toolsBroken",
           (SELECT count(*) FROM tools WHERE is_active AND import_health IS DISTINCT FROM 'HEALTHY' AND import_health IS DISTINCT FROM 'BROKEN' AND coalesce(execution_health::text, '') <> 'BROKEN')::int AS "toolsUnknown"
  `);
  return (
    r ?? {
      toolsActive: 0,
      toolsRetired: 0,
      packages: 0,
      officialPackages: 0,
      toolsHealthy: 0,
      toolsBroken: 0,
      toolsUnknown: 0,
    }
  );
}

async function userCounts(): Promise<AdminOverview['users']> {
  const [r] = await prisma.$queryRaw<Array<AdminOverview['users']>>(Prisma.sql`
    SELECT (SELECT count(*) FROM users)::int AS total,
           (SELECT count(*) FROM users WHERE role = 'ADMIN')::int AS admins,
           (SELECT count(*) FROM users WHERE created_at > now() - interval '7 days')::int AS "new7d",
           (SELECT count(*) FROM sessions WHERE expires_at > now())::int AS "activeSessions"
  `);
  return r ?? { total: 0, admins: 0, new7d: 0, activeSessions: 0 };
}

async function keyCounts(): Promise<AdminOverview['keys']> {
  const [r] = await prisma.$queryRaw<Array<AdminOverview['keys']>>(Prisma.sql`
    SELECT count(*)::int AS total,
           count(*) FILTER (WHERE is_active)::int AS active,
           count(*) FILTER (WHERE last_used_at > now() - interval '24 hours')::int AS "used24h"
    FROM tpmjs_api_keys
  `);
  return r ?? { total: 0, active: 0, used24h: 0 };
}

async function collectionCounts(): Promise<AdminOverview['collections']> {
  const [r] = await prisma.$queryRaw<Array<AdminOverview['collections']>>(Prisma.sql`
    SELECT (SELECT count(*) FROM collections)::int AS total,
           (SELECT count(*) FROM collections WHERE is_public)::int AS public,
           (SELECT count(*) FROM custom_mcp_servers)::int AS "customServers",
           (SELECT count(*) FROM bridge_connections WHERE status = 'connected')::int AS "bridgesConnected"
  `);
  return r ?? { total: 0, public: 0, customServers: 0, bridgesConnected: 0 };
}

async function agentCounts(): Promise<AdminOverview['agents']> {
  const [r] = await prisma.$queryRaw<Array<AdminOverview['agents']>>(Prisma.sql`
    SELECT (SELECT count(*) FROM agents)::int AS total,
           (SELECT count(*) FROM conversations WHERE created_at > now() - interval '24 hours')::int AS "conversations24h",
           (SELECT count(*) FROM messages WHERE created_at > now() - interval '24 hours')::int AS "messages24h"
  `);
  return r ?? { total: 0, conversations24h: 0, messages24h: 0 };
}

async function searches24h(): Promise<number> {
  const [r] = await prisma.$queryRaw<Array<{ c: number }>>(Prisma.sql`
    SELECT count(*)::int AS c FROM search_logs WHERE created_at > now() - interval '24 hours'
  `);
  return r?.c ?? 0;
}

async function healthChecks24h(): Promise<NamedCount[]> {
  return prisma.$queryRaw<NamedCount[]>(Prisma.sql`
    SELECT overall_status::text AS key, count(*)::int AS count
    FROM health_checks WHERE created_at > now() - interval '24 hours'
    GROUP BY 1 ORDER BY 2 DESC
  `);
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const [
    executions,
    apiUsage,
    registry,
    users,
    keys,
    collections,
    agents,
    searches,
    healthChecks,
    syncRuns,
    executor,
    hourly,
  ] = await Promise.all([
    Promise.all([
      executionWindow(1, '1h'),
      executionWindow(24, '24h'),
      executionWindow(24 * 7, '7d'),
    ]),
    Promise.all([apiUsageWindow(1, '1h'), apiUsageWindow(24, '24h'), apiUsageWindow(24 * 7, '7d')]),
    registryCounts(),
    userCounts(),
    keyCounts(),
    collectionCounts(),
    agentCounts(),
    searches24h(),
    healthChecks24h(),
    latestSyncRuns(),
    executorHealth(),
    executionHourly(24),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    executions,
    apiUsage,
    registry,
    users,
    keys,
    collections,
    agents,
    searches24h: searches,
    healthChecks24h: healthChecks,
    syncRuns,
    executor,
    hourly,
  };
}

// ---------------------------------------------------------------- activity feed

const ACTIVITY_KINDS = new Set<ActivityItem['kind']>([
  'execution',
  'api',
  'search',
  'sync',
  'health',
  'collection',
  'agent',
  'user',
  'key',
]);

export function parseActivityKind(raw: string | null): ActivityItem['kind'] | null {
  return raw && ACTIVITY_KINDS.has(raw as ActivityItem['kind'])
    ? (raw as ActivityItem['kind'])
    : null;
}

export async function getActivityFeed(options: {
  limit: number;
  before: string | null;
  kind: ActivityItem['kind'] | null;
}): Promise<ActivityFeed> {
  const { limit, before, kind } = options;
  const rows = await prisma.$queryRaw<
    Array<{
      kind: ActivityItem['kind'];
      at: Date;
      actor: string | null;
      title: string;
      detail: string | null;
      status: string | null;
      ref: string | null;
    }>
  >(Prisma.sql`
    SELECT kind, at, actor, title, detail, status, ref FROM (
      (SELECT 'execution'::text AS kind, e.created_at AS at, coalesce(u.username, k.name) AS actor,
              coalesce(e.package_name, e.source) || '::' || coalesce(e.tool_name, e.event_type) AS title,
              left(coalesce(e.error_message, e.output_summary::text), 220) AS detail, e.status AS status, e.id AS ref
       FROM execution_events e
       LEFT JOIN users u ON u.id = e.user_id
       LEFT JOIN tpmjs_api_keys k ON k.id = e.api_key_id
       WHERE (${before}::timestamptz IS NULL OR e.created_at < ${before}::timestamptz)
       ORDER BY e.created_at DESC LIMIT ${limit})
      UNION ALL
      (SELECT 'api', r.created_at, k.name, r.method || ' ' || r.endpoint, left(r.error_message, 220), r.status_code::text, r.id
       FROM api_usage_records r LEFT JOIN tpmjs_api_keys k ON k.id = r.api_key_id
       WHERE (${before}::timestamptz IS NULL OR r.created_at < ${before}::timestamptz)
       ORDER BY r.created_at DESC LIMIT ${limit})
      UNION ALL
      (SELECT 'search', s.created_at, u.username, 'search: ' || s.query, s.result_count || ' results · ' || s.latency_ms || ' ms', NULL, s.id
       FROM search_logs s LEFT JOIN users u ON u.id = s.user_id
       WHERE (${before}::timestamptz IS NULL OR s.created_at < ${before}::timestamptz)
       ORDER BY s.created_at DESC LIMIT ${limit})
      UNION ALL
      (SELECT 'sync', l.created_at, 'cron', l.source, left(l.message, 220), l.status, l.id
       FROM sync_logs l
       WHERE (${before}::timestamptz IS NULL OR l.created_at < ${before}::timestamptz)
       ORDER BY l.created_at DESC LIMIT ${limit})
      UNION ALL
      (SELECT 'health', h.created_at, h.trigger_source, p.npm_package_name || '::' || t.name,
              left(coalesce(h.import_error, h.execution_error), 220), h.overall_status::text, h.id
       FROM health_checks h JOIN tools t ON t.id = h.tool_id JOIN packages p ON p.id = t.package_id
       WHERE h.overall_status <> 'UNKNOWN' AND (${before}::timestamptz IS NULL OR h.created_at < ${before}::timestamptz)
       ORDER BY h.created_at DESC LIMIT ${limit})
      UNION ALL
      (SELECT 'collection', c.created_at, u.username, 'collection created: ' || c.name, c.slug,
              CASE WHEN c.is_public THEN 'public' ELSE 'private' END, c.id
       FROM collections c JOIN users u ON u.id = c.user_id
       WHERE (${before}::timestamptz IS NULL OR c.created_at < ${before}::timestamptz)
       ORDER BY c.created_at DESC LIMIT ${limit})
      UNION ALL
      (SELECT 'agent', a.created_at, u.username, 'agent created: ' || a.name, a.model_id, NULL, a.id
       FROM agents a JOIN users u ON u.id = a.user_id
       WHERE (${before}::timestamptz IS NULL OR a.created_at < ${before}::timestamptz)
       ORDER BY a.created_at DESC LIMIT ${limit})
      UNION ALL
      (SELECT 'user', u.created_at, u.username, 'user signed up: ' || coalesce(u.username, u.email), u.signup_source, u.tier::text, u.id
       FROM users u
       WHERE (${before}::timestamptz IS NULL OR u.created_at < ${before}::timestamptz)
       ORDER BY u.created_at DESC LIMIT ${limit})
      UNION ALL
      (SELECT 'key', k.created_at, u.username, 'API key created: ' || k.name, k.key_prefix,
              CASE WHEN k.is_active THEN 'active' ELSE 'inactive' END, k.id
       FROM tpmjs_api_keys k JOIN users u ON u.id = k.user_id
       WHERE (${before}::timestamptz IS NULL OR k.created_at < ${before}::timestamptz)
       ORDER BY k.created_at DESC LIMIT ${limit})
    ) feed
    WHERE (${kind}::text IS NULL OR kind = ${kind}::text)
    ORDER BY at DESC
    LIMIT ${limit}
  `);
  const items: ActivityItem[] = rows.map((r) => ({
    kind: r.kind,
    at: isoNow(r.at),
    actor: r.actor,
    title: r.title,
    detail: r.detail,
    status: r.status,
    ref: r.ref,
  }));
  return {
    items,
    nextCursor: items.length === limit ? (items[items.length - 1]?.at ?? null) : null,
  };
}

// ---------------------------------------------------------------- executions

export async function getExecutionStats(options: {
  hours: number;
  status: string | null;
  packageName: string | null;
  source: string | null;
  tool: string | null;
  limit: number;
  offset: number;
}): Promise<ExecutionStats> {
  const { hours, status, packageName, source, tool, limit, offset } = options;
  const where = Prisma.sql`
    e.created_at > now() - make_interval(hours => ${hours})
    AND (${status}::text IS NULL OR e.status = ${status}::text)
    AND (${packageName}::text IS NULL OR e.package_name = ${packageName}::text)
    AND (${source}::text IS NULL OR e.source = ${source}::text)
    AND (${tool}::text IS NULL OR e.tool_name = ${tool}::text)
  `;

  const [
    totalsRow,
    byStatus,
    byCategory,
    bySource,
    topTools,
    hourlyRows,
    rows,
    totalRow,
    facetPackages,
    facetSources,
    facetStatuses,
  ] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        total: number;
        success: number;
        error: number;
        p50: number | null;
        p95: number | null;
      }>
    >(Prisma.sql`
        SELECT count(*)::int AS total,
               count(*) FILTER (WHERE e.status = 'success')::int AS success,
               count(*) FILTER (WHERE e.status <> 'success')::int AS error,
               percentile_cont(0.5) WITHIN GROUP (ORDER BY e.duration_ms)::float8 AS p50,
               percentile_cont(0.95) WITHIN GROUP (ORDER BY e.duration_ms)::float8 AS p95
        FROM execution_events e WHERE ${where}
      `),
    prisma.$queryRaw<NamedCount[]>(Prisma.sql`
        SELECT e.status AS key, count(*)::int AS count FROM execution_events e WHERE ${where} GROUP BY 1 ORDER BY 2 DESC
      `),
    prisma.$queryRaw<NamedCount[]>(Prisma.sql`
        SELECT coalesce(e.error_category, 'none') AS key, count(*)::int AS count FROM execution_events e WHERE ${where} GROUP BY 1 ORDER BY 2 DESC
      `),
    prisma.$queryRaw<NamedCount[]>(Prisma.sql`
        SELECT e.source AS key, count(*)::int AS count FROM execution_events e WHERE ${where} GROUP BY 1 ORDER BY 2 DESC
      `),
    prisma.$queryRaw<
      Array<{
        key: string;
        count: number;
        errors: number;
        avgMs: number | null;
        p95Ms: number | null;
      }>
    >(Prisma.sql`
        SELECT coalesce(e.package_name, e.source) || '::' || coalesce(e.tool_name, e.event_type) AS key,
               count(*)::int AS count,
               count(*) FILTER (WHERE e.status <> 'success')::int AS errors,
               avg(e.duration_ms)::float8 AS "avgMs",
               percentile_cont(0.95) WITHIN GROUP (ORDER BY e.duration_ms)::float8 AS "p95Ms"
        FROM execution_events e WHERE ${where}
        GROUP BY 1 ORDER BY 2 DESC LIMIT 25
      `),
    prisma.$queryRaw<Array<{ at: Date; value: number; secondary: number }>>(Prisma.sql`
        SELECT date_trunc('hour', e.created_at) AS at, count(*)::int AS value,
               count(*) FILTER (WHERE e.status <> 'success')::int AS secondary
        FROM execution_events e WHERE ${where} GROUP BY 1 ORDER BY 1
      `),
    prisma.$queryRaw<
      Array<{
        id: string;
        created_at: Date;
        source: string;
        event_type: string;
        status: string;
        tool_name: string | null;
        package_name: string | null;
        duration_ms: number | null;
        error_category: string | null;
        error_message: string | null;
        user_id: string | null;
        username: string | null;
        api_key_name: string | null;
        collection_id: string | null;
        agent_id: string | null;
      }>
    >(Prisma.sql`
        SELECT e.id, e.created_at, e.source, e.event_type, e.status, e.tool_name, e.package_name, e.duration_ms,
               e.error_category, left(e.error_message, 300) AS error_message, e.user_id, u.username, k.name AS api_key_name,
               e.collection_id, e.agent_id
        FROM execution_events e
        LEFT JOIN users u ON u.id = e.user_id
        LEFT JOIN tpmjs_api_keys k ON k.id = e.api_key_id
        WHERE ${where}
        ORDER BY e.created_at DESC LIMIT ${limit} OFFSET ${offset}
      `),
    prisma.$queryRaw<Array<{ c: number }>>(
      Prisma.sql`SELECT count(*)::int AS c FROM execution_events e WHERE ${where}`
    ),
    prisma.$queryRaw<Array<{ key: string }>>(Prisma.sql`
        SELECT DISTINCT package_name AS key FROM execution_events WHERE package_name IS NOT NULL AND created_at > now() - make_interval(hours => ${hours}) ORDER BY 1
      `),
    prisma.$queryRaw<Array<{ key: string }>>(Prisma.sql`
        SELECT DISTINCT source AS key FROM execution_events WHERE created_at > now() - make_interval(hours => ${hours}) ORDER BY 1
      `),
    prisma.$queryRaw<Array<{ key: string }>>(Prisma.sql`
        SELECT DISTINCT status AS key FROM execution_events WHERE created_at > now() - make_interval(hours => ${hours}) ORDER BY 1
      `),
  ]);

  const t = totalsRow[0];
  const executionRows: ExecutionRow[] = rows.map((r) => ({
    id: r.id,
    at: isoNow(r.created_at),
    source: r.source,
    eventType: r.event_type,
    status: r.status,
    toolName: r.tool_name,
    packageName: r.package_name,
    durationMs: r.duration_ms,
    errorCategory: r.error_category,
    errorMessage: r.error_message,
    userId: r.user_id,
    username: r.username,
    apiKeyName: r.api_key_name,
    collectionId: r.collection_id,
    agentId: r.agent_id,
  }));

  return {
    hours,
    totals: {
      window: `${hours}h`,
      hours,
      total: t?.total ?? 0,
      success: t?.success ?? 0,
      error: t?.error ?? 0,
      p50Ms: t?.p50 ?? null,
      p95Ms: t?.p95 ?? null,
    },
    byStatus,
    byCategory,
    bySource,
    topTools,
    hourly: fillHourly(hourlyRows, Math.min(hours, 24 * 7)),
    rows: executionRows,
    total: totalRow[0]?.c ?? 0,
    facets: {
      packages: facetPackages.map((r) => r.key),
      sources: facetSources.map((r) => r.key),
      statuses: facetStatuses.map((r) => r.key),
    },
  };
}

// ---------------------------------------------------------------- API usage

export async function getApiUsageStats(hours: number): Promise<ApiUsageStats> {
  const [totals, byEndpoint, byStatusCode, keyRows, hourlyRows, errorRows] = await Promise.all([
    apiUsageWindow(hours, `${hours}h`),
    prisma.$queryRaw<
      Array<{
        key: string;
        count: number;
        errors: number;
        p50Ms: number | null;
        p95Ms: number | null;
      }>
    >(Prisma.sql`
      SELECT endpoint AS key, count(*)::int AS count,
             count(*) FILTER (WHERE status_code >= 400)::int AS errors,
             percentile_cont(0.5) WITHIN GROUP (ORDER BY latency_ms)::float8 AS "p50Ms",
             percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms)::float8 AS "p95Ms"
      FROM api_usage_records WHERE created_at > now() - make_interval(hours => ${hours})
      GROUP BY 1 ORDER BY 2 DESC LIMIT 40
    `),
    prisma.$queryRaw<NamedCount[]>(Prisma.sql`
      SELECT status_code::text AS key, count(*)::int AS count
      FROM api_usage_records WHERE created_at > now() - make_interval(hours => ${hours})
      GROUP BY 1 ORDER BY 2 DESC
    `),
    prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        key_prefix: string;
        is_active: boolean;
        rate_limit: number | null;
        last_used_at: Date | null;
        username: string | null;
        email: string | null;
        tier: string;
        total: number;
        errors: number;
        p50: number | null;
        used_hour: number;
      }>
    >(Prisma.sql`
      SELECT k.id, k.name, k.key_prefix, k.is_active, k.rate_limit, k.last_used_at, u.username, u.email, u.tier::text AS tier,
             (SELECT count(*) FROM api_usage_records r WHERE r.api_key_id = k.id AND r.created_at > now() - make_interval(hours => ${hours}))::int AS total,
             (SELECT count(*) FROM api_usage_records r WHERE r.api_key_id = k.id AND r.created_at > now() - make_interval(hours => ${hours}) AND r.status_code >= 400)::int AS errors,
             (SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY r.latency_ms) FROM api_usage_records r WHERE r.api_key_id = k.id AND r.created_at > now() - make_interval(hours => ${hours}))::float8 AS p50,
             (SELECT count(*) FROM api_usage_records r WHERE r.api_key_id = k.id AND r.created_at > now() - interval '1 hour')::int AS used_hour
      FROM tpmjs_api_keys k JOIN users u ON u.id = k.user_id
      ORDER BY total DESC, k.last_used_at DESC NULLS LAST
    `),
    prisma.$queryRaw<Array<{ at: Date; value: number; secondary: number }>>(Prisma.sql`
      SELECT date_trunc('hour', created_at) AS at, count(*)::int AS value,
             count(*) FILTER (WHERE status_code >= 400)::int AS secondary
      FROM api_usage_records WHERE created_at > now() - make_interval(hours => ${hours})
      GROUP BY 1 ORDER BY 1
    `),
    prisma.$queryRaw<
      Array<{
        created_at: Date;
        endpoint: string;
        method: string;
        status_code: number;
        key_name: string | null;
        error_code: string | null;
        error_message: string | null;
      }>
    >(Prisma.sql`
      SELECT r.created_at, r.endpoint, r.method, r.status_code, k.name AS key_name, r.error_code, left(r.error_message, 200) AS error_message
      FROM api_usage_records r LEFT JOIN tpmjs_api_keys k ON k.id = r.api_key_id
      WHERE r.status_code >= 400 AND r.created_at > now() - make_interval(hours => ${hours})
      ORDER BY r.created_at DESC LIMIT 40
    `),
  ]);

  const keys: ApiKeyUsage[] = keyRows.map((k) => {
    const tier = k.tier as keyof typeof RATE_LIMITS_BY_TIER;
    return {
      keyId: k.id,
      name: k.name,
      keyPrefix: k.key_prefix,
      isActive: k.is_active,
      username: k.username,
      email: k.email,
      tier: k.tier,
      limitPerHour: k.rate_limit ?? RATE_LIMITS_BY_TIER[tier] ?? RATE_LIMITS_BY_TIER.FREE,
      usedThisHour: k.used_hour,
      total: k.total,
      errors: k.errors,
      p50Ms: k.p50,
      lastUsedAt: iso(k.last_used_at),
    };
  });

  return {
    hours,
    totals,
    byEndpoint,
    byStatusCode,
    keys,
    hourly: fillHourly(hourlyRows, Math.min(hours, 24 * 7)),
    recentErrors: errorRows.map((r) => ({
      at: isoNow(r.created_at),
      endpoint: r.endpoint,
      method: r.method,
      statusCode: r.status_code,
      keyName: r.key_name,
      errorCode: r.error_code,
      errorMessage: r.error_message,
    })),
  };
}

// ---------------------------------------------------------------- health

export async function getHealthOverview(): Promise<HealthOverview> {
  const [
    distribution,
    checks24h,
    checksHourlyRows,
    brokenRows,
    topImportErrors,
    syncRuns,
    recentSync,
    endpointRows,
    executor,
  ] = await Promise.all([
    prisma.$queryRaw<HealthDistributionRow[]>(Prisma.sql`
        SELECT coalesce(import_health::text, 'NONE') AS "importHealth",
               coalesce(execution_health::text, 'NONE') AS "executionHealth",
               count(*)::int AS count
        FROM tools WHERE is_active GROUP BY 1, 2 ORDER BY 3 DESC
      `),
    prisma.$queryRaw<
      Array<{ overall: string; importStatus: string; executionStatus: string; count: number }>
    >(Prisma.sql`
        SELECT overall_status::text AS overall, import_status::text AS "importStatus", execution_status::text AS "executionStatus", count(*)::int AS count
        FROM health_checks WHERE created_at > now() - interval '24 hours'
        GROUP BY 1, 2, 3 ORDER BY 4 DESC
      `),
    prisma.$queryRaw<Array<{ at: Date; value: number; secondary: number }>>(Prisma.sql`
        SELECT date_trunc('hour', created_at) AS at, count(*)::int AS value,
               count(*) FILTER (WHERE overall_status <> 'HEALTHY')::int AS secondary
        FROM health_checks WHERE created_at > now() - interval '24 hours' GROUP BY 1 ORDER BY 1
      `),
    prisma.$queryRaw<
      Array<{
        tool_id: string;
        tool_name: string;
        package_name: string;
        npm_version: string;
        import_health: string | null;
        execution_health: string | null;
        consecutive: number;
        last_health_check: Date | null;
        next_at: Date | null;
        error: string | null;
      }>
    >(Prisma.sql`
        SELECT t.id AS tool_id, t.name AS tool_name, p.npm_package_name AS package_name, p.npm_version,
               t.import_health::text AS import_health, t.execution_health::text AS execution_health,
               t.consecutive_import_failures AS consecutive, t.last_health_check, t.health_check_next_at AS next_at,
               left(t.health_check_error, 240) AS error
        FROM tools t JOIN packages p ON p.id = t.package_id
        WHERE t.is_active AND (t.import_health = 'BROKEN' OR t.execution_health = 'BROKEN' OR t.consecutive_import_failures > 0)
        ORDER BY t.consecutive_import_failures DESC, t.last_health_check DESC NULLS LAST
        LIMIT 100
      `),
    prisma.$queryRaw<Array<{ key: string; count: number; tools: number }>>(Prisma.sql`
        SELECT left(regexp_replace(coalesce(h.import_error, h.execution_error), '[0-9a-f]{12,}|/tmp/[^ ]*|https?://[^ ]*', '…', 'g'), 160) AS key,
               count(*)::int AS count, count(DISTINCT h.tool_id)::int AS tools
        FROM health_checks h
        WHERE h.created_at > now() - interval '24 hours' AND h.overall_status <> 'HEALTHY'
          AND coalesce(h.import_error, h.execution_error) IS NOT NULL
        GROUP BY 1 ORDER BY 2 DESC LIMIT 15
      `),
    latestSyncRuns(),
    prisma.$queryRaw<
      Array<{
        source: string;
        status: string;
        processed: number;
        skipped: number;
        errors: number;
        message: string | null;
        created_at: Date;
      }>
    >(Prisma.sql`
        SELECT source, status, processed, skipped, errors, left(message, 300) AS message, created_at
        FROM sync_logs ORDER BY created_at DESC LIMIT 40
      `),
    prisma.$queryRaw<
      Array<{
        timestamp: Date;
        source: string;
        pass_count: number;
        fail_count: number;
        total_checks: number;
        overall_status: string;
      }>
    >(Prisma.sql`
        SELECT timestamp, source, pass_count, fail_count, total_checks, overall_status
        FROM endpoint_health_reports ORDER BY timestamp DESC LIMIT 12
      `),
    executorHealth(),
  ]);

  const brokenTools: BrokenTool[] = brokenRows.map((r) => ({
    toolId: r.tool_id,
    toolName: r.tool_name,
    packageName: r.package_name,
    npmVersion: r.npm_version,
    importHealth: r.import_health,
    executionHealth: r.execution_health,
    consecutiveImportFailures: r.consecutive,
    lastHealthCheck: iso(r.last_health_check),
    nextCheckAt: iso(r.next_at),
    error: r.error,
  }));

  return {
    distribution,
    checks24h,
    checksHourly: fillHourly(checksHourlyRows, 24),
    brokenTools,
    topImportErrors,
    syncRuns,
    recentSyncLogs: recentSync.map((r) => ({
      source: r.source,
      status: r.status,
      processed: r.processed,
      skipped: r.skipped,
      errors: r.errors,
      message: r.message,
      createdAt: isoNow(r.created_at),
    })),
    endpointReports: endpointRows.map((r) => ({
      at: isoNow(r.timestamp),
      source: r.source,
      passCount: r.pass_count,
      failCount: r.fail_count,
      totalChecks: r.total_checks,
      overallStatus: r.overall_status,
    })),
    executor,
  };
}

// ---------------------------------------------------------------- collections

export async function getCollectionsAdmin(): Promise<CollectionsAdmin> {
  const [collectionRows, serverRows] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        slug: string | null;
        is_public: boolean;
        username: string | null;
        email: string;
        executor_type: string | null;
        env_names: string[];
        registry_tools: number;
        custom_tools: number;
        bridge_tools: number;
        execution_count: number;
        view_count: number;
        like_count: number;
        fork_count: number;
        created_at: Date;
        updated_at: Date;
      }>
    >(Prisma.sql`
      SELECT c.id, c.name, c.slug, c.is_public, u.username, u.email, c.executor_type,
             CASE WHEN jsonb_typeof(c.env_vars) = 'object'
                  THEN (SELECT coalesce(array_agg(k ORDER BY k), '{}') FROM jsonb_object_keys(c.env_vars) AS k)
                  ELSE '{}'::text[] END AS env_names,
             (SELECT count(*) FROM collection_tools ct WHERE ct.collection_id = c.id)::int AS registry_tools,
             (SELECT count(*) FROM collection_custom_tools cct WHERE cct.collection_id = c.id)::int AS custom_tools,
             (SELECT count(*) FROM collection_bridge_tools cbt WHERE cbt.collection_id = c.id)::int AS bridge_tools,
             c.execution_count, c.view_count, c.like_count, c.fork_count, c.created_at, c.updated_at
      FROM collections c JOIN users u ON u.id = c.user_id
      ORDER BY c.updated_at DESC
    `),
    prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        url: string;
        status: string;
        tool_count: number;
        username: string | null;
        email: string;
        last_sync_at: Date | null;
        last_sync_error: string | null;
        collections_using: number;
      }>
    >(Prisma.sql`
      SELECT s.id, s.name, s.url, s.status,
             CASE WHEN jsonb_typeof(s.tools) = 'array' THEN jsonb_array_length(s.tools) ELSE 0 END AS tool_count,
             u.username, u.email, s.last_sync_at, left(s.last_sync_error, 200) AS last_sync_error,
             (SELECT count(DISTINCT cct.collection_id) FROM collection_custom_tools cct WHERE cct.server_id = s.id)::int AS collections_using
      FROM custom_mcp_servers s JOIN users u ON u.id = s.user_id
      ORDER BY s.created_at DESC
    `),
  ]);

  const collections: AdminCollection[] = collectionRows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    isPublic: c.is_public,
    owner: { username: c.username, email: c.email },
    executorType: c.executor_type,
    envVarNames: c.env_names,
    registryTools: c.registry_tools,
    customTools: c.custom_tools,
    bridgeTools: c.bridge_tools,
    executionCount: c.execution_count,
    viewCount: c.view_count,
    likeCount: c.like_count,
    forkCount: c.fork_count,
    createdAt: isoNow(c.created_at),
    updatedAt: isoNow(c.updated_at),
  }));

  const customServers: AdminCustomServer[] = serverRows.map((s) => {
    let host = s.url;
    try {
      host = new URL(s.url).host;
    } catch {
      /* keep raw */
    }
    return {
      id: s.id,
      name: s.name,
      host,
      status: s.status,
      toolCount: s.tool_count,
      owner: { username: s.username, email: s.email },
      lastSyncAt: iso(s.last_sync_at),
      lastSyncError: s.last_sync_error,
      collectionsUsing: s.collections_using,
    };
  });

  return { collections, customServers };
}

// ---------------------------------------------------------------- agents

export async function getAgentsAdmin(): Promise<AgentsAdmin> {
  const [agentRows, conversationRows, totals] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        id: string;
        uid: string;
        name: string;
        username: string | null;
        email: string;
        provider: string;
        model_id: string;
        is_public: boolean;
        sandbox_enabled: boolean;
        dynamic_tool_discovery: boolean;
        conversation_count: number;
        message_count: number;
        execution_count: number;
        tools: number;
        created_at: Date;
        last_conversation_at: Date | null;
      }>
    >(Prisma.sql`
      SELECT a.id, a.uid, a.name, u.username, u.email, a.provider::text AS provider, a.model_id, a.is_public, a.sandbox_enabled,
             a.dynamic_tool_discovery, a.conversation_count, a.message_count, a.execution_count,
             (SELECT count(*) FROM agent_tools at WHERE at.agent_id = a.id)::int AS tools,
             a.created_at,
             (SELECT max(c.created_at) FROM conversations c WHERE c.agent_id = a.id) AS last_conversation_at
      FROM agents a JOIN users u ON u.id = a.user_id
      ORDER BY last_conversation_at DESC NULLS LAST, a.created_at DESC
    `),
    prisma.$queryRaw<
      Array<{
        id: string;
        agent_name: string;
        agent_uid: string;
        owner: string | null;
        status: string;
        messages: number;
        tool_calls: number;
        created_at: Date;
        updated_at: Date;
      }>
    >(Prisma.sql`
      SELECT c.id, a.name AS agent_name, a.uid AS agent_uid, u.username AS owner, c.status,
             (SELECT count(*) FROM messages m WHERE m.conversation_id = c.id)::int AS messages,
             (SELECT count(*) FROM messages m WHERE m.conversation_id = c.id AND m.tool_calls IS NOT NULL)::int AS tool_calls,
             c.created_at, c.updated_at
      FROM conversations c JOIN agents a ON a.id = c.agent_id JOIN users u ON u.id = a.user_id
      ORDER BY c.updated_at DESC LIMIT 40
    `),
    prisma.$queryRaw<
      Array<{ agents: number; conversations: number; messages: number; conversations24h: number }>
    >(Prisma.sql`
      SELECT (SELECT count(*) FROM agents)::int AS agents,
             (SELECT count(*) FROM conversations)::int AS conversations,
             (SELECT count(*) FROM messages)::int AS messages,
             (SELECT count(*) FROM conversations WHERE created_at > now() - interval '24 hours')::int AS conversations24h
    `),
  ]);

  const agents: AdminAgent[] = agentRows.map((a) => ({
    id: a.id,
    uid: a.uid,
    name: a.name,
    owner: { username: a.username, email: a.email },
    provider: a.provider,
    modelId: a.model_id,
    isPublic: a.is_public,
    sandboxEnabled: a.sandbox_enabled,
    dynamicToolDiscovery: a.dynamic_tool_discovery,
    conversationCount: a.conversation_count,
    messageCount: a.message_count,
    executionCount: a.execution_count,
    tools: a.tools,
    createdAt: isoNow(a.created_at),
    lastConversationAt: iso(a.last_conversation_at),
  }));
  const recentConversations: AdminConversation[] = conversationRows.map((c) => ({
    id: c.id,
    agentName: c.agent_name,
    agentUid: c.agent_uid,
    owner: c.owner,
    status: c.status,
    messages: c.messages,
    toolCalls: c.tool_calls,
    createdAt: isoNow(c.created_at),
    updatedAt: isoNow(c.updated_at),
  }));
  const t = totals[0];
  return {
    agents,
    recentConversations,
    totals: {
      agents: t?.agents ?? 0,
      conversations: t?.conversations ?? 0,
      messages: t?.messages ?? 0,
      conversations24h: t?.conversations24h ?? 0,
    },
  };
}

// ---------------------------------------------------------------- search

export async function getSearchAdmin(hours: number): Promise<SearchAdmin> {
  const [totals, topQueries, zeroQueries, hourlyRows, recent] = await Promise.all([
    prisma.$queryRaw<Array<{ total: number; zero: number; p50: number | null }>>(Prisma.sql`
      SELECT count(*)::int AS total, count(*) FILTER (WHERE result_count = 0)::int AS zero,
             percentile_cont(0.5) WITHIN GROUP (ORDER BY latency_ms)::float8 AS p50
      FROM search_logs WHERE created_at > now() - make_interval(hours => ${hours})
    `),
    prisma.$queryRaw<NamedCount[]>(Prisma.sql`
      SELECT lower(query) AS key, count(*)::int AS count FROM search_logs
      WHERE created_at > now() - make_interval(hours => ${hours}) GROUP BY 1 ORDER BY 2 DESC LIMIT 25
    `),
    prisma.$queryRaw<NamedCount[]>(Prisma.sql`
      SELECT lower(query) AS key, count(*)::int AS count FROM search_logs
      WHERE created_at > now() - make_interval(hours => ${hours}) AND result_count = 0 GROUP BY 1 ORDER BY 2 DESC LIMIT 25
    `),
    prisma.$queryRaw<Array<{ at: Date; value: number; secondary: number }>>(Prisma.sql`
      SELECT date_trunc('hour', created_at) AS at, count(*)::int AS value, count(*) FILTER (WHERE result_count = 0)::int AS secondary
      FROM search_logs WHERE created_at > now() - make_interval(hours => ${hours}) GROUP BY 1 ORDER BY 1
    `),
    prisma.$queryRaw<
      Array<{
        created_at: Date;
        query: string;
        result_count: number;
        latency_ms: number;
        username: string | null;
      }>
    >(Prisma.sql`
      SELECT s.created_at, s.query, s.result_count, s.latency_ms, u.username
      FROM search_logs s LEFT JOIN users u ON u.id = s.user_id
      ORDER BY s.created_at DESC LIMIT 60
    `),
  ]);
  const t = totals[0];
  return {
    hours,
    total: t?.total ?? 0,
    zeroResult: t?.zero ?? 0,
    p50Ms: t?.p50 ?? null,
    topQueries,
    zeroResultQueries: zeroQueries,
    hourly: fillHourly(hourlyRows, Math.min(hours, 24 * 7)),
    recent: recent.map((r) => ({
      at: isoNow(r.created_at),
      query: r.query,
      resultCount: r.result_count,
      latencyMs: r.latency_ms,
      username: r.username,
    })),
  };
}
