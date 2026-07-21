'use client';

import { ActivityStream } from '@tpmjs/ui/ActivityStream/ActivityStream';
import { useEffect, useRef, useState } from 'react';

interface ActivityItem {
  type: 'invoked' | 'published' | 'updated';
  tool: string;
  time: string;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface PublicActivity {
  id: string;
  type: 'invoked' | 'published' | 'updated';
  username: string;
  targetName: string;
  targetType: string;
  createdAt: string;
}

export function PublicActivityStream(): React.ReactElement {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    async function fetchActivities() {
      try {
        const res = await fetch('/api/activity/public');
        const json = await res.json();

        if (isMounted.current && json.success && json.data.length > 0) {
          setActivities(
            json.data.map((a: PublicActivity) => ({
              type: a.type,
              tool: `${a.username} → ${a.targetName}`,
              time: formatRelativeTime(a.createdAt),
            }))
          );
        }
      } catch {
        // Silent fail — activity stream is non-critical
      }
    }

    // Initial fetch via interval (fires immediately on mount delay, then every 30s)
    const timeoutId = setTimeout(fetchActivities, 0);
    const intervalId = setInterval(fetchActivities, 30_000);

    return () => {
      isMounted.current = false;
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);

  // Render only real activity (fetched above, refreshed every 30s). When there's
  // none yet, ActivityStream shows an honest empty state — never synthetic data.
  return <ActivityStream activities={activities} maxItems={5} />;
}
