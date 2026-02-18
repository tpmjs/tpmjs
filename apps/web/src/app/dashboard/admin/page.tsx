'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Spinner } from '@tpmjs/ui/Spinner/Spinner';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';
import { AreaChart } from '~/components/stats/AreaChart';

interface StatsSnapshot {
  date: string;
  totalTools: number;
  totalPackages: number;
  officialTools: number;
  executionsTotal: number;
  executionsSuccessful: number;
  executionsFailed: number;
  tokensTotal: number;
  dauCount: number;
  wauCount: number;
  mauCount: number;
  searchCount: number;
  avgSearchLatencyMs: number | null;
  topSearchQueries: Array<{ query: string; count: number }> | null;
  mcpUniqueClients: number;
  activeDevs7d: number;
  totalCollections: number;
  totalAgents: number;
  totalSimulations: number;
  eventToolCalls: number;
  eventAgentRuns: number;
  importHealthy: number;
  importBroken: number;
  executionHealthy: number;
  executionBroken: number;
  errorCategories: Record<string, number> | null;
  conversationStatuses: Record<string, number> | null;
  avgContextMessages: number | null;
  avgContextTokens: number | null;
  avgAvailableTools: number | null;
  totalConversationsDay: number;
}

interface AdminStatsData {
  latest: StatsSnapshot | null;
  trend: StatsSnapshot[];
  totalUsers: number;
  totalSessions: number;
}

