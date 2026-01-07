'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';
import { AddToolSearch } from '~/components/collections/AddToolSearch';
import { CollectionForm } from '~/components/collections/CollectionForm';
import { CollectionToolList } from '~/components/collections/CollectionToolList';

function McpUrlSection({ collectionId }: { collectionId: string }) {
  const [copiedUrl, setCopiedUrl] = useState<'http' | 'sse' | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://tpmjs.com';
  const httpUrl = `${baseUrl}/api/collections/${collectionId}/mcp/http`;
  const sseUrl = `${baseUrl}/api/collections/${collectionId}/mcp/sse`;

  const copyToClipboard = async (url: string, type: 'http' | 'sse') => {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(type);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const configSnippet = `{
  "mcpServers": {
    "tpmjs-collection": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "${httpUrl}"
      ]
    }
  }
}`;

  return (
    <div className="mb-8 p-4 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 border border-primary/20 rounded-xl">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-primary/10 rounded-lg">
          <Icon icon="link" size="sm" className="text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">MCP Server URLs</h3>
        <Badge variant="secondary" size="sm">
          Public
        </Badge>
      </div>

      <div className="space-y-3">
        {/* HTTP Transport */}
        <div className="group">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-medium text-foreground-secondary uppercase tracking-wide">
              HTTP Transport
            </span>
            <span className="text-xs text-foreground-tertiary">(recommended)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 bg-background border border-border rounded-lg font-mono text-sm text-foreground-secondary overflow-x-auto">
              {httpUrl}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => copyToClipboard(httpUrl, 'http')}
              className="shrink-0"
            >
              <Icon icon={copiedUrl === 'http' ? 'check' : 'copy'} size="xs" className="mr-1" />
              {copiedUrl === 'http' ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* SSE Transport */}
        <div className="group">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-medium text-foreground-secondary uppercase tracking-wide">
              SSE Transport
            </span>
            <span className="text-xs text-foreground-tertiary">(streaming)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 bg-background border border-border rounded-lg font-mono text-sm text-foreground-secondary overflow-x-auto">
              {sseUrl}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => copyToClipboard(sseUrl, 'sse')}
              className="shrink-0"
            >
              <Icon icon={copiedUrl === 'sse' ? 'check' : 'copy'} size="xs" className="mr-1" />
              {copiedUrl === 'sse' ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>
      </div>

      {/* Config snippet toggle */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <button
          type="button"
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          <Icon icon={showConfig ? 'chevronDown' : 'chevronRight'} size="xs" />
          <span>Show Claude Desktop config</span>
        </button>

        {showConfig && (
          <div className="mt-3 relative">
            <pre className="p-4 bg-background border border-border rounded-lg text-xs font-mono text-foreground-secondary overflow-x-auto">
              {configSnippet}
            </pre>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(configSnippet);
                setCopiedUrl('http');
                setTimeout(() => setCopiedUrl(null), 2000);
              }}
              className="absolute top-2 right-2"
            >
              <Icon icon="copy" size="xs" />
            </Button>
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-foreground-tertiary">
        Use these URLs with{' '}
        <Link href="/docs/tutorials/mcp" className="text-primary hover:underline">
          Claude Desktop, Cursor, or any MCP client
        </Link>
      </p>
    </div>
  );
}

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
    package: {
      id: string;
      npmPackageName: string;
      category: string;
    };
  };
}

interface Collection {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  toolCount: number;
  createdAt: string;
  updatedAt: string;
  isOwner: boolean;
  tools: CollectionTool[];
}

