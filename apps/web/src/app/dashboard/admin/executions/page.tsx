'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Select } from '@tpmjs/ui/Select/Select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@tpmjs/ui/Table/Table';
import { useMemo, useState } from 'react';
import {
  BarList,
  formatMs,
  formatNumber,
  formatPercent,
  HourlyChart,
  Kpi,
  Mono,
  PageState,
  Panel,
  RefreshBar,
  StatusBadge,
  TimeAgo,
  WindowTabs,
} from '~/components/admin/AdminUi';
import { useAdminResource } from '~/components/admin/useAdminResource';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';
import type { ExecutionStats } from '~/lib/admin/types';

const PAGE = 50;

export default function AdminExecutionsPage() {
  const [hours, setHours] = useState(24);
  const [status, setStatus] = useState('');
  const [pkg, setPkg] = useState('');
  const [source, setSource] = useState('');
  const [offset, setOffset] = useState(0);

  const url = useMemo(() => {
    const q = new URLSearchParams({
      hours: String(hours),
      limit: String(PAGE),
      offset: String(offset),
    });
    if (status) q.set('status', status);
    if (pkg) q.set('package', pkg);
    if (source) q.set('source', source);
    return `/api/admin/executions?${q.toString()}`;
  }, [hours, status, pkg, source, offset]);

  const res = useAdminResource<ExecutionStats>(url, { refreshMs: 30_000 });
  const d = res.data;
  const reset = () => setOffset(0);

  return (
    <DashboardLayout
      title="Executions"
      subtitle="Every tool call routed through the executor"
      showBackButton
    >
      <RefreshBar updatedAt={res.updatedAt} refreshing={res.refreshing} onRefresh={res.refresh}>
        <WindowTabs
          hours={hours}
          onChange={(h) => {
            setHours(h);
            reset();
          }}
        />
        <Select
          size="sm"
          aria-label="Status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            reset();
          }}
          options={[
            { value: '', label: 'status: all' },
            ...(d?.facets.statuses ?? []).map((s) => ({ value: s, label: s })),
          ]}
        />
        <Select
          size="sm"
          aria-label="Package"
          value={pkg}
          onChange={(e) => {
            setPkg(e.target.value);
            reset();
          }}
          options={[
            { value: '', label: 'package: all' },
            ...(d?.facets.packages ?? []).map((s) => ({ value: s, label: s })),
          ]}
        />
        <Select
          size="sm"
          aria-label="Source"
          value={source}
          onChange={(e) => {
            setSource(e.target.value);
            reset();
          }}
          options={[
            { value: '', label: 'source: all' },
            ...(d?.facets.sources ?? []).map((s) => ({ value: s, label: s })),
          ]}
        />
      </RefreshBar>

      <PageState loading={res.loading} error={res.error} onRetry={res.refresh}>
        {d && (
          <div className="space-y-6">
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Kpi
                label={`Calls · ${d.totals.window}`}
                value={formatNumber(d.totals.total)}
                icon="arrowRight"
              />
              <Kpi
                label="Failed"
                value={formatNumber(d.totals.error)}
                hint={formatPercent(d.totals.error, d.totals.total)}
                tone={d.totals.error > 0 ? 'warn' : 'good'}
                icon="alertCircle"
              />
              <Kpi label="p50 latency" value={formatMs(d.totals.p50Ms)} icon="clock" />
              <Kpi label="p95 latency" value={formatMs(d.totals.p95Ms)} icon="clock" />
            </section>

            <Panel title="Calls per hour" description="Red = failures">
              <HourlyChart
                points={d.hourly}
                labels={{ primary: 'calls', secondary: 'failures' }}
                secondaryColor="#ef4444"
              />
            </Panel>

            <div className="grid gap-6 lg:grid-cols-3">
              <Panel title="By status">
                <BarList items={d.byStatus} />
              </Panel>
              <Panel title="By error category">
                <BarList items={d.byCategory} />
              </Panel>
              <Panel title="By source">
                <BarList items={d.bySource} />
              </Panel>
            </div>

            <Panel title="Top tools" description="Most-called package::tool in this window">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tool</TableHead>
                      <TableHead className="text-right">Calls</TableHead>
                      <TableHead className="text-right">Errors</TableHead>
                      <TableHead className="text-right">Avg</TableHead>
                      <TableHead className="text-right">p95</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {d.topTools.map((t) => (
                      <TableRow key={t.key}>
                        <TableCell>
                          <Mono>{t.key}</Mono>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(t.count)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {t.errors ? <span className="text-error">{t.errors}</span> : '0'}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMs(t.avgMs)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMs(t.p95Ms)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Panel>

            <Panel
              title="Recent executions"
              description={`${formatNumber(d.total)} matching · showing ${offset + 1}–${Math.min(offset + PAGE, d.total)}`}
              actions={
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={offset === 0}
                    onClick={() => setOffset(Math.max(0, offset - PAGE))}
                  >
                    Newer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={offset + PAGE >= d.total}
                    onClick={() => setOffset(offset + PAGE)}
                  >
                    Older
                  </Button>
                </>
              }
            >
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tool</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Caller</TableHead>
                      <TableHead className="text-right">Duration</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {d.rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-foreground-tertiary whitespace-nowrap">
                          <TimeAgo iso={r.at} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={r.status} />
                        </TableCell>
                        <TableCell>
                          <Mono>{`${r.packageName ?? r.eventType}::${r.toolName ?? '—'}`}</Mono>
                        </TableCell>
                        <TableCell className="text-foreground-secondary">{r.source}</TableCell>
                        <TableCell className="text-foreground-secondary">
                          {r.username ?? r.apiKeyName ?? '—'}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMs(r.durationMs)}
                        </TableCell>
                        <TableCell className="max-w-sm">
                          {r.errorMessage ? (
                            <span className="text-xs text-error break-all" title={r.errorMessage}>
                              {r.errorCategory && <Mono className="mr-1">{r.errorCategory}</Mono>}
                              {r.errorMessage.slice(0, 140)}
                            </span>
                          ) : (
                            '—'
                          )}
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
