'use client';

import { Checkbox } from '@tpmjs/ui/Checkbox/Checkbox';
import { useCallback, useEffect, useState } from 'react';

interface RemoteTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

interface Server {
  id: string;
  name: string;
  tools: RemoteTool[];
  status: string;
}

interface CollectionCustomTool {
  id: string;
  serverId: string;
  toolName: string;
  displayName: string | null;
  note: string | null;
}

interface CustomServerToolPickerProps {
  collectionId: string;
  server: Server;
}

export function CustomServerToolPicker({ collectionId, server }: CustomServerToolPickerProps) {
  const [enabledTools, setEnabledTools] = useState<Map<string, CollectionCustomTool>>(new Map());
  const [togglingTool, setTogglingTool] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEnabledTools = useCallback(async () => {
    try {
      const res = await fetch(`/api/collections/${collectionId}/custom-tools`);
      const data = await res.json();

      if (data.success) {
        const toolMap = new Map<string, CollectionCustomTool>();
        for (const ct of data.data.customTools) {
          if (ct.serverId === server.id) {
            toolMap.set(ct.toolName, ct);
          }
        }
        setEnabledTools(toolMap);
      }
    } catch (err) {
      console.error('Failed to fetch collection custom tools:', err);
    } finally {
      setIsLoading(false);
    }
  }, [collectionId, server.id]);

  useEffect(() => {
    fetchEnabledTools();
  }, [fetchEnabledTools]);

  const toggleTool = async (toolName: string) => {
    setTogglingTool(toolName);

    const existing = enabledTools.get(toolName);

    try {
      if (existing) {
        // Remove from collection
        const res = await fetch(`/api/collections/${collectionId}/custom-tools/${existing.id}`, {
          method: 'DELETE',
        });
        const data = await res.json();

        if (data.success) {
          setEnabledTools((prev) => {
            const next = new Map(prev);
            next.delete(toolName);
            return next;
          });
        }
      } else {
        // Add to collection
        const res = await fetch(`/api/collections/${collectionId}/custom-tools`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serverId: server.id, toolName }),
        });
        const data = await res.json();

        if (data.success) {
          setEnabledTools((prev) => {
            const next = new Map(prev);
            next.set(toolName, data.data);
            return next;
          });
        }
      }
    } catch (err) {
      console.error('Failed to toggle tool:', err);
    } finally {
      setTogglingTool(null);
    }
  };

  const tools = Array.isArray(server.tools) ? server.tools : [];

  if (tools.length === 0) {
    return (
      <p className="text-xs text-foreground-tertiary py-2">
        {server.status !== 'synced'
          ? 'Server not synced. Click the sync button to discover tools.'
          : 'No tools found on this server.'}
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 bg-surface-secondary rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-xs text-foreground-tertiary mb-2">
        Select tools to add to this collection ({enabledTools.size}/{tools.length} enabled)
      </p>
      {tools.map((tool) => {
        const isEnabled = enabledTools.has(tool.name);
        const isToggling = togglingTool === tool.name;

        return (
          <div
            key={tool.name}
            className="flex items-start gap-3 py-2 px-2 rounded hover:bg-surface-secondary/50 transition-colors"
          >
            <div className="pt-0.5">
              <Checkbox
                size="sm"
                checked={isEnabled}
                disabled={isToggling}
                onChange={() => toggleTool(tool.name)}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground font-mono">{tool.name}</span>
                {isToggling && <span className="text-xs text-foreground-tertiary">Saving...</span>}
              </div>
              {tool.description && (
                <p className="text-xs text-foreground-secondary mt-0.5 line-clamp-2">
                  {tool.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
