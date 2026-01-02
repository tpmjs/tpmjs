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

export default function ApiKeysPage(): React.ReactElement {
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingProvider, setAddingProvider] = useState<AIProvider | null>(null);
  const [newApiKey, setNewApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingProvider, setDeletingProvider] = useState<AIProvider | null>(null);

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

  const handleAddKey = async (provider: AIProvider) => {
    if (!newApiKey.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey: newApiKey }),
      });

      const result = await response.json();

      if (result.success) {
        // Update or add the key in state
        setApiKeys((prev) => {
          const existing = prev.findIndex((k) => k.provider === provider);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = result.data;
            return updated;
          }
          return [...prev, result.data];
        });
        setAddingProvider(null);
        setNewApiKey('');
      } else {
        throw new Error(result.error || 'Failed to save API key');
      }
    } catch (err) {
      console.error('Failed to save API key:', err);
      alert(err instanceof Error ? err.message : 'Failed to save API key');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteKey = async (provider: AIProvider) => {
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
  };

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

        {/* Info Box */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <Icon icon="info" size="sm" className="text-primary mt-0.5" />
            <div className="text-sm">
              <p className="text-foreground">
                Your API keys are encrypted and stored securely. They are used to make calls to AI
                providers when running your agents.
              </p>
            </div>
          </div>
        </div>

        {/* Provider Cards */}
        <div className="space-y-4">
          {SUPPORTED_PROVIDERS.map((provider) => {
            const keyInfo = getKeyInfo(provider);
            const isAdding = addingProvider === provider;
            const isDeleting = deletingProvider === provider;

            return (
              <div key={provider} className="bg-background border border-border rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium text-foreground">
                        {PROVIDER_DISPLAY_NAMES[provider]}
                      </h3>
                      {hasKey(provider) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Configured
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground-secondary mt-1">
                      {PROVIDER_DESCRIPTIONS[provider]}
                    </p>
                    {keyInfo && (
                      <p className="text-xs text-foreground-tertiary mt-2">
                        Key ending in <span className="font-mono">{keyInfo.keyHint}</span>
                      </p>
                    )}
                  </div>

                  {!isAdding && (
                    <div className="flex items-center gap-2">
                      {hasKey(provider) ? (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setAddingProvider(provider)}
                          >
                            Update
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteKey(provider)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" onClick={() => setAddingProvider(provider)}>
                          Add Key
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Add/Update Form */}
                {isAdding && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <label
                      htmlFor={`api-key-${provider}`}
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      {hasKey(provider) ? 'New' : ''} API Key
                    </label>
                    <div className="flex gap-2">
                      <input
                        id={`api-key-${provider}`}
                        type="password"
                        value={newApiKey}
                        onChange={(e) => setNewApiKey(e.target.value)}
                        placeholder={`Enter your ${PROVIDER_DISPLAY_NAMES[provider]} API key`}
                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        autoFocus
                      />
                      <Button
                        onClick={() => handleAddKey(provider)}
                        disabled={isSaving || !newApiKey.trim()}
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setAddingProvider(null);
                          setNewApiKey('');
                        }}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                    </div>
                    <p className="text-xs text-foreground-tertiary mt-2">
                      Get your API key from{' '}
                      {provider === 'OPENAI' && (
                        <a
                          href="https://platform.openai.com/api-keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          platform.openai.com
                        </a>
                      )}
                      {provider === 'ANTHROPIC' && (
                        <a
                          href="https://console.anthropic.com/settings/keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          console.anthropic.com
                        </a>
                      )}
                      {provider === 'GOOGLE' && (
                        <a
                          href="https://aistudio.google.com/apikey"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          aistudio.google.com
                        </a>
                      )}
                      {provider === 'GROQ' && (
                        <a
                          href="https://console.groq.com/keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          console.groq.com
                        </a>
                      )}
                      {provider === 'MISTRAL' && (
                        <a
                          href="https://console.mistral.ai/api-keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          console.mistral.ai
                        </a>
                      )}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
