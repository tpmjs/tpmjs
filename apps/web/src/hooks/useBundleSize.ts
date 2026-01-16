import useSWR from 'swr';

export interface BundleSizeData {
  name: string;
  version: string;
  size: number;
  gzip: number;
  dependencyCount: number;
}

/**
 * Fetch bundle size data from bundlephobia API
 * Returns null for the key if packageName is not provided (disables fetching)
 */
export function useBundleSize(packageName: string | undefined, version?: string) {
  const params = new URLSearchParams();
  if (packageName) {
    params.set('package', packageName);
    if (version) {
      params.set('version', version);
    }
  }

  return useSWR<BundleSizeData>(
    packageName ? `/api/bundlephobia?${params.toString()}` : null,
    {
      // Don't retry on 404s (common for scoped packages)
      shouldRetryOnError: false,
    }
  );
}
