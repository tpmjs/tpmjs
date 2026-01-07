'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@tpmjs/ui/Table/Table';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { CollectionForm } from '~/components/collections/CollectionForm';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';

interface Collection {
  id: string;
  name: string;
  description: string | null;
  toolCount: number;
  isPublic: boolean;
  updatedAt: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  if (error) {
    return (
      <DashboardLayout
        title="Collections"
        actions={
          <Button onClick={() => setShowCreateForm(true)}>
            <Icon icon="plus" size="sm" className="mr-2" />
            New Collection
          </Button>
        }
      >
        <div className="text-center py-16">
          <Icon icon="alertCircle" size="lg" className="mx-auto text-error mb-4" />
          <h2 className="text-lg font-medium text-foreground mb-2">Error</h2>
          <p className="text-foreground-secondary mb-4">{error}</p>
          <Button onClick={fetchCollections}>Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Collections"
      subtitle={
        collections.length > 0
          ? `${collections.length} collection${collections.length !== 1 ? 's' : ''}`
          : undefined
      }
      actions={
        !showCreateForm && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Icon icon="plus" size="sm" className="mr-2" />
            New Collection
          </Button>
        )
      }
    >
      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-background border border-border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-foreground mb-4">Create New Collection</h2>
          <CollectionForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateForm(false)}
            isSubmitting={isCreating}
            submitLabel="Create Collection"
          />
        </div>
      )}

      {/* Collections Table */}
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[350px]">Name</TableHead>
              <TableHead>Tools</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              <>
                {[0, 1, 2].map((idx) => (
                  <TableRow key={`collection-skeleton-${idx}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-secondary animate-pulse" />
                        <div className="space-y-1.5">
                          <div className="h-4 w-32 bg-surface-secondary rounded animate-pulse" />
                          <div className="h-3 w-48 bg-surface-secondary rounded animate-pulse" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-12 bg-surface-secondary rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-16 bg-surface-secondary rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-24 bg-surface-secondary rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-8 w-8 bg-surface-secondary rounded animate-pulse ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </>
            ) : collections.length === 0 ? (
              <TableEmpty
                colSpan={5}
                icon={
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon icon="folder" size="lg" className="text-primary" />
                  </div>
                }
                title="No collections yet"
                description="Create a collection to organize your tools. Collections make it easy to group related tools together and share them with your agents."
                action={
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Icon icon="plus" size="sm" className="mr-2" />
                    Create Your First Collection
                  </Button>
                }
              />
            ) : (
              collections.map((collection) => (
                <TableRow
                  key={collection.id}
                  interactive
                  onClick={() => router.push(`/dashboard/collections/${collection.id}`)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon icon="folder" size="sm" className="text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{collection.name}</p>
                        {collection.description && (
                          <p className="text-sm text-foreground-tertiary truncate max-w-[280px]">
                            {collection.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-foreground-secondary">{collection.toolCount}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={collection.isPublic ? 'default' : 'outline'} size="sm">
                      {collection.isPublic ? 'Public' : 'Private'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-foreground-secondary text-sm">
                      {formatDate(collection.updatedAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleDelete(collection.id, e)}
                        disabled={deletingId === collection.id}
                      >
                        <Icon icon="trash" size="xs" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </DashboardLayout>
  );
}
