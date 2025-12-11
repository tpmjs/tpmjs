/**
 * Health Check Service
 * Checks tool import and execution health via Railway executor
 */

import { type HealthStatus, type Package, type Prisma, type Tool, prisma } from '@tpmjs/db';
import { env } from '~/env';

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
 * Check if a tool can be imported (load-and-describe)
 */
async function checkImportHealth(tool: Tool & { package: Package }): Promise<{
  status: HealthStatus;
  error: string | null;
  timeMs: number;
}> {
  const startTime = Date.now();

  try {
    const response = await fetch(`${RAILWAY_EXECUTOR_URL}/load-and-describe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageName: tool.package.npmPackageName,
        exportName: tool.exportName,
        version: tool.package.npmVersion,
        env: tool.package.env || {},
      }),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    const timeMs = Date.now() - startTime;
    const data = await response.json();

    if (!response.ok || !data.success) {
      const error = data.error || `HTTP ${response.status}`;

      // If error is config/input issue, tool is not broken
      if (isNonBreakingError(error)) {
        return {
          status: 'HEALTHY',
          error: null,
          timeMs,
        };
      }

      return {
        status: 'BROKEN',
        error,
        timeMs,
      };
    }

    // Verify tool has required fields
    if (!data.tool?.description || !data.tool?.inputSchema) {
      return {
        status: 'BROKEN',
        error: 'Missing required tool fields (description or inputSchema)',
        timeMs,
      };
    }

    return { status: 'HEALTHY', error: null, timeMs };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // If error is config/input issue, tool is not broken
    if (isNonBreakingError(errorMessage)) {
      return {
        status: 'HEALTHY',
        error: null,
        timeMs: Date.now() - startTime,
      };
    }

    return {
      status: 'BROKEN',
      error: errorMessage,
      timeMs: Date.now() - startTime,
    };
  }
}

/**
 * Check if a tool can execute with test parameters
 */
async function checkExecutionHealth(tool: Tool & { package: Package }): Promise<{
  status: HealthStatus;
  error: string | null;
  timeMs: number;
  testParams: Record<string, unknown>;
}> {
  const startTime = Date.now();

  // Generate test parameters based on tool schema
  const testParams = generateTestParameters(tool);

  try {
    const response = await fetch(`${RAILWAY_EXECUTOR_URL}/execute-tool`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageName: tool.package.npmPackageName,
        exportName: tool.exportName,
        version: tool.package.npmVersion,
        params: testParams,
        env: tool.package.env || {},
      }),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    const timeMs = Date.now() - startTime;
    const data = await response.json();

    if (!response.ok || !data.success) {
      const error = data.error || `HTTP ${response.status}`;

      // If error is config/input issue, tool is not broken - just needs proper input
      if (isNonBreakingError(error)) {
        return {
          status: 'HEALTHY',
          error: null, // Clear the error since it's not a code issue
          timeMs,
          testParams,
        };
      }

      return {
        status: 'BROKEN',
        error,
        timeMs,
        testParams,
      };
    }

    return { status: 'HEALTHY', error: null, timeMs, testParams };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // If error is config/input issue, tool is not broken
    if (isNonBreakingError(errorMessage)) {
      return {
        status: 'HEALTHY',
        error: null,
        timeMs: Date.now() - startTime,
        testParams,
      };
    }

    return {
      status: 'BROKEN',
      error: errorMessage,
      timeMs: Date.now() - startTime,
      testParams,
    };
  }
}

/**
 * Check if an error is due to missing environment variables (configuration issue)
 * rather than a broken tool (code issue)
 */
function isEnvironmentConfigError(error: string | null): boolean {
  if (!error) return false;

  const envErrorPatterns = [
    /is required/i,
    /is not set/i,
    /missing.*environment/i,
    /environment.*missing/i,
    /api key.*required/i,
    /api key.*not provided/i,
    /missing.*api key/i,
    /must be set/i,
    /not found.*environment/i,
    /please set/i,
    /please provide/i,
    /configure.*environment/i,
  ];

  return envErrorPatterns.some((pattern) => pattern.test(error));
}

/**
 * Check if an error is due to input validation (Zod validation, URL format, etc.)
 * These errors mean the tool is working correctly - it's validating input as expected
 */
function isInputValidationError(error: string | null): boolean {
  if (!error) return false;

  const validationErrorPatterns = [
    /must have a valid.*domain/i, // URL validation
    /valid.*path/i, // Path validation
    /invalid.*url/i, // URL format
    /invalid.*format/i, // General format validation
    /expected.*received/i, // Zod type errors
    /must be.*string/i, // Type validation
    /must be.*number/i,
    /must be.*boolean/i,
    /must be.*array/i,
    /must be.*object/i,
    /validation.*failed/i, // General validation
    /does not match/i, // Pattern/regex validation
    /too short/i, // Length validation
    /too long/i,
    /minimum.*length/i,
    /maximum.*length/i,
  ];

  return validationErrorPatterns.some((pattern) => pattern.test(error));
}

/**
 * Check if an error is a configuration or input issue (not a broken tool)
 */
function isNonBreakingError(error: string | null): boolean {
  return isEnvironmentConfigError(error) || isInputValidationError(error);
}

/**
 * Generate minimal test parameters for a tool
 * Uses required parameters with sensible defaults
 */
function generateTestParameters(tool: Tool & { package: Package }): Record<string, unknown> {
  const parameters = Array.isArray(tool.parameters)
    ? (tool.parameters as Array<{ name: string; type: string; required: boolean }>)
    : [];

  const testParams: Record<string, unknown> = {};

  for (const param of parameters) {
    if (param.required) {
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
  triggerSource = 'manual'
): Promise<HealthCheckResult> {
  // Fetch tool with package relation
  const tool = await prisma.tool.findUnique({
    where: { id: toolId },
    include: { package: true },
  });

  if (!tool) {
    throw new Error(`Tool not found: ${toolId}`);
  }

  console.log(`🏥 Health check starting for ${tool.package.npmPackageName}/${tool.exportName}`);

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

  // Create HealthCheck record
  await prisma.healthCheck.create({
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

  // Update Tool record with latest health status
  await prisma.tool.update({
    where: { id: tool.id },
    data: {
      importHealth: importResult.status,
      executionHealth: executionResult.status,
      lastHealthCheck: new Date(),
      healthCheckError: importResult.error || executionResult.error,
    },
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
 * Processes in batches to avoid overwhelming Railway
 */
export async function performBatchHealthCheck(
  toolIds: string[],
  triggerSource = 'daily-cron',
  batchSize = 5
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
          const result = await performHealthCheck(toolId, triggerSource);
          if (result.overallStatus === 'HEALTHY') healthy++;
          else if (result.overallStatus === 'BROKEN') broken++;
          else unknown++;
        } catch (error) {
          errors++;
          console.error(`  ❌ Health check failed for tool ${toolId}:`, error);
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
