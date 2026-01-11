'use client';

import type { ExecutorConfig } from '@tpmjs/types/executor';
import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AddToolSearch } from '~/components/collections/AddToolSearch';
import { CollectionForm } from '~/components/collections/CollectionForm';
import { CollectionToolList } from '~/components/collections/CollectionToolList';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';
import { ExecutorConfigPanel } from '~/components/ExecutorConfigPanel';

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
            <div className="flex-1 px-3 py-2 bg-white border border-border rounded-lg font-mono text-sm text-foreground-secondary overflow-x-auto">
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
            <div className="flex-1 px-3 py-2 bg-white border border-border rounded-lg font-mono text-sm text-foreground-secondary overflow-x-auto">
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
            <pre className="p-4 bg-white border border-border rounded-lg text-xs font-mono text-foreground-secondary overflow-x-auto">
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
  executorType: string | null;
  executorConfig: { url: string; apiKey?: string } | null;
  envVars: Record<string, string> | null;
  createdAt: string;
  updatedAt: string;
  isOwner: boolean;
  tools: CollectionTool[];
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Page component with multiple handlers
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
  const [executorConfig, setExecutorConfig] = useState<ExecutorConfig | null>(null);

  // Environment variables state
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>([]);
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Fetch callback with error handling
  const fetchCollection = useCallback(async () => {
    try {
      const response = await fetch(`/api/collections/${collectionId}`);
      const data = await response.json();

      if (data.success) {
        setCollection(data.data);
        // Initialize executor config state from collection data
        if (data.data.executorType === 'custom_url' && data.data.executorConfig) {
          setExecutorConfig({
            type: 'custom_url',
            url: data.data.executorConfig.url,
            apiKey: data.data.executorConfig.apiKey,
          });
        } else {
          setExecutorConfig(data.data.executorType ? { type: 'default' } : null);
        }
        // Initialize env vars from collection data
        if (data.data.envVars && typeof data.data.envVars === 'object') {
          setEnvVars(
            Object.entries(data.data.envVars).map(([key, value]) => ({
              key,
              value: String(value),
            }))
          );
        } else {
          setEnvVars([]);
        }
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

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Multiple conditional fields in update payload
  const handleUpdate = async (data: { name: string; description?: string; isPublic: boolean }) => {
    if (!collection) return;
    setIsUpdating(true);

    // Build update payload including executor config
    const updatePayload: Record<string, unknown> = { ...data };
    if (executorConfig) {
      updatePayload.executorType = executorConfig.type;
      if (executorConfig.type === 'custom_url') {
        updatePayload.executorConfig = {
          url: executorConfig.url,
          apiKey: executorConfig.apiKey,
        };
      } else {
        updatePayload.executorConfig = null;
      }
    } else {
      updatePayload.executorType = null;
      updatePayload.executorConfig = null;
    }

    // Add env vars - convert array to object
    const envVarsObject: Record<string, string> = {};
    for (const { key, value } of envVars) {
      if (key.trim()) {
        envVarsObject[key.trim()] = value;
      }
    }
    updatePayload.envVars = Object.keys(envVarsObject).length > 0 ? envVarsObject : null;

    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
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
                executorType: result.data.executorType,
                executorConfig: result.data.executorConfig,
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
      <DashboardLayout title="Loading..." showBackButton backUrl="/dashboard/collections">
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
      </DashboardLayout>
    );
  }

  if (error || !collection) {
    return (
      <DashboardLayout title="Error" showBackButton backUrl="/dashboard/collections">
        <div className="text-center py-16">
          <Icon icon="alertCircle" size="lg" className="mx-auto text-error mb-4" />
          <h2 className="text-lg font-medium text-foreground mb-2">Error</h2>
          <p className="text-foreground-secondary mb-4">{error || 'Collection not found'}</p>
          <Link href="/dashboard/collections">
            <Button>Back to Collections</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const existingToolIds = collection.tools.map((t) => t.toolId);

  return (
    <DashboardLayout
      title={isEditing ? 'Edit Collection' : collection.name}
      subtitle={
        !isEditing
          ? `${collection.toolCount} ${collection.toolCount === 1 ? 'tool' : 'tools'}${collection.isPublic ? ' • Public' : ''}`
          : undefined
      }
      showBackButton
      backUrl="/dashboard/collections"
      actions={
        collection.isOwner &&
        !isEditing && (
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
        )
      }
    >
      {/* Edit Form */}
      {isEditing && (
        <div className="bg-white border border-border rounded-lg p-6 mb-8">
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

          {/* Executor Configuration */}
          <div className="mt-6 pt-6 border-t border-border">
            <ExecutorConfigPanel
              value={executorConfig}
              onChange={setExecutorConfig}
              disabled={isUpdating}
            />
          </div>

          {/* Environment Variables */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-foreground">Environment Variables</h3>
                <p className="text-xs text-foreground-tertiary mt-0.5">
                  Passed to tools at runtime. Agent vars override collection vars.
                </p>
              </div>
            </div>

            {/* Existing env vars */}
            {envVars.length > 0 && (
              <div className="space-y-2 mb-3">
                {envVars.map((env, index) => (
                  <div key={`env-${env.key || index}`} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={env.key}
                      onChange={(e) => {
                        const updated = [...envVars];
                        updated[index] = { key: e.target.value, value: env.value };
                        setEnvVars(updated);
                      }}
                      placeholder="KEY"
                      className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                    <input
                      type="password"
                      value={env.value}
                      onChange={(e) => {
                        const updated = [...envVars];
                        updated[index] = { key: env.key, value: e.target.value };
                        setEnvVars(updated);
                      }}
                      placeholder="value"
                      className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEnvVars(envVars.filter((_, i) => i !== index));
                      }}
                      title="Remove"
                    >
                      <Icon icon="trash" size="xs" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new env var */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newEnvKey}
                onChange={(e) => setNewEnvKey(e.target.value.toUpperCase())}
                placeholder="NEW_KEY"
                className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
              <input
                type="text"
                value={newEnvValue}
                onChange={(e) => setNewEnvValue(e.target.value)}
                placeholder="value"
                className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  if (newEnvKey.trim()) {
                    setEnvVars([...envVars, { key: newEnvKey.trim(), value: newEnvValue }]);
                    setNewEnvKey('');
                    setNewEnvValue('');
                  }
                }}
                disabled={!newEnvKey.trim()}
              >
                <Icon icon="plus" size="xs" className="mr-1" />
                Add
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      {!isEditing && collection.description && (
        <p className="text-foreground-secondary mb-8">{collection.description}</p>
      )}

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
    </DashboardLayout>
  );
}
