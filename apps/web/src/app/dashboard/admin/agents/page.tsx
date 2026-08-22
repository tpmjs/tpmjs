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
import type { AgentsAdmin } from '~/lib/admin/types';

export default function AdminAgentsPage() {
  const res = useAdminResource<AgentsAdmin>('/api/admin/agents', { refreshMs: 60_000 });
  const d = res.data;

  return (
    <DashboardLayout
      title="Agents"
      subtitle="Every agent on the platform and the latest conversations"
      showBackButton
    >
      <RefreshBar updatedAt={res.updatedAt} refreshing={res.refreshing} onRefresh={res.refresh} />
      <PageState loading={res.loading} error={res.error} onRetry={res.refresh}>
        {d && (
          <div className="space-y-6">
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Kpi label="Agents" value={formatNumber(d.totals.agents)} icon="terminal" />
              <Kpi
                label="Conversations"
                value={formatNumber(d.totals.conversations)}
                hint={`${d.totals.conversations24h} in the last 24h`}
                icon="message"
              />
              <Kpi label="Messages" value={formatNumber(d.totals.messages)} icon="send" />
              <Kpi
                label="Public agents"
                value={formatNumber(d.agents.filter((a) => a.isPublic).length)}
                icon="globe"
              />
            </section>

            <Panel title="Agents" description="Ordered by most recent conversation">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Flags</TableHead>
                      <TableHead className="text-right">Tools</TableHead>
                      <TableHead className="text-right">Convs</TableHead>
                      <TableHead className="text-right">Msgs</TableHead>
                      <TableHead className="text-right">Runs</TableHead>
                      <TableHead className="text-right">Last active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {d.agents.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <Link
                            href={`/agents/${a.uid}`}
                            className="font-medium hover:text-primary"
                          >
                            {a.name}
                          </Link>
                          <div className="text-xs text-foreground-tertiary">
                            <Mono>{a.uid}</Mono>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground-secondary">
                          {a.owner.username ?? a.owner.email}
                        </TableCell>
                        <TableCell>
                          <Mono>{`${a.provider}/${a.modelId}`}</Mono>
                        </TableCell>
                        <TableCell>
                          <span className="flex flex-wrap gap-1">
                            <StatusBadge status={a.isPublic ? 'public' : 'private'} />
                            {a.sandboxEnabled && <StatusBadge status="sandbox" />}
                            {a.dynamicToolDiscovery && <StatusBadge status="dynamic tools" />}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{a.tools}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(a.conversationCount)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(a.messageCount)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(a.executionCount)}
                        </TableCell>
                        <TableCell className="text-right text-foreground-tertiary">
                          <TimeAgo iso={a.lastConversationAt} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Panel>

            <Panel title="Recent conversations" description="Latest 40 across all agents">
              {d.recentConversations.length === 0 ? (
                <p className="text-sm text-foreground-tertiary">No conversations yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Updated</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Messages</TableHead>
                        <TableHead className="text-right">Tool calls</TableHead>
                        <TableHead className="text-right">Started</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {d.recentConversations.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="text-foreground-tertiary whitespace-nowrap">
                            <TimeAgo iso={c.updatedAt} />
                          </TableCell>
                          <TableCell>
                            <Link href={`/agents/${c.agentUid}`} className="hover:text-primary">
                              {c.agentName}
                            </Link>
                          </TableCell>
                          <TableCell className="text-foreground-secondary">
                            {c.owner ?? '—'}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={c.status} />
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{c.messages}</TableCell>
                          <TableCell className="text-right tabular-nums">{c.toolCalls}</TableCell>
                          <TableCell className="text-right text-foreground-tertiary">
                            <TimeAgo iso={c.createdAt} />
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
