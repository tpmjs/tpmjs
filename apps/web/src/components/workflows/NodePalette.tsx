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
  const [tools, setTools] = useState<ToolResult[]>([]);
  const [agents, setAgents] = useState<AgentResult[]>([]);
  const [toolsLoading, setToolsLoading] = useState(false);

  // Fetch user's agents on mount
  useEffect(() => {
    fetch('/api/agents?limit=50')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAgents(data.data);
      })
      .catch(() => {});
  }, []);

  // Debounced tool search
  useEffect(() => {
    if (!search || search.length < 2) {
      setTools([]);
      return;
    }

    setToolsLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/tools/search?q=${encodeURIComponent(search)}&limit=10`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setTools(data.data || []);
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

  const filteredLogicItems = search
    ? LOGIC_ITEMS.filter(
        (item) =>
          item.label.toLowerCase().includes(search.toLowerCase()) ||
          item.description.toLowerCase().includes(search.toLowerCase())
      )
    : LOGIC_ITEMS;

  const filteredAgents = search
    ? agents.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.description?.toLowerCase().includes(search.toLowerCase())
      )
    : agents;

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
          placeholder="Search nodes..."
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

        {/* Tools */}
        {(search.length >= 2 || tools.length > 0) && (
          <PaletteSection title="Tools">
            {toolsLoading ? (
              <p className="text-xs text-foreground-tertiary px-2 py-1">Searching...</p>
            ) : tools.length > 0 ? (
              tools.map((tool) => (
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
            ) : search.length >= 2 ? (
              <p className="text-xs text-foreground-tertiary px-2 py-1">No tools found</p>
            ) : null}
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
