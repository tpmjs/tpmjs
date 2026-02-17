import { describe, expect, it } from 'vitest';
import { format, query } from './index.js';

function assertValidTool(tool: any, name: string): void {
  if (!tool) throw new Error(`Tool "${name}" is undefined`);
  if (typeof tool.execute !== 'function')
    throw new Error(`Tool "${name}" missing execute function`);
  if (!tool.description || typeof tool.description !== 'string')
    throw new Error(`Tool "${name}" missing or invalid description`);
  if (!tool.inputSchema && !tool.parameters)
    throw new Error(`Tool "${name}" missing inputSchema/parameters`);
}

describe('jq tools', () => {
  it('query has valid tool structure', () => {
    assertValidTool(query, 'query');
  });

  it('format has valid tool structure', () => {
    assertValidTool(format, 'format');
  });

  it('exports all 2 tools', async () => {
    const mod = await import('./index.js');
    const defaultExport = mod.default;
    expect(Object.keys(defaultExport)).toHaveLength(2);
  });
});
