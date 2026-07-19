import { type NextRequest, NextResponse } from 'next/server';
import { requireCronAuth } from '~/lib/cron-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Compatibility endpoint. Execution, conversation, and message counters are
 * maintained in the same transaction as their durable source rows by database
 * triggers. No recurring whole-history aggregation remains.
 */
export async function POST(request: NextRequest) {
  const unauthorized = requireCronAuth(request);
  if (unauthorized) return unauthorized;
  return NextResponse.json({
    success: true,
    data: { mode: 'transactional', scannedRows: 0, updatedRows: 0 },
  });
}
