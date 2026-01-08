'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { LikeButton } from '~/components/LikeButton';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';

interface LikedCollection {
  id: string;
  likedAt: string;
  collection: {
    id: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    likeCount: number;
    toolCount: number;
    createdBy: {
      id: string;
      name: string;
    };
  };
}

export default function LikedCollectionsPage(): React.ReactElement {
  const [collections, setCollections] = useState<LikedCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const fetchCollections = useCallback(async (currentOffset: number) => {
    try {
      const response = await fetch(
        `/api/user/likes/collections?limit=${limit}&offset=${currentOffset}`
      );
      const data = await response.json();

      if (data.success) {
        if (currentOffset === 0) {
          setCollections(data.data);
        } else {
          setCollections((prev) => [...prev, ...data.data]);
        }
        setHasMore(data.pagination.hasMore);
      } else {
        setError(data.error?.message || 'Failed to fetch liked collections');
      }
    } catch (err) {
      console.error('Failed to fetch liked collections:', err);
      setError('Failed to fetch liked collections');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections(0);
  }, [fetchCollections]);

  const loadMore = () => {
    const newOffset = offset + limit;
    setOffset(newOffset);
    fetchCollections(newOffset);
  };

  const handleUnlike = (collectionId: string) => {
    setCollections((prev) => prev.filter((c) => c.collection.id !== collectionId));
  };

  if (error) {
    return (
      <DashboardLayout title="Liked Collections">
        <div className="text-center py-16">
          <Icon icon="alertCircle" size="lg" className="mx-auto text-error mb-4" />
          <h2 className="text-lg font-medium text-foreground mb-2">Error</h2>
          <p className="text-foreground-secondary mb-4">{error}</p>
          <Button onClick={() => fetchCollections(0)}>Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Liked Collections"
      subtitle={
        !isLoading
          ? `${collections.length} collection${collections.length !== 1 ? 's' : ''}`
          : undefined
      }
    >
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white border border-border rounded-lg p-4 animate-pulse">
              <div className="h-5 bg-surface-secondary rounded w-3/4 mb-2" />
              <div className="h-4 bg-surface-secondary rounded w-full mb-1" />
              <div className="h-4 bg-surface-secondary rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : collections.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Icon icon="heart" size="lg" className="text-primary" />
          </div>
          <h2 className="text-lg font-medium text-foreground mb-2">No liked collections yet</h2>
          <p className="text-foreground-secondary mb-4">
            Browse public collections and click the heart icon to save your favorites
          </p>
          <Link href="/collections">
            <Button>Browse Collections</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-border rounded-lg p-4 hover:border-foreground/20 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <Link
                    href={`/collections/${item.collection.id}`}
                    className="font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {item.collection.name}
                  </Link>
                  <LikeButton
                    entityType="collection"
                    entityId={item.collection.id}
                    initialLiked={true}
                    initialCount={item.collection.likeCount}
                    size="sm"
                    onLikeChange={(liked) => {
                      if (!liked) handleUnlike(item.collection.id);
                    }}
                  />
                </div>
                {item.collection.description && (
                  <p className="text-sm text-foreground-secondary line-clamp-2 mb-3">
                    {item.collection.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-foreground-tertiary">
                  <span>
                    {item.collection.toolCount} tool{item.collection.toolCount !== 1 ? 's' : ''}
                  </span>
                  <span>•</span>
                  <span>by {item.collection.createdBy.name}</span>
                  {item.collection.isPublic && (
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
