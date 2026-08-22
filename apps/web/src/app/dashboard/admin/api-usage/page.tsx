'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@tpmjs/ui/Table/Table';
import { useState } from 'react';
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
import type { ApiUsageStats } from '~/lib/admin/types';

function LimitBar({ used, limit }: { used: number; limit: number }) {
  const ratio = limit > 0 ? Math.min(1, used / limit) : 0;
  const tone = ratio >= 0.9 ? 'bg-error' : ratio >= 0.6 ? 'bg-warning' : 'bg-success';
  return (
    <div className="min-w-[8rem]">
      <div className="flex justify-between text-xs tabular-nums mb-1">
        <span>{formatNumber(used)}</span>
        <span className="text-foreground-tertiary">/ {formatNumber(limit)} per h</span>
      </div>
      <div className="h-1.5 rounded bg-border overflow-hidden">
        <div className={`h-full rounded ${tone}`} style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}

export default function AdminApiUsagePage() {
  const [hours, setHours] = useState(24);
  const res = useAdminResource<ApiUsageStats>(`/api/admin/api-usage?hours=${hours}`, {
    refreshMs: 30_000,
  });
  const d = res.data;

  return (
    <DashboardLayout
      title="API usage"
      subtitle="Platform API keys: who is calling what, how fast, and how close to their rate limit"
      showBackButton
    >
      <RefreshBar updatedAt={res.updatedAt} refreshing={res.refreshing} onRefresh={res.refresh}>
        <WindowTabs hours={hours} onChange={setHours} />
      </RefreshBar>
      <PageState loading={res.loading} error={res.error} onRetry={res.refresh}>
        {d && (
          <div className="space-y-6">
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Kpi
                label={`Requests · ${d.totals.window}`}
                value={formatNumber(d.totals.total)}
                icon="key"
              />
              <Kpi
                label="4xx / 5xx"
                value={formatNumber(d.totals.error)}
                hint={formatPercent(d.totals.error, d.totals.total)}
                tone={d.totals.error > 0 ? 'warn' : 'good'}
                icon="alertCircle"
              />
              <Kpi label="p50 latency" value={formatMs(d.totals.p50Ms)} icon="clock" />
              <Kpi label="p95 latency" value={formatMs(d.totals.p95Ms)} icon="clock" />
            </section>

            <Panel title="Requests per hour" description="Red = error responses">
              <HourlyChart
                points={d.hourly}
                labels={{ primary: 'requests', secondary: 'errors' }}
                secondaryColor="#ef4444"
              />
            </Panel>

            <Panel
              title="API keys"
              description="Usage in the window and consumption of the current rolling-hour limit"
            >
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead className="text-right">Requests</TableHead>
                      <TableHead className="text-right">Errors</TableHead>
                      <TableHead className="text-right">p50</TableHead>
                      <TableHead>This hour</TableHead>
                      <TableHead className="text-right">Last used</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {d.keys.map((k) => (
                      <TableRow key={k.keyId}>
                        <TableCell>
                          <div className="font-medium">{k.name}</div>
                          <div className="text-xs text-foreground-tertiary">
                            <Mono>{k.keyPrefix}…</Mono>{' '}
                            {!k.isActive && <StatusBadge status="inactive" />}
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground-secondary">
                          {k.username ?? k.email ?? '—'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={k.tier} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(k.total)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {k.errors ? <span className="text-error">{k.errors}</span> : '0'}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMs(k.p50Ms)}
                        </TableCell>
                        <TableCell>
                          <LimitBar used={k.usedThisHour} limit={k.limitPerHour} />
                        </TableCell>
                        <TableCell className="text-right text-foreground-tertiary">
                          <TimeAgo iso={k.lastUsedAt} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Panel>

            <div className="grid gap-6 lg:grid-cols-3">
              <Panel title="Endpoints" className="lg:col-span-2">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Endpoint</TableHead>
                        <TableHead className="text-right">Requests</TableHead>
                        <TableHead className="text-right">Errors</TableHead>
                        <TableHead className="text-right">p50</TableHead>
                        <TableHead className="text-right">p95</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {d.byEndpoint.map((e) => (
                        <TableRow key={e.key}>
                          <TableCell>
                            <Mono>{e.key}</Mono>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatNumber(e.count)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {e.errors ? <span className="text-error">{e.errors}</span> : '0'}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatMs(e.p50Ms)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatMs(e.p95Ms)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Panel>
              <Panel title="Status codes">
                <BarList items={d.byStatusCode} />
              </Panel>
            </div>

            <Panel title="Recent errors" description="Latest 4xx/5xx responses in the window">
              {d.recentErrors.length === 0 ? (
                <p className="text-sm text-foreground-tertiary">
                  No error responses in this window.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>When</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Request</TableHead>
                        <TableHead>Key</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {d.recentErrors.map((e, i) => (
                        <TableRow key={`${e.at}-${i}`}>
                          <TableCell className="text-foreground-tertiary whitespace-nowrap">
                            <TimeAgo iso={e.at} />
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={String(e.statusCode)} />
                          </TableCell>
                          <TableCell>
                            <Mono>{`${e.method} ${e.endpoint}`}</Mono>
                          </TableCell>
                          <TableCell className="text-foreground-secondary">
                            {e.keyName ?? '—'}
                          </TableCell>
                          <TableCell className="text-xs text-error break-all max-w-md">
                            {e.errorMessage ?? e.errorCode ?? '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Panel>
          </div>
        )}
      </PageState>
    </DashboardLayout>
  );
}
