import { describe, expect, it } from 'vitest';
import {
  type BrowseTool,
  buildToolsHref,
  compareBrowseTools,
  computeFacets,
  DEFAULT_BROWSE_SORT,
  firstParam,
  formatCategoryLabel,
  normalizeSort,
  paginate,
  parseBrowseParams,
  parsePageParam,
  sanitizeCategory,
  sortBrowseTools,
} from './tools-browse';

function tool(overrides: Partial<BrowseTool> = {}): BrowseTool {
  return {
    id: 'id-default',
    name: 'toolName',
    displayName: 'toolName',
    description: 'A tool',
    packageName: '@scope/pkg',
    npmVersion: '1.0.0',
    category: 'data',
    isOfficial: false,
    qualityScore: 0.5,
    downloads: 0,
    likeCount: 0,
    importHealth: 'HEALTHY',
    executionHealth: 'HEALTHY',
    consecutiveImportFailures: 0,
    lastHealthCheck: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    isBroken: false,
    ...overrides,
  };
}

describe('firstParam', () => {
  it('returns the value for a scalar', () => {
    expect(firstParam('x')).toBe('x');
  });
  it('returns the first element for an array', () => {
    expect(firstParam(['a', 'b'])).toBe('a');
  });
  it('returns undefined for undefined', () => {
    expect(firstParam(undefined)).toBeUndefined();
  });
});

describe('normalizeSort', () => {
  it('accepts known sorts', () => {
    expect(normalizeSort('downloads')).toBe('downloads');
    expect(normalizeSort('recent')).toBe('recent');
    expect(normalizeSort('name')).toBe('name');
    expect(normalizeSort('quality')).toBe('quality');
  });
  it('falls back to the default for unknown/empty', () => {
    expect(normalizeSort('bogus')).toBe(DEFAULT_BROWSE_SORT);
    expect(normalizeSort(undefined)).toBe(DEFAULT_BROWSE_SORT);
    expect(normalizeSort(null)).toBe(DEFAULT_BROWSE_SORT);
  });
});

describe('parsePageParam', () => {
  it('parses positive integers', () => {
    expect(parsePageParam('3')).toBe(3);
  });
  it('clamps junk, zero, and negatives to 1', () => {
    expect(parsePageParam('0')).toBe(1);
    expect(parsePageParam('-4')).toBe(1);
    expect(parsePageParam('abc')).toBe(1);
    expect(parsePageParam(undefined)).toBe(1);
  });
});

describe('sanitizeCategory', () => {
  const known = new Set(['data', 'ops', 'ai-ml']);
  it('accepts a known category', () => {
    expect(sanitizeCategory('data', known)).toBe('data');
    expect(sanitizeCategory('  ops  ', known)).toBe('ops');
  });
  it('rejects unknown categories', () => {
    expect(sanitizeCategory('nope', known)).toBeNull();
    expect(sanitizeCategory('', known)).toBeNull();
    expect(sanitizeCategory(undefined, known)).toBeNull();
  });
});

describe('parseBrowseParams', () => {
  it('combines validated params', () => {
    const known = new Set(['data']);
    expect(parseBrowseParams({ page: '2', category: 'data', sort: 'downloads' }, known)).toEqual({
      page: 2,
      category: 'data',
      sort: 'downloads',
    });
  });
  it('drops an unknown category and bad sort/page', () => {
    const known = new Set(['data']);
    expect(parseBrowseParams({ page: 'x', category: 'xyz', sort: 'bad' }, known)).toEqual({
      page: 1,
      category: null,
      sort: DEFAULT_BROWSE_SORT,
    });
  });
});

