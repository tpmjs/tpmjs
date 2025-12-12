'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Input } from '@tpmjs/ui/Input/Input';
import { useEffect, useState } from 'react';

interface EnvVar {
  key: string;
  value: string;
}

const ENV_STORAGE_KEY = 'tpmjs-playground-env-vars';

export function SettingsSidebar(): React.ReactElement {
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  // Load env vars from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ENV_STORAGE_KEY);
      if (stored) {
        setEnvVars(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load env vars from localStorage:', error);
    }
  }, []);

  // Save env vars to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(ENV_STORAGE_KEY, JSON.stringify(envVars));
      // Dispatch custom event so other components can react to changes
      window.dispatchEvent(new CustomEvent('env-vars-updated', { detail: envVars }));
    } catch (error) {
      console.error('Failed to save env vars to localStorage:', error);
    }
  }, [envVars]);

  const handleAddEnvVar = () => {
    if (!newKey.trim()) return;

    // Check if key already exists
    const exists = envVars.some((env) => env.key === newKey);
    if (exists) {
      // Update existing
      setEnvVars(
        envVars.map((env) => (env.key === newKey ? { key: newKey, value: newValue } : env))
      );
    } else {
      // Add new
      setEnvVars([...envVars, { key: newKey, value: newValue }]);
    }

    setNewKey('');
    setNewValue('');
  };

  const handleRemoveEnvVar = (key: string) => {
    setEnvVars(envVars.filter((env) => env.key !== key));
  };

  return (
    <aside className="hidden w-72 border-l border-border bg-surface md:block">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-secondary">
              Settings
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Environment Variables Section */}
          <div className="mb-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground-tertiary">
                Environment Variables
              </h3>
              <Badge variant="secondary" size="sm">
                {envVars.length}
              </Badge>
            </div>

            <p className="mb-4 text-xs text-foreground-tertiary">
              Add API keys for tools that require authentication.
            </p>

            {/* Add new env var form */}
            <div className="mb-4 space-y-2">
              <Input
                type="text"
                placeholder="Key (e.g., FIRECRAWL_API_KEY)"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="font-mono text-xs"
              />
              <Input
                type="password"
                placeholder="Value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="font-mono text-xs"
              />
              <Button onClick={handleAddEnvVar} size="sm" variant="default" className="w-full">
                Add Variable
              </Button>
            </div>

            {/* List of env vars */}
            <div className="space-y-2">
              {envVars.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-center">
                  <p className="text-xs text-foreground-tertiary">No variables configured</p>
                </div>
              ) : (
                envVars.map((env) => (
                  <div
                    key={env.key}
                    className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                  >
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate font-mono text-xs font-medium">{env.key}</p>
                      <p className="truncate font-mono text-xs text-foreground-tertiary">
                        {env.value ? '•'.repeat(Math.min(env.value.length, 16)) : '(empty)'}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleRemoveEnvVar(env.key)}
                      size="sm"
                      variant="ghost"
                      className="ml-2 h-6 w-6 p-0 text-foreground-tertiary hover:text-foreground"
                    >
                      ×
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="border-t border-border p-4">
          <p className="text-xs text-foreground-tertiary">
            Variables are stored in your browser and sent with each tool execution.
          </p>
        </div>
      </div>
    </aside>
  );
}

/**
 * Hook to get current env vars from localStorage
 * Can be used in other components to access env vars
 */
export function useEnvVars(): EnvVar[] {
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);

  useEffect(() => {
    // Load initially
    const loadEnvVars = () => {
      try {
        const stored = localStorage.getItem(ENV_STORAGE_KEY);
        if (stored) {
          setEnvVars(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load env vars:', error);
      }
    };

    loadEnvVars();

    // Listen for updates
    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<EnvVar[]>;
      setEnvVars(customEvent.detail);
    };

    window.addEventListener('env-vars-updated', handleUpdate);
    return () => window.removeEventListener('env-vars-updated', handleUpdate);
  }, []);

  return envVars;
}
