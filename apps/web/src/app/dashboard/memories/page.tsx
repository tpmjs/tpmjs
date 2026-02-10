'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import { Modal } from '@tpmjs/ui/Modal/Modal';
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@tpmjs/ui/Table/Table';
import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';

interface Memory {
  id: string;
  content: unknown;
  summary: string;
  namespace: string | null;
  tags: string[];
  source: string;
  sourceAgent: string | null;
  contentSizeBytes: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  similarity?: number;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function MemoriesPage(): React.ReactElement {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [namespaceFilter, setNamespaceFilter] = useState<string>('');
  const [namespaces, setNamespaces] = useState<string[]>([]);

  const fetchMemories = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (namespaceFilter) params.set('namespace', namespaceFilter);

      const response = await fetch(`/api/memories?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setMemories(data.data);
        // Extract unique namespaces for the filter
        const ns = new Set<string>();
        for (const m of data.data) {
          if (m.namespace) ns.add(m.namespace);
        }
        setNamespaces(Array.from(ns).sort());
      } else {
        setError(data.error || 'Failed to fetch memories');
      }
    } catch (err) {
      console.error('Failed to fetch memories:', err);
      setError('Failed to fetch memories');
    } finally {
      setIsLoading(false);
    }
  }, [namespaceFilter]);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchMemories();
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch('/api/memories/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          namespace: namespaceFilter || undefined,
          limit: 50,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setMemories(data.data);
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (err) {
      console.error('Search failed:', err);
      setError('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this memory?')) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/memories/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        setMemories((prev) => prev.filter((m) => m.id !== id));
        if (selectedMemory?.id === id) setSelectedMemory(null);
      } else {
        alert(result.error || 'Failed to delete memory');
      }
    } catch (err) {
      console.error('Failed to delete memory:', err);
      alert('Failed to delete memory');
    } finally {
      setDeletingId(null);
    }
  };

  if (error) {
    return (
      <DashboardLayout title="Memories">
        <div className="text-center py-16">
          <Icon icon="alertCircle" size="lg" className="mx-auto text-error mb-4" />
          <h2 className="text-lg font-medium text-foreground mb-2">Error</h2>
          <p className="text-foreground-secondary mb-4">{error}</p>
          <Button
            onClick={() => {
              setError(null);
              fetchMemories();
            }}
          >
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Memories"
      subtitle={
        memories.length > 0
          ? `${memories.length} memor${memories.length !== 1 ? 'ies' : 'y'}`
          : undefined
      }
    >
      {/* Search and filters */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search memories semantically..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        {namespaces.length > 0 && (
          <select
            value={namespaceFilter}
            onChange={(e) => setNamespaceFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm"
          >
            <option value="">All namespaces</option>
            {namespaces.map((ns) => (
              <option key={ns} value={ns}>
                {ns}
              </option>
            ))}
          </select>
        )}
        <Button onClick={handleSearch} disabled={isSearching}>
          <Icon icon="search" size="sm" className="mr-2" />
          {isSearching ? 'Searching...' : 'Search'}
        </Button>
        {searchQuery && (
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              fetchMemories();
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Memories Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[350px]">Summary</TableHead>
              <TableHead>Namespace</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Source</TableHead>
              {memories.some((m) => m.similarity !== undefined) && <TableHead>Score</TableHead>}
              <TableHead>Created</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [0, 1, 2].map((idx) => (
                <TableRow key={`memory-skeleton-${idx}`}>
                  <TableCell>
                    <div className="space-y-1.5">
                      <div className="h-4 w-48 bg-surface-secondary rounded animate-pulse" />
                      <div className="h-3 w-32 bg-surface-secondary rounded animate-pulse" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="h-5 w-16 bg-surface-secondary rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-5 w-20 bg-surface-secondary rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-24 bg-surface-secondary rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-20 bg-surface-secondary rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-8 w-8 bg-surface-secondary rounded animate-pulse ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : memories.length === 0 ? (
              <TableEmpty
                colSpan={7}
                icon={
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon icon="database" size="lg" className="text-primary" />
                  </div>
                }
                title="No memories yet"
                description="Memories are created by AI tools using the createMemoryTool. They provide persistent, semantically-searchable context across agent sessions."
              />
            ) : (
              memories.map((memory) => (
                <TableRow
                  key={memory.id}
                  interactive
                  onClick={() => setSelectedMemory(memory)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <p className="font-medium text-foreground truncate max-w-[320px]">
                      {memory.summary}
                    </p>
                  </TableCell>
                  <TableCell>
                    {memory.namespace ? (
                      <Badge variant="outline" size="sm">
                        {memory.namespace}
                      </Badge>
                    ) : (
                      <span className="text-foreground-tertiary text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {memory.tags.length > 0 ? (
                        memory.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} size="sm">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-foreground-tertiary text-sm">-</span>
                      )}
                      {memory.tags.length > 3 && (
                        <Badge size="sm" variant="outline">
                          +{memory.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-foreground-secondary text-sm">{memory.source}</span>
                  </TableCell>
                  {memories.some((m) => m.similarity !== undefined) && (
                    <TableCell>
                      {memory.similarity !== undefined ? (
                        <span className="text-sm font-mono text-foreground-secondary">
                          {(memory.similarity * 100).toFixed(1)}%
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <span className="text-foreground-secondary text-sm">
                      {formatDate(memory.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleDelete(memory.id, e)}
                        disabled={deletingId === memory.id}
                      >
                        <Icon icon="trash" size="xs" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Modal */}
      <Modal
        open={!!selectedMemory}
        onClose={() => setSelectedMemory(null)}
        title="Memory Details"
        size="lg"
      >
        {selectedMemory && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-foreground-secondary mb-1">Summary</h3>
              <p className="text-foreground">{selectedMemory.summary}</p>
            </div>

            <div className="flex gap-4">
              {selectedMemory.namespace && (
                <div>
                  <h3 className="text-sm font-medium text-foreground-secondary mb-1">Namespace</h3>
                  <Badge variant="outline">{selectedMemory.namespace}</Badge>
                </div>
              )}
              {selectedMemory.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-foreground-secondary mb-1">Tags</h3>
                  <div className="flex gap-1 flex-wrap">
                    {selectedMemory.tags.map((tag) => (
                      <Badge key={tag} size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 text-sm text-foreground-secondary">
              <span>Source: {selectedMemory.source}</span>
              {selectedMemory.sourceAgent && <span>Agent: {selectedMemory.sourceAgent}</span>}
              <span>Size: {(selectedMemory.contentSizeBytes / 1024).toFixed(1)}KB</span>
            </div>

            <div>
              <h3 className="text-sm font-medium text-foreground-secondary mb-1">Content</h3>
              <CodeBlock language="json" code={JSON.stringify(selectedMemory.content, null, 2)} />
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
