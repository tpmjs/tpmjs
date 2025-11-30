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
  npmPackageName: string;
  npmVersion: string;
  description: string;
  category: string;
  tags: string[];
  npmRepository: { url: string; type: string } | null;
  qualityScore: string;
  isOfficial: boolean;
  npmDownloadsLastMonth: number;
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

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

        const response = await fetch(`/api/tools?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          const fetchedTools = data.data;
          setTools(fetchedTools);
          setError(null);

          // Extract unique categories and tags from all tools
          const categories = new Set<string>();
          const tags = new Set<string>();

          for (const tool of fetchedTools) {
            if (tool.category) {
              categories.add(tool.category);
            }
            for (const tag of tool.tags) {
              tags.add(tag);
            }
          }

          setAvailableCategories(Array.from(categories).sort());
          setAvailableTags(Array.from(tags).sort());
        } else {
          setError(data.error || 'Failed to fetch tools');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchTools();
  }, [searchQuery, activeTab, categoryFilter]);

  // Filter tools by selected tags (client-side)
  const displayedTools =
    selectedTags.length > 0
      ? tools.filter((tool) => selectedTags.some((tag) => tool.tags.includes(tag)))
      : tools;

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

            {/* Clear filters button */}
            {(categoryFilter !== 'all' || selectedTags.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCategoryFilter('all');
                  setSelectedTags([]);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Popular tags */}
          {availableTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-foreground-secondary mr-2">
                Filter by tag:
              </span>
              {availableTags.slice(0, 10).map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                  size="sm"
                  className="cursor-pointer hover:bg-foreground/10 transition-colors"
                  onClick={() => {
                    setSelectedTags((prev) =>
                      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                    );
                  }}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs
          tabs={[
            { id: 'all', label: 'All Tools', count: tools.length },
            {
              id: 'featured',
              label: 'Official',
              count: tools.filter((t) => t.isOfficial).length,
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
            {displayedTools.length > 0 ? (
              displayedTools.map((tool) => (
                <Card key={tool.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle>{tool.npmPackageName}</CardTitle>
                      {tool.npmRepository && (
                        <a
                          href={tool.npmRepository.url.replace('git+', '').replace('.git', '')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground-secondary hover:text-foreground transition-colors"
                        >
                          <Icon icon="externalLink" size="sm" />
                        </a>
                      )}
                    </div>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-4">
                    {/* Category badge and version */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" size="sm">
                        {tool.category}
                      </Badge>
                      <span className="text-xs text-foreground-tertiary">v{tool.npmVersion}</span>
                      {tool.isOfficial && (
                        <Badge variant="default" size="sm">
                          Official
                        </Badge>
                      )}
                    </div>

                    {/* Tags */}
                    {tool.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tool.tags.slice(0, 5).map((tag) => (
                          <Badge key={tag} variant="outline" size="sm">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Quality score and downloads */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground-secondary">Quality Score</span>
                        <span className="text-foreground-tertiary">
                          {tool.npmDownloadsLastMonth.toLocaleString()} downloads/mo
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
                      code={`npm install ${tool.npmPackageName}`}
                      language="bash"
                      size="sm"
                      showCopy={true}
                    />
                  </CardContent>

                  <CardFooter>
                    <Link href={`/tool/${tool.npmPackageName}`}>
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
