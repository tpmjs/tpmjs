'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Handle, type NodeProps, Position } from '@xyflow/react';

export interface TriggerNodeData {
  label: string;
  triggerType?: string;
  status?: 'idle' | 'running' | 'completed' | 'failed';
  [key: string]: unknown;
}

export function TriggerNode({ data, selected }: NodeProps) {
  const nodeData = data as TriggerNodeData;
  const status = nodeData.status || 'idle';

  return (
    <div
      className={`
        bg-surface border-2 rounded-lg shadow-sm min-w-[180px] transition-all
        ${selected ? 'border-blue-500 shadow-md' : 'border-blue-300'}
      `}
    >
      <div className="bg-blue-500 text-white px-3 py-1.5 rounded-t-[6px] flex items-center gap-2">
        <StatusDot status={status} />
        <Icon icon="send" size="xs" />
        <span className="text-xs font-medium">Trigger</span>
      </div>
      <div className="px-3 py-2">
        <p className="text-sm font-medium text-foreground truncate">{nodeData.label}</p>
        {nodeData.triggerType && (
          <Badge variant="outline" size="sm" className="mt-1">
            {nodeData.triggerType}
          </Badge>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-3 !h-3" />
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    idle: 'bg-gray-400',
    running: 'bg-blue-400 animate-pulse',
    completed: 'bg-green-400',
    failed: 'bg-red-400',
  };
  return <div className={`w-2 h-2 rounded-full ${colors[status] || colors.idle}`} />;
}
