'use client';

import { Icon, type IconName } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import { useCallback, useEffect, useState } from 'react';

interface PaletteItem {
  type: string;
  label: string;
  description: string;
  icon: IconName;
  color: string;
  toolId?: string;
  agentId?: string;
  packageName?: string;
}

interface ToolResult {
  id: string;
  name: string;
  description: string;
  package: { npmPackageName: string };
}

interface AgentResult {
  id: string;
  name: string;
  description: string | null;
  provider: string;
  modelId: string;
}

interface CollectionResult {
  id: string;
  name: string;
  description: string | null;
  tools: Array<{
    tool: {
      id: string;
      name: string;
      description: string;
      package: { npmPackageName: string };
    };
  }>;
}

const LOGIC_ITEMS: PaletteItem[] = [
  {
    type: 'TRIGGER',
    label: 'Trigger',
    description: 'Workflow entry point',
    icon: 'send',
    color: 'text-blue-500',
  },
  {
    type: 'CONDITION',
    label: 'Condition',
    description: 'Branch based on condition',
    icon: 'gitFork',
    color: 'text-amber-500',
  },
  {
    type: 'LOOP',
    label: 'Loop',
    description: 'Iterate over an array',
    icon: 'loader',
    color: 'text-teal-500',
  },
  {
    type: 'TRANSFORM',
    label: 'Transform',
    description: 'Map and reshape data',
    icon: 'edit',
    color: 'text-slate-500',
  },
  {
    type: 'OUTPUT',
    label: 'Output',
    description: 'Workflow result',
    icon: 'check',
    color: 'text-emerald-500',
  },
  {
    type: 'NOTE',
    label: 'Note',
    description: 'Add a comment',
    icon: 'message',
    color: 'text-yellow-500',
  },
];

