/**
 * Executor API Types
 *
 * These types define the contract between TPMJS and any executor service.
 * Custom executors must implement the ExecuteToolRequest/Response interface.
 */

import { z } from 'zod';

// =============================================================================
// Executor API Specification
// =============================================================================

/**
 * Request payload for POST /execute-tool
 */
export interface ExecuteToolRequest {
  /** NPM package name, e.g., "@tpmjs/hello" */
  packageName: string;
  /** Tool name within the package, e.g., "helloWorld" */
  name: string;
  /** Package version, e.g., "1.0.0" or "latest" */
  version?: string;
  /** Direct esm.sh URL override for the package */
  importUrl?: string;
  /** Tool parameters to pass to execute() */
  params: Record<string, unknown>;
  /** Environment variables to inject during execution */
  env?: Record<string, string>;
}

/**
 * Response from POST /execute-tool
 */
export interface ExecuteToolResponse {
  /** Whether the execution succeeded */
  success: boolean;
  /** Tool output on success */
  output?: unknown;
  /** Error message on failure */
  error?: string;
  /** Execution duration in milliseconds */
  executionTimeMs: number;
}

/**
 * Response from GET /health (optional but recommended)
 */
export interface ExecutorHealthResponse {
  /** Executor status */
  status: 'ok' | 'degraded' | 'error';
  /** Executor version string */
  version?: string;
  /** Optional additional info */
  info?: Record<string, unknown>;
}

// =============================================================================
// Executor Configuration Schemas
// =============================================================================

/**
 * Executor type enum
 */
export const ExecutorTypeSchema = z.enum(['default', 'custom_url']);
export type ExecutorType = z.infer<typeof ExecutorTypeSchema>;

/**
 * Default executor config (uses TPMJS Railway executor)
 */
export const DefaultExecutorConfigSchema = z.object({
  type: z.literal('default'),
});

/**
 * Custom URL executor config
 */
export const CustomUrlExecutorConfigSchema = z.object({
  type: z.literal('custom_url'),
  /** URL of the custom executor (must be HTTPS in production) */
  url: z.string().url(),
  /** Optional API key for Bearer token authentication */
  apiKey: z.string().optional(),
});

/**
 * Union of all executor config types
 */
export const ExecutorConfigSchema = z.discriminatedUnion('type', [
  DefaultExecutorConfigSchema,
  CustomUrlExecutorConfigSchema,
]);

export type ExecutorConfig = z.infer<typeof ExecutorConfigSchema>;
export type DefaultExecutorConfig = z.infer<typeof DefaultExecutorConfigSchema>;
export type CustomUrlExecutorConfig = z.infer<typeof CustomUrlExecutorConfigSchema>;

// =============================================================================
// Zod Schemas for Request/Response Validation
// =============================================================================

export const ExecuteToolRequestSchema = z.object({
  packageName: z.string().min(1),
  name: z.string().min(1),
  version: z.string().optional(),
  importUrl: z.string().url().optional(),
  params: z.record(z.string(), z.unknown()),
  env: z.record(z.string(), z.string()).optional(),
});

export const ExecuteToolResponseSchema = z.object({
  success: z.boolean(),
  output: z.unknown().optional(),
  error: z.string().optional(),
  executionTimeMs: z.number(),
});

export const ExecutorHealthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded', 'error']),
  version: z.string().optional(),
  info: z.record(z.string(), z.unknown()).optional(),
});

// =============================================================================
// Executor Verification
// =============================================================================

export const VerifyExecutorRequestSchema = z.object({
  url: z.string().url(),
  apiKey: z.string().optional(),
});

export interface VerifyExecutorRequest {
  url: string;
  apiKey?: string;
}

export interface VerifyExecutorResponse {
  valid: boolean;
  healthCheck?: ExecutorHealthResponse;
  testExecution?: {
    success: boolean;
    executionTimeMs: number;
  };
  errors?: string[];
}
