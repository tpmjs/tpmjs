import { createHash, timingSafeEqual } from 'node:crypto';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Fail-closed bearer auth for cron/sync endpoints.
 *
 * Returns a response when the request must be rejected, or null when the
 * caller is authorized. If CRON_SECRET is not configured the endpoint refuses
 * to run (500) rather than silently accepting anonymous callers — a missing
 * env var must never turn destructive cron endpoints world-writable.
 */
export function requireCronAuth(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { success: false, error: 'CRON_SECRET is not configured' },
      { status: 500 }
    );
  }

  const token = request.headers.get('authorization')?.replace('Bearer ', '') ?? '';
  const tokenHash = createHash('sha256').update(token).digest();
  const secretHash = createHash('sha256').update(secret).digest();

  if (!timingSafeEqual(tokenHash, secretHash)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
