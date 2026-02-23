import type { Tool } from 'ai';

/**
 * Validates that a tool has the required structure:
 * - has a description (non-empty string)
 * - has an inputSchema
 * - has an execute function
 */
export function assertValidTool(tool: Tool, name: string): void {
  if (!tool) {
    throw new Error(`Tool "${name}" is undefined`);
  }
  if (typeof (tool as any).execute !== 'function') {
    throw new Error(`Tool "${name}" missing execute function`);
  }
  if (!tool.description || typeof tool.description !== 'string') {
    throw new Error(`Tool "${name}" missing or invalid description`);
  }
  if (!(tool as any).inputSchema && !(tool as any).parameters) {
    throw new Error(`Tool "${name}" missing inputSchema/parameters`);
  }
}

/**
 * Execute a tool and return the result, catching errors.
 * Useful for testing error cases without try/catch boilerplate.
 */
export async function executeTool<T = unknown>(
  tool: any,
  input: Record<string, unknown>
): Promise<{ result?: T; error?: Error }> {
  try {
    const result = await tool.execute(input, { toolCallId: 'test', messages: [] });
    return { result: result as T };
  } catch (error) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Assert that executing a tool with given input throws an error matching the pattern.
 */
export async function assertToolThrows(
  tool: any,
  input: Record<string, unknown>,
  errorPattern: string | RegExp
): Promise<void> {
  const { error } = await executeTool(tool, input);
  if (!error) {
    throw new Error('Expected tool to throw, but it succeeded');
  }
  const pattern = typeof errorPattern === 'string' ? new RegExp(errorPattern) : errorPattern;
  if (!pattern.test(error.message)) {
    throw new Error(`Expected error matching ${pattern}, got: "${error.message}"`);
  }
}

/**
 * Create a mock environment variable setter/restorer for tests.
 */
export function mockEnv(vars: Record<string, string | undefined>): { restore: () => void } {
  const original: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(vars)) {
    original[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  return {
    restore() {
      for (const [key, value] of Object.entries(original)) {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    },
  };
}

export type { Tool };
