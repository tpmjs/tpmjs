'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import { Select } from '@tpmjs/ui/Select/Select';
import { Spinner } from '@tpmjs/ui/Spinner/Spinner';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TableVirtuoso } from 'react-virtuoso';
import { AppHeader } from '~/components/AppHeader';
import { CopyDropdown, getAgentCopyOptions } from '~/components/CopyDropdown';
import { LikeButton } from '~/components/LikeButton';

interface PublicAgent {
  id: string;
  uid: string;
  name: string;
  description: string | null;
  provider: string;
  modelId: string;
  likeCount: number;
  toolCount: number;
  collectionCount: number;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    image: string | null;
  };
}

type SortOption = 'likes' | 'recent' | 'tools';

function sortAgents(agents: PublicAgent[], sortBy: SortOption): PublicAgent[] {
  return [...agents].sort((a, b) => {
    switch (sortBy) {
      case 'likes':
        return b.likeCount - a.likeCount;
      case 'recent':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'tools':
        return b.toolCount - a.toolCount;
      default:
        return 0;
    }
  });
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

export default function PublicAgentsPage(): React.ReactElement {
  const [agents, setAgents] = useState<PublicAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('likes');
  const loadingMore = useRef(false);

  const fetchAgents = useCallback(
    async (offset: number, resetList = false) => {
      try {
        if (loadingMore.current && !resetList) return;
        loadingMore.current = true;

        const params = new URLSearchParams({
          limit: '100',
          offset: String(offset),
          sort,
        });

        const response = await fetch(`/api/public/agents?${params}`);
        const data = await response.json();

        if (data.success) {
          if (resetList || offset === 0) {
            setAgents(data.data);
          } else {
            setAgents((prev) => [...prev, ...data.data]);
          }
          setHasMore(data.pagination.hasMore);
        } else {
          setError(data.error?.message || 'Failed to fetch agents');
        }
      } catch (err) {
        console.error('Failed to fetch agents:', err);
        setError('Failed to fetch agents');
      } finally {
        setIsLoading(false);
        loadingMore.current = false;
      }
    },
    [sort]
  );

  useEffect(() => {
    setIsLoading(true);
    fetchAgents(0, true);
  }, [fetchAgents]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore.current) return;
    fetchAgents(agents.length);
  }, [hasMore, agents.length, fetchAgents]);

  // Filter and sort agents
  const filteredAgents = useMemo(() => {
    let result = agents;

    if (search) {
      const query = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.description?.toLowerCase().includes(query) ||
          a.provider.toLowerCase().includes(query)
      );
    }

    return sortAgents(result, sort);
  }, [agents, search, sort]);

  const TableHeader = useCallback(
    () => (
      <tr className="bg-surface text-left text-sm font-medium text-foreground-secondary">
        <th className="px-4 py-3 w-[200px]">Name</th>
        <th className="px-4 py-3 w-[250px]">Description</th>
        <th className="px-4 py-3 w-[100px]">Provider</th>
        <th className="px-4 py-3 w-[80px] text-center">Tools</th>
        <th className="px-4 py-3 w-[80px] text-center">Likes</th>
        <th className="px-4 py-3 w-[150px]">Creator</th>
        <th className="px-4 py-3 w-[80px] text-center">Chat</th>
        <th className="px-4 py-3 w-[100px] text-right">Copy</th>
      </tr>
    ),
    []
  );

  const TableRow = useCallback((_index: number, agent: PublicAgent) => {
    return (
      <>
        <td className="px-4 py-3">
          <Link
            href={`/agents/${agent.id}`}
            className="font-medium text-foreground hover:text-primary transition-colors"
          >
            {agent.name}
          </Link>
        </td>
        <td className="px-4 py-3 text-sm text-foreground-secondary">
          {agent.description ? truncateText(agent.description, 50) : '—'}
        </td>
        <td className="px-4 py-3">
          <Badge variant="secondary" size="sm">
            {agent.provider}
          </Badge>
        </td>
        <td className="px-4 py-3 text-center">
          <Badge variant="secondary" size="sm">
            {agent.toolCount}
          </Badge>
        </td>
        <td className="px-4 py-3 text-center">
          <LikeButton
            entityType="agent"
            entityId={agent.id}
            initialCount={agent.likeCount}
            size="sm"
            showCount={true}
          />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {agent.createdBy.image ? (
              <img
                src={agent.createdBy.image}
                alt={agent.createdBy.name}
                className="w-5 h-5 rounded-full"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon icon="user" size="xs" className="text-primary" />
              </div>
            )}
            <span className="text-sm text-foreground-secondary truncate max-w-[100px]">
              {agent.createdBy.name}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-center">
          <Link
            href={`/agents/${agent.id}/chat`}
            className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <Icon icon="message" size="xs" />
            Chat
          </Link>
        </td>
        <td className="px-4 py-3 text-right">
          <CopyDropdown options={getAgentCopyOptions(agent.uid, agent.name)} buttonLabel="Copy" />
        </td>
      </>
    );
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Public Agents</h1>
          <p className="text-foreground-secondary">
            Discover AI agents created and shared by the community
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agents..."
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground-secondary">Sort:</span>
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              options={[
                { value: 'likes', label: 'Most Liked' },
                { value: 'recent', label: 'Most Recent' },
                { value: 'tools', label: 'Most Tools' },
              ]}
            />
          </div>
        </div>

        {/* Content */}
        {error ? (
          <div className="text-center py-16">
            <Icon icon="alertCircle" size="lg" className="mx-auto text-error mb-4" />
            <h2 className="text-lg font-medium text-foreground mb-2">Error</h2>
            <p className="text-foreground-secondary mb-4">{error}</p>
            <Button onClick={() => fetchAgents(0, true)}>Try Again</Button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-24 gap-4">
            <Spinner size="lg" />
            <span className="text-foreground-secondary font-mono text-sm">Loading agents...</span>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Icon icon="terminal" size="lg" className="text-primary" />
            </div>
            <h2 className="text-lg font-medium text-foreground mb-2">No agents found</h2>
            <p className="text-foreground-secondary">
              {search ? 'Try adjusting your search terms' : 'Be the first to share a public agent!'}
            </p>
          </div>
        ) : (
          <>
            <div className="border border-border rounded-lg overflow-hidden">
              <TableVirtuoso
                style={{ height: 'calc(100vh - 350px)', minHeight: '400px' }}
                data={filteredAgents}
                overscan={30}
                endReached={loadMore}
                fixedHeaderContent={TableHeader}
                itemContent={TableRow}
                components={{
                  Table: (props) => (
                    <table
                      {...props}
                      className="w-full border-collapse text-sm"
                      style={{ tableLayout: 'fixed' }}
                    />
                  ),
                  TableHead: (props) => (
                    <thead {...props} className="bg-surface sticky top-0 z-10" />
                  ),
                  TableBody: (props) => <tbody {...props} />,
                  TableRow: (props) => (
                    <tr
                      {...props}
                      className="border-b border-border hover:bg-surface/50 transition-colors"
                    />
                  ),
                }}
              />
            </div>

            <div className="mt-4 text-sm text-foreground-tertiary">
              Showing {filteredAgents.length} agent
              {filteredAgents.length !== 1 ? 's' : ''}
              {search && ` matching "${search}"`}
              {hasMore && ' (scroll for more)'}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
