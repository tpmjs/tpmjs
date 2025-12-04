'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@tpmjs/ui/Card/Card';
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
      setEnvVars(envVars.map((env) => (env.key === newKey ? { key: newKey, value: newValue } : env)));
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
    <aside className="hidden w-80 border-l border-border bg-surface md:block">
      <div className="flex h-full flex-col p-4">
        <h2 className="mb-4 text-lg font-bold">Settings</h2>

        {/* Environment Variables Section */}
        <Card variant="outline" className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm">
              Environment Variables <Badge variant="secondary" size="sm">{envVars.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-xs text-foreground-secondary">
              Add API keys and other environment variables. They will be forwarded to tool executions.
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
              <Button onClick={handleAddEnvVar} size="sm" variant="primary" className="w-full">
                Add Variable
              </Button>
            </div>

            {/* List of env vars */}
            <div className="space-y-2">
              {envVars.length === 0 ? (
                <p className="text-xs text-foreground-tertiary">No environment variables set</p>
              ) : (
                envVars.map((env) => (
                  <div key={env.key} className="flex items-center justify-between rounded border border-border bg-background p-2">
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate font-mono text-xs font-semibold">{env.key}</p>
                      <p className="truncate font-mono text-xs text-foreground-tertiary">
                        {env.value ? '•'.repeat(Math.min(env.value.length, 20)) : '(empty)'}
                      </p>
                    </div>
                    <Button onClick={() => handleRemoveEnvVar(env.key)} size="sm" variant="ghost" className="ml-2">
                      ×
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info Section */}
        <div className="mt-auto rounded border border-border bg-background p-3">
          <p className="text-xs text-foreground-secondary">
            <strong>Note:</strong> Environment variables are stored locally in your browser and sent with each tool
            execution request.
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
