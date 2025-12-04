'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@tpmjs/ui/Card/Card';
import { Input } from '@tpmjs/ui/Input/Input';
import { useEffect, useState } from 'react';

interface Tool {
  packageName: string;
  exportName: string;
  description: string;
  category: string;
  version: string;
}

export function ToolsSidebar(): React.ReactElement {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

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
                className="cursor-pointer hover:bg-background"
              >
                <CardHeader>
                  <CardTitle className="text-sm">{tool.exportName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-foreground-secondary">{tool.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="secondary" size="sm">
                      {tool.category}
                    </Badge>
                    <span className="text-xs text-foreground-tertiary">v{tool.version}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
