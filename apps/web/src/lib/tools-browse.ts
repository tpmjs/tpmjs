/**
 * Browse-index data + ordering engine for `/tools`.
 *
 * This is the registry's first-class, crawlable catalogue surface (as opposed to
 * `/tool/tool-search`, which is the interactive client search). It renders on the
 * server from URL search params so every page, category facet, and sort order is
 * a real, indexable URL.
 *
 * Ordering policy is *identical* to the discovery/search surface: chronically
 * broken tools are never delisted — they are demoted below every healthy tool
 * (see {@link ~/lib/tool-health-policy}) and labelled honestly. Within a health
 * tier the chosen sort criterion applies.
 *
 * The pure functions here (param parsing, ordering, pagination, faceting, href
 * building) are unit-tested in `tools-browse.test.ts`; {@link getBrowseData} is
 * the thin, ISR-cached Prisma shell that assembles the active tool set once per
 * revalidation window and delegates every decision to them.
 */

import { type Prisma, prisma } from '@tpmjs/db';
import { unstable_cache } from 'next/cache';
import type { HealthStatus } from '~/lib/discovery/types';
import { activeToolFilter, isToolBroken } from '~/lib/tool-health-policy';

/** Tools per page. Small enough to render fast, large enough to feel like a catalogue. */
export const TOOLS_PAGE_SIZE = 30;
/** Refresh the cached active-tool snapshot at most this often (seconds). */
export const TOOLS_REVALIDATE_SECONDS = 900;

export type BrowseSort = 'quality' | 'downloads' | 'recent' | 'name';

/** All selectable sort orders, in display order. */
export const BROWSE_SORTS = ['quality', 'downloads', 'recent', 'name'] as const;

/** Default sort — top quality first (healthy tools always precede broken ones). */
export const DEFAULT_BROWSE_SORT: BrowseSort = 'quality';

export const BROWSE_SORT_LABELS: Record<BrowseSort, string> = {
  quality: 'Top quality',
  downloads: 'Most downloaded',
  recent: 'Recently added',
  name: 'Name (A–Z)',
};

/** A serialized, render-ready tool for the browse grid. */
export interface BrowseTool {
  id: string;
  /** The raw tool export name (e.g. "default", "scrapeTool"). */
  name: string;
  /** Human display name — falls back to the package name for `default` exports. */
  displayName: string;
  description: string;
  packageName: string;
  npmVersion: string | null;
  category: string;
  isOfficial: boolean;
  /** 0–1, or null when the tool has no computed quality score. */
  qualityScore: number | null;
  downloads: number;
  likeCount: number;
  importHealth: HealthStatus | null;
  executionHealth: HealthStatus | null;
  consecutiveImportFailures: number;
  lastHealthCheck: string | null;
  createdAt: string;
  /** Derived once via the shared health policy so ordering + display agree. */
  isBroken: boolean;
}

/** A category chip with its active-tool count. */
export interface CategoryFacet {
  category: string;
  count: number;
}

/** Normalized, validated request state driving one browse render. */
export interface BrowseParams {
  page: number;
  category: string | null;
  sort: BrowseSort;
}

export interface BrowseData {
  params: BrowseParams;
  /** The current page slice. */
  tools: BrowseTool[];
  /** Every category (over the full active set) with counts, ranked by count. */
  facets: CategoryFacet[];
  page: number;
  totalPages: number;
  /** Tools matching the active category filter (drives pagination). */
  totalInScope: number;
  /** All active tools in the registry. */
  totalActive: number;
  /** Distinct packages in the registry. */
  totalPackages: number;
  /** Broken tools within the current scope (shown honestly in the header). */
  brokenInScope: number;
  pageSize: number;
}

// ---------------------------------------------------------------------------
// Pure helpers (unit-tested)
// ---------------------------------------------------------------------------

/** Next passes `string | string[] | undefined`; take the first usable value. */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Coerce an arbitrary sort param to a known {@link BrowseSort}. */
export function normalizeSort(value: string | null | undefined): BrowseSort {
  return (BROWSE_SORTS as readonly string[]).includes(value ?? '')
    ? (value as BrowseSort)
    : DEFAULT_BROWSE_SORT;
}