export default function CollectionDetailPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.id as string;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [removingToolId, setRemovingToolId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCollection = useCallback(async () => {
    try {
      const response = await fetch(`/api/collections/${collectionId}`);
      const data = await response.json();

      if (data.success) {
        setCollection(data.data);
      } else {
        if (data.error?.code === 'UNAUTHORIZED') {
          router.push('/sign-in');
          return;
        }
        if (data.error?.code === 'NOT_FOUND') {
          router.push('/dashboard/collections');
          return;
        }
        setError(data.error?.message || 'Failed to fetch collection');
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

  const handleUpdate = async (data: { name: string; description?: string; isPublic: boolean }) => {
    if (!collection) return;
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setCollection((prev) =>
          prev
            ? {
                ...prev,
                name: result.data.name,
                description: result.data.description,
                isPublic: result.data.isPublic,
                updatedAt: result.data.updatedAt,
              }
            : null
        );
        setIsEditing(false);
      } else {
        throw new Error(result.error?.message || 'Failed to update collection');
      }
    } catch (err) {
      console.error('Failed to update collection:', err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this collection? All tools will be removed and this action cannot be undone.'
      )
    ) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        router.push('/dashboard/collections');
      } else {
        throw new Error(result.error?.message || 'Failed to delete collection');
      }
    } catch (err) {
      console.error('Failed to delete collection:', err);
      alert('Failed to delete collection');
      setIsDeleting(false);
    }
  };

  const handleToolAdded = (tool: {
    id: string;
    name: string;
    description: string;
    package: { npmPackageName: string; category: string };
  }) => {
    if (!collection) return;

    const newTool: CollectionTool = {
      id: crypto.randomUUID(),
      toolId: tool.id,
      position: collection.tools.length,
      note: null,
      addedAt: new Date().toISOString(),
      tool: {
        id: tool.id,
        name: tool.name,
        description: tool.description,
        package: {
          id: '',
          npmPackageName: tool.package.npmPackageName,
          category: tool.package.category,
        },
      },
    };

    setCollection((prev) =>
      prev
        ? {
            ...prev,
            toolCount: prev.toolCount + 1,
            tools: [...prev.tools, newTool],
          }
        : null
    );
  };

  const handleRemoveTool = async (toolId: string) => {
    setRemovingToolId(toolId);

    try {
      const response = await fetch(`/api/collections/${collectionId}/tools/${toolId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setCollection((prev) =>
          prev
            ? {
                ...prev,
                toolCount: prev.toolCount - 1,
                tools: prev.tools.filter((t) => t.toolId !== toolId),
              }
            : null
        );
      } else {
        throw new Error(result.error?.message || 'Failed to remove tool');
      }
    } catch (err) {
      console.error('Failed to remove tool:', err);
      alert('Failed to remove tool');
    } finally {
      setRemovingToolId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="max-w-4xl mx-auto py-12 px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-surface-secondary rounded w-48 mb-4" />
            <div className="h-4 bg-surface-secondary rounded w-96 mb-8" />
            <div className="h-12 bg-surface-secondary rounded mb-6" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-surface-secondary rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="max-w-4xl mx-auto py-12 px-4">
          <div className="text-center py-16">
            <Icon icon="alertCircle" size="lg" className="mx-auto text-error mb-4" />
            <h2 className="text-lg font-medium text-foreground mb-2">Error</h2>
            <p className="text-foreground-secondary mb-4">{error || 'Collection not found'}</p>
            <Link href="/dashboard/collections">
              <Button>Back to Collections</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const existingToolIds = collection.tools.map((t) => t.toolId);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="max-w-4xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/dashboard/collections"
            className="text-foreground-secondary hover:text-foreground transition-colors"
          >
            <Icon icon="arrowLeft" size="sm" />
          </Link>
          <div className="flex-1">
            {isEditing ? (
              <div className="bg-background border border-border rounded-lg p-6">
                <h2 className="text-lg font-medium text-foreground mb-4">Edit Collection</h2>
                <CollectionForm
                  initialData={{
                    name: collection.name,
                    description: collection.description,
                    isPublic: collection.isPublic,
                  }}
                  onSubmit={handleUpdate}
                  onCancel={() => setIsEditing(false)}
                  isSubmitting={isUpdating}
                  submitLabel="Save Changes"
                />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-foreground">{collection.name}</h1>
                  {collection.isPublic && (
                    <Badge variant="secondary" size="sm">
                      <Icon icon="globe" size="sm" className="mr-1" />
                      Public
                    </Badge>
                  )}
                </div>
                {collection.description && (
                  <p className="text-foreground-secondary">{collection.description}</p>
                )}
              </>
            )}
          </div>
          {collection.isOwner && !isEditing && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <Icon icon="edit" size="sm" className="mr-1" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                loading={isDeleting}
                disabled={isDeleting}
                className="text-error hover:text-error hover:bg-error/10"
              >
                <Icon icon="trash" size="sm" className="mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-foreground-secondary mb-8">
          <span className="flex items-center gap-1">
            <Icon icon="box" size="sm" />
            {collection.toolCount} {collection.toolCount === 1 ? 'tool' : 'tools'}
          </span>
          <span>Updated {new Date(collection.updatedAt).toLocaleDateString()}</span>
        </div>

        {/* MCP URLs - only for public collections */}
        {collection.isPublic && <McpUrlSection collectionId={collection.id} />}

        {/* Add Tool Search */}
        {collection.isOwner && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-foreground mb-2">Add Tools</h2>
            <AddToolSearch
              collectionId={collection.id}
              existingToolIds={existingToolIds}
              onToolAdded={handleToolAdded}
            />
          </div>
        )}

        {/* Tools List */}
        <div>
          <h2 className="text-sm font-medium text-foreground mb-3">Tools in this Collection</h2>
          <CollectionToolList
            tools={collection.tools}
            onRemove={collection.isOwner ? handleRemoveTool : undefined}
            removingId={removingToolId}
            isOwner={collection.isOwner}
          />
        </div>
      </div>
    </div>
  );
}
