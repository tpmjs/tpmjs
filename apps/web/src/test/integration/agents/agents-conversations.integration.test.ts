/**
 * Agent conversations endpoint integration tests
 *
 * Tests the agent chat/conversation endpoints with streaming responses.
 *
 * NOTE: Tests that make actual AI calls are skipped because they require
 * the test user to have AI provider API keys (OPENAI_API_KEY, etc.) configured.
 * These tests would work in a fully configured test environment but are not
 * suitable for CI/CD against production databases.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanupTestContext, getTestContext, type IntegrationTestContext } from '../_helpers/test-context';
import { extractTextFromChunks, findSSEEvent, filterSSEEvents } from '../_helpers/sse-parser';

describe('Agent Conversations Endpoints', () => {
  let ctx: IntegrationTestContext;
  let testAgent: { id: string; uid: string; name: string } | null = null;

  beforeAll(async () => {
    ctx = getTestContext();

    // Create a test agent for conversation tests with unique name
    testAgent = await ctx.factories.agent.create({
      name: `Conversation Test Agent ${Date.now()}`,
      description: 'Agent for testing conversations',
      systemPrompt: 'You are a helpful assistant. Keep responses brief.',
      maxToolCallsPerTurn: 5,
    });
  });

  afterAll(async () => {
    await cleanupTestContext();
  });

  describe('POST /api/:username/agents/:uid/conversation/:conversationId', () => {
    // Skip: Requires AI provider API keys configured for the test user
    it.skip('should create a conversation and receive streaming response', async () => {
      if (!testAgent) {
        console.log('Skipping: No test agent available');
        return;
      }

      const conversationSlug = `test-conv-${Date.now()}`;
      const { ok, status, events } = await ctx.apiKeyClient.sse(
        `/api/${ctx.auth.username}/agents/${testAgent.uid}/conversation/${conversationSlug}`,
        { message: 'Hello, what is 2 + 2?' },
        { timeout: 60000 }
      );

      expect(ok).toBe(true);
      expect(status).toBe(200);
      expect(events.length).toBeGreaterThan(0);

      // Should have chunk events
      const chunks = filterSSEEvents(events, 'chunk');
      expect(chunks.length).toBeGreaterThan(0);

      // Should have a complete event
      const completeEvent = findSSEEvent(events, 'complete');
      expect(completeEvent).toBeDefined();

      // Should have token usage
      const tokensEvent = findSSEEvent(events, 'tokens');
      if (tokensEvent) {
        const tokens = tokensEvent.data as { inputTokens?: number; outputTokens?: number };
        expect(tokens.inputTokens).toBeGreaterThan(0);
        expect(tokens.outputTokens).toBeGreaterThan(0);
      }
    });

    // Skip: Requires AI provider API keys configured for the test user
    it.skip('should maintain conversation context on follow-up messages', async () => {
      if (!testAgent) {
        console.log('Skipping: No test agent available');
        return;
      }

      const conversationSlug = `test-context-${Date.now()}`;

      // First message
      await ctx.apiKeyClient.sse(
        `/api/${ctx.auth.username}/agents/${testAgent.uid}/conversation/${conversationSlug}`,
        { message: 'Remember this number: 42' },
        { timeout: 60000 }
      );

      // Follow-up message
      const { ok, events } = await ctx.apiKeyClient.sse(
        `/api/${ctx.auth.username}/agents/${testAgent.uid}/conversation/${conversationSlug}`,
        { message: 'What number did I ask you to remember?' },
        { timeout: 60000 }
      );

      expect(ok).toBe(true);

      // The response should mention 42
      const textContent = extractTextFromChunks(events);
      expect(textContent.toLowerCase()).toMatch(/42|forty.?two/i);
    });

    it('should reject requests without API key', async () => {
      if (!testAgent) {
        console.log('Skipping: No test agent available');
        return;
      }

      const conversationSlug = `test-unauth-${Date.now()}`;
      const { ok, status } = await ctx.publicClient.sse(
        `/api/${ctx.auth.username}/agents/${testAgent.uid}/conversation/${conversationSlug}`,
        { message: 'Hello' }
      );

      expect(ok).toBe(false);
      expect(status).toBe(401);
    });
  });

  describe('GET /api/:username/agents/:uid/conversation/:conversationId', () => {
    // Skip: Requires creating a conversation first, which needs AI provider API keys
    it.skip('should retrieve conversation history', async () => {
      if (!testAgent) {
        console.log('Skipping: No test agent available');
        return;
      }

      const conversationSlug = `test-history-${Date.now()}`;

      // Create a conversation first
      await ctx.apiKeyClient.sse(
        `/api/${ctx.auth.username}/agents/${testAgent.uid}/conversation/${conversationSlug}`,
        { message: 'Hello' },
        { timeout: 60000 }
      );

      // Get conversation history
      const result = await ctx.apiKeyClient.get<{
        success: boolean;
        data: {
          id: string;
          slug: string;
          messages: Array<{
            role: string;
            content: string;
          }>;
        };
      }>(`/api/${ctx.auth.username}/agents/${testAgent.uid}/conversation/${conversationSlug}`);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.success).toBe(true);
        expect(result.data.data.slug).toBe(conversationSlug);
        expect(result.data.data.messages.length).toBeGreaterThanOrEqual(2); // User + Assistant
      }
    });

    it('should return 404 for non-existent conversation', async () => {
      if (!testAgent) {
        console.log('Skipping: No test agent available');
        return;
      }

      const result = await ctx.apiKeyClient.get(
        `/api/${ctx.auth.username}/agents/${testAgent.uid}/conversation/nonexistent-conv-12345`
      );

      expect(result.ok).toBe(false);
      expect(result.status).toBe(404);
    });
  });

  describe('GET /api/:username/agents/:uid/conversations', () => {
    // Skip: Requires creating a conversation first, which needs AI provider API keys
    it.skip('should list all conversations for an agent', async () => {
      if (!testAgent) {
        console.log('Skipping: No test agent available');
        return;
      }

      // Create a conversation first
      const conversationSlug = `test-list-${Date.now()}`;
      await ctx.apiKeyClient.sse(
        `/api/${ctx.auth.username}/agents/${testAgent.uid}/conversation/${conversationSlug}`,
        { message: 'Hello' },
        { timeout: 60000 }
      );

      // List conversations
      const result = await ctx.apiKeyClient.get<{
        success: boolean;
        data: Array<{
          id: string;
          slug: string;
          messageCount: number;
        }>;
        pagination: {
          limit: number;
          offset: number;
          total?: number;
        };
      }>(`/api/${ctx.auth.username}/agents/${testAgent.uid}/conversations`);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.success).toBe(true);
        expect(Array.isArray(result.data.data)).toBe(true);
        expect(result.data.pagination).toBeDefined();
      }
    });
  });
});
