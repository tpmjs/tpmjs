/**
 * Executor Resolution Logic
 *
 * Handles the cascade resolution for hot-swappable executors:
 * Agent Config → Collection Config → System Default
 */

import { executePackage } from '@tpmjs/package-executor';
import type {
  ExecuteToolRequest,
  ExecuteToolResponse,
  ExecutorConfig,
  ExecutorHealthResponse,
} from '@tpmjs/types/executor';

const DEFAULT_TIMEOUT = 300000; // 5 minutes for custom executors

/**
 * Resolve executor configuration using cascade:
 * Agent Config → Collection Config → System Default
 *
 * @param agentConfig - Executor config from Agent (highest priority)
 * @param collectionConfig - Executor config from Collection (medium priority)
 * @returns Resolved executor configuration
 */
export function resolveExecutorConfig(
  agentConfig: ExecutorConfig | null | undefined,
  collectionConfig: ExecutorConfig | null | undefined
): ExecutorConfig {
  // Agent config takes precedence
  if (agentConfig && agentConfig.type !== 'default') {
    return agentConfig;
  }

  // Fall back to collection config
  if (collectionConfig && collectionConfig.type !== 'default') {
    return collectionConfig;
  }

  // System default
  return { type: 'default' };
}

/**
 * Parse executor config from database JSON
 * Handles null/undefined and validates the shape
 */
export function parseExecutorConfig(
  executorType: string | null | undefined,
  executorConfig: unknown
): ExecutorConfig | null {
  if (!executorType) {
    return null;
  }

  if (executorType === 'default') {
    return { type: 'default' };
  }

  if (executorType === 'custom_url' && executorConfig && typeof executorConfig === 'object') {
    const config = executorConfig as { url?: string; apiKey?: string };
    if (config.url && typeof config.url === 'string') {
      return {
        type: 'custom_url',
        url: config.url,
        apiKey: typeof config.apiKey === 'string' ? config.apiKey : undefined,
      };
    }
  }

  return null;
}

/**
 * Execute a tool using a custom URL executor
 */
async function executeWithCustomUrl(
  url: string,
  apiKey: string | undefined,
  request: ExecuteToolRequest,
  timeout: number = DEFAULT_TIMEOUT
): Promise<ExecuteToolResponse> {
  const startTime = Date.now();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${url}/execute-tool`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
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
        error: errorData.error || `Executor error: ${response.status}`,
        executionTimeMs,
      };
    }

    const result = (await response.json()) as ExecuteToolResponse;

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
 * Execute a tool using the resolved executor configuration
 *
 * @param config - Resolved executor config (or null for default)
 * @param request - Tool execution request
 * @returns Execution result
 */
export async function executeWithExecutor(
  config: ExecutorConfig | null,
  request: ExecuteToolRequest
): Promise<ExecuteToolResponse> {
  const resolvedConfig = config ?? { type: 'default' };

  // Use custom URL executor
  if (resolvedConfig.type === 'custom_url' && resolvedConfig.url) {
    return executeWithCustomUrl(resolvedConfig.url, resolvedConfig.apiKey, request);
  }

  // Default: use existing package-executor (which uses SANDBOX_EXECUTOR_URL)
  const result = await executePackage(request.packageName, request.name, request.params, {
    env: request.env,
  });

  return {
    success: result.success,
    output: result.output,
    error: result.error,
    executionTimeMs: result.executionTimeMs,
  };
}

/**
 * Check the health of a custom executor URL
 *
 * @param url - Executor URL to check
 * @param apiKey - Optional API key for authentication
 * @returns Health check response or error
 */
export async function checkExecutorHealth(
  url: string,
  apiKey?: string
): Promise<{ healthy: boolean; response?: ExecutorHealthResponse; error?: string }> {
  const headers: Record<string, string> = {};

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for health checks

    const response = await fetch(`${url}/health`, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        healthy: false,
        error: `Health check failed: ${response.status}`,
      };
    }

    const data = (await response.json()) as ExecutorHealthResponse;

    return {
      healthy: data.status === 'ok' || data.status === 'degraded',
      response: data,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        healthy: false,
        error: 'Health check timeout',
      };
    }

    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test a custom executor by running a simple tool execution
 *
 * @param url - Executor URL to test
 * @param apiKey - Optional API key for authentication
 * @returns Test execution result
 */
export async function testExecutor(
  url: string,
  apiKey?: string
): Promise<{ success: boolean; executionTimeMs: number; error?: string }> {
  const testRequest: ExecuteToolRequest = {
    packageName: '@tpmjs/hello',
    name: 'helloWorldTool',
    version: '0.0.2',
    params: { includeTimestamp: true },
  };

  const result = await executeWithCustomUrl(url, apiKey, testRequest, 30000); // 30 second timeout for test (includes npm install)

  return {
    success: result.success,
    executionTimeMs: result.executionTimeMs,
    error: result.error,
  };
}

/**
 * Verify a custom executor URL is valid and operational
 *
 * @param url - Executor URL to verify
 * @param apiKey - Optional API key for authentication
 * @returns Verification result
 */
export async function verifyExecutor(
  url: string,
  apiKey?: string
): Promise<{
  valid: boolean;
  healthCheck?: { healthy: boolean; response?: ExecutorHealthResponse };
  testExecution?: { success: boolean; executionTimeMs: number };
  errors: string[];
}> {
  const errors: string[] = [];

  // Validate URL format
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
      errors.push('Custom executor URL must use HTTPS in production');
    }
  } catch {
    errors.push('Invalid URL format');
    return { valid: false, errors };
  }

  // Check health endpoint
  const healthResult = await checkExecutorHealth(url, apiKey);
  if (!healthResult.healthy) {
    errors.push(healthResult.error || 'Health check failed');
  }

  // Test execution (only if health check passed)
  let testResult: { success: boolean; executionTimeMs: number } | undefined;
  if (healthResult.healthy) {
    const execResult = await testExecutor(url, apiKey);
    testResult = {
      success: execResult.success,
      executionTimeMs: execResult.executionTimeMs,
    };
    if (!execResult.success) {
      errors.push(execResult.error || 'Test execution failed');
    }
  }

  return {
    valid: errors.length === 0,
    healthCheck: {
      healthy: healthResult.healthy,
      response: healthResult.response,
    },
    testExecution: testResult,
    errors,
  };
}

/**
 * Get executor description for display
 */
export function getExecutorDescription(config: ExecutorConfig | null): string {
  if (!config || config.type === 'default') {
    return 'TPMJS Default Executor';
  }

  if (config.type === 'custom_url') {
    try {
      const url = new URL(config.url);
      return `Custom: ${url.hostname}`;
    } catch {
      return 'Custom Executor';
    }
  }

  return 'Unknown Executor';
}
