'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { useCallback, useMemo, useRef, useState } from 'react';
import { parseEnvString } from '~/lib/utils/env-parser';

interface EnvVar {
  key: string;
  value: string;
}

export interface EnvVarsEditorProps {
  /** Current env vars as Record<string, string> */
  value: Record<string, string> | null | undefined;
  /** Called when env vars change */
  onChange: (value: Record<string, string> | null) => void;
  /** Title shown above the editor */
  title?: string;
  /** Description shown below the title */
  description?: string;
  /** Placeholder for new key input */
  keyPlaceholder?: string;
  /** Placeholder for new value input */
  valuePlaceholder?: string;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Show the paste .env snippet feature */
  showPasteEnv?: boolean;
  /** className for the container */
  className?: string;
}

/**
 * Reusable component for editing environment variables
 * Used for agent env vars, collection env vars, API keys, and user-level env vars
 */
export function EnvVarsEditor({
  value,
  onChange,
  title = 'Environment Variables',
  description,
  keyPlaceholder = 'NEW_KEY',
  valuePlaceholder = 'value',
  disabled = false,
  showPasteEnv = true,
  className = '',
}: EnvVarsEditorProps) {
  // Internal array state for editing
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteContent, setPasteContent] = useState('');

  // Sync from prop to internal state (only when value actually changes)
  // Using a ref to track the serialized value to prevent unnecessary state updates
  const valueRef = useRef<string | null>(null);
  const serializedValue = value ? JSON.stringify(value) : null;

  if (serializedValue !== valueRef.current) {
    valueRef.current = serializedValue;
    const newEnvVars =
      value && typeof value === 'object'
        ? Object.entries(value).map(([key, val]) => ({ key, value: val }))
        : [];
    // Only update if the arrays are actually different
    if (JSON.stringify(newEnvVars) !== JSON.stringify(envVars)) {
      setEnvVars(newEnvVars);
    }
  }

  // Convert array to record and call onChange
  const emitChange = useCallback(
    (vars: EnvVar[]) => {
      const record: Record<string, string> = {};
      for (const { key, value: val } of vars) {
        const trimmedKey = key.trim();
        if (trimmedKey) {
          record[trimmedKey] = val;
        }
      }
      onChange(Object.keys(record).length > 0 ? record : null);
    },
    [onChange]
  );

  // Update a single env var
  const updateEnvVar = useCallback(
    (index: number, field: 'key' | 'value', newValue: string) => {
      const updated = [...envVars];
      const current = updated[index];
      if (!current) return;
      updated[index] = {
        key: field === 'key' ? newValue.toUpperCase() : current.key,
        value: field === 'value' ? newValue : current.value,
      };
      setEnvVars(updated);
      emitChange(updated);
    },
    [envVars, emitChange]
  );

  // Remove an env var
  const removeEnvVar = useCallback(
    (index: number) => {
      const updated = envVars.filter((_, i) => i !== index);
      setEnvVars(updated);
      emitChange(updated);
    },
    [envVars, emitChange]
  );

  // Add a new env var
  const addEnvVar = useCallback(() => {
    if (!newEnvKey.trim()) return;

    const updated = [...envVars, { key: newEnvKey.trim().toUpperCase(), value: newEnvValue }];
    setEnvVars(updated);
    emitChange(updated);
    setNewEnvKey('');
    setNewEnvValue('');
  }, [envVars, newEnvKey, newEnvValue, emitChange]);

  // Handle pasting .env content
  const handlePasteEnv = useCallback(() => {
    const parsed = parseEnvString(pasteContent);
    if (parsed.length === 0) {
      return;
    }

    // Merge with existing, new values override existing keys
    const existingMap = new Map(envVars.map((e) => [e.key, e.value]));
    for (const { key, value: val } of parsed) {
      existingMap.set(key, val);
    }

    const updated = Array.from(existingMap.entries()).map(([key, val]) => ({ key, value: val }));
    setEnvVars(updated);
    emitChange(updated);
    setPasteContent('');
    setShowPasteModal(false);
  }, [pasteContent, envVars, emitChange]);

  // Preview of parsed env vars
  const parsedPreview = useMemo(() => {
    if (!pasteContent.trim()) return [];
    return parseEnvString(pasteContent);
  }, [pasteContent]);

  const inputClassName =
    'flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          {description && <p className="text-xs text-foreground-tertiary mt-0.5">{description}</p>}
        </div>
        {showPasteEnv && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowPasteModal(!showPasteModal)}
            disabled={disabled}
            title="Paste .env snippet"
          >
            <Icon icon="copy" size="xs" className="mr-1" />
            Paste .env
          </Button>
        )}
      </div>

      {/* Paste .env modal/section */}
      {showPasteModal && (
        <div className="mb-4 p-3 bg-surface-secondary rounded-lg border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-foreground">Paste .env snippet</span>
            <Button size="sm" variant="ghost" onClick={() => setShowPasteModal(false)}>
              <Icon icon="x" size="xs" />
            </Button>
          </div>
          <textarea
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
            placeholder={`# Paste your .env content here\nAPI_KEY=your-api-key\nDATABASE_URL="postgres://..."\n`}
            className="w-full h-32 px-3 py-2 bg-surface border border-border rounded-lg text-foreground font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
            disabled={disabled}
          />
          {parsedPreview.length > 0 && (
            <div className="mt-2 text-xs text-foreground-secondary">
              <span className="font-medium">Preview:</span> {parsedPreview.length} variable
              {parsedPreview.length !== 1 ? 's' : ''} found
              <span className="text-foreground-tertiary ml-1">
                ({parsedPreview.map((e) => e.key).join(', ')})
              </span>
            </div>
          )}
          <div className="flex justify-end mt-2">
            <Button
              size="sm"
              variant="default"
              onClick={handlePasteEnv}
              disabled={parsedPreview.length === 0}
            >
              <Icon icon="plus" size="xs" className="mr-1" />
              Add {parsedPreview.length} Variable{parsedPreview.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      )}

      {/* Existing env vars */}
      {envVars.length > 0 && (
        <div className="space-y-2 mb-3">
          {envVars.map((env, index) => (
            <div key={`env-${env.key || index}`} className="flex items-center gap-2">
              <input
                type="text"
                value={env.key}
                onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                placeholder="KEY"
                className={inputClassName}
                disabled={disabled}
              />
              <input
                type="password"
                value={env.value}
                onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                placeholder="value"
                className={inputClassName}
                disabled={disabled}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeEnvVar(index)}
                title="Remove"
                disabled={disabled}
              >
                <Icon icon="trash" size="xs" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add new env var */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newEnvKey}
          onChange={(e) => setNewEnvKey(e.target.value.toUpperCase())}
          placeholder={keyPlaceholder}
          className={inputClassName}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newEnvKey.trim()) {
              addEnvVar();
            }
          }}
        />
        <input
          type="text"
          value={newEnvValue}
          onChange={(e) => setNewEnvValue(e.target.value)}
          placeholder={valuePlaceholder}
          className={inputClassName}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newEnvKey.trim()) {
              addEnvVar();
            }
          }}
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={addEnvVar}
          disabled={disabled || !newEnvKey.trim()}
        >
          <Icon icon="plus" size="xs" className="mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
}