describe('sortBrowseTools — health tier + criteria', () => {
  it('demotes broken tools below every healthy tool regardless of sort', () => {
    const healthyLow = tool({ id: 'h', qualityScore: 0.1, downloads: 1 });
    const brokenHigh = tool({
      id: 'b',
      qualityScore: 0.99,
      downloads: 10_000,
      isBroken: true,
      importHealth: 'BROKEN',
      executionHealth: 'UNKNOWN',
    });
    const byQuality = sortBrowseTools([brokenHigh, healthyLow], 'quality');
    expect(byQuality.map((t) => t.id)).toEqual(['h', 'b']);
    const byDownloads = sortBrowseTools([brokenHigh, healthyLow], 'downloads');
    expect(byDownloads.map((t) => t.id)).toEqual(['h', 'b']);
  });

  it('orders by quality then downloads within a tier', () => {
    const a = tool({ id: 'a', qualityScore: 0.9, downloads: 5 });
    const b = tool({ id: 'b', qualityScore: 0.9, downloads: 50 });
    const c = tool({ id: 'c', qualityScore: 0.4, downloads: 999 });
    expect(sortBrowseTools([a, b, c], 'quality').map((t) => t.id)).toEqual(['b', 'a', 'c']);
  });

  it('treats a null quality score as lowest', () => {
    const withScore = tool({ id: 'a', qualityScore: 0.01 });
    const noScore = tool({ id: 'b', qualityScore: null });
    expect(sortBrowseTools([noScore, withScore], 'quality').map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('sorts by name (case-insensitive) and by recency', () => {
    const zebra = tool({ id: 'z', displayName: 'zebra', createdAt: '2026-01-01T00:00:00.000Z' });
    const apple = tool({ id: 'a', displayName: 'Apple', createdAt: '2026-05-01T00:00:00.000Z' });
    expect(sortBrowseTools([zebra, apple], 'name').map((t) => t.id)).toEqual(['a', 'z']);
    expect(sortBrowseTools([zebra, apple], 'recent').map((t) => t.id)).toEqual(['a', 'z']);
  });

  it('is stable via id tiebreak for otherwise-equal tools', () => {
    const a = tool({ id: 'aaa', displayName: 'same', qualityScore: 0.5, downloads: 1 });
    const b = tool({ id: 'bbb', displayName: 'same', qualityScore: 0.5, downloads: 1 });
    expect(sortBrowseTools([b, a], 'quality').map((t) => t.id)).toEqual(['aaa', 'bbb']);
  });

  it('does not mutate the input array', () => {
    const input = [tool({ id: 'a' }), tool({ id: 'b', isBroken: true, importHealth: 'BROKEN' })];
    const snapshot = input.map((t) => t.id);
    sortBrowseTools(input, 'quality');
    expect(input.map((t) => t.id)).toEqual(snapshot);
  });
});

describe('compareBrowseTools', () => {
  it('returns a comparator usable directly', () => {
    const cmp = compareBrowseTools('downloads');
    const a = tool({ id: 'a', downloads: 10 });
    const b = tool({ id: 'b', downloads: 20 });
    expect(cmp(a, b)).toBeGreaterThan(0);
    expect(cmp(b, a)).toBeLessThan(0);
  });
});

describe('paginate', () => {
  const items = Array.from({ length: 65 }, (_, i) => i);
  it('slices a middle page', () => {
    const page2 = paginate(items, 2, 30);
    expect(page2.items).toEqual(Array.from({ length: 30 }, (_, i) => i + 30));
    expect(page2.page).toBe(2);
    expect(page2.totalPages).toBe(3);
    expect(page2.total).toBe(65);
  });
  it('returns the remainder on the last page', () => {
    expect(paginate(items, 3, 30).items).toEqual([60, 61, 62, 63, 64]);
  });
  it('clamps an over-range page to the last page', () => {
    expect(paginate(items, 99, 30).page).toBe(3);
  });
  it('handles an empty list as a single page', () => {
    const empty = paginate<number>([], 1, 30);
    expect(empty.totalPages).toBe(1);
    expect(empty.items).toEqual([]);
    expect(empty.total).toBe(0);
  });
});

describe('computeFacets', () => {
  it('counts by category and ranks by count then name', () => {
    const tools = [
      tool({ category: 'ops' }),
      tool({ category: 'ops' }),
      tool({ category: 'data' }),
      tool({ category: 'agent' }),
      tool({ category: 'agent' }),
    ];
    expect(computeFacets(tools)).toEqual([
      { category: 'agent', count: 2 },
      { category: 'ops', count: 2 },
      { category: 'data', count: 1 },
    ]);
  });
  it('returns an empty list for no tools', () => {
    expect(computeFacets([])).toEqual([]);
  });
});

describe('buildToolsHref', () => {
  it('omits every default', () => {
    expect(buildToolsHref()).toBe('/tools');
    expect(buildToolsHref({ sort: DEFAULT_BROWSE_SORT, page: 1, category: null })).toBe('/tools');
  });
  it('encodes category, non-default sort, and page > 1 in a stable order', () => {
    expect(buildToolsHref({ category: 'data', sort: 'downloads', page: 2 })).toBe(
      '/tools?category=data&sort=downloads&page=2'
    );
  });
  it('keeps a lone category or lone page clean', () => {
    expect(buildToolsHref({ category: 'ai-ml' })).toBe('/tools?category=ai-ml');
    expect(buildToolsHref({ page: 3 })).toBe('/tools?page=3');
  });
});

describe('formatCategoryLabel', () => {
  it('capitalizes the first letter', () => {
    expect(formatCategoryLabel('data')).toBe('Data');
    expect(formatCategoryLabel('ai-ml')).toBe('Ai-ml');
  });
  it('passes through empty', () => {
    expect(formatCategoryLabel('')).toBe('');
  });
});
