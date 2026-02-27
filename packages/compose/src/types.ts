import type { Tool } from 'ai';

/**
 * Any tool definition compatible with AI SDK v6.
 * We use the broadest generic parameters to accept any tool shape.
 */
// biome-ignore lint/suspicious/noExplicitAny: AI SDK Tool type requires `any` for generic compatibility
export type AnyToolDefinition = Tool<any, any>;

/**
 * A record of named tool definitions.
 */
export type ToolRecord = Record<string, AnyToolDefinition>;
