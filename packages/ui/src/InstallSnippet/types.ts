import type { HTMLAttributes } from 'react';

/**
 * Package manager types
 */
export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

/**
 * InstallSnippet component props
 */
export interface InstallSnippetProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Package name to install
   */
  packageName: string;

  /**
   * Package version (optional)
   */
  version?: string;

  /**
   * Default package manager
   * @default 'npm'
   */
  defaultManager?: PackageManager;

  /**
   * Whether to show package manager tabs
   * @default true
   */
  showTabs?: boolean;

  /**
   * Install type
   * @default 'dependencies'
   */
  installType?: 'dependencies' | 'devDependencies' | 'global';

  /**
   * Whether the snippet is copyable
   * @default true
   */
  copyable?: boolean;

  /**
   * Variant style
   * @default 'default'
   */
  variant?: 'default' | 'minimal' | 'dark';
}

/**
 * InstallSnippet ref type
 */
export type InstallSnippetRef = HTMLDivElement;
