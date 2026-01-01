'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tpmjs/ui/Card/Card';
import { Input } from '@tpmjs/ui/Input/Input';
import { ProgressBar } from '@tpmjs/ui/ProgressBar/ProgressBar';
import { Select } from '@tpmjs/ui/Select/Select';
import { Spinner } from '@tpmjs/ui/Spinner/Spinner';
import { useCallback, useEffect, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

interface ToolIdea {
  name: string;
  description: string;
  category: string;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
    defaultValue: string;
  }>;
  returns: {
    type: string;
    description: string;
  };
  aiAgent: {
    useCase: string;
    limitations: string;
    examples: string[];
  };
  tags: string[];
  qualityScore: number;
  skeleton: {
    verb: string;
    object: string;
    context: string | null;
  };
}

interface ApiResponse {
  success: boolean;
  data: ToolIdea[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    categories: string[];
    verbs: string[];
  };
}

export function ToolIdeasClient() {
  const [tools, setTools] = useState<ToolIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [verb, setVerb] = useState('');
  const [minQuality, setMinQuality] = useState('0');
  const [categories, setCategories] = useState<string[]>([]);
  const [verbs, setVerbs] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchTools = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (verb) params.set('verb', verb);
      if (minQuality !== '0') params.set('minQuality', minQuality);
      params.set('limit', '10000'); // Load all for client-side virtualization

      const response = await fetch(`/api/tool-ideas?${params}`);
      const data: ApiResponse = await response.json();

      if (data.success) {
        setTools(data.data);
        setTotal(data.meta.total);
        if (categories.length === 0) {
          setCategories(data.meta.categories);
        }
        if (verbs.length === 0) {
          setVerbs(data.meta.verbs);
        }
      }
    } catch (error) {
      console.error('Failed to fetch tools:', error);
    } finally {
      setLoading(false);
    }
  }, [search, category, verb, minQuality, categories.length, verbs.length]);

  useEffect(() => {
    const debounce = setTimeout(fetchTools, 300);
    return () => clearTimeout(debounce);
  }, [fetchTools]);

  const qualityColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const ToolCard = ({ tool }: { tool: ToolIdea }) => {
    const isExpanded = expandedId === tool.name;

    return (
      <Card
        className="mb-3 cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => setExpandedId(isExpanded ? null : tool.name)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-mono truncate">{tool.name}</CardTitle>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <Badge variant="secondary" size="sm">
                  {tool.category}
                </Badge>
                <Badge variant="outline" size="sm">
                  {tool.skeleton.verb}
                </Badge>
                <Badge variant="outline" size="sm">
                  {tool.skeleton.object}
                </Badge>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`text-sm font-semibold ${qualityColor(tool.qualityScore)}`}>
                {(tool.qualityScore * 100).toFixed(0)}%
              </span>
              <ProgressBar value={tool.qualityScore * 100} size="sm" className="w-16" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className={isExpanded ? '' : 'line-clamp-2'}>
            {tool.description}
          </CardDescription>

          {isExpanded && (
            <div className="mt-4 space-y-4">
              {/* Parameters */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Parameters ({tool.parameters.length})
                </h4>
                <div className="space-y-1.5">
                  {tool.parameters.map((param) => (
                    <div
                      key={param.name}
                      className="text-xs bg-surface rounded px-2 py-1.5 flex items-start gap-2"
                    >
                      <code className="font-mono text-primary">{param.name}</code>
                      <Badge variant="outline" size="sm">
                        {param.type}
                      </Badge>
                      {param.required && (
                        <Badge variant="error" size="sm">
                          required
                        </Badge>
                      )}
                      <span className="text-foreground-tertiary flex-1">{param.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Returns */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Returns</h4>
                <div className="text-xs bg-surface rounded px-2 py-1.5">
                  <code className="font-mono text-primary">{tool.returns.type}</code>
                  <span className="text-foreground-tertiary ml-2">{tool.returns.description}</span>
                </div>
              </div>

              {/* AI Agent Guidance */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">AI Agent Guidance</h4>
                <p className="text-xs text-foreground-secondary">{tool.aiAgent.useCase}</p>
                {tool.aiAgent.limitations && (
                  <p className="text-xs text-foreground-tertiary mt-1">
                    <span className="font-medium">Limitations:</span> {tool.aiAgent.limitations}
                  </p>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {tool.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Build options for Select components
  const categoryOptions = [
    { value: '', label: 'All categories' },
    ...categories.map((cat) => ({ value: cat, label: cat })),
  ];

  const verbOptions = [
    { value: '', label: 'All verbs' },
    ...verbs.map((v) => ({ value: v, label: v })),
  ];

  const qualityOptions = [
    { value: '0', label: 'Any quality' },
    { value: '0.9', label: '90%+ (Excellent)' },
    { value: '0.8', label: '80%+ (Great)' },
    { value: '0.7', label: '70%+ (Good)' },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-surface p-4 rounded-lg border border-border">
        <div>
          <label
            htmlFor="tool-search"
            className="text-xs font-medium text-foreground-secondary mb-1.5 block"
          >
            Search
          </label>
          <Input
            id="tool-search"
            type="text"
            placeholder="Search tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="sm"
          />
        </div>

        <div>
          <label
            htmlFor="tool-category"
            className="text-xs font-medium text-foreground-secondary mb-1.5 block"
          >
            Category
          </label>
          <Select
            id="tool-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={categoryOptions}
            size="sm"
          />
        </div>

        <div>
          <label
            htmlFor="tool-verb"
            className="text-xs font-medium text-foreground-secondary mb-1.5 block"
          >
            Verb
          </label>
          <Select
            id="tool-verb"
            value={verb}
            onChange={(e) => setVerb(e.target.value)}
            options={verbOptions}
            size="sm"
          />
        </div>

        <div>
          <label
            htmlFor="tool-quality"
            className="text-xs font-medium text-foreground-secondary mb-1.5 block"
          >
            Min Quality
          </label>
          <Select
            id="tool-quality"
            value={minQuality}
            onChange={(e) => setMinQuality(e.target.value)}
            options={qualityOptions}
            size="sm"
          />
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-foreground-secondary">
        <span>{loading ? 'Loading...' : `${total.toLocaleString()} tools`}</span>
        {!loading && total > 0 && <span className="text-xs">Click a tool to expand details</span>}
      </div>

      {/* Virtualized list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : tools.length === 0 ? (
        <div className="text-center py-20 text-foreground-secondary">
          No tools found matching your filters.
        </div>
      ) : (
        <div className="h-[calc(100vh-320px)] min-h-[400px]">
          <Virtuoso
            data={tools}
            itemContent={(_, tool) => <ToolCard tool={tool} />}
            overscan={200}
            style={{ height: '100%' }}
          />
        </div>
      )}
    </div>
  );
}
