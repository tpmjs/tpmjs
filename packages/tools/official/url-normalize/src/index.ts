/**
 * URL Normalize Tool for TPMJS
 * Normalizes URLs with configurable options for consistent URL handling.
 * Useful for deduplication, comparison, and canonicalization.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Output interface for URL normalization
 */
export interface UrlNormalizeResult {
  normalized: string;
  original: string;
  changes: Array<{
    type: string;
    description: string;
    before: string;
    after: string;
  }>;
  metadata: {
    protocol: string;
    hostname: string;
    pathname: string;
    hasQueryParams: boolean;
    hasHash: boolean;
  };
}

export interface NormalizeOptions {
  sortParams?: boolean;
  removeHash?: boolean;
  lowercase?: boolean;
  removeTrailingSlash?: boolean;
  removeDefaultPort?: boolean;
  removeWWW?: boolean;
}

type UrlNormalizeInput = {
  url: string;
  options?: NormalizeOptions;
};

/**
 * Default normalization options
 */
const DEFAULT_OPTIONS: Required<NormalizeOptions> = {
  sortParams: true,
  removeHash: true, // Changed default to true per domain rules
  lowercase: true,
  removeTrailingSlash: true,
  removeDefaultPort: true,
  removeWWW: false,
};

/**
 * Normalizes a URL with the given options
 */
function normalizeUrl(
  urlString: string,
  options: Required<NormalizeOptions>
): {
  normalized: string;
  changes: Array<{ type: string; description: string; before: string; after: string }>;
} {
  const changes: Array<{ type: string; description: string; before: string; after: string }> = [];

  // Parse URL
  let url: URL;
  try {
    url = new URL(urlString);
  } catch (error) {
    throw new Error(`Invalid URL: ${urlString}`);
  }

  // Lowercase hostname
  if (options.lowercase && url.hostname !== url.hostname.toLowerCase()) {
    const before = url.hostname;
    url.hostname = url.hostname.toLowerCase();
    changes.push({
      type: 'lowercase',
      description: 'Converted hostname to lowercase',
      before,
      after: url.hostname,
    });
  }

  // Lowercase protocol
  if (options.lowercase && url.protocol !== url.protocol.toLowerCase()) {
    const before = url.protocol;
    url.protocol = url.protocol.toLowerCase();
    changes.push({
      type: 'lowercase',
      description: 'Converted protocol to lowercase',
      before,
      after: url.protocol,
    });
  }

  // Remove www subdomain
  if (options.removeWWW && url.hostname.startsWith('www.')) {
    const before = url.hostname;
    url.hostname = url.hostname.substring(4);
    changes.push({
      type: 'removeWWW',
      description: 'Removed www subdomain',
      before,
      after: url.hostname,
    });
  }

  // Remove default ports
  if (options.removeDefaultPort) {
    const defaultPorts: Record<string, string> = {
      'http:': '80',
      'https:': '443',
      'ftp:': '21',
    };

    const defaultPort = defaultPorts[url.protocol];
    if (defaultPort && url.port === defaultPort) {
      const before = url.port;
      url.port = '';
      changes.push({
        type: 'removeDefaultPort',
        description: `Removed default port ${defaultPort} for ${url.protocol}`,
        before,
        after: '',
      });
    }
  }

  // Sort query parameters
  if (options.sortParams && url.search) {
    const params = new URLSearchParams(url.search);
    const sortedParams = new URLSearchParams();

    // Get all keys and sort them
    const keys = Array.from(params.keys()).sort();

    for (const key of keys) {
      const values = params.getAll(key);
      for (const value of values) {
        sortedParams.append(key, value);
      }
    }

    const before = url.search;
    const sortedSearch = sortedParams.toString();
    if (sortedSearch !== url.search.substring(1)) {
      url.search = sortedSearch;
      changes.push({
        type: 'sortParams',
        description: 'Sorted query parameters alphabetically',
        before,
        after: url.search,
      });
    }
  }

  // Remove hash
  if (options.removeHash && url.hash) {
    const before = url.hash;
    url.hash = '';
    changes.push({
      type: 'removeHash',
      description: 'Removed URL fragment/hash',
      before,
      after: '',
    });
  }

  // Remove trailing slash from pathname
  if (options.removeTrailingSlash && url.pathname.length > 1 && url.pathname.endsWith('/')) {
    const before = url.pathname;
    url.pathname = url.pathname.substring(0, url.pathname.length - 1);
    changes.push({
      type: 'removeTrailingSlash',
      description: 'Removed trailing slash from pathname',
      before,
      after: url.pathname,
    });
  }

  return {
    normalized: url.href,
    changes,
  };
}

/**
 * URL Normalize Tool
 * Normalizes URLs for consistent handling and comparison
 */
export const urlNormalizeTool = tool({
  description:
    'Normalize URLs with configurable options including lowercase conversion, trailing slash removal, query parameter sorting, hash removal, default port removal, and www removal. Useful for URL deduplication, comparison, and canonicalization.',
  inputSchema: jsonSchema<UrlNormalizeInput>({
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to normalize (must be a valid absolute URL)',
      },
      options: {
        type: 'object',
        description: 'Normalization options',
        properties: {
          sortParams: {
            type: 'boolean',
            description: 'Sort query parameters alphabetically (default: true)',
          },
          removeHash: {
            type: 'boolean',
            description: 'Remove URL fragment/hash (default: true)',
          },
          lowercase: {
            type: 'boolean',
            description: 'Convert protocol and hostname to lowercase (default: true)',
          },
          removeTrailingSlash: {
            type: 'boolean',
            description: 'Remove trailing slash from pathname (default: true)',
          },
          removeDefaultPort: {
            type: 'boolean',
            description:
              'Remove default ports (80 for http, 443 for https, 21 for ftp) (default: true)',
          },
          removeWWW: {
            type: 'boolean',
            description: 'Remove www subdomain (default: false)',
          },
        },
        additionalProperties: false,
      },
    },
    required: ['url'],
    additionalProperties: false,
  }),
  async execute({ url, options = {} }): Promise<UrlNormalizeResult> {
    // Validate URL
    if (!url || typeof url !== 'string') {
      throw new Error('URL is required and must be a string');
    }

    // Merge with default options
    const normalizeOptions: Required<NormalizeOptions> = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    // Normalize the URL
    const { normalized, changes } = normalizeUrl(url, normalizeOptions);

    // Parse normalized URL for metadata
    const parsedUrl = new URL(normalized);

    return {
      normalized,
      original: url,
      changes,
      metadata: {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        pathname: parsedUrl.pathname,
        hasQueryParams: parsedUrl.search.length > 0,
        hasHash: parsedUrl.hash.length > 0,
      },
    };
  },
});

export default urlNormalizeTool;