/** Parse a 1-based page param, clamping junk/negatives to page 1. */
export function parsePageParam(value: string | null | undefined): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
}

/** Accept a category only when it exists in the live facet set; else "all" (null). */
export function sanitizeCategory(
  value: string | null | undefined,
  known: ReadonlySet<string>
): string | null {
  const trimmed = value?.trim();
  return trimmed && known.has(trimmed) ? trimmed : null;
}

export function parseBrowseParams(
  raw: { page?: string; category?: string; sort?: string },
  known: ReadonlySet<string>
): BrowseParams {
  return {
    page: parsePageParam(raw.page),
    category: sanitizeCategory(raw.category, known),
    sort: normalizeSort(raw.sort),
  };
}

/** Health ranking tier: healthy/unknown share tier 0, broken sinks to tier 1. */
export function browseHealthTier(tool: Pick<BrowseTool, 'isBroken'>): 0 | 1 {
  return tool.isBroken ? 1 : 0;
}

type BrowseComparator = (a: BrowseTool, b: BrowseTool) => number;

const byName: BrowseComparator = (a, b) =>
  a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' });
const byDownloads: BrowseComparator = (a, b) => b.downloads - a.downloads;
const byQuality: BrowseComparator = (a, b) => (b.qualityScore ?? -1) - (a.qualityScore ?? -1);
// ISO 8601 timestamps sort lexicographically, so newest-first is a string compare.
const byRecent: BrowseComparator = (a, b) => b.createdAt.localeCompare(a.createdAt);

const SORT_COMPARATORS: Record<BrowseSort, BrowseComparator[]> = {
  quality: [byQuality, byDownloads, byName],
  downloads: [byDownloads, byQuality, byName],
  recent: [byRecent, byName],
  name: [byName, byDownloads],
};

/**
 * Comparator for the browse grid: broken tools demoted below every healthy tool
 * (policy-consistent with search), then the chosen sort criterion, then a stable
 * id tiebreak so pages never shuffle between identical renders.
 */
export function compareBrowseTools(sort: BrowseSort): BrowseComparator {
  const chain = SORT_COMPARATORS[sort];
  return (a, b) => {
    const tierDiff = browseHealthTier(a) - browseHealthTier(b);
    if (tierDiff !== 0) return tierDiff;
    for (const cmp of chain) {
      const result = cmp(a, b);
      if (result !== 0) return result;
    }
    return a.id.localeCompare(b.id);
  };
}

/** Return a new, ordered array (healthy-first, then `sort`). */
export function sortBrowseTools(tools: BrowseTool[], sort: BrowseSort): BrowseTool[] {
  return [...tools].sort(compareBrowseTools(sort));
}

export interface Paged<T> {
  items: T[];
  page: number;
  totalPages: number;
  total: number;
}

/** Slice `items` for a 1-based page, clamping an out-of-range page into range. */
export function paginate<T>(items: T[], page: number, pageSize: number): Paged<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const start = (clampedPage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: clampedPage,
    totalPages,
    total,
  };
}

