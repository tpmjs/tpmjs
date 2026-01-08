'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
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

function McpUrlSection({ username, slug }: { username: string; slug: string }) {
  const [copiedUrl, setCopiedUrl] = useState<'http' | 'sse' | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://tpmjs.com';
  const httpUrl = `${baseUrl}/api/mcp/${username}/${slug}/http`;
  const sseUrl = `${baseUrl}/api/mcp/${username}/${slug}/sse`;

  const copyToClipboard = async (url: string, type: 'http' | 'sse') => {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(type);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const configSnippet = `{
  "mcpServers": {
    "tpmjs-${slug}": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "${httpUrl}"
      ]
    }
  }
}`;

  return (
    <section className="p-4 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 border border-primary/20 rounded-xl">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-primary/10 rounded-lg">
          <Icon icon="link" className="w-4 h-4 text-primary" />
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
            <div className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg font-mono text-sm text-foreground-secondary overflow-x-auto">
              {httpUrl}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => copyToClipboard(httpUrl, 'http')}
              className="shrink-0"
            >
              <Icon icon={copiedUrl === 'http' ? 'check' : 'copy'} className="w-4 h-4 mr-1" />
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
            <div className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg font-mono text-sm text-foreground-secondary overflow-x-auto">
              {sseUrl}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => copyToClipboard(sseUrl, 'sse')}
              className="shrink-0"
            >
              <Icon icon={copiedUrl === 'sse' ? 'check' : 'copy'} className="w-4 h-4 mr-1" />
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
          <Icon icon={showConfig ? 'chevronDown' : 'chevronRight'} className="w-4 h-4" />
          <span>Show Claude Desktop config</span>
        </button>

        {showConfig && (
          <div className="mt-3">
            <CodeBlock language="json" code={configSnippet} />
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-foreground-tertiary">
        Use these URLs with{' '}
        <Link href="/docs/sharing" className="text-primary hover:underline">
          Claude Desktop, Cursor, or any MCP client
        </Link>
      </p>
    </section>
  );
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

            {/* MCP Server URLs */}
            <McpUrlSection username={username} slug={collection.slug} />

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
