/**
 * Sandbox Server — Security integration tests
 *
 * Tests path traversal blocking, symlink escape prevention,
 * and auth enforcement.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  getSandboxTestContext,
  isSandboxAvailable,
  type SandboxTestContext,
} from './_helpers/sandbox-context';

const TOOL_PKG = '@tpmjs/official-sandbox-shell';
const TOOL_VERSION = '0.1.0';

describe.skipIf(!isSandboxAvailable())('Sandbox Security', () => {
  let ctx: SandboxTestContext;
  let sessionId: string;

  beforeAll(async () => {
    ctx = getSandboxTestContext();
    sessionId = ctx.uniqueSessionId('security');
    ctx.trackSession(sessionId);
    await ctx.client.createSession(sessionId);
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  // ─── Path Traversal ──────────────────────────────────────────────────────

  describe('path traversal', () => {
    it('should block readFile with ../../../etc/passwd', async () => {
      const { data } = await ctx.client.executeTool({
        packageName: TOOL_PKG,
        name: 'readFile',
        version: TOOL_VERSION,
        sessionId,
        params: { path: '../../../etc/passwd' },
      });

      expect(data.success).toBe(false);
      expect(data.error).toMatch(/escapes sandbox/i);
    });

    it('should block writeFile with ../../tmp/evil.txt', async () => {
      const { data } = await ctx.client.executeTool({
        packageName: TOOL_PKG,
        name: 'writeFile',
        version: TOOL_VERSION,
        sessionId,
        params: { path: '../../tmp/evil.txt', content: 'pwned' },
      });

      expect(data.success).toBe(false);
      expect(data.error).toMatch(/escapes sandbox/i);
    });
  });

  // ─── Symlink Escape ──────────────────────────────────────────────────────

  describe('symlink escape', () => {
    it('should block readFile through a symlink that escapes the sandbox', async () => {
      // Create a symlink pointing to /etc/hostname
      await ctx.client.executeTool({
        packageName: TOOL_PKG,
        name: 'shellExec',
        version: TOOL_VERSION,
        sessionId,
        params: { command: 'ln -sf /etc/hostname escape-link' },
      });

      // Try to read through the symlink
      const { data } = await ctx.client.executeTool({
        packageName: TOOL_PKG,
        name: 'readFile',
        version: TOOL_VERSION,
        sessionId,
        params: { path: 'escape-link' },
      });

      expect(data.success).toBe(false);
      expect(data.error).toMatch(/escapes sandbox/i);
    });
  });

  // ─── Auth Enforcement ────────────────────────────────────────────────────

  describe('authentication', () => {
    it('should return 401 for POST /sessions without auth header', async () => {
      // Only meaningful when EXECUTOR_API_KEY is set on the server
      const apiKey = process.env.SANDBOX_TEST_API_KEY;
      if (!apiKey) {
        console.log('Skipping: SANDBOX_TEST_API_KEY not set (server has no auth)');
        return;
      }

      const res = await ctx.client.rawRequest('POST', '/sessions', {
        body: { sessionId: 'no-auth-test' },
        // No Authorization header
      });

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toMatch(/unauthorized/i);
    });

    it('should allow GET /health without auth', async () => {
      const res = await ctx.client.rawRequest('GET', '/health');
      expect(res.status).toBe(200);
    });

    it('should allow GET /metrics without auth', async () => {
      const res = await ctx.client.rawRequest('GET', '/metrics');
      expect(res.status).toBe(200);
    });
  });
});
