import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

function request(ip: string): NextRequest {
  return new NextRequest('https://tpmjs.com/api/test', {
    headers: { 'x-forwarded-for': ip },
  });
}

afterEach(() => {
  vi.useRealTimers();
  vi.resetModules();
});

describe('self-hosted request rate limiting', () => {
  it('preserves long-window entries when periodic cleanup runs', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-21T12:00:00Z'));

    const { checkRateLimitDistributed } = await import('./rate-limit');
    const hourly = { limit: 1, windowSeconds: 3600, prefix: 'hourly-test' };

    expect(await checkRateLimitDistributed(request('192.0.2.1'), hourly)).toBeNull();

    // Cross the store's five-minute cleanup interval without crossing the
    // configured one-hour rate-limit window.
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    expect(
      await checkRateLimitDistributed(request('192.0.2.2'), {
        limit: 10,
        windowSeconds: 60,
        prefix: 'cleanup-trigger',
      })
    ).toBeNull();

    const limited = await checkRateLimitDistributed(request('192.0.2.1'), hourly);
    expect(limited?.status).toBe(429);
  });

  it('allows a request again after its configured window expires', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-21T12:00:00Z'));

    const { checkRateLimit } = await import('./rate-limit');
    const config = { limit: 1, windowSeconds: 60, prefix: 'expiry-test' };
    const client = request('192.0.2.3');

    expect(checkRateLimit(client, config)).toBeNull();
    expect(checkRateLimit(client, config)?.status).toBe(429);

    vi.advanceTimersByTime(60 * 1000 + 1);
    expect(checkRateLimit(client, config)).toBeNull();
  });
});
