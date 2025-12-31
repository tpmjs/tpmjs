/**
 * Extract JSON-LD Tool for TPMJS
 * Extracts JSON-LD structured data from web pages by parsing
 * <script type="application/ld+json"> tags.
 *
 * @requires Node.js 18+ (uses native fetch API)
 */

import { jsonSchema, tool } from 'ai';
import * as cheerio from 'cheerio';

// Verify fetch is available (Node.js 18+)
if (typeof globalThis.fetch !== 'function') {
  throw new Error('Extract JSON-LD tool requires Node.js 18+ with native fetch support');
}

/**
 * Output interface for JSON-LD extraction
 */
export interface JsonLdExtraction {
  url: string;
  jsonLd: Array<Record<string, unknown>>;
  types: string[];
  count: number;
  metadata: {
    fetchedAt: string;
    domain: string;
  };
}

type JsonLdInput = {
  url: string;
};

/**
 * Validates that a string is a valid URL
 */
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Extracts domain from URL
 */
function extractDomain(urlString: string): string {
  try {
    const url = new URL(urlString);
    return url.hostname;
  } catch {
    return 'unknown';
  }
}

/**
 * Extracts @type values from JSON-LD objects
 */
function extractTypes(jsonLdData: Array<Record<string, unknown>>): string[] {
  const types = new Set<string>();

  function extractTypeRecursive(obj: unknown): void {
    if (typeof obj !== 'object' || obj === null) return;

    if (Array.isArray(obj)) {
      for (const item of obj) {
        extractTypeRecursive(item);
      }
      return;
    }

    const record = obj as Record<string, unknown>;

    // Extract @type field
    if ('@type' in record) {
      const typeValue = record['@type'];
      if (typeof typeValue === 'string') {
        types.add(typeValue);
      } else if (Array.isArray(typeValue)) {
        for (const t of typeValue) {
          if (typeof t === 'string') {
            types.add(t);
          }
        }
      }
    }

    // Recursively check nested objects
    for (const value of Object.values(record)) {
      if (typeof value === 'object' && value !== null) {
        extractTypeRecursive(value);
      }
    }
  }

  for (const data of jsonLdData) {
    extractTypeRecursive(data);
  }

  return Array.from(types).sort();
}

/**
 * Extract JSON-LD Tool
 * Fetches a URL and extracts all JSON-LD structured data
 */
export const extractJsonLdTool = tool({
  description:
    'Extract JSON-LD structured data from web pages. Parses all <script type="application/ld+json"> tags and returns the structured data along with detected schema types. Useful for SEO analysis, extracting metadata, and understanding page structure.',
  inputSchema: jsonSchema<JsonLdInput>({
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to fetch and extract JSON-LD from (must be http or https)',
      },
    },
    required: ['url'],
    additionalProperties: false,
  }),
  async execute({ url }): Promise<JsonLdExtraction> {
    // Validate URL
    if (!url || typeof url !== 'string') {
      throw new Error('URL is required and must be a string');
    }

    if (!isValidUrl(url)) {
      throw new Error(`Invalid URL: ${url}. Must be a valid http or https URL.`);
    }

    // Fetch the page
    let html: string;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TPMJSBot/1.0; +https://tpmjs.com)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        throw new Error(`Invalid content type: ${contentType}. Expected HTML content.`);
      }

      html = await response.text();

      if (!html || html.trim().length === 0) {
        throw new Error('Received empty response from server');
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request to ${url} timed out after 30 seconds`);
        }
        if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
          throw new Error(`DNS resolution failed for ${url}. Check the domain name.`);
        }
        if (error.message.includes('ECONNREFUSED')) {
          throw new Error(`Connection refused to ${url}. The server may be down.`);
        }
        if (error.message.includes('CERT_')) {
          throw new Error(
            `SSL certificate error for ${url}. The site may have an invalid certificate.`
          );
        }
        throw new Error(`Failed to fetch URL ${url}: ${error.message}`);
      }
      throw new Error(`Failed to fetch URL ${url}: Unknown network error`);
    }

    // Parse HTML with cheerio
    const $ = cheerio.load(html);

    // Extract all JSON-LD script tags
    const jsonLdScripts = $('script[type="application/ld+json"]');
    const jsonLdData: Array<Record<string, unknown>> = [];

    jsonLdScripts.each((_, element) => {
      const scriptContent = $(element).html();
      if (!scriptContent) return;

      try {
        const parsed = JSON.parse(scriptContent);
        // Handle both single objects and arrays
        if (Array.isArray(parsed)) {
          jsonLdData.push(...parsed);
        } else {
          jsonLdData.push(parsed);
        }
      } catch (error) {
        // Skip invalid JSON, but don't fail the entire extraction
        console.warn(`Failed to parse JSON-LD script: ${error}`);
      }
    });

    // Extract all @type values
    const types = extractTypes(jsonLdData);

    return {
      url,
      jsonLd: jsonLdData,
      types,
      count: jsonLdData.length,
      metadata: {
        fetchedAt: new Date().toISOString(),
        domain: extractDomain(url),
      },
    };
  },
});

export default extractJsonLdTool;
