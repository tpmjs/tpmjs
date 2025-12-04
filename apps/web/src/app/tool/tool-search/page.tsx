'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@tpmjs/ui/Card/Card';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Container } from '@tpmjs/ui/Container/Container';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import { ProgressBar } from '@tpmjs/ui/ProgressBar/ProgressBar';
import { Select } from '@tpmjs/ui/Select/Select';
import { Tabs } from '@tpmjs/ui/Tabs/Tabs';
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
  package: {
    npmPackageName: string;
    npmVersion: string;
    category: string;
    npmRepository: { url: string; type: string } | null;
    isOfficial: boolean;
    npmDownloadsLastMonth: number;
  };
}

/**
 * Tool Registry Search Page
 *
 * Fetches tools from the /api/tools endpoint and displays them in a searchable grid.
 */
export default function ToolSearchPage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [officialCount, setOfficialCount] = useState(0);

  // Fetch tools from API
  useEffect(() => {
    const fetchTools = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();

        if (searchQuery) {
          params.set('q', searchQuery);
        }

        if (activeTab === 'featured') {
          params.set('official', 'true');
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

        // Fetch tools and counts in parallel
        const [toolsResponse, allCountResponse, officialCountResponse] = await Promise.all([
          fetch(`/api/tools?${params.toString()}`),
          fetch('/api/tools'),
          fetch('/api/tools?official=true'),
        ]);

        const [toolsData, allCountData, officialCountData] = await Promise.all([
          toolsResponse.json(),
          allCountResponse.json(),
          officialCountResponse.json(),
        ]);

        if (toolsData.success) {
          const fetchedTools = toolsData.data;
          setTools(fetchedTools);
          setError(null);

          // Update counts
          if (allCountData.success) {
            setTotalCount(allCountData.data.length);
          }
          if (officialCountData.success) {
            setOfficialCount(officialCountData.data.length);
          }

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
  }, [searchQuery, activeTab, categoryFilter, healthFilter]);

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

        {/* Tabs */}
        <Tabs
          tabs={[
            { id: 'all', label: 'All Tools', count: totalCount },
            {
              id: 'featured',
              label: 'Official',
              count: officialCount,
            },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          size="md"
          className="mb-8"
        />

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12 text-foreground-secondary">Loading tools...</div>
        )}

        {/* Error state */}
        {error && <div className="text-center py-12 text-red-500">Error: {error}</div>}

        {/* Tool grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.length > 0 ? (
              tools.map((tool) => (
                <Card key={tool.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle>
                          {tool.exportName !== 'default'
                            ? tool.exportName
                            : tool.package.npmPackageName}
                        </CardTitle>
                        <div className="text-sm text-foreground-secondary mt-1">
                          {tool.package.npmPackageName}
                        </div>
                      </div>
                      {tool.package.npmRepository &&
                        (() => {
                          // Clean up repository URL
                          let repoUrl = tool.package.npmRepository.url;

                          // Remove git+ prefix
                          repoUrl = repoUrl.replace(/^git\+/, '');

                          // Remove .git suffix
                          repoUrl = repoUrl.replace(/\.git$/, '');

                          // Convert git:// to https://
                          repoUrl = repoUrl.replace(/^git:\/\//, 'https://');

                          // Convert ssh URLs to https
                          repoUrl = repoUrl.replace(/^git@github\.com:/, 'https://github.com/');

                          return (
                            <a
                              href={repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-foreground-secondary hover:text-foreground transition-colors"
                            >
                              <Icon icon="externalLink" size="sm" />
                            </a>
                          );
                        })()}
                    </div>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-4">
                    {/* Category badge and version */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" size="sm">
                        {tool.package.category}
                      </Badge>
                      <span className="text-xs text-foreground-tertiary">
                        v{tool.package.npmVersion}
                      </span>
                      {tool.package.isOfficial && (
                        <Badge variant="default" size="sm">
                          Official
                        </Badge>
                      )}
                      {(tool.importHealth === 'BROKEN' || tool.executionHealth === 'BROKEN') && (
                        <Badge variant="error" size="sm">
                          <Icon icon="x" size="sm" className="mr-1" />
                          Broken
                        </Badge>
                      )}
                    </div>

                    {/* Quality score and downloads */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground-secondary">Quality Score</span>
                        <span className="text-foreground-tertiary">
                          {tool.package.npmDownloadsLastMonth.toLocaleString()} downloads/mo
                        </span>
                      </div>
                      <ProgressBar
                        value={Number.parseFloat(tool.qualityScore) * 100}
                        variant={
                          Number.parseFloat(tool.qualityScore) >= 0.7
                            ? 'success'
                            : Number.parseFloat(tool.qualityScore) >= 0.5
                              ? 'primary'
                              : 'warning'
                        }
                        size="sm"
                        showLabel={true}
                      />
                    </div>

                    {/* Install command */}
                    <CodeBlock
                      code={`npm install ${tool.package.npmPackageName}`}
                      language="bash"
                      size="sm"
                      showCopy={true}
                    />
                  </CardContent>

                  <CardFooter>
                    <Link href={`/tool/${tool.package.npmPackageName}/${tool.exportName}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))
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
