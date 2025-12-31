/**
 * URL Parse Tool for TPMJS
 * Parses URLs into components using the Web URL API
 *
 * @requires Node.js 18+
 */

import { jsonSchema, tool } from 'ai';

/**
 * Input for URL parsing
 */
type UrlParseInput = {
  url: string;
};

/**
 * Output interface for URL parsing
 */
export interface UrlParseResult {
  protocol: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  origin: string;
  searchParams: Record<string, string>;
}

/**
 * URL Parse Tool
 * Parses URL into protocol, hostname, port, pathname, search params, and hash
 */
export const urlParseTool = tool({
  description:
    'Parse a URL into its components: protocol, hostname, port, pathname, search parameters, hash, and origin. Returns search parameters as a key-value object for easy access.',
  inputSchema: jsonSchema<UrlParseInput>({
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL string to parse (e.g., "https://example.com/path?key=value#section")',
      },
    },
    required: ['url'],
    additionalProperties: false,
  }),
  async execute({ url }): Promise<UrlParseResult> {
    // Validate input
    if (typeof url !== 'string') {
      throw new Error('URL input must be a string');
    }

    if (url.trim().length === 0) {
      throw new Error('URL input cannot be empty');
    }

    // Parse the URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Invalid URL: ${message}`);
    }

    // Extract search parameters as an object
    const searchParams: Record<string, string> = {};
    parsedUrl.searchParams.forEach((value, key) => {
      searchParams[key] = value;
    });

    // Build result
    const result: UrlParseResult = {
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      pathname: parsedUrl.pathname,
      search: parsedUrl.search,
      hash: parsedUrl.hash,
      origin: parsedUrl.origin,
      searchParams,
    };

    return result;
  },
});

export default urlParseTool;
