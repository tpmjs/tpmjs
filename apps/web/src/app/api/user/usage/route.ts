import type { ApiUsageSummary } from '@prisma/client';
import { prisma } from '@tpmjs/db';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { API_KEY_SCOPES } from '~/lib/api-keys';
import { authenticateRequest, hasScope } from '~/lib/api-keys/middleware';
import { auth } from '~/lib/auth';

type Period = 'hourly' | 'daily' | 'monthly';

interface AggregatedSummary {
  periodStart: Date;
  totalRequests: number;
  successRequests: number;
  errorRequests: number;
  totalTokensIn: number;
  totalTokensOut: number;
  avgLatencyMs: number;
  endpointCounts: Record<string, number>;
  estimatedCostCents: number;
}

/**
 * Aggregate hourly summaries into daily or monthly periods
 */
function aggregateSummaries(
  hourlySummaries: ApiUsageSummary[],
  period: Period
): AggregatedSummary[] {
  if (period === 'hourly') {
    return hourlySummaries.map((s) => ({
      periodStart: s.periodStart,
      totalRequests: s.totalRequests,
      successRequests: s.successRequests,
      errorRequests: s.errorRequests,
      totalTokensIn: s.totalTokensIn,
      totalTokensOut: s.totalTokensOut,
      avgLatencyMs: s.avgLatencyMs,
      endpointCounts: s.endpointCounts as Record<string, number>,
      estimatedCostCents: s.estimatedCostCents,
    }));
  }

  // Group by period
  const groups = new Map<string, ApiUsageSummary[]>();

  for (const summary of hourlySummaries) {
    const date = new Date(summary.periodStart);
    let key: string;

    if (period === 'daily') {
      key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
    } else {
      // monthly
      key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    }

    const existing = groups.get(key) || [];
    existing.push(summary);
    groups.set(key, existing);
  }

  // Aggregate each group
  const result: AggregatedSummary[] = [];

  for (const [key, summaries] of groups) {
    const [year, month, day] = key.split('-').map(Number) as [number, number, number | undefined];
    const periodStart =
      period === 'daily'
        ? new Date(Date.UTC(year, month - 1, day ?? 1))
        : new Date(Date.UTC(year, month - 1, 1));

    const aggregated: AggregatedSummary = {
      periodStart,
      totalRequests: 0,
      successRequests: 0,
      errorRequests: 0,
      totalTokensIn: 0,
      totalTokensOut: 0,
      avgLatencyMs: 0,
      endpointCounts: {},
      estimatedCostCents: 0,
    };

    let totalLatencyWeight = 0;

    for (const s of summaries) {
      aggregated.totalRequests += s.totalRequests;
      aggregated.successRequests += s.successRequests;
      aggregated.errorRequests += s.errorRequests;
      aggregated.totalTokensIn += s.totalTokensIn;
      aggregated.totalTokensOut += s.totalTokensOut;
      aggregated.estimatedCostCents += s.estimatedCostCents;

      // Weighted average for latency
      totalLatencyWeight += s.avgLatencyMs * s.totalRequests;

      // Merge endpoint counts
      const counts = s.endpointCounts as Record<string, number>;
      for (const [endpoint, count] of Object.entries(counts)) {
        aggregated.endpointCounts[endpoint] = (aggregated.endpointCounts[endpoint] || 0) + count;
      }
    }

    if (aggregated.totalRequests > 0) {
      aggregated.avgLatencyMs = Math.round(totalLatencyWeight / aggregated.totalRequests);
    }

    result.push(aggregated);
  }

  // Sort by period start
  result.sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime());

  return result;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/user/usage
 *
 * Get usage analytics for the authenticated user.
 * Supports both session auth and API key auth (with usage:read scope).
 *
 * Query parameters:
 * - period: 'hourly' | 'daily' | 'monthly' (default: 'daily')
 * - start: ISO date string (default: 30 days ago)
 * - end: ISO date string (default: now)
 * - apiKeyId: Optional filter by specific API key
 */
