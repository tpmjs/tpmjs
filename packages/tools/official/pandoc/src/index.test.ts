import { describe, expect, it } from 'vitest';
import { convert, listInputFormats, listOutputFormats } from './index.js';

function assertValidTool(tool: any, name: string): void {
  if (!tool) throw new Error(`Tool "${name}" is undefined`);
  if (typeof tool.execute !== 'function')
    throw new Error(`Tool "${name}" missing execute function`);
  if (!tool.description || typeof tool.description !== 'string')
    throw new Error(`Tool "${name}" missing or invalid description`);
  if (!tool.inputSchema && !tool.parameters)
    throw new Error(`Tool "${name}" missing inputSchema/parameters`);
}

describe('pandoc tools', () => {
  it('convert has valid tool structure', () => {
    assertValidTool(convert, 'convert');
  });

  it('listInputFormats has valid tool structure', () => {
    assertValidTool(listInputFormats, 'listInputFormats');
  });

  it('listOutputFormats has valid tool structure', () => {
    assertValidTool(listOutputFormats, 'listOutputFormats');
  });

  it('exports all 3 tools', async () => {
    const mod = await import('./index.js');
    const defaultExport = mod.default;
    expect(Object.keys(defaultExport)).toHaveLength(3);
  });
});
