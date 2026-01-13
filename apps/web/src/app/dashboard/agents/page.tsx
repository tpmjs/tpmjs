'use client';

import type { AIProvider } from '@tpmjs/types/agent';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';

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

const PROVIDER_INFO: Record<AIProvider, { name: string; color: string; bgColor: string }> = {
  OPENAI: { name: 'OpenAI', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10' },
  ANTHROPIC: { name: 'Anthropic', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-500/10' },
  GOOGLE: { name: 'Google', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/10' },
  GROQ: { name: 'Groq', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-500/10' },
  MISTRAL: { name: 'Mistral', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-500/10' },
};

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes <= 1 ? 'Just now' : `${diffMinutes}m ago`;
    }
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function AgentCard({
  agent,
  onDelete,
  isDeleting,
}: {
  agent: Agent;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const router = useRouter();
  const providerInfo = PROVIDER_INFO[agent.provider];
  const totalTools = agent.toolCount + agent.collectionCount;

  return (
    <div
      className="bg-surface border border-border rounded-xl p-5 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
      onClick={() => router.push(`/dashboard/agents/${agent.id}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Icon icon="terminal" size="md" className="text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {agent.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs font-medium ${providerInfo.color}`}>
                {providerInfo.name}
              </span>
              <span className="text-xs text-foreground-tertiary">•</span>
              <span className="text-xs text-foreground-tertiary truncate">
                {agent.modelId}
              </span>
            </div>
          </div>
        </div>
        <span className="text-xs text-foreground-tertiary whitespace-nowrap">
          {formatRelativeDate(agent.updatedAt)}
        </span>
      </div>

      {/* Description */}
      {agent.description ? (
        <p className="text-sm text-foreground-secondary line-clamp-2 mb-4 min-h-[2.5rem]">
          {agent.description}
        </p>
      ) : (
        <p className="text-sm text-foreground-tertiary italic mb-4 min-h-[2.5rem]">
          No description
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1.5">
          <Icon icon="puzzle" size="xs" className="text-foreground-tertiary" />
          <span className="text-foreground-secondary">
            {totalTools} tool{totalTools !== 1 ? 's' : ''}
          </span>
        </div>
        {agent.collectionCount > 0 && (
          <div className="flex items-center gap-1.5">
            <Icon icon="folder" size="xs" className="text-foreground-tertiary" />
            <span className="text-foreground-secondary">
              {agent.collectionCount} collection{agent.collectionCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-border">
        <Link
          href={`/dashboard/agents/${agent.id}/chat`}
          onClick={(e) => e.stopPropagation()}
          className="flex-1"
        >
          <Button size="sm" className="w-full">
            <Icon icon="message" size="xs" className="mr-1.5" />
            Chat
          </Button>
        </Link>
        <Link
          href={`/dashboard/agents/${agent.id}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Button size="sm" variant="secondary">
            <Icon icon="edit" size="xs" />
          </Button>
        </Link>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(agent.id);
          }}
          disabled={isDeleting}
          className="text-foreground-tertiary hover:text-error"
        >
          <Icon icon="trash" size="xs" />
        </Button>
      </div>
    </div>
  );
}

function AgentCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface-secondary animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-surface-secondary rounded animate-pulse" />
            <div className="h-3 w-24 bg-surface-secondary rounded animate-pulse" />
          </div>
        </div>
        <div className="h-3 w-16 bg-surface-secondary rounded animate-pulse" />
      </div>
      <div className="h-10 bg-surface-secondary rounded animate-pulse mb-4" />
      <div className="h-4 w-20 bg-surface-secondary rounded animate-pulse mb-4" />
      <div className="flex gap-2 pt-4 border-t border-border">
        <div className="flex-1 h-8 bg-surface-secondary rounded animate-pulse" />
        <div className="h-8 w-8 bg-surface-secondary rounded animate-pulse" />
        <div className="h-8 w-8 bg-surface-secondary rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function AgentsPage(): React.ReactElement {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) return agents;
    const query = searchQuery.toLowerCase();
    return agents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(query) ||
        agent.description?.toLowerCase().includes(query) ||
        agent.modelId.toLowerCase().includes(query) ||
        PROVIDER_INFO[agent.provider].name.toLowerCase().includes(query)
    );
  }, [agents, searchQuery]);

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

  if (error) {
    return (
      <DashboardLayout
        title="Agents"
        actions={
          <Link href="/dashboard/agents/new">
            <Button>
              <Icon icon="plus" size="sm" className="mr-2" />
              New Agent
            </Button>
          </Link>
        }
      >
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
            <Icon icon="alertCircle" size="lg" className="text-error" />
          </div>
          <h2 className="text-lg font-medium text-foreground mb-2">Something went wrong</h2>
          <p className="text-foreground-secondary mb-6 max-w-md mx-auto">{error}</p>
          <Button onClick={fetchAgents}>
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Agents"
      subtitle="Create and manage AI agents with custom tools"
      actions={
        <Link href="/dashboard/agents/new">
          <Button>
            <Icon icon="plus" size="sm" className="mr-2" />
            New Agent
          </Button>
        </Link>
      }
    >
      {/* Search and Filters */}
      {(agents.length > 0 || searchQuery) && (
        <div className="mb-6">
          <div className="relative">
            <Icon
              icon="search"
              size="sm"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary"
            />
            <Input
              type="text"
              placeholder="Search agents by name, model, or provider..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <AgentCardSkeleton key={`skeleton-${idx}`} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && agents.length === 0 && (
        <div className="text-center py-16 bg-surface border border-border rounded-xl">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Icon icon="terminal" size="lg" className="text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Create your first agent</h2>
          <p className="text-foreground-secondary mb-8 max-w-md mx-auto">
            AI agents can chat with users and use tools from your collections.
            Create an agent to get started with AI-powered conversations.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/dashboard/agents/new">
              <Button size="lg">
                <Icon icon="plus" size="sm" className="mr-2" />
                Create Agent
              </Button>
            </Link>
            <Link href="/tool/tool-search">
              <Button size="lg" variant="outline">
                <Icon icon="search" size="sm" className="mr-2" />
                Browse Tools
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* No Results State */}
      {!isLoading && agents.length > 0 && filteredAgents.length === 0 && (
        <div className="text-center py-16 bg-surface border border-border rounded-xl">
          <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-4">
            <Icon icon="search" size="lg" className="text-foreground-tertiary" />
          </div>
          <h2 className="text-lg font-medium text-foreground mb-2">No agents found</h2>
          <p className="text-foreground-secondary mb-4">
            No agents match "{searchQuery}"
          </p>
          <Button variant="secondary" onClick={() => setSearchQuery('')}>
            Clear Search
          </Button>
        </div>
      )}

      {/* Agents Grid */}
      {!isLoading && filteredAgents.length > 0 && (
        <>
          {searchQuery && (
            <p className="text-sm text-foreground-tertiary mb-4">
              Showing {filteredAgents.length} of {agents.length} agents
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onDelete={handleDelete}
                isDeleting={deletingId === agent.id}
              />
            ))}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
