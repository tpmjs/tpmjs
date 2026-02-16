/**
 * Sandbox Server — Tool execution integration tests
 *
 * Tests POST /execute-tool with shellExec, writeFile, readFile, listFiles.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  getSandboxTestContext,
  isSandboxAvailable,
  type SandboxTestContext,
} from './_helpers/sandbox-context';

const TOOL_PKG = '@tpmjs/official-sandbox-shell';
const TOOL_VERSION = '0.1.0';

describe.skipIf(!isSandboxAvailable())('Sandbox Tool Execution', () => {
  let ctx: SandboxTestContext;
  let sessionId: string;

  beforeAll(async () => {
    ctx = getSandboxTestContext();
    sessionId = ctx.uniqueSessionId('tools');
    ctx.trackSession(sessionId);
    await ctx.client.createSession(sessionId);
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  // ─── shellExec ───────────────────────────────────────────────────────────

  describe('shellExec', () => {
    it('should execute echo and return stdout', async () => {
      const { status, data } = await ctx.client.executeTool({
        packageName: TOOL_PKG,
        name: 'shellExec',
        version: TOOL_VERSION,
        sessionId,
        params: { command: 'echo "hello sandbox"' },
      });

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      const output = data.output as { stdout: string; exitCode: number };
      expect(output.stdout).toContain('hello sandbox');
      expect(output.exitCode).toBe(0);
    });

    it('should return non-zero exit code on failure', async () => {
      const { data } = await ctx.client.executeTool({
        packageName: TOOL_PKG,
        name: 'shellExec',
        version: TOOL_VERSION,
        sessionId,
        params: { command: 'exit 42' },
      });

      expect(data.success).toBe(true);
      const output = data.output as { exitCode: number };
      expect(output.exitCode).toBe(42);
    });

    it('should timeout a long-running command', async () => {
      // Use exec so sleep replaces sh (no orphan child holding pipes open)
      const { data } = await ctx.client.executeTool({
        packageName: TOOL_PKG,
        name: 'shellExec',
        version: TOOL_VERSION,
        sessionId,
        params: { command: 'exec sleep 60', timeout: 3000 },
      });

      expect(data.success).toBe(true);
      const output = data.output as { exitCode: number; stderr: string };
      expect(output.exitCode).toBe(137);
      expect(output.stderr).toMatch(/TIMEOUT/i);
    }, 30_000);
  });

  // ─── writeFile + readFile round-trip ─────────────────────────────────────

  describe('writeFile + readFile', () => {
    it('should write and read a file', async () => {
      const content = `Hello from test at ${Date.now()}`;

      // Write
      const writeRes = await ctx.client.executeTool({
        packageName: TOOL_PKG,
        name: 'writeFile',
        version: TOOL_VERSION,
        sessionId,
        params: { path: 'test-roundtrip.txt', content },
      });
      expect(writeRes.data.success).toBe(true);
      const writeOut = writeRes.data.output as { success: boolean; bytesWritten: number };
      expect(writeOut.success).toBe(true);
      expect(writeOut.bytesWritten).toBeGreaterThan(0);

      // Read
      const readRes = await ctx.client.executeTool({
        packageName: TOOL_PKG,
        name: 'readFile',
        version: TOOL_VERSION,
        sessionId,
        params: { path: 'test-roundtrip.txt' },
      });
      expect(readRes.data.success).toBe(true);
      const readOut = readRes.data.output as { content: string };
      expect(readOut.content).toBe(content);
    });

    it('should create parent directories with createDirs', async () => {
      const writeRes = await ctx.client.executeTool({
        packageName: TOOL_PKG,
        name: 'writeFile',
        version: TOOL_VERSION,
        sessionId,
        params: { path: 'deep/nested/dir/file.txt', content: 'nested content', createDirs: true },
      });
      expect(writeRes.data.success).toBe(true);

      const readRes = await ctx.client.executeTool({
        packageName: TOOL_PKG,
        name: 'readFile',
        version: TOOL_VERSION,
        sessionId,
        params: { path: 'deep/nested/dir/file.txt' },
      });
      expect(readRes.data.success).toBe(true);
      const readOut = readRes.data.output as { content: string };
      expect(readOut.content).toBe('nested content');
    });
  });

  // ─── listFiles ───────────────────────────────────────────────────────────

  describe('listFiles', () => {
    it('should list files at workspace root', async () => {
      // Ensure at least one file exists
      await ctx.client.executeTool({
        packageName: TOOL_PKG,
        name: 'writeFile',
        version: TOOL_VERSION,
        sessionId,
        params: { path: 'list-test.txt', content: 'x' },
      });

      const { data } = await ctx.client.executeTool({
        packageName: TOOL_PKG,
        name: 'listFiles',
        version: TOOL_VERSION,
        sessionId,
        params: {},
      });

      expect(data.success).toBe(true);
      const output = data.output as { entries: Array<{ name: string; type: string }> };
      const names = output.entries.map((e) => e.name);
      expect(names).toContain('list-test.txt');
    });

    it('should list files recursively', async () => {
      const { data } = await ctx.client.executeTool({
        packageName: TOOL_PKG,
        name: 'listFiles',
        version: TOOL_VERSION,
        sessionId,
        params: { recursive: true },
      });

      expect(data.success).toBe(true);
      const output = data.output as { entries: Array<{ name: string }> };
      const names = output.entries.map((e) => e.name);
      // Should include the nested file from earlier createDirs test
      expect(names.some((n) => n.includes('deep/nested/dir/file.txt'))).toBe(true);
    });
  });
});
