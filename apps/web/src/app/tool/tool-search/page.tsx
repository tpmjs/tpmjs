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
import { Header } from '@tpmjs/ui/Header/Header';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import { ProgressBar } from '@tpmjs/ui/ProgressBar/ProgressBar';
import { Select } from '@tpmjs/ui/Select/Select';
import { Tabs } from '@tpmjs/ui/Tabs/Tabs';
import Link from 'next/link';
import { createElement, useEffect, useState } from 'react';

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
 * Built with .ts-only React using createElement.
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
  const displayedTools = selectedTags.length > 0
    ? tools.filter((tool) =>
        selectedTags.some((tag) => tool.tags.includes(tag))
      )
    : tools;

  return createElement('div', { className: 'min-h-screen bg-background' }, [
    // Header
    createElement(Header, {
      key: 'header',
      title: createElement('div', { className: 'flex items-center gap-2' }, [
        createElement('span', { key: 'title', className: 'text-2xl font-bold' }, 'TPMJS'),
        createElement(Badge, { key: 'badge', variant: 'outline', size: 'sm' }, 'Beta'),
      ]),
      actions: createElement('div', { className: 'flex items-center gap-3' }, [
        createElement(Button, { key: 'docs', variant: 'ghost', size: 'sm' }, 'Docs'),
        createElement(
          'a',
          {
            key: 'github',
            href: 'https://github.com/tpmjs/tpmjs',
            target: '_blank',
            rel: 'noopener noreferrer',
            className: 'text-foreground-secondary hover:text-foreground transition-colors',
          },
          createElement(Icon, { icon: 'github', size: 'md' })
        ),
        createElement(Button, { key: 'publish', variant: 'default', size: 'sm' }, 'Publish Tool'),
      ]),
      sticky: true,
      size: 'md',
    }),

    // Main content
    createElement(Container, { key: 'container', size: 'xl', padding: 'md', className: 'py-8' }, [
      // Page header
      createElement('div', { key: 'page-header', className: 'space-y-4 mb-8' }, [
        createElement(
          'h1',
          { key: 'title', className: 'text-4xl font-bold text-foreground' },
          'Tool Registry'
        ),
        createElement(
          'p',
          { key: 'description', className: 'text-lg text-foreground-secondary' },
          'Discover, share, and integrate tools that give your AI agents superpowers.'
        ),
      ]),

      // Search and filters section
      createElement('div', { key: 'filters', className: 'space-y-4 mb-6' }, [
        // Search input
        createElement(Input, {
          key: 'search',
          placeholder: 'Search tools...',
          value: searchQuery,
          onChange: (e) => setSearchQuery(e.target.value),
        }),

        // Filter row
        createElement('div', { key: 'filter-row', className: 'flex flex-wrap gap-4' }, [
          // Category filter
          createElement(
            'div',
            { key: 'category', className: 'flex items-center gap-2 min-w-[200px]' },
            [
              createElement(
                'span',
                { key: 'label', className: 'text-sm font-medium text-foreground-secondary' },
                'Category:'
              ),
              createElement(Select, {
                key: 'select',
                value: categoryFilter,
                onChange: (e) => setCategoryFilter(e.target.value),
                size: 'sm',
                options: [
                  { value: 'all', label: 'All Categories' },
                  ...availableCategories.map((cat) => ({
                    value: cat,
                    label: cat.charAt(0).toUpperCase() + cat.slice(1),
                  })),
                ],
              }),
            ]
          ),

          // Clear filters button
          (categoryFilter !== 'all' || selectedTags.length > 0)
            ? createElement(
                Button,
                {
                  key: 'clear',
                  variant: 'ghost',
                  size: 'sm',
                  onClick: () => {
                    setCategoryFilter('all');
                    setSelectedTags([]);
                  },
                },
                'Clear Filters'
              )
            : null,
        ]),

        // Popular tags
        availableTags.length > 0
          ? createElement('div', { key: 'tags', className: 'flex flex-wrap gap-2' }, [
              createElement(
                'span',
                {
                  key: 'label',
                  className: 'text-sm font-medium text-foreground-secondary mr-2',
                },
                'Filter by tag:'
              ),
              ...availableTags.slice(0, 10).map((tag) =>
                createElement(
                  Badge,
                  {
                    key: tag,
                    variant: selectedTags.includes(tag) ? 'default' : 'outline',
                    size: 'sm',
                    className: 'cursor-pointer hover:bg-foreground/10 transition-colors',
                    onClick: () => {
                      setSelectedTags((prev) =>
                        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                      );
                    },
                  },
                  tag
                )
              ),
            ])
          : null,
      ]),

      // Tabs
      createElement(Tabs, {
        key: 'tabs',
        tabs: [
          { id: 'all', label: 'All Tools', count: tools.length },
          {
            id: 'featured',
            label: 'Official',
            count: tools.filter((t) => t.isOfficial).length,
          },
        ],
        activeTab,
        onTabChange: setActiveTab,
        size: 'md',
        className: 'mb-8',
      }),

      // Loading state
      loading
        ? createElement(
            'div',
            {
              key: 'loading',
              className: 'text-center py-12 text-foreground-secondary',
            },
            'Loading tools...'
          )
        : null,

      // Error state
      error
        ? createElement(
            'div',
            {
              key: 'error',
              className: 'text-center py-12 text-red-500',
            },
            `Error: ${error}`
          )
        : null,

      // Tool grid
      !loading && !error
        ? createElement(
            'div',
            {
              key: 'tools-grid',
              className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
            },
            displayedTools.length > 0
              ? displayedTools.map((tool) =>
                  createElement(Card, { key: tool.id, className: 'flex flex-col' }, [
                    createElement(CardHeader, { key: 'header' }, [
                      createElement(
                        'div',
                        {
                          key: 'title-row',
                          className: 'flex items-start justify-between gap-2',
                        },
                        [
                          createElement(CardTitle, { key: 'title' }, tool.npmPackageName),
                          tool.npmRepository
                            ? createElement(
                                'a',
                                {
                                  key: 'link',
                                  href: tool.npmRepository.url
                                    .replace('git+', '')
                                    .replace('.git', ''),
                                  target: '_blank',
                                  rel: 'noopener noreferrer',
                                  className:
                                    'text-foreground-secondary hover:text-foreground transition-colors',
                                },
                                createElement(Icon, {
                                  icon: 'externalLink',
                                  size: 'sm',
                                })
                              )
                            : null,
                        ]
                      ),
                      createElement(CardDescription, { key: 'description' }, tool.description),
                    ]),
                    createElement(CardContent, { key: 'content', className: 'flex-1 space-y-4' }, [
                      // Category badge and version
                      createElement(
                        'div',
                        {
                          key: 'category',
                          className: 'flex items-center gap-2 flex-wrap',
                        },
                        [
                          createElement(
                            Badge,
                            {
                              key: 'badge',
                              variant: 'secondary',
                              size: 'sm',
                            },
                            tool.category
                          ),
                          createElement(
                            'span',
                            {
                              key: 'version',
                              className: 'text-xs text-foreground-tertiary',
                            },
                            `v${tool.npmVersion}`
                          ),
                          tool.isOfficial
                            ? createElement(
                                Badge,
                                {
                                  key: 'official',
                                  variant: 'default',
                                  size: 'sm',
                                },
                                'Official'
                              )
                            : null,
                        ]
                      ),

                      // Tags
                      tool.tags.length > 0
                        ? createElement(
                            'div',
                            { key: 'tags', className: 'flex flex-wrap gap-2' },
                            tool.tags
                              .slice(0, 5)
                              .map((tag) =>
                                createElement(
                                  Badge,
                                  { key: tag, variant: 'outline', size: 'sm' },
                                  tag
                                )
                              )
                          )
                        : null,

                      // Quality score and downloads
                      createElement('div', { key: 'stats', className: 'space-y-2' }, [
                        createElement(
                          'div',
                          {
                            key: 'label',
                            className: 'flex items-center justify-between text-sm',
                          },
                          [
                            createElement(
                              'span',
                              { key: 'text', className: 'text-foreground-secondary' },
                              'Quality Score'
                            ),
                            createElement(
                              'span',
                              { key: 'downloads', className: 'text-foreground-tertiary' },
                              `${tool.npmDownloadsLastMonth.toLocaleString()} downloads/mo`
                            ),
                          ]
                        ),
                        createElement(ProgressBar, {
                          key: 'progress',
                          value: Number.parseFloat(tool.qualityScore) * 100,
                          variant:
                            Number.parseFloat(tool.qualityScore) >= 0.7
                              ? 'success'
                              : Number.parseFloat(tool.qualityScore) >= 0.5
                                ? 'primary'
                                : 'warning',
                          size: 'sm',
                          showLabel: true,
                        }),
                      ]),

                      // Install command
                      createElement(CodeBlock, {
                        key: 'install',
                        code: `npm install ${tool.npmPackageName}`,
                        language: 'bash',
                        size: 'sm',
                        showCopy: true,
                      }),
                    ]),
                    createElement(
                      CardFooter,
                      { key: 'footer' },
                      createElement(
                        Link,
                        { href: `/tool/${encodeURIComponent(tool.npmPackageName)}` },
                        createElement(
                          Button,
                          { variant: 'outline', size: 'sm', className: 'w-full' },
                          'View Details'
                        )
                      )
                    ),
                  ])
                )
              : [
                  createElement(
                    'div',
                    {
                      key: 'no-results',
                      className: 'col-span-full text-center py-12 text-foreground-tertiary',
                    },
                    searchQuery
                      ? `No tools found matching "${searchQuery}"`
                      : 'No tools available yet'
                  ),
                ]
          )
        : null,
    ]),
  ]);
}
