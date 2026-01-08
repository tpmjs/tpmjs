'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';
import { CloneButton } from '~/components/CloneButton';
import { LikeButton } from '~/components/LikeButton';

interface CollectionTool {
  id: string;
  toolId: string;
  position: number;
  note: string | null;
  tool: {
    id: string;
    name: string;
    description: string;
    likeCount: number;
    package: {
      npmPackageName: string;
      category: string;
    };
  };
}

interface PublicCollection {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  likeCount: number;
  toolCount: number;
  createdAt: string;
  createdBy: {
    id: string;
    username: string;
    name: string;
    image: string | null;
  };
  tools: CollectionTool[];
}

export default function PrettyCollectionDetailPage(): React.ReactElement {
  const params = useParams();
  const rawUsername = params.username as string;
  const username = rawUsername.startsWith('@') ? rawUsername.slice(1) : rawUsername;
  const slug = params.slug as string;

  const [collection, setCollection] = useState<PublicCollection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollection = useCallback(async () => {
    try {
      const response = await fetch(`/api/public/users/${username}/collections/${slug}`);
      if (response.status === 404) {
        setError('not_found');
        return;
      }
      const data = await response.json();

      if (data.success) {
        setCollection(data.data);
      } else {
        setError(data.error?.message || 'Failed to load collection');
      }
    } catch {
      setError('Failed to load collection');
    } finally {
      setIsLoading(false);
    }
  }, [username, slug]);

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

  if (error === 'not_found') {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Icon icon="loader" className="w-8 h-8 animate-spin text-foreground-secondary" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        ) : collection ? (
          <div className="space-y-8">
            {/* Collection Header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{collection.name}</h1>
                {collection.description && (
                  <p className="text-foreground-secondary mt-2">{collection.description}</p>
                )}
                <Link
                  href={`/${username}`}
                  className="text-sm text-foreground-tertiary hover:text-foreground-secondary mt-2 inline-flex items-center gap-1"
                >
                  by @{collection.createdBy.username}
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <LikeButton
                  entityType="collection"
                  entityId={collection.id}
                  initialCount={collection.likeCount}
                />
                <CloneButton
                  type="collection"
                  sourceId={collection.id}
                  sourceName={collection.name}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-foreground-secondary">
              <span className="flex items-center gap-1">
                <Icon icon="puzzle" className="w-4 h-4" />
                {collection.toolCount} tools
              </span>
              <span className="flex items-center gap-1">
                <Icon icon="heart" className="w-4 h-4" />
                {collection.likeCount} likes
              </span>
            </div>

            {/* Tools */}
            {collection.tools.length > 0 ? (
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Tools in Collection</h2>
                <div className="grid gap-3">
                  {collection.tools.map((ct) => (
                    <Link
                      key={ct.id}
                      href={`/tool/${ct.tool.package.npmPackageName}/${ct.tool.name}`}
                      className="block p-4 bg-surface border border-border rounded-lg hover:border-foreground-secondary transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-foreground">{ct.tool.name}</h3>
                          <p className="text-sm text-foreground-secondary mt-1 line-clamp-2">
                            {ct.tool.description}
                          </p>
                          {ct.note && (
                            <p className="text-xs text-foreground-tertiary italic mt-2">
                              Note: {ct.note}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {ct.tool.package.category}
                            </Badge>
                            <span className="text-xs text-foreground-tertiary">
                              {ct.tool.package.npmPackageName}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-foreground-tertiary">
                          <Icon icon="heart" className="w-3.5 h-3.5" />
                          {ct.tool.likeCount}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : (
              <div className="text-center py-12">
                <Icon icon="box" className="w-12 h-12 mx-auto text-foreground-secondary mb-4" />
                <p className="text-foreground-secondary">This collection is empty.</p>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
