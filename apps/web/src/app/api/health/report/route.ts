import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface HealthCheckReport {
  timestamp: string;
  source: string;
  runId?: string;
  checks: Record<string, 'pass' | 'fail' | undefined>;
}

/**
 * POST /api/health/report
 * Receives health check reports from GitHub Actions or other monitoring systems
 * Requires CRON_SECRET authorization
 */
export async function POST(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const report: HealthCheckReport = await request.json();

    // Calculate overall status
    const checkResults = Object.values(report.checks);
    const passCount = checkResults.filter((r) => r === 'pass').length;
    const failCount = checkResults.filter((r) => r === 'fail').length;
    const totalChecks = checkResults.length;
    const overallStatus =
      failCount === 0 ? 'healthy' : failCount < totalChecks / 2 ? 'degraded' : 'down';

    // Store the report in the database
    await prisma.endpointHealthReport.create({
      data: {
        timestamp: new Date(report.timestamp),
        source: report.source,
        runId: report.runId,
        checks: report.checks,
        passCount,
        failCount,
        totalChecks,
        overallStatus,
      },
    });

    // Clean up old reports (keep last 7 days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    await prisma.endpointHealthReport.deleteMany({
      where: { timestamp: { lt: cutoffDate } },
    });

    return NextResponse.json({
      success: true,
      data: {
        recorded: true,
        overallStatus,
        passCount,
        failCount,
        totalChecks,
      },
    });
  } catch (error) {
    console.error('[Health Report] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/health/report
 * Returns recent health check reports
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
  const hours = Math.min(parseInt(searchParams.get('hours') || '24', 10), 168); // Max 7 days

  try {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);

    const reports = await prisma.endpointHealthReport.findMany({
      where: { timestamp: { gte: cutoffDate } },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    // Calculate summary stats
    const totalReports = reports.length;
    const healthyCount = reports.filter((r) => r.overallStatus === 'healthy').length;
    const degradedCount = reports.filter((r) => r.overallStatus === 'degraded').length;
    const downCount = reports.filter((r) => r.overallStatus === 'down').length;

    // Calculate uptime percentage
    const uptimePercent =
      totalReports > 0 ? ((healthyCount / totalReports) * 100).toFixed(2) : '100.00';

    // Get per-check statistics
    const checkStats: Record<string, { pass: number; fail: number; total: number }> = {};
    for (const report of reports) {
      const checks = report.checks as Record<string, string>;
      for (const [checkName, status] of Object.entries(checks)) {
        if (!checkStats[checkName]) {
          checkStats[checkName] = { pass: 0, fail: 0, total: 0 };
        }
        checkStats[checkName].total++;
        if (status === 'pass') {
          checkStats[checkName].pass++;
        } else if (status === 'fail') {
          checkStats[checkName].fail++;
        }
      }
    }

    // Get current status (latest report)
    const latestReport = reports[0];
    const currentStatus = latestReport?.overallStatus || 'unknown';
    const lastChecked = latestReport?.timestamp || null;

    return NextResponse.json({
      success: true,
      data: {
        currentStatus,
        lastChecked,
        summary: {
          totalReports,
          healthy: healthyCount,
          degraded: degradedCount,
          down: downCount,
          uptimePercent: `${uptimePercent}%`,
          timeRange: `${hours} hours`,
        },
        checkStats: Object.entries(checkStats).map(([name, stats]) => ({
          name,
          ...stats,
          successRate:
            stats.total > 0 ? `${((stats.pass / stats.total) * 100).toFixed(1)}%` : 'N/A',
        })),
        recentReports: reports.slice(0, 20).map((r) => ({
          id: r.id,
          timestamp: r.timestamp,
          source: r.source,
          runId: r.runId,
          overallStatus: r.overallStatus,
          passCount: r.passCount,
          failCount: r.failCount,
          totalChecks: r.totalChecks,
          checks: r.checks,
        })),
      },
    });
  } catch (error) {
    console.error('[Health Report GET] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
