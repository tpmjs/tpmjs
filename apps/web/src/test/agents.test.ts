/**
 * Agent Endpoints Integration Tests
 *
 * Tests the agent conversation API endpoints including:
 * - Sending messages and receiving streaming responses
 * - Tool calls and execution
 * - Conversation history persistence
 * - Database state verification
 */

import { prisma } from '@tpmjs/db';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_AGENT_UID = 'omega'; // The test agent UID
const TEST_CONVERSATION_SLUG = `test-conv-${Date.now()}`;

interface SSEEvent {
  event: string;
  data: unknown;
}

/**
 * Parse SSE response into array of events
 */
function parseSSEResponse(text: string): SSEEvent[] {
  const events: SSEEvent[] = [];
  const lines = text.split('\n');

  let currentEvent = '';
  let currentData = '';

  for (const line of lines) {
    if (line.startsWith('event: ')) {
      currentEvent = line.slice(7);
    } else if (line.startsWith('data: ')) {
      currentData = line.slice(6);
      if (currentEvent && currentData) {
        try {
          events.push({
            event: currentEvent,
            data: JSON.parse(currentData),
          });
        } catch {
          events.push({
            event: currentEvent,
            data: currentData,
          });
        }
        currentEvent = '';
        currentData = '';
      }
    }
  }

  return events;
}

