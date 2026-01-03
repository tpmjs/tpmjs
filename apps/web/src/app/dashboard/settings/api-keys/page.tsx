'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';

interface ApiKeyInfo {
  id: string;
  keyName: string;
  keyHint: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ApiKeysPage(): React.ReactElement {
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add new key form
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
      fetchKeys();
    } else {
      setSaveError(result.error || 'Failed to save');
    }

    setSaving(false);
  }, [newKeyName, newKeyValue, saveKey, fetchKeys]);

  const handleDelete = useCallback(async (keyName: string, id: string) => {
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="max-w-2xl mx-auto py-12 px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-surface-secondary rounded w-32" />
            <div className="h-16 bg-surface-secondary rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="max-w-2xl mx-auto py-12 px-4 text-center">
          <p className="text-error mb-4">{error}</p>
          <Button onClick={fetchKeys}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-foreground-secondary hover:text-foreground">
              <Icon icon="arrowLeft" size="sm" />
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Environment Variables</h1>
          </div>
          <button
            type="button"
            onClick={() => setShowImport(!showImport)}
            className="text-sm text-primary hover:underline"
          >
            {showImport ? 'Hide' : 'Import .env'}
          </button>
        </div>

        {/* Import from .env */}
        {showImport && (
          <div className="mb-6 p-4 bg-surface-secondary border border-border rounded-lg">
            <textarea
              value={envText}
              onChange={(e) => setEnvText(e.target.value)}
              placeholder="Paste .env content here...
MY_API_KEY=abc123
ANOTHER_SECRET=xyz789"
              rows={5}
              className="w-full px-3 py-2 bg-background border border-border rounded text-foreground font-mono text-sm placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
            <Button
              size="sm"
              onClick={handleImport}
              disabled={importing || !envText.trim()}
              className="mt-2"
            >
              {importing ? 'Importing...' : 'Import'}
            </Button>
          </div>
        )}

        {/* Add new key */}
        <div className="mb-6 p-4 bg-surface-secondary border border-border rounded-lg">
          <h2 className="text-sm font-medium text-foreground mb-3">Add New Key</h2>
          {saveError && (
            <p className="text-red-500 text-sm mb-2">{saveError}</p>
          )}
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
              placeholder="KEY_NAME"
              className="flex-1 px-3 py-2 bg-background border border-border rounded text-foreground text-sm font-mono placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="password"
              value={newKeyValue}
              onChange={(e) => setNewKeyValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddKey()}
              placeholder="Value"
              className="flex-1 px-3 py-2 bg-background border border-border rounded text-foreground text-sm font-mono placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Button onClick={handleAddKey} disabled={saving || !newKeyName.trim() || !newKeyValue.trim()}>
              {saving ? 'Saving...' : 'Add'}
            </Button>
          </div>
        </div>

        {/* Keys list */}
        {keys.length > 0 ? (
          <div className="space-y-2">
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between px-4 py-3 bg-surface-secondary border border-border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-foreground">{key.keyName}</span>
                  <span className="text-xs text-foreground-tertiary">...{key.keyHint}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(key.keyName, key.id)}
                  disabled={deletingId === key.id}
                  className="text-foreground-tertiary hover:text-red-500 disabled:opacity-50"
                >
                  <Icon icon="trash" size="sm" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-foreground-tertiary py-8">
            No environment variables stored yet.
          </p>
        )}
      </div>
    </div>
  );
}
