import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '~/lib/admin';
import { clampInt, getActivityFeed, parseActivityKind } from '~/lib/admin/metrics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/admin/activity
 * Unified activity feed across executions, API calls, searches, sync runs, definitive health checks, and created collections/agents/users/keys. Cursor = ISO timestamp (`before`).
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
    const data = await getActivityFeed({
      limit: clampInt(searchParams.get('limit'), 80, 300) || 80,
      before: searchParams.get('before'),
      kind: parseActivityKind(searchParams.get('kind')),
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[Admin activity]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
