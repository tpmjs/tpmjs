'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Select } from '@tpmjs/ui/Select/Select';
import { Spinner } from '@tpmjs/ui/Spinner/Spinner';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// --- Types ---
interface Commit {
  h: string;
  d: string;
  m: string;
  t: string;
  s: string;
  u: string;
}

interface Milestone {
  d: string;
  n: string;
  x: string;
}

interface TimelineData {
  c: Commit[];
  m: Milestone[];
}

// --- Constants ---
const TYPE_COLORS: Record<string, { bg: string; text: string; tw: string }> = {
  feat: { bg: '#4a7c59', text: '#fff', tw: 'bg-green-600 dark:bg-green-500' },
  fix: { bg: '#c9a227', text: '#1a1a1a', tw: 'bg-yellow-500 dark:bg-yellow-400' },
  chore: { bg: '#8b8b8b', text: '#fff', tw: 'bg-gray-500 dark:bg-gray-400' },
  docs: { bg: '#5b7fb5', text: '#fff', tw: 'bg-blue-500 dark:bg-blue-400' },
  refactor: { bg: '#9b6b9e', text: '#fff', tw: 'bg-purple-500 dark:bg-purple-400' },
  style: { bg: '#c47a5a', text: '#fff', tw: 'bg-orange-500 dark:bg-orange-400' },
  test: { bg: '#5ba3a3', text: '#fff', tw: 'bg-teal-500 dark:bg-teal-400' },
  ci: { bg: '#7a8b6e', text: '#fff', tw: 'bg-emerald-600 dark:bg-emerald-500' },
  perf: { bg: '#b5544a', text: '#fff', tw: 'bg-red-500 dark:bg-red-400' },
  revert: { bg: '#a05555', text: '#fff', tw: 'bg-red-600 dark:bg-red-500' },
  debug: { bg: '#666', text: '#fff', tw: 'bg-gray-600 dark:bg-gray-500' },
  wip: { bg: '#999', text: '#fff', tw: 'bg-gray-400 dark:bg-gray-500' },
  other: { bg: '#6b6b6b', text: '#fff', tw: 'bg-gray-500 dark:bg-gray-400' },
};

const DEFAULT_COLOR: { bg: string; text: string; tw: string } = {
  bg: '#6b6b6b',
  text: '#fff',
  tw: 'bg-gray-500 dark:bg-gray-400',
};

function getTypeColor(type: string): { bg: string; text: string; tw: string } {
  return TYPE_COLORS[type] ?? DEFAULT_COLOR;
}

const TYPE_ORDER = [
  'feat',
  'fix',
  'refactor',
  'docs',
  'chore',
  'test',
  'ci',
  'style',
  'perf',
  'revert',
  'debug',
  'wip',
  'other',
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// --- Helpers ---
function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 864e5);
}

function formatShort(dateStr: string): string {
  const p = dateStr.split('-');
  return `${Number.parseInt(p[2] ?? '0', 10)} ${MONTHS[Number.parseInt(p[1] ?? '1', 10) - 1]}`;
}

