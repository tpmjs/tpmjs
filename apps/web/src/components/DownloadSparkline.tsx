'use client';

import { useEffect, useState } from 'react';

interface DownloadDay {
  downloads: number;
  day: string;
}

interface DownloadSparklineProps {
  packageName: string;
}

export function DownloadSparkline({ packageName }: DownloadSparklineProps): React.ReactElement {
  const [downloads, setDownloads] = useState<DownloadDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchDownloads = async () => {
      setLoading(true);
      setError(false);

      try {
        const response = await fetch(
          `https://api.npmjs.org/downloads/range/last-month/${encodeURIComponent(packageName)}`
        );

        if (!response.ok) {
          setError(true);
          return;
        }

        const data = await response.json();
        setDownloads(data.downloads || []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDownloads();
  }, [packageName]);

  if (loading) {
    return <div className="h-8 w-full animate-pulse bg-muted rounded" />;
  }

  if (error || downloads.length === 0) {
    return <div className="h-8" />;
  }

  // Calculate sparkline path
  const values = downloads.map((d) => d.downloads);
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = max - min || 1;

  const width = 200;
  const height = 32;
  const padding = 2;

  const points = values.map((value, index) => {
    const x = padding + (index / (values.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  // Calculate trend (compare first week vs last week)
  const firstWeek = values.slice(0, 7).reduce((a, b) => a + b, 0);
  const lastWeek = values.slice(-7).reduce((a, b) => a + b, 0);
  const trendUp = lastWeek > firstWeek;
  const trendPercent = firstWeek > 0 ? Math.round(((lastWeek - firstWeek) / firstWeek) * 100) : 0;

  return (
    <div className="space-y-1">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-8"
        preserveAspectRatio="none"
        role="img"
        aria-label="Download trend over the last 30 days"
      >
        {/* Gradient fill under the line */}
        <defs>
          <linearGradient
            id={`sparkline-gradient-${packageName.replace(/[^a-z0-9]/gi, '-')}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path
          d={`${pathD} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`}
          fill={`url(#sparkline-gradient-${packageName.replace(/[^a-z0-9]/gi, '-')})`}
          className="text-primary"
        />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
        />
      </svg>

      {/* Trend indicator */}
      {Math.abs(trendPercent) >= 5 && (
        <div
          className={`text-xs flex items-center gap-1 ${trendUp ? 'text-emerald-500' : 'text-red-500'}`}
        >
          <span>{trendUp ? '↑' : '↓'}</span>
          <span>{Math.abs(trendPercent)}% vs last week</span>
        </div>
      )}
    </div>
  );
}
