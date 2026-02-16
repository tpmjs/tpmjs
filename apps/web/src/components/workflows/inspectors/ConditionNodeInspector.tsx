'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import { Label } from '@tpmjs/ui/Label/Label';
import { Select } from '@tpmjs/ui/Select/Select';
import type { Node } from '@xyflow/react';

interface ConditionNodeInspectorProps {
  node: Node;
  onUpdate: (nodeId: string, data: Record<string, unknown>) => void;
  nodes: Node[];
  edges: Array<{ source: string; target: string; sourceHandle?: string | null }>;
}

const OPERATORS = [
  { value: '===', label: 'equals (===)' },
  { value: '!==', label: 'not equals (!==)' },
  { value: '>', label: 'greater than (>)' },
  { value: '<', label: 'less than (<)' },
  { value: 'includes', label: 'includes' },
  { value: 'exists', label: 'exists (truthy)' },
];

export function ConditionNodeInspector({
  node,
  onUpdate,
}: ConditionNodeInspectorProps): React.ReactElement {
  const data = node.data as Record<string, unknown>;
  const config = (data.config as Record<string, unknown>) || {};

  const updateConfig = (updates: Record<string, unknown>) => {
    onUpdate(node.id, {
      ...data,
      config: { ...config, ...updates },
    });
  };

  const branches = (data.branches as string[]) || ['true', 'false'];

  const addBranch = () => {
    const newBranch = `branch_${branches.length}`;
    const newBranches = [...branches, newBranch];
    onUpdate(node.id, {
      ...data,
      branches: newBranches,
    });
  };

  const removeBranch = (idx: number) => {
    if (branches.length <= 2) return;
    const newBranches = branches.filter((_, i) => i !== idx);
    onUpdate(node.id, {
      ...data,
      branches: newBranches,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="condition-field" className="mb-1 text-xs">
          Field Path
        </Label>
        <Input
          id="condition-field"
          value={(config.field as string) || ''}
          onChange={(e) => updateConfig({ field: e.target.value })}
          placeholder="{{input.value}}"
          className="font-mono text-xs"
        />
      </div>

      <div>
        <Label htmlFor="condition-operator" className="mb-1 text-xs">
          Operator
        </Label>
        <Select
          id="condition-operator"
          value={(config.operator as string) || '==='}
          onChange={(e) => updateConfig({ operator: e.target.value })}
          options={OPERATORS}
        />
      </div>

      {(config.operator as string) !== 'exists' && (
        <div>
          <Label htmlFor="condition-value" className="mb-1 text-xs">
            Value
          </Label>
          <Input
            id="condition-value"
            value={(config.value as string) || ''}
            onChange={(e) => updateConfig({ value: e.target.value })}
            placeholder="Expected value"
            className="text-xs"
          />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs">Branches</Label>
          <Button variant="ghost" size="sm" onClick={addBranch}>
            <Icon icon="plus" size="xs" className="mr-1" />
            Add
          </Button>
        </div>
        <div className="space-y-1">
          {branches.map((branch, idx) => (
            <div key={branch} className="flex items-center gap-2">
              <Input
                value={branch}
                onChange={(e) => {
                  const newBranches = [...branches];
                  newBranches[idx] = e.target.value;
                  onUpdate(node.id, { ...data, branches: newBranches });
                }}
                className="text-xs flex-1"
              />
              {branches.length > 2 && (
                <Button variant="ghost" size="sm" onClick={() => removeBranch(idx)}>
                  <Icon icon="x" size="xs" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
