/**
 * Package executor client
 * Calls the remote sandbox service for secure package execution
 */

import type { ExecutionResult, ExecutorOptions } from './types.js';

const DEFAULT_TIMEOUT = 300000; // 5 minutes - some tools need significant time

// Get sandbox URL at runtime (not build time) for serverless environments
function getSandboxUrl(): string {
  const url = process.env.SANDBOX_EXECUTOR_URL || 'http://localhost:3000';
  // If URL doesn't start with http:// or https://, add https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}

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

  try {
    // Call the remote sandbox service
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Build request body, only include env if provided
    const requestBody: Record<string, unknown> = {
      packageName,
      name: functionName,
      version: 'latest',
      params,
    };
    if (options.env && Object.keys(options.env).length > 0) {
      requestBody.env = options.env;
    }

    const response = await fetch(`${getSandboxUrl()}/execute-tool`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
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

    return {
      success: result.success,
      output: result.output,
      error: result.error,
      executionTimeMs: result.executionTimeMs || executionTimeMs,
    };
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
 * Clear the package cache on the remote sandbox
 */
export async function clearCache(): Promise<void> {
  try {
    const response = await fetch(`${getSandboxUrl()}/cache/clear`, {
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
 * Check if the sandbox service is healthy
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${getSandboxUrl()}/health`, {
      method: 'GET',
    });

    return response.ok;
  } catch {
    return false;
  }
}
