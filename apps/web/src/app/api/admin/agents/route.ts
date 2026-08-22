import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '~/lib/admin';
import { getAgentsAdmin } from '~/lib/admin/metrics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/admin/agents
 * All agents with owners and activity counts, plus recent conversations.
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
    void searchParams;
    const data = await getAgentsAdmin();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[Admin agents]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
