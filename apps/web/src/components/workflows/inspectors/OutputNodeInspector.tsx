'use client';

import { Input } from '@tpmjs/ui/Input/Input';
import { Label } from '@tpmjs/ui/Label/Label';
import type { Node } from '@xyflow/react';

interface OutputNodeInspectorProps {
  node: Node;
  onUpdate: (nodeId: string, data: Record<string, unknown>) => void;
}

export function OutputNodeInspector({
  node,
  onUpdate,
}: OutputNodeInspectorProps): React.ReactElement {
  const data = node.data as Record<string, unknown>;
  const config = (data.config as Record<string, unknown>) || {};

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="output-description" className="mb-1 text-xs">
          Output Description
        </Label>
        <Input
          id="output-description"
          value={(config.description as string) || ''}
          onChange={(e) =>
            onUpdate(node.id, {
              ...data,
              config: { ...config, description: e.target.value },
            })
          }
          placeholder="Final workflow result"
          className="text-xs"
        />
      </div>

      <div className="bg-surface-secondary rounded-lg p-3">
        <p className="text-xs text-foreground-secondary">
          The Output node receives the result from its upstream connection and returns it as the
          workflow&apos;s final result.
        </p>
      </div>
    </div>
  );
}
