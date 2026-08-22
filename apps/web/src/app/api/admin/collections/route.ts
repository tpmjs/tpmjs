import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '~/lib/admin';
import { getCollectionsAdmin } from '~/lib/admin/metrics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/admin/collections
 * All collections (owner, visibility, tool counts, env var names only) and custom MCP servers (no tokens).
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
    const data = await getCollectionsAdmin();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[Admin collections]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
