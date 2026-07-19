import { describe, expect, it } from 'vitest';
import {
  boundedPositiveInt,
  HEALTH_SLICE_DEFAULT,
  nextHealthCheckAt,
  nextMetricsAt,
  retryHealthCheckAt,
} from './bounded-work';

const NOW = new Date('2026-07-19T00:00:00.000Z');

describe('bounded maintenance policy', () => {
  it('caps caller-provided work and rejects invalid limits', () => {
    expect(boundedPositiveInt('5000', HEALTH_SLICE_DEFAULT, 100)).toBe(100);
    expect(boundedPositiveInt('7', HEALTH_SLICE_DEFAULT, 100)).toBe(7);
    expect(boundedPositiveInt('0', HEALTH_SLICE_DEFAULT, 100)).toBe(HEALTH_SLICE_DEFAULT);
    expect(boundedPositiveInt('nope', HEALTH_SLICE_DEFAULT, 100)).toBe(HEALTH_SLICE_DEFAULT);
  });

  it('uses deterministic jitter to avoid synchronized refresh waves', () => {
    expect(nextHealthCheckAt('tool-a', 'HEALTHY', NOW)).toEqual(
      nextHealthCheckAt('tool-a', 'HEALTHY', NOW)
    );
    expect(nextHealthCheckAt('tool-a', 'HEALTHY', NOW)).not.toEqual(
      nextHealthCheckAt('tool-b', 'HEALTHY', NOW)
    );
  });

  it('retries unknown and failed work sooner than definitive healthy work', () => {
    const unknown = nextHealthCheckAt('tool-a', 'UNKNOWN', NOW).getTime();
    const retry = retryHealthCheckAt('tool-a', NOW).getTime();
    const broken = nextHealthCheckAt('tool-a', 'BROKEN', NOW).getTime();
    const healthy = nextHealthCheckAt('tool-a', 'HEALTHY', NOW).getTime();
    expect(unknown).toBeLessThan(retry);
    expect(retry).toBeLessThan(broken);
    expect(broken).toBeLessThan(healthy);
  });

  it('spreads package metric refresh over the next day', () => {
    const next = nextMetricsAt('package-a', NOW).getTime();
    expect(next).toBeGreaterThanOrEqual(NOW.getTime() + 24 * 60 * 60 * 1000);
    expect(next).toBeLessThan(NOW.getTime() + 36 * 60 * 60 * 1000);
  });
});
