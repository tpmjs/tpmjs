'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Spinner } from '@tpmjs/ui/Spinner/Spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@tpmjs/ui/Table/Table';
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
  healthy: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30' },
  degraded: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30' },
  down: { bg: 'bg-error/10', text: 'text-error', border: 'border-error/30' },
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
        className={`w-2 h-2 rounded-full mr-2 ${status === 'healthy' ? 'bg-success' : status === 'degraded' ? 'bg-warning' : status === 'down' ? 'bg-error' : 'bg-zinc-500'}`}
      />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function CheckStatusIcon({ status }: { status: string }) {
  if (status === 'pass') {
    return <Icon icon="checkCircle" size="sm" className="text-success" />;
  }
  return <Icon icon="xCircle" size="sm" className="text-error" />;
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
          className={`text-sm mt-1 ${trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-foreground-secondary'}`}
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
          <div className="bg-error/10 border border-error/20 rounded-lg p-6 text-center">
            <p className="text-error font-medium">{error}</p>
            <Button onClick={fetchHealthData} className="mt-4">
              Retry
            </Button>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Checks</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {healthData.recentReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <span className="text-sm text-foreground">
                          {formatTimestamp(report.timestamp)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={report.overallStatus} />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">
                          <span className="text-success">{report.passCount}</span>
                          <span className="text-foreground-tertiary">/</span>
                          <span className="text-foreground-secondary">{report.totalChecks}</span>
                        </span>
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
