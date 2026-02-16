/**
 * Sandbox Shell Tools — End-to-end integration test
 *
 * Creates an agent with sandbox executor, attaches a collection owned by
 * thomasalwyndavis@gmail.com, then runs a multi-turn conversation that:
 *   1. Clones https://github.com/thomasdavis/omega
 *   2. Lists the repo contents
 *   3. Creates a new file
 *   4. Commits the change
 *   5. Verifies the commit via git log
 *
 * Requirements:
 *   - INTEGRATION_TESTS=true
 *   - INTEGRATION_TEST_API_KEY / INTEGRATION_TEST_SESSION_TOKEN set
 *   - AGENT_SANDBOX_URL pointing to a running sandbox server
 *   - The sandbox-shell tools registered in the DB
 *   - A collection owned by thomasalwyndavis@gmail.com with sandbox-shell tools
 */

import { prisma } from '@tpmjs/db';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { extractTextFromChunks, filterSSEEvents, findSSEEvent } from '../_helpers/sse-parser';
import {
  cleanupTestContext,
  getTestContext,
  type IntegrationTestContext,
} from '../_helpers/test-context';

const INTEGRATION_TESTS_ENABLED = process.env.INTEGRATION_TESTS === 'true';
const CONVERSATION_TIMEOUT = 120_000; // 2 minutes per turn (git clone can be slow)

