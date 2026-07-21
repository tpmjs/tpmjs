import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.useRealTimers();
  vi.resetModules();
});

describe('self-hosted API-key rate limiting', () => {
  it('enforces the configured hourly limit', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-21T12:00:00Z'));

    const { checkApiKeyRateLimit } = await import('./rate-limit');

    expect((await checkApiKeyRateLimit('key-a', 'FREE', 2)).allowed).toBe(true);
    expect((await checkApiKeyRateLimit('key-a', 'FREE', 2)).allowed).toBe(true);
    const denied = await checkApiKeyRateLimit('key-a', 'FREE', 2);
    expect(denied.allowed).toBe(false);
    expect(denied.current).toBe(3);
    expect(denied.remaining).toBe(0);
  });

  it('evicts the oldest key when the bounded store overflows', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-21T12:00:00Z'));

    const { checkApiKeyRateLimit } = await import('./rate-limit');

    for (let index = 0; index <= 10_000; index++) {
      await checkApiKeyRateLimit(`churn-${index}`, 'FREE', 2);
    }

    const oldest = await checkApiKeyRateLimit('churn-0', 'FREE', 2);
    expect(oldest.current).toBe(1);
    expect(oldest.allowed).toBe(true);
  });
});
