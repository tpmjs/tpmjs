'use client';

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

interface ApiKeyInfo {
  id: string;
  keyName: string;
  keyHint: string | null;
  createdAt: string;
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

export default function ApiKeysPage(): React.ReactElement {
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add new key form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // .env import
  const [showImport, setShowImport] = useState(false);
  const [envText, setEnvText] = useState('');
  const [importing, setImporting] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      const response = await fetch('/api/user/api-keys');
      const data = await response.json();
      if (data.success) {
        setKeys(data.data);
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

  const saveKey = useCallback(async (keyName: string, keyValue: string) => {
    const response = await fetch('/api/user/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyName, keyValue }),
    });
    const result = await response.json();
    return result;
  }, []);

  const handleAddKey = useCallback(async () => {
    if (!newKeyName.trim() || !newKeyValue.trim()) return;

    setSaving(true);
    setSaveError(null);

    const result = await saveKey(newKeyName.trim(), newKeyValue.trim());

    if (result.success) {
      setNewKeyName('');
      setNewKeyValue('');
      setShowAddForm(false);
      fetchKeys();
    } else {
      setSaveError(result.error || 'Failed to save');
    }

    setSaving(false);
  }, [newKeyName, newKeyValue, saveKey, fetchKeys]);

  const handleDelete = useCallback(async (keyName: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete ${keyName}?`)) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/user/api-keys/${encodeURIComponent(keyName)}`, {
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

  const handleImport = useCallback(async () => {
    const lines = envText.split('\n');
    const keysToSave: { keyName: string; keyValue: string }[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*["']?(.+?)["']?$/);
      if (match) {
        const [, keyName, keyValue] = match;
        if (keyName && keyValue) {
          keysToSave.push({ keyName, keyValue: keyValue.trim() });
        }
      }
    }

    if (keysToSave.length === 0) return;

    setImporting(true);
    for (const { keyName, keyValue } of keysToSave) {
      await saveKey(keyName, keyValue);
    }
    setImporting(false);
    setEnvText('');
    setShowImport(false);
    fetchKeys();
  }, [envText, saveKey, fetchKeys]);

  if (error) {
    return (
      <DashboardLayout title="API Keys">
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
      title="API Keys"
      subtitle={keys.length > 0 ? `${keys.length} key${keys.length !== 1 ? 's' : ''}` : undefined}
      actions={
        !showAddForm &&
        !showImport && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
              <Icon icon="upload" size="sm" className="mr-2" />
              Import .env
            </Button>
            <Button onClick={() => setShowAddForm(true)}>
              <Icon icon="plus" size="sm" className="mr-2" />
              Add Key
            </Button>
          </div>
        )
      }
    >
      {/* Import from .env */}
      {showImport && (
        <div className="bg-background border border-border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-foreground mb-4">Import from .env</h2>
          <textarea
            value={envText}
            onChange={(e) => setEnvText(e.target.value)}
            placeholder="Paste .env content here...
MY_API_KEY=abc123
ANOTHER_SECRET=xyz789"
            rows={5}
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground font-mono text-sm placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
          <div className="flex items-center gap-2 mt-4">
            <Button onClick={handleImport} disabled={importing || !envText.trim()}>
              {importing ? 'Importing...' : 'Import Keys'}
            </Button>
            <Button variant="outline" onClick={() => setShowImport(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Add new key form */}
      {showAddForm && (
        <div className="bg-background border border-border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-foreground mb-4">Add New Key</h2>
          {saveError && <p className="text-error text-sm mb-3">{saveError}</p>}
          <div className="space-y-3">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) =>
                setNewKeyName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))
              }
              placeholder="KEY_NAME (e.g., OPENAI_API_KEY)"
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground text-sm font-mono placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              type="password"
              value={newKeyValue}
              onChange={(e) => setNewKeyValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddKey()}
              placeholder="Value"
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground text-sm font-mono placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Button
              onClick={handleAddKey}
              disabled={saving || !newKeyName.trim() || !newKeyValue.trim()}
            >
              {saving ? 'Saving...' : 'Save Key'}
            </Button>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Keys Table */}
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Key Name</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <>
                {[0, 1, 2].map((idx) => (
                  <TableRow key={`key-skeleton-${idx}`}>
                    <TableCell>
                      <div className="h-4 w-40 bg-surface-secondary rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-20 bg-surface-secondary rounded animate-pulse" />
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
            ) : keys.length === 0 ? (
              <TableEmpty
                colSpan={4}
                icon={
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon icon="key" size="lg" className="text-primary" />
                  </div>
                }
                title="No API keys yet"
                description="Add your AI provider API keys to enable agent functionality. Keys are encrypted and stored securely."
                action={
                  <Button onClick={() => setShowAddForm(true)}>
                    <Icon icon="plus" size="sm" className="mr-2" />
                    Add Your First Key
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
                      <span className="font-mono text-sm text-foreground">{key.keyName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-foreground-tertiary font-mono text-sm">
                      •••••••{key.keyHint}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-foreground-secondary text-sm">
                      {formatDate(key.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleDelete(key.keyName, key.id, e)}
                        disabled={deletingId === key.id}
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
