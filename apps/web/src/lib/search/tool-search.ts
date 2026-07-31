/**
 * Unified registry tool search — the single source of truth for ranking tools
 * by a keyword query.
 *
 * BOTH the REST search endpoint (`/api/tools/search`) and the registry MCP
 * meta-tool (`search_tools` in `/api/mcp/registry/[transport]`) call
 * {@link searchTools} so their results can never diverge again. Before this
 * module existed the two surfaces used different field sets — the MCP search
 * ignored the package `npmDescription` and `npmKeywords`, so a query like "pdf"
 * (which only appears in the pandoc package description) returned 0 tools over
 * MCP while REST returned 3.
 *
 * Behaviour (a superset of the historical REST search):
 *  - Candidate prefilter (`activeToolFilter`) keeps chronically broken tools in
 *    the pool — an exact-name search must still find its tool — and matches over
 *    tool name/description, package name AND package description, plus per-token
 *    name/description for partial matches.
 *  - Relevance = BM25 over name + description + package name + package
 *    description + npm keywords + tags, boosted by quality, downloads, exact tool
 *    name, package name, and tag matches.
 *  - Ordering demotes broken tools below every healthy match (never delisted)
 *    via {@link compareSearchHits}, so agents don't pick a broken tool.
 *
 * {@link searchTools} returns EVERY matching candidate (score > 0), health
 * ordered; callers slice to their own limit and format to their own response
 * shape. {@link scoreTools} is the pure, DB-free ranking core (unit tested).
 */

import { type Prisma, prisma } from '@tpmjs/db';
import { activeToolFilter, compareSearchHits } from '~/lib/tool-health-policy';
import { calculateBM25, hasExactNameMatch, hasPackageNameMatch, tokenize } from './bm25';

/** A registry tool row with its package joined — the unit both callers rank. */
export type ToolWithPackage = Prisma.ToolGetPayload<{ include: { package: true } }>;

/** One scored search hit. */
export interface ScoredTool {
  tool: ToolWithPackage;
  score: number;
}

export interface SearchToolsOptions {
  query: string;
  /** Restrict to a single package category (e.g. "api", "storage"). */
  category?: string | null;
  /** Restrict to tools carrying an exact tag. */
  tag?: string | null;
  /** Tool ids to drop from the candidate set (e.g. items already collected). */
  excludeIds?: string[];
  /** Extra free-text context folded into the ranking query (e.g. chat turns). */
  contextMessages?: string[];
  /** Max candidate rows pulled from the DB for scoring. */
  candidateLimit?: number;
}

/** Default candidate ceiling for BM25 scoring when a query is present. */
export const DEFAULT_CANDIDATE_LIMIT = 500;
/** Candidate ceiling with no query — a small quality-ordered slice. */
const NO_QUERY_LIMIT = 100;
/** Minimum token length considered for DB pre-filtering. */
const MIN_TOKEN_LENGTH = 2;

/**
 * Build the Prisma `where` for the candidate prefilter. Exported for unit tests
 * so we can assert the package-description field is always included.
 */
export function buildToolSearchWhere(options: SearchToolsOptions): Prisma.ToolWhereInput {
  const query = options.query ?? '';
  const searchTokens = tokenize(query).filter((t) => t.length >= MIN_TOKEN_LENGTH);
  const hasSearchQuery = searchTokens.length > 0;
  const excludeIds = options.excludeIds ?? [];

  return {
    ...activeToolFilter(),
    ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
    ...(options.category ? { package: { category: options.category } } : {}),
    ...(options.tag ? { tags: { has: options.tag } } : {}),
    ...(hasSearchQuery
      ? {
          OR: [
            // Whole-query contains over each searchable field.
            { name: { contains: query, mode: 'insensitive' as const } },
            { description: { contains: query, mode: 'insensitive' as const } },
            { package: { npmPackageName: { contains: query, mode: 'insensitive' as const } } },
            // Package description — the field the MCP search used to omit, which
            // is why "pdf" (only in the pandoc package description) found nothing.
            { package: { npmDescription: { contains: query, mode: 'insensitive' as const } } },
            // Per-token partial matches (bounded so the OR stays cheap).
            ...searchTokens
              .slice(0, 3)
              .flatMap((token) => [
                { name: { contains: token, mode: 'insensitive' as const } },
                { description: { contains: token, mode: 'insensitive' as const } },
              ]),
          ],
        }
      : {}),
  };
}

