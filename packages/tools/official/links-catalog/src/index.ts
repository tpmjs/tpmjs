/**
 * Links Catalog Tool for TPMJS
 * Extracts and categorizes all links from HTML content into:
 * - Internal links (same domain)
 * - External links (different domain)
 * - Anchor links (same page)
 */

import { jsonSchema, tool } from 'ai';
import * as cheerio from 'cheerio';

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
  html: string;
  baseUrl: string;
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
 * Extracts all links from HTML content, categorized by type
 */
export const linksCatalogTool = tool({
  description:
    'Extract and categorize all links from HTML content. Links are organized into three categories: internal (same domain), external (different domain), and anchors (same page). Each link includes its href, visible text, and optional title attribute. Useful for SEO analysis, site mapping, and understanding page structure.',
  inputSchema: jsonSchema<LinksCatalogInput>({
    type: 'object',
    properties: {
      html: {
        type: 'string',
        description: 'The HTML content to parse',
      },
      baseUrl: {
        type: 'string',
        description: 'The base URL for resolution and classification (must be http or https)',
      },
    },
    required: ['html', 'baseUrl'],
    additionalProperties: false,
  }),
  async execute({ html, baseUrl }): Promise<LinksCatalog> {
    // Validate inputs
    if (!html || typeof html !== 'string') {
      throw new Error('HTML is required and must be a string');
    }

    if (!baseUrl || typeof baseUrl !== 'string') {
      throw new Error('baseUrl is required and must be a string');
    }

    if (!isValidUrl(baseUrl)) {
      throw new Error(`Invalid baseUrl: ${baseUrl}. Must be a valid http or https URL.`);
    }

    if (html.trim().length === 0) {
      throw new Error('HTML content cannot be empty');
    }

    // Parse HTML with cheerio
    const $ = cheerio.load(html);
    const baseDomain = extractDomain(baseUrl);

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
      const normalizedHref = normalizeUrl(rawHref, baseUrl);
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
      url: baseUrl,
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
