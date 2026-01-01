/**
 * RSS Read Tool for TPMJS
 * Parses RSS/Atom feeds from a URL and returns feed metadata and items
 *
 * @requires Node.js 18+ (uses native fetch API)
 */

import { jsonSchema, tool } from 'ai';
import Parser from 'rss-parser';

// Verify fetch is available (Node.js 18+)
if (typeof globalThis.fetch !== 'function') {
  throw new Error('RSS Read tool requires Node.js 18+ with native fetch support');
}

/**
 * Feed item interface
 */
export interface RssFeedItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  author?: string;
  categories?: string[];
  guid?: string;
}

/**
 * Feed metadata interface
 */
export interface RssFeedMetadata {
  title: string;
  link: string;
  description?: string;
  language?: string;
  lastBuildDate?: string;
  imageUrl?: string;
}

/**
 * Output interface for the RSS feed
 */
export interface RssFeed {
  feed: RssFeedMetadata;
  items: RssFeedItem[];
  itemCount: number;
  metadata: {
    fetchedAt: string;
    feedType: string;
    totalItems: number;
    limitApplied: boolean;
  };
}

type RssReadInput = {
  url: string;
  limit?: number;
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
 * Converts various date formats to ISO string
 * Domain rule: date_handling - Must parse various date formats to ISO strings
 */
function normalizeToIsoDate(dateStr: string | undefined): string | undefined {
  if (!dateStr) return undefined;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr; // Return original if parsing fails
    return date.toISOString();
  } catch {
    return dateStr; // Return original on error
  }
}

/**
 * Sanitizes HTML content to plain text
 */
function sanitizeHtml(html: string | undefined): string | undefined {
  if (!html) return undefined;
  // Remove HTML tags and decode entities
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * RSS Read Tool
 * Parses RSS/Atom feeds and returns feed metadata with items
 */
export const rssReadTool = tool({
  description:
    'Parse RSS or Atom feeds from a URL and extract feed metadata (title, link, description) and feed items (title, link, description, pubDate, author). Useful for reading blog feeds, news feeds, podcasts, and other syndicated content.',
  inputSchema: jsonSchema<RssReadInput>({
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The RSS or Atom feed URL to parse (must be http or https)',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of items to return (default: 20, max: 100)',
        default: 20,
      },
    },
    required: ['url'],
    additionalProperties: false,
  }),
  async execute({ url, limit = 20 }): Promise<RssFeed> {
    // Validate URL
    if (!url || typeof url !== 'string') {
      throw new Error('URL is required and must be a string');
    }

    if (!isValidUrl(url)) {
      throw new Error(`Invalid URL: ${url}. Must be a valid http or https URL.`);
    }

    // Validate and cap limit
    const effectiveLimit = Math.min(Math.max(1, limit || 20), 100);

    // Create parser instance
    const parser = new Parser({
      timeout: 30000, // 30 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TPMJSBot/1.0; +https://tpmjs.com)',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
      },
    });

    // Parse the feed
    let feed: Parser.Output<Record<string, unknown>>;
    try {
      feed = await parser.parseURL(url);
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific error cases
        if (error.message.includes('Status code 404')) {
          throw new Error(`Feed not found at ${url}. The feed URL may be incorrect.`);
        }
        if (error.message.includes('Status code 403')) {
          throw new Error(`Access forbidden to ${url}. The feed may block automated access.`);
        }
        if (error.message.includes('Status code 500')) {
          throw new Error(`Server error at ${url}. The feed server may be having issues.`);
        }
        if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
          throw new Error(`DNS resolution failed for ${url}. Check the domain name.`);
        }
        if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
          throw new Error(`Request to ${url} timed out after 30 seconds`);
        }
        if (error.message.includes('Invalid feed')) {
          throw new Error(
            `Invalid feed format at ${url}. The URL may not point to a valid RSS/Atom feed.`
          );
        }
        throw new Error(`Failed to parse feed from ${url}: ${error.message}`);
      }
      throw new Error(`Failed to parse feed from ${url}: Unknown error`);
    }

    // Validate feed has items
    if (!feed.items || feed.items.length === 0) {
      throw new Error(
        `Feed at ${url} has no items. The feed may be empty or improperly formatted.`
      );
    }

    // Extract feed metadata
    const feedAny = feed as unknown as Record<string, unknown>;
    const feedMetadata: RssFeedMetadata = {
      title: feed.title || 'Untitled Feed',
      link: feed.link || url,
      description: sanitizeHtml(feed.description),
      language: feedAny.language as string | undefined,
      lastBuildDate: feedAny.lastBuildDate as string | undefined,
      imageUrl:
        feed.image?.url ||
        ((feedAny.itunes as Record<string, unknown> | undefined)?.image as string | undefined),
    };

    // Extract and transform feed items
    const totalItems = feed.items.length;
    const items: RssFeedItem[] = feed.items
      .slice(0, effectiveLimit)
      .map((item: Record<string, unknown>) => ({
        title: (item.title as string) || 'Untitled',
        link: (item.link as string) || '',
        description: sanitizeHtml(
          (item.contentSnippet as string) || (item.content as string) || (item.summary as string)
        ),
        // Domain rule: date_handling - Normalize pubDate to ISO format
        pubDate: normalizeToIsoDate((item.pubDate as string) || (item.isoDate as string)),
        author: (item.creator as string) || (item.author as string),
        categories: item.categories as string[] | undefined,
        guid: (item.guid as string) || (item.id as string),
      }));

    // Determine feed type
    let feedType = 'RSS';
    if (feed.feedUrl?.includes('atom') || url.includes('atom')) {
      feedType = 'Atom';
    }

    return {
      feed: feedMetadata,
      items,
      itemCount: items.length,
      metadata: {
        fetchedAt: new Date().toISOString(),
        feedType,
        totalItems,
        limitApplied: totalItems > effectiveLimit,
      },
    };
  },
});

export default rssReadTool;
