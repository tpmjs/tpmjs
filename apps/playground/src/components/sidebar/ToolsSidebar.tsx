'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@tpmjs/ui/Card/Card';
import { Input } from '@tpmjs/ui/Input/Input';
import { ToolHealthBadge } from '@tpmjs/ui/ToolHealthBadge/ToolHealthBadge';
import { ToolHealthBanner } from '@tpmjs/ui/ToolHealthBanner/ToolHealthBanner';
import { useEffect, useState } from 'react';

interface Tool {
  toolId?: string;
  packageName: string;
  exportName: string;
  description: string;
  category: string;
  version: string;
  qualityScore?: number;
  frameworks?: string[];
  env?: Array<{ name: string; description: string; required?: boolean; default?: string }>;
  importUrl?: string;
  importHealth?: 'HEALTHY' | 'BROKEN' | 'UNKNOWN';
  executionHealth?: 'HEALTHY' | 'BROKEN' | 'UNKNOWN';
  healthCheckError?: string | null;
  lastHealthCheck?: string | null;
}

export function ToolsSidebar(): React.ReactElement {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  useEffect(() => {
    async function fetchTools() {
      try {
        const response = await fetch('/api/tools');
        const data = await response.json();
        if (data.success) {
          setTools(data.tools);
        }
      } catch (error) {
        console.error('Failed to fetch tools:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchTools();
  }, []);

  const filteredTools = tools.filter(
    (tool) =>
      tool.packageName?.toLowerCase().includes(filter.toLowerCase()) ||
      tool.exportName?.toLowerCase().includes(filter.toLowerCase()) ||
      tool.description?.toLowerCase().includes(filter.toLowerCase()) ||
      tool.category?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <>
      <aside className="hidden w-64 border-r border-border bg-surface md:block">
        <div className="flex h-full flex-col p-4">
          <h2 className="mb-4 text-lg font-bold">
            Available Tools <Badge variant="secondary">{filteredTools.length}</Badge>
          </h2>

          <Input
            type="text"
            placeholder="Filter tools..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mb-4"
          />

          <div className="flex-1 space-y-2 overflow-y-auto">
            {loading ? (
              <p className="text-sm text-foreground-secondary">Loading tools...</p>
            ) : filteredTools.length === 0 ? (
              <p className="text-sm text-foreground-secondary">No tools found</p>
            ) : (
              filteredTools.map((tool) => (
                <Card
                  key={`${tool.packageName}-${tool.exportName}`}
                  variant="outline"
                  className="cursor-pointer transition-all hover:bg-background hover:shadow-md"
                  onClick={() => setSelectedTool(tool)}
                >
                  <CardHeader>
                    <CardTitle className="text-sm">{tool.exportName}</CardTitle>
                    <p className="text-xs text-foreground-tertiary mt-0.5">{tool.packageName}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-foreground-secondary line-clamp-2">
                      {tool.description}
                    </p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" size="sm">
                        {tool.category}
                      </Badge>
                      <span className="text-xs text-foreground-tertiary">v{tool.version}</span>
                      <ToolHealthBadge
                        importHealth={tool.importHealth}
                        executionHealth={tool.executionHealth}
                        size="sm"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Tool Details Modal */}
      {selectedTool && (
        // biome-ignore lint/a11y/useSemanticElements: Modal backdrop - standard pattern for modal overlays with role=button
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            // Only close if clicking the backdrop itself, not the content
            if (e.target === e.currentTarget) setSelectedTool(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setSelectedTool(null);
          }}
          role="button"
          tabIndex={0}
          aria-label="Close modal"
        >
          <div className="relative mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-white dark:bg-gray-900 p-6 shadow-xl">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedTool(null)}
              className="absolute right-4 top-4 text-foreground-tertiary hover:text-foreground"
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <title>Close</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Tool header */}
            <div className="mb-6 border-b border-border pb-4">
              <h2 className="mb-2 text-2xl font-bold text-foreground">{selectedTool.exportName}</h2>
              <p className="mb-2 text-sm text-foreground-secondary">{selectedTool.packageName}</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selectedTool.category}</Badge>
                <span className="text-sm text-foreground-tertiary">v{selectedTool.version}</span>
                {selectedTool.qualityScore && (
                  <Badge variant="info">
                    Score: {(selectedTool.qualityScore * 100).toFixed(0)}%
                  </Badge>
                )}
              </div>
            </div>

            {/* Health warning banner */}
            <ToolHealthBanner
              importHealth={selectedTool.importHealth}
              executionHealth={selectedTool.executionHealth}
              healthCheckError={selectedTool.healthCheckError}
              lastHealthCheck={selectedTool.lastHealthCheck}
              className="mb-6"
            />

            {/* Description */}
            <div className="mb-6">
              <h3 className="mb-2 text-lg font-semibold text-foreground">Description</h3>
              <p className="text-sm text-foreground-secondary">{selectedTool.description}</p>
            </div>

            {/* Frameworks */}
            {selectedTool.frameworks && selectedTool.frameworks.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-2 text-lg font-semibold text-foreground">Frameworks</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTool.frameworks.map((framework) => (
                    <Badge key={framework} variant="outline" size="sm">
                      {framework}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Environment Variables */}
            {selectedTool.env && selectedTool.env.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  Environment Variables
                </h3>
                <div className="space-y-2">
                  {selectedTool.env.map((envVar) => (
                    <div key={envVar.name} className="rounded border border-border bg-surface p-3">
                      <div className="mb-1 flex items-center gap-2">
                        <code className="text-sm font-mono text-foreground">{envVar.name}</code>
                        {envVar.required && (
                          <Badge variant="error" size="sm">
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-foreground-secondary">{envVar.description}</p>
                      {envVar.default && (
                        <p className="mt-1 text-xs text-foreground-tertiary">
                          Default: <code className="font-mono">{envVar.default}</code>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Import URL */}
            {selectedTool.importUrl && (
              <div className="mb-6">
                <h3 className="mb-2 text-lg font-semibold text-foreground">Import URL</h3>
                <code className="block rounded bg-surface p-3 text-xs font-mono text-foreground-secondary break-all">
                  {selectedTool.importUrl}
                </code>
              </div>
            )}

            {/* Tool ID */}
            {selectedTool.toolId && (
              <div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">Tool ID</h3>
                <code className="block rounded bg-surface p-3 text-xs font-mono text-foreground-secondary">
                  {selectedTool.toolId}
                </code>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
