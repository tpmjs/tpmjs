/**
 * Health Check Service
 * Checks tool import and execution health via the configured Deno executor.
 */

import { type HealthStatus, type Package, type Prisma, prisma, type Tool } from '@tpmjs/db';
import {
  LoadAndDescribeResponseSchema,
  TypedExecuteToolResponseSchema,
} from '@tpmjs/types/executor';
import type { ToolHealthCheckCleanupStep } from '@tpmjs/types/tpmjs';
import { env } from '~/env';
import { executorAuthHeaders } from '~/lib/executors/internal-auth';
import {
  classifyExecutorFailure,
  indeterminateExecutorResult,
} from '~/lib/health-check/executor-health-verdict';
import {
  HEALTH_CHECK_SKIP_REASON,
  parseHealthCheckConfig,
  renderHealthCheckParams,
  resolveCleanupParams,
} from '~/lib/health-check/health-check-config';
import {
  nextHealthCheckAt,
  recentInconclusiveStreak,
  releaseHealthLease,
} from '~/lib/maintenance/bounded-work';
import { importFailureStreakUpdate } from '~/lib/tool-health-policy';

const RAILWAY_EXECUTOR_URL = env.RAILWAY_EXECUTOR_URL;

interface HealthCheckResult {
  toolId: string;
  importStatus: HealthStatus;
  importError: string | null;
  importTimeMs: number | null;
  executionStatus: HealthStatus;
  executionError: string | null;
  executionTimeMs: number | null;
  overallStatus: HealthStatus;
}

/**
 * Run author-declared, same-package cleanup in order. Cleanup is deliberately
 * best effort: it mitigates a successful test's side effects, but can neither
 * make execution safe nor rewrite the health verdict after the fact.
 */
async function executeCleanup(
  tool: Tool & { package: Package },
  cleanupSteps: ToolHealthCheckCleanupStep[],
  executionOutput: unknown,
  timestamp: number
): Promise<void> {
  for (const step of cleanupSteps) {
    const resolution = resolveCleanupParams(step, executionOutput, timestamp);
    if (!resolution.ok) {
      console.warn(
        `  Cleanup skipped: ${step.tool} could not resolve output path(s): ${resolution.missingPaths.join(', ')}`
      );
      continue;
    }

    try {
      console.log(`  Cleanup: calling same-package tool ${step.tool}`);
      const response = await fetch(`${RAILWAY_EXECUTOR_URL}/execute-tool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...executorAuthHeaders() },
        body: JSON.stringify({
          packageName: tool.package.npmPackageName,
          name: step.tool,
          version: tool.package.npmVersion,
          params: resolution.params,
          env: {},
        }),
        signal: AbortSignal.timeout(10000),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success !== true) {
        console.warn(
          `  Cleanup warning: ${step.tool} returned ${response.status}: ${data.error || 'unknown error'}`
        );
      } else {
        console.log(`  Cleanup: ${step.tool} succeeded`);
      }
    } catch (error) {
      console.warn(
        `  Cleanup warning: ${step.tool} failed: ${error instanceof Error ? error.message : 'unknown error'}`
      );
    }
  }
}

/**
 * Check if a tool can be imported (load-and-describe)
 */
export async function checkImportHealth(tool: Tool & { package: Package }): Promise<{
  status: HealthStatus;
  error: string | null;
  timeMs: number;
}> {
  const startTime = Date.now();

  try {
    const response = await fetch(`${RAILWAY_EXECUTOR_URL}/load-and-describe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...executorAuthHeaders() },
      body: JSON.stringify({
        packageName: tool.package.npmPackageName,
        name: tool.name,
        version: tool.package.npmVersion,
        // packages.env is an array of env-var DESCRIPTORS ({name, required,…}),
        // not key→value pairs — there are no real credential values to send.
        env: {},
      }),
      signal: AbortSignal.timeout(60000), // 60s — one leased tool may have a slow cold import.
    });

    const timeMs = Date.now() - startTime;
    const rawData: unknown = await response.json().catch(() => undefined);
    const parsed = LoadAndDescribeResponseSchema.safeParse(rawData);

    if (!parsed.success) {
      const verdict = indeterminateExecutorResult(
        `Executor protocol error during import (HTTP ${response.status})`
      );
      return { ...verdict, timeMs };
    }

    if (!parsed.data.success) {
      const verdict = classifyExecutorFailure(parsed.data);
      return { ...verdict, timeMs };
    }

    return { status: 'HEALTHY', error: null, timeMs };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Exceptions here are transport/protocol failures by control flow. They
    // say nothing about the package, regardless of their wording.
    return {
      status: 'UNKNOWN',
      error: `Executor transport failure (kept prior status): ${errorMessage}`,
      timeMs: Date.now() - startTime,
    };
  }
}

