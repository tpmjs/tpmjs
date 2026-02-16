'use client';

import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Handle, type NodeProps, Position } from '@xyflow/react';

export interface ConditionNodeData {
  label: string;
  branches?: string[];
  status?: 'idle' | 'running' | 'completed' | 'failed';
  [key: string]: unknown;
}

export function ConditionNode({ data, selected }: NodeProps) {
  const nodeData = data as ConditionNodeData;
  const status = nodeData.status || 'idle';
  const branches = nodeData.branches || ['true', 'false'];

  return (
    <div
      className={`
        bg-surface border-2 rounded-lg shadow-sm min-w-[180px] transition-all
        ${selected ? 'border-amber-500 shadow-md' : 'border-amber-300'}
      `}
    >
      <Handle type="target" position={Position.Top} className="!bg-amber-500 !w-3 !h-3" />
      <div className="bg-amber-500 text-white px-3 py-1.5 rounded-t-[6px] flex items-center gap-2">
        <StatusDot status={status} />
        <Icon icon="gitFork" size="xs" />
        <span className="text-xs font-medium">Condition</span>
      </div>
      <div className="px-3 py-2">
        <p className="text-sm font-medium text-foreground truncate">{nodeData.label}</p>
      </div>
      <div className="flex justify-around px-2 pb-2">
        {branches.map((branch) => (
          <div key={branch} className="relative flex flex-col items-center">
            <span className="text-[10px] text-foreground-tertiary mb-1">{branch}</span>
            <Handle
              type="source"
              position={Position.Bottom}
              id={branch}
              className="!bg-amber-500 !w-2.5 !h-2.5 !relative !transform-none !left-auto !bottom-auto"
              style={{ position: 'relative', left: 'auto', bottom: 'auto', transform: 'none' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    idle: 'bg-gray-400',
    running: 'bg-amber-400 animate-pulse',
    completed: 'bg-green-400',
    failed: 'bg-red-400',
  };
  return <div className={`w-2 h-2 rounded-full ${colors[status] || colors.idle}`} />;
}
