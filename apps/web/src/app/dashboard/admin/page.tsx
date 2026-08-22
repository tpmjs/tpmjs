'use client';

import { Icon } from '@tpmjs/ui/Icon/Icon';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@tpmjs/ui/Table/Table';
import Link from 'next/link';
import {
  BarList,
  formatMs,
  formatNumber,
  formatPercent,
  HourlyChart,
  Kpi,
  PageState,
  Panel,
  RefreshBar,
  StatusBadge,
  TimeAgo,
} from '~/components/admin/AdminUi';
import { useAdminResource } from '~/components/admin/useAdminResource';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';
import { AreaChart } from '~/components/stats/AreaChart';
import type { AdminOverview, WindowStats } from '~/lib/admin/types';

interface StatsSnapshot {
  date: string;
  totalTools: number;
  executionsTotal: number;
  executionsFailed: number;
  dauCount: number;
  wauCount: number;
  mauCount: number;
  searchCount: number;
  eventToolCalls: number;
  mcpUniqueClients: number;
}

interface AdminStatsData {
  latest: StatsSnapshot | null;
  trend: StatsSnapshot[];
  totalUsers: number;
  totalSessions: number;
}

const SECTIONS: Array<{ href: string; label: string; description: string }> = [
  {
    href: '/dashboard/admin/activity',
    label: 'Live activity',
    description: 'Everything as it happens',
  },
  {
    href: '/dashboard/admin/executions',
    label: 'Executions',
    description: 'Tool calls, errors, latency',
  },
  {
    href: '/dashboard/admin/api-usage',
    label: 'API usage',
    description: 'Keys, endpoints, rate limits',
  },
  {
    href: '/dashboard/admin/health',
    label: 'Health & jobs',
    description: 'Registry health, crons, executor',
  },
  {
    href: '/dashboard/admin/collections',
    label: 'Collections',
    description: 'All collections & MCP servers',
  },
  { href: '/dashboard/admin/agents', label: 'Agents', description: 'Agents & conversations' },
  { href: '/dashboard/admin/search', label: 'Search', description: 'Queries, misses, latency' },
  { href: '/dashboard/admin/users', label: 'Users', description: 'Roles, tiers, activity' },
];

function WindowRow({ label, stats, unit }: { label: string; stats: WindowStats[]; unit: string }) {
  return (
    <TableRow>
      <TableCell className="font-medium">{label}</TableCell>
      {stats.map((w) => (
        <TableCell key={w.window} className="text-right tabular-nums">
          <div>{formatNumber(w.total)}</div>
          <div className="text-xs text-foreground-tertiary">
            {w.error ? (
              <span className="text-error">{formatNumber(w.error)} err</span>
            ) : (
              'no errors'
            )}
            {w.p50Ms !== null && ` · p50 ${formatMs(w.p50Ms)}`}
          </div>
        </TableCell>
      ))}
      <TableCell className="text-right text-xs text-foreground-tertiary">{unit}</TableCell>
    </TableRow>
  );
}

