/**
 * NPM Keyword Search Client
 * Searches NPM registry by keyword to find packages
 */

import { z } from 'zod';

const NPM_SEARCH_URL = 'https://registry.npmjs.org/-/v1/search';

/**
 * Schema for search result package
 */
const SearchPackageSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  date: z.string().optional(),
  links: z
    .object({
      npm: z.string().optional(),
      homepage: z.string().optional(),
      repository: z.string().optional(),
      bugs: z.string().optional(),
    })
    .optional(),
  author: z
    .object({
      name: z.string(),
      email: z.string().optional(),
    })
    .optional(),
  publisher: z
    .object({
      username: z.string(),
      email: z.string(),
    })
    .optional(),
  maintainers: z
    .array(
      z.object({
        username: z.string(),
        email: z.string(),
      })
    )
    .optional(),
});

/**
 * Schema for search result object
 */
const SearchResultSchema = z.object({
  package: SearchPackageSchema,
  score: z
    .object({
      final: z.number(),
      detail: z
        .object({
          quality: z.number(),
          popularity: z.number(),
          maintenance: z.number(),
        })
        .optional(),
    })
    .optional(),
  searchScore: z.number().optional(),
});

/**
 * Schema for search response
 */
const SearchResponseSchema = z.object({
  objects: z.array(SearchResultSchema),
  total: z.number(),
  time: z.string().optional(),
});

export type SearchPackage = z.infer<typeof SearchPackageSchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;

export interface SearchByKeywordOptions {
  /** The keyword to search for */
  keyword: string;
  /** Number of results to return (default: 250, max: 250) */
  size?: number;
  /** Offset for pagination (default: 0) */
  from?: number;
}

/**
 * Searches NPM registry by keyword
 * @param options - Search options
 * @returns Array of matching packages
 */
export async function searchByKeyword(options: SearchByKeywordOptions): Promise<SearchResult[]> {
  const { keyword, size = 250, from = 0 } = options;

  const url = new URL(NPM_SEARCH_URL);
  url.searchParams.set('text', `keywords:${keyword}`);
  url.searchParams.set('size', String(Math.min(size, 250))); // NPM max is 250
  url.searchParams.set('from', String(from));

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`NPM search error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const parsed = SearchResponseSchema.parse(data);

  return parsed.objects;
}

/**
 * Searches for all packages with a specific keyword
 * Handles pagination automatically to get all results
 */
export async function searchAllByKeyword(keyword: string): Promise<SearchResult[]> {
  const allResults: SearchResult[] = [];
  let from = 0;
  const size = 250;

  while (true) {
    const results = await searchByKeyword({ keyword, size, from });

    if (results.length === 0) {
      break;
    }

    allResults.push(...results);

    // If we got less than the page size, we're done
    if (results.length < size) {
      break;
    }

    from += size;
  }

  return allResults;
}
