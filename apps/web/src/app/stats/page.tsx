'use client';

import { useEffect, useState } from 'react';
import { AnimatedCounter } from '~/components/stats/AnimatedCounter';
import { AreaChart } from '~/components/stats/AreaChart';
import { BarChart } from '~/components/stats/BarChart';
import { DonutChart } from '~/components/stats/DonutChart';

interface StatsData {
  overview: {
    totalTools: number;
    totalPackages: number;
    officialTools: number;
    officialPackages: number;
    toolsWithExtractedSchema: number;
    totalNpmDownloads: number;
    totalGithubStars: number;
  };
  health: {
    import: { healthy: number; broken: number; unknown: number };
    execution: { healthy: number; broken: number; unknown: number };
    healthChecksLast24h: number;
    healthChecksLast7d: number;
  };
  quality: {
    distribution: Record<string, number>;
  };
  categories: Record<string, number>;
  tiers: { minimal: number; rich: number };
  recentActivity: {
    toolsAddedLast24h: number;
    toolsAddedLast7d: number;
    toolsAddedLast30d: number;
    packagesAddedLast7d: number;
  };
  executions: {
    total: number;
    successful: number;
    failed: number;
    successRate: string;
    last24h: number;
    last7d: number;
    timing: {
      avgMs: number | null;
      minMs: number | null;
      maxMs: number | null;
    };
  };
  tokens: {
    totalRecorded: number;
    totals: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      estimatedCostUsd: string;
    };
    averages: {
      tokensPerExecution: number | null;
      costPerExecutionUsd: string | null;
    };
  };
  sync: {
    status: Record<string, unknown>;
    recentOperations: Array<{
      source: string;
      status: string;
      processed: number;
      skipped: number;
      errors: number;
      timestamp: string;
      durationMs: number | null;
    }>;
  };
}

interface ExecutionsData {
  overview: {
    total: number;
    successful: number;
    failed: number;
    timeout: number;
    successRate: string;
  };
  activity: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
  timing: {
    avgMs: number | null;
    minMs: number | null;
    maxMs: number | null;
    p50Ms: number | null;
    p95Ms: number | null;
  };
  trends: {
    hourly: Array<{ hour: string; count: number; successCount: number; errorCount: number }>;
    daily: Array<{ date: string; count: number; successCount: number; errorCount: number }>;
  };
}

interface StatsSnapshot {
  id: string;
  date: string;
  totalTools: number;
  totalPackages: number;
  totalNpmDownloads: number;
  totalGithubStars: number;
  importHealthy: number;
  importBroken: number;
  executionHealthy: number;
  executionBroken: number;
  executionsTotal: number;
  executionsSuccessful: number;
  executionsFailed: number;
  tokensTotal: number;
}

const QUALITY_COLORS: Record<string, string> = {
  excellent: '#22c55e',
  high: '#84cc16',
  medium: '#eab308',
  'medium-low': '#f97316',
  low: '#ef4444',
  unscored: '#6b7280',
};

const HEALTH_COLORS = {
  healthy: '#22c55e',
  broken: '#ef4444',
  unknown: '#6b7280',
};

