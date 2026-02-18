'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Select } from '@tpmjs/ui/Select/Select';
import { Spinner } from '@tpmjs/ui/Spinner/Spinner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';
import { ACTIVITY_ICONS, ACTIVITY_MESSAGES } from '~/lib/activity';

interface DashboardData {
  summary: {
    totalToolExecutions: number;
    totalAgentConversations: number;
    totalApiRequests: number;
    successRate: number;
    totalTokensUsed: number;
  };
  executionTimeline: Array<{
    date: string;
    toolCalls: number;
    agentRuns: number;
    successes: number;
    errors: number;
  }>;
  topTools: Array<{
    toolName: string;
    packageName: string;
    count: number;
    lastUsed: string;
  }>;
  topAgents: Array<{
    agentName: string;
    agentUid: string;
    agentId: string;
    conversationCount: number;
    totalConversations: number;
    messageCount: number;
  }>;
  recentErrors: Array<{
    toolName: string;
    errorMessage: string;
    errorCategory: string | null;
    count: number;
    lastOccurred: string;
  }>;
  errorCategories: Array<{
    category: string;
    count: number;
  }>;
  conversationStatuses: Array<{
    status: string;
    count: number;
  }>;
  contextMetrics: {
    avgMessagesInContext: number | null;
    avgTokensInContext: number | null;
    avgAvailableTools: number | null;
  };
}

