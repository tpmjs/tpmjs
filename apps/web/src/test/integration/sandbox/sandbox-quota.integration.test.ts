/**
 * Sandbox Server — Disk quota integration tests
 *
 * Tests that the sandbox enforces per-session disk quotas.
 * Requires the sandbox to be started with SESSION_DISK_QUOTA_MB=5 (or similar small value).
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  getSandboxDiskQuotaMB,
  getSandboxTestContext,
  isSandboxAvailable,
  type SandboxTestContext,
} from './_helpers/sandbox-context';

const TOOL_PKG = '@tpmjs/official-sandbox-shell';
const TOOL_VERSION = '0.1.0';

describe.skipIf(!isSandboxAvailable())('Sandbox Disk Quota', () => {
  let ctx: SandboxTestContext;
  let sessionId: string;
  const quotaMB = getSandboxDiskQuotaMB();

  beforeAll(async () => {
    ctx = getSandboxTestContext();
    sessionId = ctx.uniqueSessionId('quota');
    ctx.trackSession(sessionId);
    await ctx.client.createSession(sessionId);
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  it('should reject tool calls after workspace exceeds disk quota', async () => {
    // Skip if quota is unreasonably large (test assumes small quota like 5MB)
    if (quotaMB > 50) {
      console.log(
        `Skipping: SANDBOX_TEST_DISK_QUOTA_MB=${quotaMB} is too large for quota test (need ≤50MB)`
      );
      return;
    }

    // Fill workspace beyond quota using dd
    const fillMB = quotaMB + 2; // exceed by 2MB
    const fillRes = await ctx.client.executeTool({
      packageName: TOOL_PKG,
      name: 'shellExec',
      version: TOOL_VERSION,
      sessionId,
      params: {
        command: `dd if=/dev/zero of=bigfile.bin bs=1M count=${fillMB} 2>/dev/null; echo "done"`,
      },
    });

    expect(fillRes.data.success).toBe(true);

    // Next tool call should be rejected due to quota
    const { status, data } = await ctx.client.executeTool({
      packageName: TOOL_PKG,
      name: 'shellExec',
      version: TOOL_VERSION,
      sessionId,
      params: { command: 'echo "should fail"' },
    });

    expect(status).toBe(413);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/disk quota exceeded/i);
  }, 30_000);
});