/**
 * Check if a tool can execute with test parameters
 *
 * IMPORTANT: A typed execute-stage error proves the tool is callable and is
 * HEALTHY. Deterministic load-stage failures are BROKEN. Transport, executor,
 * request, and untyped legacy failures are UNKNOWN and preserve prior state.
 */
export async function checkExecutionHealth(tool: Tool & { package: Package }): Promise<{
  status: HealthStatus;
  error: string | null;
  timeMs: number;
  testParams: Record<string, unknown>;
}> {
  const startTime = Date.now();

  // The database is an untrusted persistence boundary even though package
  // metadata was validated during sync. Invalid/stale JSON gets no authority
  // over execution behavior.
  const healthCheckConfig = parseHealthCheckConfig(tool.healthCheckConfig);
  if (tool.healthCheckConfig !== null && !healthCheckConfig) {
    console.warn(`  Execution: ignoring invalid persisted healthCheck config for tool ${tool.id}`);
  }

  if (healthCheckConfig?.skipExecution) {
    return {
      status: 'UNKNOWN',
      error: HEALTH_CHECK_SKIP_REASON,
      timeMs: 0,
      testParams: {},
    };
  }

  // A single render timestamp is shared with cleanup, so a declared resource
  // name such as health-check-{{timestamp}} is exactly reproducible for undo.
  const templateTimestamp = Date.now();
  const testParams = healthCheckConfig?.testParams
    ? renderHealthCheckParams(healthCheckConfig.testParams, templateTimestamp)
    : generateTestParameters(tool);

  try {
    const response = await fetch(`${RAILWAY_EXECUTOR_URL}/execute-tool`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...executorAuthHeaders() },
      body: JSON.stringify({
        packageName: tool.package.npmPackageName,
        name: tool.name,
        version: tool.package.npmVersion,
        params: testParams,
        // Descriptor array, not values — see checkImportHealth.
        env: {},
      }),
      signal: AbortSignal.timeout(60000), // 60s — bounded by the route's finite leased slice.
    });

    const timeMs = Date.now() - startTime;

    const rawData: unknown = await response.json().catch(() => undefined);
    const parsed = TypedExecuteToolResponseSchema.safeParse(rawData);

    if (!parsed.success) {
      const verdict = indeterminateExecutorResult(
        `Executor protocol error during execution (HTTP ${response.status})`
      );
      return { ...verdict, timeMs, testParams };
    }

    const data = parsed.data;
    if (data.success) {
      if (healthCheckConfig?.cleanup?.length) {
        await executeCleanup(tool, healthCheckConfig.cleanup, data.output, templateTimestamp);
      }
      return { status: 'HEALTHY', error: null, timeMs, testParams };
    }

    const verdict = classifyExecutorFailure(data);
    if (verdict.status === 'HEALTHY' && healthCheckConfig?.cleanup?.length) {
      // execute-stage errors may happen after a side effect. Cleanup remains
      // best effort; unresolved output mappings are skipped honestly.
      await executeCleanup(tool, healthCheckConfig.cleanup, undefined, templateTimestamp);
    }
    return { ...verdict, timeMs, testParams };
  } catch (error) {
    // Network/timeout errors are infrastructure issues
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Transient infra (executor timeout/network under sweep load) — mark
    // UNKNOWN so a saturated executor doesn't permanently flag healthy tools
    // BROKEN. The tool keeps its prior status; the next sweep re-checks it.
    return {
      status: 'UNKNOWN',
      error: `Executor transport failure (kept prior status): ${errorMessage}`,
      timeMs: Date.now() - startTime,
      testParams,
    };
  }
}

