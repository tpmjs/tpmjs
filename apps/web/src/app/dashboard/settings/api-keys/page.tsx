'use client';

import type { AIProvider } from '@tpmjs/types/agent';
import { SUPPORTED_PROVIDERS } from '@tpmjs/types/agent';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';

interface ApiKeyInfo {
  provider: AIProvider;
  keyHint: string | null;
  createdAt: string;
  updatedAt: string;
}

const PROVIDER_DISPLAY_NAMES: Record<AIProvider, string> = {
  OPENAI: 'OpenAI',
  ANTHROPIC: 'Anthropic',
  GOOGLE: 'Google',
  GROQ: 'Groq',
  MISTRAL: 'Mistral',
};

const PROVIDER_DESCRIPTIONS: Record<AIProvider, string> = {
  OPENAI: 'GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo',
  ANTHROPIC: 'Claude 3.5 Sonnet, Claude 3 Opus, Claude 3.5 Haiku',
  GOOGLE: 'Gemini 2.0 Flash, Gemini 1.5 Pro, Gemini 1.5 Flash',
  GROQ: 'Llama 3.3 70B, Llama 3.1 8B, Mixtral 8x7B',
  MISTRAL: 'Mistral Large, Mistral Small',
};

const PROVIDER_LINKS: Record<AIProvider, { url: string; label: string }> = {
  OPENAI: { url: 'https://platform.openai.com/api-keys', label: 'platform.openai.com' },
  ANTHROPIC: { url: 'https://console.anthropic.com/settings/keys', label: 'console.anthropic.com' },
  GOOGLE: { url: 'https://aistudio.google.com/apikey', label: 'aistudio.google.com' },
  GROQ: { url: 'https://console.groq.com/keys', label: 'console.groq.com' },
  MISTRAL: { url: 'https://console.mistral.ai/api-keys', label: 'console.mistral.ai' },
};

