'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Card, CardContent } from '@tpmjs/ui/Card/Card';
import { Container } from '@tpmjs/ui/Container/Container';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import { Select } from '@tpmjs/ui/Select/Select';
import { Spinner } from '@tpmjs/ui/Spinner/Spinner';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TableVirtuoso } from 'react-virtuoso';
import { AppHeader } from '~/components/AppHeader';
import { CopyButton } from '~/components/CopyButton';
import {
  PackageManagerSelector,
  getInstallCommand,
  usePackageManager,
} from '~/components/PackageManagerSelector';

interface Tool {
  id: string;
  name: string;
  description: string;
  qualityScore: string;
  likeCount?: number;
  importHealth?: 'HEALTHY' | 'BROKEN' | 'UNKNOWN';
  executionHealth?: 'HEALTHY' | 'BROKEN' | 'UNKNOWN';
  createdAt: string;
  package: {
    npmPackageName: string;
    npmVersion: string;
    npmPublishedAt: string;
    category: string;
    npmRepository: { url: string; type: string } | null;
    isOfficial: boolean;
    npmDownloadsLastMonth: number;
  };
}

type SortOption = 'downloads' | 'likes' | 'recent' | 'name';

function formatDownloads(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
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
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [packageManager, setPackageManager] = usePackageManager();

  // Fetch tools from API
  useEffect(() => {
    const fetchTools = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();

        if (categoryFilter !== 'all') {
          params.set('category', categoryFilter);
        }

        if (healthFilter === 'healthy') {
          params.set('importHealth', 'HEALTHY');
          params.set('executionHealth', 'HEALTHY');
        } else if (healthFilter === 'broken') {
          params.set('broken', 'true');
        }

        // Fetch all tools (no pagination limit)
        params.set('limit', '1000');
        const toolsResponse = await fetch(`/api/tools?${params.toString()}`);
        const toolsData = await toolsResponse.json();

        if (toolsData.success) {
          const fetchedTools = toolsData.data;
          setTools(fetchedTools);
          setError(null);

          // Extract unique categories from all tools
          const categories = new Set<string>();
          for (const tool of fetchedTools) {
            if (tool.package.category) {
              categories.add(tool.package.category);
            }
          }
          setAvailableCategories(Array.from(categories).sort());
        } else {
          setError(toolsData.error || 'Failed to fetch tools');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchTools();
  }, [categoryFilter, healthFilter]);

  // Filter and sort tools
  const filteredTools = useMemo(() => {
    let result = tools;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (tool) =>
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
      <tr className="bg-surface text-left text-sm font-medium text-foreground-secondary">
        <th className="px-4 py-3 w-[300px]">Name</th>
        <th className="px-4 py-3 w-[120px]">Category</th>
        <th className="px-4 py-3 w-[100px] text-right">Downloads</th>
        <th className="px-4 py-3 w-[80px] text-right">Likes</th>
        <th className="px-4 py-3 w-[120px] text-right">Install</th>
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
              className="group block"
            >
              <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                {displayName}
                {isBroken && (
                  <Badge variant="error" size="sm" className="ml-2">
                    Broken
                  </Badge>
                )}
              </div>
              <div className="text-xs text-foreground-tertiary truncate max-w-[280px]">
                {tool.package.npmPackageName}
              </div>
            </Link>
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
            <span className="inline-flex items-center gap-1 text-sm text-foreground-secondary">
              <Icon icon="heart" size="xs" />
              {tool.likeCount ?? 0}
            </span>
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
        {/* Page header */}
        <div className="space-y-4 mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            Tool Registry
          </h1>
          <p className="text-lg text-foreground-secondary">
            Search npm packages indexed as AI agent tools. Filter by category, health status, or
            keyword.
          </p>
        </div>

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
        {loading && (
          <div className="flex items-center justify-center py-24 gap-4">
            <Spinner size="lg" />
            <span className="text-foreground-secondary font-mono text-sm tracking-wide">
              Loading tools...
            </span>
          </div>
        )}

        {/* Error state */}
        {error && <div className="text-center py-12 text-red-500">Error: {error}</div>}

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
                TableHead: (props) => <thead {...props} className="bg-surface sticky top-0 z-10" />,
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
          <div className="flex items-center justify-center py-24">
            <Card className="max-w-2xl w-full">
              <CardContent className="pt-6 pb-6 text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Icon icon="x" size="lg" className="text-foreground-tertiary" />
                  </div>
                </div>

                {searchQuery && (
                  <>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-foreground">
                        No tools found matching &ldquo;{searchQuery}&rdquo;
                      </h3>
                      <p className="text-foreground-secondary">
                        We couldn&apos;t find any tools matching your search. Try adjusting your
                        search terms or filters.
                      </p>
                    </div>
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
                  </>
                )}

                {!searchQuery && (categoryFilter !== 'all' || healthFilter !== 'all') && (
                  <>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-foreground">
                        No tools match your filters
                      </h3>
                      <p className="text-foreground-secondary">
                        Try adjusting or clearing your filters to see more tools.
                      </p>
                    </div>
                    <Button
                      variant="default"
                      onClick={() => {
                        setCategoryFilter('all');
                        setHealthFilter('all');
                      }}
                    >
                      Clear All Filters
                    </Button>
                  </>
                )}

                {!searchQuery && categoryFilter === 'all' && healthFilter === 'all' && (
                  <>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-foreground">No tools yet</h3>
                      <p className="text-foreground-secondary">
                        Be the first to publish a tool and help AI agents gain new capabilities.
                      </p>
                    </div>
                    <Button
                      variant="default"
                      onClick={() =>
                        window.open('https://github.com/tpmjs/tpmjs', '_blank', 'noopener')
                      }
                    >
                      <Icon icon="github" size="sm" className="mr-2" />
                      View Documentation
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </Container>
    </div>
  );
}