/**
 * Generate minimal test parameters for a tool
 * Uses required parameters with sensible defaults
 */
function generateTestParameters(tool: Tool & { package: Package }): Record<string, unknown> {
  const parameters = Array.isArray(tool.parameters)
    ? (tool.parameters as Array<{ name: string; type: string; required: boolean }>)
    : [];

  // The full JSON schema (tools.input_schema) carries enums and defaults that
  // the flat parameters list loses — an enum's first value exercises the
  // tool's happy path where a literal 'test' is a guaranteed validation reject.
  const schemaProperties =
    (tool.inputSchema as { properties?: Record<string, Record<string, unknown>> } | null)
      ?.properties || {};

  const testParams: Record<string, unknown> = {};

  for (const param of parameters) {
    if (param.required) {
      const propSchema = schemaProperties[param.name];
      if (propSchema?.default !== undefined) {
        testParams[param.name] = propSchema.default;
        continue;
      }
      if (Array.isArray(propSchema?.enum) && propSchema.enum.length > 0) {
        testParams[param.name] = propSchema.enum[0];
        continue;
      }

      // Generate minimal test value based on type
      switch (param.type) {
        case 'string':
          testParams[param.name] = 'test';
          break;
        case 'number':
          testParams[param.name] = 1;
          break;
        case 'boolean':
          testParams[param.name] = true;
          break;
        case 'object':
          testParams[param.name] = {};
          break;
        case 'array':
          testParams[param.name] = [];
          break;
        default:
          testParams[param.name] = 'test';
      }
    }
  }

  return testParams;
}

/**
 * Perform full health check on a tool (import + execution)
 */
