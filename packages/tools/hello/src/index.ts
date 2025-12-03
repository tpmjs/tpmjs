import { jsonSchema, tool } from 'ai';

/**
 * Input type for Hello World Tool
 */
type HelloWorldInput = {
  includeTimestamp?: boolean;
};

/**
 * Hello World Tool
 * Returns a simple "Hello, World!" greeting
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 * Uses jsonSchema() to avoid Zod 4 JSON Schema conversion issues with OpenAI
 */
export const helloWorldTool = tool({
  description: 'Returns a simple "Hello, World!" greeting message',
  inputSchema: jsonSchema<HelloWorldInput>({
    type: 'object',
    properties: {
      includeTimestamp: {
        type: 'boolean',
        description: 'Whether to include a timestamp in the response',
      },
    },
    additionalProperties: false,
  }),
  async execute({ includeTimestamp = true }) {
    const response: Record<string, unknown> = {
      message: 'Hello, World!',
    };

    if (includeTimestamp) {
      response.timestamp = new Date().toISOString();
    }

    return response;
  },
});

/**
 * Input type for Hello Name Tool
 */
type HelloNameInput = {
  name: string;
};

/**
 * Hello Name Tool
 * Returns a personalized greeting with the provided name
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 * Uses jsonSchema() to avoid Zod 4 JSON Schema conversion issues with OpenAI
 */
export const helloNameTool = tool({
  description: 'Returns a personalized greeting with the provided name',
  inputSchema: jsonSchema<HelloNameInput>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'The name of the person to greet',
      },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute({ name }) {
    return {
      message: `Hello, ${name}!`,
      timestamp: new Date().toISOString(),
    };
  },
});
