'use client';

import type { AIProvider } from '@tpmjs/types/agent';
import { SUPPORTED_PROVIDERS } from '@tpmjs/types/agent';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';

interface ApiKeyInfo {
  provider: AIProvider;
  keyHint: string | null;
  createdAt: string;
  updatedAt: string;
}

const PROVIDER_NAMES: Record<AIProvider, string> = {
  OPENAI: 'OpenAI',
  ANTHROPIC: 'Anthropic',
  GOOGLE: 'Google',
  GROQ: 'Groq',
  MISTRAL: 'Mistral',
};

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

  // Individual key inputs
  const [keyInputs, setKeyInputs] = useState<Record<AIProvider, string>>({
    OPENAI: '',
    ANTHROPIC: '',
    GOOGLE: '',
    GROQ: '',
    MISTRAL: '',
  });
  const [savingProvider, setSavingProvider] = useState<AIProvider | null>(null);
  const [savedProvider, setSavedProvider] = useState<AIProvider | null>(null);
  const [deletingProvider, setDeletingProvider] = useState<AIProvider | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // .env import
  const [showEnvImport, setShowEnvImport] = useState(false);
  const [envText, setEnvText] = useState('');
  const [importing, setImporting] = useState(false);

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

  const saveKey = useCallback(async (provider: AIProvider, apiKey: string) => {
    setSavingProvider(provider);
    setSavedProvider(null);
    setSaveError(null);

    try {
      console.log('[saveKey] Saving key for provider:', provider, 'key length:', apiKey.length);
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey }),
      });

      const result = await response.json();
      console.log('[saveKey] Response:', result);

      if (result.success) {
        setApiKeys((prev) => {
          const idx = prev.findIndex((k) => k.provider === provider);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = result.data;
            return updated;
          }
          return [...prev, result.data];
        });
        setKeyInputs((prev) => ({ ...prev, [provider]: '' }));
        setSavedProvider(provider);
        setTimeout(() => setSavedProvider(null), 2000);
        return true;
      } else {
        console.error('[saveKey] Error:', result.error);
        setSaveError(result.error || 'Failed to save');
        return false;
      }
    } catch (err) {
      console.error('[saveKey] Network error:', err);
      setSaveError('Network error');
      return false;
    } finally {
      setSavingProvider(null);
    }
  }, []);

  const handleSave = useCallback((provider: AIProvider) => {
    const value = keyInputs[provider]?.trim();
    if (value) {
      saveKey(provider, value);
    }
  }, [keyInputs, saveKey]);

  const handleDelete = useCallback(async (provider: AIProvider) => {
    if (!confirm(`Delete ${PROVIDER_NAMES[provider]} API key?`)) return;

    setDeletingProvider(provider);
    try {
      const response = await fetch(`/api/user/api-keys/${provider}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        setApiKeys((prev) => prev.filter((k) => k.provider !== provider));
      }
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setDeletingProvider(null);
    }
  }, []);

  const handleEnvImport = useCallback(async () => {
    const lines = envText.split('\n');
    const keysToSave: { provider: AIProvider; apiKey: string }[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(/^([A-Z_]+)\s*=\s*["']?([^"'\n]+)["']?$/);
      if (match) {
        const [, envVar, value] = match;
        if (envVar && value) {
          const provider = ENV_VAR_MAP[envVar];
          if (provider) {
            keysToSave.push({ provider, apiKey: value.trim() });
          }
        }
      }
    }

    if (keysToSave.length === 0) return;

    setImporting(true);
    for (const { provider, apiKey } of keysToSave) {
      await saveKey(provider, apiKey);
    }
    setImporting(false);
    setEnvText('');
    setShowEnvImport(false);
  }, [envText, saveKey]);

  const hasKey = (provider: AIProvider) => apiKeys.some((k) => k.provider === provider);
  const getKeyHint = (provider: AIProvider) => apiKeys.find((k) => k.provider === provider)?.keyHint;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="max-w-2xl mx-auto py-12 px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-surface-secondary rounded w-32" />
            <div className="h-16 bg-surface-secondary rounded" />
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
          <Button onClick={fetchApiKeys}>Retry</Button>
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
            <h1 className="text-2xl font-bold text-foreground">API Keys</h1>
          </div>
          <button
            type="button"
            onClick={() => setShowEnvImport(!showEnvImport)}
            className="text-sm text-primary hover:underline"
          >
            {showEnvImport ? 'Hide' : 'Import from .env'}
          </button>
        </div>

        {/* .env Import */}
        {showEnvImport && (
          <div className="mb-6 p-4 bg-surface-secondary border border-border rounded-lg">
            <textarea
              value={envText}
              onChange={(e) => setEnvText(e.target.value)}
              placeholder="OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-..."
              rows={4}
              className="w-full px-3 py-2 bg-background border border-border rounded text-foreground font-mono text-sm placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
            <Button
              size="sm"
              onClick={handleEnvImport}
              disabled={importing || !envText.trim()}
              className="mt-2"
            >
              {importing ? 'Importing...' : 'Import Keys'}
            </Button>
          </div>
        )}

        {/* Error message */}
        {saveError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
            {saveError}
          </div>
        )}

        {/* Provider list */}
        <div className="space-y-3">
          {SUPPORTED_PROVIDERS.map((provider) => {
            const configured = hasKey(provider);
            const hint = getKeyHint(provider);
            const isSaving = savingProvider === provider;
            const isSaved = savedProvider === provider;
            const isDeleting = deletingProvider === provider;
            const inputValue = keyInputs[provider] || '';

            return (
              <div
                key={provider}
                className="p-4 bg-surface-secondary border border-border rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{PROVIDER_NAMES[provider]}</span>
                    {configured && (
                      <span className="text-xs text-foreground-tertiary">...{hint}</span>
                    )}
                  </div>
                  {configured && (
                    <button
                      type="button"
                      onClick={() => handleDelete(provider)}
                      disabled={isDeleting}
                      className="text-foreground-tertiary hover:text-red-500 disabled:opacity-50"
                    >
                      <Icon icon="trash" size="xs" />
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={inputValue}
                    onChange={(e) => setKeyInputs((prev) => ({ ...prev, [provider]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave(provider)}
                    placeholder={configured ? 'Enter new key to update...' : 'Paste API key...'}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded text-foreground text-sm font-mono placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSave(provider)}
                    disabled={isSaving || !inputValue.trim()}
                  >
                    {isSaving ? (
                      <Icon icon="loader" size="xs" className="animate-spin" />
                    ) : isSaved ? (
                      <Icon icon="check" size="xs" />
                    ) : (
                      'Save'
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
