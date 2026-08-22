import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '~/lib/admin';
import { clampHours, getApiUsageStats } from '~/lib/admin/metrics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/admin/api-usage
 * Platform API-key usage: per-endpoint and per-key aggregates, status codes, rate-limit consumption, hourly series, recent errors.
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
    const data = await getApiUsageStats(clampHours(searchParams.get('hours'), 24));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[Admin api-usage]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