interface ActivityItem {
  id: string;
  type: string;
  targetName: string;
  targetType: string;
  agentId: string | null;
  collectionId: string | null;
  toolId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

type Period = '7d' | '30d' | '90d';
type ActivityFilter = 'all' | 'tool' | 'agent' | 'collection' | 'api_key' | 'bridge';

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex dashboard UI with many sections
export default function ActivityPage(): React.ReactElement {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('30d');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  const [activityCursor, setActivityCursor] = useState<string | null>(null);
  const [hasMoreActivities, setHasMoreActivities] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/activity-dashboard?period=${period}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        if (response.status === 401) {
          router.push('/sign-in');
          return;
        }
        setError(result.error || 'Failed to fetch dashboard');
      }
    } catch {
      setError('Failed to fetch dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [period, router]);

  const fetchActivities = useCallback(
    async (cursor?: string | null) => {
      setIsLoadingActivities(true);
      try {
        const params = new URLSearchParams({ limit: '20' });
        if (activityFilter !== 'all') params.set('targetType', activityFilter);
        if (cursor) params.set('cursor', cursor);

        const response = await fetch(`/api/user/activity?${params}`);
        const result = await response.json();
        if (result.success) {
          if (cursor) {
            setActivities((prev) => [...prev, ...result.data]);
          } else {
            setActivities(result.data);
          }
          setHasMoreActivities(result.pagination.hasMore);
          setActivityCursor(result.pagination.nextCursor ?? null);
        }
      } catch {
        // Silent fail for activity feed
      } finally {
        setIsLoadingActivities(false);
      }
    },
    [activityFilter]
  );

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    setActivityCursor(null);
    fetchActivities();
  }, [fetchActivities]);

  if (error) {
    return (
      <DashboardLayout title="Activity">
        <div className="text-center py-16">
          <Icon icon="alertCircle" size="lg" className="mx-auto text-error mb-4" />
          <h2 className="text-lg font-medium text-foreground mb-2">Error</h2>
          <p className="text-foreground-secondary mb-4">{error}</p>
          <Button onClick={fetchDashboard}>Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Activity"
      subtitle="Track your activity across TPMJS"
      actions={
        <Select
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
          size="sm"
          options={[
            { value: '7d', label: 'Last 7 days' },
            { value: '30d', label: 'Last 30 days' },
            { value: '90d', label: 'Last 90 days' },
          ]}
        />
      }
    >
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((n) => (
              <div key={n} className="bg-surface border border-border rounded-lg p-4">
                <div className="h-4 w-24 bg-surface-secondary rounded animate-pulse mb-2" />
                <div className="h-8 w-20 bg-surface-secondary rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div className="bg-surface border border-border rounded-lg p-6">
            <div className="h-4 w-32 bg-surface-secondary rounded animate-pulse mb-4" />
            <div className="h-48 bg-surface-secondary rounded animate-pulse" />
          </div>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-foreground-secondary text-sm mb-1">
                <Icon icon="terminal" size="xs" />
                Total Executions
              </div>
              <div className="text-2xl font-semibold text-foreground">
                {formatNumber(data.summary.totalToolExecutions)}
              </div>
              <div className="mt-1">
                <Badge
                  variant={data.summary.successRate >= 90 ? 'success' : 'warning'}
                  className="text-xs"
                >
                  {data.summary.successRate}% success
                </Badge>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-foreground-secondary text-sm mb-1">
                <Icon icon="message" size="xs" />
                Conversations
              </div>
              <div className="text-2xl font-semibold text-foreground">
                {formatNumber(data.summary.totalAgentConversations)}
              </div>
              {data.conversationStatuses.length > 0 && (
                <div className="mt-1 flex gap-1 flex-wrap">
                  {data.conversationStatuses.map((cs) => (
                    <Badge
                      key={cs.status}
                      variant={
                        cs.status === 'completed'
                          ? 'success'
                          : cs.status === 'error'
                            ? 'error'
                            : 'secondary'
                      }
                      className="text-xs"
                    >
                      {cs.count} {cs.status}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-foreground-secondary text-sm mb-1">
                <Icon icon="globe" size="xs" />
                API Requests
              </div>
              <div className="text-2xl font-semibold text-foreground">
                {formatNumber(data.summary.totalApiRequests)}
              </div>
            </div>

            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-foreground-secondary text-sm mb-1">
                <Icon icon="barChart" size="xs" />
                Tokens Used
              </div>
              <div className="text-2xl font-semibold text-foreground">
                {formatNumber(data.summary.totalTokensUsed)}
              </div>
            </div>

            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-foreground-secondary text-sm mb-1">
                <Icon icon="puzzle" size="xs" />
                Avg Tools Available
              </div>
              <div className="text-2xl font-semibold text-foreground">
                {data.contextMetrics.avgAvailableTools ?? '—'}
              </div>
              {data.contextMetrics.avgMessagesInContext != null && (
                <div className="mt-1 text-xs text-foreground-tertiary">
                  ~{data.contextMetrics.avgMessagesInContext} msgs / ~
                  {formatNumber(data.contextMetrics.avgTokensInContext ?? 0)} tokens per turn
                </div>
              )}
            </div>
          </div>

          {/* Execution Timeline */}
          {data.executionTimeline.length > 0 && (
            <div className="bg-surface border border-border rounded-lg p-6">
              <h3 className="text-sm font-medium text-foreground mb-4">Execution Timeline</h3>
              <div className="h-48 flex items-end gap-1">
                {data.executionTimeline.map((point) => {
                  const maxTotal = Math.max(
                    ...data.executionTimeline.map((p) => p.successes + p.errors)
                  );
                  const total = point.successes + point.errors;
                  const height = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
                  const successHeight = total > 0 ? (point.successes / total) * height : 0;
                  const errorHeight = height - successHeight;

                  return (
                    <div
                      key={point.date}
                      className="flex-1 flex flex-col justify-end"
                      title={`${new Date(point.date).toLocaleDateString()}: ${point.toolCalls} tool calls, ${point.agentRuns} agent runs`}
                    >
                      {errorHeight > 0 && (
                        <div
                          className="bg-error/30 rounded-t"
                          style={{ height: `${errorHeight}%` }}
                        />
                      )}
                      {successHeight > 0 && (
                        <div
                          className={`bg-success ${errorHeight > 0 ? '' : 'rounded-t'} rounded-b`}
                          style={{ height: `${successHeight}%` }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-foreground-tertiary">
                <span>
                  {data.executionTimeline[0]?.date &&
                    new Date(data.executionTimeline[0].date).toLocaleDateString()}
                </span>
                <span>
                  {(() => {
                    const last = data.executionTimeline.at(-1)?.date;
                    return last ? new Date(last).toLocaleDateString() : null;
                  })()}
                </span>
              </div>
            </div>
          )}

          {/* Two-column grid: Top Tools + Top Agents */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Tools */}
            <div className="bg-surface border border-border rounded-lg p-6">
              <h3 className="text-sm font-medium text-foreground mb-4">Top Tools</h3>
              {data.topTools.length === 0 ? (
                <p className="text-foreground-tertiary text-sm">No tool executions yet</p>
              ) : (
                <div className="space-y-3">
                  {data.topTools.map((tool) => {
                    const maxCount = data.topTools[0]?.count || 1;
                    const percentage = (tool.count / maxCount) * 100;

                    return (
                      <div key={tool.toolName}>
                        <div className="flex justify-between items-center text-sm mb-1">
                          <span className="text-foreground truncate max-w-[70%]">
                            {tool.toolName}
                          </span>
                          <span className="text-foreground font-medium">
                            {formatNumber(tool.count)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top Agents */}
            <div className="bg-surface border border-border rounded-lg p-6">
              <h3 className="text-sm font-medium text-foreground mb-4">Top Agents</h3>
              {data.topAgents.length === 0 ? (
                <p className="text-foreground-tertiary text-sm">No agent conversations yet</p>
              ) : (
                <div className="space-y-3">
                  {data.topAgents
                    .filter((a) => a.conversationCount > 0)
                    .map((agent) => (
                      <Link
                        key={agent.agentId}
                        href={`/dashboard/agents/${agent.agentId}`}
                        className="flex justify-between items-center p-2 rounded hover:bg-surface-secondary transition-colors"
                      >
                        <div>
                          <span className="text-foreground text-sm font-medium">
                            {agent.agentName}
                          </span>
                          <p className="text-xs text-foreground-tertiary">
                            {agent.conversationCount} conversations ·{' '}
                            {formatNumber(agent.messageCount)} messages
                          </p>
                        </div>
                        <Icon icon="chevronRight" size="xs" className="text-foreground-tertiary" />
                      </Link>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Error Categories + Recent Errors */}
          {(data.errorCategories.length > 0 || data.recentErrors.length > 0) && (
            <div className="space-y-6">
              {/* Error Category Breakdown */}
              {data.errorCategories.length > 0 && (
                <div className="bg-surface border border-border rounded-lg p-6">
                  <h3 className="text-sm font-medium text-foreground mb-4">Error Categories</h3>
                  <div className="flex flex-wrap gap-3">
                    {data.errorCategories.map((ec) => (
                      <div
                        key={ec.category}
                        className="flex items-center gap-2 bg-surface-secondary rounded-lg px-3 py-2"
                      >
                        <Badge variant="error" className="text-xs">
                          {ec.count}
                        </Badge>
                        <span className="text-sm text-foreground">
                          {ec.category.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Errors */}
              {data.recentErrors.length > 0 && (
                <div className="bg-surface border border-border rounded-lg p-6">
                  <h3 className="text-sm font-medium text-foreground mb-4">Recent Errors</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-foreground-tertiary border-b border-border">
                          <th className="pb-2 font-medium">Tool</th>
                          <th className="pb-2 font-medium">Category</th>
                          <th className="pb-2 font-medium">Error</th>
                          <th className="pb-2 font-medium text-right">Count</th>
                          <th className="pb-2 font-medium text-right">Last Occurred</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentErrors.map((err) => (
                          <tr
                            key={`${err.toolName}-${err.errorMessage}`}
                            className="border-b border-border/50"
                          >
                            <td className="py-2 text-foreground">{err.toolName}</td>
                            <td className="py-2">
                              {err.errorCategory && (
                                <Badge variant="secondary" className="text-xs">
                                  {err.errorCategory.replace(/_/g, ' ')}
                                </Badge>
                              )}
                            </td>
                            <td className="py-2 text-foreground-secondary truncate max-w-[250px]">
                              {err.errorMessage}
                            </td>
                            <td className="py-2 text-right">
                              <Badge variant="error" className="text-xs">
                                {err.count}
                              </Badge>
                            </td>
                            <td className="py-2 text-right text-foreground-tertiary">
                              {new Date(err.lastOccurred).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Activity Feed */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <h3 className="text-sm font-medium text-foreground mb-4">Activity Feed</h3>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {(
                [
                  ['all', 'All'],
                  ['tool', 'Tools'],
                  ['agent', 'Agents'],
                  ['collection', 'Collections'],
                  ['api_key', 'API Keys'],
                  ['bridge', 'Bridge'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActivityFilter(value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    activityFilter === value
                      ? 'bg-primary text-white'
                      : 'bg-surface-secondary text-foreground-secondary hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Activity list */}
            {isLoadingActivities && activities.length === 0 ? (
              <div className="flex justify-center py-8">
                <Spinner size="md" />
              </div>
            ) : activities.length === 0 ? (
              <p className="text-foreground-tertiary text-sm text-center py-8">No activity yet</p>
            ) : (
              <div className="space-y-2">
                {activities.map((activity) => {
                  const iconName =
                    ACTIVITY_ICONS[activity.type as keyof typeof ACTIVITY_ICONS] || 'circle';
                  const messageFn =
                    ACTIVITY_MESSAGES[activity.type as keyof typeof ACTIVITY_MESSAGES];
                  const message = messageFn
                    ? messageFn(
                        activity.targetName,
                        activity.metadata as Record<string, unknown> | undefined
                      )
                    : `${activity.type}: ${activity.targetName}`;

                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0"
                    >
                      <div className="mt-0.5 w-7 h-7 rounded-full bg-surface-secondary flex items-center justify-center shrink-0">
                        <Icon
                          icon={iconName as 'circle'}
                          size="xs"
                          className="text-foreground-secondary"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{message}</p>
                        <p className="text-xs text-foreground-tertiary">
                          {new Date(activity.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {hasMoreActivities && (
                  <div className="text-center pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchActivities(activityCursor)}
                      disabled={isLoadingActivities}
                    >
                      {isLoadingActivities ? <Spinner size="sm" /> : 'Load More'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Empty state */}
          {data.summary.totalToolExecutions === 0 && data.summary.totalAgentConversations === 0 && (
            <div className="bg-surface border border-border rounded-lg p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Icon icon="barChart" size="lg" className="text-primary" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No activity data yet</h3>
              <p className="text-foreground-secondary mb-4">
                Start using tools and agents to see your activity here.
              </p>
              <Button onClick={() => router.push('/dashboard/collections')}>
                <Icon icon="folder" size="sm" className="mr-2" />
                Browse Collections
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </DashboardLayout>
  );
}
