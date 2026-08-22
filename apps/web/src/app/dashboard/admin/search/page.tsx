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
import { useState } from 'react';
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
  TimeAgo,
  WindowTabs,
} from '~/components/admin/AdminUi';
import { useAdminResource } from '~/components/admin/useAdminResource';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';
import type { SearchAdmin } from '~/lib/admin/types';

export default function AdminSearchPage() {
  const [hours, setHours] = useState(168);
  const res = useAdminResource<SearchAdmin>(`/api/admin/search?hours=${hours}`, {
    refreshMs: 60_000,
  });
  const d = res.data;

  return (
    <DashboardLayout
      title="Search"
      subtitle="What people look for, what they don't find, and how fast"
      showBackButton
    >
      <RefreshBar updatedAt={res.updatedAt} refreshing={res.refreshing} onRefresh={res.refresh}>
        <WindowTabs hours={hours} onChange={setHours} />
      </RefreshBar>
      <PageState loading={res.loading} error={res.error} onRetry={res.refresh}>
        {d && (
          <div className="space-y-6">
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Kpi label="Searches" value={formatNumber(d.total)} icon="search" />
              <Kpi
                label="Zero-result"
                value={formatNumber(d.zeroResult)}
                hint={formatPercent(d.zeroResult, d.total)}
                tone={d.total && d.zeroResult / d.total > 0.25 ? 'warn' : undefined}
                icon="alertCircle"
              />
              <Kpi label="p50 latency" value={formatMs(d.p50Ms)} icon="clock" />
              <Kpi label="Window" value={`${hours}h`} icon="clock" />
            </section>

            <Panel title="Searches per hour" description="Red = zero results">
              <HourlyChart
                points={d.hourly}
                labels={{ primary: 'searches', secondary: 'zero results' }}
                secondaryColor="#ef4444"
              />
            </Panel>

            <div className="grid gap-6 lg:grid-cols-2">
              <Panel title="Top queries">
                <BarList
                  items={d.topQueries}
                  linkFor={(q) => `/tools?q=${encodeURIComponent(q)}`}
                  max={20}
                />
              </Panel>
              <Panel
                title="Queries with no results"
                description="Demand the registry doesn't meet yet"
              >
                <BarList
                  items={d.zeroResultQueries}
                  emptyText="Every search found something."
                  max={20}
                />
              </Panel>
            </div>

            <Panel title="Recent searches">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Query</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead className="text-right">Results</TableHead>
                      <TableHead className="text-right">Latency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {d.recent.map((s, i) => (
                      <TableRow key={`${s.at}-${i}`}>
                        <TableCell className="text-foreground-tertiary whitespace-nowrap">
                          <TimeAgo iso={s.at} />
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/tools?q=${encodeURIComponent(s.query)}`}
                            className="hover:text-primary"
                          >
                            {s.query}
                          </Link>
                        </TableCell>
                        <TableCell className="text-foreground-secondary">
                          {s.username ?? 'anonymous'}
                        </TableCell>
                        <TableCell
                          className={`text-right tabular-nums ${s.resultCount === 0 ? 'text-error' : ''}`}
                        >
                          {s.resultCount}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMs(s.latencyMs)}
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
