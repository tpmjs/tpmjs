/**
 * Package executor types
 */

export interface ExecutionResult {
  success: boolean;
  output?: unknown;
  error?: string;
  executionTimeMs: number;
}

export interface PackageInfo {
  name: string;
  version: string;
  cachedAt?: Date;
}

export interface ExecutorOptions {
  timeout?: number; // Milliseconds
  cacheDir?: string;
  /** Environment variables to inject during execution */
  env?: Record<string, string>;
}
