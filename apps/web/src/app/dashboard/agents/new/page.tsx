'use client';

import type { AIProvider } from '@tpmjs/types/agent';
import { PROVIDER_MODELS, SUPPORTED_PROVIDERS } from '@tpmjs/types/agent';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AppHeader } from '~/components/AppHeader';

const PROVIDER_DISPLAY_NAMES: Record<AIProvider, string> = {
  OPENAI: 'OpenAI',
  ANTHROPIC: 'Anthropic',
  GOOGLE: 'Google',
  GROQ: 'Groq',
  MISTRAL: 'Mistral',
};

interface FormData {
  name: string;
  uid: string;
  description: string;
  provider: AIProvider;
  modelId: string;
  systemPrompt: string;
  temperature: number;
  maxToolCallsPerTurn: number;
  maxMessagesInContext: number;
}

export default function NewAgentPage(): React.ReactElement {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    uid: '',
    description: '',
    provider: 'OPENAI',
    modelId: 'gpt-4o',
    systemPrompt: '',
    temperature: 0.7,
    maxToolCallsPerTurn: 20,
    maxMessagesInContext: 10,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      // Auto-generate uid from name if uid is empty or was auto-generated
      if (name === 'name' && (!prev.uid || prev.uid === generateUid(prev.name))) {
        newData.uid = generateUid(value);
      }

      // Reset model when provider changes
      if (name === 'provider') {
        const provider = value as AIProvider;
        const models = PROVIDER_MODELS[provider];
        newData.modelId = models?.[0]?.id || '';
      }

      return newData;
    });
  };

  const generateUid = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          temperature: Number.parseFloat(formData.temperature.toString()),
          maxToolCallsPerTurn: Number.parseInt(formData.maxToolCallsPerTurn.toString(), 10),
          maxMessagesInContext: Number.parseInt(formData.maxMessagesInContext.toString(), 10),
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/dashboard/agents/${result.data.id}`);
      } else {
        throw new Error(result.error || 'Failed to create agent');
      }
    } catch (err) {
      console.error('Failed to create agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to create agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const models = PROVIDER_MODELS[formData.provider] || [];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="max-w-3xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard/agents"
            className="text-foreground-secondary hover:text-foreground transition-colors"
          >
            <Icon icon="arrowLeft" size="sm" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Create New Agent</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="bg-background border border-border rounded-lg p-6">
            <h2 className="text-lg font-medium text-foreground mb-4">Basic Information</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  placeholder="My AI Agent"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="uid" className="block text-sm font-medium text-foreground mb-1">
                  UID (URL-friendly identifier)
                </label>
                <input
                  type="text"
                  id="uid"
                  name="uid"
                  value={formData.uid}
                  onChange={handleChange}
                  maxLength={50}
                  pattern="[a-z0-9-]+"
                  placeholder="my-ai-agent"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary font-mono text-sm"
                />
                <p className="text-xs text-foreground-tertiary mt-1">
                  Used in API URLs. Lowercase letters, numbers, and hyphens only.
                </p>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  maxLength={500}
                  rows={2}
                  placeholder="What does this agent do?"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
                />
              </div>
            </div>
          </div>

          {/* Model Configuration */}
          <div className="bg-background border border-border rounded-lg p-6">
            <h2 className="text-lg font-medium text-foreground mb-4">Model Configuration</h2>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="provider"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Provider *
                  </label>
                  <select
                    id="provider"
                    name="provider"
                    value={formData.provider}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  >
                    {SUPPORTED_PROVIDERS.map((provider) => (
                      <option key={provider} value={provider}>
                        {PROVIDER_DISPLAY_NAMES[provider]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="modelId"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Model *
                  </label>
                  <select
                    id="modelId"
                    name="modelId"
                    value={formData.modelId}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  >
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="systemPrompt"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  System Prompt
                </label>
                <textarea
                  id="systemPrompt"
                  name="systemPrompt"
                  value={formData.systemPrompt}
                  onChange={handleChange}
                  maxLength={10000}
                  rows={6}
                  placeholder="You are a helpful assistant that..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none font-mono text-sm"
                />
                <p className="text-xs text-foreground-tertiary mt-1">
                  Instructions that define how the agent behaves.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="temperature"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Temperature
                  </label>
                  <input
                    type="number"
                    id="temperature"
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleChange}
                    min={0}
                    max={2}
                    step={0.1}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                  <p className="text-xs text-foreground-tertiary mt-1">
                    0 = deterministic, 2 = creative
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="maxToolCallsPerTurn"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Max Tool Calls
                  </label>
                  <input
                    type="number"
                    id="maxToolCallsPerTurn"
                    name="maxToolCallsPerTurn"
                    value={formData.maxToolCallsPerTurn}
                    onChange={handleChange}
                    min={1}
                    max={100}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                  <p className="text-xs text-foreground-tertiary mt-1">Per response turn</p>
                </div>

                <div>
                  <label
                    htmlFor="maxMessagesInContext"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Context Messages
                  </label>
                  <input
                    type="number"
                    id="maxMessagesInContext"
                    name="maxMessagesInContext"
                    value={formData.maxMessagesInContext}
                    onChange={handleChange}
                    min={1}
                    max={100}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                  <p className="text-xs text-foreground-tertiary mt-1">
                    Recent messages to include
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Note about tools */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Icon icon="info" size="sm" className="text-primary mt-0.5" />
              <div className="text-sm">
                <p className="text-foreground">
                  You can add tools and collections to your agent after creating it.
                </p>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Icon
                  icon="alertCircle"
                  size="sm"
                  className="text-red-600 dark:text-red-400 mt-0.5"
                />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Link href="/dashboard/agents">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Agent'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
