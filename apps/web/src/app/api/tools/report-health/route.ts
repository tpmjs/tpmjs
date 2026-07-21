import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '~/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Check if an error is due to missing environment variables (configuration issue)
 * rather than a broken tool (code issue)
 */
function isEnvironmentConfigError(error: string): boolean {
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
function isInputValidationError(error: string): boolean {
  const validationErrorPatterns = [
    /must have a valid.*domain/i,
    /valid.*path/i,
    /invalid.*url/i,
    /invalid.*format/i,
    /expected.*received/i,
    /must be.*string/i,
    /must be.*number/i,
    /must be.*boolean/i,
    /must be.*array/i,
    /must be.*object/i,
    /validation.*failed/i,
    /does not match/i,
    /too short/i,
    /too long/i,
    /minimum.*length/i,
    /maximum.*length/i,
  ];

  return validationErrorPatterns.some((pattern) => pattern.test(error));
}

/**
 * Check if an error is a configuration or input issue (not a broken tool)
 */
function isNonBreakingError(error: string): boolean {
  return isEnvironmentConfigError(error) || isInputValidationError(error);
}

interface ReportHealthRequest {
  packageName: string;
  name: string;
  success: boolean;
  error?: string;
  // 'execute' = the tool imported, initialized, and ran but threw (input
  // validation, missing credentials, a remote API error) — the tool itself is
  // working. 'load' = failed before execute() (import/factory/schema).
  errorStage?: 'load' | 'execute';
}

/**
 * POST /api/tools/report-health
 *
 * Centralized endpoint for reporting tool execution results.
 * All health status logic is here - playground and other clients just report results.
 *
 * This endpoint determines whether a failure should mark the tool as BROKEN or HEALTHY
 * based on the error type (env vars, validation = HEALTHY, infrastructure = BROKEN).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Check rate limit
  const rateLimitResponse = checkRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body: ReportHealthRequest = await request.json();
    const { packageName, name, success, error, errorStage } = body;

    if (!packageName || !name) {
      return NextResponse.json(
        { success: false, error: 'packageName and name are required' },
        { status: 400 }
      );
    }

    // Find the tool
    const tool = await prisma.tool.findFirst({
      where: {
        isActive: true,
        name,
        package: { npmPackageName: packageName },
      },
      select: { id: true },
    });

    if (!tool) {
      return NextResponse.json({ success: false, error: 'Tool not found' }, { status: 404 });
    }

    // Determine health status based on result
    let healthStatus: 'HEALTHY' | 'BROKEN';
    let healthError: string | null = null;

    if (success) {
      // Successful execution = HEALTHY
      healthStatus = 'HEALTHY';
    } else if (errorStage === 'execute') {
      // The tool imported, initialized, and RAN — the throw came from inside
      // execute() (validation, missing credentials, a remote API failure), so
      // the tool itself works. This is the structured signal that replaces the
      // brittle isNonBreakingError message-regex (kept below as a fallback only
      // for legacy clients that don't send errorStage).
      healthStatus = 'HEALTHY';
      console.log(
        `ℹ️  ${packageName}/${name} ran but threw (errorStage=execute, not broken): ${error}`
      );
    } else if (!errorStage && error && isNonBreakingError(error)) {
      // Legacy path: no errorStage supplied — fall back to message matching.
      healthStatus = 'HEALTHY';
      console.log(`ℹ️  ${packageName}/${name} failed due to config issue (not broken): ${error}`);
    } else {
      // Real failure (errorStage='load', or legacy unmatched) = BROKEN
      healthStatus = 'BROKEN';
      healthError = error || 'Unknown error';
    }

    // Update tool health status
    await prisma.tool.update({
      where: { id: tool.id },
      data: {
        executionHealth: healthStatus,
        healthCheckError: healthError,
        lastHealthCheck: new Date(),
      },
    });

    console.log(`🏥 Health updated for ${packageName}/${name}: ${healthStatus}`);

    return NextResponse.json({
      success: true,
      data: {
        toolId: tool.id,
        healthStatus,
        healthError,
      },
    });
  } catch (err) {
    console.error('Error reporting health:', err);
    return NextResponse.json({ success: false, error: 'Failed to report health' }, { status: 500 });
  }
}
