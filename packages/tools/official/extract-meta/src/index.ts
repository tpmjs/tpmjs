/**
 * Extract Meta Tool for TPMJS
 * Extracts meta tags from HTML pages including title, description,
 * Open Graph tags, and Twitter Card tags.
 * Uses cheerio for efficient HTML parsing.
 *
 * @requires Node.js 18+ (uses native fetch API)
 */

import { jsonSchema, tool } from 'ai';
import * as cheerio from 'cheerio';

// Verify fetch is available (Node.js 18+)
if (typeof globalThis.fetch !== 'function') {
  throw new Error('Extract Meta tool requires Node.js 18+ with native fetch support');
}

/**
 * Output interface for extracted meta tags
 */
export interface ExtractMetaResult {
  title: string | null;
  description: string | null;
  canonical: string | null;
  ogTags: Record<string, string>;
  twitterTags: Record<string, string>;
  metadata: {
    url: string;
    fetchedAt: string;
    contentType: string;
    hasOpenGraph: boolean;
    hasTwitterCard: boolean;
  };
}

type ExtractMetaInput = {
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
 * Extracts Open Graph meta tags
 */
function extractOpenGraphTags($: cheerio.Root): Record<string, string> {
  const ogTags: Record<string, string> = {};

  $('meta[property^="og:"]').each((_: number, element: cheerio.Element) => {
    const property = $(element).attr('property');
    const content = $(element).attr('content');

    if (property && content) {
      // Remove 'og:' prefix for cleaner keys
      const key = property.replace(/^og:/, '');
      ogTags[key] = content;
    }
  });

  return ogTags;
}

/**
 * Extracts Twitter Card meta tags
 */
function extractTwitterTags($: cheerio.Root): Record<string, string> {
  const twitterTags: Record<string, string> = {};

  $('meta[name^="twitter:"]').each((_: number, element: cheerio.Element) => {
    const name = $(element).attr('name');
    const content = $(element).attr('content');

    if (name && content) {
      // Remove 'twitter:' prefix for cleaner keys
      const key = name.replace(/^twitter:/, '');
      twitterTags[key] = content;
    }
  });

  return twitterTags;
}

/**
 * Extract Meta Tool
 * Extracts meta tags from HTML pages
 */
export const extractMetaTool = tool({
  description:
    'Extract meta tags from HTML pages including title, description, canonical URL, Open Graph tags (og:title, og:description, og:image, etc.), and Twitter Card tags (twitter:card, twitter:title, twitter:image, etc.). Useful for SEO analysis, social media previews, and understanding page metadata.',
  inputSchema: jsonSchema<ExtractMetaInput>({
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to extract meta tags from (must be http or https)',
      },
    },
    required: ['url'],
    additionalProperties: false,
  }),
  async execute({ url }): Promise<ExtractMetaResult> {
    // Validate URL
    if (!url || typeof url !== 'string') {
      throw new Error('URL is required and must be a string');
    }

    if (!isValidUrl(url)) {
      throw new Error(`Invalid URL: ${url}. Must be a valid http or https URL.`);
    }

    // Fetch the page
    let html: string;
    let contentType: string;

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

      contentType = response.headers.get('content-type') || 'unknown';

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

    // Extract title (try multiple sources)
    let title: string | null = null;
    const titleElement = $('head > title').first();
    if (titleElement.length > 0) {
      title = titleElement.text().trim();
    }

    // Extract description
    let description: string | null = null;
    const descriptionElement = $('meta[name="description"]').first();
    if (descriptionElement.length > 0) {
      description = descriptionElement.attr('content') || null;
    }

    // Extract canonical URL
    let canonical: string | null = null;
    const canonicalElement = $('link[rel="canonical"]').first();
    if (canonicalElement.length > 0) {
      canonical = canonicalElement.attr('href') || null;
    }

    // Extract Open Graph tags
    const ogTags = extractOpenGraphTags($);

    // Extract Twitter Card tags
    const twitterTags = extractTwitterTags($);

    // Use OG tags as fallbacks if standard tags are missing
    if (!title && ogTags.title) {
      title = ogTags.title;
    }
    if (!description && ogTags.description) {
      description = ogTags.description;
    }

    // Build result
    const result: ExtractMetaResult = {
      title,
      description,
      canonical,
      ogTags,
      twitterTags,
      metadata: {
        url,
        fetchedAt: new Date().toISOString(),
        contentType,
        hasOpenGraph: Object.keys(ogTags).length > 0,
        hasTwitterCard: Object.keys(twitterTags).length > 0,
      },
    };

    return result;
  },
});

export default extractMetaTool;
