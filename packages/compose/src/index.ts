export { ToolSetBuilder } from './builder';
export type { AnyToolDefinition, ToolRecord } from './types';

import { ToolSetBuilder } from './builder';

/**
 * Create a new empty ToolSetBuilder.
 *
 * @example
 * ```ts
 * import { createToolSet } from '@tpmjs/compose';
 * import { weatherTool } from './tools/weather';
 *
 * const tools = createToolSet()
 *   .use('weather', weatherTool)
 *   .use('search', searchTool)
 *   .build();
 *
 * // Pass directly to AI SDK:
 * const result = await generateText({ model, tools, messages });
 * ```
 */
export function createToolSet(): ToolSetBuilder {
  return new ToolSetBuilder();
}
