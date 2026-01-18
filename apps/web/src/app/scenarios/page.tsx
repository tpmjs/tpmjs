'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { EmptyState } from '@tpmjs/ui/EmptyState/EmptyState';
import { ErrorState } from '@tpmjs/ui/ErrorState/ErrorState';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import { LoadingState } from '@tpmjs/ui/LoadingState/LoadingState';
import { PageHeader } from '@tpmjs/ui/PageHeader/PageHeader';
import { Select } from '@tpmjs/ui/Select/Select';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { TableVirtuoso } from 'react-virtuoso';
import { AppHeader } from '~/components/AppHeader';
import { type PublicScenario, useScenarios } from '~/hooks/useScenarios';

type SortOption = 'qualityScore' | 'totalRuns' | 'createdAt' | 'lastRunAt';

function sortScenarios(scenarios: PublicScenario[], sortBy: SortOption): PublicScenario[] {
  return [...scenarios].sort((a, b) => {
    switch (sortBy) {
      case 'qualityScore':
        return b.qualityScore - a.qualityScore;
      case 'totalRuns':
        return b.totalRuns - a.totalRuns;
      case 'createdAt':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'lastRunAt': {
        const aTime = a.lastRunAt ? new Date(a.lastRunAt).getTime() : 0;
        const bTime = b.lastRunAt ? new Date(b.lastRunAt).getTime() : 0;
        return bTime - aTime;
      }
      default:
        return 0;
    }
  });
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return (
      <Badge variant="secondary" size="sm">
        Not run
      </Badge>
    );
  }

  switch (status) {
    case 'pass':
      return (
        <Badge size="sm" className="bg-success/10 text-success border-success/20">
          <Icon icon="check" size="xs" className="mr-1" />
          Pass
        </Badge>
      );
    case 'fail':
      return (
        <Badge size="sm" className="bg-error/10 text-error border-error/20">
          <Icon icon="x" size="xs" className="mr-1" />
          Fail
        </Badge>
      );
    case 'error':
      return (
        <Badge size="sm" className="bg-warning/10 text-warning border-warning/20">
          <Icon icon="alertTriangle" size="xs" className="mr-1" />
          Error
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" size="sm">
          {status}
        </Badge>
      );
  }
}

