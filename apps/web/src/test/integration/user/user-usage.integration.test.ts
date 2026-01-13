/**
 * User usage endpoint integration tests
 *
 * Tests the user API usage tracking and reporting endpoints.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  cleanupTestContext,
  getTestContext,
  type IntegrationTestContext,
} from '../_helpers/test-context';

interface UsageSummary {
  periodType: string;
  periodStart: string;
  totalRequests: number;
  successRequests: number;
  errorRequests: number;
  totalTokensIn: number;
  totalTokensOut: number;
}

describe('User Usage Endpoints', () => {
  let ctx: IntegrationTestContext;

  beforeAll(() => {
    ctx = getTestContext();
  });

  afterAll(async () => {
    await cleanupTestContext();
  });

  describe('GET /api/user/usage', () => {
    it('should return usage summary with session auth', async () => {
      const result = await ctx.apiKeyClient.get<{
        success: boolean;
        data: {
          today: UsageSummary | null;
          thisMonth: UsageSummary | null;
          recentActivity: unknown[];
        };
      }>('/api/user/usage');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.success).toBe(true);
        expect(result.data.data).toBeDefined();
      }
    });

    it('should reject without auth', async () => {
      const result = await ctx.publicClient.get('/api/user/usage');

      expect(result.ok).toBe(false);
      expect(result.status).toBe(401);
    });
  });

  describe('GET /api/user/usage/history', () => {
    it('should return usage history', async () => {
      const result = await ctx.apiKeyClient.get<{
        success: boolean;
        data: UsageSummary[];
      }>('/api/user/usage/history', {
        query: { period: 'daily', limit: 7 },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.success).toBe(true);
        expect(Array.isArray(result.data.data)).toBe(true);
      }
    });

    it('should support period filter', async () => {
      const result = await ctx.apiKeyClient.get<{
        success: boolean;
        data: UsageSummary[];
      }>('/api/user/usage/history', {
        query: { period: 'monthly' },
      });

      expect(result.ok).toBe(true);
      if (result.ok && result.data.data.length > 0) {
        expect(result.data.data[0]!.periodType).toBe('monthly');
      }
    });
  });
});
