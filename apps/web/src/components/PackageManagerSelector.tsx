'use client';

import { useCallback, useEffect, useState } from 'react';

export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';

const STORAGE_KEY = 'tpmjs-package-manager';

const packageManagers: { id: PackageManager; label: string }[] = [
  { id: 'npm', label: 'npm' },
  { id: 'yarn', label: 'yarn' },
  { id: 'pnpm', label: 'pnpm' },
  { id: 'bun', label: 'bun' },
];

interface PackageManagerSelectorProps {
  value?: PackageManager;
  onChange?: (manager: PackageManager) => void;
  className?: string;
}

export function PackageManagerSelector({
  value,
  onChange,
  className = '',
}: PackageManagerSelectorProps): React.ReactElement {
  const [selected, setSelected] = useState<PackageManager>('npm');

  // Load from localStorage on mount - intentional initial sync from browser storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY) as PackageManager | null;
      if (stored && packageManagers.some((pm) => pm.id === stored)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelected(stored);
      }
    }
  }, []);

  // Sync with controlled value - controlled component pattern
  useEffect(() => {
    if (value) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected(value);
    }
  }, [value]);

  const handleSelect = useCallback(
    (manager: PackageManager) => {
      setSelected(manager);
      localStorage.setItem(STORAGE_KEY, manager);
      onChange?.(manager);
    },
    [onChange]
  );

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <span className="text-sm text-foreground-secondary mr-1">Package Manager:</span>
      <div className="inline-flex rounded-lg border border-border overflow-hidden">
        {packageManagers.map((pm) => (
          <button
            key={pm.id}
            type="button"
            onClick={() => handleSelect(pm.id)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              selected === pm.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-foreground-secondary hover:bg-surface hover:text-foreground'
            }`}
          >
            {pm.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function getInstallCommand(packageName: string, manager: PackageManager): string {
  switch (manager) {
    case 'npm':
      return `npm install ${packageName}`;
    case 'yarn':
      return `yarn add ${packageName}`;
    case 'pnpm':
      return `pnpm add ${packageName}`;
    case 'bun':
      return `bun add ${packageName}`;
    default:
      return `npm install ${packageName}`;
  }
}

// Hook for getting current package manager
export function usePackageManager(): [PackageManager, (manager: PackageManager) => void] {
  const [manager, setManager] = useState<PackageManager>('npm');

  // Load from localStorage on mount - intentional initial sync from browser storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY) as PackageManager | null;
      if (stored && packageManagers.some((pm) => pm.id === stored)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setManager(stored);
      }
    }
  }, []);

  const updateManager = useCallback((newManager: PackageManager) => {
    setManager(newManager);
    localStorage.setItem(STORAGE_KEY, newManager);
  }, []);

  return [manager, updateManager];
}
