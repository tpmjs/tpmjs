'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';

interface UsageData {
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
  summary: {
    totalRequests: number;
    successRequests: number;
    errorRequests: number;
    totalTokensIn: number;
    totalTokensOut: number;
    estimatedCostCents: number;
    successRate: number;
  };
  timeSeries: Array<{
    periodStart: string;
    totalRequests: number;
    successRequests: number;
    errorRequests: number;
    totalTokensIn: number;
    totalTokensOut: number;
    avgLatencyMs: number;
  }>;
  byEndpoint: Array<{
    endpoint: string;
    count: number;
  }>;
  byApiKey: Array<{
    keyPrefix: string;
    name: string;
    requests: number;
  }>;
}

type Period = 'hourly' | 'daily' | 'monthly';

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function formatCost(cents: number): string {
  if (cents === 0) return '$0.00';
  return `$${(cents / 100).toFixed(2)}`;
}

export default function UsagePage(): React.ReactElement {
  const router = useRouter();
  const [data, setData] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('daily');

  const fetchUsage = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/usage?period=${period}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        if (response.status === 401) {
          router.push('/sign-in');
          return;
        }
        setError(result.error || 'Failed to fetch usage');
      }
    } catch (err) {
      console.error('Failed to fetch usage:', err);
      setError('Failed to fetch usage');
    } finally {
      setIsLoading(false);
    }
  }, [period, router]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  if (error) {
    return (
      <DashboardLayout title="Usage">
        <div className="text-center py-16">
          <Icon icon="alertCircle" size="lg" className="mx-auto text-error mb-4" />
          <h2 className="text-lg font-medium text-foreground mb-2">Error</h2>
          <p className="text-foreground-secondary mb-4">{error}</p>
          <Button onClick={fetchUsage}>Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Usage"
      subtitle="Monitor your API usage and costs"
      actions={
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="px-3 py-1.5 bg-surface border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-6">
          {/* Summary cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={`summary-skeleton-${idx}`}
                className="bg-surface border border-border rounded-lg p-4"
              >
                <div className="h-4 w-24 bg-surface-secondary rounded animate-pulse mb-2" />
                <div className="h-8 w-20 bg-surface-secondary rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Chart skeleton */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <div className="h-4 w-32 bg-surface-secondary rounded animate-pulse mb-4" />
            <div className="h-64 bg-surface-secondary rounded animate-pulse" />
          </div>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-foreground-secondary text-sm mb-1">
                <Icon icon="globe" size="xs" />
                Total Requests
              </div>
              <div className="text-2xl font-semibold text-foreground">
                {formatNumber(data.summary.totalRequests)}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="success" className="text-xs">
                  {data.summary.successRate}% success
                </Badge>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-foreground-secondary text-sm mb-1">
                <Icon icon="check" size="xs" />
                Success / Errors
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-success">
                  {formatNumber(data.summary.successRequests)}
                </span>
                <span className="text-foreground-secondary">/</span>
                <span className="text-xl font-semibold text-error">
                  {formatNumber(data.summary.errorRequests)}
                </span>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-foreground-secondary text-sm mb-1">
                <Icon icon="terminal" size="xs" />
                Tokens Used
              </div>
              <div className="text-2xl font-semibold text-foreground">
                {formatNumber(data.summary.totalTokensIn + data.summary.totalTokensOut)}
              </div>
              <div className="mt-1 text-xs text-foreground-tertiary">
                {formatNumber(data.summary.totalTokensIn)} in /{' '}
                {formatNumber(data.summary.totalTokensOut)} out
              </div>
            </div>

            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-foreground-secondary text-sm mb-1">
                <Icon icon="info" size="xs" />
                Estimated Cost
              </div>
              <div className="text-2xl font-semibold text-foreground">
                {formatCost(data.summary.estimatedCostCents)}
              </div>
              <div className="mt-1 text-xs text-foreground-tertiary">
                Last{' '}
                {period === 'hourly' ? '24 hours' : period === 'daily' ? '30 days' : '12 months'}
              </div>
            </div>
          </div>

          {/* Time Series Chart (simplified bar representation) */}
          {data.timeSeries.length > 0 && (
            <div className="bg-surface border border-border rounded-lg p-6">
              <h3 className="text-sm font-medium text-foreground mb-4">
                Requests Over Time ({period})
              </h3>
              <div className="h-48 flex items-end gap-1">
                {data.timeSeries.slice(-30).map((point, idx) => {
                  const maxRequests = Math.max(...data.timeSeries.map((p) => p.totalRequests));
                  const height = maxRequests > 0 ? (point.totalRequests / maxRequests) * 100 : 0;
                  const successHeight =
                    point.totalRequests > 0
                      ? (point.successRequests / point.totalRequests) * height
                      : 0;

                  return (
                    <div
                      key={`bar-${idx}`}
                      className="flex-1 flex flex-col justify-end"
                      title={`${new Date(point.periodStart).toLocaleDateString()}: ${point.totalRequests} requests`}
                    >
                      <div
                        className="bg-error/30 rounded-t"
                        style={{ height: `${height - successHeight}%` }}
                      />
                      <div
                        className="bg-success rounded-b"
                        style={{ height: `${successHeight}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-foreground-tertiary">
                <span>
                  {data.timeSeries[0]?.periodStart &&
                    new Date(data.timeSeries[0].periodStart).toLocaleDateString()}
                </span>
                <span>
                  {data.timeSeries.at(-1)?.periodStart &&
                    new Date(data.timeSeries.at(-1)!.periodStart).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}

          {/* Usage by Endpoint and API Key */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Endpoint */}
            <div className="bg-surface border border-border rounded-lg p-6">
              <h3 className="text-sm font-medium text-foreground mb-4">Top Endpoints</h3>
              {data.byEndpoint.length === 0 ? (
                <p className="text-foreground-tertiary text-sm">No endpoint data yet</p>
              ) : (
                <div className="space-y-3">
                  {data.byEndpoint.slice(0, 10).map((endpoint, idx) => {
                    const maxCount = data.byEndpoint[0]?.count || 1;
                    const percentage = (endpoint.count / maxCount) * 100;

                    return (
                      <div key={`endpoint-${idx}`}>
                        <div className="flex justify-between items-center text-sm mb-1">
                          <code className="text-foreground-secondary font-mono text-xs truncate max-w-[70%]">
                            {endpoint.endpoint}
                          </code>
                          <span className="text-foreground font-medium">
                            {formatNumber(endpoint.count)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* By API Key */}
            <div className="bg-surface border border-border rounded-lg p-6">
              <h3 className="text-sm font-medium text-foreground mb-4">Usage by API Key</h3>
              {data.byApiKey.length === 0 ? (
                <p className="text-foreground-tertiary text-sm">No API key usage yet</p>
              ) : (
                <div className="space-y-3">
                  {data.byApiKey.slice(0, 10).map((key, idx) => {
                    const maxRequests = data.byApiKey[0]?.requests || 1;
                    const percentage = (key.requests / maxRequests) * 100;

                    return (
                      <div key={`key-${idx}`}>
                        <div className="flex justify-between items-center text-sm mb-1">
                          <div className="flex items-center gap-2">
                            <Icon icon="key" size="xs" className="text-foreground-tertiary" />
                            <span className="text-foreground">{key.name}</span>
                            <code className="text-foreground-tertiary text-xs font-mono">
                              {key.keyPrefix}...
                            </code>
                          </div>
                          <span className="text-foreground font-medium">
                            {formatNumber(key.requests)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Empty state for no data */}
          {data.summary.totalRequests === 0 && (
            <div className="bg-surface border border-border rounded-lg p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Icon icon="globe" size="lg" className="text-primary" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No usage data yet</h3>
              <p className="text-foreground-secondary mb-4">
                Start using your API keys to see usage statistics here.
              </p>
              <Button onClick={() => router.push('/dashboard/settings/tpmjs-api-keys')}>
                <Icon icon="key" size="sm" className="mr-2" />
                Manage API Keys
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </DashboardLayout>
  );
}
