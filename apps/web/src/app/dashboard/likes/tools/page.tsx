'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { LikeButton } from '~/components/LikeButton';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';

interface LikedTool {
  id: string;
  likedAt: string;
  tool: {
    id: string;
    name: string;
    description: string;
    likeCount: number;
    package: {
      id: string;
      npmPackageName: string;
      category: string;
    };
  };
}

export default function LikedToolsPage(): React.ReactElement {
  const [tools, setTools] = useState<LikedTool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const fetchTools = useCallback(async (currentOffset: number) => {
    try {
      const response = await fetch(`/api/user/likes/tools?limit=${limit}&offset=${currentOffset}`);
      const data = await response.json();

      if (data.success) {
        if (currentOffset === 0) {
          setTools(data.data);
        } else {
          setTools((prev) => [...prev, ...data.data]);
        }
        setHasMore(data.pagination.hasMore);
      } else {
        setError(data.error?.message || 'Failed to fetch liked tools');
      }
    } catch (err) {
      console.error('Failed to fetch liked tools:', err);
      setError('Failed to fetch liked tools');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTools(0);
  }, [fetchTools]);

  const loadMore = () => {
    const newOffset = offset + limit;
    setOffset(newOffset);
    fetchTools(newOffset);
  };

  const handleUnlike = (toolId: string) => {
    setTools((prev) => prev.filter((t) => t.tool.id !== toolId));
  };

  if (error) {
    return (
      <DashboardLayout title="Liked Tools">
        <div className="text-center py-16">
          <Icon icon="alertCircle" size="lg" className="mx-auto text-error mb-4" />
          <h2 className="text-lg font-medium text-foreground mb-2">Error</h2>
          <p className="text-foreground-secondary mb-4">{error}</p>
          <Button onClick={() => fetchTools(0)}>Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Liked Tools"
      subtitle={!isLoading ? `${tools.length} tool${tools.length !== 1 ? 's' : ''}` : undefined}
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
      ) : tools.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Icon icon="heart" size="lg" className="text-primary" />
          </div>
          <h2 className="text-lg font-medium text-foreground mb-2">No liked tools yet</h2>
          <p className="text-foreground-secondary mb-4">
            Browse tools and click the heart icon to save your favorites
          </p>
          <Link href="/tool/tool-search">
            <Button>Browse Tools</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((item) => (
              <div
                key={item.id}
                className="bg-background border border-border rounded-lg p-4 hover:border-foreground/20 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <Link
                    href={`/tool/${item.tool.package.npmPackageName}/${item.tool.name}`}
                    className="font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {item.tool.name}
                  </Link>
                  <LikeButton
                    entityType="tool"
                    entityId={item.tool.id}
                    initialLiked={true}
                    initialCount={item.tool.likeCount}
                    size="sm"
                    onLikeChange={(liked) => {
                      if (!liked) handleUnlike(item.tool.id);
                    }}
                  />
                </div>
                <p className="text-sm text-foreground-secondary line-clamp-2 mb-3">
                  {item.tool.description}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" size="sm">
                    {item.tool.package.category}
                  </Badge>
                  <span className="text-xs text-foreground-tertiary">
                    {item.tool.package.npmPackageName}
                  </span>
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
