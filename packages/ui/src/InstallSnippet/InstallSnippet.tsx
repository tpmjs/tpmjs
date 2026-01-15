'use client';

import { cn } from '@tpmjs/utils/cn';
import { forwardRef, useCallback, useState } from 'react';
import { Icon } from '../Icon/Icon';
import type { InstallSnippetProps, PackageManager } from './types';
import {
  installSnippetCodeVariants,
  installSnippetCopyButtonVariants,
  installSnippetTabVariants,
  installSnippetTabsVariants,
  installSnippetVariants,
} from './variants';

/**
 * Package manager configurations
 */
const PACKAGE_MANAGERS: Record<
  PackageManager,
  {
    label: string;
    install: string;
    devInstall: string;
    globalInstall: string;
  }
> = {
  npm: {
    label: 'npm',
    install: 'npm install',
    devInstall: 'npm install -D',
    globalInstall: 'npm install -g',
  },
  pnpm: {
    label: 'pnpm',
    install: 'pnpm add',
    devInstall: 'pnpm add -D',
    globalInstall: 'pnpm add -g',
  },
  yarn: {
    label: 'yarn',
    install: 'yarn add',
    devInstall: 'yarn add -D',
    globalInstall: 'yarn global add',
  },
  bun: {
    label: 'bun',
    install: 'bun add',
    devInstall: 'bun add -d',
    globalInstall: 'bun add -g',
  },
};

const MANAGER_ORDER: PackageManager[] = ['npm', 'pnpm', 'yarn', 'bun'];

/**
 * InstallSnippet component
 *
 * A component for displaying package installation commands with package manager tabs.
 *
 * @example
 * ```tsx
 * import { InstallSnippet } from '@tpmjs/ui/InstallSnippet/InstallSnippet';
 *
 * function MyComponent() {
 *   return (
 *     <InstallSnippet
 *       packageName="@tpmjs/core"
 *       version="^1.0.0"
 *       defaultManager="pnpm"
 *     />
 *   );
 * }
 * ```
 */
export const InstallSnippet = forwardRef<HTMLDivElement, InstallSnippetProps>(
  (
    {
      packageName,
      version,
      defaultManager = 'npm',
      showTabs = true,
      installType = 'dependencies',
      copyable = true,
      variant = 'default',
      className,
      ...props
    },
    ref
  ) => {
    const [activeManager, setActiveManager] = useState<PackageManager>(defaultManager);
    const [copied, setCopied] = useState(false);

    // Generate install command
    const getInstallCommand = useCallback(
      (manager: PackageManager): string => {
        const config = PACKAGE_MANAGERS[manager];
        let command: string;

        switch (installType) {
          case 'devDependencies':
            command = config.devInstall;
            break;
          case 'global':
            command = config.globalInstall;
            break;
          default:
            command = config.install;
        }

        const pkg = version ? `${packageName}@${version}` : packageName;
        return `${command} ${pkg}`;
      },
      [packageName, version, installType]
    );

    const currentCommand = getInstallCommand(activeManager);

    // Copy to clipboard
    const handleCopy = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(currentCommand);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }, [currentCommand]);

    return (
      <div
        ref={ref}
        className={cn(installSnippetVariants({ variant }), className)}
        {...props}
      >
        {/* Tabs */}
        {showTabs && (
          <div className={installSnippetTabsVariants({ variant })}>
            {MANAGER_ORDER.map((manager) => (
              <button
                key={manager}
                type="button"
                onClick={() => setActiveManager(manager)}
                className={installSnippetTabVariants({
                  variant,
                  active: activeManager === manager ? 'true' : 'false',
                })}
              >
                {PACKAGE_MANAGERS[manager].label}
              </button>
            ))}
          </div>
        )}

        {/* Code */}
        <div className={installSnippetCodeVariants({ variant })}>
          <code className="flex-1 whitespace-nowrap">{currentCommand}</code>

          {copyable && (
            <button
              type="button"
              onClick={handleCopy}
              className={installSnippetCopyButtonVariants({ variant, copied: copied ? 'true' : 'false' })}
              aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
            >
              <Icon icon={copied ? 'check' : 'copy'} size="sm" />
            </button>
          )}
        </div>
      </div>
    );
  }
);

InstallSnippet.displayName = 'InstallSnippet';
