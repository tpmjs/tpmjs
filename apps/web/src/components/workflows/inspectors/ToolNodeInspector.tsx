'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Label } from '@tpmjs/ui/Label/Label';
import type { Node } from '@xyflow/react';
import { useEffect, useState } from 'react';
import { SchemaFormGenerator } from '../SchemaFormGenerator';

interface ToolNodeInspectorProps {
  node: Node;
  onUpdate: (nodeId: string, data: Record<string, unknown>) => void;
  nodes: Node[];
  edges: Array<{ source: string; target: string; sourceHandle?: string | null }>;
}

interface ToolDetail {
  id: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown> | null;
  importHealth: string | null;
  package: { npmPackageName: string; category: string };
}

export function ToolNodeInspector({
  node,
  onUpdate,
  nodes,
  edges,
}: ToolNodeInspectorProps): React.ReactElement {
  const data = node.data as Record<string, unknown>;
  const config = (data.config as Record<string, unknown>) || {};
  const toolId = data.toolId as string | undefined;
  const [tool, setTool] = useState<ToolDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!toolId) return;
    setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    fetch(`/api/tools/${toolId}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setTool(result.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [toolId]);

  const updateConfig = (key: string, value: unknown) => {
    onUpdate(node.id, {
      ...data,
      config: {
        ...config,
        params: { ...(config.params as Record<string, unknown>), [key]: value },
      },
    });
  };

  if (!toolId) {
    return (
      <div className="text-sm text-foreground-tertiary">
        No tool selected. Drag a tool from the palette.
      </div>
    );
  }

  if (loading) {
    return <div className="text-sm text-foreground-tertiary">Loading tool details...</div>;
  }

  return (
    <div className="space-y-4">
      {tool && (
        <>
          <div className="bg-surface-secondary rounded-lg p-3">
            <p className="text-xs font-medium text-foreground">{tool.name}</p>
            <p className="text-xs text-foreground-tertiary mt-0.5">{tool.package.npmPackageName}</p>
            {tool.description && (
              <p className="text-xs text-foreground-secondary mt-1 line-clamp-2">
                {tool.description}
              </p>
            )}
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" size="sm">
                {tool.package.category}
              </Badge>
              {tool.importHealth && (
                <Badge
                  variant={tool.importHealth === 'HEALTHY' ? 'default' : 'secondary'}
                  size="sm"
                >
                  {tool.importHealth.toLowerCase()}
                </Badge>
              )}
            </div>
          </div>

          {/* Parameters form from schema */}
          {tool.inputSchema ? (
            <div>
              <Label className="mb-2 text-xs">Parameters</Label>
              <SchemaFormGenerator
                schema={tool.inputSchema}
                values={(config.params as Record<string, unknown>) || {}}
                onChange={updateConfig}
                nodes={nodes}
                edges={edges}
                currentNodeId={node.id}
              />
            </div>
          ) : (
            <div className="text-xs text-foreground-tertiary">
              No input schema available for this tool.
            </div>
          )}
        </>
      )}
    </div>
  );
}
