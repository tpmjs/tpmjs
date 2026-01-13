/**
 * Public collections endpoint integration tests
 *
 * Tests the public collection listing endpoints (no auth required).
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanupTestContext, getTestContext, type IntegrationTestContext } from '../_helpers/test-context';

interface PublicCollection {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  likeCount: number;
  toolCount: number;
  createdBy: {
    username: string;
    name: string;
    image: string | null;
  };
}

describe('Public Collections Endpoints', () => {
  let ctx: IntegrationTestContext;

  beforeAll(async () => {
    ctx = getTestContext();

    // Create a public test collection with unique name
    await ctx.factories.collection.create({
      name: `Public Test Collection ${Date.now()}`,
      description: 'A public collection for testing',
      isPublic: true,
    });
  });

  afterAll(async () => {
    await cleanupTestContext();
  });

  describe('GET /api/public/collections', () => {
    it('should list public collections without auth', async () => {
      const result = await ctx.publicClient.get<{
        success: boolean;
        data: PublicCollection[];
        pagination: {
          limit: number;
          offset: number;
          hasMore: boolean;
        };
      }>('/api/public/collections');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.success).toBe(true);
        expect(Array.isArray(result.data.data)).toBe(true);
        expect(result.data.pagination).toBeDefined();
        // Note: isPublic is not in the response - by definition, only public collections are returned
      }
    });

    it('should support pagination', async () => {
      const result = await ctx.publicClient.get<{
        success: boolean;
        data: PublicCollection[];
        pagination: {
          limit: number;
          offset: number;
          hasMore: boolean;
        };
      }>('/api/public/collections', {
        query: { limit: 5, offset: 0 },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.data.length).toBeLessThanOrEqual(5);
        expect(result.data.pagination.limit).toBe(5);
      }
    });

    it('should include creator information', async () => {
      const result = await ctx.publicClient.get<{
        success: boolean;
        data: PublicCollection[];
      }>('/api/public/collections', {
        query: { limit: 1 },
      });

      expect(result.ok).toBe(true);
      if (result.ok && result.data.data.length > 0) {
        const collection = result.data.data[0]!;
        expect(collection.createdBy).toBeDefined();
        expect(collection.createdBy.username).toBeDefined();
      }
    });
  });

  describe('GET /api/public/collections/:username/:slug', () => {
    it('should get a specific public collection', async () => {
      // First, get list to find a public collection
      const listResult = await ctx.publicClient.get<{
        success: boolean;
        data: PublicCollection[];
      }>('/api/public/collections', { query: { limit: 1 } });

      if (!listResult.ok || listResult.data.data.length === 0) {
        console.log('Skipping: No public collections available');
        return;
      }

      const collection = listResult.data.data[0]!;
      const result = await ctx.publicClient.get<{
        success: boolean;
        data: PublicCollection;
      }>(`/api/public/users/${collection.createdBy.username}/collections/${collection.slug}`);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.data.slug).toBe(collection.slug);
      }
    });

    it('should return 404 for non-existent collection', async () => {
      const result = await ctx.publicClient.get(
        '/api/public/collections/nonexistent-user/nonexistent-collection'
      );

      expect(result.ok).toBe(false);
      expect(result.status).toBe(404);
    });
  });
});
