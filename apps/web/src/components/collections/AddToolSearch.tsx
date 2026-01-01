'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Tool {
  id: string;
  name: string;
  description: string;
  package: {
    npmPackageName: string;
    category: string;
  };
}

interface AddToolSearchProps {
  collectionId: string;
  existingToolIds: string[];
  onToolAdded: (tool: Tool) => void;
}

interface SearchResult {
  id: string;
  name: string;
  description: string;
  package: {
    npmPackageName: string;
    category: string;
  };
}

export function AddToolSearch({
  collectionId,
  existingToolIds,
  onToolAdded,
}: AddToolSearchProps): React.ReactElement {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/tools/search?q=${encodeURIComponent(searchQuery)}&limit=10`
      );
      const data = await response.json();

      if (data.success && data.results?.tools) {
        setResults(data.results.tools);
        setIsOpen(true);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setError('Search failed');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle query changes with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        search(query);
      }, 300);
    } else {
      setResults([]);
      setIsOpen(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, search]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddTool = async (tool: SearchResult) => {
    setAddingId(tool.id);
    setError(null);

    try {
      const response = await fetch(`/api/collections/${collectionId}/tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId: tool.id }),
      });

      const data = await response.json();

      if (data.success) {
        onToolAdded({
          id: tool.id,
          name: tool.name,
          description: tool.description,
          package: tool.package,
        });
        setQuery('');
        setResults([]);
        setIsOpen(false);
      } else {
        setError(data.error?.message || 'Failed to add tool');
      }
    } catch (err) {
      console.error('Failed to add tool:', err);
      setError('Failed to add tool');
    } finally {
      setAddingId(null);
    }
  };

  // Filter out already added tools
  const filteredResults = results.filter((tool) => !existingToolIds.includes(tool.id));

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Icon
          icon="search"
          size="sm"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for tools to add..."
          className="pl-9"
          onFocus={() => {
            if (filteredResults.length > 0) {
              setIsOpen(true);
            }
          }}
        />
        {isSearching && (
          <Icon
            icon="loader"
            size="sm"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-tertiary animate-spin"
          />
        )}
      </div>

      {error && <p className="text-sm text-error mt-2">{error}</p>}

      {isOpen && filteredResults.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-background border border-border rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {filteredResults.map((tool) => (
            <div
              key={tool.id}
              className="p-3 hover:bg-surface-secondary transition-colors border-b border-border last:border-b-0"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground truncate">{tool.name}</span>
                    <Badge variant="secondary" size="sm">
                      {tool.package.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground-secondary line-clamp-2">
                    {tool.description}
                  </p>
                  <p className="text-xs text-foreground-tertiary mt-1">
                    {tool.package.npmPackageName}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleAddTool(tool)}
                  loading={addingId === tool.id}
                  disabled={addingId !== null}
                >
                  <Icon icon="plus" size="sm" className="mr-1" />
                  Add
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && query.trim() && filteredResults.length === 0 && !isSearching && (
        <div className="absolute z-50 w-full mt-2 bg-background border border-border rounded-lg shadow-lg p-4 text-center">
          <p className="text-foreground-secondary">
            {results.length > 0
              ? 'All matching tools are already in this collection'
              : 'No tools found matching your search'}
          </p>
        </div>
      )}
    </div>
  );
}
