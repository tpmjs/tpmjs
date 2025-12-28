'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tpmjs/ui/Card/Card';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Container } from '@tpmjs/ui/Container/Container';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import { ProgressBar } from '@tpmjs/ui/ProgressBar/ProgressBar';
import { Select } from '@tpmjs/ui/Select/Select';
import { Spinner } from '@tpmjs/ui/Spinner/Spinner';
import { formatTimeAgo } from '@tpmjs/utils/format';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';

interface Tool {
  id: string;
  name: string;
  description: string;
  qualityScore: string;
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

type SortOption = 'downloads' | 'recent';

/** Sort tools by criterion, pushing broken tools to the bottom */
function sortTools(tools: Tool[], sortBy: SortOption): Tool[] {
  return [...tools].sort((a, b) => {
    const aIsBroken = a.importHealth === 'BROKEN' || a.executionHealth === 'BROKEN';
    const bIsBroken = b.importHealth === 'BROKEN' || b.executionHealth === 'BROKEN';
    // Always push broken tools to bottom
    if (aIsBroken && !bIsBroken) return 1;
    if (!aIsBroken && bIsBroken) return -1;
    // Within same broken status, sort by selected criterion
    if (sortBy === 'downloads') {
      const aDownloads = a.package.npmDownloadsLastMonth ?? 0;
      const bDownloads = b.package.npmDownloadsLastMonth ?? 0;
      return bDownloads - aDownloads;
    }
    // Sort by recent (createdAt descending)
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}

/**
 * Tool Registry Search Page
 *
 * Fetches tools from the /api/tools endpoint and displays them in a searchable grid.
 */
export default function ToolSearchPage(): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('downloads');
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  // Fetch tools from API
  useEffect(() => {
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Tool search page requires complex filtering logic
    const fetchTools = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();

        if (searchQuery) {
          params.set('q', searchQuery);
        }

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
          setTools(sortTools(fetchedTools, sortBy));
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
  }, [searchQuery, categoryFilter, healthFilter, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Main content */}
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
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
            {/* Category filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm font-medium text-foreground-secondary whitespace-nowrap">
                Category:
              </span>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                size="sm"
                className="flex-1 sm:flex-none sm:min-w-[150px]"
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
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm font-medium text-foreground-secondary whitespace-nowrap">
                Health:
              </span>
              <Select
                value={healthFilter}
                onChange={(e) => setHealthFilter(e.target.value)}
                size="sm"
                className="flex-1 sm:flex-none sm:min-w-[130px]"
                options={[
                  { value: 'all', label: 'All Tools' },
                  { value: 'healthy', label: 'Healthy Only' },
                  { value: 'broken', label: 'Broken Only' },
                ]}
              />
            </div>

            {/* Sort dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm font-medium text-foreground-secondary whitespace-nowrap">
                Sort:
              </span>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                size="sm"
                className="flex-1 sm:flex-none sm:min-w-[150px]"
                options={[
                  { value: 'downloads', label: 'Most Downloaded' },
                  { value: 'recent', label: 'Recent' },
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

        {/* Tool grid */}
        {!loading && !error && tools.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {tools.map((tool) => {
              const isBroken = tool.importHealth === 'BROKEN' || tool.executionHealth === 'BROKEN';
              const qualityPercent = Math.round(Number.parseFloat(tool.qualityScore) * 100);

              // Clean up repository URL
              let repoUrl = tool.package.npmRepository?.url || '';
              repoUrl = repoUrl.replace(/^git\+/, '');
              repoUrl = repoUrl.replace(/\.git$/, '');
              repoUrl = repoUrl.replace(/^git:\/\//, 'https://');
              repoUrl = repoUrl.replace(/^git@github\.com:/, 'https://github.com/');

              return (
                <Link
                  key={tool.id}
                  href={`/tool/${tool.package.npmPackageName}/${tool.name}`}
                  className="block select-text"
                >
                  <Card className="flex flex-col h-full hover:border-foreground-tertiary transition-colors cursor-pointer select-text">
                    <CardHeader className="flex-none">
                      {/* Top row: Title + metadata */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="truncate">
                            {tool.name !== 'default' ? tool.name : tool.package.npmPackageName}
                          </CardTitle>
                          <div className="text-sm text-foreground-secondary mt-1 truncate">
                            {tool.package.npmPackageName}
                          </div>
                        </div>
                        {/* Right side: downloads, version, link */}
                        <div className="flex items-center gap-2 flex-shrink-0 text-xs text-foreground-tertiary">
                          <span>{tool.package.npmDownloadsLastMonth.toLocaleString()}/mo</span>
                          <span>v{tool.package.npmVersion}</span>
                          {repoUrl && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.open(repoUrl, '_blank', 'noopener,noreferrer');
                              }}
                              className="text-foreground-secondary hover:text-foreground transition-colors cursor-pointer"
                            >
                              <Icon icon="externalLink" size="sm" />
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Description */}
                      <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                        {tool.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col gap-4">
                      {/* Category badge */}
                      <div className="flex items-center">
                        <Badge variant="secondary" size="sm">
                          {tool.package.category}
                        </Badge>
                      </div>

                      {/* Quality + Broken status row */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 flex items-center gap-2">
                          <ProgressBar
                            value={qualityPercent}
                            variant={
                              isBroken
                                ? 'danger'
                                : qualityPercent >= 70
                                  ? 'success'
                                  : qualityPercent >= 50
                                    ? 'primary'
                                    : 'warning'
                            }
                            size="sm"
                            showLabel={false}
                            className="flex-1"
                          />
                          <span className="text-xs font-medium text-foreground-secondary w-8">
                            {qualityPercent}%
                          </span>
                        </div>
                        {isBroken && (
                          <Badge variant="error" size="sm">
                            Broken
                          </Badge>
                        )}
                      </div>

                      {/* Bottom section with install command and published date */}
                      <div className="mt-auto space-y-2">
                        <div
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          role="presentation"
                        >
                          <CodeBlock
                            code={`npm install ${tool.package.npmPackageName}`}
                            language="bash"
                            size="sm"
                            showCopy={true}
                          />
                        </div>
                        {tool.package.npmPublishedAt && (
                          <div className="text-xs text-foreground-tertiary">
                            Published {formatTimeAgo(tool.package.npmPublishedAt)}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Empty States */}
        {!loading && !error && tools.length === 0 && (
          <div className="flex items-center justify-center py-24">
            <Card className="max-w-2xl w-full">
              <CardContent className="pt-6 pb-6 text-center space-y-6">
                {/* Icon/Visual Element */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-foreground-quaternary/50 flex items-center justify-center">
                    <Icon icon="x" size="lg" className="text-foreground-tertiary" />
                  </div>
                </div>

                {/* Search query with no results */}
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

                {/* Filters active but no search query */}
                {!searchQuery && (categoryFilter !== 'all' || healthFilter !== 'all') && (
                  <>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-foreground">
                        No tools match your filters
                      </h3>
                      <p className="text-foreground-secondary">
                        Try adjusting or clearing your filters to see more tools.
                      </p>
                      {categoryFilter !== 'all' && (
                        <p className="text-sm text-foreground-tertiary">
                          Current filter: Category = {categoryFilter}
                        </p>
                      )}
                      {healthFilter !== 'all' && (
                        <p className="text-sm text-foreground-tertiary">
                          Current filter: Health = {healthFilter}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        variant="default"
                        onClick={() => {
                          setCategoryFilter('all');
                          setHealthFilter('all');
                        }}
                      >
                        Clear All Filters
                      </Button>
                    </div>
                  </>
                )}

                {/* No tools at all (edge case) */}
                {!searchQuery && categoryFilter === 'all' && healthFilter === 'all' && (
                  <>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-foreground">No tools yet</h3>
                      <p className="text-foreground-secondary">
                        Be the first to publish a tool and help AI agents gain new capabilities.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        variant="default"
                        onClick={() =>
                          window.open('https://github.com/tpmjs/tpmjs', '_blank', 'noopener')
                        }
                      >
                        <Icon icon="github" size="sm" className="mr-2" />
                        View Documentation
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          window.open(
                            'https://www.npmjs.com/search?q=keywords:tpmjs-tool',
                            '_blank',
                            'noopener'
                          )
                        }
                      >
                        Browse on npm
                      </Button>
                    </div>
                    <div className="pt-4 border-t border-border mt-6">
                      <p className="text-sm text-foreground-tertiary mb-4">
                        Publishing a tool is easy:
                      </p>
                      <div className="space-y-3 text-left max-w-md mx-auto">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                            1
                          </div>
                          <p className="text-sm text-foreground-secondary">
                            Add{' '}
                            <code className="px-1.5 py-0.5 bg-muted rounded text-xs">
                              tpmjs-tool
                            </code>{' '}
                            keyword to your package.json
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                            2
                          </div>
                          <p className="text-sm text-foreground-secondary">
                            Include a{' '}
                            <code className="px-1.5 py-0.5 bg-muted rounded text-xs">tpmjs</code>{' '}
                            field with tool metadata
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                            3
                          </div>
                          <p className="text-sm text-foreground-secondary">
                            Publish to npm and your tool appears here automatically
                          </p>
                        </div>
                      </div>
                    </div>
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
