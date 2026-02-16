/**
 * Sandbox test context
 *
 * Provides environment detection, client configuration, session tracking,
 * and cleanup for sandbox integration tests (Layer 1 — direct API).
 */

import { createSandboxClient, type SandboxClient } from './sandbox-client';

// ─── Environment ─────────────────────────────────────────────────────────────

/** Returns true if SANDBOX_TEST_URL is set. All Layer 1 tests gate on this. */
export function isSandboxAvailable(): boolean {
  return !!process.env.SANDBOX_TEST_URL;
}

/** Disk quota in MB the sandbox was started with (for quota tests). */
export function getSandboxDiskQuotaMB(): number {
  return Number(process.env.SANDBOX_TEST_DISK_QUOTA_MB || '100');
}

// ─── Test Context ────────────────────────────────────────────────────────────

export interface SandboxTestContext {
  /** Pre-configured sandbox HTTP client */
  client: SandboxClient;
  /** Generate a unique session ID for this test run */
  uniqueSessionId: (prefix?: string) => string;
  /** Track a session for cleanup */
  trackSession: (sessionId: string) => void;
  /** Destroy all tracked sessions */
  cleanup: () => Promise<void>;
}

let counter = 0;

/**
 * Build a fresh sandbox test context.
 *
 * Call `cleanup()` in afterAll / afterEach to destroy sessions created during tests.
 */
export function getSandboxTestContext(): SandboxTestContext {
  const baseUrl = process.env.SANDBOX_TEST_URL || 'http://localhost:3002';
  const apiKey = process.env.SANDBOX_TEST_API_KEY;

  const client = createSandboxClient({ baseUrl, apiKey });
  const trackedSessions: string[] = [];

  return {
    client,

    uniqueSessionId(prefix = 'test') {
      counter++;
      return `${prefix}-${Date.now()}-${counter}`;
    },

    trackSession(sessionId: string) {
      trackedSessions.push(sessionId);
    },

    async cleanup() {
      const results = await Promise.allSettled(
        trackedSessions.map((id) => client.destroySession(id))
      );
      for (const r of results) {
        if (r.status === 'rejected') {
          console.warn('Session cleanup warning:', r.reason);
        }
      }
      trackedSessions.length = 0;
    },
  };
}
