/**
 * Tools list endpoint integration tests
 *
 * Tests the /api/tools endpoint for listing and searching tools.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  cleanupTestContext,
  getTestContext,
  type IntegrationTestContext,
} from '../_helpers/test-context';

interface ToolResponse {
  id: string;
  name: string;
  description: string;
  package: {
    npmPackageName: string;
    npmVersion: string;
    category: string;
  };
}

interface ToolsListResponse {
  success: boolean;
  data: ToolResponse[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

describe('Tools List Endpoint', () => {
  let ctx: IntegrationTestContext;

  beforeAll(() => {
    ctx = getTestContext();
  });

  afterAll(async () => {
    await cleanupTestContext();
  });

  describe('GET /api/tools', () => {
    it('should return a list of tools', async () => {
      const result = await ctx.publicClient.get<ToolsListResponse>('/api/tools');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.success).toBe(true);
        expect(Array.isArray(result.data.data)).toBe(true);
        expect(result.data.pagination).toBeDefined();
      }
    });

    it('should support pagination with limit and offset', async () => {
      const result = await ctx.publicClient.get<ToolsListResponse>('/api/tools', {
        query: { limit: 5, offset: 0 },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.data.length).toBeLessThanOrEqual(5);
        expect(result.data.pagination.limit).toBe(5);
        expect(result.data.pagination.offset).toBe(0);
      }
    });

    it('should filter by category', async () => {
      const result = await ctx.publicClient.get<ToolsListResponse>('/api/tools', {
        query: { category: 'ai' },
      });

      expect(result.ok).toBe(true);
      if (result.ok && result.data.data.length > 0) {
        for (const tool of result.data.data) {
          expect(tool.package.category).toBe('ai');
        }
      }
    });

    it('should filter by official status', async () => {
      const result = await ctx.publicClient.get<ToolsListResponse>('/api/tools', {
        query: { isOfficial: true },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.success).toBe(true);
      }
    });

    it('should return tools with required fields', async () => {
      const result = await ctx.publicClient.get<ToolsListResponse>('/api/tools', {
        query: { limit: 1 },
      });

      expect(result.ok).toBe(true);
      if (result.ok && result.data.data.length > 0) {
        const tool = result.data.data[0]!;
        expect(tool.id).toBeDefined();
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.package).toBeDefined();
        expect(tool.package.npmPackageName).toBeDefined();
      }
    });
  });
});
