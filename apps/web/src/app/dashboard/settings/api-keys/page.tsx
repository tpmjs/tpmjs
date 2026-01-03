'use client';

import type { AIProvider } from '@tpmjs/types/agent';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';

interface ApiKeyInfo {
  provider: string;
  keyHint: string | null;
  createdAt: string;
  updatedAt: string;
}

// Map env var names to provider codes
const ENV_VAR_MAP: Record<string, AIProvider> = {
  OPENAI_API_KEY: 'OPENAI',
  ANTHROPIC_API_KEY: 'ANTHROPIC',
  GOOGLE_API_KEY: 'GOOGLE',
  GOOGLE_GENERATIVE_AI_API_KEY: 'GOOGLE',
  GROQ_API_KEY: 'GROQ',
  MISTRAL_API_KEY: 'MISTRAL',
};

export default function ApiKeysPage(): React.ReactElement {
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [envText, setEnvText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: number; failed: number } | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const fetchApiKeys = useCallback(async () => {
    try {
      const response = await fetch('/api/user/api-keys');
      const data = await response.json();

      if (data.success) {
        setApiKeys(data.data);
      } else {
        if (response.status === 401) {
          router.push('/sign-in');
          return;
        }
        setError(data.error || 'Failed to fetch API keys');
      }
    } catch (err) {
      console.error('Failed to fetch API keys:', err);
      setError('Failed to fetch API keys');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const parseAndSave = useCallback(async () => {
    const lines = envText.split('\n');
    const keysToSave: { provider: AIProvider; apiKey: string }[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const match = trimmed.match(/^([A-Z_]+)\s*=\s*["']?([^"'\n]+)["']?$/);
      if (match) {
        const [, envVar, value] = match;
        if (!envVar || !value) continue;
        const provider = ENV_VAR_MAP[envVar];
        if (provider) {
          keysToSave.push({ provider, apiKey: value.trim() });
        }
      }
    }

    if (keysToSave.length === 0) {
      setSaveResult({ success: 0, failed: 0 });
      return;
    }

    setIsSaving(true);
    let success = 0;
    let failed = 0;

    for (const { provider, apiKey } of keysToSave) {
      try {
        const response = await fetch('/api/user/api-keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, apiKey }),
        });
        const result = await response.json();
        if (result.success) {
          success++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    setSaveResult({ success, failed });
    setIsSaving(false);
    setEnvText('');
    fetchApiKeys();

    setTimeout(() => setSaveResult(null), 3000);
  }, [envText, fetchApiKeys]);

  const handleDelete = useCallback(
    async (provider: string) => {
      if (!confirm(`Delete this API key?`)) return;

      setDeletingKey(provider);
      try {
        const response = await fetch(`/api/user/api-keys/${provider}`, {
          method: 'DELETE',
        });
        const result = await response.json();
        if (result.success) {
          setApiKeys((prev) => prev.filter((k) => k.provider !== provider));
        }
      } catch (err) {
        console.error('Failed to delete:', err);
      } finally {
        setDeletingKey(null);
      }
    },
    []
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="max-w-2xl mx-auto py-12 px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-surface-secondary rounded w-32" />
            <div className="h-32 bg-surface-secondary rounded" />
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
          <Button onClick={fetchApiKeys}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="text-foreground-secondary hover:text-foreground">
            <Icon icon="arrowLeft" size="sm" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">API Keys</h1>
        </div>

        {/* Paste .env */}
        <div className="mb-8">
          <textarea
            value={envText}
            onChange={(e) => setEnvText(e.target.value)}
            placeholder="Paste your .env file or API keys here...

OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
GROQ_API_KEY=gsk_...
MISTRAL_API_KEY=..."
            rows={6}
            className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-lg text-foreground font-mono text-sm placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
          <div className="mt-3 flex items-center gap-3">
            <Button onClick={parseAndSave} disabled={isSaving || !envText.trim()}>
              {isSaving ? 'Saving...' : 'Save Keys'}
            </Button>
            {saveResult && (
              <span className="text-sm text-foreground-secondary">
                {saveResult.success > 0 && (
                  <span className="text-green-500">{saveResult.success} saved</span>
                )}
                {saveResult.failed > 0 && (
                  <span className="text-red-500 ml-2">{saveResult.failed} failed</span>
                )}
                {saveResult.success === 0 && saveResult.failed === 0 && (
                  <span>No recognized keys found</span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Stored keys */}
        {apiKeys.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-foreground-secondary mb-3">Stored Keys</h2>
            <div className="space-y-2">
              {apiKeys.map((key) => (
                <div
                  key={key.provider}
                  className="flex items-center justify-between px-4 py-3 bg-surface-secondary border border-border rounded-lg"
                >
                  <div>
                    <span className="font-medium text-foreground">{key.provider}</span>
                    <span className="text-foreground-tertiary ml-2 text-sm">
                      ...{key.keyHint}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(key.provider)}
                    disabled={deletingKey === key.provider}
                    className="text-foreground-tertiary hover:text-red-500 disabled:opacity-50"
                  >
                    <Icon icon="trash" size="sm" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {apiKeys.length === 0 && (
          <p className="text-center text-foreground-tertiary py-8">
            No API keys stored yet. Paste your .env above to add keys.
          </p>
        )}
      </div>
    </div>
  );
}
