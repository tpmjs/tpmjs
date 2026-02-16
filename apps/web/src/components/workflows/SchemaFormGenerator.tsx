'use client';

import { Input } from '@tpmjs/ui/Input/Input';
import { Label } from '@tpmjs/ui/Label/Label';
import { Select } from '@tpmjs/ui/Select/Select';
import { Textarea } from '@tpmjs/ui/Textarea/Textarea';
import type { Node } from '@xyflow/react';

interface SchemaFormGeneratorProps {
  schema: Record<string, unknown>;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  nodes: Node[];
  edges: Array<{ source: string; target: string; sourceHandle?: string | null }>;
  currentNodeId: string;
  prefix?: string;
}

interface SchemaProperty {
  type?: string;
  description?: string;
  enum?: string[];
  default?: unknown;
  items?: Record<string, unknown>;
}

export function SchemaFormGenerator({
  schema,
  values,
  onChange,
  prefix = '',
}: SchemaFormGeneratorProps): React.ReactElement {
  const properties = (schema.properties as Record<string, SchemaProperty>) || {};
  const required = (schema.required as string[]) || [];

  return (
    <div className="space-y-3">
      {Object.entries(properties).map(([key, prop]) => {
        const fieldId = prefix ? `${prefix}.${key}` : key;
        const isRequired = required.includes(key);
        const value = values[key];

        return (
          <SchemaField
            key={fieldId}
            fieldId={fieldId}
            name={key}
            prop={prop}
            value={value}
            isRequired={isRequired}
            onChange={(v) => onChange(key, v)}
          />
        );
      })}
    </div>
  );
}

function SchemaField({
  fieldId,
  name,
  prop,
  value,
  isRequired,
  onChange,
}: {
  fieldId: string;
  name: string;
  prop: SchemaProperty;
  value: unknown;
  isRequired: boolean;
  onChange: (value: unknown) => void;
}) {
  // Enum -> Select
  if (prop.enum && prop.enum.length > 0) {
    return (
      <div>
        <Label htmlFor={fieldId} required={isRequired} className="mb-1 text-xs">
          {name}
        </Label>
        <Select
          id={fieldId}
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          options={[
            { value: '', label: 'Select...' },
            ...prop.enum.map((v) => ({ value: v, label: v })),
          ]}
        />
        {prop.description && (
          <p className="text-[10px] text-foreground-tertiary mt-0.5">{prop.description}</p>
        )}
      </div>
    );
  }

  // Boolean -> Select (true/false)
  if (prop.type === 'boolean') {
    return (
      <div>
        <Label htmlFor={fieldId} required={isRequired} className="mb-1 text-xs">
          {name}
        </Label>
        <Select
          id={fieldId}
          value={value === true ? 'true' : value === false ? 'false' : ''}
          onChange={(e) => onChange(e.target.value === 'true')}
          options={[
            { value: '', label: 'Default' },
            { value: 'true', label: 'True' },
            { value: 'false', label: 'False' },
          ]}
        />
        {prop.description && (
          <p className="text-[10px] text-foreground-tertiary mt-0.5">{prop.description}</p>
        )}
      </div>
    );
  }

  // Number/Integer -> Input[type=number]
  if (prop.type === 'number' || prop.type === 'integer') {
    return (
      <div>
        <Label htmlFor={fieldId} required={isRequired} className="mb-1 text-xs">
          {name}
        </Label>
        <Input
          id={fieldId}
          type="number"
          value={value !== undefined && value !== null ? String(value) : ''}
          onChange={(e) => {
            const v = e.target.value === '' ? undefined : Number(e.target.value);
            onChange(v);
          }}
          placeholder={prop.default !== undefined ? String(prop.default) : undefined}
          className="text-xs"
        />
        {prop.description && (
          <p className="text-[10px] text-foreground-tertiary mt-0.5">{prop.description}</p>
        )}
      </div>
    );
  }

  // String (long description suggests textarea)
  const isLongString =
    name.includes('prompt') ||
    name.includes('content') ||
    name.includes('text') ||
    name.includes('body') ||
    name.includes('message');

  if (isLongString) {
    return (
      <div>
        <Label htmlFor={fieldId} required={isRequired} className="mb-1 text-xs">
          {name}
        </Label>
        <Textarea
          id={fieldId}
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          resize="none"
          placeholder={prop.default !== undefined ? String(prop.default) : `Enter ${name}...`}
          className="text-xs font-mono"
        />
        {prop.description && (
          <p className="text-[10px] text-foreground-tertiary mt-0.5">{prop.description}</p>
        )}
      </div>
    );
  }

  // Default: string Input
  return (
    <div>
      <Label htmlFor={fieldId} required={isRequired} className="mb-1 text-xs">
        {name}
      </Label>
      <Input
        id={fieldId}
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        placeholder={
          prop.default !== undefined
            ? String(prop.default)
            : `Enter ${name}... or {{node.output.field}}`
        }
        className="text-xs"
      />
      {prop.description && (
        <p className="text-[10px] text-foreground-tertiary mt-0.5">{prop.description}</p>
      )}
    </div>
  );
}
