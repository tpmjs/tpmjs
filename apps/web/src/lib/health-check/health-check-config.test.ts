import { MAX_HEALTH_CHECK_CLEANUP_STEPS, ToolHealthCheckConfigSchema } from '@tpmjs/types/tpmjs';
import { describe, expect, it } from 'vitest';
import {
  parseHealthCheckConfig,
  renderHealthCheckParams,
  resolveCleanupParams,
} from './health-check-config';

describe('health-check contract', () => {
  it('accepts bounded static and result-mapped cleanup declarations', () => {
    const parsed = ToolHealthCheckConfigSchema.safeParse({
      testParams: { name: 'health-check-{{timestamp}}' },
      cleanup: [
        {
          tool: 'deleteService',
          params: { name: 'health-check-{{timestamp}}' },
          mapping: { serviceId: 'resource.id' },
        },
      ],
    });

    expect(parsed.success).toBe(true);
  });

  it('rejects amplification and contradictory skip declarations', () => {
    const step = { tool: 'cleanup', params: {} };
    expect(
      ToolHealthCheckConfigSchema.safeParse({
        cleanup: Array.from({ length: MAX_HEALTH_CHECK_CLEANUP_STEPS + 1 }, () => step),
      }).success
    ).toBe(false);
    expect(
      ToolHealthCheckConfigSchema.safeParse({ skipExecution: true, testParams: {} }).success
    ).toBe(false);
  });

  it('safe-parses database JSON and ignores malformed rows', () => {
    expect(parseHealthCheckConfig({ skipExecution: true })).toEqual({ skipExecution: true });
    expect(parseHealthCheckConfig({ skipExecution: 'yes' })).toBeNull();
    expect(parseHealthCheckConfig({ skipExecution: true, typo: true })).toBeNull();
  });

  it('renders one timestamp recursively across execution parameters', () => {
    expect(
      renderHealthCheckParams(
        {
          name: 'health-check-{{timestamp}}',
          nested: { labels: ['run-{{timestamp}}'] },
        },
        1234
      )
    ).toEqual({ name: 'health-check-1234', nested: { labels: ['run-1234'] } });
  });

  it('resolves cleanup params from the same template context and execution output', () => {
    expect(
      resolveCleanupParams(
        {
          tool: 'deleteService',
          params: { name: 'health-check-{{timestamp}}' },
          mapping: { serviceId: 'resource.id' },
        },
        { resource: { id: 'svc_123' } },
        9876
      )
    ).toEqual({
      ok: true,
      params: { name: 'health-check-9876', serviceId: 'svc_123' },
    });
  });

  it('refuses a cleanup call when a mapped result is absent', () => {
    expect(
      resolveCleanupParams({ tool: 'deleteService', mapping: { serviceId: 'resource.id' } }, {}, 1)
    ).toEqual({ ok: false, missingPaths: ['resource.id'] });
  });
});