describe.skipIf(!INTEGRATION_TESTS_ENABLED)('Sandbox Shell E2E — Git Clone & Commit', () => {
  let ctx: IntegrationTestContext;
  let testAgent: { id: string; uid: string; name: string } | null = null;
  let collectionId: string | null = null;
  let conversationSlug: string;

  beforeAll(async () => {
    ctx = getTestContext();

    // -----------------------------------------------------------------------
    // 1. Find a collection from thomasalwyndavis@gmail.com that has sandbox-shell tools
    // -----------------------------------------------------------------------
    const userCollection = await prisma.collection.findFirst({
      where: {
        user: { email: 'thomasalwyndavis@gmail.com' },
        tools: {
          some: {
            tool: {
              package: { npmPackageName: '@tpmjs/official-sandbox-shell' },
            },
          },
        },
      },
      select: { id: true, slug: true, name: true },
    });

    if (!userCollection) {
      // Fallback: find ANY collection with sandbox-shell tools
      const anyCollection = await prisma.collection.findFirst({
        where: {
          tools: {
            some: {
              tool: {
                package: { npmPackageName: '@tpmjs/official-sandbox-shell' },
              },
            },
          },
        },
        select: { id: true, slug: true, name: true },
      });

      if (!anyCollection) {
        console.warn(
          '⚠️  No collection with @tpmjs/official-sandbox-shell tools found — some tests will be skipped'
        );
        return;
      }
      collectionId = anyCollection.id;
      console.log(`Using fallback collection: ${anyCollection.name} (${anyCollection.slug})`);
    } else {
      collectionId = userCollection.id;
      console.log(`Using collection: ${userCollection.name} (${userCollection.slug})`);
    }

    // -----------------------------------------------------------------------
    // 2. Create a test agent with sandbox executor
    // -----------------------------------------------------------------------
    testAgent = await ctx.factories.agent.create({
      name: `Sandbox E2E Agent ${Date.now()}`,
      description: 'Integration test agent for sandbox shell tools',
      provider: 'OPENAI',
      modelId: 'gpt-4o-mini',
      systemPrompt: [
        'You are a development assistant with access to a sandbox workspace.',
        'You can clone git repos, read/write files, and run shell commands.',
        'When asked to do something, use the tools available to you.',
        'Be concise in your responses. After completing a task, briefly confirm what you did.',
      ].join(' '),
      maxToolCallsPerTurn: 10,
      collectionIds: [collectionId],
    });

    // -----------------------------------------------------------------------
    // 3. Set the agent executor type to sandbox
    // -----------------------------------------------------------------------
    await ctx.apiKeyClient.patch(`/api/agents/${testAgent.id}`, {
      executorType: 'sandbox',
      executorConfig: { type: 'sandbox' },
    });

    conversationSlug = `test-sandbox-e2e-${Date.now()}`;
  });

  afterAll(async () => {
    await cleanupTestContext();
  });

  it('should clone a repo, create a file, and commit', async () => {
    if (!testAgent || !collectionId) {
      console.log('Skipping: No test agent or collection available');
      return;
    }

    // -----------------------------------------------------------------------
    // Turn 1: Clone the repo
    // -----------------------------------------------------------------------
    console.log('Turn 1: Cloning repo...');
    const turn1 = await ctx.apiKeyClient.sse(
      `/api/${ctx.auth.username}/agents/${testAgent.uid}/conversation/${conversationSlug}`,
      {
        message:
          'Clone the repo https://github.com/thomasdavis/omega with depth 1. Then list the files in it.',
      },
      { timeout: CONVERSATION_TIMEOUT }
    );

    expect(turn1.ok).toBe(true);
    expect(turn1.status).toBe(200);

    const turn1Chunks = filterSSEEvents(turn1.events, 'chunk');
    expect(turn1Chunks.length).toBeGreaterThan(0);

    const turn1Complete = findSSEEvent(turn1.events, 'complete');
    expect(turn1Complete).toBeDefined();

    const turn1Text = extractTextFromChunks(turn1.events);
    console.log('Turn 1 response:', turn1Text.slice(0, 300));

    // Should have used tools (shellExec for git clone, listFiles)
    const turn1ToolCalls = filterSSEEvents(turn1.events, 'tool-call');
    console.log(
      `Turn 1 tool calls: ${turn1ToolCalls.length}`,
      turn1ToolCalls.map((e) => (e.data as { toolName?: string }).toolName)
    );

    // -----------------------------------------------------------------------
    // Turn 2: Create a file and commit
    // -----------------------------------------------------------------------
    console.log('Turn 2: Creating file and committing...');
    const turn2 = await ctx.apiKeyClient.sse(
      `/api/${ctx.auth.username}/agents/${testAgent.uid}/conversation/${conversationSlug}`,
      {
        message: [
          'In the omega repo directory:',
          '1. Create a file called "sandbox-test.txt" with the content "Hello from TPMJS sandbox!"',
          '2. Configure git user: git config user.email "test@tpmjs.com" and git config user.name "TPMJS Bot"',
          '3. Stage the new file with git add',
          '4. Commit with the message "test: add sandbox test file"',
          '5. Show me the git log to confirm the commit',
        ].join('\n'),
      },
      { timeout: CONVERSATION_TIMEOUT }
    );

    expect(turn2.ok).toBe(true);
    expect(turn2.status).toBe(200);

    const turn2Complete = findSSEEvent(turn2.events, 'complete');
    expect(turn2Complete).toBeDefined();

    const turn2Text = extractTextFromChunks(turn2.events);
    console.log('Turn 2 response:', turn2Text.slice(0, 500));

    // The response should mention the commit or the file creation
    const turn2ToolCalls = filterSSEEvents(turn2.events, 'tool-call');
    console.log(
      `Turn 2 tool calls: ${turn2ToolCalls.length}`,
      turn2ToolCalls.map((e) => (e.data as { toolName?: string }).toolName)
    );

    // -----------------------------------------------------------------------
    // Turn 3: Verify — read back the file and check git log
    // -----------------------------------------------------------------------
    console.log('Turn 3: Verifying...');
    const turn3 = await ctx.apiKeyClient.sse(
      `/api/${ctx.auth.username}/agents/${testAgent.uid}/conversation/${conversationSlug}`,
      {
        message:
          'Read the file omega/sandbox-test.txt and show me the last 3 git log entries in the omega directory.',
      },
      { timeout: CONVERSATION_TIMEOUT }
    );

    expect(turn3.ok).toBe(true);
    expect(turn3.status).toBe(200);

    const turn3Text = extractTextFromChunks(turn3.events);
    console.log('Turn 3 response:', turn3Text.slice(0, 500));

    // The verification response should contain our file content and commit message
    expect(turn3Text).toMatch(/Hello from TPMJS sandbox|sandbox-test/i);
  });

  it('should retrieve conversation history with tool calls', async () => {
    if (!testAgent || !collectionId) {
      console.log('Skipping: No test agent or collection available');
      return;
    }

    // Retrieve the conversation we just had
    const result = await ctx.apiKeyClient.get<{
      success: boolean;
      data: {
        id: string;
        slug: string;
        messages: Array<{
          role: string;
          content: string | null;
          toolName: string | null;
          toolCallId: string | null;
        }>;
      };
    }>(`/api/${ctx.auth.username}/agents/${testAgent.uid}/conversation/${conversationSlug}`);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.success).toBe(true);
      expect(result.data.data.slug).toBe(conversationSlug);

      const messages = result.data.data.messages;

      // Should have user messages (3 turns), assistant messages, and tool messages
      const userMessages = messages.filter((m) => m.role === 'USER');
      const assistantMessages = messages.filter((m) => m.role === 'ASSISTANT');
      const toolMessages = messages.filter((m) => m.role === 'TOOL');

      console.log(
        `Conversation: ${userMessages.length} user, ${assistantMessages.length} assistant, ${toolMessages.length} tool messages`
      );

      expect(userMessages.length).toBe(3);
      expect(assistantMessages.length).toBeGreaterThanOrEqual(3);
      // Should have tool messages from shellExec, writeFile, readFile, listFiles
      expect(toolMessages.length).toBeGreaterThan(0);
    }
  });
});
