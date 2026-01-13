/**
 * Stats endpoint integration tests
 *
 * Tests the /api/stats/* endpoints which provide registry statistics.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanupTestContext, getTestContext, type IntegrationTestContext } from '../_helpers/test-context';

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
          totalTools: number;
          totalPackages: number;
          officialTools: number;
          toolsWithSchema: number;
          healthyTools: number;
          brokenTools: number;
        };
      }>('/api/stats');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.success).toBe(true);
        expect(result.data.data).toBeDefined();
        expect(result.data.data.totalTools).toBeGreaterThanOrEqual(0);
        expect(result.data.data.totalPackages).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('GET /api/stats/history', () => {
    it('should return historical statistics', async () => {
      const result = await ctx.publicClient.get<{
        success: boolean;
        data: Array<{
          date: string;
          totalTools: number;
          totalPackages: number;
        }>;
      }>('/api/stats/history');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.success).toBe(true);
        expect(Array.isArray(result.data.data)).toBe(true);
      }
    });

    it('should support limit parameter', async () => {
      const result = await ctx.publicClient.get<{
        success: boolean;
        data: Array<{
          date: string;
          totalTools: number;
        }>;
      }>('/api/stats/history', { query: { limit: 7 } });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.data.length).toBeLessThanOrEqual(7);
      }
    });
  });

  describe('GET /api/stats/categories', () => {
    it('should return category breakdown', async () => {
      const result = await ctx.publicClient.get<{
        success: boolean;
        data: Array<{
          category: string;
          count: number;
        }>;
      }>('/api/stats/categories');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.success).toBe(true);
        expect(Array.isArray(result.data.data)).toBe(true);
        if (result.data.data.length > 0) {
          expect(result.data.data[0]).toHaveProperty('category');
          expect(result.data.data[0]).toHaveProperty('count');
        }
      }
    });
  });
});
