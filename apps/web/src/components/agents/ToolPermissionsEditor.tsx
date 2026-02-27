'use client';

import type { ToolPermission, ToolPermissionRule, ToolPermissions } from '@tpmjs/types/agent';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import { Select } from '@tpmjs/ui/Select/Select';
import type { ChangeEvent } from 'react';
import { useState } from 'react';

interface ToolPermissionsEditorProps {
  permissions: ToolPermissions | null;
  onChange: (permissions: ToolPermissions | null) => void;
  toolNames: string[];
}

const PERMISSION_OPTIONS = [
  { value: 'allow', label: 'Allow' },
  { value: 'ask', label: 'Ask' },
  { value: 'deny', label: 'Deny' },
];

function PermissionBadge({ permission }: { permission: ToolPermission }) {
  const styles = {
    allow: 'bg-success/10 text-success border-success/30',
    ask: 'bg-warning/10 text-warning border-warning/30',
    deny: 'bg-error/10 text-error border-error/30',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-mono rounded border ${styles[permission]}`}>
      {permission}
    </span>
  );
}

export function ToolPermissionsEditor({
  permissions,
  onChange,
  toolNames,
}: ToolPermissionsEditorProps) {
  const [newPattern, setNewPattern] = useState('');
  const [newPermission, setNewPermission] = useState<ToolPermission>('deny');

  const defaultPermission = permissions?.default ?? 'allow';
  const rules = permissions?.rules ?? [];

  const updatePermissions = (defaultPerm: ToolPermission, newRules: ToolPermissionRule[]) => {
    if (defaultPerm === 'allow' && newRules.length === 0) {
      onChange(null);
    } else {
      onChange({ default: defaultPerm, rules: newRules });
    }
  };

  const handleDefaultChange = (e: ChangeEvent<HTMLSelectElement>) => {
    updatePermissions(e.target.value as ToolPermission, rules);
  };

  const addRule = () => {
    if (!newPattern.trim()) return;
    const rule: ToolPermissionRule = { pattern: newPattern.trim(), permission: newPermission };
    updatePermissions(defaultPermission, [...rules, rule]);
    setNewPattern('');
    setNewPermission('deny');
  };

  const removeRule = (index: number) => {
    const newRules = rules.filter((_, i) => i !== index);
    updatePermissions(defaultPermission, newRules);
  };

  const updateRulePermission = (index: number, permission: ToolPermission) => {
    const newRules = rules.map((r, i) => (i === index ? { ...r, permission } : r));
    updatePermissions(defaultPermission, newRules);
  };

  const addToolRule = (toolName: string) => {
    if (rules.some((r) => r.pattern === toolName)) return;
    const rule: ToolPermissionRule = { pattern: toolName, permission: 'ask' };
    updatePermissions(defaultPermission, [...rules, rule]);
  };

  const handleReset = () => {
    onChange(null);
  };

  return (
    <div className="space-y-4">
      {/* Default permission */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-foreground-secondary min-w-[120px]">Default policy:</span>
        <Select
          value={defaultPermission}
          onChange={handleDefaultChange}
          options={PERMISSION_OPTIONS}
        />
        {permissions && (
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs">
            Reset All
          </Button>
        )}
      </div>

      {/* Per-tool rules from agent's tools */}
      {toolNames.length > 0 && (
        <div>
          <p className="text-xs text-foreground-tertiary mb-2 font-mono">Tool overrides</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {toolNames.map((name) => {
              const ruleIndex = rules.findIndex((r) => r.pattern === name);
              const hasRule = ruleIndex !== -1;
              const rule = hasRule ? rules[ruleIndex] : undefined;
              const rulePermission = rule ? rule.permission : defaultPermission;

              return (
                <div key={name} className="flex items-center gap-2 py-1">
                  <span className="flex-1 font-mono text-xs text-foreground truncate">{name}</span>
                  {hasRule ? (
                    <>
                      <Select
                        value={rulePermission}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                          updateRulePermission(ruleIndex, e.target.value as ToolPermission)
                        }
                        options={PERMISSION_OPTIONS}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRule(ruleIndex)}
                        className="h-7 w-7 p-0"
                      >
                        <Icon icon="x" size="xs" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <PermissionBadge permission={defaultPermission} />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addToolRule(name)}
                        className="text-xs text-foreground-tertiary"
                      >
                        override
                      </Button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom pattern rules */}
      <div>
        <p className="text-xs text-foreground-tertiary mb-2 font-mono">Pattern rules</p>

        {rules
          .filter((r) => !toolNames.includes(r.pattern))
          .map((rule, idx) => {
            const actualIndex = rules.findIndex(
              (r) => r.pattern === rule.pattern && r.permission === rule.permission
            );
            return (
              <div key={`${rule.pattern}-${idx}`} className="flex items-center gap-2 py-1">
                <span className="flex-1 font-mono text-xs text-foreground">{rule.pattern}</span>
                <PermissionBadge permission={rule.permission} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRule(actualIndex)}
                  className="h-7 w-7 p-0"
                >
                  <Icon icon="x" size="xs" />
                </Button>
              </div>
            );
          })}

        {/* Add new pattern rule */}
        <div className="flex items-center gap-2 mt-2">
          <Input
            value={newPattern}
            onChange={(e) => setNewPattern(e.target.value)}
            placeholder="sandbox.* or mcp-*"
            className="flex-1 text-xs font-mono"
          />
          <Select
            value={newPermission}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setNewPermission(e.target.value as ToolPermission)
            }
            options={PERMISSION_OPTIONS}
          />
          <Button variant="outline" size="sm" onClick={addRule} disabled={!newPattern.trim()}>
            <Icon icon="plus" size="xs" />
          </Button>
        </div>
      </div>
    </div>
  );
}
