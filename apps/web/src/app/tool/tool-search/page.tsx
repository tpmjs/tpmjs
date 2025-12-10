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
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';

interface Tool {
  id: string;
  exportName: string;
  description: string;
  qualityScore: string;
  importHealth?: 'HEALTHY' | 'BROKEN' | 'UNKNOWN';
  executionHealth?: 'HEALTHY' | 'BROKEN' | 'UNKNOWN';
  createdAt: string;
  package: {
    npmPackageName: string;
    npmVersion: string;
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
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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
          <h1 className="text-4xl font-bold text-foreground">Tool Registry</h1>
          <p className="text-lg text-foreground-secondary">
            Discover, share, and integrate tools that give your AI agents superpowers.
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
          <div className="flex flex-wrap gap-4">
            {/* Category filter */}
            <div className="flex items-center gap-2 min-w-[200px]">
              <span className="text-sm font-medium text-foreground-secondary">Category:</span>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                size="sm"
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
            <div className="flex items-center gap-2 min-w-[200px]">
              <span className="text-sm font-medium text-foreground-secondary">Health:</span>
              <Select
                value={healthFilter}
                onChange={(e) => setHealthFilter(e.target.value)}
                size="sm"
                options={[
                  { value: 'all', label: 'All Tools' },
                  { value: 'healthy', label: 'Healthy Only' },
                  { value: 'broken', label: 'Broken Only' },
                ]}
              />
            </div>

            {/* Sort dropdown */}
            <div className="flex items-center gap-2 min-w-[200px]">
              <span className="text-sm font-medium text-foreground-secondary">Sort:</span>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                size="sm"
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
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.length > 0 ? (
              // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Tool card rendering requires complex conditional UI
              tools.map((tool) => {
                const isBroken =
                  tool.importHealth === 'BROKEN' || tool.executionHealth === 'BROKEN';
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
                    href={`/tool/${tool.package.npmPackageName}/${tool.exportName}`}
                    className="block select-text"
                  >
                    <Card className="flex flex-col h-full hover:border-foreground-tertiary transition-colors cursor-pointer select-text">
                      <CardHeader className="flex-none">
                        {/* Top row: Title + metadata */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="truncate">
                              {tool.exportName !== 'default'
                                ? tool.exportName
                                : tool.package.npmPackageName}
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

                        {/* Install command - onClick prevents propagation to parent Link */}
                        <div
                          className="mt-auto"
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
                      </CardContent>
                    </Card>
                  </Link>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12 text-foreground-tertiary">
                {searchQuery
                  ? `No tools found matching "${searchQuery}"`
                  : 'No tools available yet'}
              </div>
            )}
          </div>
        )}
      </Container>
    </div>
  );
}
