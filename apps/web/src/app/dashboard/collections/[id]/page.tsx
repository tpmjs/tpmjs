'use client';

import type { ExecutorConfig } from '@tpmjs/types/executor';
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
import { Tabs } from '@tpmjs/ui/Tabs/Tabs';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AddToolSearch } from '~/components/collections/AddToolSearch';
import { CollectionForm } from '~/components/collections/CollectionForm';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';
import { EnvVarsEditor } from '~/components/EnvVarsEditor';
import { ExecutorConfigPanel } from '~/components/ExecutorConfigPanel';

// MCP URL display component
function McpUrlDisplay({ url, label, sublabel }: { url: string; label: string; sublabel: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs font-medium text-foreground-secondary uppercase tracking-wide">
          {label}
        </span>
        <span className="text-xs text-foreground-tertiary">({sublabel})</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg font-mono text-sm text-foreground-secondary overflow-x-auto">
          {url}
        </div>
        <Button variant="secondary" size="sm" onClick={copyToClipboard} className="shrink-0">
          <Icon icon={copied ? 'check' : 'copy'} size="xs" className="mr-1" />
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
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
  slug: string;
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
  user: {
    username: string;
  };
  tools: CollectionTool[];
}

type TabId = 'tools' | 'connect' | 'env-vars' | 'settings';

const VALID_TABS: TabId[] = ['tools', 'connect', 'env-vars', 'settings'];

export default function CollectionDetailPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const collectionId = params.id as string;

  // Get initial tab from URL or default to 'tools'
  const tabFromUrl = searchParams.get('tab') as TabId | null;
  const initialTab = tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'tools';

  const [collection, setCollection] = useState<Collection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [isUpdating, setIsUpdating] = useState(false);
  const [removingToolId, setRemovingToolId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [executorConfig, setExecutorConfig] = useState<ExecutorConfig | null>(null);
  const [envVars, setEnvVars] = useState<Record<string, string> | null>(null);
  const [showClaudeConfig, setShowClaudeConfig] = useState(false);

  // Update URL when tab changes
  const handleTabChange = (tabId: string) => {
    const newTab = tabId as TabId;
    setActiveTab(newTab);
    const newParams = new URLSearchParams(searchParams.toString());
    if (newTab === 'tools') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', newTab);
    }
    const queryString = newParams.toString();
    router.replace(`/dashboard/collections/${collectionId}${queryString ? `?${queryString}` : ''}`, {
      scroll: false,
    });
  };

  const fetchCollection = useCallback(async () => {
    try {
      const response = await fetch(`/api/collections/${collectionId}`);
      const data = await response.json();

      if (data.success) {
        setCollection(data.data);
        if (data.data.executorType === 'custom_url' && data.data.executorConfig) {
          setExecutorConfig({
            type: 'custom_url',
            url: data.data.executorConfig.url,
            apiKey: data.data.executorConfig.apiKey,
          });
        } else {
          setExecutorConfig(data.data.executorType ? { type: 'default' } : null);
        }
        if (data.data.envVars && typeof data.data.envVars === 'object') {
          setEnvVars(data.data.envVars as Record<string, string>);
        } else {
          setEnvVars(null);
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

  const handleUpdate = async (data: { name: string; description?: string; isPublic: boolean }) => {
    if (!collection) return;
    setIsUpdating(true);

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
    updatePayload.envVars = envVars;

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
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://tpmjs.com';
  const httpUrl = `${baseUrl}/api/mcp/${collection.user.username}/${collection.slug}/http`;
  const sseUrl = `${baseUrl}/api/mcp/${collection.user.username}/${collection.slug}/sse`;

  const configSnippet = `{
  "mcpServers": {
    "${collection.slug}": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "${httpUrl}",
        "--header",
        "Authorization: Bearer YOUR_TPMJS_API_KEY"
      ]
    }
  }
}`;

  const envVarsCount = envVars ? Object.keys(envVars).length : 0;

  const tabs = [
    { id: 'tools' as const, label: 'Tools', count: collection.toolCount },
    { id: 'connect' as const, label: 'Connect' },
    { id: 'env-vars' as const, label: 'Env Vars', count: envVarsCount > 0 ? envVarsCount : undefined },
    { id: 'settings' as const, label: 'Settings' },
  ];

  return (
    <DashboardLayout
      title={collection.name}
      subtitle={collection.description || undefined}
      showBackButton
      backUrl="/dashboard/collections"
      actions={
        collection.isOwner && (
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
        )
      }
    >
      {/* Status badges */}
      <div className="flex items-center gap-2 mb-6">
        <Badge variant={collection.isPublic ? 'success' : 'secondary'}>
          {collection.isPublic ? 'Public' : 'Private'}
        </Badge>
        {executorConfig?.type === 'custom_url' && <Badge variant="secondary">Custom Executor</Badge>}
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        className="mb-6"
      />

      {/* Tools Tab */}
      {activeTab === 'tools' && (
        <div>
          {/* Add Tools Search */}
          {collection.isOwner && (
            <div className="mb-6">
              <AddToolSearch
                collectionId={collection.id}
                existingToolIds={existingToolIds}
                onToolAdded={handleToolAdded}
              />
            </div>
          )}

          {/* Tools Table */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Tool</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[120px]">Category</TableHead>
                  {collection.isOwner && <TableHead className="w-[80px] text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {collection.tools.length === 0 ? (
                  <TableEmpty
                    colSpan={collection.isOwner ? 4 : 3}
                    icon={
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon icon="puzzle" size="lg" className="text-primary" />
                      </div>
                    }
                    title="No tools yet"
                    description="Search and add tools to this collection to get started."
                  />
                ) : (
                  collection.tools.map((ct) => (
                    <TableRow key={ct.id}>
                      <TableCell>
                        <Link
                          href={`/tool/${ct.tool.package.npmPackageName}/${ct.tool.name}`}
                          className="font-medium text-foreground hover:text-primary transition-colors"
                        >
                          {ct.tool.name}
                        </Link>
                        <div className="text-xs text-foreground-tertiary mt-0.5">
                          {ct.tool.package.npmPackageName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground-secondary line-clamp-2">
                          {ct.tool.description}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" size="sm">
                          {ct.tool.package.category}
                        </Badge>
                      </TableCell>
                      {collection.isOwner && (
                        <TableCell>
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveTool(ct.toolId)}
                              disabled={removingToolId === ct.toolId}
                              className="text-error hover:text-error hover:bg-error/10"
                            >
                              <Icon icon="trash" size="xs" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Connect Tab */}
      {activeTab === 'connect' && (
        <div className="space-y-6">
          {/* Username warning */}
          {collection.isPublic && !collection.user.username && (
            <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Icon icon="alertCircle" size="sm" className="text-warning mt-0.5" />
                <div>
                  <h3 className="font-medium text-foreground">Set your username to enable MCP</h3>
                  <p className="text-sm text-foreground-secondary mt-1">
                    You need to set a username before you can share this collection as an MCP server.
                  </p>
                  <Link href="/dashboard/settings/profile" className="inline-block mt-3">
                    <Button size="sm" variant="secondary">
                      <Icon icon="user" size="xs" className="mr-1" />
                      Set Username
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Private collection notice */}
          {!collection.isPublic && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Icon icon="info" size="sm" className="text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium text-foreground">Private Collection</h3>
                  <p className="text-sm text-foreground-secondary mt-1">
                    Make this collection public in Settings to get shareable MCP server URLs.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* MCP URLs */}
          {collection.isPublic && collection.user.username && (
            <div className="bg-surface border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <Icon icon="link" size="sm" className="text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">MCP Server URLs</h3>
              </div>

              <div className="space-y-4">
                <McpUrlDisplay url={httpUrl} label="HTTP Transport" sublabel="recommended" />
                <McpUrlDisplay url={sseUrl} label="SSE Transport" sublabel="streaming" />
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowClaudeConfig(!showClaudeConfig)}
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  <Icon icon={showClaudeConfig ? 'chevronDown' : 'chevronRight'} size="xs" />
                  <span>Show Claude Desktop config</span>
                </button>

                {showClaudeConfig && (
                  <div className="mt-3 relative">
                    <pre className="p-4 bg-surface-secondary border border-border rounded-lg text-xs font-mono text-foreground-secondary overflow-x-auto">
                      {configSnippet}
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(configSnippet)}
                      className="absolute top-2 right-2"
                    >
                      <Icon icon="copy" size="xs" />
                    </Button>
                  </div>
                )}
              </div>

              <p className="mt-4 text-xs text-foreground-tertiary">
                Use these URLs with{' '}
                <Link href="/docs/tutorials/mcp" className="text-primary hover:underline">
                  Claude Desktop, Cursor, or any MCP client
                </Link>
                . Requires your{' '}
                <Link href="/dashboard/settings/tpmjs-api-keys" className="text-primary hover:underline">
                  TPMJS API key
                </Link>{' '}
                for authentication.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Env Vars Tab */}
      {activeTab === 'env-vars' && collection.isOwner && (
        <div className="bg-surface border border-border rounded-lg p-6">
          <EnvVarsEditor
            value={envVars}
            onChange={(newEnvVars) => {
              setEnvVars(newEnvVars);
              // Auto-save env vars
              fetch(`/api/collections/${collectionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ envVars: newEnvVars }),
              });
            }}
            title="Environment Variables"
            description="These variables are passed to tools at runtime. Use them to store API keys and configuration."
            disabled={isUpdating}
          />
        </div>
      )}

      {/* Env Vars Tab - Not Owner */}
      {activeTab === 'env-vars' && !collection.isOwner && (
        <div className="text-center py-16">
          <Icon icon="key" size="lg" className="mx-auto text-foreground-tertiary mb-4" />
          <h2 className="text-lg font-medium text-foreground mb-2">Environment Variables Unavailable</h2>
          <p className="text-foreground-secondary">
            You can only view environment variables for collections you own.
          </p>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && collection.isOwner && (
        <div className="space-y-6">
          {/* Collection Info */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Collection Details</h3>
            <CollectionForm
              initialData={{
                name: collection.name,
                description: collection.description,
                isPublic: collection.isPublic,
              }}
              onSubmit={handleUpdate}
              isSubmitting={isUpdating}
              submitLabel="Save Changes"
            />
          </div>

          {/* Executor Configuration */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <ExecutorConfigPanel
              value={executorConfig}
              onChange={(newConfig) => {
                setExecutorConfig(newConfig);
                // Auto-save executor config
                const updatePayload: Record<string, unknown> = {};
                if (newConfig) {
                  updatePayload.executorType = newConfig.type;
                  if (newConfig.type === 'custom_url') {
                    updatePayload.executorConfig = {
                      url: newConfig.url,
                      apiKey: newConfig.apiKey,
                    };
                  } else {
                    updatePayload.executorConfig = null;
                  }
                } else {
                  updatePayload.executorType = null;
                  updatePayload.executorConfig = null;
                }
                fetch(`/api/collections/${collectionId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updatePayload),
                });
              }}
              disabled={isUpdating}
            />
          </div>
        </div>
      )}

      {/* Settings Tab - Not Owner */}
      {activeTab === 'settings' && !collection.isOwner && (
        <div className="text-center py-16">
          <Icon icon="key" size="lg" className="mx-auto text-foreground-tertiary mb-4" />
          <h2 className="text-lg font-medium text-foreground mb-2">Settings Unavailable</h2>
          <p className="text-foreground-secondary">
            You can only view settings for collections you own.
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}
