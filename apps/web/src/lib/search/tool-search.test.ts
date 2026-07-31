import { describe, expect, it } from 'vitest';
import { buildToolSearchWhere, scoreTools, type ToolWithPackage, toolIdOf } from './tool-search';

/**
 * Build a minimal ToolWithPackage fixture. Only the fields the ranker reads are
 * set; the rest are cast away so tests stay focused on ranking behaviour.
 */
function tool(
  overrides: {
    name?: string;
    description?: string;
    tags?: string[];
    qualityScore?: number | null;
    importHealth?: 'HEALTHY' | 'BROKEN' | 'UNKNOWN' | null;
    executionHealth?: 'HEALTHY' | 'BROKEN' | 'UNKNOWN' | null;
    npmPackageName?: string;
    npmDescription?: string | null;
    npmKeywords?: string[];
    npmDownloadsLastMonth?: number | null;
  } = {}
): ToolWithPackage {
  return {
    name: overrides.name ?? 'someTool',
    description: overrides.description ?? 'A generic tool',
    tags: overrides.tags ?? [],
    qualityScore: overrides.qualityScore ?? 0.5,
    importHealth: overrides.importHealth ?? 'HEALTHY',
    executionHealth: overrides.executionHealth ?? 'HEALTHY',
    inputSchema: {},
    package: {
      npmPackageName: overrides.npmPackageName ?? '@tpmjs/tools-generic',
      npmDescription: overrides.npmDescription ?? 'A generic package',
      npmKeywords: overrides.npmKeywords ?? [],
      npmDownloadsLastMonth: overrides.npmDownloadsLastMonth ?? 0,
      category: 'data',
      npmVersion: '1.0.0',
    },
  } as unknown as ToolWithPackage;
}

describe('scoreTools — unified registry ranking', () => {
  it('matches a keyword found only in the package description (the "pdf" bug)', () => {
    // Reproduces the live discrepancy: pandoc's tool name/description do not
    // contain "pdf" — only the PACKAGE description does. The old MCP search
    // ignored that field and returned 0; the shared ranker must find it.
    const pandoc = tool({
      name: 'convert',
      description: 'Convert a document between formats.',
      npmPackageName: '@tpmjs/tools-pandoc',
      npmDescription:
        'Pandoc document conversion tools for AI agents. Convert between Markdown, HTML, LaTeX, DOCX, PDF, and dozens more formats.',
    });
    // qualityScore 0 so it contributes no score without a textual match — in
    // production the DB prefilter (buildToolSearchWhere) would exclude it too.
    const unrelated = tool({
      name: 'greet',
      description: 'Say hello',
      npmDescription: 'A greeter',
      qualityScore: 0,
    });

    const results = scoreTools([pandoc, unrelated], 'pdf');

    expect(results).toHaveLength(1);
    expect(results[0]?.tool.name).toBe('convert');
  });

  it('matches a keyword found only in npm keywords', () => {
    const withKeyword = tool({
      name: 'sendMessage',
      description: 'Send a message somewhere.',
      npmDescription: 'A messaging package',
      npmKeywords: ['email', 'smtp'],
    });
    const results = scoreTools([withKeyword], 'email');
    expect(results).toHaveLength(1);
    expect(results[0]?.tool.name).toBe('sendMessage');
  });

  it('demotes broken tools below every healthy match regardless of relevance', () => {
    // The broken tool is a far stronger textual match, yet must rank last.
    const brokenStrong = tool({
      name: 'emailSender',
      description: 'email email email email',
      npmDescription: 'email email',
      importHealth: 'BROKEN',
    });
    const healthyWeak = tool({
      name: 'notifier',
      description: 'Occasionally sends an email notification.',
      npmDescription: 'notifications',
      importHealth: 'HEALTHY',
    });

    const results = scoreTools([brokenStrong, healthyWeak], 'email');

    expect(results).toHaveLength(2);
    expect(results[0]?.tool.name).toBe('notifier');
    expect(results[results.length - 1]?.tool.name).toBe('emailSender');
  });

  it('gives an exact tool-name match the top slot', () => {
    const exact = tool({ name: 'base64Encode', description: 'unrelated words' });
    const partial = tool({ name: 'encoder', description: 'base64 helper', npmPackageName: '@x/y' });
    const results = scoreTools([partial, exact], 'base64Encode');
    expect(results[0]?.tool.name).toBe('base64Encode');
  });

  it('returns an empty list for no candidates', () => {
    expect(scoreTools([], 'anything')).toEqual([]);
  });

  it('folds context messages into the ranking query', () => {
    const t = tool({
      name: 'invoiceTool',
      description: 'Generate an invoice',
      npmDescription: 'x',
    });
    // Query alone is empty-ish; the context supplies the matching term.
    const results = scoreTools([t], '', ['I need to create an invoice']);
    expect(results).toHaveLength(1);
  });
});

describe('buildToolSearchWhere — candidate prefilter', () => {
  it('always includes the package description clause (the field MCP used to omit)', () => {
    const where = buildToolSearchWhere({ query: 'pdf' });
    const orClauses = (where.OR ?? []) as Array<Record<string, unknown>>;
    const hasPackageDescription = orClauses.some((clause) => {
      const pkg = clause.package as { npmDescription?: unknown } | undefined;
      return pkg?.npmDescription !== undefined;
    });
    expect(hasPackageDescription).toBe(true);
  });

  it('keeps chronically broken tools in the candidate pool (activeToolFilter, not quarantine)', () => {
    const where = buildToolSearchWhere({ query: 'pdf' });
    // activeToolFilter → { isActive: true } only. The quarantine filter would
    // add consecutiveImportFailures; asserting its absence guarantees broken
    // tools remain findable (they are demoted at ranking time instead).
    expect(where.isActive).toBe(true);
    expect(where).not.toHaveProperty('consecutiveImportFailures');
  });

  it('applies category and excludeIds constraints', () => {
    const where = buildToolSearchWhere({ query: 'pdf', category: 'api', excludeIds: ['a', 'b'] });
    expect(where.package).toEqual({ category: 'api' });
    expect(where.id).toEqual({ notIn: ['a', 'b'] });
  });

  it('omits the OR clause when the query has no usable tokens', () => {
    const where = buildToolSearchWhere({ query: 'a' }); // single char < MIN_TOKEN_LENGTH
    expect(where.OR).toBeUndefined();
  });
});

describe('toolIdOf', () => {
  it('builds the canonical package::export id', () => {
    expect(toolIdOf(tool({ name: 'convert', npmPackageName: '@tpmjs/tools-pandoc' }))).toBe(
      '@tpmjs/tools-pandoc::convert'
    );
  });
});
