/**
 * ActivityStream Component
 *
 * Ticker showing recent tool activity (invocations, publications, updates).
 * Presentational only: it renders exactly the `activities` it is given — no
 * synthetic/mock data. When there is nothing to show it renders an honest
 * empty state. Callers own fetching and (optionally) polling for fresh data.
 */

'use client';

import type { ReactElement } from 'react';
import type { ActivityItem, ActivityStreamProps } from './types';

function getActivityIcon(type: ActivityItem['type']): string {
  switch (type) {
    case 'invoked':
      return '▸';
    case 'published':
      return '+';
    case 'updated':
      return '↻';
    default:
      return '•';
  }
}

function getActivityColor(type: ActivityItem['type']): string {
  switch (type) {
    case 'invoked':
      return 'text-brutalist-accent';
    case 'published':
      return 'text-green-500';
    case 'updated':
      return 'text-yellow-500';
    default:
      return 'text-foreground-secondary';
  }
}

export function ActivityStream({
  activities = [],
  maxItems = 5,
  className = '',
}: ActivityStreamProps): ReactElement {
  const items = activities.slice(0, maxItems);

  return (
    <div
      className={`bg-surface border-2 border-foreground p-6 ${className}`}
      style={{ borderRadius: 0 }}
    >
      <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground-secondary mb-4">
        Recent Activity
      </h3>

      {items.length === 0 ? (
        <p className="font-mono text-sm text-foreground-tertiary">No recent activity yet.</p>
      ) : (
        <div className="space-y-2 font-mono text-sm">
          {items.map((activity, index) => (
            <div
              key={`${activity.tool}-${activity.time}-${index}`}
              className="flex items-center gap-3 animate-slide-down"
              style={{
                animationDuration: '300ms',
                animationFillMode: 'backwards',
              }}
            >
              <span className={`${getActivityColor(activity.type)} font-bold w-4`}>
                {getActivityIcon(activity.type)}
              </span>

              <span className="text-foreground flex-1">
                <span className="font-bold">{activity.tool}</span>
                <span className="text-foreground-secondary"> {activity.type}</span>
              </span>

              <span className="text-foreground-tertiary text-xs">{activity.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
