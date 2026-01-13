/**
 * Collections CRUD endpoint integration tests
 *
 * Tests creating, reading, updating, and deleting collections.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanupTestContext, getTestContext, type IntegrationTestContext } from '../_helpers/test-context';

interface CollectionResponse {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  toolCount?: number;
}

describe('Collections CRUD Endpoints', () => {
  let ctx: IntegrationTestContext;

  beforeAll(() => {
    ctx = getTestContext();
  });

  afterAll(async () => {
    await cleanupTestContext();
  });

  describe('POST /api/collections', () => {
    it('should create a new collection with session auth', async () => {
      const collection = await ctx.factories.collection.create({
        name: 'Test CRUD Collection',
        description: 'Created via integration test',
        isPublic: true,
      });

      expect(collection.id).toBeDefined();
      expect(collection.name).toBe('Test CRUD Collection');
      expect(collection.description).toBe('Created via integration test');
      expect(collection.isPublic).toBe(true);
    });

    it('should reject creation without auth', async () => {
      const result = await ctx.publicClient.post<{ success: boolean }>('/api/collections', {
        name: 'Unauthorized Collection',
        description: 'Should fail',
      });

      expect(result.ok).toBe(false);
      expect(result.status).toBe(401);
    });

    it('should reject duplicate slugs for same user', async () => {
      const slug = `test-duplicate-${Date.now()}`;

      // Create first collection
      await ctx.factories.collection.create({ slug });

      // Try to create second with same slug
      const result = await ctx.apiKeyClient.post<{ success: boolean; error?: string }>('/api/collections', {
        slug,
        name: 'Duplicate Slug',
      });

      expect(result.ok).toBe(false);
    });
  });

  describe('GET /api/collections', () => {
    it('should list user collections with API key auth', async () => {
      // Create a test collection first
      await ctx.factories.collection.create();

      const result = await ctx.apiKeyClient.get<{
        success: boolean;
        data: CollectionResponse[];
      }>('/api/collections');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.success).toBe(true);
        expect(Array.isArray(result.data.data)).toBe(true);
      }
    });

    it('should reject without auth', async () => {
      const result = await ctx.publicClient.get('/api/collections');

      expect(result.ok).toBe(false);
      expect(result.status).toBe(401);
    });
  });

  describe('GET /api/collections/:id', () => {
    it('should get a specific collection', async () => {
      const created = await ctx.factories.collection.create({
        name: 'Specific Collection',
      });

      const result = await ctx.apiKeyClient.get<{
        success: boolean;
        data: CollectionResponse;
      }>(`/api/collections/${created.id}`);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.data.id).toBe(created.id);
        expect(result.data.data.name).toBe('Specific Collection');
      }
    });

    it('should return 404 for non-existent collection', async () => {
      const result = await ctx.apiKeyClient.get('/api/collections/nonexistent-id-12345');

      expect(result.ok).toBe(false);
      expect(result.status).toBe(404);
    });
  });

  describe('PATCH /api/collections/:id', () => {
    it('should update a collection', async () => {
      const created = await ctx.factories.collection.create({
        name: 'Before Update',
        description: 'Original description',
      });

      const result = await ctx.apiKeyClient.patch<{
        success: boolean;
        data: CollectionResponse;
      }>(`/api/collections/${created.id}`, {
        name: 'After Update',
        description: 'Updated description',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.data.name).toBe('After Update');
        expect(result.data.data.description).toBe('Updated description');
      }
    });

    it('should reject update without auth', async () => {
      const created = await ctx.factories.collection.create();

      const result = await ctx.publicClient.patch(`/api/collections/${created.id}`, {
        name: 'Unauthorized Update',
      });

      expect(result.ok).toBe(false);
      expect(result.status).toBe(401);
    });
  });

  describe('DELETE /api/collections/:id', () => {
    it('should delete a collection', async () => {
      const created = await ctx.factories.collection.create();

      const deleteResult = await ctx.apiKeyClient.delete(`/api/collections/${created.id}`);
      expect(deleteResult.ok).toBe(true);

      // Verify it's deleted
      const getResult = await ctx.apiKeyClient.get(`/api/collections/${created.id}`);
      expect(getResult.ok).toBe(false);
      expect(getResult.status).toBe(404);
    });

    it('should reject delete without auth', async () => {
      const created = await ctx.factories.collection.create();

      const result = await ctx.publicClient.delete(`/api/collections/${created.id}`);
      expect(result.ok).toBe(false);
      expect(result.status).toBe(401);
    });
  });
});
