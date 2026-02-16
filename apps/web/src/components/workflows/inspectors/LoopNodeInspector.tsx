'use client';

import { Input } from '@tpmjs/ui/Input/Input';
import { Label } from '@tpmjs/ui/Label/Label';
import type { Node } from '@xyflow/react';

interface LoopNodeInspectorProps {
  node: Node;
  onUpdate: (nodeId: string, data: Record<string, unknown>) => void;
  nodes: Node[];
  edges: Array<{ source: string; target: string; sourceHandle?: string | null }>;
}

export function LoopNodeInspector({ node, onUpdate }: LoopNodeInspectorProps): React.ReactElement {
  const data = node.data as Record<string, unknown>;
  const config = (data.config as Record<string, unknown>) || {};

  const updateConfig = (updates: Record<string, unknown>) => {
    onUpdate(node.id, {
      ...data,
      config: { ...config, ...updates },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="loop-array" className="mb-1 text-xs">
          Array Path
        </Label>
        <Input
          id="loop-array"
          value={(config.arrayPath as string) || ''}
          onChange={(e) => updateConfig({ arrayPath: e.target.value })}
          placeholder="{{input.items}}"
          className="font-mono text-xs"
        />
        <p className="text-[10px] text-foreground-tertiary mt-1">
          Path to the array to iterate over.
        </p>
      </div>

      <div>
        <Label htmlFor="loop-max" className="mb-1 text-xs">
          Max Iterations
        </Label>
        <Input
          id="loop-max"
          type="number"
          value={(config.maxIterations as number) || 100}
          onChange={(e) =>
            updateConfig({ maxIterations: Number.parseInt(e.target.value, 10) || 100 })
          }
          min={1}
          max={1000}
          className="text-xs"
        />
        <p className="text-[10px] text-foreground-tertiary mt-1">
          Safety limit to prevent infinite loops.
        </p>
      </div>
    </div>
  );
}