function StatCard({
  label,
  value,
  icon,
  trend,
}: {
  label: string;
  value: string | number;
  icon: string;
  trend?: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-foreground-tertiary text-sm">{label}</span>
        <Icon icon={icon as 'home'} size="sm" className="text-foreground-tertiary" />
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {trend && <div className="text-xs text-foreground-tertiary mt-1">{trend}</div>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => {
        if (res.status === 403) throw new Error('Access denied. Admin role required.');
        if (!res.ok) throw new Error('Failed to load stats');
        return res.json();
      })
      .then((json) => setData(json.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Admin" subtitle="Platform overview">
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Admin" subtitle="Platform overview">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Icon icon="alertCircle" size="lg" className="text-danger" />
          <p className="text-foreground-secondary">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  const latest = data?.latest;

  return (
    <DashboardLayout title="Admin" subtitle="Platform overview">
      <div className="space-y-8">
        {/* Key Metrics */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Key Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Users" value={data?.totalUsers ?? 0} icon="user" />
            <StatCard label="DAU" value={latest?.dauCount ?? 0} icon="barChart" />
            <StatCard label="WAU" value={latest?.wauCount ?? 0} icon="barChart" />
            <StatCard label="MAU" value={latest?.mauCount ?? 0} icon="barChart" />
          </div>
        </section>

        {/* Registry Stats */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Registry</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Tools" value={latest?.totalTools ?? 0} icon="puzzle" />
            <StatCard label="Total Packages" value={latest?.totalPackages ?? 0} icon="folder" />
            <StatCard label="Collections" value={latest?.totalCollections ?? 0} icon="folder" />
            <StatCard label="Agents" value={latest?.totalAgents ?? 0} icon="terminal" />
          </div>
        </section>

        {/* Execution & Search Stats */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Activity (Daily)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Tool Calls" value={latest?.eventToolCalls ?? 0} icon="play" />
            <StatCard label="Agent Runs" value={latest?.eventAgentRuns ?? 0} icon="terminal" />
            <StatCard
              label="Searches"
              value={latest?.searchCount ?? 0}
              icon="search"
              trend={latest?.avgSearchLatencyMs ? `Avg ${latest.avgSearchLatencyMs}ms` : undefined}
            />
            <StatCard label="MCP Clients (7d)" value={latest?.mcpUniqueClients ?? 0} icon="globe" />
          </div>
        </section>

        {/* Health Status */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Health</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Import Healthy"
              value={latest?.importHealthy ?? 0}
              icon="checkCircle"
            />
            <StatCard label="Import Broken" value={latest?.importBroken ?? 0} icon="alertCircle" />
            <StatCard
              label="Exec Healthy"
              value={latest?.executionHealthy ?? 0}
              icon="checkCircle"
            />
            <StatCard label="Exec Broken" value={latest?.executionBroken ?? 0} icon="alertCircle" />
          </div>
        </section>

        {/* ML Tracking Metrics */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">ML Tracking (Daily)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Conversations"
              value={latest?.totalConversationsDay ?? 0}
              icon="message"
            />
            <StatCard
              label="Avg Context Msgs"
              value={latest?.avgContextMessages ?? '—'}
              icon="terminal"
            />
            <StatCard
              label="Avg Context Tokens"
              value={latest?.avgContextTokens ?? '—'}
              icon="barChart"
            />
            <StatCard
              label="Avg Tools Available"
              value={latest?.avgAvailableTools != null ? latest.avgAvailableTools.toFixed(1) : '—'}
              icon="puzzle"
            />
          </div>
        </section>

        {/* Error Categories + Conversation Status */}
        {(latest?.errorCategories || latest?.conversationStatuses) && (
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {latest?.errorCategories && Object.keys(latest.errorCategories).length > 0 && (
                <div className="bg-surface border border-border rounded-xl p-5">
                  <h3 className="text-sm font-medium text-foreground mb-3">Error Categories</h3>
                  <div className="space-y-2">
                    {Object.entries(latest.errorCategories)
                      .sort(([, a], [, b]) => b - a)
                      .map(([category, count]) => (
                        <div key={category} className="flex justify-between items-center">
                          <span className="text-sm text-foreground-secondary">
                            {category.replace(/_/g, ' ')}
                          </span>
                          <Badge variant="error" className="text-xs">
                            {count}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              {latest?.conversationStatuses &&
                Object.keys(latest.conversationStatuses).length > 0 && (
                  <div className="bg-surface border border-border rounded-xl p-5">
                    <h3 className="text-sm font-medium text-foreground mb-3">
                      Conversation Outcomes
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(latest.conversationStatuses)
                        .sort(([, a], [, b]) => b - a)
                        .map(([status, count]) => (
                          <div key={status} className="flex justify-between items-center">
                            <span className="text-sm text-foreground-secondary">{status}</span>
                            <Badge
                              variant={
                                status === 'completed'
                                  ? 'success'
                                  : status === 'error'
                                    ? 'error'
                                    : 'secondary'
                              }
                              className="text-xs"
                            >
                              {count}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
            </div>
          </section>
        )}

        {/* Trend Charts */}
        {data?.trend && data.trend.length > 1 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Trends (30 days)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface border border-border rounded-xl p-4">
                <AreaChart
                  data={data.trend.map((s) => ({
                    date: s.date,
                    value: s.totalTools,
                  }))}
                  title="Total Tools"
                  height={200}
                />
              </div>
              <div className="bg-surface border border-border rounded-xl p-4">
                <AreaChart
                  data={data.trend.map((s) => ({
                    date: s.date,
                    value: s.dauCount,
                    secondaryValue: s.wauCount,
                  }))}
                  title="Active Users"
                  showSecondary
                  labels={{ primary: 'DAU', secondary: 'WAU' }}
                  height={200}
                />
              </div>
              <div className="bg-surface border border-border rounded-xl p-4">
                <AreaChart
                  data={data.trend.map((s) => ({
                    date: s.date,
                    value: s.eventToolCalls,
                    secondaryValue: s.eventAgentRuns,
                  }))}
                  title="Executions"
                  showSecondary
                  labels={{ primary: 'Tool Calls', secondary: 'Agent Runs' }}
                  height={200}
                />
              </div>
              <div className="bg-surface border border-border rounded-xl p-4">
                <AreaChart
                  data={data.trend.map((s) => ({
                    date: s.date,
                    value: s.searchCount,
                  }))}
                  title="Search Volume"
                  height={200}
                />
              </div>
            </div>
          </section>
        )}

        {/* Top Search Queries */}
        {latest?.topSearchQueries && latest.topSearchQueries.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Top Searches (Today)</h2>
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-secondary">
                    <th className="text-left px-4 py-3 text-foreground-secondary font-medium">
                      Query
                    </th>
                    <th className="text-right px-4 py-3 text-foreground-secondary font-medium">
                      Count
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {latest.topSearchQueries.map((q) => (
                    <tr key={q.query} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-foreground font-mono text-xs">{q.query}</td>
                      <td className="text-right px-4 py-3">
                        <Badge variant="secondary">{q.count}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Quick Links */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Manage</h2>
          <div className="flex gap-4">
            <Link
              href="/dashboard/admin/users"
              className="flex items-center gap-2 px-4 py-3 bg-surface border border-border rounded-xl hover:bg-surface-secondary transition-colors"
            >
              <Icon icon="user" size="sm" />
              <span className="text-sm font-medium">Users</span>
            </Link>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
