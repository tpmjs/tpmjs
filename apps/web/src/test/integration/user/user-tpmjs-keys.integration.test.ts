/**
 * User TPMJS API keys endpoint integration tests
 *
 * Tests the TPMJS API key management endpoints.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanupTestContext, getTestContext, type IntegrationTestContext } from '../_helpers/test-context';

interface TpmjsApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

describe('User TPMJS API Keys Endpoints', () => {
  let ctx: IntegrationTestContext;
  let createdKeyId: string | null = null;

  beforeAll(() => {
    ctx = getTestContext();
  });

  afterAll(async () => {
    // Clean up created key
    if (createdKeyId) {
      await ctx.api.delete(`/api/user/tpmjs-api-keys/${createdKeyId}`);
    }
    await cleanupTestContext();
  });

  describe('GET /api/user/tpmjs-api-keys', () => {
    it('should list user TPMJS API keys with session auth', async () => {
      const result = await ctx.api.get<{
        success: boolean;
        data: TpmjsApiKey[];
      }>('/api/user/tpmjs-api-keys');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.success).toBe(true);
        expect(Array.isArray(result.data.data)).toBe(true);
      }
    });

    it('should reject without auth', async () => {
      const result = await ctx.publicClient.get('/api/user/tpmjs-api-keys');

      expect(result.ok).toBe(false);
      expect(result.status).toBe(401);
    });
  });

  describe('POST /api/user/tpmjs-api-keys', () => {
    it('should create a new TPMJS API key', async () => {
      const keyName = `Test Key ${Date.now()}`;
      const result = await ctx.api.post<{
        success: boolean;
        data: TpmjsApiKey & { key?: string };
      }>('/api/user/tpmjs-api-keys', {
        name: keyName,
        scopes: ['mcp:execute'],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.success).toBe(true);
        expect(result.data.data.name).toBe(keyName);
        expect(result.data.data.scopes).toContain('mcp:execute');
        expect(result.data.data.isActive).toBe(true);

        // Store for cleanup
        createdKeyId = result.data.data.id;

        // The raw key should only be returned once at creation
        expect(result.data.data.key || result.data.data.keyPrefix).toBeDefined();
      }
    });

    it('should reject creation without auth', async () => {
      const result = await ctx.publicClient.post('/api/user/tpmjs-api-keys', {
        name: 'Unauthorized Key',
        scopes: ['mcp:execute'],
      });

      expect(result.ok).toBe(false);
      expect(result.status).toBe(401);
    });
  });

  describe('DELETE /api/user/tpmjs-api-keys/:id', () => {
    it('should delete a TPMJS API key', async () => {
      // Create a key to delete
      const createResult = await ctx.api.post<{
        success: boolean;
        data: TpmjsApiKey;
      }>('/api/user/tpmjs-api-keys', {
        name: `Delete Test Key ${Date.now()}`,
        scopes: ['mcp:execute'],
      });

      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      const keyId = createResult.data.data.id;

      // Delete the key
      const deleteResult = await ctx.api.delete(`/api/user/tpmjs-api-keys/${keyId}`);
      expect(deleteResult.ok).toBe(true);

      // Verify it's deleted by listing keys
      const listResult = await ctx.api.get<{
        success: boolean;
        data: TpmjsApiKey[];
      }>('/api/user/tpmjs-api-keys');

      if (listResult.ok) {
        const deletedKey = listResult.data.data.find((k) => k.id === keyId);
        expect(deletedKey).toBeUndefined();
      }
    });

    it('should reject delete without auth', async () => {
      const result = await ctx.publicClient.delete('/api/user/tpmjs-api-keys/some-id');

      expect(result.ok).toBe(false);
      expect(result.status).toBe(401);
    });
  });
});
