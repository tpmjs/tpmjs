import { describe, expect, it } from 'vitest';
import type { ListExportsResult } from '~/lib/schema-extraction';
import {
  type ExistingToolHealth,
  isPhantomExport,
  pickReconciliationTarget,
  reconcileDeclaredToolNames,
} from './reconcile-tool-names';

const brokenMissingExport: ExistingToolHealth = {
  importHealth: 'BROKEN',
  healthCheckError: 'TOOL_NOT_FOUND: Export "recipeHash" not found in module',
};

function exportsOf(
  packageName: string,
  version: string,
  exports: string[],
  validTools: string[]
): () => Promise<ListExportsResult> {
  return async () => ({
    success: true,
    packageName,
    version,
    exports,
    tools: exports.map((name) => ({ name, isValidTool: validTools.includes(name) })),
  });
}

describe('isPhantomExport', () => {
  it('flags a BROKEN row whose export is absent from the module', () => {
    expect(isPhantomExport(brokenMissingExport)).toBe(true);
  });

  it('ignores a missing row', () => {
    expect(isPhantomExport(undefined)).toBe(false);
  });

  it('ignores a BROKEN row failing for any other reason', () => {
    expect(
      isPhantomExport({
        importHealth: 'BROKEN',
        healthCheckError: 'SCHEMA_UNAVAILABLE: no valid inputSchema',
      })
    ).toBe(false);
  });

  it('ignores a healthy row', () => {
    expect(isPhantomExport({ importHealth: 'HEALTHY', healthCheckError: null })).toBe(false);
  });
});

describe('pickReconciliationTarget', () => {
  it('prefers an exact name-plus-Tool export', () => {
    expect(pickReconciliationTarget('recipeHash', ['default', 'recipeHashTool'])).toBe(
      'recipeHashTool'
    );
  });

  it('falls back to a single case-insensitive substring match', () => {
    expect(pickReconciliationTarget('search', ['youSearchTool'])).toBe('youSearchTool');
  });

  it('uses the sole valid tool when there is exactly one', () => {
    expect(pickReconciliationTarget('somethingElse', ['theOnlyTool'])).toBe('theOnlyTool');
  });

  it('refuses to guess between multiple ambiguous exports', () => {
    expect(pickReconciliationTarget('unrelated', ['fooTool', 'barTool'])).toBeNull();
  });

  it('returns null when the package exposes no valid tools', () => {
    expect(pickReconciliationTarget('recipeHash', [])).toBeNull();
  });
});

describe('reconcileDeclaredToolNames', () => {
  it('re-points a phantom declared name to the real exported tool', async () => {
    const result = await reconcileDeclaredToolNames({
      packageName: '@tpmjs/tools-recipe-hash',
      version: '0.2.0',
      env: null,
      declaredTools: [
        { name: 'recipeHash', description: 'hash a recipe', parameters: [{ name: 'recipe' }] },
      ],
      existingByName: new Map([['recipeHash', brokenMissingExport]]),
      listExports: exportsOf(
        '@tpmjs/tools-recipe-hash',
        '0.2.0',
        ['default', 'recipeHashTool'],
        ['recipeHashTool']
      ),
    });

    expect(result.reconciled).toEqual([{ from: 'recipeHash', to: 'recipeHashTool' }]);
    expect(result.tools).toHaveLength(1);
    expect(result.tools[0]?.name).toBe('recipeHashTool');
    // Stale manifest parameters are dropped so the executor extracts the real schema.
    expect(result.tools[0]?.parameters).toBeUndefined();
    // Non-name metadata is preserved.
    expect(result.tools[0]?.description).toBe('hash a recipe');
  });

  it('never consults the executor when no declared name is a phantom', async () => {
    let called = false;
    const listExports = (async () => {
      called = true;
      return { success: false as const, error: 'should not be called' };
    }) as unknown as typeof import('~/lib/schema-extraction').listToolExports;

    const declared = [{ name: 'healthyTool', description: 'fine' }];
    const result = await reconcileDeclaredToolNames({
      packageName: 'pkg',
      version: '1.0.0',
      env: null,
      declaredTools: declared,
      existingByName: new Map([
        ['healthyTool', { importHealth: 'HEALTHY', healthCheckError: null }],
      ]),
      listExports,
    });

    expect(called).toBe(false);
    expect(result.reconciled).toEqual([]);
    expect(result.tools).toBe(declared);
  });

  it('leaves a declared name untouched when it already resolves to a real export', async () => {
    const result = await reconcileDeclaredToolNames({
      packageName: 'pkg',
      version: '1.0.0',
      env: null,
      // One phantom forces the executor lookup; the real export must survive.
      declaredTools: [
        { name: 'realTool', description: 'real' },
        { name: 'ghostTool', description: 'ghost' },
      ],
      existingByName: new Map<string, ExistingToolHealth>([
        ['realTool', { importHealth: 'HEALTHY', healthCheckError: null }],
        [
          'ghostTool',
          { importHealth: 'BROKEN', healthCheckError: 'Export "ghostTool" not found in module' },
        ],
      ]),
      listExports: exportsOf(
        'pkg',
        '1.0.0',
        ['realTool', 'ghostToolActual'],
        ['realTool', 'ghostToolActual']
      ),
    });

    expect(result.tools.find((t) => t.description === 'real')?.name).toBe('realTool');
    // ghostTool -> only remaining unclaimed valid tool
    expect(result.reconciled).toEqual([{ from: 'ghostTool', to: 'ghostToolActual' }]);
  });

  it('leaves the row untouched when the executor lookup fails', async () => {
    const declared = [{ name: 'recipeHash', description: 'hash' }];
    const result = await reconcileDeclaredToolNames({
      packageName: 'pkg',
      version: '1.0.0',
      env: null,
      declaredTools: declared,
      existingByName: new Map([['recipeHash', brokenMissingExport]]),
      listExports: async () => ({ success: false, error: 'executor down' }),
    });

    expect(result.reconciled).toEqual([]);
    expect(result.tools[0]?.name).toBe('recipeHash');
  });
});
