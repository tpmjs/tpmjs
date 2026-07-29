import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Container } from '@tpmjs/ui/Container/Container';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { QualityScore } from '@tpmjs/ui/QualityScore/QualityScore';
import { ToolHealthBadge } from '@tpmjs/ui/ToolHealthBadge/ToolHealthBadge';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AppHeader } from '~/components/AppHeader';
import { describeToolHealth } from '~/lib/tool-health-policy';
import {
  BROWSE_SORT_LABELS,
  BROWSE_SORTS,
  type BrowseData,
  type BrowseSort,
  type BrowseTool,
  buildToolsHref,
  type CategoryFacet,
  DEFAULT_BROWSE_SORT,
  firstParam,
  formatCategoryLabel,
  getBrowseData,
  sanitizeCategory,
} from '~/lib/tools-browse';

// Bound DB pressure the same way /trending does: the underlying active-tool
// snapshot is cached for this window and every facet/sort/page renders from it.
// Next.js requires a literal here — keep in sync with TOOLS_REVALIDATE_SECONDS.
export const revalidate = 900;

const BASE_TITLE = 'Browse Tools';
const BASE_DESCRIPTION =
  'Browse the full TPMJS registry of AI-agent tools — filter by category, sort by quality, downloads, or recency, and jump straight to any tool. Broken tools stay listed with honest health badges.';

type RawSearchParams = {
  page?: string | string[];
  category?: string | string[];
  sort?: string | string[];
};

interface ToolsPageProps {
  searchParams: Promise<RawSearchParams>;
}

/** Format a download/like count compactly (1234 → "1.2K"). */
function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${value}`;
}

export async function generateMetadata({ searchParams }: ToolsPageProps): Promise<Metadata> {
  // Metadata must never fault the page: derive a title from params alone, no DB.
  const raw = await searchParams;
  const category = firstParam(raw.category)?.trim() || null;
  const page = Math.max(1, Number.parseInt(firstParam(raw.page) ?? '1', 10) || 1);

  const titleParts: string[] = [];
  if (category) titleParts.push(`${formatCategoryLabel(category)} tools`);
  else titleParts.push(BASE_TITLE);
  if (page > 1) titleParts.push(`page ${page}`);
  const title = titleParts.join(' — ');

  // Canonical intentionally excludes `sort` (a re-ordering, not new content) so
  // sort variants consolidate onto one indexable URL per category+page.
  const canonical = buildToolsHref({ category, page });

  return {
    title,
    description: BASE_DESCRIPTION,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${title} | TPMJS`,
      description: BASE_DESCRIPTION,
      url: `https://tpmjs.com${canonical}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | TPMJS`,
      description: BASE_DESCRIPTION,
    },
  };
}

function StatChip({ value, label }: { value: string; label: string }): React.ReactElement {
  return (
    <span>
      <span className="text-foreground-secondary">{value}</span> {label}
    </span>
  );
}

/** A native, JS-free GET form that lands on the interactive search page. */
function SearchCta(): React.ReactElement {
  return (
    <search>
      <form action="/tool/tool-search" method="get" className="flex w-full max-w-xl gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-foreground-tertiary">
            <Icon icon="search" size="sm" />
          </span>
          <input
            type="search"
            name="q"
            placeholder="Search tools by name, package, or capability…"
            aria-label="Search tools"
            className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-foreground-tertiary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Search
          <Icon icon="arrowRight" size="sm" />
        </button>
      </form>
    </search>
  );
}

