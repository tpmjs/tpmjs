import type { Tool } from 'ai';
import { jsonSchema } from 'ai';
import { describe, expect, it } from 'vitest';
import { createToolSet, ToolSetBuilder } from '../index';

// Use plain tool objects (same pattern as the TPMJS codebase)
const weatherTool: Tool<{ city: string }, { temp: number; city: string }> = {
  description: 'Get weather for a location',
  inputSchema: jsonSchema({
    type: 'object' as const,
    properties: { city: { type: 'string' } },
    required: ['city'],
  }),
  execute: async ({ city }) => ({ temp: 72, city }),
};

const searchTool: Tool<{ query: string }, { results: string[] }> = {
  description: 'Search the web',
  inputSchema: jsonSchema({
    type: 'object' as const,
    properties: { query: { type: 'string' } },
    required: ['query'],
  }),
  execute: async ({ query }) => ({ results: [`Result for ${query}`] }),
};

const calcTool: Tool<{ expression: string }, { result: string }> = {
  description: 'Calculate math',
  inputSchema: jsonSchema({
    type: 'object' as const,
    properties: { expression: { type: 'string' } },
    required: ['expression'],
  }),
  execute: async ({ expression }) => ({ result: expression }),
};

describe('ToolSetBuilder', () => {
  it('should create an empty builder', () => {
    const builder = new ToolSetBuilder();
    expect(builder.size).toBe(0);
    expect(builder.names).toEqual([]);
  });

  it('should add a tool with .use()', () => {
    const builder = new ToolSetBuilder().use('weather', weatherTool);
    expect(builder.size).toBe(1);
    expect(builder.names).toEqual(['weather']);
  });

  it('should chain multiple .use() calls', () => {
    const builder = new ToolSetBuilder().use('weather', weatherTool).use('search', searchTool);
    expect(builder.size).toBe(2);
    expect(builder.names).toContain('weather');
    expect(builder.names).toContain('search');
  });

  it('should build a tool record', () => {
    const tools = new ToolSetBuilder()
      .use('weather', weatherTool)
      .use('search', searchTool)
      .build();
    expect(tools).toHaveProperty('weather');
    expect(tools).toHaveProperty('search');
    expect(tools.weather.description).toBe('Get weather for a location');
    expect(tools.search.description).toBe('Search the web');
  });

  it('should overwrite a tool with the same name', () => {
    const tools = new ToolSetBuilder().use('tool', weatherTool).use('tool', searchTool).build();
    expect(Object.keys(tools)).toEqual(['tool']);
    expect(tools.tool.description).toBe('Search the web');
  });

  it('should add all tools from a record with .useAll()', () => {
    const tools = new ToolSetBuilder().useAll({ weather: weatherTool, search: searchTool }).build();
    expect(Object.keys(tools)).toHaveLength(2);
    expect(tools.weather.description).toBe('Get weather for a location');
  });

  it('should remove a tool with .without()', () => {
    const tools = new ToolSetBuilder()
      .use('weather', weatherTool)
      .use('search', searchTool)
      .use('calc', calcTool)
      .without('search')
      .build();
    expect(Object.keys(tools)).toHaveLength(2);
    expect(tools).not.toHaveProperty('search');
    expect(tools).toHaveProperty('weather');
    expect(tools).toHaveProperty('calc');
  });

  it('should be immutable (each operation returns a new builder)', () => {
    const a = new ToolSetBuilder().use('weather', weatherTool);
    const b = a.use('search', searchTool);
    expect(a.size).toBe(1);
    expect(b.size).toBe(2);
  });
});

describe('createToolSet', () => {
  it('should return a ToolSetBuilder', () => {
    const builder = createToolSet();
    expect(builder).toBeInstanceOf(ToolSetBuilder);
    expect(builder.size).toBe(0);
  });

  it('should support the full chain: createToolSet -> use -> build', () => {
    const tools = createToolSet().use('weather', weatherTool).use('search', searchTool).build();
    expect(Object.keys(tools)).toHaveLength(2);
  });
});
