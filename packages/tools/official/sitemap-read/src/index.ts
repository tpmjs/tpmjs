/**
 * Sitemap Read Tool for TPMJS
 * Parses XML sitemaps (both regular sitemaps and sitemap indexes) and extracts URLs
 *
 * @requires Node.js 18+ (uses native fetch API)
 */

import { jsonSchema, tool } from 'ai';
import { XMLParser } from 'fast-xml-parser';

// Verify fetch is available (Node.js 18+)
if (typeof globalThis.fetch !== 'function') {
  throw new Error('Sitemap Read tool requires Node.js 18+ with native fetch support');
}

/**
 * Sitemap URL entry interface
 */
export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

/**
 * Sitemap index entry interface
 */
export interface SitemapIndexEntry {
  loc: string;
  lastmod?: string;
}

/**
 * Output interface for the sitemap
 */
export interface Sitemap {
  urls: SitemapUrl[];
  isSitemapIndex: boolean;
  urlCount: number;
  sitemapIndexUrls?: SitemapIndexEntry[];
  metadata: {
    fetchedAt: string;
    sourceUrl: string;
    type: 'urlset' | 'sitemapindex';
  };
}

type SitemapReadInput = {
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
 * Normalizes URL array - handles both single objects and arrays
 */
function normalizeUrlArray<T>(data: T | T[] | undefined): T[] {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
}

/**
 * Sitemap Read Tool
 * Parses XML sitemaps and returns URLs
 */
export const sitemapReadTool = tool({
  description:
    'Parse XML sitemaps (sitemap.xml) and extract URLs. Handles both regular sitemaps (urlset) and sitemap indexes (sitemapindex). Returns URL locations with optional metadata like lastmod, changefreq, and priority. Useful for discovering pages on a website, SEO analysis, and crawling planning.',
  inputSchema: jsonSchema<SitemapReadInput>({
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The sitemap.xml URL to parse (must be http or https)',
      },
    },
    required: ['url'],
    additionalProperties: false,
  }),
  async execute({ url }): Promise<Sitemap> {
    // Validate URL
    if (!url || typeof url !== 'string') {
      throw new Error('URL is required and must be a string');
    }

    if (!isValidUrl(url)) {
      throw new Error(`Invalid URL: ${url}. Must be a valid http or https URL.`);
    }

    // Fetch the sitemap with comprehensive error handling
    let xml: string;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TPMJSBot/1.0; +https://tpmjs.com)',
          Accept: 'application/xml, text/xml, application/x-xml',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (
        !contentType.includes('xml') &&
        !contentType.includes('text/plain') &&
        !url.endsWith('.xml')
      ) {
        throw new Error(
          `Invalid content type: ${contentType}. Expected XML content. The URL may not point to a sitemap.`
        );
      }

      xml = await response.text();

      if (!xml || xml.trim().length === 0) {
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
        if (error.message.includes('404')) {
          throw new Error(
            `Sitemap not found at ${url}. Try checking /sitemap.xml or /sitemap_index.xml`
          );
        }
        throw new Error(`Failed to fetch sitemap from ${url}: ${error.message}`);
      }
      throw new Error(`Failed to fetch sitemap from ${url}: Unknown network error`);
    }

    // Parse XML
    let parsedXml: Record<string, unknown>;
    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        textNodeName: '#text',
        parseAttributeValue: true,
        trimValues: true,
      });
      parsedXml = parser.parse(xml);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to parse XML from ${url}: ${message}`);
    }

    // Determine sitemap type and extract data
    let isSitemapIndex = false;
    let urls: SitemapUrl[] = [];
    let sitemapIndexUrls: SitemapIndexEntry[] | undefined;
    let sitemapType: 'urlset' | 'sitemapindex' = 'urlset';

    // Check for sitemap index
    if (parsedXml.sitemapindex) {
      isSitemapIndex = true;
      sitemapType = 'sitemapindex';

      const sitemapData = parsedXml.sitemapindex as Record<string, unknown>;
      const sitemaps = normalizeUrlArray(sitemapData.sitemap);

      sitemapIndexUrls = sitemaps.map((sitemap: unknown) => {
        const sitemapObj = sitemap as Record<string, unknown>;
        return {
          loc: String(sitemapObj.loc || ''),
          lastmod: sitemapObj.lastmod ? String(sitemapObj.lastmod) : undefined,
        };
      });

      // For sitemap indexes, return the sitemap URLs as the main URL list
      urls = sitemapIndexUrls.map((entry) => ({
        loc: entry.loc,
        lastmod: entry.lastmod,
      }));
    }
    // Check for regular sitemap (urlset)
    else if (parsedXml.urlset) {
      const urlsetData = parsedXml.urlset as Record<string, unknown>;
      const urlEntries = normalizeUrlArray(urlsetData.url);

      urls = urlEntries.map((urlEntry: unknown) => {
        const urlObj = urlEntry as Record<string, unknown>;
        return {
          loc: String(urlObj.loc || ''),
          lastmod: urlObj.lastmod ? String(urlObj.lastmod) : undefined,
          changefreq: urlObj.changefreq ? String(urlObj.changefreq) : undefined,
          priority: urlObj.priority ? String(urlObj.priority) : undefined,
        };
      });
    } else {
      throw new Error(
        `Invalid sitemap format at ${url}. Expected <urlset> or <sitemapindex> root element.`
      );
    }

    // Validate we have URLs
    if (urls.length === 0) {
      throw new Error(
        `Sitemap at ${url} has no URLs. The sitemap may be empty or improperly formatted.`
      );
    }

    return {
      urls,
      isSitemapIndex,
      urlCount: urls.length,
      sitemapIndexUrls: isSitemapIndex ? sitemapIndexUrls : undefined,
      metadata: {
        fetchedAt: new Date().toISOString(),
        sourceUrl: url,
        type: sitemapType,
      },
    };
  },
});

export default sitemapReadTool;