describe('Agent Endpoints', () => {
  let testAgent: {
    id: string;
    uid: string;
    name: string;
    userId: string;
    provider: string;
  } | null = null;

  let testConversationId: string | null = null;

  beforeAll(async () => {
    // Find the test agent in the database
    testAgent = await prisma.agent.findUnique({
      where: { uid: TEST_AGENT_UID },
      select: {
        id: true,
        uid: true,
        name: true,
        userId: true,
        provider: true,
      },
    });

    if (!testAgent) {
      console.warn(`⚠️  Test agent "${TEST_AGENT_UID}" not found. Skipping agent tests.`);
    }
  });

  afterAll(async () => {
    // Clean up test conversation
    if (testConversationId) {
      await prisma.conversation.deleteMany({
        where: { id: testConversationId },
      });
    }
    await prisma.$disconnect();
  });

  describe('POST /api/agents/[id]/conversation/[conversationId]', () => {
    it('should create a new conversation and receive a response', async () => {
      if (!testAgent) {
        console.log('Skipping: No test agent available');
        return;
      }

      const response = await fetch(
        `${BASE_URL}/api/agents/${testAgent.uid}/conversation/${TEST_CONVERSATION_SLUG}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Hello, what is 2 + 2?' }),
        }
      );

      expect(response.ok).toBe(true);
      expect(response.headers.get('content-type')).toContain('text/event-stream');

      const text = await response.text();
      const events = parseSSEResponse(text);

      // Should have at least chunk events and a complete event
      expect(events.length).toBeGreaterThan(0);

      // Find the complete event
      const completeEvent = events.find((e) => e.event === 'complete');
      expect(completeEvent).toBeDefined();

      if (completeEvent?.data && typeof completeEvent.data === 'object') {
        const data = completeEvent.data as { conversationId?: string };
        testConversationId = data.conversationId || null;
      }

      // Find text chunks
      const textChunks = events.filter((e) => e.event === 'chunk');
      expect(textChunks.length).toBeGreaterThan(0);

      // Verify token usage was reported
      const tokenEvent = events.find((e) => e.event === 'tokens');
      expect(tokenEvent).toBeDefined();
      if (tokenEvent?.data && typeof tokenEvent.data === 'object') {
        const tokens = tokenEvent.data as { inputTokens?: number; outputTokens?: number };
        expect(tokens.inputTokens).toBeGreaterThan(0);
        expect(tokens.outputTokens).toBeGreaterThan(0);
      }
    });

    it('should persist conversation in database', async () => {
      if (!testAgent || !testConversationId) {
        console.log('Skipping: No test conversation available');
        return;
      }

      const conversation = await prisma.conversation.findUnique({
        where: { id: testConversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      expect(conversation).toBeDefined();
      expect(conversation?.agentId).toBe(testAgent.id);
      expect(conversation?.slug).toBe(TEST_CONVERSATION_SLUG);

      // Should have at least a user message and an assistant message
      expect(conversation?.messages.length).toBeGreaterThanOrEqual(2);

      const userMessage = conversation?.messages.find((m) => m.role === 'USER');
      expect(userMessage?.content).toContain('2 + 2');

      const assistantMessage = conversation?.messages.find((m) => m.role === 'ASSISTANT');
      expect(assistantMessage).toBeDefined();
      expect(assistantMessage?.content.length).toBeGreaterThan(0);
    });

    it('should maintain conversation history on follow-up messages', async () => {
      if (!testAgent) {
        console.log('Skipping: No test agent available');
        return;
      }

      const response = await fetch(
        `${BASE_URL}/api/agents/${testAgent.uid}/conversation/${TEST_CONVERSATION_SLUG}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'What was my previous question?' }),
        }
      );

      expect(response.ok).toBe(true);

      const text = await response.text();
      const events = parseSSEResponse(text);

      // Collect all text from chunks
      const textContent = events
        .filter((e) => e.event === 'chunk')
        .map((e) => {
          const data = e.data as { text?: string };
          return data.text || '';
        })
        .join('');

      // The response should reference the previous question about 2+2
      expect(textContent.toLowerCase()).toMatch(/2.*\+.*2|previous|earlier|asked/);
    });

    it('should execute tool calls when requested', async () => {
      if (!testAgent) {
        console.log('Skipping: No test agent available');
        return;
      }

      // Use a unique conversation for tool test
      const toolConvSlug = `tool-test-${Date.now()}`;

      const response = await fetch(
        `${BASE_URL}/api/agents/${testAgent.uid}/conversation/${toolConvSlug}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Please execute this Python code: print("Hello from test")',
          }),
        }
      );

      expect(response.ok).toBe(true);

      const text = await response.text();
      const events = parseSSEResponse(text);

      // Should have tool call events if the agent has code execution tools
      const toolCallEvents = events.filter((e) => e.event === 'tool_call');
      const toolResultEvents = events.filter((e) => e.event === 'tool_result');

      if (toolCallEvents.length > 0 && toolCallEvents[0]) {
        console.log(`✓ Tool called: ${JSON.stringify(toolCallEvents[0].data)}`);
        // Tool results may come in same stream or be processed async
        // The important thing is the tool was called
        console.log(`  Tool results received: ${toolResultEvents.length}`);

        // Verify tool call was saved to database
        const conversation = await prisma.conversation.findFirst({
          where: {
            agentId: testAgent.id,
            slug: toolConvSlug,
          },
          include: {
            messages: true,
          },
        });

        const toolMessage = conversation?.messages.find((m) => m.role === 'TOOL');
        if (toolMessage) {
          expect(toolMessage.toolName).toBeDefined();
          expect(toolMessage.toolCallId).toBeDefined();
        }

        // Clean up
        await prisma.conversation.deleteMany({
          where: { agentId: testAgent.id, slug: toolConvSlug },
        });
      } else {
        console.log('ℹ️  No tool calls made (agent may not have tool access)');
      }
    });
  });

  describe('GET /api/agents/[id]/conversation/[conversationId]', () => {
    it('should retrieve conversation history', async () => {
      if (!testAgent || !testConversationId) {
        console.log('Skipping: No test conversation available');
        return;
      }

      const response = await fetch(
        `${BASE_URL}/api/agents/${testAgent.uid}/conversation/${TEST_CONVERSATION_SLUG}`,
        { method: 'GET' }
      );

      expect(response.ok).toBe(true);

      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.slug).toBe(TEST_CONVERSATION_SLUG);
      expect(result.data.messages).toBeInstanceOf(Array);
      expect(result.data.messages.length).toBeGreaterThanOrEqual(2);
    });

    it('should return 404 for non-existent conversation', async () => {
      if (!testAgent) {
        console.log('Skipping: No test agent available');
        return;
      }

      const response = await fetch(
        `${BASE_URL}/api/agents/${testAgent.uid}/conversation/non-existent-conv-12345`,
        { method: 'GET' }
      );

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/agents/[id]/conversations', () => {
    it('should list all conversations for an agent', async () => {
      if (!testAgent) {
        console.log('Skipping: No test agent available');
        return;
      }

      const response = await fetch(`${BASE_URL}/api/agents/${testAgent.id}/conversations`, {
        method: 'GET',
      });

      expect(response.ok).toBe(true);

      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Array);
      expect(result.pagination).toBeDefined();

      // Our test conversation should be in the list
      const testConv = result.data.find((c: { slug: string }) => c.slug === TEST_CONVERSATION_SLUG);
      expect(testConv).toBeDefined();
      expect(testConv.messageCount).toBeGreaterThanOrEqual(2);
    });

    it('should support pagination', async () => {
      if (!testAgent) {
        console.log('Skipping: No test agent available');
        return;
      }

      const response = await fetch(
        `${BASE_URL}/api/agents/${testAgent.id}/conversations?limit=1&offset=0`,
        { method: 'GET' }
      );

      expect(response.ok).toBe(true);

      const result = await response.json();
      expect(result.pagination.limit).toBe(1);
      expect(result.data.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Database State Verification', () => {
    it('should have correct message token counts', async () => {
      if (!testConversationId) {
        console.log('Skipping: No test conversation available');
        return;
      }

      const messages = await prisma.message.findMany({
        where: { conversationId: testConversationId },
        orderBy: { createdAt: 'asc' },
      });

      // Assistant messages should have token counts
      const assistantMessages = messages.filter((m) => m.role === 'ASSISTANT');
      for (const msg of assistantMessages) {
        expect(msg.inputTokens).toBeGreaterThan(0);
        expect(msg.outputTokens).toBeGreaterThan(0);
      }
    });

    it('should correctly track tool calls in messages', async () => {
      if (!testConversationId) {
        console.log('Skipping: No test conversation available');
        return;
      }

      const toolMessages = await prisma.message.findMany({
        where: {
          conversationId: testConversationId,
          role: 'TOOL',
        },
      });

      for (const msg of toolMessages) {
        expect(msg.toolCallId).toBeDefined();
        expect(msg.toolName).toBeDefined();
        expect(msg.toolResult).toBeDefined();
      }
    });
  });

  describe('Agent with lookup by ID or UID', () => {
    it('should accept agent ID in URL', async () => {
      if (!testAgent) {
        console.log('Skipping: No test agent available');
        return;
      }

      const response = await fetch(`${BASE_URL}/api/agents/${testAgent.id}/conversations`, {
        method: 'GET',
      });

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.success).toBe(true);
    });

    it('should accept agent UID in URL', async () => {
      if (!testAgent) {
        console.log('Skipping: No test agent available');
        return;
      }

      const response = await fetch(`${BASE_URL}/api/agents/${testAgent.uid}/conversations`, {
        method: 'GET',
      });

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.success).toBe(true);
    });
  });
});
