'use client';

import { Icon } from '@tpmjs/ui/Icon/Icon';
import type { NodeProps } from '@xyflow/react';

export interface NoteNodeData {
  label: string;
  content?: string;
  [key: string]: unknown;
}

export function NoteNode({ data, selected }: NodeProps) {
  const nodeData = data as NoteNodeData;

  return (
    <div
      className={`
        bg-yellow-50 dark:bg-yellow-900/20 border-2 rounded-lg shadow-sm min-w-[160px] max-w-[280px] transition-all
        ${selected ? 'border-yellow-500 shadow-md' : 'border-yellow-300'}
      `}
    >
      <div className="bg-yellow-400 dark:bg-yellow-600 text-yellow-900 dark:text-white px-3 py-1.5 rounded-t-[6px] flex items-center gap-2">
        <Icon icon="message" size="xs" />
        <span className="text-xs font-medium">Note</span>
      </div>
      <div className="px-3 py-2">
        <p className="text-sm text-foreground whitespace-pre-wrap break-words">
          {nodeData.content || nodeData.label}
        </p>
      </div>
    </div>
  );
}
