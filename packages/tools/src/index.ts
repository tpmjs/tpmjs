import { z } from 'zod';

/**
 * Hello World Tool
 * Returns a simple "Hello, World!" greeting
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 */
export const helloWorldTool = {
  description: 'Returns a simple "Hello, World!" greeting',
  parameters: z.object({}),
  execute: async () => {
    return {
      message: 'Hello, World!',
      timestamp: new Date().toISOString(),
    };
  },
};

/**
 * Hello Name Tool
 * Returns a personalized greeting with the provided name
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 */
export const helloNameTool = {
  description: 'Returns a personalized greeting with the provided name',
  parameters: z.object({
    name: z.string().describe('The name of the person to greet'),
  }),
  execute: async ({ name }: { name: string }) => {
    return {
      message: `Hello, ${name}!`,
      timestamp: new Date().toISOString(),
    };
  },
};