function CategoryFacets({
  facets,
  active,
  sort,
}: {
  facets: CategoryFacet[];
  active: string | null;
  sort: BrowseSort;
}): React.ReactElement {
  const sortForLinks = sort === DEFAULT_BROWSE_SORT ? undefined : sort;
  const chip =
    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors';
  const inactive =
    'border-border bg-surface text-foreground-secondary hover:border-border-hover hover:text-foreground';
  const activeCls = 'border-primary bg-primary/10 text-primary';

  return (
    <nav aria-label="Filter tools by category" className="flex flex-wrap gap-2">
      <Link
        href={buildToolsHref({ sort: sortForLinks })}
        className={`${chip} ${active === null ? activeCls : inactive}`}
        aria-current={active === null ? 'true' : undefined}
      >
        <Icon icon="box" size="xs" />
        All
      </Link>
      {facets.map((facet) => {
        const isActive = active === facet.category;
        return (
          <Link
            key={facet.category}
            href={buildToolsHref({ category: facet.category, sort: sortForLinks })}
            className={`${chip} ${isActive ? activeCls : inactive}`}
            aria-current={isActive ? 'true' : undefined}
          >
            {formatCategoryLabel(facet.category)}
            <span className="font-mono text-[10px] text-foreground-tertiary">{facet.count}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SortControl({
  sort,
  category,
}: {
  sort: BrowseSort;
  category: string | null;
}): React.ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wider text-foreground-tertiary">
        Sort
      </span>
      <div className="flex flex-wrap gap-1">
        {BROWSE_SORTS.map((option) => {
          const isActive = option === sort;
          return (
            <Link
              key={option}
              href={buildToolsHref({ category, sort: option })}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-surface-secondary text-foreground'
                  : 'text-foreground-tertiary hover:text-foreground'
              }`}
              aria-current={isActive ? 'true' : undefined}
            >
              {BROWSE_SORT_LABELS[option]}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function ToolBrowseCard({ tool }: { tool: BrowseTool }): React.ReactElement {
  const health = describeToolHealth(tool);
  const qualityPct = tool.qualityScore == null ? null : Math.round(tool.qualityScore * 100);

  return (
    <Link
      href={`/tool/${tool.packageName}/${tool.name}`}
      className={`group flex h-full flex-col rounded-xl border bg-surface p-4 transition-colors hover:border-border-hover hover:bg-surface-secondary ${
        health.isBroken ? 'border-border/60 opacity-75' : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 truncate font-semibold text-foreground group-hover:text-primary">
          {tool.displayName}
        </h3>
        {qualityPct != null && (
          <QualityScore
            score={tool.qualityScore ?? 0}
            isDecimal
            variant="badge"
            size="sm"
            showTier={false}
          />
        )}
      </div>

      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
        <span className="truncate font-mono text-xs text-foreground-tertiary">
          {tool.packageName}
          {tool.npmVersion ? ` · v${tool.npmVersion}` : ''}
        </span>
        {tool.isOfficial && (
          <Badge variant="info" size="sm">
            <Icon icon="badgeCheck" size="xs" className="mr-1" />
            official
          </Badge>
        )}
        {health.isBroken && (
          <ToolHealthBadge
            importHealth={tool.importHealth}
            executionHealth={tool.executionHealth}
            summary={health.summary}
            size="sm"
          />
        )}
      </div>

      {tool.description && (
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-foreground-secondary">
          {tool.description}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-tertiary">
        <Badge variant="outline" size="sm">
          {formatCategoryLabel(tool.category)}
        </Badge>
        {tool.downloads > 0 && (
          <span className="inline-flex items-center gap-1" title="downloads / month">
            <Icon icon="download" size="xs" />
            <span className="font-mono text-foreground-secondary">
              {formatCompact(tool.downloads)}
            </span>
          </span>
        )}
        {tool.likeCount > 0 && (
          <span className="inline-flex items-center gap-1" title="likes">
            <Icon icon="heart" size="xs" />
            <span className="font-mono text-foreground-secondary">
              {formatCompact(tool.likeCount)}
            </span>
          </span>
        )}
      </div>
    </Link>
  );
}

/** Compact windowed page numbers around the current page (view logic only). */
function pageWindow(current: number, total: number): number[] {
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  return [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
}

function BrowsePagination({
  page,
  totalPages,
  category,
  sort,
}: {
  page: number;
  totalPages: number;
  category: string | null;
  sort: BrowseSort;
}): React.ReactElement | null {
  if (totalPages <= 1) return null;
  const sortForLinks = sort === DEFAULT_BROWSE_SORT ? undefined : sort;
  const pages = pageWindow(page, totalPages);

  const navBtn =
    'inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-lg border border-border px-3 text-sm font-medium text-foreground-secondary transition-colors hover:border-border-hover hover:text-foreground';
  const disabled =
    'inline-flex h-9 min-w-9 cursor-not-allowed items-center justify-center gap-1 rounded-lg border border-border/50 px-3 text-sm font-medium text-foreground-tertiary opacity-50';

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-center gap-2 border-t border-border pt-6"
    >
      {page > 1 ? (
        <Link
          href={buildToolsHref({ category, sort: sortForLinks, page: page - 1 })}
          rel="prev"
          className={navBtn}
        >
          <Icon icon="chevronLeft" size="sm" />
          Prev
        </Link>
      ) : (
        <span className={disabled}>
          <Icon icon="chevronLeft" size="sm" />
          Prev
        </span>
      )}

      <div className="flex items-center gap-1">
        {pages.map((target, index) => {
          const prev = pages[index - 1];
          const gap = prev != null && target - prev > 1;
          const isCurrent = target === page;
          return (
            <span key={target} className="flex items-center gap-1">
              {gap && <span className="px-1 text-foreground-tertiary">…</span>}
              {isCurrent ? (
                <span
                  aria-current="page"
                  className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground"
                >
                  {target}
                </span>
              ) : (
                <Link
                  href={buildToolsHref({ category, sort: sortForLinks, page: target })}
                  className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium text-foreground-secondary transition-colors hover:border-border-hover hover:text-foreground"
                >
                  {target}
                </Link>
              )}
            </span>
          );
        })}
      </div>

      {page < totalPages ? (
        <Link
          href={buildToolsHref({ category, sort: sortForLinks, page: page + 1 })}
          rel="next"
          className={navBtn}
        >
          Next
          <Icon icon="chevronRight" size="sm" />
        </Link>
      ) : (
        <span className={disabled}>
          Next
          <Icon icon="chevronRight" size="sm" />
        </span>
      )}
    </nav>
  );
}

function collectionJsonLd(data: BrowseData, canonical: string): Record<string, unknown> {
  const pageOffset = (data.page - 1) * data.pageSize;
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: data.params.category
      ? `${formatCategoryLabel(data.params.category)} tools on TPMJS`
      : 'TPMJS Tool Registry',
    description: BASE_DESCRIPTION,
    url: `https://tpmjs.com${canonical}`,
    isPartOf: { '@type': 'WebSite', name: 'TPMJS', url: 'https://tpmjs.com' },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: data.totalInScope,
      itemListElement: data.tools.map((tool, index) => ({
        '@type': 'ListItem',
        position: pageOffset + index + 1,
        url: `https://tpmjs.com/tool/${tool.packageName}/${tool.name}`,
        name: tool.displayName,
        description: tool.description || undefined,
      })),
    },
  };
}

export default async function ToolsPage({
  searchParams,
}: ToolsPageProps): Promise<React.ReactElement> {
  const raw = await searchParams;

  let data: BrowseData | null = null;
  let loadFailed = false;
  try {
    data = await getBrowseData(raw);
  } catch (error) {
    loadFailed = true;
    console.error('[Tools] Failed to load browse index:', error);
  }

  // Best-effort params for links even when the DB read failed (no facet set).
  const fallbackCategory = sanitizeCategory(firstParam(raw.category), new Set());
  const category = data?.params.category ?? fallbackCategory;
  const canonical = buildToolsHref({ category, page: data?.page ?? 1 });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {data && data.tools.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(collectionJsonLd(data, canonical)).replace(/</g, '\\u003c'),
          }}
        />
      )}

      {/* Title band */}
      <div className="border-b border-border bg-surface-secondary">
        <Container size="xl" padding="md" className="py-10">
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            {category ? `${formatCategoryLabel(category)} tools` : 'Browse Tools'}
          </h1>
          <p className="mt-2 max-w-2xl text-foreground-secondary">
            The full registry of AI-agent tools — filter by category, sort by quality, downloads, or
            recency. Broken tools stay listed with honest health badges, ranked below healthy ones.
          </p>

          {data && (
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs text-foreground-tertiary">
              <StatChip value={data.totalActive.toLocaleString('en-US')} label="tools" />
              <StatChip value={data.totalPackages.toLocaleString('en-US')} label="packages" />
              <StatChip value={String(data.facets.length)} label="categories" />
              {data.brokenInScope > 0 && (
                <StatChip value={String(data.brokenInScope)} label="broken (still listed)" />
              )}
            </div>
          )}

          <div className="mt-6">
            <SearchCta />
          </div>
        </Container>
      </div>

      <Container size="xl" padding="md" className="space-y-6 py-8">
        {loadFailed && (
          <div className="rounded-xl border border-error/30 bg-error/10 p-6 text-center text-error">
            Could not load the tool registry right now. Please try again shortly, or use{' '}
            <Link href="/tool/tool-search" className="underline">
              tool search
            </Link>
            .
          </div>
        )}

        {data && (
          <>
            <CategoryFacets
              facets={data.facets}
              active={data.params.category}
              sort={data.params.sort}
            />

            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-foreground-tertiary">
                {data.totalInScope.toLocaleString('en-US')}{' '}
                {data.params.category ? formatCategoryLabel(data.params.category) : ''} tool
                {data.totalInScope === 1 ? '' : 's'}
                {data.totalPages > 1 ? ` · page ${data.page} of ${data.totalPages}` : ''}
              </p>
              <SortControl sort={data.params.sort} category={data.params.category} />
            </div>

            {data.tools.length > 0 ? (
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.tools.map((tool) => (
                  <li key={tool.id}>
                    <ToolBrowseCard tool={tool} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-xl border border-border bg-surface p-12 text-center">
                <div className="mb-2 flex justify-center">
                  <Icon icon="search" size="lg" className="text-foreground-tertiary" />
                </div>
                <h2 className="mb-2 text-xl font-semibold text-foreground">No tools here yet</h2>
                <p className="mx-auto mb-6 max-w-md text-foreground-secondary">
                  Nothing matches this filter right now. Browse every category or search the full
                  registry.
                </p>
                <Link
                  href="/tools"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Show all tools
                  <Icon icon="arrowRight" size="sm" />
                </Link>
              </div>
            )}

            <BrowsePagination
              page={data.page}
              totalPages={data.totalPages}
              category={data.params.category}
              sort={data.params.sort}
            />

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-sm text-foreground-tertiary">
              <p>
                Looking for something specific?{' '}
                <Link href="/tool/tool-search" className="text-primary hover:underline">
                  Search all tools
                </Link>{' '}
                or see what&apos;s{' '}
                <Link href="/trending" className="text-primary hover:underline">
                  trending
                </Link>
                .
              </p>
              <p className="font-mono text-xs">
                Programmatic access:{' '}
                <code className="text-foreground-secondary">GET /api/tools</code>
              </p>
            </div>
          </>
        )}
      </Container>
    </div>
  );
}
