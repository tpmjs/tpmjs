/**
 * Health endpoint integration tests
 *
 * Tests the /api/health endpoint which provides system status information.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanupTestContext, getTestContext, type IntegrationTestContext } from '../_helpers/test-context';

describe('Health Endpoint', () => {
  let ctx: IntegrationTestContext;

  beforeAll(() => {
    ctx = getTestContext();
  });

  afterAll(async () => {
    await cleanupTestContext();
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const result = await ctx.publicClient.get<{
        status: string;
        timestamp: string;
        build?: {
          commitSha: string;
          commitMessage: string;
          deploymentUrl: string;
        };
        env?: {
          hasDatabase: boolean;
          nodeEnv: string;
        };
      }>('/api/health');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.status).toBe('ok');
        expect(result.data.timestamp).toBeDefined();
        expect(new Date(result.data.timestamp).getTime()).toBeGreaterThan(0);
      }
    });

    it('should include build information in production', async () => {
      const result = await ctx.publicClient.get<{
        status: string;
        timestamp: string;
        build?: {
          commitSha: string;
          commitMessage: string;
          deploymentUrl: string;
        };
      }>('/api/health');

      expect(result.ok).toBe(true);
      if (result.ok && result.data.build) {
        // In production, build info should be present
        expect(result.data.build.commitSha).toBeDefined();
        expect(typeof result.data.build.commitSha).toBe('string');
      }
    });

    it('should respond quickly (within 5 seconds)', async () => {
      const startTime = Date.now();
      const result = await ctx.publicClient.get('/api/health');
      const duration = Date.now() - startTime;

      expect(result.ok).toBe(true);
      expect(duration).toBeLessThan(5000);
    });
  });
});
