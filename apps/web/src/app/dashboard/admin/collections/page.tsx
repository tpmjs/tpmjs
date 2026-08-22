'use client';

import { Input } from '@tpmjs/ui/Input/Input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@tpmjs/ui/Table/Table';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  formatNumber,
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
import type { CollectionsAdmin } from '~/lib/admin/types';

export default function AdminCollectionsPage() {
  const res = useAdminResource<CollectionsAdmin>('/api/admin/collections', { refreshMs: 60_000 });
  const [filter, setFilter] = useState('');
  const d = res.data;

  const collections = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const all = d?.collections ?? [];
    if (!q) return all;
    return all.filter((c) =>
      [c.name, c.slug ?? '', c.owner.username ?? '', c.owner.email].some((v) =>
        v.toLowerCase().includes(q)
      )
    );
  }, [d, filter]);

  const publicCount = d?.collections.filter((c) => c.isPublic).length ?? 0;
  const withEnv = d?.collections.filter((c) => c.envVarNames.length > 0).length ?? 0;
  const executions = d?.collections.reduce((s, c) => s + c.executionCount, 0) ?? 0;

  return (
    <DashboardLayout
      title="Collections"
      subtitle="Every collection on the platform, and the custom MCP servers behind them"
      showBackButton
    >
      <RefreshBar updatedAt={res.updatedAt} refreshing={res.refreshing} onRefresh={res.refresh}>
        <Input
          aria-label="Filter collections"
          placeholder="Filter by name, slug or owner…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-72"
        />
      </RefreshBar>
      <PageState loading={res.loading} error={res.error} onRetry={res.refresh}>
        {d && (
          <div className="space-y-6">
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Kpi
                label="Collections"
                value={formatNumber(d.collections.length)}
                hint={`${publicCount} public`}
                icon="folder"
              />
              <Kpi
                label="With env vars"
                value={formatNumber(withEnv)}
                hint="owner-injected credentials"
                icon="key"
              />
              <Kpi
                label="Executions (all time)"
                value={formatNumber(executions)}
                icon="arrowRight"
              />
              <Kpi
                label="Custom MCP servers"
                value={formatNumber(d.customServers.length)}
                icon="link"
              />
            </section>

            <Panel title="Collections" description={`${collections.length} shown`}>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Collection</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead className="text-right">Tools</TableHead>
                      <TableHead>Env vars</TableHead>
                      <TableHead>Executor</TableHead>
                      <TableHead className="text-right">Runs</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                      <TableHead className="text-right">Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collections.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <Link
                            href={
                              c.slug && c.owner.username
                                ? `/@${c.owner.username}/collections/${c.slug}`
                                : `/dashboard/collections/${c.id}`
                            }
                            className="font-medium hover:text-primary"
                          >
                            {c.name}
                          </Link>
                          <div className="text-xs text-foreground-tertiary">
                            <Mono>{c.slug ?? c.id}</Mono>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground-secondary">
                          {c.owner.username ?? c.owner.email}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={c.isPublic ? 'public' : 'private'} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {c.registryTools}
                          {c.customTools > 0 && (
                            <span className="text-xs text-foreground-tertiary">
                              {' '}
                              +{c.customTools} custom
                            </span>
                          )}
                          {c.bridgeTools > 0 && (
                            <span className="text-xs text-foreground-tertiary">
                              {' '}
                              +{c.bridgeTools} bridge
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {c.envVarNames.length ? (
                            <span className="flex flex-wrap gap-1">
                              {c.envVarNames.map((n) => (
                                <Mono
                                  key={n}
                                  className="px-1 rounded bg-surface-hover border border-border"
                                >
                                  {n}
                                </Mono>
                              ))}
                            </span>
                          ) : (
                            <span className="text-foreground-tertiary">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-foreground-secondary">
                          {c.executorType ?? 'default'}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(c.executionCount)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(c.viewCount)}
                        </TableCell>
                        <TableCell className="text-right text-foreground-tertiary">
                          <TimeAgo iso={c.updatedAt} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Panel>

            <Panel
              title="Custom MCP servers"
              description="Remote servers users proxy through collections (tokens are never shown)"
            >
              {d.customServers.length === 0 ? (
                <p className="text-sm text-foreground-tertiary">
                  No custom MCP servers registered.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Server</TableHead>
                        <TableHead>Host</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Tools</TableHead>
                        <TableHead className="text-right">Used by</TableHead>
                        <TableHead className="text-right">Last sync</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {d.customServers.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell>
                            <Mono>{s.host}</Mono>
                          </TableCell>
                          <TableCell className="text-foreground-secondary">
                            {s.owner.username ?? s.owner.email}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={s.status} />
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{s.toolCount}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {s.collectionsUsing} coll.
                          </TableCell>
                          <TableCell className="text-right text-foreground-tertiary">
                            <TimeAgo iso={s.lastSyncAt} />
                          </TableCell>
                          <TableCell className="text-xs text-error break-all max-w-sm">
                            {s.lastSyncError ?? '—'}
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
