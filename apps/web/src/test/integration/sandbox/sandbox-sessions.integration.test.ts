/**
 * Sandbox Server — Session management integration tests
 *
 * Tests POST /sessions, GET /sessions/:id, DELETE /sessions/:id.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  getSandboxTestContext,
  isSandboxAvailable,
  type SandboxTestContext,
} from './_helpers/sandbox-context';

describe.skipIf(!isSandboxAvailable())('Sandbox Sessions', () => {
  let ctx: SandboxTestContext;

  beforeAll(() => {
    ctx = getSandboxTestContext();
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  // ─── Create ──────────────────────────────────────────────────────────────

  it('should create a new session', async () => {
    const sessionId = ctx.uniqueSessionId('create');
    ctx.trackSession(sessionId);

    const { status, data } = await ctx.client.createSession(sessionId);

    expect(status).toBe(200);
    expect(data.sessionId).toBe(sessionId);
    expect(data.workDir).toContain(sessionId.replace(/[^a-zA-Z0-9_:-]/g, '_'));
    expect(data.resumed).toBe(false);
    expect(data.createdAt).toEqual(expect.any(String));
    expect(data.expiresAt).toEqual(expect.any(String));
    // expiresAt should be after createdAt
    expect(new Date(data.expiresAt).getTime()).toBeGreaterThan(new Date(data.createdAt).getTime());
  });

  // ─── Get ─────────────────────────────────────────────────────────────────

  it('should get an existing session', async () => {
    const sessionId = ctx.uniqueSessionId('get');
    ctx.trackSession(sessionId);

    await ctx.client.createSession(sessionId);
    const { status, data } = await ctx.client.getSession(sessionId);

    expect(status).toBe(200);
    expect('sessionId' in data && data.sessionId).toBe(sessionId);
  });

  it('should return 404 for a non-existent session', async () => {
    const { status, data } = await ctx.client.getSession('does-not-exist-' + Date.now());

    expect(status).toBe(404);
    expect('error' in data && data.error).toMatch(/not found|expired/i);
  });

  // ─── Resume (idempotent create) ──────────────────────────────────────────

  it('should resume an existing session idempotently', async () => {
    const sessionId = ctx.uniqueSessionId('resume');
    ctx.trackSession(sessionId);

    const first = await ctx.client.createSession(sessionId);
    expect(first.data.resumed).toBe(false);

    const second = await ctx.client.createSession(sessionId);
    expect(second.status).toBe(200);
    expect(second.data.sessionId).toBe(sessionId);
    expect(second.data.resumed).toBe(true);
    // Work dir should remain the same
    expect(second.data.workDir).toBe(first.data.workDir);
  });

  // ─── Custom TTL ──────────────────────────────────────────────────────────

  it('should accept a custom TTL', async () => {
    const sessionId = ctx.uniqueSessionId('ttl');
    ctx.trackSession(sessionId);

    const { status, data } = await ctx.client.createSession(sessionId, 120);

    expect(status).toBe(200);
    const expiresAt = new Date(data.expiresAt).getTime();
    const createdAt = new Date(data.createdAt).getTime();
    const ttlMs = expiresAt - createdAt;
    // Should be roughly 120s (allow some drift)
    expect(ttlMs).toBeGreaterThan(100_000);
    expect(ttlMs).toBeLessThan(150_000);
  });

  // ─── Destroy ─────────────────────────────────────────────────────────────

  it('should destroy a session', async () => {
    const sessionId = ctx.uniqueSessionId('destroy');
    await ctx.client.createSession(sessionId);

    const { status, data } = await ctx.client.destroySession(sessionId);

    expect(status).toBe(200);
    expect(data.destroyed).toBe(true);

    // Should now be 404
    const { status: getStatus } = await ctx.client.getSession(sessionId);
    expect(getStatus).toBe(404);
  });

  it('should return destroyed=false for non-existent session', async () => {
    const { status, data } = await ctx.client.destroySession('ghost-' + Date.now());

    expect(status).toBe(200);
    expect(data.destroyed).toBe(false);
  });

  // ─── Validation ──────────────────────────────────────────────────────────

  it('should return 400 when sessionId is missing', async () => {
    const res = await ctx.client.rawRequest('POST', '/sessions', {
      body: {},
      headers: {
        Authorization: `Bearer ${process.env.SANDBOX_TEST_API_KEY || ''}`,
      },
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/sessionId/i);
  });
});