function QualityScore({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  const color =
    percentage >= 70
      ? 'text-success'
      : percentage >= 40
        ? 'text-warning'
        : 'text-foreground-tertiary';

  return (
    <div className="flex items-center gap-1" title={`Quality score: ${percentage}%`}>
      <Icon icon="star" size="xs" className={color} />
      <span className={`text-sm ${color}`}>{percentage}%</span>
    </div>
  );
}

export default function ScenariosExplorerPage(): React.ReactElement {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('qualityScore');

  // Fetch scenarios using SWR
  const { data, isLoading, error: swrError, mutate } = useScenarios({ sortBy: sort });

  const scenarios = data?.scenarios ?? [];
  const hasMore = data?.pagination.hasMore ?? false;
  const error = swrError?.message ?? null;

  // Filter and sort scenarios (client-side search)
  const filteredScenarios = useMemo(() => {
    let result = scenarios;

    if (search) {
      const query = search.toLowerCase();
      result = result.filter(
        (s: PublicScenario) =>
          s.prompt.toLowerCase().includes(query) ||
          s.name?.toLowerCase().includes(query) ||
          s.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          s.collection?.name.toLowerCase().includes(query)
      );
    }

    return sortScenarios(result, sort);
  }, [scenarios, search, sort]);

  const TableHeader = useCallback(
    () => (
      <tr className="bg-surface-secondary text-left text-xs font-semibold uppercase tracking-wider text-foreground-secondary border-b border-border">
        <th className="px-4 py-3 w-[300px]">Scenario</th>
        <th className="px-4 py-3 w-[200px]">Collection</th>
        <th className="px-4 py-3 w-[100px] text-center">Quality</th>
        <th className="px-4 py-3 w-[80px] text-center">Runs</th>
        <th className="px-4 py-3 w-[100px] text-center">Status</th>
        <th className="px-4 py-3 w-[150px]">Tags</th>
      </tr>
    ),
    []
  );

  const TableRow = useCallback((_index: number, scenario: PublicScenario) => {
    const detailUrl = scenario.collection
      ? `/@${scenario.collection.username}/collections/${scenario.collection.slug}/scenarios/${scenario.id}`
      : `/scenarios/${scenario.id}`;

    return (
      <>
        <td className="px-4 py-3">
          <Link href={detailUrl} className="block group">
            <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {scenario.name || truncateText(scenario.prompt, 50)}
            </div>
            {scenario.name && (
              <div className="text-sm text-foreground-secondary mt-0.5 line-clamp-1">
                {truncateText(scenario.prompt, 80)}
              </div>
            )}
          </Link>
        </td>
        <td className="px-4 py-3">
          {scenario.collection ? (
            <Link
              href={`/@${scenario.collection.username}/collections/${scenario.collection.slug}`}
              className="text-sm text-foreground-secondary hover:text-primary transition-colors"
            >
              {scenario.collection.name}
            </Link>
          ) : (
            <span className="text-sm text-foreground-tertiary">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-center">
          <QualityScore score={scenario.qualityScore} />
        </td>
        <td className="px-4 py-3 text-center">
          <Badge variant="secondary" size="sm">
            {scenario.totalRuns}
          </Badge>
        </td>
        <td className="px-4 py-3 text-center">
          <StatusBadge status={scenario.lastRunStatus} />
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {scenario.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" size="sm" className="text-xs">
                {tag}
              </Badge>
            ))}
            {scenario.tags.length > 2 && (
              <Badge variant="secondary" size="sm" className="text-xs">
                +{scenario.tags.length - 2}
              </Badge>
            )}
          </div>
        </td>
      </>
    );
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Test Scenarios"
          description="Explore AI-generated test scenarios that validate tool collections"
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scenarios..."
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground-secondary">Sort:</span>
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              options={[
                { value: 'qualityScore', label: 'Highest Quality' },
                { value: 'totalRuns', label: 'Most Runs' },
                { value: 'createdAt', label: 'Most Recent' },
                { value: 'lastRunAt', label: 'Recently Run' },
              ]}
            />
          </div>
        </div>

        {/* Content */}
        {error ? (
          <ErrorState message={error} onRetry={() => mutate()} />
        ) : isLoading ? (
          <LoadingState message="Loading scenarios..." size="lg" />
        ) : filteredScenarios.length === 0 ? (
          <EmptyState
            icon="terminal"
            title="No scenarios found"
            description={
              search
                ? 'Try adjusting your search terms'
                : 'No test scenarios have been created yet. Create a collection and generate scenarios!'
            }
          />
        ) : (
          <>
            <div className="border border-border rounded-lg overflow-hidden">
              <TableVirtuoso
                style={{ height: 'calc(100vh - 350px)', minHeight: '400px' }}
                data={filteredScenarios}
                overscan={30}
                fixedHeaderContent={TableHeader}
                itemContent={TableRow}
                components={{
                  Table: (props) => (
                    <table
                      {...props}
                      className="w-full border-collapse text-sm"
                      style={{ tableLayout: 'fixed' }}
                    />
                  ),
                  TableHead: (props) => (
                    <thead {...props} className="bg-surface-secondary sticky top-0 z-10" />
                  ),
                  TableBody: (props) => <tbody {...props} />,
                  TableRow: (props) => (
                    <tr
                      {...props}
                      className="border-b border-border bg-surface hover:bg-surface-secondary transition-all duration-150 group"
                    />
                  ),
                }}
              />
            </div>

            <div className="mt-4 text-sm text-foreground-tertiary">
              Showing {filteredScenarios.length} scenario
              {filteredScenarios.length !== 1 ? 's' : ''}
              {search && ` matching "${search}"`}
              {hasMore && ' (scroll for more)'}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
