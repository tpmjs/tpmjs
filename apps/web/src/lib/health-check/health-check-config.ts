import type { Prisma } from '@tpmjs/db';
import {
  type ToolHealthCheckCleanupStep,
  type ToolHealthCheckConfig,
  ToolHealthCheckConfigSchema,
} from '@tpmjs/types/tpmjs';

export const HEALTH_CHECK_SKIP_REASON = 'Skipped by author healthCheck contract';

/** Parse untrusted/stale JSON from the database before it can steer a check. */
export function parseHealthCheckConfig(
  value: Prisma.JsonValue | null
): ToolHealthCheckConfig | null {
  if (value === null) return null;
  const parsed = ToolHealthCheckConfigSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/**
 * Recursively render the deliberately tiny health-check template language.
 * One timestamp is supplied by the caller and reused for execution + cleanup.
 */
export function renderHealthCheckTemplates(value: unknown, timestamp: number): unknown {
  if (typeof value === 'string') {
    return value.replace(/\{\{timestamp\}\}/g, String(timestamp));
  }
  if (Array.isArray(value)) {
    return value.map((item) => renderHealthCheckTemplates(item, timestamp));
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, renderHealthCheckTemplates(item, timestamp)])
    );
  }
  return value;
}

export function renderHealthCheckParams(
  params: Record<string, unknown> | undefined,
  timestamp: number
): Record<string, unknown> {
  return (renderHealthCheckTemplates(params ?? {}, timestamp) ?? {}) as Record<string, unknown>;
}

function readOutputPath(output: unknown, path: string): unknown {
  let current = output;
  for (const segment of path.split('.')) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

export type CleanupParamsResolution =
  | { ok: true; params: Record<string, unknown> }
  | { ok: false; missingPaths: string[] };

/** Resolve static/template params plus fields returned by the checked tool. */
export function resolveCleanupParams(
  step: ToolHealthCheckCleanupStep,
  executionOutput: unknown,
  timestamp: number
): CleanupParamsResolution {
  const params = renderHealthCheckParams(step.params, timestamp);
  const missingPaths: string[] = [];

  for (const [paramName, outputPath] of Object.entries(step.mapping ?? {})) {
    const value = readOutputPath(executionOutput, outputPath);
    if (value === undefined) {
      missingPaths.push(outputPath);
    } else {
      params[paramName] = value;
    }
  }

  return missingPaths.length > 0 ? { ok: false, missingPaths } : { ok: true, params };
}
