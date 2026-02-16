/**
 * Sandbox Server — Session isolation & git integration tests
 *
 * Tests that two sessions have separate workspaces,
 * and that git operations work within a session.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  getSandboxTestContext,
  isSandboxAvailable,
  type SandboxTestContext,
} from './_helpers/sandbox-context';

const TOOL_PKG = '@tpmjs/official-sandbox-shell';
const TOOL_VERSION = '0.1.0';

describe.skipIf(!isSandboxAvailable())('Sandbox Isolation & Git', () => {
  let ctx: SandboxTestContext;

  beforeAll(() => {
    ctx = getSandboxTestContext();
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  // ─── Session Isolation ───────────────────────────────────────────────────

  describe('session isolation', () => {
    it('should keep workspaces separate between sessions', async () => {
      const sessionA = ctx.uniqueSessionId('iso-a');
      const sessionB = ctx.uniqueSessionId('iso-b');
      ctx.trackSession(sessionA);
      ctx.trackSession(sessionB);

      await ctx.client.createSession(sessionA);
      await ctx.client.createSession(sessionB);

      // Write a file in session A
      await ctx.client.executeTool({
        packageName: TOOL_PKG,
        name: 'writeFile',
        version: TOOL_VERSION,
        sessionId: sessionA,
        params: { path: 'only-in-a.txt', content: 'session A data' },
      });

      // List files in session B — should NOT contain the file
      const { data } = await ctx.client.executeTool({
        packageName: TOOL_PKG,
        name: 'listFiles',
        version: TOOL_VERSION,
        sessionId: sessionB,
        params: {},
      });

      expect(data.success).toBe(true);
      const output = data.output as { entries: Array<{ name: string }> };
      const names = output.entries.map((e) => e.name);
      expect(names).not.toContain('only-in-a.txt');
    });
  });

  // ─── Git Operations ──────────────────────────────────────────────────────

  describe('git operations', () => {
    let gitSessionId: string;

    beforeAll(async () => {
      gitSessionId = ctx.uniqueSessionId('git');
      ctx.trackSession(gitSessionId);
      await ctx.client.createSession(gitSessionId);
    });

    it('should clone a public repo', async () => {
      const { data } = await ctx.client.executeTool({
        packageName: TOOL_PKG,
        name: 'shellExec',
        version: TOOL_VERSION,
        sessionId: gitSessionId,
        params: { command: 'git clone --depth 1 https://github.com/octocat/Hello-World.git' },
      });

      expect(data.success).toBe(true);
      const output = data.output as { exitCode: number };
      expect(output.exitCode).toBe(0);

      // Verify the repo was cloned
      const listRes = await ctx.client.executeTool({
        packageName: TOOL_PKG,
        name: 'listFiles',
        version: TOOL_VERSION,
        sessionId: gitSessionId,
        params: { path: 'Hello-World' },
      });

      expect(listRes.data.success).toBe(true);
      const listOutput = listRes.data.output as { entries: Array<{ name: string }> };
      const names = listOutput.entries.map((e) => e.name);
      expect(names).toContain('README');
    }, 90_000);

    it('should init, commit, and verify git log', async () => {
      // Create a new repo
      const cmds = [
        'mkdir my-repo && cd my-repo && git init',
        'cd my-repo && git config user.email "test@tpmjs.com" && git config user.name "Test Bot"',
      ];

      for (const cmd of cmds) {
        const { data } = await ctx.client.executeTool({
          packageName: TOOL_PKG,
          name: 'shellExec',
          version: TOOL_VERSION,
          sessionId: gitSessionId,
          params: { command: cmd },
        });
        expect(data.success).toBe(true);
      }

      // Create a file
      await ctx.client.executeTool({
        packageName: TOOL_PKG,
        name: 'writeFile',
        version: TOOL_VERSION,
        sessionId: gitSessionId,
        params: { path: 'my-repo/hello.txt', content: 'Hello from sandbox test' },
      });

      // Stage and commit
      const commitRes = await ctx.client.executeTool({
        packageName: TOOL_PKG,
        name: 'shellExec',
        version: TOOL_VERSION,
        sessionId: gitSessionId,
        params: { command: 'cd my-repo && git add . && git commit -m "initial commit"' },
      });
      expect(commitRes.data.success).toBe(true);
      const commitOut = commitRes.data.output as { exitCode: number };
      expect(commitOut.exitCode).toBe(0);

      // Verify git log
      const logRes = await ctx.client.executeTool({
        packageName: TOOL_PKG,
        name: 'shellExec',
        version: TOOL_VERSION,
        sessionId: gitSessionId,
        params: { command: 'cd my-repo && git log --oneline' },
      });
      expect(logRes.data.success).toBe(true);
      const logOut = logRes.data.output as { stdout: string; exitCode: number };
      expect(logOut.exitCode).toBe(0);
      expect(logOut.stdout).toContain('initial commit');
    });
  });
});
