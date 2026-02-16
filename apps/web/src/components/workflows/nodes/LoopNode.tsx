'use client';

import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Handle, type NodeProps, Position } from '@xyflow/react';

export interface LoopNodeData {
  label: string;
  arrayPath?: string;
  status?: 'idle' | 'running' | 'completed' | 'failed';
  [key: string]: unknown;
}

export function LoopNode({ data, selected }: NodeProps) {
  const nodeData = data as LoopNodeData;
  const status = nodeData.status || 'idle';

  return (
    <div
      className={`
        bg-surface border-2 rounded-lg shadow-sm min-w-[180px] transition-all
        ${selected ? 'border-teal-500 shadow-md' : 'border-teal-300'}
      `}
    >
      <Handle type="target" position={Position.Top} className="!bg-teal-500 !w-3 !h-3" />
      <div className="bg-teal-500 text-white px-3 py-1.5 rounded-t-[6px] flex items-center gap-2">
        <StatusDot status={status} />
        <Icon icon="loader" size="xs" />
        <span className="text-xs font-medium">Loop</span>
      </div>
      <div className="px-3 py-2">
        <p className="text-sm font-medium text-foreground truncate">{nodeData.label}</p>
        {nodeData.arrayPath && (
          <p className="text-xs text-foreground-tertiary truncate mt-0.5 font-mono">
            {nodeData.arrayPath}
          </p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-teal-500 !w-3 !h-3" />
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    idle: 'bg-gray-400',
    running: 'bg-teal-400 animate-pulse',
    completed: 'bg-green-400',
    failed: 'bg-red-400',
  };
  return <div className={`w-2 h-2 rounded-full ${colors[status] || colors.idle}`} />;
}
