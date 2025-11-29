/**
 * Package executor with VM2 sandboxing
 * Safely executes npm packages in an isolated environment
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { VM } from 'vm2';
import type { ExecutionResult, ExecutorOptions } from './types.js';

const DEFAULT_TIMEOUT = 5000; // 5 seconds
const CACHE_DIR = process.env.PACKAGE_CACHE_DIR || '/tmp/.tpmjs-cache';

/**
 * Execute a package function with parameters
 */
export async function executePackage(
  packageName: string,
  functionName: string,
  params: Record<string, unknown>,
  options: ExecutorOptions = {}
): Promise<ExecutionResult> {
  const startTime = Date.now();
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  const cacheDir = options.cacheDir || CACHE_DIR;

  try {
    // Ensure package is installed
    const packagePath = await ensurePackageInstalled(packageName, cacheDir);

    // Create VM sandbox
    const vm = new VM({
      timeout,
      sandbox: {
        console: {
          log: (...args: unknown[]) => console.log('[VM]', ...args),
          error: (...args: unknown[]) => console.error('[VM]', ...args),
          warn: (...args: unknown[]) => console.warn('[VM]', ...args),
        },
      },
      require: {
        external: true,
        root: packagePath,
        mock: {
          // Mock dangerous modules
          fs: {},
          net: {},
          http: {},
          https: {},
          child_process: {},
        },
      } as any,
    } as any);

    // Execute the package
    const code = `
      const pkg = require('${packageName}');
      const fn = typeof pkg === 'function' ? pkg : pkg.${functionName || 'default'};

      if (typeof fn !== 'function') {
        throw new Error('Package does not export a function');
      }

      fn(${JSON.stringify(params)});
    `;

    const result = vm.run(code);
    const executionTimeMs = Date.now() - startTime;

    return {
      success: true,
      output: result,
      executionTimeMs,
    };
  } catch (error) {
    const executionTimeMs = Date.now() - startTime;
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      executionTimeMs,
    };
  }
}

/**
 * Ensure a package is installed in the cache directory
 */
async function ensurePackageInstalled(packageName: string, cacheDir: string): Promise<string> {
  // Create cache directory if it doesn't exist
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }

  // Package-specific directory
  const packageDir = join(cacheDir, packageName.replace(/[@/]/g, '_'));

  // Check if already installed
  if (existsSync(join(packageDir, 'node_modules', packageName))) {
    return packageDir;
  }

  // Install the package
  try {
    if (!existsSync(packageDir)) {
      mkdirSync(packageDir, { recursive: true });
    }

    // Initialize package.json if not exists
    const packageJsonPath = join(packageDir, 'package.json');
    if (!existsSync(packageJsonPath)) {
      execSync('npm init -y', {
        cwd: packageDir,
        stdio: 'ignore',
      });
    }

    // Install the package
    execSync(`npm install ${packageName} --no-save`, {
      cwd: packageDir,
      stdio: 'ignore',
      timeout: 30000, // 30 second timeout for installation
    });

    return packageDir;
  } catch (error) {
    throw new Error(
      `Failed to install package ${packageName}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Clear the package cache
 */
export function clearCache(cacheDir?: string): void {
  const dir = cacheDir || CACHE_DIR;
  if (existsSync(dir)) {
    execSync(`rm -rf ${dir}`, { stdio: 'ignore' });
  }
}