export default function AdminDashboardPage() {
  const live = useAdminResource<AdminOverview>('/api/admin/overview', { refreshMs: 30_000 });
  const daily = useAdminResource<AdminStatsData>('/api/admin/stats');
  const o = live.data;

  return (
    <DashboardLayout title="Admin" subtitle="Everything happening on TPMJS, live">
      <RefreshBar updatedAt={live.updatedAt} refreshing={live.refreshing} onRefresh={live.refresh}>
        <nav className="flex flex-wrap gap-2" aria-label="Admin sections">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              title={s.description}
              className="text-xs px-2.5 py-1.5 rounded-md border border-border bg-surface hover:border-primary/60 hover:text-primary transition-colors"
            >
              {s.label}
            </Link>
          ))}
        </nav>
      </RefreshBar>

      <PageState loading={live.loading} error={live.error} onRetry={live.refresh}>
        {o && (
          <div className="space-y-8">
            <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
              <Kpi
                label="Tool calls · 24h"
                value={formatNumber(o.executions[1]?.total)}
                hint={`${formatNumber(o.executions[0]?.total)} in the last hour`}
                icon="arrowRight"
              />
              <Kpi
                label="Error rate · 24h"
                value={formatPercent(o.executions[1]?.error ?? 0, o.executions[1]?.total ?? 0)}
                hint={`${formatNumber(o.executions[1]?.error)} failed`}
                tone={(o.executions[1]?.error ?? 0) > 0 ? 'warn' : 'good'}
                icon="alertCircle"
              />
              <Kpi
                label="p95 latency · 24h"
                value={formatMs(o.executions[1]?.p95Ms)}
                hint={`p50 ${formatMs(o.executions[1]?.p50Ms)}`}
                icon="clock"
              />
              <Kpi
                label="API requests · 24h"
                value={formatNumber(o.apiUsage[1]?.total)}
                hint={`${o.keys.used24h} of ${o.keys.active} active keys used`}
                icon="key"
              />
              <Kpi
                label="Executor"
                value={o.executor.reachable ? 'up' : 'down'}
                hint={
                  o.executor.reachable
                    ? `${o.executor.implementationVersion ?? '?'} · ${formatMs(o.executor.latencyMs)}`
                    : (o.executor.error ?? 'unreachable')
                }
                tone={o.executor.reachable ? 'good' : 'bad'}
                icon="terminal"
              />
              <Kpi
                label="Registry health"
                value={formatPercent(o.registry.toolsHealthy, o.registry.toolsActive)}
                hint={`${o.registry.toolsBroken} broken · ${o.registry.toolsUnknown} unknown`}
                tone={o.registry.toolsBroken > 0 ? 'warn' : 'good'}
                icon="checkCircle"
              />
            </section>

            <div className="grid gap-6 xl:grid-cols-3">
              <Panel
                title="Tool calls · last 24 hours"
                description="Executions per hour; red = failures"
                className="xl:col-span-2"
              >
                <HourlyChart
                  points={o.hourly}
                  labels={{ primary: 'calls', secondary: 'failures' }}
                  secondaryColor="#ef4444"
                />
              </Panel>
              <Panel title="Health checks · 24h" description="Outcomes across all checks">
                <BarList items={o.healthChecks24h} linkFor={() => '/dashboard/admin/health'} />
              </Panel>
            </div>

            <Panel
              title="Traffic windows"
              description="Counts, failures and median latency by window"
            >
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stream</TableHead>
                      <TableHead className="text-right">1h</TableHead>
                      <TableHead className="text-right">24h</TableHead>
                      <TableHead className="text-right">7d</TableHead>
                      <TableHead className="text-right" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <WindowRow label="Tool executions" stats={o.executions} unit="executor" />
                    <WindowRow label="Platform API (keys)" stats={o.apiUsage} unit="MCP / REST" />
                  </TableBody>
                </Table>
              </div>
            </Panel>

            <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
              <Kpi
                label="Users"
                value={formatNumber(o.users.total)}
                hint={`${o.users.admins} admins · +${o.users.new7d} this week`}
                icon="user"
              />
              <Kpi
                label="Active sessions"
                value={formatNumber(o.users.activeSessions)}
                icon="globe"
              />
              <Kpi
                label="API keys"
                value={formatNumber(o.keys.active)}
                hint={`${o.keys.total} total`}
                icon="key"
              />
              <Kpi
                label="Collections"
                value={formatNumber(o.collections.total)}
                hint={`${o.collections.public} public`}
                icon="folder"
              />
              <Kpi
                label="MCP servers"
                value={formatNumber(o.collections.customServers)}
                hint={`${o.collections.bridgesConnected} bridges live`}
                icon="link"
              />
              <Kpi
                label="Agents"
                value={formatNumber(o.agents.total)}
                hint={`${o.agents.conversations24h} convs · ${o.agents.messages24h} msgs / 24h`}
                icon="terminal"
              />
              <Kpi
                label="Tools"
                value={formatNumber(o.registry.toolsActive)}
                hint={`${o.registry.packages} packages · ${o.registry.officialPackages} official`}
                icon="puzzle"
              />
              <Kpi label="Searches · 24h" value={formatNumber(o.searches24h)} icon="search" />
            </section>

            <Panel
              title="Background jobs"
              description="Latest run per sync source (cron timers on the box)"
              actions={
                <Link
                  href="/dashboard/admin/health"
                  className="text-xs text-primary hover:underline"
                >
                  details →
                </Link>
              }
            >
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Processed</TableHead>
                      <TableHead className="text-right">Errors</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead className="text-right">When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {o.syncRuns.map((r) => (
                      <TableRow key={r.source}>
                        <TableCell className="font-medium">{r.source}</TableCell>
                        <TableCell>
                          <StatusBadge status={r.status} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(r.processed)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {r.errors ? <span className="text-error">{r.errors}</span> : '0'}
                        </TableCell>
                        <TableCell
                          className="max-w-md truncate text-foreground-secondary"
                          title={r.message ?? ''}
                        >
                          {r.message ?? '—'}
                        </TableCell>
                        <TableCell className="text-right text-foreground-tertiary">
                          <TimeAgo iso={r.createdAt} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Panel>

            <Panel
              title="Daily snapshots"
              description="Rolled up once a day by the tpmjs-cron timer"
            >
              {daily.error ? (
                <p className="text-sm text-foreground-tertiary">{daily.error}</p>
              ) : daily.data?.trend.length ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  <AreaChart
                    title="Tool calls per day"
                    data={daily.data.trend.map((s) => ({
                      date: s.date,
                      value: s.eventToolCalls,
                      secondaryValue: s.executionsFailed,
                    }))}
                    showSecondary
                    labels={{ primary: 'tool calls', secondary: 'failed' }}
                    secondaryColor="#ef4444"
                    height={200}
                  />
                  <AreaChart
                    title="Daily / weekly active users"
                    data={daily.data.trend.map((s) => ({
                      date: s.date,
                      value: s.dauCount,
                      secondaryValue: s.wauCount,
                    }))}
                    showSecondary
                    labels={{ primary: 'DAU', secondary: 'WAU' }}
                    height={200}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-foreground-tertiary">
                  <Icon icon="info" size="xs" /> No snapshots yet.
                </div>
              )}
            </Panel>
          </div>
        )}
      </PageState>
    </DashboardLayout>
  );
}
