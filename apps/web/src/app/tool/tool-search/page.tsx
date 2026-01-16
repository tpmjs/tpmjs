'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Card, CardContent } from '@tpmjs/ui/Card/Card';
import { Container } from '@tpmjs/ui/Container/Container';
import { EmptyState } from '@tpmjs/ui/EmptyState/EmptyState';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import { LoadingState } from '@tpmjs/ui/LoadingState/LoadingState';
import { PageHeader } from '@tpmjs/ui/PageHeader/PageHeader';
import { Select } from '@tpmjs/ui/Select/Select';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { TableVirtuoso } from 'react-virtuoso';
import { AppHeader } from '~/components/AppHeader';
import { CopyButton } from '~/components/CopyButton';
import { LikeButton } from '~/components/LikeButton';
import {
  PackageManagerSelector,
  getInstallCommand,
  usePackageManager,
} from '~/components/PackageManagerSelector';
import { type Tool, useTools } from '~/hooks/useTools';

type SortOption = 'downloads' | 'likes' | 'recent' | 'name';

function formatDownloads(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

/** Sort tools by criterion, pushing broken tools to the bottom */
function sortTools(tools: Tool[], sortBy: SortOption): Tool[] {
  return [...tools].sort((a, b) => {
    const aIsBroken = a.importHealth === 'BROKEN' || a.executionHealth === 'BROKEN';
    const bIsBroken = b.importHealth === 'BROKEN' || b.executionHealth === 'BROKEN';
    // Always push broken tools to bottom
    if (aIsBroken && !bIsBroken) return 1;
    if (!aIsBroken && bIsBroken) return -1;

    // Within same broken status, sort by selected criterion
    switch (sortBy) {
      case 'downloads': {
        const aDownloads = a.package.npmDownloadsLastMonth ?? 0;
        const bDownloads = b.package.npmDownloadsLastMonth ?? 0;
        return bDownloads - aDownloads;
      }
      case 'likes': {
        const aLikes = a.likeCount ?? 0;
        const bLikes = b.likeCount ?? 0;
        return bLikes - aLikes;
      }
      case 'recent': {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      }
      case 'name': {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        return aName.localeCompare(bName);
      }
      default:
        return 0;
    }
  });
}

export default function ToolSearchPage(): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('downloads');
  const [packageManager, setPackageManager] = usePackageManager();

  // Fetch tools from API using SWR
  const { data: tools = [], isLoading: loading, error: swrError } = useTools({
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    importHealth: healthFilter === 'healthy' ? 'HEALTHY' : undefined,
    executionHealth: healthFilter === 'healthy' ? 'HEALTHY' : undefined,
    broken: healthFilter === 'broken' ? true : undefined,
  });

  const error = swrError?.message ?? null;

  // Extract unique categories from all tools
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    for (const tool of tools) {
      if (tool.package.category) {
        categories.add(tool.package.category);
      }
    }
    return Array.from(categories).sort();
  }, [tools]);

  // Filter and sort tools
  const filteredTools = useMemo(() => {
    let result = tools;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (tool: Tool) =>
          tool.name.toLowerCase().includes(query) ||
          tool.package.npmPackageName.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query)
      );
    }

    // Sort tools
    return sortTools(result, sortBy);
  }, [tools, searchQuery, sortBy]);

  const TableHeader = useCallback(
    () => (
      <tr className="bg-surface-secondary text-left text-xs font-semibold uppercase tracking-wider text-foreground-secondary border-b border-border">
        <th className="px-4 py-3 w-[250px]">Name</th>
        <th className="px-4 py-3 w-[300px]">Description</th>
        <th className="px-4 py-3 w-[100px]">Category</th>
        <th className="px-4 py-3 w-[80px] text-right">Downloads</th>
        <th className="px-4 py-3 w-[60px] text-right">Likes</th>
        <th className="px-4 py-3 w-[100px] text-right">Install</th>
      </tr>
    ),
    []
  );

  const TableRow = useCallback(
    (_index: number, tool: Tool) => {
      const isBroken = tool.importHealth === 'BROKEN' || tool.executionHealth === 'BROKEN';
      const displayName = tool.name !== 'default' ? tool.name : tool.package.npmPackageName;
      const installCommand = getInstallCommand(tool.package.npmPackageName, packageManager);

      return (
        <>
          <td className="px-4 py-3">
            <Link
              href={`/tool/${tool.package.npmPackageName}/${tool.name}`}
              className="block"
            >
              <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {displayName}
                {isBroken && (
                  <Badge variant="error" size="sm" className="ml-2">
                    Broken
                  </Badge>
                )}
              </div>
              <div className="text-xs text-foreground-tertiary truncate max-w-[230px]">
                {tool.package.npmPackageName}
              </div>
            </Link>
          </td>
          <td className="px-4 py-3 text-sm text-foreground-secondary">
            {tool.description ? truncateText(tool.description, 60) : '—'}
          </td>
          <td className="px-4 py-3">
            <Badge variant="secondary" size="sm">
              {tool.package.category}
            </Badge>
          </td>
          <td className="px-4 py-3 text-right text-sm text-foreground-secondary tabular-nums">
            {formatDownloads(tool.package.npmDownloadsLastMonth)}
          </td>
          <td className="px-4 py-3 text-right">
            <LikeButton
              entityType="tool"
              entityId={tool.id}
              initialCount={tool.likeCount ?? 0}
              size="sm"
              showCount={true}
            />
          </td>
          <td className="px-4 py-3 text-right">
            <CopyButton text={installCommand} label="Copy" size="xs" />
          </td>
        </>
      );
    },
    [packageManager]
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <Container size="xl" padding="md" className="py-8">
        <PageHeader
          title="Tool Registry"
          description="Search npm packages indexed as AI agent tools. Filter by category, health status, or keyword."
          size="lg"
        />

        {/* Search and filters section */}
        <div className="space-y-4 mb-6">
          {/* Search input */}
          <Input
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Filter row */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-start sm:items-center">
            {/* Category filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground-secondary whitespace-nowrap">
                Category:
              </span>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                size="sm"
                className="min-w-[150px]"
                options={[
                  { value: 'all', label: 'All Categories' },
                  ...availableCategories.map((cat) => ({
                    value: cat,
                    label: cat.charAt(0).toUpperCase() + cat.slice(1),
                  })),
                ]}
              />
            </div>

            {/* Health filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground-secondary whitespace-nowrap">
                Health:
              </span>
              <Select
                value={healthFilter}
                onChange={(e) => setHealthFilter(e.target.value)}
                size="sm"
                className="min-w-[130px]"
                options={[
                  { value: 'all', label: 'All Tools' },
                  { value: 'healthy', label: 'Healthy Only' },
                  { value: 'broken', label: 'Broken Only' },
                ]}
              />
            </div>

            {/* Sort dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground-secondary whitespace-nowrap">
                Sort:
              </span>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                size="sm"
                className="min-w-[150px]"
                options={[
                  { value: 'downloads', label: 'Downloads' },
                  { value: 'likes', label: 'Likes' },
                  { value: 'recent', label: 'Recent' },
                  { value: 'name', label: 'Name (A-Z)' },
                ]}
              />
            </div>

            {/* Clear filters button */}
            {(categoryFilter !== 'all' || healthFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCategoryFilter('all');
                  setHealthFilter('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Package manager selector */}
          <PackageManagerSelector value={packageManager} onChange={setPackageManager} />
        </div>

        {/* Loading state */}
        {loading && <LoadingState message="Loading tools..." size="lg" />}

        {/* Error state */}
        {error && <div className="text-center py-12 text-error">Error: {error}</div>}

        {/* Tool table */}
        {!loading && !error && filteredTools.length > 0 && (
          <div className="border border-border rounded-lg overflow-hidden">
            <TableVirtuoso
              style={{ height: 'calc(100vh - 400px)', minHeight: '400px' }}
              data={filteredTools}
              overscan={50}
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
                TableHead: (props) => <thead {...props} className="bg-surface-secondary sticky top-0 z-10" />,
                TableBody: (props) => <tbody {...props} />,
                TableRow: (props) => (
                  <tr
                    {...props}
                    className="border-b border-border bg-white dark:bg-zinc-900 hover:bg-surface transition-all duration-150 group"
                  />
                ),
              }}
            />
          </div>
        )}

        {/* Results count */}
        {!loading && !error && filteredTools.length > 0 && (
          <div className="mt-4 text-sm text-foreground-tertiary">
            Showing {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        )}

        {/* Empty States */}
        {!loading && !error && filteredTools.length === 0 && (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6 pb-6">
              {searchQuery ? (
                <EmptyState
                  icon="search"
                  title={`No tools found matching "${searchQuery}"`}
                  description="Try adjusting your search terms or filters."
                  action={
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button variant="default" onClick={() => setSearchQuery('')}>
                        Clear Search
                      </Button>
                      {(categoryFilter !== 'all' || healthFilter !== 'all') && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setCategoryFilter('all');
                            setHealthFilter('all');
                          }}
                        >
                          Clear All Filters
                        </Button>
                      )}
                    </div>
                  }
                />
              ) : categoryFilter !== 'all' || healthFilter !== 'all' ? (
                <EmptyState
                  icon="search"
                  title="No tools match your filters"
                  description="Try adjusting or clearing your filters to see more tools."
                  action={
                    <Button
                      variant="default"
                      onClick={() => {
                        setCategoryFilter('all');
                        setHealthFilter('all');
                      }}
                    >
                      Clear All Filters
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  icon="puzzle"
                  title="No tools yet"
                  description="Be the first to publish a tool and help AI agents gain new capabilities."
                  action={
                    <Button
                      variant="default"
                      onClick={() =>
                        window.open('https://github.com/tpmjs/tpmjs', '_blank', 'noopener')
                      }
                    >
                      <Icon icon="github" size="sm" className="mr-2" />
                      View Documentation
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        )}
      </Container>
    </div>
  );
}
