import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '~/lib/admin';
import { clampHours, clampInt, getExecutionStats } from '~/lib/admin/metrics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/admin/executions
 * Tool execution telemetry: windows, status/category/source breakdowns, top tools, hourly series, filtered rows.
 * Requires ADMIN role.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (response) {
    if (response instanceof Response) return response;
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const data = await getExecutionStats({
      hours: clampHours(searchParams.get('hours'), 24),
      status: searchParams.get('status'),
      packageName: searchParams.get('package'),
      source: searchParams.get('source'),
      tool: searchParams.get('tool'),
      limit: clampInt(searchParams.get('limit'), 50, 200) || 50,
      offset: clampInt(searchParams.get('offset'), 0, 100_000),
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[Admin executions]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