/** Count active tools per category, ranked by count desc then name asc. */
export function computeFacets(tools: BrowseTool[]): CategoryFacet[] {
  const counts = new Map<string, number>();
  for (const tool of tools) {
    counts.set(tool.category, (counts.get(tool.category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
}

/**
 * Build a crawlable `/tools` URL. Defaults (all categories, quality sort, page 1)
 * are omitted so the canonical listing stays a single clean URL.
 */
export function buildToolsHref(
  params: { category?: string | null; sort?: BrowseSort; page?: number } = {}
): string {
  const qs = new URLSearchParams();
  if (params.category) qs.set('category', params.category);
  if (params.sort && params.sort !== DEFAULT_BROWSE_SORT) qs.set('sort', params.sort);
  if (params.page && params.page > 1) qs.set('page', String(params.page));
  const query = qs.toString();
  return query ? `/tools?${query}` : '/tools';
}

/** Consistent, non-brittle category label (mirrors the search UI's convention). */
export function formatCategoryLabel(category: string): string {
  if (!category) return category;
  return category.charAt(0).toUpperCase() + category.slice(1);
}

// ---------------------------------------------------------------------------
// Prisma shell (ISR-cached)
// ---------------------------------------------------------------------------

const browseToolSelect = {
  id: true,
  name: true,
  description: true,
  qualityScore: true,
  likeCount: true,
  importHealth: true,
  executionHealth: true,
  consecutiveImportFailures: true,
  lastHealthCheck: true,
  createdAt: true,
  package: {
    select: {
      npmPackageName: true,
      npmVersion: true,
      category: true,
      isOfficial: true,
      npmDownloadsLastMonth: true,
    },
  },
} satisfies Prisma.ToolSelect;

type BrowseToolRow = Prisma.ToolGetPayload<{ select: typeof browseToolSelect }>;

function serializeBrowseTool(row: BrowseToolRow): BrowseTool {
  const isBroken = isToolBroken({
    importHealth: row.importHealth,
    executionHealth: row.executionHealth,
  });
  return {
    id: row.id,
    name: row.name,
    displayName: row.name !== 'default' ? row.name : row.package.npmPackageName,
    description: row.description,
    packageName: row.package.npmPackageName,
    npmVersion: row.package.npmVersion ?? null,
    category: row.package.category,
    isOfficial: row.package.isOfficial,
    qualityScore: row.qualityScore == null ? null : Number(row.qualityScore),
    downloads: row.package.npmDownloadsLastMonth ?? 0,
    likeCount: row.likeCount,
    importHealth: row.importHealth,
    executionHealth: row.executionHealth,
    consecutiveImportFailures: row.consecutiveImportFailures,
    lastHealthCheck: row.lastHealthCheck?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    isBroken,
  };
}

/**
 * Load every active tool (broken tools included, per policy). The full set is
 * small enough to rank + facet in memory on each request, so the ordering
 * decisions stay in the pure, tested helpers above.
 */
async function fetchActiveBrowseTools(): Promise<BrowseTool[]> {
  const rows = await prisma.tool.findMany({
    where: activeToolFilter(),
    select: browseToolSelect,
  });
  return rows.map(serializeBrowseTool);
}

/**
 * ISR-cached snapshot of the active tool set. A browse page is dynamic (its
 * URL carries facet/sort/page state), so route-level static ISR does not apply;
 * this data cache instead bounds DB pressure to ~one query per revalidation
 * window regardless of how many distinct URLs are crawled.
 */
const getCachedBrowseTools = unstable_cache(fetchActiveBrowseTools, ['tools-browse-active-v1'], {
  revalidate: TOOLS_REVALIDATE_SECONDS,
  tags: ['tools-browse'],
});

/** Assemble one browse render from validated params + the cached tool set. */
export async function getBrowseData(rawSearchParams: {
  page?: string | string[];
  category?: string | string[];
  sort?: string | string[];
}): Promise<BrowseData> {
  const all = await getCachedBrowseTools();
  const facets = computeFacets(all);
  const knownCategories = new Set(facets.map((facet) => facet.category));

  const params = parseBrowseParams(
    {
      page: firstParam(rawSearchParams.page),
      category: firstParam(rawSearchParams.category),
      sort: firstParam(rawSearchParams.sort),
    },
    knownCategories
  );

  const scoped = params.category ? all.filter((tool) => tool.category === params.category) : all;
  const sorted = sortBrowseTools(scoped, params.sort);
  const paged = paginate(sorted, params.page, TOOLS_PAGE_SIZE);

  const totalPackages = new Set(all.map((tool) => tool.packageName)).size;
  const brokenInScope = scoped.reduce((count, tool) => count + (tool.isBroken ? 1 : 0), 0);

  return {
    params: { ...params, page: paged.page },
    tools: paged.items,
    facets,
    page: paged.page,
    totalPages: paged.totalPages,
    totalInScope: paged.total,
    totalActive: all.length,
    totalPackages,
    brokenInScope,
    pageSize: TOOLS_PAGE_SIZE,
  };
}
