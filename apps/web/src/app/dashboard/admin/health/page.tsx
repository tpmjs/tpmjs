'use client';

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
  HourlyChart,
  Kpi,
  Mono,
  PageState,
  Panel,
  RefreshBar,
  StatusBadge,
  TimeAgo,
} from '~/components/admin/AdminUi';
import { useAdminResource } from '~/components/admin/useAdminResource';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';
import type { HealthOverview } from '~/lib/admin/types';

export default function AdminHealthPage() {
  const res = useAdminResource<HealthOverview>('/api/admin/health', { refreshMs: 30_000 });
  const d = res.data;

  const checksTotal = d?.checks24h.reduce((sum, c) => sum + c.count, 0) ?? 0;
  const healthyChecks =
    d?.checks24h.filter((c) => c.overall === 'HEALTHY').reduce((s, c) => s + c.count, 0) ?? 0;
  const activeTools = d?.distribution.reduce((sum, r) => sum + r.count, 0) ?? 0;
  const brokenTools =
    d?.distribution
      .filter((r) => r.importHealth === 'BROKEN' || r.executionHealth === 'BROKEN')
      .reduce((s, r) => s + r.count, 0) ?? 0;

  return (
    <DashboardLayout
      title="Health & jobs"
      subtitle="Registry health checks, broken tools, background jobs and the executor"
      showBackButton
    >
      <RefreshBar updatedAt={res.updatedAt} refreshing={res.refreshing} onRefresh={res.refresh} />
      <PageState loading={res.loading} error={res.error} onRetry={res.refresh}>
        {d && (
          <div className="space-y-6">
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Kpi
                label="Executor"
                value={d.executor.reachable ? 'up' : 'down'}
                hint={
                  d.executor.reachable
                    ? `${d.executor.implementationVersion ?? '?'} · protocol ${d.executor.protocolVersion ?? '?'} · ${formatMs(d.executor.latencyMs)}`
                    : (d.executor.error ?? 'unreachable')
                }
                tone={d.executor.reachable ? 'good' : 'bad'}
                icon="terminal"
              />
              <Kpi
                label="Active tools"
                value={formatNumber(activeTools)}
                hint={`${brokenTools} broken`}
                tone={brokenTools ? 'warn' : 'good'}
                icon="puzzle"
              />
              <Kpi
                label="Checks · 24h"
                value={formatNumber(checksTotal)}
                hint={`${formatNumber(healthyChecks)} healthy`}
                icon="checkCircle"
              />
              <Kpi
                label="Inconclusive · 24h"
                value={formatNumber(
                  d.checks24h
                    .filter((c) => c.overall === 'UNKNOWN')
                    .reduce((s, c) => s + c.count, 0)
                )}
                hint="retried with backoff"
                icon="alertTriangle"
              />
            </section>

            <div className="grid gap-6 lg:grid-cols-3">
              <Panel
                title="Health checks per hour"
                description="Red = not healthy"
                className="lg:col-span-2"
              >
                <HourlyChart
                  points={d.checksHourly}
                  labels={{ primary: 'checks', secondary: 'not healthy' }}
                  secondaryColor="#ef4444"
                />
              </Panel>
              <Panel title="Tool health (active tools)" description="import / execution">
                <BarList
                  items={d.distribution.map((r) => ({
                    key: `${r.importHealth} / ${r.executionHealth}`,
                    count: r.count,
                  }))}
                />
              </Panel>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Panel title="Check outcomes · 24h" description="overall / import / execution">
                <BarList
                  items={d.checks24h.map((c) => ({
                    key: `${c.overall} · ${c.importStatus} / ${c.executionStatus}`,
                    count: c.count,
                  }))}
                />
              </Panel>
              <Panel title="Top failure reasons · 24h" description="normalised error messages">
                <BarList
                  items={d.topImportErrors.map((e) => ({
                    key: `${e.key} (${e.tools} tool${e.tools === 1 ? '' : 's'})`,
                    count: e.count,
                  }))}
                />
              </Panel>
            </div>

            <Panel
              title="Broken & failing tools"
              description="Import/execution BROKEN or with a failure streak; ordered by streak"
            >
              {d.brokenTools.length === 0 ? (
                <p className="text-sm text-foreground-tertiary">No broken tools. 🎉</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tool</TableHead>
                        <TableHead>Import</TableHead>
                        <TableHead>Exec</TableHead>
                        <TableHead className="text-right">Streak</TableHead>
                        <TableHead>Last error</TableHead>
                        <TableHead className="text-right">Checked</TableHead>
                        <TableHead className="text-right">Next</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {d.brokenTools.map((t) => (
                        <TableRow key={t.toolId}>
                          <TableCell>
                            <Link
                              href={`/tool/${encodeURIComponent(t.packageName)}/${encodeURIComponent(t.toolName)}`}
                              className="hover:text-primary"
                            >
                              <Mono>{`${t.packageName}@${t.npmVersion}::${t.toolName}`}</Mono>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={t.importHealth} />
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={t.executionHealth} />
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {t.consecutiveImportFailures}
                          </TableCell>
                          <TableCell className="max-w-md">
                            <span
                              className="text-xs text-foreground-secondary break-all"
                              title={t.error ?? ''}
                            >
                              {t.error ? t.error.slice(0, 120) : '—'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-foreground-tertiary">
                            <TimeAgo iso={t.lastHealthCheck} />
                          </TableCell>
                          <TableCell className="text-right text-foreground-tertiary">
                            <TimeAgo iso={t.nextCheckAt} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Panel>

            <div className="grid gap-6 lg:grid-cols-2">
              <Panel title="Background jobs — latest run per source">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Processed</TableHead>
                        <TableHead className="text-right">Errors</TableHead>
                        <TableHead className="text-right">When</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {d.syncRuns.map((r) => (
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
                title="Endpoint health reports"
                description="External smoke checks of the public surfaces"
              >
                {d.endpointReports.length === 0 ? (
                  <p className="text-sm text-foreground-tertiary">No reports yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>When</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Pass / total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {d.endpointReports.map((r, i) => (
                          <TableRow key={`${r.at}-${i}`}>
                            <TableCell className="text-foreground-tertiary whitespace-nowrap">
                              <TimeAgo iso={r.at} />
                            </TableCell>
                            <TableCell>{r.source}</TableCell>
                            <TableCell>
                              <StatusBadge status={r.overallStatus} />
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {r.passCount} / {r.totalChecks}
                              {r.failCount > 0 && (
                                <span className="text-error ml-1">({r.failCount} failed)</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Panel>
            </div>

            <Panel title="Recent job log" description="Last 40 sync_logs rows">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Processed</TableHead>
                      <TableHead className="text-right">Errors</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {d.recentSyncLogs.map((r, i) => (
                      <TableRow key={`${r.createdAt}-${i}`}>
                        <TableCell className="text-foreground-tertiary whitespace-nowrap">
                          <TimeAgo iso={r.createdAt} />
                        </TableCell>
                        <TableCell>{r.source}</TableCell>
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
                          className="max-w-lg truncate text-foreground-secondary"
                          title={r.message ?? ''}
                        >
                          {r.message ?? '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Panel>
          </div>
        )}
      </PageState>
    </DashboardLayout>
  );
}
