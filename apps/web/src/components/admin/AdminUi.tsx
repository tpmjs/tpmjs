'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { ErrorState } from '@tpmjs/ui/ErrorState/ErrorState';
import { Icon, type IconName } from '@tpmjs/ui/Icon/Icon';
import { Spinner } from '@tpmjs/ui/Spinner/Spinner';
import { Tabs } from '@tpmjs/ui/Tabs/Tabs';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { AreaChart } from '~/components/stats/AreaChart';
import type { NamedCount, SeriesPoint } from '~/lib/admin/types';

// ---------------------------------------------------------------- formatting

export function formatNumber(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: digits }).format(value);
}

export function formatMs(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  if (value >= 10_000) return `${(value / 1000).toFixed(1)} s`;
  return `${Math.round(value)} ms`;
}

export function formatPercent(part: number, total: number): string {
  if (!total) return '—';
  return `${((part / total) * 100).toFixed(part / total >= 0.995 || part === 0 ? 0 : 1)}%`;
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 0) return `in ${Math.round(-diff / 60)}m`;
  if (diff < 45) return 'just now';
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86_400) return `${Math.round(diff / 3600)}h ago`;
  if (diff < 86_400 * 14) return `${Math.round(diff / 86_400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function TimeAgo({ iso }: { iso: string | null | undefined }) {
  return (
    <span
      title={iso ? new Date(iso).toLocaleString() : undefined}
      className="whitespace-nowrap tabular-nums"
    >
      {relativeTime(iso)}
    </span>
  );
}

// ---------------------------------------------------------------- status

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'success' | 'error' | 'warning';

const GOOD = new Set([
  'success',
  'healthy',
  'completed',
  'active',
  'connected',
  'public',
  'synced',
  'ok',
  'pass',
  'passed',
  'admin',
]);
const BAD = new Set(['error', 'failed', 'broken', 'inactive', 'disconnected', 'fail', 'cancelled']);
const WARN = new Set([
  'partial',
  'unknown',
  'stalled',
  'pending',
  'running',
  'claimed',
  'private',
  'warning',
  'degraded',
]);

export function toneFor(status: string | null | undefined): BadgeVariant {
  if (!status) return 'outline';
  const s = status.toLowerCase();
  if (/^[45]\d\d$/.test(s)) return 'error';
  if (/^[23]\d\d$/.test(s)) return 'success';
  if (GOOD.has(s)) return 'success';
  if (BAD.has(s)) return 'error';
  if (WARN.has(s)) return 'warning';
  return 'secondary';
}

export function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <span className="text-foreground-tertiary">—</span>;
  return (
    <Badge variant={toneFor(status)} size="sm">
      {status}
    </Badge>
  );
}

// ---------------------------------------------------------------- layout bits

export function Kpi({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  hint?: ReactNode;
  icon?: IconName;
  tone?: 'good' | 'bad' | 'warn';
}) {
  const toneClass =
    tone === 'bad'
      ? 'text-error'
      : tone === 'warn'
        ? 'text-warning'
        : tone === 'good'
          ? 'text-success'
          : 'text-foreground';
  return (
    <div className="bg-surface border border-border rounded-xl p-4 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-foreground-tertiary text-xs uppercase tracking-wide truncate">
          {label}
        </span>
        {icon && <Icon icon={icon} size="xs" className="text-foreground-tertiary shrink-0" />}
      </div>
      <div className={`text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</div>
      {hint && <div className="text-xs text-foreground-tertiary mt-1 truncate">{hint}</div>}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`bg-surface border border-border rounded-xl ${className ?? ''}`}>
      <header className="flex items-start justify-between gap-4 px-5 pt-4 pb-3 border-b border-border">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description && <p className="text-xs text-foreground-tertiary mt-0.5">{description}</p>}
        </div>
        {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function PageState({
  loading,
  error,
  onRetry,
  children,
}: {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  children: ReactNode;
}) {
  if (error) {
    return <ErrorState title="Couldn’t load admin data" message={error} onRetry={onRetry} />;
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }
  return <>{children}</>;
}

export function RefreshBar({
  updatedAt,
  refreshing,
  onRefresh,
  children,
}: {
  updatedAt: Date | null;
  refreshing: boolean;
  onRefresh: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {children}
      <div className="ml-auto flex items-center gap-3 text-xs text-foreground-tertiary">
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`inline-block w-2 h-2 rounded-full ${refreshing ? 'bg-warning' : 'bg-success'}`}
            aria-hidden="true"
          />
          {updatedAt ? `updated ${relativeTime(updatedAt.toISOString())}` : 'loading…'}
        </span>
        <Button size="sm" variant="outline" onClick={onRefresh} disabled={refreshing}>
          <Icon icon="loader" size="xs" className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </div>
  );
}

