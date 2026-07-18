/**
 * NPM Download Statistics Client
 * Fetches download counts from NPM statistics API
 */

import { z } from 'zod';

const NPM_DOWNLOADS_URL = 'https://api.npmjs.org/downloads';

/**
 * Schema for downloads response
 */
const DownloadsResponseSchema = z.object({
  downloads: z.number(),
  start: z.string(),
  end: z.string(),
  package: z.string(),
});

export type DownloadsResponse = z.infer<typeof DownloadsResponseSchema>;

const RETRYABLE_STATUSES = new Set([429, 502, 503]);
const MAX_ATTEMPTS = 3;

function retryDelayMs(response: Response, attempt: number): number {
  const retryAfter = Number(response.headers.get('retry-after'));
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return Math.min(retryAfter * 1000, 30_000);
  }
  return 2 ** attempt * 1000; // 1s, 2s, 4s...
}

/**
 * Fetches download statistics for a package.
 *
 * Returns the download count, `0` when the package has no download data
 * (404), or `null` when the API is unavailable/rate-limited after retries —
 * callers must treat `null` as "unknown, keep the previous value", never as
 * zero downloads.
 */
export async function fetchDownloadStats(
  packageName: string,
  period: 'last-day' | 'last-week' | 'last-month' | 'last-year' = 'last-month'
): Promise<number | null> {
  const url = `${NPM_DOWNLOADS_URL}/point/${period}/${packageName}`;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.status === 404) {
        // Package not found or no download data
        return 0;
      }

      if (RETRYABLE_STATUSES.has(response.status) && attempt < MAX_ATTEMPTS - 1) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs(response, attempt)));
        continue;
      }

      if (!response.ok) {
        console.warn(
          `NPM downloads API error for ${packageName}: ${response.status} ${response.statusText}`
        );
        return null;
      }

      const data = await response.json();
      const parsed = DownloadsResponseSchema.parse(data);

      return parsed.downloads;
    } catch (error) {
      if (attempt < MAX_ATTEMPTS - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 1000));
        continue;
      }
      console.warn(`Failed to fetch download stats for ${packageName}:`, error);
      return null;
    }
  }

  return null;
}

/**
 * Fetches download statistics for multiple packages in bulk
 * Note: NPM API doesn't have a native bulk endpoint, so this makes individual requests
 * Use with rate limiting to avoid overwhelming the API
 *
 * Packages whose stats could not be fetched (API unavailable/rate-limited)
 * are omitted from the result map rather than recorded as 0.
 */
export async function fetchBulkDownloadStats(
  packageNames: string[],
  period: 'last-day' | 'last-week' | 'last-month' | 'last-year' = 'last-month'
): Promise<Map<string, number>> {
  const results = new Map<string, number>();

  // Process in batches to avoid overwhelming the API
  for (const packageName of packageNames) {
    const downloads = await fetchDownloadStats(packageName, period);
    if (downloads !== null) {
      results.set(packageName, downloads);
    }
  }

  return results;
}
