'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import { Label } from '@tpmjs/ui/Label/Label';
import type { Node } from '@xyflow/react';

interface TransformNodeInspectorProps {
  node: Node;
  onUpdate: (nodeId: string, data: Record<string, unknown>) => void;
  nodes: Node[];
  edges: Array<{ source: string; target: string; sourceHandle?: string | null }>;
}

interface FieldMapping {
  key: string;
  expression: string;
}

export function TransformNodeInspector({
  node,
  onUpdate,
}: TransformNodeInspectorProps): React.ReactElement {
  const data = node.data as Record<string, unknown>;
  const config = (data.config as Record<string, unknown>) || {};
  const mappings = (config.mappings as FieldMapping[]) || [];

  const updateMappings = (newMappings: FieldMapping[]) => {
    onUpdate(node.id, {
      ...data,
      config: { ...config, mappings: newMappings },
    });
  };

  const addMapping = () => {
    updateMappings([...mappings, { key: '', expression: '' }]);
  };

  const removeMapping = (idx: number) => {
    updateMappings(mappings.filter((_, i) => i !== idx));
  };

  const updateMapping = (idx: number, field: 'key' | 'expression', value: string) => {
    const newMappings = [...mappings];
    newMappings[idx] = {
      key: newMappings[idx]?.key ?? '',
      expression: newMappings[idx]?.expression ?? '',
      [field]: value,
    };
    updateMappings(newMappings);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Field Mappings</Label>
        <Button variant="ghost" size="sm" onClick={addMapping}>
          <Icon icon="plus" size="xs" className="mr-1" />
          Add Field
        </Button>
      </div>

      {mappings.length === 0 ? (
        <p className="text-xs text-foreground-tertiary">
          No field mappings defined. Add fields to transform the input data.
        </p>
      ) : (
        <div className="space-y-2">
          {mappings.map((mapping, idx) => (
            <div key={`mapping-${mapping.key || idx}`} className="flex gap-1 items-start">
              <div className="flex-1 space-y-1">
                <Input
                  value={mapping.key}
                  onChange={(e) => updateMapping(idx, 'key', e.target.value)}
                  placeholder="outputField"
                  className="text-xs"
                />
                <Input
                  value={mapping.expression}
                  onChange={(e) => updateMapping(idx, 'expression', e.target.value)}
                  placeholder="{{input.field}}"
                  className="text-xs font-mono"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeMapping(idx)}
                className="mt-0.5"
              >
                <Icon icon="x" size="xs" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
