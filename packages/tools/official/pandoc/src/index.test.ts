import { assertValidTool } from '@tpmjs/tool-test-utils';
import { describe, expect, it } from 'vitest';
import { convert, listInputFormats, listOutputFormats } from './index.js';

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