export async function performHealthCheck(
  toolId: string,
  triggerSource = 'manual',
  leaseOwner?: string
): Promise<HealthCheckResult> {
  // Fetch tool with package relation
  const tool = await prisma.tool.findUnique({
    where: { id: toolId },
    include: { package: true },
  });

  if (!tool || !tool.isActive) {
    throw new Error(`Tool not found: ${toolId}`);
  }

  console.log(`🏥 Health check starting for ${tool.package.npmPackageName}/${tool.name}`);

  // Check import health
  const importResult = await checkImportHealth(tool);
  console.log(
    `  Import: ${importResult.status} ${importResult.error ? `(${importResult.error})` : ''}`
  );

  // Only check execution if import succeeded
  let executionResult: Awaited<ReturnType<typeof checkExecutionHealth>>;
  if (importResult.status === 'HEALTHY') {
    executionResult = await checkExecutionHealth(tool);
    console.log(
      `  Execution: ${executionResult.status} ${executionResult.error ? `(${executionResult.error})` : ''}`
    );
  } else {
    // Skip execution check if import failed
    executionResult = {
      status: 'UNKNOWN',
      error: 'Skipped due to import failure',
      timeMs: 0,
      testParams: {},
    };
    console.log('  Execution: UNKNOWN (skipped due to import failure)');
  }

  // Determine overall status
  const overallStatus: HealthStatus =
    importResult.status === 'BROKEN' || executionResult.status === 'BROKEN'
      ? 'BROKEN'
      : importResult.status === 'HEALTHY' && executionResult.status === 'HEALTHY'
        ? 'HEALTHY'
        : 'UNKNOWN';

  console.log(`  Overall: ${overallStatus}`);

  // Update Tool record with latest health status. A transient/skipped UNKNOWN
  // result must NOT clobber a good prior status — only definitive HEALTHY/BROKEN
  // results overwrite (otherwise a saturated-executor sweep would wipe the
  // registry's health to UNKNOWN).
  const nextImport = importResult.status === 'UNKNOWN' ? tool.importHealth : importResult.status;
  const nextExecution =
    executionResult.status === 'UNKNOWN' ? tool.executionHealth : executionResult.status;
  const checkedAt = new Date();
  const inconclusiveStreak =
    overallStatus === 'UNKNOWN' ? await recentInconclusiveStreak(tool.id) : 0;
  const nextAt = nextHealthCheckAt(tool.id, overallStatus, checkedAt, inconclusiveStreak);

  // The audit row, current status, schedule, and lease release are one commit.
  // A worker whose lease expired and was reassigned cannot publish a stale
  // verdict over the newer owner.
  await prisma.$transaction(async (tx) => {
    const toolData = {
      importHealth: nextImport,
      executionHealth: nextExecution,
      ...importFailureStreakUpdate(importResult.status),
      lastHealthCheck: checkedAt,
      healthCheckNextAt: nextAt,
      healthCheckLeaseUntil: null,
      healthCheckLeasedBy: null,
      ...(importResult.status !== 'UNKNOWN' || executionResult.status !== 'UNKNOWN'
        ? { healthCheckError: importResult.error || executionResult.error }
        : {}),
    };

    if (leaseOwner) {
      const owned = await tx.tool.updateMany({
        where: { id: tool.id, healthCheckLeasedBy: leaseOwner },
        data: toolData,
      });
      if (owned.count !== 1) throw new Error(`Health lease lost for tool ${tool.id}`);
    } else {
      await tx.tool.update({ where: { id: tool.id }, data: toolData });
    }

    await tx.healthCheck.create({
      data: {
        toolId: tool.id,
        checkType: 'FULL',
        triggerSource,
        importStatus: importResult.status,
        importError: importResult.error,
        importTimeMs: importResult.timeMs,
        executionStatus: executionResult.status,
        executionError: executionResult.error,
        executionTimeMs: executionResult.timeMs,
        testParameters: executionResult.testParams as Prisma.InputJsonValue,
        overallStatus,
      },
    });
  });

  return {
    toolId: tool.id,
    importStatus: importResult.status,
    importError: importResult.error,
    importTimeMs: importResult.timeMs,
    executionStatus: executionResult.status,
    executionError: executionResult.error,
    executionTimeMs: executionResult.timeMs,
    overallStatus,
  };
}

/**
 * Batch health check for multiple tools
 * Processes the already-finite lease in small batches to avoid executor bursts.
 */
export async function performBatchHealthCheck(
  toolIds: string[],
  triggerSource = 'scheduled-slice',
  batchSize = 5,
  leaseOwner?: string
): Promise<{
  total: number;
  healthy: number;
  broken: number;
  unknown: number;
  errors: number;
}> {
  let healthy = 0;
  let broken = 0;
  let unknown = 0;
  let errors = 0;

  console.log(
    `🏥 Batch health check starting for ${toolIds.length} tools (batch size: ${batchSize})`
  );

  // Process in batches
  for (let i = 0; i < toolIds.length; i += batchSize) {
    const batch = toolIds.slice(i, i + batchSize);
    console.log(
      `  Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(toolIds.length / batchSize)}`
    );

    await Promise.all(
      batch.map(async (toolId) => {
        try {
          const result = await performHealthCheck(toolId, triggerSource, leaseOwner);
          if (result.overallStatus === 'HEALTHY') healthy++;
          else if (result.overallStatus === 'BROKEN') broken++;
          else unknown++;
        } catch (error) {
          errors++;
          console.error(`  ❌ Health check failed for tool ${toolId}:`, error);
          if (leaseOwner) await releaseHealthLease(toolId, leaseOwner).catch(console.error);
        }
      })
    );

    // Brief delay between batches to avoid rate limiting
    if (i + batchSize < toolIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(
    `✅ Batch health check complete: ${healthy} healthy, ${broken} broken, ${unknown} unknown, ${errors} errors`
  );

  return { total: toolIds.length, healthy, broken, unknown, errors };
}
