/**
 * Stats endpoint integration tests
 *
 * Tests the /api/stats/* endpoints which provide registry statistics.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  cleanupTestContext,
  getTestContext,
  type IntegrationTestContext,
} from '../_helpers/test-context';

describe('Stats Endpoints', () => {
  let ctx: IntegrationTestContext;

  beforeAll(() => {
    ctx = getTestContext();
  });

  afterAll(async () => {
    await cleanupTestContext();
  });

  describe('GET /api/stats', () => {
    it('should return current statistics', async () => {
      const result = await ctx.publicClient.get<{
        success: boolean;
        data: {
          overview: {
            totalTools: number;
            totalPackages: number;
            officialTools: number;
          };
          health: {
            import: { healthy: number; broken: number };
          };
        };
      }>('/api/stats');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.success).toBe(true);
        expect(result.data.data).toBeDefined();
        expect(result.data.data.overview.totalTools).toBeGreaterThanOrEqual(0);
        expect(result.data.data.overview.totalPackages).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('categories in stats', () => {
    it('should include category breakdown in main stats', async () => {
      const result = await ctx.publicClient.get<{
        success: boolean;
        data: {
          categories: Record<string, number>;
        };
      }>('/api/stats');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.success).toBe(true);
        expect(result.data.data.categories).toBeDefined();
        expect(typeof result.data.data.categories).toBe('object');
      }
    });
  });
});
