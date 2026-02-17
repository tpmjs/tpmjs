/**
 * @tpmjs/official-agnt-firecrawl — Firecrawl Web Scraping Tool for AI Agents
 *
 * Scrape web content and extract it as markdown or HTML using the Firecrawl API.
 *
 * @requires FIRECRAWL_API_KEY environment variable
 */

import { jsonSchema, tool } from 'ai';

const BASE_URL = 'https://api.firecrawl.dev/v1';

// ─── Client Infrastructure ──────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) {
    throw new Error(
      'FIRECRAWL_API_KEY environment variable is required. Get your API key from https://firecrawl.dev'
    );
  }
  return key;
}

async function handleApiError(response: Response): Promise<never> {
  let errorMessage: string;
  try {
    const errorData = (await response.json()) as { error?: string; message?: string };
    errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
  } catch {
    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
  }

  switch (response.status) {
    case 401:
      throw new Error('Authentication failed: Invalid Firecrawl API key. Check FIRECRAWL_API_KEY.');
    case 402:
      throw new Error(`Payment required: ${errorMessage}`);
    case 403:
      throw new Error(`Access forbidden: ${errorMessage}`);
    case 404:
      throw new Error(`Not found: ${errorMessage}`);
    case 429:
      throw new Error(`Rate limit exceeded: ${errorMessage}`);
    default:
      throw new Error(`Firecrawl API error (${response.status}): ${errorMessage}`);
  }
}

// ─── Output Types ────────────────────────────────────────────────────────────

export interface FirecrawlScrapeResult {
  success: boolean;
  content: string;
  title: string | null;
  url: string;
  statusCode: number;
}

// ─── Raw API types ───────────────────────────────────────────────────────────

interface FirecrawlApiResponse {
  success: boolean;
  data: {
    markdown?: string;
    html?: string;
    metadata?: {
      title?: string;
      sourceURL?: string;
      statusCode?: number;
    };
  };
}

// ─── firecrawlScrape ─────────────────────────────────────────────────────────

export interface FirecrawlScrapeInput {
  url: string;
  format?: string;
}

export const firecrawlScrape = tool({
  description:
    'Scrape a URL and extract its content as markdown or HTML using Firecrawl. Returns the page title, extracted content, and status code.',
  inputSchema: jsonSchema<FirecrawlScrapeInput>({
    type: 'object',
    properties: {
      url: { type: 'string', description: 'The URL to scrape and extract content from.' },
      format: {
        type: 'string',
        description:
          'Output format for the scraped content: "markdown" or "html" (default: "markdown").',
      },
    },
    required: ['url'],
    additionalProperties: false,
  }),
  async execute(input: FirecrawlScrapeInput): Promise<FirecrawlScrapeResult> {
    try {
      if (!input.url || input.url.trim() === '') {
        throw new Error('url is required and must be non-empty');
      }

      const format = input.format ?? 'markdown';
      if (!['markdown', 'html'].includes(format)) {
        throw new Error('format must be "markdown" or "html"');
      }

      // Validate URL format
      try {
        new URL(input.url);
      } catch {
        throw new Error(`Invalid URL: ${input.url}`);
      }

      const key = getApiKey();

      const response = await fetch(`${BASE_URL}/scrape`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: input.url,
          formats: [format],
        }),
      });

      if (!response.ok) {
        await handleApiError(response);
      }

      const data = (await response.json()) as FirecrawlApiResponse;

      const content = format === 'html' ? (data.data.html ?? '') : (data.data.markdown ?? '');

      return {
        success: data.success,
        content,
        title: data.data.metadata?.title ?? null,
        url: data.data.metadata?.sourceURL ?? input.url,
        statusCode: data.data.metadata?.statusCode ?? 200,
      };
    } catch (error) {
      throw new Error(`Failed to scrape URL: ${(error as Error).message}`);
    }
  },
});
