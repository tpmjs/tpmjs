'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Tabs } from '@tpmjs/ui/Tabs/Tabs';
import { useCallback, useMemo, useState } from 'react';
import { PageState, RefreshBar, StatusBadge } from '~/components/admin/AdminUi';
import { fetchEnvelope, useAdminResource } from '~/components/admin/useAdminResource';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';
import type { ActivityFeed, ActivityItem } from '~/lib/admin/types';

const KINDS: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'execution', label: 'Executions' },
  { id: 'api', label: 'API calls' },
  { id: 'search', label: 'Searches' },
  { id: 'sync', label: 'Jobs' },
  { id: 'health', label: 'Health' },
  { id: 'collection', label: 'Collections' },
  { id: 'agent', label: 'Agents' },
  { id: 'user', label: 'Users' },
  { id: 'key', label: 'API keys' },
];

const KIND_TONE: Record<ActivityItem['kind'], 'default' | 'secondary' | 'outline' | 'warning'> = {
  execution: 'default',
  api: 'secondary',
  search: 'outline',
  sync: 'warning',
  health: 'outline',
  collection: 'secondary',
  agent: 'secondary',
  user: 'default',
  key: 'outline',
};

function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function EventRow({ item }: { item: ActivityItem }) {
  return (
    <li className="grid grid-cols-[5.5rem_minmax(0,1fr)] sm:grid-cols-[5.5rem_7rem_minmax(0,1fr)] gap-x-3 gap-y-1 px-4 py-2.5 border-b border-border last:border-b-0 hover:bg-surface-hover">
      <span
        className="font-mono text-xs text-foreground-tertiary tabular-nums pt-0.5"
        title={new Date(item.at).toLocaleString()}
      >
        {new Date(item.at).toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
      </span>
      <span
        className="hidden sm:block text-xs font-medium text-foreground-secondary truncate pt-0.5"
        title={item.actor ?? ''}
      >
        {item.actor ?? '—'}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant={KIND_TONE[item.kind]} size="sm">
            {item.kind}
          </Badge>
          <span className="font-medium text-foreground truncate">{item.title}</span>
          {item.status && <StatusBadge status={item.status} />}
          <span className="sm:hidden text-xs text-foreground-tertiary">{item.actor}</span>
        </div>
        {item.detail && (
          <p className="text-xs text-foreground-tertiary mt-0.5 line-clamp-2 break-all">
            {item.detail}
          </p>
        )}
      </div>
    </li>
  );
}

export default function AdminActivityPage() {
  const [kind, setKind] = useState('all');
  const [older, setOlder] = useState<ActivityItem[]>([]);
  const [olderCursor, setOlderCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const url = `/api/admin/activity?limit=100${kind !== 'all' ? `&kind=${kind}` : ''}`;
  const feed = useAdminResource<ActivityFeed>(url, { refreshMs: 10_000 });

  const items = useMemo(() => {
    const seen = new Set<string>();
    const merged: ActivityItem[] = [];
    for (const item of [...(feed.data?.items ?? []), ...older]) {
      const key = `${item.kind}|${item.ref ?? item.at}|${item.at}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
    return merged;
  }, [feed.data, older]);

  const cursor = olderCursor ?? feed.data?.nextCursor ?? null;

  const loadMore = useCallback(async () => {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const page = await fetchEnvelope<ActivityFeed>(
        `/api/admin/activity?limit=100&before=${encodeURIComponent(cursor)}${kind !== 'all' ? `&kind=${kind}` : ''}`
      );
      setOlder((prev) => [...prev, ...page.items]);
      setOlderCursor(page.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, kind]);

  const changeKind = (id: string) => {
    setKind(id);
    setOlder([]);
    setOlderCursor(null);
  };

  const groups: Array<{ day: string; items: ActivityItem[] }> = [];
  for (const item of items) {
    const day = dayLabel(item.at);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(item);
    else groups.push({ day, items: [item] });
  }

  return (
    <DashboardLayout
      title="Live activity"
      subtitle="Executions, API calls, searches, jobs, health verdicts and sign-ups — newest first"
      showBackButton
    >
      <RefreshBar updatedAt={feed.updatedAt} refreshing={feed.refreshing} onRefresh={feed.refresh}>
        <Tabs size="sm" tabs={KINDS} activeTab={kind} onTabChange={changeKind} />
      </RefreshBar>
      <PageState loading={feed.loading} error={feed.error} onRetry={feed.refresh}>
        {groups.length === 0 ? (
          <p className="text-sm text-foreground-tertiary py-10 text-center">
            Quiet so far — nothing recorded for this filter.
          </p>
        ) : (
          groups.map((group) => (
            <section key={group.day} className="mb-6">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-foreground-tertiary mb-2">
                {group.day}
              </h2>
              <ul className="bg-surface border border-border rounded-xl overflow-hidden">
                {group.items.map((item) => (
                  <EventRow key={`${item.kind}|${item.ref ?? ''}|${item.at}`} item={item} />
                ))}
              </ul>
            </section>
          ))
        )}
        {cursor && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadMore()}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading…' : 'Load older'}
            </Button>
          </div>
        )}
      </PageState>
    </DashboardLayout>
  );
}
