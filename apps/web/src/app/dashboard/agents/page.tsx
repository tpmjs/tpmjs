'use client';

import type { AIProvider } from '@tpmjs/types/agent';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';

interface Agent {
  id: string;
  uid: string;
  name: string;
  description: string | null;
  provider: AIProvider;
  modelId: string;
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

export default function AgentsPage(): React.ReactElement {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      const response = await fetch('/api/agents');
      const data = await response.json();

      if (data.success) {
        setAgents(data.data);
      } else {
        if (response.status === 401) {
          router.push('/sign-in');
          return;
        }
        setError(data.error || 'Failed to fetch agents');
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err);
      setError('Failed to fetch agents');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/agents/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setAgents((prev) => prev.filter((a) => a.id !== id));
      } else {
        throw new Error(result.error || 'Failed to delete agent');
      }
    } catch (err) {
      console.error('Failed to delete agent:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete agent');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="max-w-6xl mx-auto py-12 px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-surface-secondary rounded w-48 mb-8" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-surface-secondary rounded-lg" />
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
        <div className="max-w-6xl mx-auto py-12 px-4">
          <div className="text-center py-16">
            <Icon icon="alertCircle" size="lg" className="mx-auto text-error mb-4" />
            <h2 className="text-lg font-medium text-foreground mb-2">Error</h2>
            <p className="text-foreground-secondary mb-4">{error}</p>
            <Button onClick={fetchAgents}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="max-w-6xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-foreground-secondary hover:text-foreground transition-colors"
            >
              <Icon icon="arrowLeft" size="sm" />
            </Link>
            <h1 className="text-2xl font-bold text-foreground">My Agents</h1>
          </div>
          <Link href="/dashboard/agents/new">
            <Button>
              <Icon icon="plus" size="sm" className="mr-2" />
              New Agent
            </Button>
          </Link>
        </div>

        {/* Empty State */}
        {agents.length === 0 && (
          <div className="text-center py-16 bg-background border border-border rounded-lg">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Icon icon="terminal" size="lg" className="text-primary" />
            </div>
            <h2 className="text-lg font-medium text-foreground mb-2">No agents yet</h2>
            <p className="text-foreground-secondary mb-6 max-w-md mx-auto">
              Create your first AI agent to start chatting with tools. Agents can use any tools from
              your collections or individual tools.
            </p>
            <Link href="/dashboard/agents/new">
              <Button>
                <Icon icon="plus" size="sm" className="mr-2" />
                Create Your First Agent
              </Button>
            </Link>
          </div>
        )}

        {/* Agents Grid */}
        {agents.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="bg-background border border-border rounded-lg p-6 hover:border-foreground/20 transition-colors group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon icon="terminal" size="sm" className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{agent.name}</h3>
                      <p className="text-xs text-foreground-tertiary">
                        {PROVIDER_DISPLAY_NAMES[agent.provider]} / {agent.modelId}
                      </p>
                    </div>
                  </div>
                </div>

                {agent.description && (
                  <p className="text-sm text-foreground-secondary mb-4 line-clamp-2">
                    {agent.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-foreground-tertiary mb-4">
                  <span className="flex items-center gap-1">
                    <Icon icon="puzzle" size="xs" />
                    {agent.toolCount + agent.collectionCount * 5} tools
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-border">
                  <Link href={`/dashboard/agents/${agent.id}/chat`} className="flex-1">
                    <Button size="sm" className="w-full">
                      <Icon icon="message" size="xs" className="mr-1" />
                      Chat
                    </Button>
                  </Link>
                  <Link href={`/dashboard/agents/${agent.id}`}>
                    <Button size="sm" variant="secondary">
                      <Icon icon="edit" size="xs" />
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(agent.id)}
                    disabled={deletingId === agent.id}
                  >
                    <Icon icon="trash" size="xs" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
