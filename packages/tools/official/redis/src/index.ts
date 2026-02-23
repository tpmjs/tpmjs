import { jsonSchema, tool } from 'ai';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ExampleRedisInput {
  message: string;
}

interface ExampleRedisOutput {
  success: boolean;
  message: string;
  timestamp: string;
}

// ─── Tools ──────────────────────────────────────────────────────────────────

/**
 * Example redis tool that demonstrates the basic structure.
 *
 * Replace this with your actual tool implementation.
 */
export const exampleRedis = tool({
  description: 'Example redis tool that echoes a message',
  inputSchema: jsonSchema<ExampleRedisInput>({
    type: 'object',
    properties: {
      message: { type: 'string', description: 'The message to echo' },
    },
    required: ['message'],
    additionalProperties: false,
  }),
  execute: async ({ message }): Promise<ExampleRedisOutput> => {
    return {
      success: true,
      message: `Echo: ${message}`,
      timestamp: new Date().toISOString(),
    };
  },
});

// Export all tools
export const redisTools = {
  exampleRedis,
};
