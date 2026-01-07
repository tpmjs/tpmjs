'use client';

import type { AIProvider } from '@tpmjs/types/agent';
import { Badge } from '@tpmjs/ui/Badge/Badge';
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
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
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

const PROVIDER_DISPLAY_NAMES: Record<AIProvider, string> = {
  OPENAI: 'OpenAI',
  ANTHROPIC: 'Anthropic',
  GOOGLE: 'Google',
  GROQ: 'Groq',
  MISTRAL: 'Mistral',
};

const PROVIDER_COLORS: Record<AIProvider, 'default' | 'secondary' | 'outline'> = {
  OPENAI: 'default',
  ANTHROPIC: 'secondary',
  GOOGLE: 'outline',
  GROQ: 'outline',
  MISTRAL: 'outline',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

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

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
          <Icon icon="alertCircle" size="lg" className="mx-auto text-error mb-4" />
          <h2 className="text-lg font-medium text-foreground mb-2">Error</h2>
          <p className="text-foreground-secondary mb-4">{error}</p>
          <Button onClick={fetchAgents}>Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Agents"
      subtitle={
        agents.length > 0 ? `${agents.length} agent${agents.length !== 1 ? 's' : ''}` : undefined
      }
      actions={
        <Link href="/dashboard/agents/new">
          <Button>
            <Icon icon="plus" size="sm" className="mr-2" />
            New Agent
          </Button>
        </Link>
      }
    >
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Name</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Tools</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[140px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              <>
                {[0, 1, 2].map((idx) => (
                  <TableRow key={`agent-skeleton-${idx}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-secondary animate-pulse" />
                        <div className="space-y-1.5">
                          <div className="h-4 w-32 bg-surface-secondary rounded animate-pulse" />
                          <div className="h-3 w-48 bg-surface-secondary rounded animate-pulse" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-20 bg-surface-secondary rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-12 bg-surface-secondary rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-24 bg-surface-secondary rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-8 w-24 bg-surface-secondary rounded animate-pulse ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </>
            ) : agents.length === 0 ? (
              <TableEmpty
                colSpan={5}
                icon={
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon icon="terminal" size="lg" className="text-primary" />
                  </div>
                }
                title="No agents yet"
                description="Create your first AI agent to start chatting with tools. Agents can use any tools from your collections or individual tools."
                action={
                  <Link href="/dashboard/agents/new">
                    <Button>
                      <Icon icon="plus" size="sm" className="mr-2" />
                      Create Your First Agent
                    </Button>
                  </Link>
                }
              />
            ) : (
              agents.map((agent) => (
                <TableRow
                  key={agent.id}
                  interactive
                  onClick={() => router.push(`/dashboard/agents/${agent.id}`)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon icon="terminal" size="sm" className="text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{agent.name}</p>
                        {agent.description && (
                          <p className="text-sm text-foreground-tertiary truncate max-w-[250px]">
                            {agent.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={PROVIDER_COLORS[agent.provider]} size="sm">
                        {PROVIDER_DISPLAY_NAMES[agent.provider]}
                      </Badge>
                      <span className="text-xs text-foreground-tertiary">{agent.modelId}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-foreground-secondary">
                      {agent.toolCount > 0 && agent.collectionCount > 0
                        ? `${agent.toolCount} + ${agent.collectionCount} collections`
                        : agent.collectionCount > 0
                          ? `${agent.collectionCount} collection${agent.collectionCount !== 1 ? 's' : ''}`
                          : agent.toolCount}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-foreground-secondary text-sm">
                      {formatDate(agent.updatedAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/dashboard/agents/${agent.id}/chat`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button size="sm" variant="default">
                          <Icon icon="message" size="xs" className="mr-1" />
                          Chat
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleDelete(agent.id, e)}
                        disabled={deletingId === agent.id}
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
