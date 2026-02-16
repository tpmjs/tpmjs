'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import { Label } from '@tpmjs/ui/Label/Label';
import type { Node } from '@xyflow/react';
import { AgentNodeInspector } from './inspectors/AgentNodeInspector';
import { ConditionNodeInspector } from './inspectors/ConditionNodeInspector';
import { LoopNodeInspector } from './inspectors/LoopNodeInspector';
import { OutputNodeInspector } from './inspectors/OutputNodeInspector';
import { ToolNodeInspector } from './inspectors/ToolNodeInspector';
import { TransformNodeInspector } from './inspectors/TransformNodeInspector';

interface NodeInspectorProps {
  node: Node;
  onUpdate: (nodeId: string, data: Record<string, unknown>) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
  nodes: Node[];
  edges: Array<{ source: string; target: string; sourceHandle?: string | null }>;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  TRIGGER: { label: 'Trigger', color: 'bg-blue-500' },
  TOOL: { label: 'Tool', color: 'bg-purple-500' },
  AGENT: { label: 'Agent', color: 'bg-green-600' },
  CONDITION: { label: 'Condition', color: 'bg-amber-500' },
  LOOP: { label: 'Loop', color: 'bg-teal-500' },
  TRANSFORM: { label: 'Transform', color: 'bg-slate-500' },
  OUTPUT: { label: 'Output', color: 'bg-emerald-500' },
  NOTE: { label: 'Note', color: 'bg-yellow-400' },
};

export function NodeInspector({
  node,
  onUpdate,
  onDelete,
  onClose,
  nodes,
  edges,
}: NodeInspectorProps): React.ReactElement {
  const nodeType = (node.data as Record<string, unknown>).nodeType as string;
  const typeInfo = TYPE_LABELS[nodeType] || { label: 'Unknown', color: 'bg-gray-500' };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(node.id, { ...node.data, label: e.target.value });
  };

  return (
    <div className="w-[320px] border-l border-border bg-surface flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge size="sm" className={`${typeInfo.color} text-white`}>
            {typeInfo.label}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => onDelete(node.id)} title="Delete node">
            <Icon icon="trash" size="xs" className="text-error" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} title="Close inspector">
            <Icon icon="x" size="xs" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Label field (common to all) */}
        <div>
          <Label htmlFor="node-label" className="mb-1 text-xs">
            Label
          </Label>
          <Input
            id="node-label"
            value={(node.data as Record<string, unknown>).label as string}
            onChange={handleLabelChange}
            className="text-sm"
          />
        </div>

        {/* Type-specific inspector */}
        {nodeType === 'TOOL' && (
          <ToolNodeInspector node={node} onUpdate={onUpdate} nodes={nodes} edges={edges} />
        )}
        {nodeType === 'AGENT' && (
          <AgentNodeInspector node={node} onUpdate={onUpdate} nodes={nodes} edges={edges} />
        )}
        {nodeType === 'CONDITION' && (
          <ConditionNodeInspector node={node} onUpdate={onUpdate} nodes={nodes} edges={edges} />
        )}
        {nodeType === 'LOOP' && (
          <LoopNodeInspector node={node} onUpdate={onUpdate} nodes={nodes} edges={edges} />
        )}
        {nodeType === 'TRANSFORM' && (
          <TransformNodeInspector node={node} onUpdate={onUpdate} nodes={nodes} edges={edges} />
        )}
        {nodeType === 'OUTPUT' && <OutputNodeInspector node={node} onUpdate={onUpdate} />}
      </div>
    </div>
  );
}
