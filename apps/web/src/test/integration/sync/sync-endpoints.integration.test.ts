/**
 * Sync endpoints integration tests
 *
 * Tests the cron-triggered sync endpoints that require CRON_SECRET auth.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  cleanupTestContext,
  getTestContext,
  type IntegrationTestContext,
} from '../_helpers/test-context';

// Skip if CRON_SECRET is not configured
const CRON_SECRET_CONFIGURED = !!process.env.CRON_SECRET;

describe.skipIf(!CRON_SECRET_CONFIGURED)('Sync Endpoints', () => {
  let ctx: IntegrationTestContext;

  beforeAll(() => {
    ctx = getTestContext();
  });

  afterAll(async () => {
    await cleanupTestContext();
  });

  describe('POST /api/sync/changes', () => {
    it('should execute changes feed sync with cron auth', async () => {
      const result = await ctx.cronClient.post<{
        success: boolean;
        data: {
          processed: number;
          skipped: number;
          errors: number;
          lastSeq?: string;
          durationMs: number;
        };
      }>('/api/sync/changes');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.success).toBe(true);
        expect(result.data.data.processed).toBeGreaterThanOrEqual(0);
        expect(result.data.data.durationMs).toBeGreaterThan(0);
      }
    });

    it('should reject without cron auth', async () => {
      const result = await ctx.publicClient.post('/api/sync/changes');

      expect(result.ok).toBe(false);
      expect(result.status).toBe(401);
    });

    it('should reject with regular API key', async () => {
      const result = await ctx.apiKeyClient.post('/api/sync/changes');

      expect(result.ok).toBe(false);
      expect(result.status).toBe(401);
    });
  });

  describe('POST /api/sync/keyword', () => {
    // Skip: Keyword sync takes 2-3 minutes and can timeout
    // Run manually to verify: curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://tpmjs.com/api/sync/keyword
    it.skip('should execute keyword search sync with cron auth', async () => {
      const result = await ctx.cronClient.post<{
        success: boolean;
        data: {
          processed: number;
          skipped: number;
          errors: number;
          packagesFound?: number;
          durationMs: number;
        };
      }>('/api/sync/keyword');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.success).toBe(true);
        expect(result.data.data.processed).toBeGreaterThanOrEqual(0);
      }
    });

    it('should reject without cron auth', async () => {
      const result = await ctx.publicClient.post('/api/sync/keyword');

      expect(result.ok).toBe(false);
      expect(result.status).toBe(401);
    });
  });

  describe('POST /api/sync/metrics', () => {
    it('should execute metrics sync with cron auth', async () => {
      const result = await ctx.cronClient.post<{
        success: boolean;
        data: {
          processed: number;
          skipped: number;
          errors: number;
          totalTools?: number;
          durationMs: number;
        };
      }>('/api/sync/metrics');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.success).toBe(true);
        expect(result.data.data.processed).toBeGreaterThanOrEqual(0);
      }
    });

    it('should reject without cron auth', async () => {
      const result = await ctx.publicClient.post('/api/sync/metrics');

      expect(result.ok).toBe(false);
      expect(result.status).toBe(401);
    });
  });
});
