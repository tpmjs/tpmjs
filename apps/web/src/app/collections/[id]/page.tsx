'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';
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
  name: string;
  description: string | null;
  likeCount: number;
  toolCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    image: string | null;
  };
  tools: CollectionTool[];
}

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

export default function PublicCollectionDetailPage(): React.ReactElement {
  const params = useParams();
  const collectionId = params.id as string;

  const [collection, setCollection] = useState<PublicCollection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollection = useCallback(async () => {
    try {
      const response = await fetch(`/api/public/collections/${collectionId}`);
      const data = await response.json();

      if (data.success) {
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
  }, [collectionId]);

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

        {/* MCP URLs */}
        <McpUrlSection collectionId={collection.id} />

        {/* Tools */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Tools in this Collection</h2>

          {collection.tools.length === 0 ? (
            <div className="text-center py-12 bg-surface/50 border border-border rounded-lg">
              <Icon icon="puzzle" size="lg" className="mx-auto text-foreground-tertiary mb-2" />
              <p className="text-foreground-secondary">No tools in this collection yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {collection.tools.map((ct) => (
                <div
                  key={ct.id}
                  className="bg-background border border-border rounded-lg p-4 hover:border-foreground/20 transition-colors"
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