const WINDOWS: Array<{ id: string; label: string; hours: number }> = [
  { id: '1', label: '1h', hours: 1 },
  { id: '24', label: '24h', hours: 24 },
  { id: '168', label: '7d', hours: 168 },
  { id: '720', label: '30d', hours: 720 },
];

export function WindowTabs({
  hours,
  onChange,
}: {
  hours: number;
  onChange: (hours: number) => void;
}) {
  return (
    <Tabs
      size="sm"
      tabs={WINDOWS.map((w) => ({ id: w.id, label: w.label }))}
      activeTab={String(WINDOWS.find((w) => w.hours === hours)?.id ?? '24')}
      onTabChange={(id) => onChange(WINDOWS.find((w) => w.id === id)?.hours ?? 24)}
    />
  );
}

// ---------------------------------------------------------------- data viz

export function HourlyChart({
  points,
  labels,
  height = 180,
  color,
  secondaryColor,
}: {
  points: SeriesPoint[];
  labels: { primary: string; secondary?: string };
  height?: number;
  color?: string;
  secondaryColor?: string;
}) {
  const hasSecondary = Boolean(labels.secondary);
  const data = points.map((p) => ({
    date: p.at,
    value: p.value,
    secondaryValue: p.secondaryValue ?? 0,
  }));
  if (!points.some((p) => p.value > 0)) {
    return (
      <div className="text-sm text-foreground-tertiary py-8 text-center">
        No events in this window.
      </div>
    );
  }
  return (
    <AreaChart
      data={data}
      height={height}
      color={color}
      secondaryColor={secondaryColor}
      showSecondary={hasSecondary}
      labels={labels}
      dateFormat={points.length > 48 ? 'MMM d' : 'HH:mm'}
    />
  );
}

export function BarList({
  items,
  total,
  linkFor,
  emptyText = 'Nothing yet.',
  max = 12,
}: {
  items: NamedCount[];
  total?: number;
  linkFor?: (key: string) => string | null;
  emptyText?: string;
  max?: number;
}) {
  if (!items.length) return <p className="text-sm text-foreground-tertiary">{emptyText}</p>;
  const peak = Math.max(1, ...items.map((i) => i.count));
  const denominator = total ?? items.reduce((sum, i) => sum + i.count, 0);
  return (
    <ul className="space-y-2">
      {items.slice(0, max).map((item) => {
        const href = linkFor?.(item.key) ?? null;
        const label = href ? (
          <Link href={href} className="hover:text-primary truncate">
            {item.key}
          </Link>
        ) : (
          <span className="truncate">{item.key}</span>
        );
        return (
          <li key={item.key} className="text-sm">
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="min-w-0 flex items-center gap-2 text-foreground">{label}</span>
              <span className="text-foreground-tertiary tabular-nums shrink-0">
                {formatNumber(item.count)}
                {denominator > 0 && (
                  <span className="ml-1 text-xs">({formatPercent(item.count, denominator)})</span>
                )}
              </span>
            </div>
            <div className="h-1.5 rounded bg-border overflow-hidden">
              <div
                className="h-full bg-primary rounded"
                style={{ width: `${(item.count / peak) * 100}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <code className={`font-mono text-xs ${className ?? ''}`}>{children}</code>;
}
