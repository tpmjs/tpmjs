import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Container } from '@tpmjs/ui/Container/Container';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { QualityScore } from '@tpmjs/ui/QualityScore/QualityScore';
import { ToolHealthBadge } from '@tpmjs/ui/ToolHealthBadge/ToolHealthBadge';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AppHeader } from '~/components/AppHeader';
import {
  EXECUTION_WINDOW_DAYS,
  formatCompactNumber,
  formatDeltaPct,
  getTrendingTools,
  type RankedTrendingEntry,
  TREND_WINDOW_DAYS,
  type TrendingResult,
} from '~/lib/trending';

// Refresh the leaderboard at most every 15 minutes (ISR) — a registry trending
// board does not need per-request DB pressure, and 15 min keeps it fresh enough.
export const revalidate = 900;

const PAGE_TITLE = 'Trending Tools';
const PAGE_DESCRIPTION =
  'The AI-agent tools gaining momentum on TPMJS right now — ranked by recent page views and tool executions, with health scores, quality, and download stats. Updated continuously.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: '/trending' },
  robots: { index: true, follow: true },
  openGraph: {
    title: `${PAGE_TITLE} | TPMJS`,
    description: PAGE_DESCRIPTION,
    url: 'https://tpmjs.com/trending',
    images: [{ url: '/api/og/trending', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${PAGE_TITLE} | TPMJS`,
    description: PAGE_DESCRIPTION,
    images: ['/api/og/trending'],
  },
};

const TRENDING_LIMIT = 40;

function toolUrl(entry: RankedTrendingEntry): string {
  return `/tool/${entry.packageName}/${entry.toolName}`;
}

/** Small labelled metric chip (icon + value). */
function MetricChip({
  icon,
  value,
  label,
}: {
  icon: React.ComponentProps<typeof Icon>['icon'];
  value: string;
  label: string;
}): React.ReactElement {
  return (
    <span className="inline-flex items-center gap-1 text-foreground-tertiary" title={label}>
      <Icon icon={icon} size="xs" />
      <span className="font-mono text-foreground-secondary">{value}</span>
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}

/** Movement pill shown only for tools with current-window activity. */
function MovementIndicator({ entry }: { entry: RankedTrendingEntry }): React.ReactElement | null {
  if (!entry.hasRecentActivity) return null;

  const delta = formatDeltaPct(entry.movementDeltaPct);

  if (entry.movement === 'new') {
    return <span className="font-mono text-[10px] font-semibold uppercase text-success">new</span>;
  }
  if (entry.movement === 'up') {
    return (
      <span className="inline-flex items-center gap-0.5 font-mono text-[10px] font-semibold text-success">
        <span aria-hidden>▲</span>
        {delta ?? 'up'}
      </span>
    );
  }
  if (entry.movement === 'down') {
    return (
      <span className="inline-flex items-center gap-0.5 font-mono text-[10px] font-semibold text-error">
        <span aria-hidden>▼</span>
        {delta ?? 'down'}
      </span>
    );
  }
  return (
    <span className="font-mono text-[10px] font-semibold uppercase text-foreground-muted">•</span>
  );
}

function TrendingRow({ entry }: { entry: RankedTrendingEntry }): React.ReactElement {
  const { signals } = entry;
  const qualityPct = signals.qualityScore == null ? null : Math.round(signals.qualityScore * 100);
  const isBroken = entry.importHealth === 'BROKEN' || entry.executionHealth === 'BROKEN';

  return (
    <Link
      href={toolUrl(entry)}
      className="group flex items-start gap-4 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-hover hover:bg-surface-secondary"
    >
      {/* Rank + movement */}
      <div className="flex w-10 shrink-0 flex-col items-center pt-0.5">
        <span className="font-mono text-xl font-bold tabular-nums text-foreground">
          {entry.rank}
        </span>
        <MovementIndicator entry={entry} />
      </div>

      {/* Main body */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-semibold text-foreground group-hover:text-primary">
            {entry.toolName}
          </h3>
          {entry.isOfficial && (
            <Badge variant="info" size="sm">
              <Icon icon="badgeCheck" size="xs" className="mr-1" />
              official
            </Badge>
          )}
          {qualityPct != null && (
            <QualityScore
              score={signals.qualityScore ?? 0}
              isDecimal
              variant="badge"
              size="sm"
              showTier={false}
            />
          )}
          {isBroken && (
            <ToolHealthBadge
              importHealth={entry.importHealth}
              executionHealth={entry.executionHealth}
              size="sm"
            />
          )}
        </div>

        <div className="mt-0.5 truncate font-mono text-xs text-foreground-tertiary">
          {entry.packageName}
          {entry.npmVersion ? ` · v${entry.npmVersion}` : ''}
        </div>

        {entry.description && (
          <p className="mt-1 line-clamp-2 text-sm text-foreground-secondary">{entry.description}</p>
        )}

        {/* Signals */}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <Badge variant="outline" size="sm">
            {entry.category}
          </Badge>
          {signals.downloads > 0 && (
            <MetricChip
              icon="download"
              value={formatCompactNumber(signals.downloads)}
              label="downloads/mo"
            />
          )}
          {signals.recentViews > 0 && (
            <MetricChip
              icon="eye"
              value={formatCompactNumber(signals.recentViews)}
              label={`views (${TREND_WINDOW_DAYS}d)`}
            />
          )}
          {signals.recentExecutions > 0 && (
            <MetricChip
              icon="terminal"
              value={formatCompactNumber(signals.recentExecutions)}
              label={`runs (${EXECUTION_WINDOW_DAYS}d)`}
            />
          )}
          {signals.likeCount > 0 && (
            <MetricChip icon="heart" value={formatCompactNumber(signals.likeCount)} label="likes" />
          )}
          {entry.averageRating != null && entry.ratingCount > 0 && (
            <MetricChip
              icon="star"
              value={`${entry.averageRating.toFixed(1)}`}
              label={`(${entry.ratingCount})`}
            />
          )}
        </div>
      </div>
    </Link>
  );
}

function MethodologyBanner({ result }: { result: TrendingResult }): React.ReactElement {
  const isSparse = result.dataMode === 'sparse';
  return (
    <div
      className={`rounded-xl border p-4 text-sm ${
        isSparse
          ? 'border-warning/30 bg-warning/10 text-foreground-secondary'
          : 'border-info/30 bg-info/10 text-foreground-secondary'
      }`}
    >
      <div className="flex items-start gap-3">
        <Icon
          icon="info"
          size="sm"
          className={`mt-0.5 shrink-0 ${isSparse ? 'text-warning' : 'text-info'}`}
        />
        <div>
          {isSparse ? (
            <p>
              Recent activity across the registry is light right now, so this leaderboard leans on{' '}
              <strong>all-time popularity</strong> — npm downloads, quality scores, and community
              likes. Tools with fresh page views ({result.windowDays}d) or executions (
              {result.executionWindowDays}d) are boosted to the top and flagged with a movement
              indicator.
            </p>
          ) : (
            <p>
              Ranked by <strong>momentum over the last {result.windowDays} days</strong> — page
              views plus tool executions ({result.executionWindowDays}d window) — with all-time
              popularity (npm downloads, quality, community likes) breaking ties and ordering the
              long tail. Tools that are persistently import-broken are excluded from the
              leaderboard.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function TrendingPage(): Promise<React.ReactElement> {
  let result: TrendingResult | null = null;
  let loadFailed = false;

  try {
    result = await getTrendingTools(TRENDING_LIMIT);
  } catch (error) {
    loadFailed = true;
    console.error('[Trending] Failed to load trending tools:', error);
  }

  const entries = result?.entries ?? [];

  const itemList =
    entries.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Trending Tools on TPMJS',
          numberOfItems: entries.length,
          itemListElement: entries.map((entry) => ({
            '@type': 'ListItem',
            position: entry.rank,
            url: `https://tpmjs.com${toolUrl(entry)}`,
            name: entry.toolName,
            description: entry.description || undefined,
          })),
        }
      : null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {itemList && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(itemList).replace(/</g, '\\u003c'),
          }}
        />
      )}

      {/* Title band */}
      <div className="border-b border-border bg-surface-secondary">
        <Container size="xl" padding="md" className="py-10">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">Trending Tools</h1>
          </div>
          <p className="mt-2 max-w-2xl text-foreground-secondary">
            The AI-agent tools gaining momentum on TPMJS — ranked by recent views and executions,
            with all-time popularity filling in the rest.
          </p>

          {result && (
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs text-foreground-tertiary">
              <span>
                <span className="text-foreground-secondary">{result.windowDays}d</span> view window
              </span>
              <span>
                <span className="text-foreground-secondary">{result.executionWindowDays}d</span>{' '}
                execution window
              </span>
              <span>
                <span className="text-foreground-secondary">
                  {formatCompactNumber(result.totalRecentViews)}
                </span>{' '}
                recent views
              </span>
              <span>
                <span className="text-foreground-secondary">
                  {formatCompactNumber(result.totalRecentExecutions)}
                </span>{' '}
                recent executions
              </span>
              <span>
                <span className="text-foreground-secondary">
                  {formatCompactNumber(result.candidateCount)}
                </span>{' '}
                tools ranked
              </span>
            </div>
          )}
        </Container>
      </div>

      <Container size="xl" padding="md" className="space-y-6 py-8">
        {loadFailed && (
          <div className="rounded-xl border border-error/30 bg-error/10 p-6 text-center text-error">
            Could not load trending data right now. Please try again shortly.
          </div>
        )}

        {!loadFailed && result && <MethodologyBanner result={result} />}

        {!loadFailed && entries.length === 0 && (
          <div className="rounded-xl border border-border bg-surface p-12 text-center">
            <div className="mb-2 flex justify-center">
              <Icon icon="barChart" size="lg" className="text-foreground-tertiary" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-foreground">No trending tools yet</h2>
            <p className="mx-auto mb-6 max-w-md text-foreground-secondary">
              There are no discoverable tools to rank right now. Browse the full registry to get
              started.
            </p>
            <Link
              href="/tool/tool-search"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
            >
              Browse tools
              <Icon icon="arrowRight" size="sm" />
            </Link>
          </div>
        )}

        {entries.length > 0 && (
          <ol className="space-y-3">
            {entries.map((entry) => (
              <li key={entry.toolId}>
                <TrendingRow entry={entry} />
              </li>
            ))}
          </ol>
        )}

        {entries.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-sm text-foreground-tertiary">
            <p>
              Want the full catalogue?{' '}
              <Link href="/tool/tool-search" className="text-primary hover:underline">
                Browse all tools
              </Link>{' '}
              or see{' '}
              <Link href="/stats" className="text-primary hover:underline">
                registry statistics
              </Link>
              .
            </p>
            <p className="font-mono text-xs">
              Programmatic access:{' '}
              <code className="text-foreground-secondary">GET /api/tools/trending</code>
            </p>
          </div>
        )}
      </Container>
    </div>
  );
}