export async function GET(request: NextRequest) {
  try {
    // Try API key auth first (for programmatic access)
    const apiKeyAuth = await authenticateRequest();

    let userId: string;

    if (apiKeyAuth.authenticated) {
      // Check scope for API key auth
      if (!hasScope(apiKeyAuth, API_KEY_SCOPES.USAGE_READ)) {
        return NextResponse.json({ error: 'Missing required scope: usage:read' }, { status: 403 });
      }
      userId = apiKeyAuth.userId!;
    } else {
      // Fall back to session auth
      const session = await auth.api.getSession({ headers: await headers() });
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = session.user.id;
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'daily') as 'hourly' | 'daily' | 'monthly';
    const apiKeyId = searchParams.get('apiKeyId');

    // Parse date range
    const now = new Date();
    const defaultStart = new Date();
    defaultStart.setDate(defaultStart.getDate() - 30);

    const start = searchParams.get('start') ? new Date(searchParams.get('start')!) : defaultStart;
    const end = searchParams.get('end') ? new Date(searchParams.get('end')!) : now;

    // Validate dates
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    if (start >= end) {
      return NextResponse.json({ error: 'Start date must be before end date' }, { status: 400 });
    }

    // Validate period
    if (!['hourly', 'daily', 'monthly'].includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period. Use: hourly, daily, monthly' },
        { status: 400 }
      );
    }

    // If apiKeyId is specified, verify ownership
    if (apiKeyId) {
      const key = await prisma.tpmjsApiKey.findFirst({
        where: { id: apiKeyId, userId },
      });
      if (!key) {
        return NextResponse.json({ error: 'API key not found' }, { status: 404 });
      }
    }

    // Fetch hourly summaries (we always store hourly, then aggregate for daily/monthly)
    const hourlySummaries = await prisma.apiUsageSummary.findMany({
      where: {
        userId,
        periodType: 'hourly',
        periodStart: {
          gte: start,
          lte: end,
        },
        ...(apiKeyId ? { apiKeyId } : {}),
      },
      orderBy: { periodStart: 'asc' },
    });

    // Aggregate into requested period
    const summaries = aggregateSummaries(hourlySummaries, period);

    // Calculate totals
    const totals = summaries.reduce(
      (acc, summary) => ({
        totalRequests: acc.totalRequests + summary.totalRequests,
        successRequests: acc.successRequests + summary.successRequests,
        errorRequests: acc.errorRequests + summary.errorRequests,
        totalTokensIn: acc.totalTokensIn + summary.totalTokensIn,
        totalTokensOut: acc.totalTokensOut + summary.totalTokensOut,
        estimatedCostCents: acc.estimatedCostCents + summary.estimatedCostCents,
      }),
      {
        totalRequests: 0,
        successRequests: 0,
        errorRequests: 0,
        totalTokensIn: 0,
        totalTokensOut: 0,
        estimatedCostCents: 0,
      }
    );

    // Aggregate endpoint counts across all summaries
    const endpointCounts: Record<string, number> = {};
    for (const summary of summaries) {
      const counts = summary.endpointCounts as Record<string, number>;
      for (const [endpoint, count] of Object.entries(counts)) {
        endpointCounts[endpoint] = (endpointCounts[endpoint] || 0) + count;
      }
    }

    // Sort endpoints by count
    const sortedEndpoints = Object.entries(endpointCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20); // Top 20

    // Get usage by API key (if not filtering by specific key)
    let byApiKey: { keyPrefix: string; name: string; requests: number }[] = [];
    if (!apiKeyId) {
      const apiKeyUsage = await prisma.apiUsageSummary.groupBy({
        by: ['apiKeyId'],
        where: {
          userId,
          periodType: period,
          periodStart: {
            gte: start,
            lte: end,
          },
          apiKeyId: { not: null },
        },
        _sum: {
          totalRequests: true,
        },
      });

      // Fetch key details
      const keyIds = apiKeyUsage.map((u) => u.apiKeyId).filter(Boolean) as string[];
      const keys = await prisma.tpmjsApiKey.findMany({
        where: { id: { in: keyIds } },
        select: { id: true, name: true, keyPrefix: true },
      });

      const keyMap = new Map(keys.map((k) => [k.id, k]));

      byApiKey = apiKeyUsage
        .filter((u) => u.apiKeyId && keyMap.has(u.apiKeyId))
        .map((u) => {
          const key = keyMap.get(u.apiKeyId!)!;
          return {
            keyPrefix: key.keyPrefix,
            name: key.name,
            requests: u._sum.totalRequests || 0,
          };
        })
        .sort((a, b) => b.requests - a.requests);
    }

    // Format time series data
    const timeSeries = summaries.map((s) => ({
      periodStart: s.periodStart.toISOString(),
      totalRequests: s.totalRequests,
      successRequests: s.successRequests,
      errorRequests: s.errorRequests,
      totalTokensIn: s.totalTokensIn,
      totalTokensOut: s.totalTokensOut,
      avgLatencyMs: s.avgLatencyMs,
    }));

    return NextResponse.json({
      success: true,
      data: {
        period,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        summary: {
          ...totals,
          successRate:
            totals.totalRequests > 0
              ? Math.round((totals.successRequests / totals.totalRequests) * 100)
              : 0,
        },
        timeSeries,
        byEndpoint: sortedEndpoints.map(([endpoint, count]) => ({
          endpoint,
          count,
        })),
        byApiKey,
      },
    });
  } catch (error) {
    console.error('[Usage] Error fetching usage:', error);
    return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
  }
}
