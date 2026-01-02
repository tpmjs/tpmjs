'use client';

import type { AIProvider } from '@tpmjs/types/agent';
import { PROVIDER_MODELS, SUPPORTED_PROVIDERS } from '@tpmjs/types/agent';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';

interface Agent {
  id: string;
  uid: string;
  name: string;
  description: string | null;
  provider: AIProvider;
  modelId: string;
  systemPrompt: string | null;
  temperature: number;
  maxToolCallsPerTurn: number;
  maxMessagesInContext: number;
  isPublic: boolean;
  toolCount: number;
  collectionCount: number;
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

export default function AgentDetailPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    uid: '',
    description: '',
    provider: 'OPENAI' as AIProvider,
    modelId: '',
    systemPrompt: '',
    temperature: 0.7,
    maxToolCallsPerTurn: 20,
    maxMessagesInContext: 10,
  });

  const fetchAgent = useCallback(async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}`);
      const data = await response.json();

      if (data.success) {
        setAgent(data.data);
        setFormData({
          name: data.data.name,
          uid: data.data.uid,
          description: data.data.description || '',
          provider: data.data.provider,
          modelId: data.data.modelId,
          systemPrompt: data.data.systemPrompt || '',
          temperature: data.data.temperature,
          maxToolCallsPerTurn: data.data.maxToolCallsPerTurn,
          maxMessagesInContext: data.data.maxMessagesInContext,
        });
      } else {
        if (response.status === 401) {
          router.push('/sign-in');
          return;
        }
        setError(data.error || 'Failed to fetch agent');
      }
    } catch (err) {
      console.error('Failed to fetch agent:', err);
      setError('Failed to fetch agent');
    } finally {
      setIsLoading(false);
    }
  }, [agentId, router]);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      // Reset model when provider changes
      if (name === 'provider') {
        const provider = value as AIProvider;
        const models = PROVIDER_MODELS[provider];
        newData.modelId = models?.[0]?.id || '';
      }

      return newData;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          temperature: Number.parseFloat(formData.temperature.toString()),
          maxToolCallsPerTurn: Number.parseInt(formData.maxToolCallsPerTurn.toString(), 10),
          maxMessagesInContext: Number.parseInt(formData.maxMessagesInContext.toString(), 10),
          description: formData.description || null,
          systemPrompt: formData.systemPrompt || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setAgent(result.data);
        setIsEditing(false);
      } else {
        throw new Error(result.error || 'Failed to update agent');
      }
    } catch (err) {
      console.error('Failed to update agent:', err);
      alert(err instanceof Error ? err.message : 'Failed to update agent');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        router.push('/dashboard/agents');
      } else {
        throw new Error(result.error || 'Failed to delete agent');
      }
    } catch (err) {
      console.error('Failed to delete agent:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete agent');
    }
  };

  const models = PROVIDER_MODELS[formData.provider] || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="max-w-4xl mx-auto py-12 px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-surface-secondary rounded w-48 mb-8" />
            <div className="h-64 bg-surface-secondary rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="max-w-4xl mx-auto py-12 px-4">
          <div className="text-center py-16">
            <Icon icon="alertCircle" size="lg" className="mx-auto text-error mb-4" />
            <h2 className="text-lg font-medium text-foreground mb-2">Error</h2>
            <p className="text-foreground-secondary mb-4">{error || 'Agent not found'}</p>
            <Link href="/dashboard/agents">
              <Button>Back to Agents</Button>
            </Link>
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/agents"
              className="text-foreground-secondary hover:text-foreground transition-colors"
            >
              <Icon icon="arrowLeft" size="sm" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon icon="terminal" size="sm" className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{agent.name}</h1>
                <p className="text-sm text-foreground-tertiary">
                  {PROVIDER_DISPLAY_NAMES[agent.provider]} / {agent.modelId}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/agents/${agent.id}/chat`}>
              <Button>
                <Icon icon="message" size="sm" className="mr-2" />
                Chat
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <div className="bg-background border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-foreground-secondary mb-1">
              <Icon icon="puzzle" size="xs" />
              <span className="text-sm">Tools</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{agent.toolCount}</p>
          </div>
          <div className="bg-background border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-foreground-secondary mb-1">
              <Icon icon="folder" size="xs" />
              <span className="text-sm">Collections</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{agent.collectionCount}</p>
          </div>
          <div className="bg-background border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-foreground-secondary mb-1">
              <Icon icon="terminal" size="xs" />
              <span className="text-sm">Max Tool Calls</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{agent.maxToolCallsPerTurn}</p>
          </div>
        </div>

        {/* API Endpoint */}
        <div className="bg-background border border-border rounded-lg p-4 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">API Endpoint</p>
              <code className="text-sm text-foreground-secondary font-mono">
                POST /api/agents/{agent.uid}/conversation/{'<conversation-id>'}
              </code>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/api/agents/${agent.uid}/conversation/<conversation-id>`
                );
              }}
            >
              <Icon icon="copy" size="xs" />
            </Button>
          </div>
        </div>

        {/* Configuration */}
        <div className="bg-background border border-border rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-foreground">Configuration</h2>
            {!isEditing && (
              <Button size="sm" variant="secondary" onClick={() => setIsEditing(true)}>
                <Icon icon="edit" size="xs" className="mr-1" />
                Edit
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
                <div>
                  <label htmlFor="uid" className="block text-sm font-medium text-foreground mb-1">
                    UID
                  </label>
                  <input
                    type="text"
                    id="uid"
                    name="uid"
                    value={formData.uid}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
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
                  rows={2}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="provider"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Provider
                  </label>
                  <select
                    id="provider"
                    name="provider"
                    value={formData.provider}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  >
                    {SUPPORTED_PROVIDERS.map((p) => (
                      <option key={p} value={p}>
                        {PROVIDER_DISPLAY_NAMES[p]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="modelId"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Model
                  </label>
                  <select
                    id="modelId"
                    name="modelId"
                    value={formData.modelId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  >
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
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
                  rows={6}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
                />
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
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: agent.name,
                      uid: agent.uid,
                      description: agent.description || '',
                      provider: agent.provider,
                      modelId: agent.modelId,
                      systemPrompt: agent.systemPrompt || '',
                      temperature: agent.temperature,
                      maxToolCallsPerTurn: agent.maxToolCallsPerTurn,
                      maxMessagesInContext: agent.maxMessagesInContext,
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-foreground-secondary">Description</dt>
                <dd className="text-foreground">{agent.description || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm text-foreground-secondary">UID</dt>
                <dd className="text-foreground font-mono text-sm">{agent.uid}</dd>
              </div>
              <div>
                <dt className="text-sm text-foreground-secondary">Temperature</dt>
                <dd className="text-foreground">{agent.temperature}</dd>
              </div>
              <div>
                <dt className="text-sm text-foreground-secondary">Context Messages</dt>
                <dd className="text-foreground">{agent.maxMessagesInContext}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm text-foreground-secondary">System Prompt</dt>
                <dd className="text-foreground font-mono text-sm whitespace-pre-wrap bg-surface-secondary rounded-lg p-3 mt-1">
                  {agent.systemPrompt || '(No system prompt)'}
                </dd>
              </div>
            </dl>
          )}
        </div>

        {/* Danger Zone */}
        <div className="bg-background border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="text-lg font-medium text-red-600 dark:text-red-400 mb-4">Danger Zone</h2>
          <p className="text-sm text-foreground-secondary mb-4">
            Once you delete an agent, there is no going back. Please be certain.
          </p>
          <Button variant="outline" onClick={handleDelete}>
            <Icon icon="trash" size="xs" className="mr-1" />
            Delete Agent
          </Button>
        </div>
      </div>
    </div>
  );
}