function formatFull(dateStr: string): string {
  const p = dateStr.split('-');
  return `${Number.parseInt(p[2] ?? '0', 10)} ${MONTHS[Number.parseInt(p[1] ?? '1', 10) - 1]} ${p[0]}`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// --- Layout helpers (extracted to reduce cognitive complexity) ---

interface PositionedCommit {
  commit: Commit;
  x: number;
  y: number;
  width: number;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: lane packing algorithm is inherently nested
function packLanes(
  commits: Commit[],
  getX: (date: string) => number,
  dayWidth: number,
  laneHeight: number
): { positioned: PositionedCommit[]; maxLane: number } {
  const slots: number[] = [];
  const byDate: Record<string, Commit[]> = {};

  for (const c of commits) {
    const arr = byDate[c.d];
    if (arr) {
      arr.push(c);
    } else {
      byDate[c.d] = [c];
    }
  }

  const sortedDates = Object.keys(byDate).sort();
  const positioned: PositionedCommit[] = [];
  let maxLane = 0;

  for (const dt of sortedDates) {
    const cx = getX(dt);
    const dateCommits = byDate[dt] ?? [];
    for (const c of dateCommits) {
      const label = c.u || c.m;
      const cw = Math.max(dayWidth * 0.85, Math.min(label.length * 6 + 70, dayWidth * 2.2));
      let lane = 0;
      for (let l = 0; l < slots.length; l++) {
        if ((slots[l] ?? 0) <= cx - 3) {
          lane = l;
          break;
        }
        lane = l + 1;
      }
      if (lane >= slots.length) slots.push(0);
      slots[lane] = cx + cw;
      if (lane > maxLane) maxLane = lane;
      positioned.push({ commit: c, x: cx, y: lane * laneHeight + 40, width: cw });
    }
  }

  return { positioned, maxLane };
}

interface RulerEntry {
  date: string;
  label: string;
  isMonth: boolean;
  isToday: boolean;
}

function buildRuler(
  firstDate: string,
  totalDays: number,
  dayWidth: number,
  today: string
): RulerEntry[] {
  const ruler: RulerEntry[] = [];
  const startDate = new Date(`${firstDate}T12:00:00`);
  const skipEvery = dayWidth < 40 ? 7 : dayWidth < 65 ? 3 : 1;

  for (let i = 0; i <= totalDays; i++) {
    const di = new Date(startDate);
    di.setDate(di.getDate() + i);
    const ds = `${di.getFullYear()}-${String(di.getMonth() + 1).padStart(2, '0')}-${String(di.getDate()).padStart(2, '0')}`;
    const isMonth = di.getDate() === 1;
    const isToday = ds === today;
    const showLabel = isMonth || isToday || i % skipEvery === 0;
    ruler.push({
      date: ds,
      label: showLabel
        ? isMonth
          ? `${MONTHS[di.getMonth()]} ${di.getFullYear()}`
          : formatShort(ds)
        : '',
      isMonth,
      isToday,
    });
  }

  return ruler;
}

// --- Component ---
export function TimelineView(): React.ReactElement {
  const [data, setData] = useState<TimelineData | null>(null);
  const [error, setError] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [dayWidth, setDayWidth] = useState(90);
  const [tooltipData, setTooltipData] = useState<{
    commit: Commit;
    x: number;
    y: number;
  } | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);

  // Load data
  useEffect(() => {
    fetch('/timeline-data.json')
      .then((r) => r.json())
      .then((d: TimelineData) => setData(d))
      .catch(() => setError(true));
  }, []);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!scrollRef.current) return;
      const amount = 200;
      if (e.key === 'ArrowLeft') {
        scrollRef.current.scrollLeft -= amount;
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        scrollRef.current.scrollLeft += amount;
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Scroll to end on data load
  useEffect(() => {
    if (data && scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollLeft =
            scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
        }
      }, 100);
    }
  }, [data]);

  // Derived data
  const today = useMemo(() => todayStr(), []);

  const computed = useMemo(() => {
    if (!data) return null;
    const { c: commits, m: milestones } = data;
    const allDates = [...new Set(commits.map((c) => c.d))].sort();
    const firstDate = allDates[0] ?? today;
    const totalDays = daysBetween(firstDate, today) + 2;
    const types = [...new Set(commits.map((c) => c.t))].sort(
      (a, b) => TYPE_ORDER.indexOf(a) - TYPE_ORDER.indexOf(b)
    );
    const typeCounts: Record<string, number> = {};
    for (const c of commits) typeCounts[c.t] = (typeCounts[c.t] || 0) + 1;
    const featCount = typeCounts.feat || 0;
    const fixCount = typeCounts.fix || 0;

    return {
      commits,
      milestones,
      allDates,
      firstDate,
      totalDays,
      types,
      typeCounts,
      featCount,
      fixCount,
    };
  }, [data, today]);

  const filteredCommits = useMemo(() => {
    if (!computed) return [];
    if (activeFilters.size === 0) return computed.commits;
    return computed.commits.filter((c) => activeFilters.has(c.t));
  }, [computed, activeFilters]);

  // Layout computation
  const layout = useMemo(() => {
    if (!computed) return null;
    const { firstDate, totalDays } = computed;

    const getX = (date: string) => daysBetween(firstDate, date) * dayWidth;
    const LANE_HEIGHT = 28;

    const { positioned, maxLane } = packLanes(filteredCommits, getX, dayWidth, LANE_HEIGHT);
    const ruler = buildRuler(firstDate, totalDays, dayWidth, today);

    const totalWidth = totalDays * dayWidth + 80;
    const lanesHeight = (maxLane + 3) * LANE_HEIGHT + 80;

    return { positioned, ruler, totalWidth, lanesHeight, getX, LANE_HEIGHT, maxLane };
  }, [computed, filteredCommits, dayWidth, today]);

  // Handlers
  const toggleFilter = useCallback((type: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const handleZoom = useCallback((delta: number) => {
    setDayWidth((prev) => Math.max(20, Math.min(300, prev * delta)));
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        handleZoom(e.deltaY < 0 ? 1.1 : 0.9);
      }
    },
    [handleZoom]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-interactive]')) return;
    isDragging.current = true;
    dragStartX.current = e.pageX;
    dragScrollLeft.current = scrollRef.current?.scrollLeft || 0;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    scrollRef.current.scrollLeft = dragScrollLeft.current - (e.pageX - dragStartX.current) * 1.5;
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleJumpTo = useCallback(
    (milestoneDate: string) => {
      if (!scrollRef.current || !computed || !layout) return;
      const x = layout.getX(milestoneDate);
      const containerWidth = scrollRef.current.clientWidth;
      scrollRef.current.scrollTo({
        left: x - containerWidth / 2,
        behavior: 'smooth',
      });
    },
    [computed, layout]
  );

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDayWidth(Number(e.target.value));
  }, []);

  // Loading & error states
  if (error) {
    return (
      <div className="w-full h-96 border border-border rounded-lg flex items-center justify-center">
        <p className="text-foreground-secondary">Failed to load timeline data.</p>
      </div>
    );
  }

  if (!data || !computed || !layout) {
    return (
      <div className="w-full h-96 border border-border rounded-lg flex items-center justify-center">
        <Spinner size="lg" label="Loading timeline..." />
      </div>
    );
  }

  // Mobile: vertical timeline
  if (isMobile) {
    return (
      <MobileTimeline
        commits={filteredCommits}
        milestones={computed.milestones}
        types={computed.types}
        typeCounts={computed.typeCounts}
        activeFilters={activeFilters}
        toggleFilter={toggleFilter}
        totalCommits={computed.commits.length}
        featCount={computed.featCount}
        fixCount={computed.fixCount}
      />
    );
  }

  // Desktop: horizontal timeline
  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
      {/* Stats bar */}
      <div className="flex items-center justify-between px-4 py-2 border border-border rounded-t-lg bg-surface text-sm">
        <div className="flex gap-4 text-foreground-secondary">
          <span>
            <strong className="text-foreground">{computed.commits.length}</strong> commits
          </span>
          <span>
            <strong className="text-foreground">{computed.featCount}</strong> features
          </span>
          <span>
            <strong className="text-foreground">{computed.fixCount}</strong> fixes
          </span>
          <span>
            <strong className="text-foreground">{computed.allDates.length}</strong> active days
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Select
            size="sm"
            fullWidth={false}
            options={computed.milestones.map((ms) => ({
              value: ms.d,
              label: ms.n,
            }))}
            placeholder="Jump to..."
            onChange={(e) => handleJumpTo(e.target.value)}
            className="w-44"
          />
          <Button variant="outline" size="sm" onClick={() => setSummaryOpen(!summaryOpen)}>
            Summary
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-x border-border bg-surface overflow-x-auto">
        <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-tertiary mr-1 shrink-0">
          Filter
        </span>
        {computed.types.map((tp) => {
          const co = getTypeColor(tp);
          const active = activeFilters.has(tp);
          return (
            <button
              key={tp}
              type="button"
              data-interactive
              onClick={() => toggleFilter(tp)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer border transition-all select-none shrink-0 ${
                active
                  ? 'text-white border-transparent'
                  : 'border-border bg-background text-foreground-secondary hover:border-foreground-tertiary'
              }`}
              style={active ? { background: co.bg, borderColor: co.bg } : undefined}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: co.bg }} />
              {tp}
              <span className="opacity-50 text-[9px]">{computed.typeCounts[tp]}</span>
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => handleZoom(0.7)} className="h-7 w-7 p-0">
            -
          </Button>
          <input
            type="range"
            min={20}
            max={300}
            value={dayWidth}
            onChange={handleSliderChange}
            className="w-20 accent-foreground"
            aria-label="Zoom level"
          />
          <Button variant="ghost" size="sm" onClick={() => handleZoom(1.3)} className="h-7 w-7 p-0">
            +
          </Button>
          <span className="text-[10px] text-foreground-tertiary font-mono w-8 text-center">
            {Math.round(dayWidth)}
          </span>
        </div>
      </div>

      {/* Timeline viewport */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: drag-to-pan canvas, keyboard nav via window keydown */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto cursor-grab active:cursor-grabbing border-x border-b border-border rounded-b-lg relative bg-background"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="relative" style={{ width: layout.totalWidth, paddingBottom: 80 }}>
          {/* Ruler */}
          <div
            className="sticky top-0 z-30 flex h-8 bg-background border-b-2 border-foreground"
            style={{ width: layout.totalWidth }}
          >
            {layout.ruler.map((r) => (
              <div
                key={r.date}
                className={`shrink-0 text-[10px] relative flex items-end pb-1.5 pl-1.5 tracking-tight ${
                  r.isToday
                    ? 'text-green-600 dark:text-green-400 font-bold'
                    : r.isMonth
                      ? 'text-foreground font-bold text-[11px]'
                      : 'text-foreground-tertiary font-semibold'
                }`}
                style={{ width: dayWidth }}
              >
                {/* Tick mark */}
                <span
                  className={`absolute bottom-[-2px] left-0 w-px h-1.5 ${
                    r.isToday
                      ? 'w-2 h-2 rounded-full bg-green-600 dark:bg-green-400 -bottom-[5px] -left-[3px]'
                      : 'bg-foreground'
                  }`}
                />
                {r.label}
              </div>
            ))}
          </div>

          {/* Lanes area */}
          <div className="relative pt-3" style={{ height: layout.lanesHeight }}>
            {/* Grid lines */}
            {layout.ruler.map((r, idx) => (
              <div
                key={`gl-${r.date}`}
                className={`absolute top-0 bottom-0 w-px pointer-events-none ${
                  r.isMonth ? 'bg-border' : 'bg-border/30'
                }`}
                style={{ left: idx * dayWidth }}
              />
            ))}

            {/* Commit blocks */}
            {layout.positioned.map((item) => {
              const co = getTypeColor(item.commit.t);
              return (
                // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                // biome-ignore lint/a11y/noStaticElementInteractions: tooltip trigger on hover only
                <div
                  key={item.commit.h}
                  data-interactive
                  className="absolute h-[26px] rounded-[5px] px-2 flex items-center gap-1.5 text-[10.5px] font-medium whitespace-nowrap overflow-hidden cursor-pointer transition-all shadow-sm hover:z-10 hover:-translate-y-0.5 hover:shadow-md hover:overflow-visible"
                  style={{
                    left: item.x,
                    top: item.y,
                    width: item.width,
                    background: co.bg,
                    color: co.text,
                  }}
                  onMouseEnter={(e) =>
                    setTooltipData({
                      commit: item.commit,
                      x: e.clientX,
                      y: e.clientY,
                    })
                  }
                  onMouseMove={(e) =>
                    setTooltipData((prev) =>
                      prev ? { ...prev, x: e.clientX, y: e.clientY } : null
                    )
                  }
                  onMouseLeave={() => setTooltipData(null)}
                >
                  <span className="font-mono text-[9px] opacity-65 shrink-0">
                    {formatShort(item.commit.d)}
                  </span>
                  <span className="overflow-hidden text-ellipsis">
                    {item.commit.u || item.commit.m}
                  </span>
                </div>
              );
            })}

            {/* Milestones */}
            {computed.milestones.map((ms) => {
              const mx = layout.getX(ms.d);
              const lineHeight = Math.max(200, (layout.maxLane + 2) * layout.LANE_HEIGHT + 40);
              return (
                <button
                  type="button"
                  key={ms.d}
                  data-interactive
                  className="absolute z-20 cursor-pointer group bg-transparent border-0 p-0 text-left"
                  style={{ left: mx, top: 4 }}
                  onClick={() => handleJumpTo(ms.d)}
                >
                  <div className="bg-foreground text-background px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap shadow-md transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg relative">
                    {escapeHtml(ms.n)}
                    <span className="absolute -bottom-[5px] left-3 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-foreground" />
                  </div>
                  <div
                    className="absolute left-3.5 w-0.5 opacity-20 pointer-events-none"
                    style={{
                      top: 30,
                      height: lineHeight,
                      backgroundImage:
                        'repeating-linear-gradient(to bottom, currentColor 0px, currentColor 3px, transparent 3px, transparent 7px)',
                    }}
                  />
                  <div className="hidden group-hover:block absolute top-[34px] left-0 bg-background border border-border rounded-lg px-3 py-2 text-[11px] text-foreground-secondary max-w-[200px] shadow-lg z-50 leading-relaxed">
                    <strong>{formatFull(ms.d)}</strong>
                    <br />
                    {escapeHtml(ms.x)}
                  </div>
                </button>
              );
            })}

            {/* Today marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-green-600 dark:bg-green-400 z-10 opacity-50"
              style={{ left: layout.getX(today) }}
            >
              <span className="absolute top-2 left-1/2 -translate-x-1/2 bg-green-600 dark:bg-green-400 text-white px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap">
                Today
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltipData && (
        <CommitTooltip commit={tooltipData.commit} x={tooltipData.x} y={tooltipData.y} />
      )}

      {/* Summary panel */}
      {summaryOpen && (
        <SummaryPanel
          commits={computed.commits}
          milestones={computed.milestones}
          allDates={computed.allDates}
          typeCounts={computed.typeCounts}
          onClose={() => setSummaryOpen(false)}
        />
      )}
    </div>
  );
}

// --- Sub-components ---

function CommitTooltip({ commit, x, y }: { commit: Commit; x: number; y: number }) {
  const co = getTypeColor(commit.t);
  const left = x + 14 + 380 > window.innerWidth ? x - 394 : x + 14;
  const top = y + 14 + 100 > window.innerHeight ? y - 110 : y + 14;

  return (
    <div
      className="fixed z-[1000] bg-background border border-border rounded-lg px-4 py-3 max-w-[380px] shadow-xl text-xs leading-relaxed pointer-events-none"
      style={{ left, top }}
    >
      <div className="font-mono text-[10px] text-foreground-tertiary mb-1">
        {commit.h.slice(0, 8)}
      </div>
      <div className="font-semibold text-foreground mb-1.5">{commit.m}</div>
      <div className="flex items-center gap-2">
        <span
          className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold"
          style={{ background: co.bg, color: co.text }}
        >
          {commit.t}
        </span>
        {commit.s && (
          <span className="text-[10px] text-foreground-tertiary font-mono">{commit.s}</span>
        )}
        <span className="text-[10px] text-foreground-tertiary ml-auto">{formatFull(commit.d)}</span>
      </div>
    </div>
  );
}

function SummaryPanel({
  commits,
  milestones,
  allDates,
  typeCounts,
  onClose,
}: {
  commits: Commit[];
  milestones: Milestone[];
  allDates: string[];
  typeCounts: Record<string, number>;
  onClose: () => void;
}) {
  const sorted = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const maxCount = sorted[0]?.[1] || 1;

  const scopeCounts: Record<string, number> = {};
  for (const c of commits) {
    if (c.s) scopeCounts[c.s] = (scopeCounts[c.s] || 0) + 1;
  }
  const topScopes = Object.entries(scopeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  const dateCounts: Record<string, number> = {};
  for (const c of commits) dateCounts[c.d] = (dateCounts[c.d] || 0) + 1;
  const busiestDays = Object.entries(dateCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="fixed right-0 top-0 h-screen w-[340px] bg-background border-l border-border z-[200] overflow-y-auto shadow-xl animate-in slide-in-from-right duration-200">
      <div className="p-5">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-3 right-3 h-7 w-7 p-0"
        >
          x
        </Button>

        <h2 className="text-sm font-bold text-foreground mb-4">Project Summary</h2>

        <div className="space-y-1.5">
          <SummaryRow label="Total commits" value={String(commits.length)} />
          <SummaryRow label="Features added" value={String(typeCounts.feat || 0)} />
          <SummaryRow label="Bugs fixed" value={String(typeCounts.fix || 0)} />
          <SummaryRow label="Milestones" value={String(milestones.length)} />
          <SummaryRow label="Active days" value={String(allDates.length)} />
          <SummaryRow
            label="Avg commits/day"
            value={(commits.length / allDates.length).toFixed(1)}
          />
        </div>

        <h2 className="text-sm font-bold text-foreground mt-5 mb-3">Commit Types</h2>
        <div className="space-y-1">
          {sorted.map(([type, count]) => {
            const co = getTypeColor(type);
            return (
              <div key={type} className="flex items-center gap-1.5 text-[11px]">
                <span className="w-14 text-right font-medium font-mono text-[10px] shrink-0">
                  {type}
                </span>
                <div className="flex-1 h-4 bg-surface rounded overflow-hidden">
                  <div
                    className="h-full rounded flex items-center pl-1 text-[9px] font-bold text-white"
                    style={{
                      width: `${(count / maxCount) * 100}%`,
                      background: co.bg,
                    }}
                  >
                    {count}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {topScopes.length > 0 && (
          <>
            <h2 className="text-sm font-bold text-foreground mt-5 mb-3">Top Scopes</h2>
            <div className="space-y-1">
              {topScopes.map(([scope, count]) => (
                <div key={scope} className="flex items-center gap-1.5 text-[11px]">
                  <span className="w-14 text-right font-medium font-mono text-[10px] shrink-0">
                    {scope}
                  </span>
                  <div className="flex-1 h-4 bg-surface rounded overflow-hidden">
                    <div
                      className="h-full rounded flex items-center pl-1 text-[9px] font-bold text-white bg-green-600 dark:bg-green-500"
                      style={{
                        width: `${(count / (topScopes[0]?.[1] ?? 1)) * 100}%`,
                      }}
                    >
                      {count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <h2 className="text-sm font-bold text-foreground mt-5 mb-3">Busiest Days</h2>
        <div className="space-y-1.5">
          {busiestDays.map(([date, count]) => (
            <SummaryRow key={date} label={formatFull(date)} value={`${count} commits`} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 border-b border-border/50 text-xs">
      <span className="text-foreground-secondary">{label}</span>
      <span className="font-bold text-foreground">{value}</span>
    </div>
  );
}

function MobileTimeline({
  commits,
  milestones,
  types,
  typeCounts,
  activeFilters,
  toggleFilter,
  totalCommits,
  featCount,
  fixCount,
}: {
  commits: Commit[];
  milestones: Milestone[];
  types: string[];
  typeCounts: Record<string, number>;
  activeFilters: Set<string>;
  toggleFilter: (type: string) => void;
  totalCommits: number;
  featCount: number;
  fixCount: number;
}) {
  // Group commits by date, most recent first
  const byDate: Record<string, Commit[]> = {};
  for (const c of commits) {
    const arr = byDate[c.d];
    if (arr) {
      arr.push(c);
    } else {
      byDate[c.d] = [c];
    }
  }
  const dates = Object.keys(byDate).sort().reverse();

  // Build milestone lookup
  const milestoneLookup = new Map(milestones.map((ms) => [ms.d, ms]));

  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <div className="flex flex-wrap gap-3 text-xs text-foreground-secondary">
        <span>
          <strong className="text-foreground">{totalCommits}</strong> commits
        </span>
        <span>
          <strong className="text-foreground">{featCount}</strong> features
        </span>
        <span>
          <strong className="text-foreground">{fixCount}</strong> fixes
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5">
        {types.map((tp) => {
          const co = getTypeColor(tp);
          const active = activeFilters.has(tp);
          return (
            <button
              key={tp}
              type="button"
              onClick={() => toggleFilter(tp)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${
                active
                  ? 'text-white border-transparent'
                  : 'border-border bg-background text-foreground-secondary'
              }`}
              style={active ? { background: co.bg } : undefined}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: co.bg }} />
              {tp} {typeCounts[tp]}
            </button>
          );
        })}
      </div>

      {/* Vertical timeline */}
      <div className="relative pl-6 border-l-2 border-border space-y-4">
        {dates.map((date) => {
          const ms = milestoneLookup.get(date);
          return (
            <div key={date}>
              {ms && (
                <div className="mb-2 -ml-[29px] flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-foreground shrink-0" />
                  <Badge variant="default" size="sm">
                    {ms.n}
                  </Badge>
                </div>
              )}
              <div className="relative">
                <div className="absolute -left-[25px] top-1.5 w-2 h-2 rounded-full bg-border" />
                <div className="text-[10px] font-mono text-foreground-tertiary mb-1">
                  {formatFull(date)}
                </div>
                <div className="space-y-1">
                  {(byDate[date] ?? []).map((c) => {
                    const co = getTypeColor(c.t);
                    return (
                      <div key={c.h} className="flex items-start gap-2 text-xs text-foreground">
                        <span
                          className="inline-flex px-1 py-0.5 rounded text-[9px] font-bold shrink-0 mt-0.5"
                          style={{ background: co.bg, color: co.text }}
                        >
                          {c.t}
                        </span>
                        <span>{c.u || c.m}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
