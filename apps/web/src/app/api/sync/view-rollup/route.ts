import { type NextRequest, NextResponse } from 'next/server';
import { requireCronAuth } from '~/lib/cron-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Compatibility endpoint. View counters are maintained transactionally by the
 * tpmjs_page_view_delta database trigger. The former implementation grouped
 * all historical PageView rows and issued one update per entity every day.
 */
export async function POST(request: NextRequest) {
  const unauthorized = requireCronAuth(request);
  if (unauthorized) return unauthorized;
  return NextResponse.json({
    success: true,
    data: { mode: 'transactional', scannedRows: 0, updatedRows: 0 },
  });
}
