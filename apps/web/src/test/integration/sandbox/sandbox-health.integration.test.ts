/**
 * Sandbox Server — Health & Metrics integration tests
 *
 * Tests GET /health and GET /metrics endpoints.
 * These are always public (no auth required).
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  getSandboxTestContext,
  isSandboxAvailable,
  type SandboxTestContext,
} from './_helpers/sandbox-context';

describe.skipIf(!isSandboxAvailable())('Sandbox Health & Metrics', () => {
  let ctx: SandboxTestContext;

  beforeAll(() => {
    ctx = getSandboxTestContext();
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  // ─── GET /health ─────────────────────────────────────────────────────────

  it('should return health with correct shape', async () => {
    const { status, data } = await ctx.client.health();

    expect(status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.version).toEqual(expect.any(String));
    expect(data.info).toMatchObject({
      runtime: 'deno',
      denoVersion: expect.any(String),
      activeSessions: expect.any(Number),
      maxSessions: expect.any(Number),
      cachedModules: expect.any(Number),
      capabilities: {
        sessions: true,
        executeToolWithSession: true,
      },
    });
  });

  it('should respond to health within 2 seconds', async () => {
    const start = Date.now();
    const { status } = await ctx.client.health();
    const elapsed = Date.now() - start;

    expect(status).toBe(200);
    expect(elapsed).toBeLessThan(2000);
  });

  // ─── GET /metrics ────────────────────────────────────────────────────────

  it('should return metrics with correct shape', async () => {
    const { status, data } = await ctx.client.metrics();

    expect(status).toBe(200);
    expect(data.uptime).toEqual(expect.any(Number));
    expect(data.uptime).toBeGreaterThan(0);
    expect(data.sessions).toMatchObject({
      active: expect.any(Number),
      max: expect.any(Number),
      totalCreated: expect.any(Number),
      totalDestroyed: expect.any(Number),
    });
    expect(data.executions).toMatchObject({
      total: expect.any(Number),
      successful: expect.any(Number),
      failed: expect.any(Number),
    });
    expect(data.memory).toMatchObject({
      rss: expect.any(Number),
      heapUsed: expect.any(Number),
      heapTotal: expect.any(Number),
    });
    expect(data.cache).toMatchObject({
      modules: expect.any(Number),
      maxSize: expect.any(Number),
    });
  });
});