/** +5 per query token that exactly matches one of the tool's tags. */
function tagBoostFor(tool: ToolWithPackage, queryTokens: string[]): number {
  if (!tool.tags || tool.tags.length === 0) return 0;
  let boost = 0;
  for (const token of queryTokens) {
    if (tool.tags.includes(token)) boost += 5;
  }
  return boost;
}

/**
 * Pure BM25 + boost + health-aware ranking over an already-fetched candidate
 * set. No database access — unit tested directly.
 */
export function scoreTools(
  tools: ToolWithPackage[],
  query: string,
  contextMessages: string[] = []
): ScoredTool[] {
  if (tools.length === 0) return [];

  // Fold optional context (e.g. recent chat turns) into the ranking query.
  const fullQuery = [query, ...contextMessages].filter(Boolean).join(' ');

  // The BM25 document deliberately includes the package description and npm
  // keywords so keyword-in-description queries (e.g. "pdf") rank.
  const documents = tools.map((tool) => ({
    tool,
    text: [
      tool.description,
      tool.name,
      tool.package.npmPackageName,
      tool.package.npmDescription || '',
      ...(tool.package.npmKeywords || []),
      ...(tool.tags || []),
    ].join(' '),
  }));

  // Document frequencies (IDF) over the full ranking query.
  const docFrequencies = new Map<string, number>();
  const queryTokens = tokenize(fullQuery);
  for (const term of queryTokens) {
    let count = 0;
    for (const doc of documents) {
      if (tokenize(doc.text).includes(term)) count++;
    }
    docFrequencies.set(term, count);
  }

  const totalTokens = documents.reduce((sum, doc) => sum + tokenize(doc.text).length, 0);
  const avgDocLength = documents.length > 0 ? totalTokens / documents.length : 0;

  const scored = documents.map(({ tool, text }) => {
    const bm25Score = calculateBM25(fullQuery, text, avgDocLength, tools.length, docFrequencies);
    const qualityBoost = Number(tool.qualityScore ?? 0) * 0.5;
    const downloadBoost = Math.log10((tool.package.npmDownloadsLastMonth || 0) + 1) * 0.1;
    // Massive boost when the user names the tool exactly.
    const exactNameBoost = hasExactNameMatch(query, tool.name) ? 100 : 0;
    // Boost when the user searches by package name (e.g. @tpmjs/tools-unsandbox).
    const packageNameBoost = hasPackageNameMatch(query, tool.package.npmPackageName) ? 50 : 0;
    const tagBoost = tagBoostFor(tool, queryTokens);

    return {
      tool,
      score:
        bm25Score + qualityBoost + downloadBoost + exactNameBoost + packageNameBoost + tagBoost,
    };
  });

  // Broken tools demoted below every healthy match, then by relevance score.
  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) =>
      compareSearchHits(
        {
          importHealth: a.tool.importHealth,
          executionHealth: a.tool.executionHealth,
          score: a.score,
        },
        {
          importHealth: b.tool.importHealth,
          executionHealth: b.tool.executionHealth,
          score: b.score,
        }
      )
    );
}

/**
 * Run the unified registry search: prefilter candidates in the DB, then rank
 * them with {@link scoreTools}. Returns every match (score > 0), health-ordered.
 */
export async function searchTools(options: SearchToolsOptions): Promise<ScoredTool[]> {
  const query = options.query ?? '';
  const hasSearchQuery = tokenize(query).filter((t) => t.length >= MIN_TOKEN_LENGTH).length > 0;

  const tools = await prisma.tool.findMany({
    where: buildToolSearchWhere(options),
    include: { package: true },
    take: hasSearchQuery ? (options.candidateLimit ?? DEFAULT_CANDIDATE_LIMIT) : NO_QUERY_LIMIT,
    orderBy: hasSearchQuery ? undefined : { qualityScore: 'desc' },
  });

  return scoreTools(tools, query, options.contextMessages ?? []);
}

/** Canonical `package::export` identifier for a tool. */
export function toolIdOf(tool: ToolWithPackage): string {
  return `${tool.package.npmPackageName}::${tool.name}`;
}
