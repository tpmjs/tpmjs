import { prisma } from '@tpmjs/db';
import { ReportToolHealthRequestSchema } from '@tpmjs/types/executor';
import { type NextRequest, NextResponse } from 'next/server';
import { classifyExecutorFailure } from '~/lib/health-check/executor-health-verdict';
import { checkRateLimit } from '~/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/tools/report-health
 *
 * Centralized endpoint for reporting tool execution results.
 * All health status logic is here - playground and other clients just report results.
 *
 * This endpoint classifies only the machine-readable executor stage/code. The
 * human-readable message is retained for operators but never drives state.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Check rate limit
  const rateLimitResponse = checkRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const rawBody: unknown = await request.json().catch(() => undefined);
    const parsed = ReportToolHealthRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid typed health report' },
        { status: 400 }
      );
    }
    const body = parsed.data;
    const { packageName, name } = body;

    // Find the tool
    const tool = await prisma.tool.findFirst({
      where: {
        isActive: true,
        name,
        package: { npmPackageName: packageName },
      },
      select: { id: true, executionHealth: true, healthCheckError: true },
    });

    if (!tool) {
      return NextResponse.json({ success: false, error: 'Tool not found' }, { status: 404 });
    }

    const verdict = body.success
      ? ({ status: 'HEALTHY', error: null } as const)
      : classifyExecutorFailure(body);

    // Indeterminate observations describe the caller/executor or a
    // credential-free configuration boundary. Like scheduled sweeps, they
    // preserve the last definitive tool state rather than erasing it.
    const healthStatus =
      verdict.status === 'UNKNOWN' ? (tool.executionHealth ?? 'UNKNOWN') : verdict.status;
    const healthError =
      verdict.status === 'UNKNOWN'
        ? tool.healthCheckError
        : verdict.status === 'BROKEN'
          ? verdict.error
          : null;

    // Update tool health status
    await prisma.tool.update({
      where: { id: tool.id },
      data: {
        executionHealth: healthStatus,
        healthCheckError: healthError,
        lastHealthCheck: new Date(),
      },
    });

    console.log(
      `🏥 Health observed for ${packageName}/${name}: ${verdict.status}; persisted ${healthStatus}`
    );

    return NextResponse.json({
      success: true,
      data: {
        toolId: tool.id,
        observedStatus: verdict.status,
        healthStatus,
        healthError,
      },
    });
  } catch (err) {
    console.error('Error reporting health:', err);
    return NextResponse.json({ success: false, error: 'Failed to report health' }, { status: 500 });
  }
}
