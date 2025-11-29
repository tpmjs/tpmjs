/**
 * Package executor without sandboxing
 * Executes npm packages directly
 *
 * TODO: Add proper sandboxing with isolated-vm or similar when Next.js compatible solution is found
 * VM2 doesn't work with Next.js Turbopack due to runtime file access requirements
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
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
    const packageDir = await ensurePackageInstalled(packageName, cacheDir);

    // Set up timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Execution timeout')), timeout);
    });

    // Execute the package with dynamic import
    const executionPromise = (async () => {
      // Dynamic require from the package directory
      const packagePath = join(packageDir, 'node_modules', packageName);

      // Use require to load the package
      // biome-ignore lint/security/noGlobalEval: Required for dynamic package execution
      const pkg = require(packagePath);

      // Get the function to execute
      const fn = typeof pkg === 'function' ? pkg : pkg[functionName || 'default'];

      if (typeof fn !== 'function') {
        throw new Error(`Package ${packageName} does not export a function named ${functionName || 'default'}`);
      }

      // Execute the function
      const result = await Promise.resolve(fn(params));
      return result;
    })();

    // Race between execution and timeout
    const result = await Promise.race([executionPromise, timeoutPromise]);
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
