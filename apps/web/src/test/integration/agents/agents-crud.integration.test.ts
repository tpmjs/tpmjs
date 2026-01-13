/**
 * Agents CRUD endpoint integration tests
 *
 * Tests creating, reading, updating, and deleting agents.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanupTestContext, getTestContext, type IntegrationTestContext } from '../_helpers/test-context';

interface AgentResponse {
  id: string;
  uid: string;
  name: string;
  description: string | null;
  provider: string;
  modelId: string;
  isPublic: boolean;
}

describe('Agents CRUD Endpoints', () => {
  let ctx: IntegrationTestContext;

  beforeAll(() => {
    ctx = getTestContext();
  });

  afterAll(async () => {
    await cleanupTestContext();
  });

  describe('POST /api/agents', () => {
    it('should create a new agent with session auth', async () => {
      const agent = await ctx.factories.agent.create({
        name: 'Test CRUD Agent',
        description: 'Created via integration test',
        provider: 'OPENAI',
        modelId: 'gpt-4o-mini',
        isPublic: true,
      });

      expect(agent.id).toBeDefined();
      expect(agent.name).toBe('Test CRUD Agent');
      expect(agent.description).toBe('Created via integration test');
      expect(agent.provider).toBe('OPENAI');
      expect(agent.isPublic).toBe(true);
    });

    it('should reject creation without auth', async () => {
      const result = await ctx.publicClient.post<{ success: boolean }>('/api/agents', {
        uid: `test-unauth-${Date.now()}`,
        name: 'Unauthorized Agent',
        provider: 'OPENAI',
        modelId: 'gpt-4o-mini',
      });

      expect(result.ok).toBe(false);
      expect(result.status).toBe(401);
    });

    it('should reject duplicate uids', async () => {
      const uid = `test-duplicate-uid-${Date.now()}`;

      // Create first agent
      await ctx.factories.agent.create({ uid });

      // Try to create second with same uid
      const result = await ctx.apiKeyClient.post<{ success: boolean; error?: string }>('/api/agents', {
        uid,
        name: 'Duplicate UID Agent',
        provider: 'OPENAI',
        modelId: 'gpt-4o-mini',
      });

      expect(result.ok).toBe(false);
    });
  });

  describe('GET /api/agents', () => {
    it('should list user agents with API key auth', async () => {
      // Create a test agent first
      await ctx.factories.agent.create();

      const result = await ctx.apiKeyClient.get<{
        success: boolean;
        data: AgentResponse[];
      }>('/api/agents');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.success).toBe(true);
        expect(Array.isArray(result.data.data)).toBe(true);
      }
    });

    it('should reject without auth', async () => {
      const result = await ctx.publicClient.get('/api/agents');

      expect(result.ok).toBe(false);
      expect(result.status).toBe(401);
    });
  });

  describe('GET /api/agents/:id', () => {
    it('should get a specific agent', async () => {
      const created = await ctx.factories.agent.create({
        name: 'Specific Agent',
      });

      const result = await ctx.apiKeyClient.get<{
        success: boolean;
        data: AgentResponse;
      }>(`/api/agents/${created.id}`);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.data.id).toBe(created.id);
        expect(result.data.data.name).toBe('Specific Agent');
      }
    });

    it('should return 404 for non-existent agent', async () => {
      const result = await ctx.apiKeyClient.get('/api/agents/nonexistent-id-12345');

      expect(result.ok).toBe(false);
      expect(result.status).toBe(404);
    });
  });

  describe('PATCH /api/agents/:id', () => {
    it('should update an agent', async () => {
      const created = await ctx.factories.agent.create({
        name: 'Before Update',
        description: 'Original description',
      });

      const result = await ctx.apiKeyClient.patch<{
        success: boolean;
        data: AgentResponse;
      }>(`/api/agents/${created.id}`, {
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
      const created = await ctx.factories.agent.create();

      const result = await ctx.publicClient.patch(`/api/agents/${created.id}`, {
        name: 'Unauthorized Update',
      });

      expect(result.ok).toBe(false);
      expect(result.status).toBe(401);
    });
  });

  describe('DELETE /api/agents/:id', () => {
    it('should delete an agent', async () => {
      const created = await ctx.factories.agent.create();

      const deleteResult = await ctx.apiKeyClient.delete(`/api/agents/${created.id}`);
      expect(deleteResult.ok).toBe(true);

      // Verify it's deleted
      const getResult = await ctx.apiKeyClient.get(`/api/agents/${created.id}`);
      expect(getResult.ok).toBe(false);
      expect(getResult.status).toBe(404);
    });

    it('should reject delete without auth', async () => {
      const created = await ctx.factories.agent.create();

      const result = await ctx.publicClient.delete(`/api/agents/${created.id}`);
      expect(result.ok).toBe(false);
      expect(result.status).toBe(401);
    });
  });
});
