/**
 * Tools search endpoint integration tests
 *
 * Tests the /api/tools/search endpoint for searching tools.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  cleanupTestContext,
  getTestContext,
  type IntegrationTestContext,
} from '../_helpers/test-context';

interface ToolSearchResult {
  id: string;
  name: string;
  description: string;
  package: {
    npmPackageName: string;
    category: string;
  };
  score?: number;
}

interface SearchResponse {
  success: boolean;
  query: string;
  results: {
    total: number;
    returned: number;
    tools: ToolSearchResult[];
  };
  pagination?: {
    limit: number;
    hasMore: boolean;
  };
}

describe('Tools Search Endpoint', () => {
  let ctx: IntegrationTestContext;

  beforeAll(() => {
    ctx = getTestContext();
  });

  afterAll(async () => {
    await cleanupTestContext();
  });

  describe('GET /api/tools/search', () => {
    it('should search tools by query', async () => {
      const result = await ctx.publicClient.get<SearchResponse>('/api/tools/search', {
        query: { q: 'file' },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.success).toBe(true);
        expect(Array.isArray(result.data.results.tools)).toBe(true);
      }
    });

    it('should return empty results for non-matching query', async () => {
      const result = await ctx.publicClient.get<SearchResponse>('/api/tools/search', {
        query: { q: 'xyznonexistent123456' },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.results.tools.length).toBe(0);
      }
    });

    it('should support limit parameter', async () => {
      const result = await ctx.publicClient.get<SearchResponse>('/api/tools/search', {
        query: { q: 'tool', limit: 3 },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.results.tools.length).toBeLessThanOrEqual(3);
      }
    });

    it('should return tools with required search fields', async () => {
      const result = await ctx.publicClient.get<SearchResponse>('/api/tools/search', {
        query: { q: 'tool', limit: 1 },
      });

      expect(result.ok).toBe(true);
      if (result.ok && result.data.results.tools.length > 0) {
        const tool = result.data.results.tools[0]!;
        expect(tool.id).toBeDefined();
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
      }
    });
  });
});
