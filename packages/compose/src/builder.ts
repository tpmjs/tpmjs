import type { AnyToolDefinition, ToolRecord } from './types';

/**
 * Typed, chainable builder for assembling AI SDK tool sets.
 *
 * Generic parameter `TTools` accumulates the tool record type at each `.use()` step,
 * giving you full type inference without codegen.
 *
 * @example
 * ```ts
 * const tools = new ToolSetBuilder()
 *   .use('weather', weatherTool)
 *   .use('search', searchTool)
 *   .build();
 * // tools: { weather: typeof weatherTool; search: typeof searchTool }
 * ```
 */
export class ToolSetBuilder<TTools extends ToolRecord = Record<string, never>> {
  private tools: Map<string, AnyToolDefinition>;

  constructor(initial?: Map<string, AnyToolDefinition>) {
    this.tools = initial ? new Map(initial) : new Map();
  }

  /**
   * Add a single named tool to the set.
   * Overwrites any existing tool with the same name.
   */
  use<N extends string, D extends AnyToolDefinition>(
    name: N,
    definition: D
  ): ToolSetBuilder<TTools & Record<N, D>> {
    const next = new Map(this.tools);
    next.set(name, definition);
    return new ToolSetBuilder(next) as ToolSetBuilder<TTools & Record<N, D>>;
  }

  /**
   * Add all tools from a record at once.
   * Existing tools with the same name are overwritten.
   */
  useAll<R extends ToolRecord>(tools: R): ToolSetBuilder<TTools & R> {
    const next = new Map(this.tools);
    for (const [name, def] of Object.entries(tools)) {
      next.set(name, def);
    }
    return new ToolSetBuilder(next) as ToolSetBuilder<TTools & R>;
  }

  /**
   * Remove a tool by name.
   */
  without<N extends string & keyof TTools>(name: N): ToolSetBuilder<Omit<TTools, N>> {
    const next = new Map(this.tools);
    next.delete(name);
    return new ToolSetBuilder(next) as unknown as ToolSetBuilder<Omit<TTools, N>>;
  }

  /**
   * Build the final tool record. Pass this directly to `generateText()` or `streamText()`.
   */
  build(): TTools {
    const result: ToolRecord = {};
    for (const [name, def] of this.tools) {
      result[name] = def;
    }
    return result as TTools;
  }

  /**
   * Number of tools currently in the set.
   */
  get size(): number {
    return this.tools.size;
  }

  /**
   * Names of all tools currently in the set.
   */
  get names(): string[] {
    return [...this.tools.keys()];
  }
}
