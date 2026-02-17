/**
 * @tpmjs/official-agnt-google-search — Google Custom Search API Tools for AI Agents
 *
 * Search the web using Google Custom Search and return structured results
 * with titles, links, and snippets.
 *
 * @requires GOOGLE_SEARCH_API_KEY environment variable
 * @requires GOOGLE_SEARCH_ENGINE_ID environment variable
 */

import { jsonSchema, tool } from 'ai';

const BASE_URL = 'https://www.googleapis.com/customsearch/v1';

// ─── Client Infrastructure ──────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.GOOGLE_SEARCH_API_KEY;
  if (!key) {
    throw new Error(
      'GOOGLE_SEARCH_API_KEY environment variable is required. Get your API key from https://console.cloud.google.com/apis/credentials'
    );
  }
  return key;
}

function getSearchEngineId(): string {
  const id = process.env.GOOGLE_SEARCH_ENGINE_ID;
  if (!id) {
    throw new Error(
      'GOOGLE_SEARCH_ENGINE_ID environment variable is required. Create a search engine at https://programmablesearchengine.google.com/'
    );
  }
  return id;
}

// ─── Output Types ────────────────────────────────────────────────────────────

export interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
}

export interface GoogleSearchResponse {
  results: GoogleSearchResult[];
  totalResults: string;
  searchTime: number;
  query: string;
}

// ─── Google Search Tool ─────────────────────────────────────────────────────

export interface GoogleSearchInput {
  query: string;
  numResults?: number;
  sort?: string;
}

export const googleSearch = tool({
  description:
    'Search the web using Google Custom Search API. Returns top results with titles, links, and snippets.',
  inputSchema: jsonSchema<GoogleSearchInput>({
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query to execute.',
      },
      numResults: {
        type: 'number',
        description: 'Number of results to return (1-10, default: 3).',
      },
      sort: {
        type: 'string',
        description:
          'Sort order: "date" for recency or "relevance" for best match (default: relevance).',
      },
    },
    required: ['query'],
    additionalProperties: false,
  }),
  async execute(input: GoogleSearchInput): Promise<GoogleSearchResponse> {
    try {
      if (!input.query || input.query.trim().length === 0) {
        throw new Error('query is required and must be non-empty');
      }

      const numResults = input.numResults ?? 3;
      if (numResults < 1 || numResults > 10) {
        throw new Error('numResults must be between 1 and 10');
      }

      if (input.sort !== undefined && input.sort !== 'date' && input.sort !== 'relevance') {
        throw new Error('sort must be "date" or "relevance"');
      }

      const apiKey = getApiKey();
      const searchEngineId = getSearchEngineId();

      const params = new URLSearchParams({
        key: apiKey,
        cx: searchEngineId,
        q: input.query,
        num: String(numResults),
      });

      if (input.sort === 'date') {
        params.set('sort', 'date');
      }

      const response = await fetch(`${BASE_URL}?${params.toString()}`);

      if (!response.ok) {
        let errorMessage: string;
        try {
          const errorData = (await response.json()) as {
            error?: { message?: string; code?: number };
          };
          errorMessage = errorData.error?.message || `HTTP ${response.status}`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }

        switch (response.status) {
          case 400:
            throw new Error(`Bad request: ${errorMessage}`);
          case 401:
            throw new Error('Authentication failed: Invalid API key. Check GOOGLE_SEARCH_API_KEY.');
          case 403:
            throw new Error(
              `Access forbidden or quota exceeded: ${errorMessage}. Check your API quota at https://console.cloud.google.com/`
            );
          case 429:
            throw new Error(`Rate limit exceeded: ${errorMessage}`);
          default:
            throw new Error(`Google Search API error (${response.status}): ${errorMessage}`);
        }
      }

      const data = (await response.json()) as {
        items?: Array<{ title: string; link: string; snippet: string }>;
        searchInformation?: { totalResults: string; searchTime: number };
      };

      const results: GoogleSearchResult[] = (data.items ?? []).map((item) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
      }));

      return {
        results,
        totalResults: data.searchInformation?.totalResults ?? '0',
        searchTime: data.searchInformation?.searchTime ?? 0,
        query: input.query,
      };
    } catch (error) {
      throw new Error(`Failed to execute Google search: ${(error as Error).message}`);
    }
  },
});
