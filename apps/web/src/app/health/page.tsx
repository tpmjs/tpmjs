'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Spinner } from '@tpmjs/ui/Spinner/Spinner';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';

interface CheckStat {
  name: string;
  pass: number;
  fail: number;
  total: number;
  successRate: string;
}

interface RecentReport {
  id: string;
  timestamp: string;
  source: string;
  runId?: string;
  overallStatus: string;
  passCount: number;
  failCount: number;
  totalChecks: number;
  checks: Record<string, string>;
}

interface HealthData {
  currentStatus: string;
  lastChecked: string | null;
  summary: {
    totalReports: number;
    healthy: number;
    degraded: number;
    down: number;
    uptimePercent: string;
    timeRange: string;
  };
  checkStats: CheckStat[];
  recentReports: RecentReport[];
}

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  healthy: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/30' },
  degraded: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/30' },
  down: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30' },
  unknown: { bg: 'bg-zinc-500/10', text: 'text-zinc-500', border: 'border-zinc-500/30' },
};

const checkLabels: Record<string, string> = {
  basic_health: 'Basic Health',
  database: 'Database',
  stats_api: 'Platform Stats',
  mcp_http_init: 'MCP HTTP Init',
  mcp_http_tools: 'MCP HTTP Tools',
  mcp_sse: 'MCP SSE',
  mcp_info: 'MCP Server Info',
  tool_health_stats: 'Tool Health Stats',
};

function StatusBadge({ status }: { status: string }) {
  const colors = statusColors[status] ??
    statusColors.unknown ?? {
      bg: 'bg-zinc-500/10',
      text: 'text-zinc-500',
      border: 'border-zinc-500/30',
    };
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text} border ${colors.border}`}
    >
      <span
        className={`w-2 h-2 rounded-full mr-2 ${status === 'healthy' ? 'bg-green-500' : status === 'degraded' ? 'bg-yellow-500' : status === 'down' ? 'bg-red-500' : 'bg-zinc-500'}`}
      />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function CheckStatusIcon({ status }: { status: string }) {
  if (status === 'pass') {
    return (
      <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="bg-surface-elevated rounded-lg border border-border p-6">
      <p className="text-sm text-foreground-tertiary mb-1">{title}</p>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      {subtitle && (
        <p
          className={`text-sm mt-1 ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-foreground-secondary'}`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default function HealthPage() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchHealthData = useCallback(async () => {
    try {
      const response = await fetch('/api/health/report?hours=24&limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch health data');
      }
      const json = await response.json();
      if (json.success) {
        setHealthData(json.data);
        setError(null);
      } else {
        throw new Error(json.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load health data');
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => {
    fetchHealthData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000);
    return () => clearInterval(interval);
  }, [fetchHealthData]);

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleString();
  };

  const getTimeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">System Status</h1>
              <p className="text-foreground-secondary mt-1">
                Real-time health monitoring for TPMJS services
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-foreground-tertiary">Last updated</p>
              <p className="text-sm text-foreground-secondary">
                {lastRefresh.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
            <p className="text-red-500 font-medium">{error}</p>
            <button
              type="button"
              onClick={fetchHealthData}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : healthData ? (
          <>
            {/* Current Status Banner */}
            <div
              className={`rounded-lg border p-6 mb-8 ${statusColors[healthData.currentStatus]?.bg ?? 'bg-zinc-500/10'} ${statusColors[healthData.currentStatus]?.border ?? 'border-zinc-500/30'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <StatusBadge status={healthData.currentStatus} />
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      {healthData.currentStatus === 'healthy'
                        ? 'All Systems Operational'
                        : healthData.currentStatus === 'degraded'
                          ? 'Partial System Outage'
                          : healthData.currentStatus === 'down'
                            ? 'Major Outage'
                            : 'Status Unknown'}
                    </p>
                    {healthData.lastChecked && (
                      <p className="text-sm text-foreground-secondary">
                        Last checked {getTimeAgo(healthData.lastChecked)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">
                    {healthData.summary.uptimePercent}
                  </p>
                  <p className="text-sm text-foreground-secondary">
                    Uptime ({healthData.summary.timeRange})
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Total Checks"
                value={healthData.summary.totalReports}
                subtitle={healthData.summary.timeRange}
              />
              <StatCard title="Healthy" value={healthData.summary.healthy} trend="up" />
              <StatCard
                title="Degraded"
                value={healthData.summary.degraded}
                trend={healthData.summary.degraded > 0 ? 'down' : 'neutral'}
              />
              <StatCard
                title="Down"
                value={healthData.summary.down}
                trend={healthData.summary.down > 0 ? 'down' : 'neutral'}
              />
            </div>

            {/* Service Health */}
            <div className="bg-surface-elevated rounded-lg border border-border p-6 mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">Service Health</h2>
              <div className="space-y-3">
                {healthData.checkStats.map((check) => (
                  <div
                    key={check.name}
                    className="flex items-center justify-between py-3 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <CheckStatusIcon status={check.fail === 0 ? 'pass' : 'fail'} />
                      <span className="text-foreground font-medium">
                        {checkLabels[check.name] || check.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={check.fail === 0 ? 'success' : 'error'}>
                        {check.successRate}
                      </Badge>
                      <span className="text-sm text-foreground-secondary">
                        {check.pass}/{check.total} passed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Reports */}
            <div className="bg-surface-elevated rounded-lg border border-border p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Recent Health Checks</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 text-sm font-medium text-foreground-secondary">
                        Time
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-foreground-secondary">
                        Status
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-foreground-secondary">
                        Checks
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-foreground-secondary">
                        Source
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {healthData.recentReports.map((report) => (
                      <tr key={report.id} className="border-b border-border last:border-0">
                        <td className="py-3 px-2">
                          <span className="text-sm text-foreground">
                            {formatTimestamp(report.timestamp)}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <StatusBadge status={report.overallStatus} />
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-sm text-foreground">
                            <span className="text-green-500">{report.passCount}</span>
                            <span className="text-foreground-tertiary">/</span>
                            <span className="text-foreground-secondary">{report.totalChecks}</span>
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-sm text-foreground-secondary">{report.source}</span>
                          {report.runId && (
                            <Link
                              href={`https://github.com/tpmjs/tpmjs/actions/runs/${report.runId}`}
                              target="_blank"
                              className="ml-2 text-primary hover:underline text-xs"
                            >
                              View Run
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Links */}
            <div className="mt-8 text-center text-sm text-foreground-tertiary">
              <p>
                Health checks run every 5 minutes via{' '}
                <Link
                  href="https://github.com/tpmjs/tpmjs/actions/workflows/endpoint-health-check.yml"
                  target="_blank"
                  className="text-primary hover:underline"
                >
                  GitHub Actions
                </Link>
              </p>
              <p className="mt-2">
                View{' '}
                <Link href="/api/health" className="text-primary hover:underline">
                  /api/health
                </Link>{' '}
                |{' '}
                <Link href="/api/health/report" className="text-primary hover:underline">
                  /api/health/report
                </Link>{' '}
                |{' '}
                <Link href="/api/stats/health" className="text-primary hover:underline">
                  /api/stats/health
                </Link>
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-foreground-secondary">No health data available yet.</p>
            <p className="text-sm text-foreground-tertiary mt-2">
              Health checks run every 5 minutes. Check back soon.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
