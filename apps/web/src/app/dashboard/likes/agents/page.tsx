'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { LikeButton } from '~/components/LikeButton';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';

interface LikedAgent {
  id: string;
  likedAt: string;
  agent: {
    id: string;
    uid: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    likeCount: number;
    provider: string;
    modelId: string;
    toolCount: number;
    collectionCount: number;
    createdBy: {
      id: string;
      name: string;
    };
  };
}

export default function LikedAgentsPage(): React.ReactElement {
  const [agents, setAgents] = useState<LikedAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const fetchAgents = useCallback(async (currentOffset: number) => {
    try {
      const response = await fetch(`/api/user/likes/agents?limit=${limit}&offset=${currentOffset}`);
      const data = await response.json();

      if (data.success) {
        if (currentOffset === 0) {
          setAgents(data.data);
        } else {
          setAgents((prev) => [...prev, ...data.data]);
        }
        setHasMore(data.pagination.hasMore);
      } else {
        setError(data.error?.message || 'Failed to fetch liked agents');
      }
    } catch (err) {
      console.error('Failed to fetch liked agents:', err);
      setError('Failed to fetch liked agents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents(0);
  }, [fetchAgents]);

  const loadMore = () => {
    const newOffset = offset + limit;
    setOffset(newOffset);
    fetchAgents(newOffset);
  };

  const handleUnlike = (agentId: string) => {
    setAgents((prev) => prev.filter((a) => a.agent.id !== agentId));
  };

  if (error) {
    return (
      <DashboardLayout title="Liked Agents">
        <div className="text-center py-16">
          <Icon icon="alertCircle" size="lg" className="mx-auto text-error mb-4" />
          <h2 className="text-lg font-medium text-foreground mb-2">Error</h2>
          <p className="text-foreground-secondary mb-4">{error}</p>
          <Button onClick={() => fetchAgents(0)}>Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Liked Agents"
      subtitle={!isLoading ? `${agents.length} agent${agents.length !== 1 ? 's' : ''}` : undefined}
    >
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-background border border-border rounded-lg p-4 animate-pulse"
            >
              <div className="h-5 bg-surface-secondary rounded w-3/4 mb-2" />
              <div className="h-4 bg-surface-secondary rounded w-full mb-1" />
              <div className="h-4 bg-surface-secondary rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Icon icon="heart" size="lg" className="text-primary" />
          </div>
          <h2 className="text-lg font-medium text-foreground mb-2">No liked agents yet</h2>
          <p className="text-foreground-secondary mb-4">
            Browse public agents and click the heart icon to save your favorites
          </p>
          <Link href="/agents">
            <Button>Browse Agents</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((item) => (
              <div
                key={item.id}
                className="bg-background border border-border rounded-lg p-4 hover:border-foreground/20 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <Link
                    href={`/agents/${item.agent.id}`}
                    className="font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {item.agent.name}
                  </Link>
                  <LikeButton
                    entityType="agent"
                    entityId={item.agent.id}
                    initialLiked={true}
                    initialCount={item.agent.likeCount}
                    size="sm"
                    onLikeChange={(liked) => {
                      if (!liked) handleUnlike(item.agent.id);
                    }}
                  />
                </div>
                {item.agent.description && (
                  <p className="text-sm text-foreground-secondary line-clamp-2 mb-3">
                    {item.agent.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" size="sm">
                    {item.agent.provider}
                  </Badge>
                  <span className="text-xs text-foreground-tertiary">{item.agent.modelId}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground-tertiary">
                  <span>
                    {item.agent.toolCount} tool{item.agent.toolCount !== 1 ? 's' : ''}
                  </span>
                  <span>•</span>
                  <span>by {item.agent.createdBy.name}</span>
                  {item.agent.isPublic && (
                    <>
                      <span>•</span>
                      <Badge variant="secondary" size="sm">
                        Public
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 text-center">
              <Button variant="outline" onClick={loadMore}>
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
