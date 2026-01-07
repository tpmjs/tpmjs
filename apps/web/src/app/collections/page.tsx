'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';
import { LikeButton } from '~/components/LikeButton';

interface PublicCollection {
  id: string;
  name: string;
  description: string | null;
  likeCount: number;
  toolCount: number;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    image: string | null;
  };
}

type SortOption = 'likes' | 'recent' | 'tools';

export default function PublicCollectionsPage(): React.ReactElement {
  const [collections, setCollections] = useState<PublicCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('likes');
  const limit = 20;

  const fetchCollections = useCallback(
    async (currentOffset: number, resetList = false) => {
      try {
        const params = new URLSearchParams({
          limit: String(limit),
          offset: String(currentOffset),
          sort,
          ...(search && { search }),
        });

        const response = await fetch(`/api/public/collections?${params}`);
        const data = await response.json();

        if (data.success) {
          if (resetList || currentOffset === 0) {
            setCollections(data.data);
          } else {
            setCollections((prev) => [...prev, ...data.data]);
          }
          setHasMore(data.pagination.hasMore);
        } else {
          setError(data.error?.message || 'Failed to fetch collections');
        }
      } catch (err) {
        console.error('Failed to fetch collections:', err);
        setError('Failed to fetch collections');
      } finally {
        setIsLoading(false);
      }
    },
    [sort, search]
  );

  useEffect(() => {
    setOffset(0);
    setIsLoading(true);
    fetchCollections(0, true);
  }, [fetchCollections]);

  const loadMore = () => {
    const newOffset = offset + limit;
    setOffset(newOffset);
    fetchCollections(newOffset);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    setIsLoading(true);
    fetchCollections(0, true);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Public Collections</h1>
          <p className="text-foreground-secondary">
            Discover curated tool collections shared by the community
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Icon
                icon="search"
                size="sm"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search collections..."
                className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </form>

          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground-secondary">Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="px-3 py-2 bg-surface border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="likes">Most Liked</option>
              <option value="recent">Most Recent</option>
              <option value="tools">Most Tools</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {error ? (
          <div className="text-center py-16">
            <Icon icon="alertCircle" size="lg" className="mx-auto text-error mb-4" />
            <h2 className="text-lg font-medium text-foreground mb-2">Error</h2>
            <p className="text-foreground-secondary mb-4">{error}</p>
            <Button onClick={() => fetchCollections(0, true)}>Try Again</Button>
          </div>
        ) : isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-background border border-border rounded-lg p-6 animate-pulse"
              >
                <div className="h-6 bg-surface-secondary rounded w-3/4 mb-3" />
                <div className="h-4 bg-surface-secondary rounded w-full mb-2" />
                <div className="h-4 bg-surface-secondary rounded w-2/3 mb-4" />
                <div className="h-4 bg-surface-secondary rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Icon icon="folder" size="lg" className="text-primary" />
            </div>
            <h2 className="text-lg font-medium text-foreground mb-2">No collections found</h2>
            <p className="text-foreground-secondary">
              {search
                ? 'Try adjusting your search terms'
                : 'Be the first to share a public collection!'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className="bg-background border border-border rounded-lg p-6 hover:border-foreground/20 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <Link
                      href={`/collections/${collection.id}`}
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {collection.name}
                    </Link>
                    <LikeButton
                      entityType="collection"
                      entityId={collection.id}
                      initialCount={collection.likeCount}
                      size="sm"
                    />
                  </div>

                  {collection.description && (
                    <p className="text-sm text-foreground-secondary line-clamp-2 mb-4">
                      {collection.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3 text-foreground-tertiary">
                      <span className="flex items-center gap-1">
                        <Icon icon="puzzle" size="xs" />
                        {collection.toolCount} tool{collection.toolCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {collection.createdBy.image ? (
                        <img
                          src={collection.createdBy.image}
                          alt={collection.createdBy.name}
                          className="w-5 h-5 rounded-full"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon icon="user" size="xs" className="text-primary" />
                        </div>
                      )}
                      <span className="text-xs text-foreground-tertiary">
                        {collection.createdBy.name}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 text-center">
                <Button variant="outline" onClick={loadMore}>
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
