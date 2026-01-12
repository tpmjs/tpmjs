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
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';

interface TpmjsApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  maskedKey: string;
  scopes: string[];
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatRelativeDate(dateString: string | null): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

export default function TpmjsApiKeysPage(): React.ReactElement {
  const router = useRouter();
  const [keys, setKeys] = useState<TpmjsApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create key form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Newly created key (shown once)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Delete/rotate state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rotatingId, setRotatingId] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      const response = await fetch('/api/user/tpmjs-api-keys');
      const data = await response.json();
      if (data.success) {
        setKeys(data.apiKeys);
      } else {
        if (response.status === 401) {
          router.push('/sign-in');
          return;
        }
        setError(data.error || 'Failed to fetch keys');
      }
    } catch (err) {
      console.error('Failed to fetch keys:', err);
      setError('Failed to fetch keys');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = useCallback(async () => {
    if (!newKeyName.trim()) return;

    setCreating(true);
    setCreateError(null);

    try {
      const response = await fetch('/api/user/tpmjs-api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      const result = await response.json();

      if (result.success) {
        setNewlyCreatedKey(result.apiKey.key);
        setNewKeyName('');
        setShowCreateForm(false);
        fetchKeys();
      } else {
        setCreateError(result.error || 'Failed to create key');
      }
    } catch (err) {
      console.error('Failed to create key:', err);
      setCreateError('Failed to create key');
    } finally {
      setCreating(false);
    }
  }, [newKeyName, fetchKeys]);

  const handleDelete = useCallback(async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete API key "${name}"? This action cannot be undone.`)) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/user/tpmjs-api-keys/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        setKeys((prev) => prev.filter((k) => k.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setDeletingId(null);
    }
  }, []);

  const handleRotate = useCallback(
    async (id: string, name: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!confirm(`Rotate API key "${name}"? The old key will be immediately invalidated.`))
        return;

      setRotatingId(id);
      try {
        const response = await fetch(`/api/user/tpmjs-api-keys/${id}/rotate`, {
          method: 'POST',
        });
        const result = await response.json();
        if (result.success) {
          setNewlyCreatedKey(result.apiKey.key);
          fetchKeys();
        }
      } catch (err) {
        console.error('Failed to rotate:', err);
      } finally {
        setRotatingId(null);
      }
    },
    [fetchKeys]
  );

  const handleToggleActive = useCallback(async (id: string, currentlyActive: boolean) => {
    try {
      const response = await fetch(`/api/user/tpmjs-api-keys/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentlyActive }),
      });
      const result = await response.json();
      if (result.success) {
        setKeys((prev) =>
          prev.map((k) => (k.id === id ? { ...k, isActive: !currentlyActive } : k))
        );
      }
    } catch (err) {
      console.error('Failed to toggle active:', err);
    }
  }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  if (error) {
    return (
      <DashboardLayout title="TPMJS API Keys">
        <div className="text-center py-16">
          <Icon icon="alertCircle" size="lg" className="mx-auto text-error mb-4" />
          <h2 className="text-lg font-medium text-foreground mb-2">Error</h2>
          <p className="text-foreground-secondary mb-4">{error}</p>
          <Button onClick={fetchKeys}>Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="TPMJS API Keys"
      subtitle={keys.length > 0 ? `${keys.length} key${keys.length !== 1 ? 's' : ''}` : undefined}
      actions={
        !showCreateForm &&
        !newlyCreatedKey && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Icon icon="plus" size="sm" className="mr-2" />
            Create API Key
          </Button>
        )
      }
    >
      {/* Info banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
        <div className="flex gap-3">
          <Icon icon="info" size="sm" className="text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-foreground font-medium mb-1">
              Use API keys to access TPMJS programmatically
            </p>
            <p className="text-foreground-secondary">
              API keys allow you to call MCP endpoints, chat with agents, and connect via the bridge
              without a browser session. Keep your keys secure and never share them.
            </p>
          </div>
        </div>
      </div>

      {/* Newly created key - show only once */}
      {newlyCreatedKey && (
        <div className="bg-success/10 border border-success/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Icon icon="check" size="sm" className="text-success flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-foreground font-medium mb-2">API key created successfully!</p>
              <p className="text-foreground-secondary text-sm mb-3">
                Copy your key now. It will not be shown again.
              </p>
              <div className="flex items-center gap-2 bg-surface border border-border rounded-lg p-3">
                <code className="flex-1 font-mono text-sm text-foreground break-all">
                  {newlyCreatedKey}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(newlyCreatedKey)}
                >
                  <Icon icon={copied ? 'check' : 'copy'} size="xs" className="mr-1" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setNewlyCreatedKey(null)}>
              <Icon icon="x" size="xs" />
            </Button>
          </div>
        </div>
      )}

      {/* Create key form */}
      {showCreateForm && (
        <div className="bg-surface border border-border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-foreground mb-4">Create API Key</h2>
          {createError && <p className="text-error text-sm mb-3">{createError}</p>}
          <div className="space-y-3">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Key name (e.g., Production Server, CI/CD)"
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground text-sm placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Button onClick={handleCreate} disabled={creating || !newKeyName.trim()}>
              {creating ? 'Creating...' : 'Create Key'}
            </Button>
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Keys Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [0, 1, 2].map((idx) => (
                <TableRow key={`key-skeleton-${idx}`}>
                  <TableCell>
                    <div className="h-4 w-32 bg-surface-secondary rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-40 bg-surface-secondary rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-5 w-16 bg-surface-secondary rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-20 bg-surface-secondary rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-24 bg-surface-secondary rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-8 w-20 bg-surface-secondary rounded animate-pulse ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : keys.length === 0 ? (
              <TableEmpty
                colSpan={6}
                icon={
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon icon="key" size="lg" className="text-primary" />
                  </div>
                }
                title="No API keys yet"
                description="Create an API key to access TPMJS programmatically from your applications, scripts, or CI/CD pipelines."
                action={
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Icon icon="plus" size="sm" className="mr-2" />
                    Create Your First Key
                  </Button>
                }
              />
            ) : (
              keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon icon="key" size="sm" className="text-primary" />
                      </div>
                      <span className="font-medium text-foreground">{key.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-foreground-tertiary font-mono text-sm">
                      {key.maskedKey}
                    </code>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(key.id, key.isActive)}
                      className="cursor-pointer"
                    >
                      <Badge variant={key.isActive ? 'success' : 'secondary'}>
                        {key.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell>
                    <span className="text-foreground-secondary text-sm">
                      {formatRelativeDate(key.lastUsedAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-foreground-secondary text-sm">
                      {formatDate(key.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleRotate(key.id, key.name, e)}
                        disabled={rotatingId === key.id}
                        title="Rotate key"
                      >
                        <Icon icon="loader" size="xs" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleDelete(key.id, key.name, e)}
                        disabled={deletingId === key.id}
                        title="Delete key"
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

      {/* Usage hint */}
      {keys.length > 0 && (
        <div className="mt-6 text-sm text-foreground-tertiary">
          <p>
            Use your API key in the{' '}
            <code className="bg-surface-secondary px-1.5 py-0.5 rounded font-mono text-foreground-secondary">
              Authorization
            </code>{' '}
            header:
          </p>
          <pre className="mt-2 bg-surface-secondary border border-border rounded-lg p-3 font-mono text-xs overflow-x-auto">
            {`Authorization: Bearer tpmjs_sk_...`}
          </pre>
        </div>
      )}
    </DashboardLayout>
  );
}
