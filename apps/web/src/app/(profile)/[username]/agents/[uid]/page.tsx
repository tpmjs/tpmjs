'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';
import { CloneButton } from '~/components/CloneButton';
import { LikeButton } from '~/components/LikeButton';

interface AgentTool {
  id: string;
  toolId: string;
  position: number;
  tool: {
    id: string;
    name: string;
    description: string;
    package: {
      npmPackageName: string;
      category: string;
    };
  };
}

interface AgentCollection {
  id: string;
  collectionId: string;
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
  likeCount: number;
  toolCount: number;
  collectionCount: number;
  createdAt: string;
  createdBy: {
    id: string;
    username: string;
    name: string;
    image: string | null;
  };
  tools: AgentTool[];
  collections: AgentCollection[];
}

export default function PrettyAgentDetailPage(): React.ReactElement {
  const params = useParams();
  const rawUsername = params.username as string;
  const username = rawUsername.startsWith('@') ? rawUsername.slice(1) : rawUsername;
  const uid = params.uid as string;

  const [agent, setAgent] = useState<PublicAgent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgent = useCallback(async () => {
    try {
      const response = await fetch(`/api/public/users/${username}/agents/${uid}`);
      if (response.status === 404) {
        setError('not_found');
        return;
      }
      const data = await response.json();

      if (data.success) {
        setAgent(data.data);
      } else {
        setError(data.error?.message || 'Failed to load agent');
      }
    } catch {
      setError('Failed to load agent');
    } finally {
      setIsLoading(false);
    }
  }, [username, uid]);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  if (error === 'not_found') {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Icon icon="loader" className="w-8 h-8 animate-spin text-foreground-secondary" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        ) : agent ? (
          <div className="space-y-8">
            {/* Agent Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-foreground">{agent.name}</h1>
                  <Badge variant="outline">{agent.provider}</Badge>
                </div>
                {agent.description && (
                  <p className="text-foreground-secondary">{agent.description}</p>
                )}
                <Link
                  href={`/${username}`}
                  className="text-sm text-foreground-tertiary hover:text-foreground-secondary mt-2 inline-flex items-center gap-1"
                >
                  by @{agent.createdBy.username}
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <LikeButton entityType="agent" entityId={agent.id} initialCount={agent.likeCount} />
                <CloneButton type="agent" sourceId={agent.id} sourceName={agent.name} />
                <Link href={`/${username}/agents/${uid}/chat`}>
                  <Button>
                    <Icon icon="message" className="w-4 h-4 mr-2" />
                    Chat
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-foreground-secondary">
              <span className="flex items-center gap-1">
                <Icon icon="puzzle" className="w-4 h-4" />
                {agent.toolCount} tools
              </span>
              <span className="flex items-center gap-1">
                <Icon icon="folder" className="w-4 h-4" />
                {agent.collectionCount} collections
              </span>
              <span>Model: {agent.modelId}</span>
              <span>Temperature: {agent.temperature}</span>
            </div>

            {/* System Prompt */}
            {agent.systemPrompt && (
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-2">System Prompt</h2>
                <div className="bg-surface border border-border rounded-lg p-4">
                  <pre className="text-sm text-foreground-secondary whitespace-pre-wrap font-mono">
                    {agent.systemPrompt}
                  </pre>
                </div>
              </section>
            )}

            {/* Tools */}
            {agent.tools.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Tools</h2>
                <div className="grid gap-3">
                  {agent.tools.map((at) => (
                    <Link
                      key={at.id}
                      href={`/tool/${at.tool.package.npmPackageName}/${at.tool.name}`}
                      className="block p-4 bg-surface border border-border rounded-lg hover:border-foreground-secondary transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-foreground">{at.tool.name}</h3>
                          <p className="text-sm text-foreground-secondary mt-1 line-clamp-2">
                            {at.tool.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {at.tool.package.category}
                            </Badge>
                            <span className="text-xs text-foreground-tertiary">
                              {at.tool.package.npmPackageName}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Collections */}
            {agent.collections.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Collections</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {agent.collections.map((ac) => (
                    <div key={ac.id} className="p-4 bg-surface border border-border rounded-lg">
                      <h3 className="font-medium text-foreground">{ac.collection.name}</h3>
                      {ac.collection.description && (
                        <p className="text-sm text-foreground-secondary mt-1 line-clamp-2">
                          {ac.collection.description}
                        </p>
                      )}
                      <span className="text-xs text-foreground-tertiary mt-2 inline-block">
                        {ac.collection.toolCount} tools
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