interface NodePaletteProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function NodePalette({ collapsed, onToggle }: NodePaletteProps): React.ReactElement {
  const [search, setSearch] = useState('');
  const [searchTools, setSearchTools] = useState<ToolResult[]>([]);
  const [agents, setAgents] = useState<AgentResult[]>([]);
  const [collections, setCollections] = useState<CollectionResult[]>([]);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());

  // Fetch user's agents and collections on mount
  useEffect(() => {
    fetch('/api/agents?limit=50')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAgents(data.data);
      })
      .catch(() => {});

    fetch('/api/collections?limit=50')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          // For each collection, fetch its tools
          const cols: CollectionResult[] = data.data || [];
          Promise.all(
            cols.map((col: CollectionResult) =>
              fetch(`/api/collections/${col.id}/tools?limit=50`)
                .then((res) => res.json())
                .then((result) => ({
                  ...col,
                  tools: result.success ? result.data || [] : [],
                }))
                .catch(() => ({ ...col, tools: [] }))
            )
          ).then(setCollections);
        }
      })
      .catch(() => {});
  }, []);

  // Debounced tool search
  useEffect(() => {
    if (!search || search.length < 2) {
      setSearchTools([]);
      return;
    }

    setToolsLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/tools/search?q=${encodeURIComponent(search)}&limit=10`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setSearchTools(data.results?.tools || data.data || []);
          }
        })
        .catch(() => {})
        .finally(() => setToolsLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const onDragStart = useCallback((event: React.DragEvent, item: PaletteItem) => {
    event.dataTransfer.setData('application/workflow-node', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  const toggleCollection = useCallback((id: string) => {
    setExpandedCollections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  if (collapsed) {
    return (
      <div className="w-10 border-r border-border bg-surface flex flex-col items-center py-2">
        <button
          type="button"
          onClick={onToggle}
          className="p-1.5 rounded hover:bg-surface-secondary transition-colors"
          title="Expand palette"
        >
          <Icon icon="chevronRight" size="sm" className="text-foreground-secondary" />
        </button>
      </div>
    );
  }

  const searchLower = search.toLowerCase();

  const filteredLogicItems = search
    ? LOGIC_ITEMS.filter(
        (item) =>
          item.label.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower)
      )
    : LOGIC_ITEMS;

  const filteredAgents = search
    ? agents.filter(
        (a) =>
          a.name.toLowerCase().includes(searchLower) ||
          a.description?.toLowerCase().includes(searchLower)
      )
    : agents;

  // Filter collections and their tools by search
  const filteredCollections = collections
    .map((col) => {
      if (!search) return col;
      const colMatches =
        col.name.toLowerCase().includes(searchLower) ||
        col.description?.toLowerCase().includes(searchLower);
      if (colMatches) return col;
      const matchingTools = col.tools.filter(
        (ct) =>
          ct.tool.name.toLowerCase().includes(searchLower) ||
          ct.tool.description?.toLowerCase().includes(searchLower) ||
          ct.tool.package.npmPackageName.toLowerCase().includes(searchLower)
      );
      if (matchingTools.length > 0) return { ...col, tools: matchingTools };
      return null;
    })
    .filter((col): col is CollectionResult => col !== null);

  return (
    <div className="w-[220px] border-r border-border bg-surface flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground-tertiary uppercase tracking-wider">
          Nodes
        </span>
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="p-1 rounded hover:bg-surface-secondary transition-colors"
          >
            <Icon icon="chevronLeft" size="xs" className="text-foreground-secondary" />
          </button>
        )}
      </div>

      <div className="px-3 py-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search nodes & tools..."
          className="text-xs h-7"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-3">
        {/* Logic Nodes */}
        {filteredLogicItems.length > 0 && (
          <PaletteSection title="Logic">
            {filteredLogicItems.map((item) => (
              <PaletteItemRow key={item.type} item={item} onDragStart={onDragStart} />
            ))}
          </PaletteSection>
        )}

        {/* Tool Search Results */}
        {search.length >= 2 && (
          <PaletteSection title="Tool Search">
            {toolsLoading ? (
              <p className="text-xs text-foreground-tertiary px-2 py-1">Searching...</p>
            ) : searchTools.length > 0 ? (
              searchTools.map((tool) => (
                <PaletteItemRow
                  key={tool.id}
                  item={{
                    type: 'TOOL',
                    label: tool.name,
                    description: tool.package.npmPackageName,
                    icon: 'puzzle',
                    color: 'text-purple-500',
                    toolId: tool.id,
                    packageName: tool.package.npmPackageName,
                  }}
                  onDragStart={onDragStart}
                />
              ))
            ) : (
              <p className="text-xs text-foreground-tertiary px-2 py-1">No tools found</p>
            )}
          </PaletteSection>
        )}

        {/* Collections (with tools) */}
        {filteredCollections.length > 0 && (
          <PaletteSection title="Collections">
            {filteredCollections.map((col) => {
              const isExpanded = expandedCollections.has(col.id) || search.length > 0;
              return (
                <div key={col.id}>
                  <button
                    type="button"
                    onClick={() => toggleCollection(col.id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-secondary transition-colors text-left"
                  >
                    <Icon
                      icon={isExpanded ? 'chevronDown' : 'chevronRight'}
                      size="xs"
                      className="text-foreground-tertiary flex-shrink-0"
                    />
                    <Icon icon="folder" size="xs" className="text-orange-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">{col.name}</p>
                      <p className="text-[10px] text-foreground-tertiary">
                        {col.tools.length} tool{col.tools.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </button>
                  {isExpanded && col.tools.length > 0 && (
                    <div className="ml-4 space-y-0.5">
                      {col.tools.map((ct) => (
                        <PaletteItemRow
                          key={ct.tool.id}
                          item={{
                            type: 'TOOL',
                            label: ct.tool.name,
                            description: ct.tool.package.npmPackageName,
                            icon: 'puzzle',
                            color: 'text-purple-500',
                            toolId: ct.tool.id,
                            packageName: ct.tool.package.npmPackageName,
                          }}
                          onDragStart={onDragStart}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </PaletteSection>
        )}

        {/* Agents */}
        {filteredAgents.length > 0 && (
          <PaletteSection title="Agents">
            {filteredAgents.map((agent) => (
              <PaletteItemRow
                key={agent.id}
                item={{
                  type: 'AGENT',
                  label: agent.name,
                  description: agent.modelId,
                  icon: 'terminal',
                  color: 'text-green-500',
                  agentId: agent.id,
                }}
                onDragStart={onDragStart}
              />
            ))}
          </PaletteSection>
        )}

        {/* Help text when no search */}
        {!search && collections.length === 0 && agents.length === 0 && (
          <div className="px-2 py-3 text-center">
            <p className="text-[10px] text-foreground-tertiary">
              Type to search the tool registry, or create collections and agents to see them here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PaletteSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[10px] font-semibold text-foreground-tertiary uppercase tracking-wider px-1 mb-1">
        {title}
      </h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function PaletteItemRow({
  item,
  onDragStart,
}: {
  item: PaletteItem;
  onDragStart: (event: React.DragEvent, item: PaletteItem) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      className="flex items-center gap-2 px-2 py-1.5 rounded cursor-grab hover:bg-surface-secondary transition-colors active:cursor-grabbing"
    >
      <Icon icon={item.icon} size="xs" className={item.color} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground truncate">{item.label}</p>
        <p className="text-[10px] text-foreground-tertiary truncate">{item.description}</p>
      </div>
    </div>
  );
}
