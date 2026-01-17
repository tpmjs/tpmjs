'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { EmptyState } from '@tpmjs/ui/EmptyState/EmptyState';
import { ErrorState } from '@tpmjs/ui/ErrorState/ErrorState';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import { LoadingState } from '@tpmjs/ui/LoadingState/LoadingState';
import { PageHeader } from '@tpmjs/ui/PageHeader/PageHeader';
import { Select } from '@tpmjs/ui/Select/Select';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { TableVirtuoso } from 'react-virtuoso';
import { AppHeader } from '~/components/AppHeader';
import { CopyDropdown, getAgentCopyOptions } from '~/components/CopyDropdown';
import { LikeButton } from '~/components/LikeButton';
import { type PublicAgent, useAgents } from '~/hooks/useAgents';

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
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('likes');

  // Fetch agents using SWR
  const { data, isLoading, error: swrError, mutate } = useAgents({ sort });

  const agents = data?.agents ?? [];
  const hasMore = data?.pagination.hasMore ?? false;
  const error = swrError?.message ?? null;

  // Filter and sort agents (client-side search)
  const filteredAgents = useMemo(() => {
    let result = agents;

    if (search) {
      const query = search.toLowerCase();
      result = result.filter(
        (a: PublicAgent) =>
          a.name.toLowerCase().includes(query) ||
          a.description?.toLowerCase().includes(query) ||
          a.provider.toLowerCase().includes(query)
      );
    }

    return sortAgents(result, sort);
  }, [agents, search, sort]);

  const TableHeader = useCallback(
    () => (
      <tr className="bg-surface-secondary text-left text-xs font-semibold uppercase tracking-wider text-foreground-secondary border-b border-border">
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
            href={`/${agent.createdBy.username}/agents/${agent.uid}`}
            className="font-semibold text-foreground hover:text-primary group-hover:text-primary transition-colors"
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
            href={`/${agent.createdBy.username}/agents/${agent.uid}/chat`}
            className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <Icon icon="message" size="xs" />
            Chat
          </Link>
        </td>
        <td className="px-4 py-3 text-right">
          {agent.createdBy.username && (
            <CopyDropdown
              options={getAgentCopyOptions(agent.createdBy.username, agent.uid, agent.name)}
              buttonLabel="Copy"
            />
          )}
        </td>
      </>
    );
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Public Agents"
          description="Discover AI agents created and shared by the community"
        />

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
          <ErrorState message={error} onRetry={() => mutate()} />
        ) : isLoading ? (
          <LoadingState message="Loading agents..." size="lg" />
        ) : filteredAgents.length === 0 ? (
          <EmptyState
            icon="terminal"
            title="No agents found"
            description={search ? 'Try adjusting your search terms' : 'Be the first to share a public agent!'}
          />
        ) : (
          <>
            <div className="border border-border rounded-lg overflow-hidden">
              <TableVirtuoso
                style={{ height: 'calc(100vh - 350px)', minHeight: '400px' }}
                data={filteredAgents}
                overscan={30}
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
                    <thead {...props} className="bg-surface-secondary sticky top-0 z-10" />
                  ),
                  TableBody: (props) => <tbody {...props} />,
                  TableRow: (props) => (
                    <tr
                      {...props}
                      className="border-b border-border bg-surface hover:bg-surface-secondary transition-all duration-150 group"
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
