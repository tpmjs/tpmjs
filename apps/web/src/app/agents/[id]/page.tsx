'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';
import { LikeButton } from '~/components/LikeButton';

interface AgentTool {
  id: string;
  toolId: string;
  position: number;
  addedAt: string;
  tool: {
    id: string;
    name: string;
    description: string;
    likeCount: number;
    package: {
      id: string;
      npmPackageName: string;
      category: string;
    };
  };
}

interface AgentCollection {
  id: string;
  collectionId: string;
  position: number;
  addedAt: string;
  collection: {
    id: string;
    name: string;
    description: string | null;
    toolCount: number;
  };
}

interface PublicAgent {
  id: string;
  uid: string;
  name: string;
  description: string | null;
  provider: string;
  modelId: string;
  systemPrompt: string | null;
  temperature: number;
  maxToolCallsPerTurn: number;
  likeCount: number;
  toolCount: number;
  collectionCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    image: string | null;
  };
  tools: AgentTool[];
  collections: AgentCollection[];
}

export default function PublicAgentDetailPage(): React.ReactElement {
  const params = useParams();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<PublicAgent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgent = useCallback(async () => {
    try {
      const response = await fetch(`/api/public/agents/${agentId}`);
      const data = await response.json();

      if (data.success) {
        setAgent(data.data);
      } else {
        if (data.error?.code === 'NOT_FOUND' || data.error?.code === 'FORBIDDEN') {
          setError('This agent is not available or is private');
        } else {
          setError(data.error?.message || 'Failed to fetch agent');
        }
      }
    } catch (err) {
      console.error('Failed to fetch agent:', err);
      setError('Failed to fetch agent');
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-surface-secondary rounded w-1/2 mb-4" />
            <div className="h-4 bg-surface-secondary rounded w-full mb-8" />
            <div className="h-32 bg-surface-secondary rounded mb-8" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-surface-secondary rounded" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Icon icon="alertCircle" size="lg" className="mx-auto text-error mb-4" />
            <h2 className="text-lg font-medium text-foreground mb-2">
              {error || 'Agent not found'}
            </h2>
            <p className="text-foreground-secondary mb-4">
              This agent may be private or no longer available.
            </p>
            <Link href="/agents">
              <Button>Browse Agents</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/agents"
          className="inline-flex items-center gap-1 text-sm text-foreground-secondary hover:text-foreground mb-6"
        >
          <Icon icon="arrowLeft" size="xs" />
          Back to Agents
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{agent.name}</h1>
            {agent.description && <p className="text-foreground-secondary">{agent.description}</p>}
          </div>
          <LikeButton
            entityType="agent"
            entityId={agent.id}
            initialCount={agent.likeCount}
            showCount={true}
            variant="outline"
          />
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-4 mb-8 text-sm text-foreground-tertiary">
          <div className="flex items-center gap-2">
            {agent.createdBy.image ? (
              <img
                src={agent.createdBy.image}
                alt={agent.createdBy.name}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon icon="user" size="xs" className="text-primary" />
              </div>
            )}
            <span>Created by {agent.createdBy.name}</span>
          </div>
          <span>•</span>
          <span>
            {agent.toolCount} tool{agent.toolCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Configuration */}
        <div className="bg-surface/50 border border-border rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Configuration</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="text-sm text-foreground-tertiary">Provider</span>
              <p className="font-medium text-foreground">{agent.provider}</p>
            </div>
            <div>
              <span className="text-sm text-foreground-tertiary">Model</span>
              <p className="font-medium text-foreground">{agent.modelId}</p>
            </div>
            <div>
              <span className="text-sm text-foreground-tertiary">Temperature</span>
              <p className="font-medium text-foreground">{agent.temperature}</p>
            </div>
            <div>
              <span className="text-sm text-foreground-tertiary">Max Tool Calls</span>
              <p className="font-medium text-foreground">{agent.maxToolCallsPerTurn}</p>
            </div>
          </div>

          {agent.systemPrompt && (
            <div className="mt-4 pt-4 border-t border-border">
              <span className="text-sm text-foreground-tertiary">System Prompt</span>
              <pre className="mt-2 p-3 bg-background border border-border rounded-lg text-sm text-foreground-secondary whitespace-pre-wrap font-mono">
                {agent.systemPrompt}
              </pre>
            </div>
          )}
        </div>

        {/* Tools */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Tools</h2>

          {agent.tools.length === 0 ? (
            <div className="text-center py-12 bg-surface/50 border border-border rounded-lg">
              <Icon icon="puzzle" size="lg" className="mx-auto text-foreground-tertiary mb-2" />
              <p className="text-foreground-secondary">No tools configured for this agent</p>
            </div>
          ) : (
            <div className="space-y-3">
              {agent.tools.map((at) => (
                <div
                  key={at.id}
                  className="bg-background border border-border rounded-lg p-4 hover:border-foreground/20 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Link
                        href={`/tool/${at.tool.package.npmPackageName}/${at.tool.name}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {at.tool.name}
                      </Link>
                      <span className="text-sm text-foreground-tertiary ml-2">
                        from {at.tool.package.npmPackageName}
                      </span>
                    </div>
                    <LikeButton
                      entityType="tool"
                      entityId={at.tool.id}
                      initialCount={at.tool.likeCount}
                      size="sm"
                    />
                  </div>
                  <p className="text-sm text-foreground-secondary line-clamp-2 mb-2">
                    {at.tool.description}
                  </p>
                  <Badge variant="secondary" size="sm">
                    {at.tool.package.category}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Collections */}
        {agent.collections.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Collections</h2>
            <div className="space-y-3">
              {agent.collections.map((ac) => (
                <div
                  key={ac.id}
                  className="bg-background border border-border rounded-lg p-4 hover:border-foreground/20 transition-colors"
                >
                  <Link
                    href={`/collections/${ac.collection.id}`}
                    className="font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {ac.collection.name}
                  </Link>
                  {ac.collection.description && (
                    <p className="text-sm text-foreground-secondary mt-1 line-clamp-2">
                      {ac.collection.description}
                    </p>
                  )}
                  <p className="text-xs text-foreground-tertiary mt-2">
                    {ac.collection.toolCount} tool{ac.collection.toolCount !== 1 ? 's' : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
