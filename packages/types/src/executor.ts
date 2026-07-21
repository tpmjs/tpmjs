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
  /** Machine-readable phase in which the failure occurred. */
  errorStage?: ExecutorErrorStage;
  /** Stable machine-readable failure category. Never classify by `error` text. */
  errorCode?: ExecutorErrorCode;
  /** Whether retrying the same request may succeed without changing the tool. */
  retryable?: boolean;
  /** Execution duration in milliseconds */
  executionTimeMs: number;
}

/**
 * Failure phases are deliberately about the execution boundary, not prose in
 * an exception message. Consumers can make health and retry decisions without
 * maintaining lists of provider-specific strings.
 */
export const ExecutorErrorStageSchema = z.enum(['request', 'load', 'execute', 'executor']);
export type ExecutorErrorStage = z.infer<typeof ExecutorErrorStageSchema>;

/** Stable failure categories emitted by compliant executors. */
export const ExecutorErrorCodeSchema = z.enum([
  'INVALID_REQUEST',
  'AUTHENTICATION_REQUIRED',
  'PACKAGE_IMPORT_FAILED',
  'TOOL_NOT_FOUND',
  'TOOL_CONFIGURATION_REQUIRED',
  'INVALID_TOOL',
  'SCHEMA_UNAVAILABLE',
  'TOOL_EXECUTION_FAILED',
  'EXECUTOR_UNAVAILABLE',
  'EXECUTION_TIMEOUT',
  'EXECUTOR_INTERNAL_ERROR',
]);
export type ExecutorErrorCode = z.infer<typeof ExecutorErrorCodeSchema>;

const ExecutorFailureBaseShape = {
  success: z.literal(false),
  error: z.string().min(1),
  retryable: z.boolean(),
};

const RequestFailureSchema = z.object({
  ...ExecutorFailureBaseShape,
  errorStage: z.literal('request'),
  errorCode: z.enum(['INVALID_REQUEST', 'AUTHENTICATION_REQUIRED']),
});

const LoadFailureSchema = z.object({
  ...ExecutorFailureBaseShape,
  errorStage: z.literal('load'),
  errorCode: z.enum([
    'PACKAGE_IMPORT_FAILED',
    'TOOL_NOT_FOUND',
    'TOOL_CONFIGURATION_REQUIRED',
    'INVALID_TOOL',
    'SCHEMA_UNAVAILABLE',
  ]),
});

const ExecuteFailureSchema = z.object({
  ...ExecutorFailureBaseShape,
  errorStage: z.literal('execute'),
  errorCode: z.enum(['TOOL_EXECUTION_FAILED', 'EXECUTION_TIMEOUT']),
});

const ExecutorInternalFailureSchema = z.object({
  ...ExecutorFailureBaseShape,
  errorStage: z.literal('executor'),
  errorCode: z.enum(['EXECUTOR_UNAVAILABLE', 'EXECUTOR_INTERNAL_ERROR']),
});

export const ExecutorFailureSchema = z.discriminatedUnion('errorStage', [
  RequestFailureSchema,
  LoadFailureSchema,
  ExecuteFailureSchema,
  ExecutorInternalFailureSchema,
]);
export type ExecutorFailure = z.infer<typeof ExecutorFailureSchema>;

export const ExecuteToolSuccessResponseSchema = z.object({
  success: z.literal(true),
  output: z.unknown().optional(),
  executionTimeMs: z.number().nonnegative(),
});

/** Strict response contract used at TPMJS-owned executor boundaries. */
const ExecuteToolFailureResponseSchema = z.discriminatedUnion('errorStage', [
  RequestFailureSchema.extend({ executionTimeMs: z.number().nonnegative() }),
  LoadFailureSchema.extend({ executionTimeMs: z.number().nonnegative() }),
  ExecuteFailureSchema.extend({ executionTimeMs: z.number().nonnegative() }),
  ExecutorInternalFailureSchema.extend({ executionTimeMs: z.number().nonnegative() }),
]);

export const TypedExecuteToolResponseSchema = z.union([
  ExecuteToolSuccessResponseSchema,
  ExecuteToolFailureResponseSchema,
]);
export type TypedExecuteToolResponse = z.infer<typeof TypedExecuteToolResponseSchema>;

export const LoadAndDescribeRequestSchema = z.object({
  packageName: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  importUrl: z.string().url().optional(),
  env: z.record(z.string(), z.string()).optional(),
});
export type LoadAndDescribeRequest = z.infer<typeof LoadAndDescribeRequestSchema>;

export const LoadAndDescribeResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    tool: z.object({
      name: z.string().min(1),
      description: z.string().min(1),
      inputSchema: z.unknown(),
    }),
  }),
  ExecutorFailureSchema,
]);
export type LoadAndDescribeResponse = z.infer<typeof LoadAndDescribeResponseSchema>;

export const ReportToolHealthRequestSchema = z.intersection(
  z.object({
    packageName: z.string().min(1),
    name: z.string().min(1),
  }),
  z.discriminatedUnion('success', [z.object({ success: z.literal(true) }), ExecutorFailureSchema])
);
export type ReportToolHealthRequest = z.infer<typeof ReportToolHealthRequestSchema>;

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
 * Default executor config (uses the TPMJS-managed executor)
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
  errorStage: ExecutorErrorStageSchema.optional(),
  errorCode: ExecutorErrorCodeSchema.optional(),
  retryable: z.boolean().optional(),
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

// =============================================================================
// Sandbox Session Management
// =============================================================================

export const CreateSessionRequestSchema = z.object({
  sessionId: z.string().min(1),
  timeoutSeconds: z.number().int().min(60).max(7200).optional(),
});

export interface CreateSessionRequest {
  sessionId: string;
  timeoutSeconds?: number;
}

export interface CreateSessionResponse {
  sessionId: string;
  workDir: string;
  createdAt: string;
  expiresAt: string;
  resumed: boolean;
}

export interface DestroySessionResponse {
  sessionId: string;
  destroyed: boolean;
}

export interface SessionStatusResponse {
  sessionId: string;
  workDir: string;
  createdAt: string;
  expiresAt: string;
  toolCallCount: number;
}

export const SandboxExecuteToolRequestSchema = z.object({
  packageName: z.string().min(1),
  name: z.string().min(1),
  version: z.string().optional(),
  importUrl: z.string().url().optional(),
  params: z.record(z.string(), z.unknown()),
  env: z.record(z.string(), z.string()).optional(),
  sessionId: z.string().min(1),
});

export interface SandboxExecuteToolRequest extends ExecuteToolRequest {
  sessionId: string;
}
