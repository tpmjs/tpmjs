'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@tpmjs/ui/Card/Card';
import { useBundleSize } from '~/hooks/useBundleSize';

interface BundleSizeProps {
  packageName: string;
  version: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'kB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

export function BundleSize({ packageName, version }: BundleSizeProps): React.ReactElement | null {
  const { data, isLoading: loading, error } = useBundleSize(packageName, version);

  // Don't render anything if package not found (common for scoped packages) or error
  if (error || (!loading && !data)) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bundle Size</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-4 bg-muted rounded w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bundle Size</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-foreground-secondary">Minified</span>
          <span className="text-sm font-mono font-medium text-foreground">
            {formatBytes(data.size)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-foreground-secondary">Gzipped</span>
          <span className="text-sm font-mono font-medium text-foreground">
            {formatBytes(data.gzip)}
          </span>
        </div>
        {data.dependencyCount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-foreground-secondary">Dependencies</span>
            <span className="text-sm font-mono font-medium text-foreground">
              {data.dependencyCount}
            </span>
          </div>
        )}
        <a
          href={`https://bundlephobia.com/package/${packageName}@${version}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-foreground-tertiary hover:text-foreground-secondary pt-2"
        >
          <span>View on Bundlephobia →</span>
        </a>
      </CardContent>
    </Card>
  );
}
