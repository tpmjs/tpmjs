/**
 * Links Catalog Tool for TPMJS
 * Extracts and categorizes all links from web pages into:
 * - Internal links (same domain)
 * - External links (different domain)
 * - Anchor links (same page)
 *
 * @requires Node.js 18+ (uses native fetch API)
 */

import { jsonSchema, tool } from 'ai';
import * as cheerio from 'cheerio';

// Verify fetch is available (Node.js 18+)
if (typeof globalThis.fetch !== 'function') {
  throw new Error('Links Catalog tool requires Node.js 18+ with native fetch support');
}

/**
 * Represents a single link with its text and href
 */
export interface Link {
  href: string;
  text: string;
  title?: string;
}

/**
 * Output interface for links catalog
 */
export interface LinksCatalog {
  url: string;
  internal: Link[];
  external: Link[];
  anchors: Link[];
  total: number;
  metadata: {
    fetchedAt: string;
    domain: string;
  };
}

type LinksCatalogInput = {
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
 * Normalizes a URL by resolving it relative to the base URL
 */
function normalizeUrl(href: string, baseUrl: string): string {
  try {
    // Handle empty or invalid hrefs
    if (!href || href.trim() === '') return '';

    // Remove whitespace
    href = href.trim();

    // Skip non-http protocols (mailto, tel, javascript, etc.)
    if (
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('javascript:') ||
      href.startsWith('data:')
    ) {
      return '';
    }

    // Resolve relative URLs
    const url = new URL(href, baseUrl);
    return url.href;
  } catch {
    return '';
  }
}

/**
 * Categorizes a link as internal, external, or anchor
 */
function categorizeLink(
  href: string,
  baseDomain: string
): 'internal' | 'external' | 'anchor' | 'skip' {
  // Skip empty hrefs
  if (!href) return 'skip';

  // Anchor links start with #
  if (href.startsWith('#')) return 'anchor';

  try {
    const url = new URL(href);

    // Check if same domain
    if (url.hostname === baseDomain) {
      // If it has a hash but same page, treat as anchor
      if (url.hash && url.pathname === new URL(href).pathname) {
        return 'anchor';
      }
      return 'internal';
    }

    return 'external';
  } catch {
    return 'skip';
  }
}

/**
 * Links Catalog Tool
 * Fetches a URL and extracts all links, categorized by type
 */
export const linksCatalogTool = tool({
  description:
    'Extract and categorize all links from a web page. Links are organized into three categories: internal (same domain), external (different domain), and anchors (same page). Each link includes its href, visible text, and optional title attribute. Useful for SEO analysis, site mapping, and understanding page structure.',
  inputSchema: jsonSchema<LinksCatalogInput>({
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to fetch and extract links from (must be http or https)',
      },
    },
    required: ['url'],
    additionalProperties: false,
  }),
  async execute({ url }): Promise<LinksCatalog> {
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
    const baseDomain = extractDomain(url);

    // Extract all links
    const internal: Link[] = [];
    const external: Link[] = [];
    const anchors: Link[] = [];
    const seen = new Set<string>(); // Deduplicate links

    $('a[href]').each((_, element) => {
      const $link = $(element);
      const rawHref = $link.attr('href');
      if (!rawHref) return;

      // Normalize the URL
      const normalizedHref = normalizeUrl(rawHref, url);
      if (!normalizedHref) return;

      // Skip duplicates
      const dedupeKey = normalizedHref.toLowerCase();
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);

      // Extract link text and title
      const text = $link.text().trim() || '[No text]';
      const title = $link.attr('title');

      const link: Link = {
        href: normalizedHref,
        text: text.substring(0, 200), // Limit text length
        ...(title && { title }),
      };

      // Categorize the link
      const category = categorizeLink(normalizedHref, baseDomain);
      switch (category) {
        case 'internal':
          internal.push(link);
          break;
        case 'external':
          external.push(link);
          break;
        case 'anchor':
          anchors.push(link);
          break;
        // 'skip' is ignored
      }
    });

    const total = internal.length + external.length + anchors.length;

    return {
      url,
      internal,
      external,
      anchors,
      total,
      metadata: {
        fetchedAt: new Date().toISOString(),
        domain: baseDomain,
      },
    };
  },
});

export default linksCatalogTool;
