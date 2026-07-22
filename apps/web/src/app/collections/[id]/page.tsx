'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';
import { CollectionActivationPanel } from '~/components/collections/CollectionActivationPanel';
import { LikeButton } from '~/components/LikeButton';

interface CollectionTool {
  id: string;
  toolId: string;
  position: number;
  note: string | null;
  addedAt: string;
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

interface PublicCollection {
  id: string;
  slug: string | null;
  name: string;
  description: string | null;
  likeCount: number;
  toolCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    username: string | null;
    name: string;
    image: string | null;
  };
  tools: CollectionTool[];
}

export default function PublicCollectionDetailPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.id as string;

  const [collection, setCollection] = useState<PublicCollection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollection = useCallback(async () => {
    try {
      const response = await fetch(`/api/public/collections/${collectionId}`);
      const data = await response.json();

      if (data.success) {
        // Redirect to pretty URL if username and slug are available
        if (data.data.createdBy?.username && data.data.slug) {
          router.replace(`/${data.data.createdBy.username}/collections/${data.data.slug}`);
          return;
        }
        setCollection(data.data);
      } else {
        if (data.error?.code === 'NOT_FOUND' || data.error?.code === 'FORBIDDEN') {
          setError('This collection is not available or is private');
        } else {
          setError(data.error?.message || 'Failed to fetch collection');
        }
      }
    } catch (err) {
      console.error('Failed to fetch collection:', err);
      setError('Failed to fetch collection');
    } finally {
      setIsLoading(false);
    }
  }, [collectionId, router]);

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-surface-secondary rounded w-1/2 mb-4" />
            <div className="h-4 bg-surface-secondary rounded w-full mb-8" />
            <div className="h-32 bg-surface-secondary rounded mb-8" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-surface-secondary rounded" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Icon icon="alertCircle" size="lg" className="mx-auto text-error mb-4" />
            <h2 className="text-lg font-medium text-foreground mb-2">
              {error || 'Collection not found'}
            </h2>
            <p className="text-foreground-secondary mb-4">
              This collection may be private or no longer available.
            </p>
            <Link href="/collections">
              <Button>Browse Collections</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/collections"
          className="inline-flex items-center gap-1 text-sm text-foreground-secondary hover:text-foreground mb-6"
        >
          <Icon icon="arrowLeft" size="xs" />
          Back to Collections
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{collection.name}</h1>
            {collection.description && (
              <p className="text-foreground-secondary">{collection.description}</p>
            )}
          </div>
          <LikeButton
            entityType="collection"
            entityId={collection.id}
            initialCount={collection.likeCount}
            showCount={true}
            variant="outline"
          />
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-4 mb-8 text-sm text-foreground-tertiary">
          <div className="flex items-center gap-2">
            {collection.createdBy.image ? (
              <img
                src={collection.createdBy.image}
                alt={collection.createdBy.name}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon icon="user" size="xs" className="text-primary" />
              </div>
            )}
            <span>Created by {collection.createdBy.name}</span>
          </div>
          <span>•</span>
          <span>
            {collection.toolCount} tool{collection.toolCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Legacy ID URLs redirect here when a stable public identity is available. */}
        {collection.createdBy?.username && collection.slug && (
          <CollectionActivationPanel
            collectionId={collection.id}
            name={collection.name}
            username={collection.createdBy.username}
            slug={collection.slug}
            toolCount={collection.toolCount}
          />
        )}

        {/* Tools */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Tools in this Collection</h2>

          {collection.tools.length === 0 ? (
            <div className="text-center py-12 bg-surface border border-border rounded-lg">
              <Icon icon="puzzle" size="lg" className="mx-auto text-foreground-tertiary mb-2" />
              <p className="text-foreground-secondary">No tools in this collection yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {collection.tools.map((ct) => (
                <div
                  key={ct.id}
                  className="bg-surface border border-border rounded-lg p-4 hover:border-foreground/20 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Link
                        href={`/tool/${ct.tool.package.npmPackageName}/${ct.tool.name}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {ct.tool.name}
                      </Link>
                      <span className="text-sm text-foreground-tertiary ml-2">
                        from {ct.tool.package.npmPackageName}
                      </span>
                    </div>
                    <LikeButton
                      entityType="tool"
                      entityId={ct.tool.id}
                      initialCount={ct.tool.likeCount}
                      size="sm"
                    />
                  </div>
                  <p className="text-sm text-foreground-secondary line-clamp-2 mb-2">
                    {ct.tool.description}
                  </p>
                  <Badge variant="secondary" size="sm">
                    {ct.tool.package.category}
                  </Badge>
                  {ct.note && (
                    <p className="mt-2 text-xs text-foreground-tertiary italic">Note: {ct.note}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