// Map common env var names to our provider enum
const ENV_VAR_TO_PROVIDER: Record<string, AIProvider> = {
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

  // Per-provider input state
  const [keyInputs, setKeyInputs] = useState<Record<AIProvider, string>>({
    OPENAI: '',
    ANTHROPIC: '',
    GOOGLE: '',
    GROQ: '',
    MISTRAL: '',
  });
  const [savingProviders, setSavingProviders] = useState<Set<AIProvider>>(new Set());
  const [savedProviders, setSavedProviders] = useState<Set<AIProvider>>(new Set());
  const [deletingProvider, setDeletingProvider] = useState<AIProvider | null>(null);

  // .env paste state
  const [envText, setEnvText] = useState('');
  const [parsedKeys, setParsedKeys] = useState<{ provider: AIProvider; key: string }[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'done'>('idle');
  const [importResults, setImportResults] = useState<
    { provider: AIProvider; success: boolean; error?: string }[]
  >([]);

  // Auto-save debounce refs
  const saveTimeoutRefs = useRef<Record<AIProvider, NodeJS.Timeout | null>>({
    OPENAI: null,
    ANTHROPIC: null,
    GOOGLE: null,
    GROQ: null,
    MISTRAL: null,
  });

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

  // Parse .env content
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Simple env parsing with multiple conditionals
  const parseEnvContent = useCallback((text: string) => {
    const lines = text.split('\n');
    const keys: { provider: AIProvider; key: string }[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      // Handle KEY=VALUE format (with optional quotes)
      const match = trimmed.match(/^([A-Z_]+)\s*=\s*["']?([^"'\s]+)["']?$/);
      if (match) {
        const envVar = match[1];
        const value = match[2];
        if (!envVar || !value) continue;
        const provider = ENV_VAR_TO_PROVIDER[envVar];
        if (provider) {
          // Check if this provider is already in our list
          const existingIndex = keys.findIndex((k) => k.provider === provider);
          if (existingIndex >= 0) {
            keys[existingIndex] = { provider, key: value };
          } else {
            keys.push({ provider, key: value });
          }
        }
      }
    }

    return keys;
  }, []);

  // Update parsed keys when env text changes
  useEffect(() => {
    const keys = parseEnvContent(envText);
    setParsedKeys(keys);
  }, [envText, parseEnvContent]);

  // Save a single key
  const saveKey = useCallback(async (provider: AIProvider, apiKey: string) => {
    setSavingProviders((prev) => new Set(prev).add(provider));
    setSavedProviders((prev) => {
      const next = new Set(prev);
      next.delete(provider);
      return next;
    });

    try {
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey }),
      });

      const result = await response.json();

      if (result.success) {
        setApiKeys((prev) => {
          const existing = prev.findIndex((k) => k.provider === provider);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = result.data;
            return updated;
          }
          return [...prev, result.data];
        });
        setSavedProviders((prev) => new Set(prev).add(provider));
        // Clear input after successful save
        setKeyInputs((prev) => ({ ...prev, [provider]: '' }));
        // Clear saved indicator after 2 seconds
        setTimeout(() => {
          setSavedProviders((prev) => {
            const next = new Set(prev);
            next.delete(provider);
            return next;
          });
        }, 2000);
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (err) {
      console.error('Failed to save API key:', err);
      return { success: false, error: 'Network error' };
    } finally {
      setSavingProviders((prev) => {
        const next = new Set(prev);
        next.delete(provider);
        return next;
      });
    }
  }, []);

  // Handle input change with debounced auto-save
  const handleKeyInputChange = useCallback(
    (provider: AIProvider, value: string) => {
      setKeyInputs((prev) => ({ ...prev, [provider]: value }));

      // Clear existing timeout
      const existingTimeout = saveTimeoutRefs.current[provider];
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout for auto-save (1.5 seconds after typing stops)
      if (value.trim()) {
        saveTimeoutRefs.current[provider] = setTimeout(() => {
          saveKey(provider, value.trim());
        }, 1500);
      }
    },
    [saveKey]
  );

  // Handle blur - save immediately
  const handleKeyInputBlur = useCallback(
    (provider: AIProvider) => {
      const value = keyInputs[provider].trim();
      if (value) {
        // Clear any pending timeout
        const pendingTimeout = saveTimeoutRefs.current[provider];
        if (pendingTimeout) {
          clearTimeout(pendingTimeout);
          saveTimeoutRefs.current[provider] = null;
        }
        saveKey(provider, value);
      }
    },
    [keyInputs, saveKey]
  );

  // Import all parsed keys
  const handleImportAll = useCallback(async () => {
    if (parsedKeys.length === 0) return;

    setImportStatus('importing');
    setImportResults([]);

    const results: { provider: AIProvider; success: boolean; error?: string }[] = [];

    for (const { provider, key } of parsedKeys) {
      const result = await saveKey(provider, key);
      results.push({
        provider,
        success: result.success,
        error: result.success ? undefined : result.error,
      });
    }

    setImportResults(results);
    setImportStatus('done');
    setEnvText('');
    setParsedKeys([]);

    // Clear results after 3 seconds
    setTimeout(() => {
      setImportResults([]);
      setImportStatus('idle');
    }, 3000);
  }, [parsedKeys, saveKey]);

  const handleDeleteKey = useCallback(async (provider: AIProvider) => {
    if (
      !confirm(`Are you sure you want to delete your ${PROVIDER_DISPLAY_NAMES[provider]} API key?`)
    ) {
      return;
    }

    setDeletingProvider(provider);
    try {
      const response = await fetch(`/api/user/api-keys/${provider}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setApiKeys((prev) => prev.filter((k) => k.provider !== provider));
      } else {
        throw new Error(result.error || 'Failed to delete API key');
      }
    } catch (err) {
      console.error('Failed to delete API key:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete API key');
    } finally {
      setDeletingProvider(null);
    }
  }, []);

  const hasKey = (provider: AIProvider) => apiKeys.some((k) => k.provider === provider);
  const getKeyInfo = (provider: AIProvider) => apiKeys.find((k) => k.provider === provider);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="max-w-4xl mx-auto py-12 px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-surface-secondary rounded w-48 mb-8" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-surface-secondary rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="max-w-4xl mx-auto py-12 px-4">
          <div className="text-center py-16">
            <Icon icon="alertCircle" size="lg" className="mx-auto text-error mb-4" />
            <h2 className="text-lg font-medium text-foreground mb-2">Error</h2>
            <p className="text-foreground-secondary mb-4">{error}</p>
            <Button onClick={fetchApiKeys}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="max-w-4xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard"
            className="text-foreground-secondary hover:text-foreground transition-colors"
          >
            <Icon icon="arrowLeft" size="sm" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">API Keys</h1>
            <p className="text-foreground-secondary mt-1">
              Manage your AI provider API keys for agents
            </p>
          </div>
        </div>

        {/* Quick Import Section */}
        <div className="bg-surface-secondary border border-border rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium text-foreground mb-2">Quick Import</h2>
          <p className="text-sm text-foreground-secondary mb-4">
            Paste your .env file or environment variables below to import multiple keys at once.
          </p>

          <textarea
            value={envText}
            onChange={(e) => setEnvText(e.target.value)}
            placeholder={`OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
GROQ_API_KEY=gsk_...
MISTRAL_API_KEY=...`}
            rows={5}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground font-mono text-sm placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
          />

          {/* Parsed keys preview */}
          {parsedKeys.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-foreground-secondary">Detected:</span>
              {parsedKeys.map(({ provider }) => (
                <span
                  key={provider}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary"
                >
                  {PROVIDER_DISPLAY_NAMES[provider]}
                </span>
              ))}
              <Button
                size="sm"
                onClick={handleImportAll}
                disabled={importStatus === 'importing'}
                className="ml-auto"
              >
                {importStatus === 'importing' ? (
                  <>
                    <Icon icon="loader" size="xs" className="animate-spin mr-1" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Icon icon="plus" size="xs" className="mr-1" />
                    Import {parsedKeys.length} key{parsedKeys.length > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Import results */}
          {importResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {importResults.map(({ provider, success, error: err }) => (
                <div
                  key={provider}
                  className={`flex items-center gap-2 text-sm ${
                    success
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  <Icon icon={success ? 'check' : 'x'} size="xs" />
                  <span>
                    {PROVIDER_DISPLAY_NAMES[provider]}: {success ? 'Saved' : err || 'Failed'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <Icon icon="info" size="sm" className="text-primary mt-0.5" />
            <div className="text-sm">
              <p className="text-foreground">
                Your API keys are encrypted and stored securely. Keys auto-save when you stop typing
                or leave the field.
              </p>
            </div>
          </div>
        </div>

        {/* Provider Rows */}
        <div className="space-y-3">
          {SUPPORTED_PROVIDERS.map((provider) => {
            const keyInfo = getKeyInfo(provider);
            const isSaving = savingProviders.has(provider);
            const isSaved = savedProviders.has(provider);
            const isDeleting = deletingProvider === provider;
            const link = PROVIDER_LINKS[provider];

            return (
              <div
                key={provider}
                className="bg-background border border-border rounded-lg p-4 flex items-center gap-4"
              >
                {/* Provider info */}
                <div className="flex-shrink-0 w-32">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {PROVIDER_DISPLAY_NAMES[provider]}
                    </span>
                    {hasKey(provider) && (
                      <span className="w-2 h-2 rounded-full bg-green-500" title="Configured" />
                    )}
                  </div>
                  <p className="text-xs text-foreground-tertiary mt-0.5">
                    {keyInfo ? `...${keyInfo.keyHint}` : 'Not set'}
                  </p>
                </div>

                {/* Input */}
                <div className="flex-1 relative">
                  <input
                    type="password"
                    value={keyInputs[provider]}
                    onChange={(e) => handleKeyInputChange(provider, e.target.value)}
                    onBlur={() => handleKeyInputBlur(provider)}
                    placeholder={
                      hasKey(provider) ? 'Enter new key to update...' : 'Paste API key...'
                    }
                    className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-lg text-foreground text-sm placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary font-mono"
                  />
                  {/* Status indicator */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isSaving && (
                      <Icon
                        icon="loader"
                        size="xs"
                        className="animate-spin text-foreground-tertiary"
                      />
                    )}
                    {isSaved && !isSaving && (
                      <Icon icon="check" size="xs" className="text-green-500" />
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline whitespace-nowrap"
                  >
                    Get key →
                  </a>
                  {hasKey(provider) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteKey(provider)}
                      disabled={isDeleting}
                      className="p-1 text-foreground-tertiary hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Delete key"
                    >
                      <Icon icon="trash" size="xs" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Models reference */}
        <div className="mt-8 pt-8 border-t border-border">
          <h3 className="text-sm font-medium text-foreground mb-4">Supported Models</h3>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            {SUPPORTED_PROVIDERS.map((provider) => (
              <div key={provider} className="flex gap-2">
                <span className="font-medium text-foreground-secondary w-24">
                  {PROVIDER_DISPLAY_NAMES[provider]}:
                </span>
                <span className="text-foreground-tertiary">{PROVIDER_DESCRIPTIONS[provider]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
