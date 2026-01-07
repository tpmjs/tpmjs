'use client';

import type { ActivityType } from '@prisma/client';
import { Icon, type IconName } from '@tpmjs/ui/Icon/Icon';
import { Spinner } from '@tpmjs/ui/Spinner/Spinner';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { ACTIVITY_ICONS, ACTIVITY_MESSAGES } from '~/lib/activity';

interface Activity {
  id: string;
  type: ActivityType;
  targetName: string;
  targetType: string;
  agentId: string | null;
  collectionId: string | null;
  toolId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface ActivityResponse {
  success: boolean;
  data: Activity[];
  pagination: {
    limit: number;
    hasMore: boolean;
    nextCursor: string | null;
  };
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Map activity icons to available IconName values
const iconMapping: Record<string, IconName> = {
  plus: 'plus',
  pencil: 'edit',
  trash: 'trash',
  link: 'link',
  unlink: 'x',
  folderPlus: 'folder',
  folderMinus: 'folder',
  heart: 'heart',
  heartOff: 'heart',
};

function getActivityIcon(type: ActivityType): IconName {
  const iconKey = ACTIVITY_ICONS[type];
  return iconMapping[iconKey] || 'info';
}

function getActivityMessage(activity: Activity): string {
  const messageGetter = ACTIVITY_MESSAGES[activity.type];
  if (!messageGetter) return `Unknown activity: ${activity.type}`;
  return messageGetter(activity.targetName, activity.metadata ?? undefined);
}

interface DashboardActivityStreamProps {
  className?: string;
  autoRefreshInterval?: number; // milliseconds, 0 to disable
}

export function DashboardActivityStream({
  className = '',
  autoRefreshInterval = 30000,
}: DashboardActivityStreamProps): React.ReactElement {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextCursorRef = useRef<string | null>(null);

  const fetchActivities = useCallback(async (cursor?: string | null) => {
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (cursor) params.set('cursor', cursor);

      const response = await fetch(`/api/user/activity?${params.toString()}`);
      const data: ActivityResponse = await response.json();

      if (!data.success) {
        throw new Error('Failed to fetch activities');
      }

      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Unknown error');
    }
  }, []);

  // Initial load
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchActivities();
        if (!cancelled) {
          setActivities(data.data);
          setHasMore(data.pagination.hasMore);
          nextCursorRef.current = data.pagination.nextCursor;
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load activities');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [fetchActivities]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;

    const interval = setInterval(async () => {
      try {
        const data = await fetchActivities();
        setActivities(data.data);
        setHasMore(data.pagination.hasMore);
        nextCursorRef.current = data.pagination.nextCursor;
      } catch {
        // Silent fail on auto-refresh
      }
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, fetchActivities]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !nextCursorRef.current) return;

    try {
      setLoadingMore(true);
      const data = await fetchActivities(nextCursorRef.current);
      setActivities((prev) => [...prev, ...data.data]);
      setHasMore(data.pagination.hasMore);
      nextCursorRef.current = data.pagination.nextCursor;
    } catch {
      // Silent fail on load more
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, fetchActivities]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <Spinner size="md" />
        <span className="ml-2 text-foreground-secondary text-sm">Loading activity...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Icon icon="alertCircle" size="lg" className="text-foreground-tertiary mx-auto mb-2" />
        <p className="text-foreground-secondary text-sm">{error}</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Icon icon="clock" size="lg" className="text-foreground-tertiary mx-auto mb-2" />
        <p className="text-foreground-secondary text-sm">No activity yet</p>
        <p className="text-foreground-tertiary text-xs mt-1">
          Your activity will appear here when you create or modify agents, collections, or tools.
        </p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <Virtuoso
        style={{ height: '400px' }}
        data={activities}
        endReached={loadMore}
        overscan={10}
        itemContent={(_, activity) => (
          <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface flex items-center justify-center">
              <Icon
                icon={getActivityIcon(activity.type)}
                size="sm"
                className="text-foreground-secondary"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">{getActivityMessage(activity)}</p>
              <p className="text-xs text-foreground-tertiary mt-0.5">
                {formatRelativeTime(activity.createdAt)}
              </p>
            </div>
          </div>
        )}
        components={{
          Footer: () =>
            loadingMore ? (
              <div className="flex items-center justify-center py-4">
                <Spinner size="sm" />
              </div>
            ) : null,
        }}
      />
    </div>
  );
}
