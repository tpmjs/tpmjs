/**
 * Eval Fixture Build Tool for TPMJS
 * Converts conversations into eval fixtures with inputs and expected tool calls.
 *
 * Domain Rules:
 * - Must output JSONL-compatible fixtures
 * - Must follow strict eval schema
 * - Must extract tool calls from conversations
 */

import { jsonSchema, tool } from 'ai';

/**
 * Represents a tool call extracted from a conversation
 */
export interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
}

/**
 * Represents a conversation message
 */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: ToolCall[];
}

/**
 * Represents a conversation transcript
 */
export interface Conversation {
  id?: string;
  messages: ConversationMessage[];
  metadata?: Record<string, unknown>;
}

/**
 * Represents a single eval fixture (JSONL-compatible)
 */
export interface EvalFixture {
  id: string;
  input: string; // User prompt
  expectedToolCalls: ToolCall[];
  metadata?: {
    conversationId?: string;
    messageCount?: number;
    extractedAt?: string;
  };
}

/**
 * Result of building evaluation fixtures
 */
export interface EvalFixtureResult {
  fixtures: EvalFixture[];
  count: number;
  totalConversations: number;
  skipped: number;
}

type EvalFixtureBuildInput = {
  conversations: Conversation[];
};

/**
 * Extracts tool calls from conversation messages (domain rule)
 */
function extractToolCallsFromConversation(conversation: Conversation): {
  input: string;
  toolCalls: ToolCall[];
} | null {
  const messages = conversation.messages;

  // Find the first user message as input
  const userMessage = messages.find((m) => m.role === 'user');
  if (!userMessage) {
    return null; // No user input found
  }

  // Extract all tool calls from assistant messages
  const toolCalls: ToolCall[] = [];
  for (const message of messages) {
    if (message.role === 'assistant' && message.toolCalls) {
      toolCalls.push(...message.toolCalls);
    }
  }

  // Skip if no tool calls were made
  if (toolCalls.length === 0) {
    return null;
  }

  return {
    input: userMessage.content,
    toolCalls,
  };
}

/**
 * Converts conversations to JSONL-compatible eval fixtures (domain rule)
 */
function buildFixtures(conversations: Conversation[]): {
  fixtures: EvalFixture[];
  skipped: number;
} {
  const fixtures: EvalFixture[] = [];
  let skipped = 0;

  for (let i = 0; i < conversations.length; i++) {
    const conversation = conversations[i];
    if (!conversation) continue;

    const extracted = extractToolCallsFromConversation(conversation);

    if (!extracted) {
      skipped++;
      continue;
    }

    const fixtureId = conversation.id || `fixture-${i + 1}`;

    // Build JSONL-compatible fixture (domain rule: strict eval schema)
    const fixture: EvalFixture = {
      id: fixtureId,
      input: extracted.input,
      expectedToolCalls: extracted.toolCalls,
      metadata: {
        conversationId: conversation.id,
        messageCount: conversation.messages.length,
        extractedAt: new Date().toISOString(),
        ...conversation.metadata,
      },
    };

    fixtures.push(fixture);
  }

  return { fixtures, skipped };
}

/**
 * Eval Fixture Build Tool
 * Converts conversations into eval fixtures with inputs and expected tool calls
 */
export const evalFixtureBuildTool = tool({
  description:
    'Converts conversation transcripts into evaluation fixtures for testing AI tool usage. Extracts user inputs and tool calls from conversations, outputting JSONL-compatible fixtures with strict schema adherence.',
  inputSchema: jsonSchema<EvalFixtureBuildInput>({
    type: 'object',
    properties: {
      conversations: {
        type: 'array',
        description: 'Array of conversation transcripts with messages and tool calls',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique conversation ID',
            },
            messages: {
              type: 'array',
              description: 'Conversation messages',
              items: {
                type: 'object',
                properties: {
                  role: {
                    type: 'string',
                    enum: ['user', 'assistant', 'system'],
                    description: 'Message role',
                  },
                  content: {
                    type: 'string',
                    description: 'Message content',
                  },
                  toolCalls: {
                    type: 'array',
                    description: 'Tool calls made in this message',
                    items: {
                      type: 'object',
                      properties: {
                        tool: {
                          type: 'string',
                          description: 'Tool name',
                        },
                        args: {
                          type: 'object',
                          description: 'Tool arguments',
                          additionalProperties: true,
                        },
                      },
                      required: ['tool', 'args'],
                    },
                  },
                },
                required: ['role', 'content'],
              },
            },
            metadata: {
              type: 'object',
              description: 'Conversation metadata',
            },
          },
          required: ['messages'],
        },
      },
    },
    required: ['conversations'],
    additionalProperties: false,
  }),
  async execute({ conversations }): Promise<EvalFixtureResult> {
    // Validate input
    if (!Array.isArray(conversations)) {
      throw new Error('Invalid conversations: must be an array');
    }

    if (conversations.length === 0) {
      return {
        fixtures: [],
        count: 0,
        totalConversations: 0,
        skipped: 0,
      };
    }

    // Validate conversation structure
    for (const conversation of conversations) {
      if (!conversation.messages || !Array.isArray(conversation.messages)) {
        throw new Error('Invalid conversation: each conversation must have a messages array');
      }
    }

    // Build fixtures from conversations
    const { fixtures, skipped } = buildFixtures(conversations);

    return {
      fixtures,
      count: fixtures.length,
      totalConversations: conversations.length,
      skipped,
    };
  },
});

export default evalFixtureBuildTool;
