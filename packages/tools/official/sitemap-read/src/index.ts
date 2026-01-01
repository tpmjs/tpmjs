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
  lastmod?: string;
}

type SitemapReadInput = {
  sitemapUrl: string;
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
      sitemapUrl: {
        type: 'string',
        description: 'The sitemap URL to parse (must be http or https)',
      },
    },
    required: ['sitemapUrl'],
    additionalProperties: false,
  }),
  async execute({ sitemapUrl }): Promise<Sitemap> {
    // Validate URL
    if (!sitemapUrl || typeof sitemapUrl !== 'string') {
      throw new Error('Sitemap URL is required and must be a string');
    }

    if (!isValidUrl(sitemapUrl)) {
      throw new Error(`Invalid URL: ${sitemapUrl}. Must be a valid http or https URL.`);
    }

    // Fetch the sitemap with comprehensive error handling
    let xml: string;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(sitemapUrl, {
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
        !sitemapUrl.endsWith('.xml')
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
          throw new Error(`Request to ${sitemapUrl} timed out after 30 seconds`);
        }
        if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
          throw new Error(`DNS resolution failed for ${sitemapUrl}. Check the domain name.`);
        }
        if (error.message.includes('ECONNREFUSED')) {
          throw new Error(`Connection refused to ${sitemapUrl}. The server may be down.`);
        }
        if (error.message.includes('404')) {
          throw new Error(
            `Sitemap not found at ${sitemapUrl}. Try checking /sitemap.xml or /sitemap_index.xml`
          );
        }
        throw new Error(`Failed to fetch sitemap from ${sitemapUrl}: ${error.message}`);
      }
      throw new Error(`Failed to fetch sitemap from ${sitemapUrl}: Unknown network error`);
    }

    // Parse XML using fast-xml-parser
    // Domain rule: xml_parsing - Uses fast-xml-parser for robust XML sitemap parsing
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
      throw new Error(`Failed to parse XML from ${sitemapUrl}: ${message}`);
    }

    // Determine sitemap type and extract data
    // Domain rule: sitemap_index_handling - Must detect and handle sitemap index files
    let isSitemapIndex = false;
    let urls: SitemapUrl[] = [];
    let lastmod: string | undefined;

    // Check for sitemap index
    if (parsedXml.sitemapindex) {
      isSitemapIndex = true;

      const sitemapData = parsedXml.sitemapindex as Record<string, unknown>;
      const sitemaps = normalizeUrlArray(sitemapData.sitemap);

      const sitemapIndexUrls = sitemaps.map((sitemap: unknown) => {
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

      // Use the most recent lastmod from the index
      const lastmods = sitemapIndexUrls
        .map((s) => s.lastmod)
        .filter((d): d is string => d !== undefined);
      if (lastmods.length > 0) {
        lastmod = lastmods.sort().reverse()[0];
      }
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

      // Use the most recent lastmod from the URLs
      const lastmods = urls.map((u) => u.lastmod).filter((d): d is string => d !== undefined);
      if (lastmods.length > 0) {
        lastmod = lastmods.sort().reverse()[0];
      }
    } else {
      throw new Error(
        `Invalid sitemap format at ${sitemapUrl}. Expected <urlset> or <sitemapindex> root element.`
      );
    }

    // Validate we have URLs
    // Domain rule: empty_sitemap_handling - Must handle empty sitemaps gracefully
    if (urls.length === 0) {
      throw new Error(
        `Sitemap at ${sitemapUrl} has no URLs. The sitemap may be empty or improperly formatted.`
      );
    }

    return {
      urls,
      isSitemapIndex,
      lastmod,
    };
  },
});

export default sitemapReadTool;
