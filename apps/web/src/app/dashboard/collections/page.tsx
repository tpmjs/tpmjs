'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { CollectionForm } from '~/components/collections/CollectionForm';
import { CollectionList } from '~/components/collections/CollectionList';

interface Collection {
  id: string;
  name: string;
  description: string | null;
  toolCount: number;
  isPublic: boolean;
  updatedAt: string;
}

export default function CollectionsPage(): React.ReactElement {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    try {
      const response = await fetch('/api/collections');
      const data = await response.json();

      if (data.success) {
        setCollections(data.data);
      } else {
        if (data.error?.code === 'UNAUTHORIZED') {
          router.push('/sign-in');
          return;
        }
        setError(data.error?.message || 'Failed to fetch collections');
      }
    } catch (err) {
      console.error('Failed to fetch collections:', err);
      setError('Failed to fetch collections');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleCreate = async (data: { name: string; description?: string; isPublic: boolean }) => {
    setIsCreating(true);

    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setCollections((prev) => [result.data, ...prev]);
        setShowCreateForm(false);
      } else {
        throw new Error(result.error?.message || 'Failed to create collection');
      }
    } catch (err) {
      console.error('Failed to create collection:', err);
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm('Are you sure you want to delete this collection? This action cannot be undone.')
    ) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(`/api/collections/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setCollections((prev) => prev.filter((c) => c.id !== id));
      } else {
        throw new Error(result.error?.message || 'Failed to delete collection');
      }
    } catch (err) {
      console.error('Failed to delete collection:', err);
      alert('Failed to delete collection');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto py-12 px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-surface-secondary rounded w-48 mb-8" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-surface-secondary rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto py-12 px-4">
          <div className="text-center py-16">
            <Icon icon="alertCircle" size="lg" className="mx-auto text-error mb-4" />
            <h2 className="text-lg font-medium text-foreground mb-2">Error</h2>
            <p className="text-foreground-secondary mb-4">{error}</p>
            <Button onClick={fetchCollections}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-foreground-secondary hover:text-foreground transition-colors"
            >
              <Icon icon="arrowLeft" size="sm" />
            </Link>
            <h1 className="text-2xl font-bold text-foreground">My Collections</h1>
          </div>
          {!showCreateForm && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Icon icon="plus" size="sm" className="mr-2" />
              New Collection
            </Button>
          )}
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-background border border-border rounded-lg p-6 mb-8">
            <h2 className="text-lg font-medium text-foreground mb-4">Create New Collection</h2>
            <CollectionForm
              onSubmit={handleCreate}
              onCancel={() => setShowCreateForm(false)}
              isSubmitting={isCreating}
              submitLabel="Create Collection"
            />
          </div>
        )}

        {/* Collections List */}
        <CollectionList collections={collections} onDelete={handleDelete} deletingId={deletingId} />
      </div>
    </div>
  );
}
