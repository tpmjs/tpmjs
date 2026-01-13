/**
 * Public agents endpoint integration tests
 *
 * Tests the public agent listing endpoints (no auth required).
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanupTestContext, getTestContext, type IntegrationTestContext } from '../_helpers/test-context';

interface PublicAgent {
  id: string;
  uid: string;
  name: string;
  description: string | null;
  provider: string;
  modelId: string;
  isPublic: boolean;
  likeCount: number;
  createdBy: {
    username: string;
    name: string;
    image: string | null;
  };
}

describe('Public Agents Endpoints', () => {
  let ctx: IntegrationTestContext;

  beforeAll(async () => {
    ctx = getTestContext();

    // Create a public test agent
    await ctx.factories.agent.create({
      name: 'Public Test Agent',
      description: 'A public agent for testing',
      isPublic: true,
    });
  });

  afterAll(async () => {
    await cleanupTestContext();
  });

  describe('GET /api/public/agents', () => {
    it('should list public agents without auth', async () => {
      const result = await ctx.publicClient.get<{
        success: boolean;
        data: PublicAgent[];
        pagination: {
          limit: number;
          offset: number;
          hasMore: boolean;
        };
      }>('/api/public/agents');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.success).toBe(true);
        expect(Array.isArray(result.data.data)).toBe(true);
        expect(result.data.pagination).toBeDefined();

        // Note: isPublic is not in the response - by definition, only public agents are returned
      }
    });

    it('should support pagination', async () => {
      const result = await ctx.publicClient.get<{
        success: boolean;
        data: PublicAgent[];
        pagination: {
          limit: number;
          offset: number;
          hasMore: boolean;
        };
      }>('/api/public/agents', {
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
        data: PublicAgent[];
      }>('/api/public/agents', {
        query: { limit: 1 },
      });

      expect(result.ok).toBe(true);
      if (result.ok && result.data.data.length > 0) {
        const agent = result.data.data[0]!;
        expect(agent.createdBy).toBeDefined();
        expect(agent.createdBy.username).toBeDefined();
      }
    });
  });

  describe('GET /api/public/agents/:username/:uid', () => {
    it('should get a specific public agent', async () => {
      // First, get list to find a public agent
      const listResult = await ctx.publicClient.get<{
        success: boolean;
        data: PublicAgent[];
      }>('/api/public/agents', { query: { limit: 1 } });

      if (!listResult.ok || listResult.data.data.length === 0) {
        console.log('Skipping: No public agents available');
        return;
      }

      const agent = listResult.data.data[0]!;
      const result = await ctx.publicClient.get<{
        success: boolean;
        data: PublicAgent;
      }>(`/api/public/users/${agent.createdBy.username}/agents/${agent.uid}`);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.data.uid).toBe(agent.uid);
      }
    });

    it('should return 404 for non-existent agent', async () => {
      const result = await ctx.publicClient.get('/api/public/agents/nonexistent-user/nonexistent-agent');

      expect(result.ok).toBe(false);
      expect(result.status).toBe(404);
    });
  });
});
