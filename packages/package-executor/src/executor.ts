/**
 * Package executor client
 * Calls the remote sandbox service for secure package execution
 */

import type { ExecutionResult, ExecutorOptions } from './types.js';

const DEFAULT_TIMEOUT = 10000; // 10 seconds
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

// In-memory cache for execution results
interface CacheEntry {
  result: ExecutionResult;
  expiresAt: number;
}

const executionCache = new Map<string, CacheEntry>();

/**
 * Generate a cache key from execution parameters
 */
function getCacheKey(
  packageName: string,
  functionName: string,
  params: Record<string, unknown>
): string {
  const paramsKey = JSON.stringify(params, Object.keys(params).sort());
  return `${packageName}::${functionName}::${paramsKey}`;
}

/**
 * Get cached result if still valid
 */
function getCachedResult(cacheKey: string): ExecutionResult | null {
  const entry = executionCache.get(cacheKey);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    executionCache.delete(cacheKey);
    return null;
  }

  return entry.result;
}

/**
 * Store result in cache
 */
function setCachedResult(cacheKey: string, result: ExecutionResult): void {
  // Only cache successful results
  if (!result.success) return;

  executionCache.set(cacheKey, {
    result,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

/**
 * Periodically clean up expired cache entries
 */
function cleanupCache(): void {
  const now = Date.now();
  for (const [key, entry] of executionCache.entries()) {
    if (now > entry.expiresAt) {
      executionCache.delete(key);
    }
  }
}

// Run cleanup every minute
setInterval(cleanupCache, 60 * 1000).unref();

// Ensure URL has protocol
function getSandboxUrl(): string {
  const url = process.env.SANDBOX_EXECUTOR_URL || 'http://localhost:3000';
  // If URL doesn't start with http:// or https://, add https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}

const SANDBOX_URL = getSandboxUrl();

/**
 * Execute a package function with parameters via remote sandbox
 */
export async function executePackage(
  packageName: string,
  functionName: string,
  params: Record<string, unknown>,
  options: ExecutorOptions = {}
): Promise<ExecutionResult> {
  const startTime = Date.now();
  const timeout = options.timeout || DEFAULT_TIMEOUT;

  // Check cache first
  const cacheKey = getCacheKey(packageName, functionName, params);
  const cachedResult = getCachedResult(cacheKey);
  if (cachedResult) {
    return {
      ...cachedResult,
      executionTimeMs: 0, // Indicate cache hit with 0ms execution time
    };
  }

  try {
    // Call the remote sandbox service
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${SANDBOX_URL}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        packageName,
        functionName,
        params,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const executionTimeMs = Date.now() - startTime;

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({ error: 'Unknown error' }))) as {
        error?: string;
      };
      return {
        success: false,
        error: errorData.error || `Sandbox service error: ${response.status}`,
        executionTimeMs,
      };
    }

    const result = (await response.json()) as {
      success: boolean;
      output?: unknown;
      error?: string;
      executionTimeMs?: number;
    };

    const executionResult: ExecutionResult = {
      success: result.success,
      output: result.output,
      error: result.error,
      executionTimeMs: result.executionTimeMs || executionTimeMs,
    };

    // Cache successful results
    setCachedResult(cacheKey, executionResult);

    return executionResult;
  } catch (error) {
    const executionTimeMs = Date.now() - startTime;

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: 'Execution timeout',
        executionTimeMs,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      executionTimeMs,
    };
  }
}

/**
 * Clear the package cache on the remote sandbox and local execution cache
 */
export async function clearCache(): Promise<void> {
  // Clear local execution cache
  executionCache.clear();

  try {
    const response = await fetch(`${SANDBOX_URL}/cache/clear`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to clear cache: ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to clear sandbox cache:', error);
    throw error;
  }
}

/**
 * Get current cache statistics
 */
export function getCacheStats(): { size: number; ttlMs: number } {
  return {
    size: executionCache.size,
    ttlMs: CACHE_TTL_MS,
  };
}

/**
 * Check if the sandbox service is healthy
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${SANDBOX_URL}/health`, {
      method: 'GET',
    });

    return response.ok;
  } catch {
    return false;
  }
}
