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

/**
 * Fetches download statistics for a package
 * @param packageName - The name of the package
 * @param period - Time period (default: 'last-month')
 * @returns The download count, or 0 if not found
 */
export async function fetchDownloadStats(
  packageName: string,
  period: 'last-day' | 'last-week' | 'last-month' | 'last-year' = 'last-month'
): Promise<number> {
  const url = `${NPM_DOWNLOADS_URL}/point/${period}/${packageName}`;

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

    if (!response.ok) {
      throw new Error(`NPM downloads API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const parsed = DownloadsResponseSchema.parse(data);

    return parsed.downloads;
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return 0;
    }
    throw error;
  }
}

/**
 * Fetches download statistics for multiple packages in bulk
 * Note: NPM API doesn't have a native bulk endpoint, so this makes individual requests
 * Use with rate limiting to avoid overwhelming the API
 */
export async function fetchBulkDownloadStats(
  packageNames: string[],
  period: 'last-day' | 'last-week' | 'last-month' | 'last-year' = 'last-month'
): Promise<Map<string, number>> {
  const results = new Map<string, number>();

  // Process in batches to avoid overwhelming the API
  for (const packageName of packageNames) {
    try {
      const downloads = await fetchDownloadStats(packageName, period);
      results.set(packageName, downloads);
    } catch (error) {
      console.error(`Failed to fetch stats for ${packageName}:`, error);
      results.set(packageName, 0);
    }
  }

  return results;
}
