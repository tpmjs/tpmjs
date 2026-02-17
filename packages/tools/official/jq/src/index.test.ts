import { assertValidTool } from '@tpmjs/tool-test-utils';
import { describe, expect, it } from 'vitest';
import { format, query } from './index.js';

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
