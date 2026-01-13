'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CollectionForm } from '~/components/collections/CollectionForm';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';

interface Collection {
  id: string;
  slug: string | null;
  name: string;
  description: string | null;
  toolCount: number;
  isPublic: boolean;
  updatedAt: string;
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes <= 1 ? 'Just now' : `${diffMinutes}m ago`;
    }
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CollectionCard({
  collection,
  onDelete,
  isDeleting,
  username,
}: {
  collection: Collection;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  username: string | null;
}) {
  const router = useRouter();
  const [showCopied, setShowCopied] = useState(false);

  const mcpUrl = collection.slug && username
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/api/mcp/${username}/${collection.slug}/http`
    : null;

  const handleCopyMcpUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mcpUrl) {
      navigator.clipboard.writeText(mcpUrl);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  return (
    <div
      className="bg-surface border border-border rounded-xl p-5 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
      onClick={() => router.push(`/dashboard/collections/${collection.id}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Icon icon="folder" size="md" className="text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {collection.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge
                variant={collection.isPublic ? 'default' : 'outline'}
                size="sm"
              >
                {collection.isPublic ? 'Public' : 'Private'}
              </Badge>
            </div>
          </div>
        </div>
        <span className="text-xs text-foreground-tertiary whitespace-nowrap">
          {formatRelativeDate(collection.updatedAt)}
        </span>
      </div>

      {/* Description */}
      {collection.description ? (
        <p className="text-sm text-foreground-secondary line-clamp-2 mb-4 min-h-[2.5rem]">
          {collection.description}
        </p>
      ) : (
        <p className="text-sm text-foreground-tertiary italic mb-4 min-h-[2.5rem]">
          No description
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1.5">
          <Icon icon="puzzle" size="xs" className="text-foreground-tertiary" />
          <span className="text-foreground-secondary">
            {collection.toolCount} tool{collection.toolCount !== 1 ? 's' : ''}
          </span>
        </div>
        {mcpUrl && (
          <div className="flex items-center gap-1.5">
            <Icon icon="link" size="xs" className="text-foreground-tertiary" />
            <span className="text-foreground-secondary">MCP Ready</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-border">
        {mcpUrl && (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleCopyMcpUrl}
            className="flex-1"
          >
            <Icon icon={showCopied ? 'check' : 'copy'} size="xs" className="mr-1.5" />
            {showCopied ? 'Copied!' : 'Copy MCP URL'}
          </Button>
        )}
        <Link
          href={`/dashboard/collections/${collection.id}`}
          onClick={(e) => e.stopPropagation()}
          className={mcpUrl ? '' : 'flex-1'}
        >
          <Button size="sm" variant={mcpUrl ? 'secondary' : 'default'} className={mcpUrl ? '' : 'w-full'}>
            <Icon icon="edit" size="xs" className={mcpUrl ? '' : 'mr-1.5'} />
            {!mcpUrl && 'Manage'}
          </Button>
        </Link>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(collection.id);
          }}
          disabled={isDeleting}
          className="text-foreground-tertiary hover:text-error"
        >
          <Icon icon="trash" size="xs" />
        </Button>
      </div>
    </div>
  );
}

function CollectionCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface-secondary animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-surface-secondary rounded animate-pulse" />
            <div className="h-4 w-16 bg-surface-secondary rounded animate-pulse" />
          </div>
        </div>
        <div className="h-3 w-16 bg-surface-secondary rounded animate-pulse" />
      </div>
      <div className="h-10 bg-surface-secondary rounded animate-pulse mb-4" />
      <div className="h-4 w-20 bg-surface-secondary rounded animate-pulse mb-4" />
      <div className="flex gap-2 pt-4 border-t border-border">
        <div className="flex-1 h-8 bg-surface-secondary rounded animate-pulse" />
        <div className="h-8 w-8 bg-surface-secondary rounded animate-pulse" />
        <div className="h-8 w-8 bg-surface-secondary rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function CollectionsPage(): React.ReactElement {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [username, setUsername] = useState<string | null>(null);

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

  // Fetch user info for MCP URL
  useEffect(() => {
    fetch('/api/user/profile')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.username) {
          setUsername(data.data.username);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const filteredCollections = useMemo(() => {
    if (!searchQuery.trim()) return collections;
    const query = searchQuery.toLowerCase();
    return collections.filter(
      (collection) =>
        collection.name.toLowerCase().includes(query) ||
        collection.description?.toLowerCase().includes(query)
    );
  }, [collections, searchQuery]);

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
          <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
            <Icon icon="alertCircle" size="lg" className="text-error" />
          </div>
          <h2 className="text-lg font-medium text-foreground mb-2">Something went wrong</h2>
          <p className="text-foreground-secondary mb-6 max-w-md mx-auto">{error}</p>
          <Button onClick={fetchCollections}>
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Collections"
      subtitle="Organize tools into shareable MCP servers"
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
        <div className="bg-surface border border-primary/30 rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon icon="folder" size="md" className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Create New Collection</h2>
              <p className="text-sm text-foreground-secondary">
                Group tools together and share them as an MCP server
              </p>
            </div>
          </div>
          <CollectionForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateForm(false)}
            isSubmitting={isCreating}
            submitLabel="Create Collection"
          />
        </div>
      )}

      {/* Search */}
      {(collections.length > 0 || searchQuery) && !showCreateForm && (
        <div className="mb-6">
          <div className="relative">
            <Icon
              icon="search"
              size="sm"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary"
            />
            <Input
              type="text"
              placeholder="Search collections by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <CollectionCardSkeleton key={`skeleton-${idx}`} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && collections.length === 0 && !showCreateForm && (
        <div className="text-center py-16 bg-surface border border-border rounded-xl">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Icon icon="folder" size="lg" className="text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Create your first collection</h2>
          <p className="text-foreground-secondary mb-8 max-w-md mx-auto">
            Collections group related tools together and can be shared as MCP servers.
            Connect them to Claude, Cursor, or any MCP-compatible client.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={() => setShowCreateForm(true)}>
              <Icon icon="plus" size="sm" className="mr-2" />
              Create Collection
            </Button>
            <Link href="/tool/tool-search">
              <Button size="lg" variant="outline">
                <Icon icon="search" size="sm" className="mr-2" />
                Browse Tools
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* No Results State */}
      {!isLoading && collections.length > 0 && filteredCollections.length === 0 && (
        <div className="text-center py-16 bg-surface border border-border rounded-xl">
          <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-4">
            <Icon icon="search" size="lg" className="text-foreground-tertiary" />
          </div>
          <h2 className="text-lg font-medium text-foreground mb-2">No collections found</h2>
          <p className="text-foreground-secondary mb-4">
            No collections match "{searchQuery}"
          </p>
          <Button variant="secondary" onClick={() => setSearchQuery('')}>
            Clear Search
          </Button>
        </div>
      )}

      {/* Collections Grid */}
      {!isLoading && filteredCollections.length > 0 && (
        <>
          {searchQuery && (
            <p className="text-sm text-foreground-tertiary mb-4">
              Showing {filteredCollections.length} of {collections.length} collections
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCollections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onDelete={handleDelete}
                isDeleting={deletingId === collection.id}
                username={username}
              />
            ))}
          </div>
        </>
      )}

      {/* Help Section */}
      {!isLoading && collections.length > 0 && !showCreateForm && (
        <div className="mt-8 p-6 bg-surface/50 border border-border rounded-xl">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon icon="link" size="sm" className="text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-1">Connect to MCP clients</h3>
              <p className="text-sm text-foreground-secondary mb-3">
                Each public collection has an MCP URL you can use with Claude Desktop, Cursor,
                Windsurf, or any MCP-compatible client. Copy the URL and add it to your client's configuration.
              </p>
              <Link href="/docs/tutorials/mcp" className="text-sm text-primary hover:underline">
                Learn more about MCP integration →
              </Link>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