const TIER_COLORS = {
  rich: '#8b5cf6',
  minimal: '#06b6d4',
};

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [executions, setExecutions] = useState<ExecutionsData | null>(null);
  const [history, setHistory] = useState<StatsSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, execRes, historyRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/stats/executions'),
          fetch('/api/sync/stats-snapshot?days=90'),
        ]);

        if (!statsRes.ok || !execRes.ok) {
          throw new Error('Failed to fetch stats');
        }

        const statsJson = await statsRes.json();
        const execJson = await execRes.json();
        const historyJson = await historyRes.json();

        if (statsJson.success) {
          setStats(statsJson.data);
        }
        if (execJson.success) {
          setExecutions(execJson.data);
        }
        if (historyJson.success && historyJson.data?.snapshots) {
          setHistory(historyJson.data.snapshots);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-foreground-secondary animate-pulse">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-error mb-2">Failed to load statistics</h2>
          <p className="text-foreground-secondary">{error || 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const qualityData = Object.entries(stats.quality.distribution)
    .filter(([bucket]) => bucket !== 'unscored')
    .map(([bucket, count]) => ({
      label: bucket.charAt(0).toUpperCase() + bucket.slice(1).replace('-', ' '),
      value: count,
      color: QUALITY_COLORS[bucket] || '#6b7280',
    }));

  const importHealthData = [
    { label: 'Healthy', value: stats.health.import.healthy, color: HEALTH_COLORS.healthy },
    { label: 'Broken', value: stats.health.import.broken, color: HEALTH_COLORS.broken },
    { label: 'Unknown', value: stats.health.import.unknown, color: HEALTH_COLORS.unknown },
  ].filter((d) => d.value > 0);

  const executionHealthData = [
    { label: 'Healthy', value: stats.health.execution.healthy, color: HEALTH_COLORS.healthy },
    { label: 'Broken', value: stats.health.execution.broken, color: HEALTH_COLORS.broken },
    { label: 'Unknown', value: stats.health.execution.unknown, color: HEALTH_COLORS.unknown },
  ].filter((d) => d.value > 0);

  const tierData = [
    { label: 'Rich', value: stats.tiers.rich, color: TIER_COLORS.rich },
    { label: 'Minimal', value: stats.tiers.minimal, color: TIER_COLORS.minimal },
  ].filter((d) => d.value > 0);

  const categoryData = Object.entries(stats.categories)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([label, value]) => ({ label, value }));

  // Prepare execution trend data
  const dailyTrendData =
    executions?.trends?.daily?.map((d) => ({
      date: d.date,
      value: d.successCount,
      secondaryValue: d.errorCount,
    })) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface-secondary border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-foreground">Registry Statistics</h1>
          <p className="mt-2 text-foreground-secondary">
            Real-time metrics and analytics for the TPMJS tool registry
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Overview Cards */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Tools"
              value={stats.overview.totalTools}
              icon="🔧"
              color="text-primary"
            />
            <StatCard
              label="Total Packages"
              value={stats.overview.totalPackages}
              icon="📦"
              color="text-success"
            />
            <StatCard
              label="NPM Downloads"
              value={stats.overview.totalNpmDownloads}
              icon="📥"
              color="text-warning"
              suffix="/mo"
            />
            <StatCard
              label="GitHub Stars"
              value={stats.overview.totalGithubStars}
              icon="⭐"
              color="text-accent"
            />
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Tools (24h)"
              value={stats.recentActivity.toolsAddedLast24h}
              prefix="+"
              color="text-success"
            />
            <StatCard
              label="Tools (7d)"
              value={stats.recentActivity.toolsAddedLast7d}
              prefix="+"
              color="text-success"
            />
            <StatCard
              label="Tools (30d)"
              value={stats.recentActivity.toolsAddedLast30d}
              prefix="+"
              color="text-success"
            />
            <StatCard
              label="Packages (7d)"
              value={stats.recentActivity.packagesAddedLast7d}
              prefix="+"
              color="text-primary"
            />
          </div>
        </section>

        {/* Historical Trends */}
        {history.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Historical Trends</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Tools & Packages Over Time">
                <AreaChart
                  data={history.map((s) => ({
                    date: s.date,
                    value: s.totalTools,
                    secondaryValue: s.totalPackages,
                  }))}
                  width={500}
                  height={250}
                  showSecondary
                  labels={{ primary: 'Tools', secondary: 'Packages' }}
                  color="#2563eb"
                  secondaryColor="#22c55e"
                />
              </ChartCard>
              <ChartCard title="Health Status Over Time">
                <AreaChart
                  data={history.map((s) => ({
                    date: s.date,
                    value: s.importHealthy + s.executionHealthy,
                    secondaryValue: s.importBroken + s.executionBroken,
                  }))}
                  width={500}
                  height={250}
                  showSecondary
                  labels={{ primary: 'Healthy', secondary: 'Broken' }}
                  color="#22c55e"
                  secondaryColor="#ef4444"
                />
              </ChartCard>
              <ChartCard title="Daily Executions Over Time">
                <AreaChart
                  data={history.map((s) => ({
                    date: s.date,
                    value: s.executionsSuccessful,
                    secondaryValue: s.executionsFailed,
                  }))}
                  width={500}
                  height={250}
                  showSecondary
                  labels={{ primary: 'Successful', secondary: 'Failed' }}
                  color="#22c55e"
                  secondaryColor="#ef4444"
                />
              </ChartCard>
              <ChartCard title="NPM Downloads Over Time">
                <AreaChart
                  data={history.map((s) => ({
                    date: s.date,
                    value: s.totalNpmDownloads,
                  }))}
                  width={500}
                  height={250}
                  color="#f97316"
                  showArea
                />
              </ChartCard>
            </div>
          </section>
        )}

        {/* Health & Quality Charts */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">Health & Quality</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ChartCard title="Import Health">
              <DonutChart
                data={importHealthData}
                size={180}
                centerValue={stats.health.import.healthy}
                centerLabel="Healthy"
              />
            </ChartCard>
            <ChartCard title="Execution Health">
              <DonutChart
                data={executionHealthData}
                size={180}
                centerValue={stats.health.execution.healthy}
                centerLabel="Healthy"
              />
            </ChartCard>
            <ChartCard title="Quality Distribution">
              <DonutChart
                data={qualityData}
                size={180}
                centerValue={qualityData.reduce((sum, d) => sum + d.value, 0)}
                centerLabel="Scored"
              />
            </ChartCard>
            <ChartCard title="Package Tiers">
              <DonutChart
                data={tierData}
                size={180}
                centerValue={stats.tiers.rich}
                centerLabel="Rich"
              />
            </ChartCard>
          </div>
        </section>

        {/* Execution Stats */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">Execution Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <StatCard
              label="Total Executions"
              value={stats.executions.total}
              icon="▶️"
              color="text-primary"
            />
            <StatCard
              label="Successful"
              value={stats.executions.successful}
              icon="✅"
              color="text-success"
            />
            <StatCard label="Failed" value={stats.executions.failed} icon="❌" color="text-error" />
            <StatCard
              label="Success Rate"
              value={Number.parseFloat(stats.executions.successRate)}
              suffix="%"
              decimals={1}
              color="text-success"
            />
            <StatCard
              label="Avg Time"
              value={stats.executions.timing.avgMs || 0}
              suffix="ms"
              color="text-foreground-secondary"
            />
          </div>

          {dailyTrendData.length > 0 && (
            <ChartCard title="Daily Execution Trends (Last 30 Days)">
              <AreaChart
                data={dailyTrendData}
                width={800}
                height={300}
                showSecondary
                labels={{ primary: 'Successful', secondary: 'Errors' }}
                color="#22c55e"
                secondaryColor="#ef4444"
              />
            </ChartCard>
          )}
        </section>

        {/* Token Usage */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">Token Usage</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Tokens"
              value={stats.tokens.totals.totalTokens}
              icon="🪙"
              color="text-accent"
            />
            <StatCard
              label="Input Tokens"
              value={stats.tokens.totals.inputTokens}
              color="text-primary"
            />
            <StatCard
              label="Output Tokens"
              value={stats.tokens.totals.outputTokens}
              color="text-success"
            />
            <StatCard
              label="Est. Cost"
              value={Number.parseFloat(stats.tokens.totals.estimatedCostUsd)}
              prefix="$"
              decimals={2}
              color="text-warning"
            />
          </div>
        </section>

        {/* Categories */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">Top Categories</h2>
          <ChartCard>
            <BarChart data={categoryData} width={600} height={400} horizontal showValues />
          </ChartCard>
        </section>

        {/* Sync Status */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">Sync Operations</h2>
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="space-y-4">
              {stats.sync.recentOperations.slice(0, 5).map((op, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        op.status === 'success'
                          ? 'bg-success'
                          : op.status === 'partial'
                            ? 'bg-warning'
                            : 'bg-error'
                      }`}
                    />
                    <span className="font-medium text-foreground capitalize">{op.source}</span>
                    <span className="text-foreground-tertiary text-sm">
                      {new Date(op.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-success">+{op.processed} processed</span>
                    {op.skipped > 0 && (
                      <span className="text-foreground-tertiary">{op.skipped} skipped</span>
                    )}
                    {op.errors > 0 && <span className="text-error">{op.errors} errors</span>}
                    {op.durationMs && (
                      <span className="text-foreground-tertiary">{op.durationMs}ms</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon,
  prefix = '',
  suffix = '',
  decimals = 0,
  color = 'text-foreground',
}: {
  label: string;
  value: number;
  icon?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  color?: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 hover:border-border-hover transition-colors">
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-lg">{icon}</span>}
        <span className="text-sm text-foreground-secondary">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>
        <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </div>
    </div>
  );
}

// Chart Card Wrapper
function ChartCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      {title && <h4 className="text-sm font-semibold text-foreground mb-4">{title}</h4>}
      <div className="flex justify-center">{children}</div>
    </div>
  );
}
