'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';
import { CollectionActivationPanel } from '~/components/collections/CollectionActivationPanel';
import { ForkButton } from '~/components/ForkButton';
import { ForkedFromBadge } from '~/components/ForkedFromBadge';
import { LikeButton } from '~/components/LikeButton';
import { ScenariosSection } from '~/components/ScenariosSection';
import { ShareButton } from '~/components/ShareButton';
import { SkillsSection } from '~/components/skills/SkillsSection';
import { UseCasesSection } from '~/components/UseCasesSection';
import { useTrackView } from '~/hooks/useTrackView';

/**
 * Locked state for private collections viewed by non-owners
 * Shows minimal information: just name and "Private" badge
 */
export function PrivateCollectionLocked({ name }: { name: string }) {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-foreground-tertiary/10 flex items-center justify-center mb-6">
            <Icon icon="key" className="w-8 h-8 text-foreground-tertiary" />
          </div>
          <div className="flex items-center gap-2 mb-4">
            <h1 className="text-2xl font-bold text-foreground">{name}</h1>
            <Badge variant="secondary">Private</Badge>
          </div>
          <p className="text-foreground-secondary max-w-md">
            This collection is private and can only be viewed by its owner.
          </p>
        </div>
      </main>
    </div>
  );
}

export interface CollectionTool {
  id: string;
  toolId: string;
  position: number;
  note: string | null;
  tool: {
    id: string;
    name: string;
    description: string;
    likeCount: number;
    package: {
      npmPackageName: string;
      category: string;
    };
  };
}

export interface UseCaseToolStep {
  toolName: string;
  packageName: string;
  purpose: string;
  order: number;
}

export interface UseCase {
  id: string;
  userPrompt: string;
  description: string;
  toolSequence: UseCaseToolStep[];
}

export interface PublicCollection {
  id: string;
  slug: string; // Already coerced to empty string if null in server component
  name: string;
  description: string | null;
  likeCount: number;
  toolCount: number;
  forkCount: number;
  executionCount: number;
  createdAt: string;
  createdBy: {
    id: string;
    username: string;
    name: string;
    image: string | null;
  };
  tools: CollectionTool[];
  forkedFromId: string | null;
  forkedFrom: {
    id: string;
    name: string;
    slug: string; // Already coerced to empty string if null in server component
    user: {
      username: string;
    };
  } | null;
  useCases?: UseCase[] | null;
  useCasesGeneratedAt?: string | null;
}

interface CollectionDetailClientProps {
  collection: PublicCollection;
  username: string;
}

export function CollectionDetailClient({
  collection: initialCollection,
  username,
}: CollectionDetailClientProps) {
  const [collection, setCollection] = useState(initialCollection);

  // Track page view
  useTrackView('collection', collection.id);

  // Handler for when use cases are generated
  const handleUseCasesGenerated = useCallback(
    (useCases: UseCase[], generatedAt: string) => {
      setCollection({
        ...collection,
        useCases,
        useCasesGeneratedAt: generatedAt,
      });
    },
    [collection]
  );

  // Generate tweet text
  const tweetText = collection.description
    ? `${collection.name} - ${collection.description.slice(0, 100)}${collection.description.length > 100 ? '...' : ''}`
    : `Check out "${collection.name}" - a collection of ${collection.toolCount} AI tools`;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Collection Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{collection.name}</h1>
              {collection.description && (
                <p className="text-foreground-secondary mt-2">{collection.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <Link
                  href={`/${username}`}
                  className="text-sm text-foreground-tertiary hover:text-foreground-secondary inline-flex items-center gap-1"
                >
                  by @{collection.createdBy.username}
                </Link>
                {collection.forkedFrom && (
                  <ForkedFromBadge type="collection" forkedFrom={collection.forkedFrom} />
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ShareButton
                title={collection.name}
                text={tweetText}
                hashtags={['TPMJS', 'AI', 'MCP']}
                variant="twitter"
                size="sm"
              />
              <LikeButton
                entityType="collection"
                entityId={collection.id}
                initialCount={collection.likeCount}
              />
              <ForkButton type="collection" sourceId={collection.id} sourceName={collection.name} />
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-foreground-secondary">
            <span className="flex items-center gap-1">
              <Icon icon="puzzle" className="w-4 h-4" />
              {collection.toolCount} tools
            </span>
            <span className="flex items-center gap-1">
              <Icon icon="heart" className="w-4 h-4" />
              {collection.likeCount} likes
            </span>
            {collection.forkCount > 0 && (
              <span className="flex items-center gap-1">
                <Icon icon="gitFork" className="w-4 h-4" />
                {collection.forkCount} forks
              </span>
            )}
            {collection.executionCount > 0 && (
              <span className="flex items-center gap-1">
                <Icon icon="terminal" className="w-4 h-4" />
                {collection.executionCount.toLocaleString()} executions
              </span>
            )}
          </div>

          {/* Public collections are live HTTP MCP servers with a token-free connection path. */}
          <CollectionActivationPanel
            collectionId={collection.id}
            name={collection.name}
            username={username}
            slug={collection.slug}
            toolCount={collection.toolCount}
          />

          {/* Tools */}
          {collection.tools.length > 0 ? (
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4">Tools in Collection</h2>
              <div className="grid gap-3">
                {collection.tools.map((ct) => (
                  <Link
                    key={ct.id}
                    href={`/tool/${ct.tool.package.npmPackageName}/${ct.tool.name}`}
                    className="block p-4 bg-surface border border-border rounded-lg hover:border-foreground-secondary transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-foreground">{ct.tool.name}</h3>
                        <p className="text-sm text-foreground-secondary mt-1 line-clamp-2">
                          {ct.tool.description}
                        </p>
                        {ct.note && (
                          <p className="text-xs text-foreground-tertiary italic mt-2">
                            Note: {ct.note}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {ct.tool.package.category}
                          </Badge>
                          <span className="text-xs text-foreground-tertiary">
                            {ct.tool.package.npmPackageName}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-foreground-tertiary">
                        <Icon icon="heart" className="w-3.5 h-3.5" />
                        {ct.tool.likeCount}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : (
            <div className="text-center py-12">
              <Icon icon="box" className="w-12 h-12 mx-auto text-foreground-secondary mb-4" />
              <p className="text-foreground-secondary">This collection is empty.</p>
            </div>
          )}

          {/* Use Cases Section */}
          {collection.tools.length > 0 && (
            <UseCasesSection
              collectionId={collection.id}
              useCases={collection.useCases ?? null}
              generatedAt={collection.useCasesGeneratedAt ?? null}
              onUseCasesGenerated={handleUseCasesGenerated}
            />
          )}

          {/* Scenarios Section */}
          {collection.tools.length > 0 && (
            <ScenariosSection
              collectionId={collection.id}
              collectionOwnerId={collection.createdBy.id}
              username={username}
              slug={collection.slug}
            />
          )}

          {/* Skills Section */}
          {collection.tools.length > 0 && (
            <SkillsSection
              collectionId={collection.id}
              username={username}
              slug={collection.slug}
            />
          )}
        </div>
      </main>
    </div>
  );
}
