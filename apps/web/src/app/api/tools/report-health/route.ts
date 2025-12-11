import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
  exportName: string;
  success: boolean;
  error?: string;
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
  try {
    const body: ReportHealthRequest = await request.json();
    const { packageName, exportName, success, error } = body;

    if (!packageName || !exportName) {
      return NextResponse.json(
        { success: false, error: 'packageName and exportName are required' },
        { status: 400 }
      );
    }

    // Find the tool
    const tool = await prisma.tool.findFirst({
      where: {
        exportName,
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
    } else if (error && isNonBreakingError(error)) {
      // Failed due to config/validation = HEALTHY (tool works, just needs setup)
      healthStatus = 'HEALTHY';
      console.log(
        `ℹ️  ${packageName}/${exportName} failed due to config issue (not broken): ${error}`
      );
    } else {
      // Real failure = BROKEN
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

    console.log(`🏥 Health updated for ${packageName}/${exportName}: ${healthStatus}`);

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
