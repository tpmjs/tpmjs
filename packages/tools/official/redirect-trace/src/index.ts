/**
 * Redirect Trace Tool for TPMJS
 * Traces all HTTP redirects from a URL to its final destination.
 * Uses fetch with redirect: 'manual' to capture each redirect step.
 *
 * @requires Node.js 18+ (uses native fetch API)
 */

import { jsonSchema, tool } from 'ai';

// Verify fetch is available (Node.js 18+)
if (typeof globalThis.fetch !== 'function') {
  throw new Error('Redirect Trace tool requires Node.js 18+ with native fetch support');
}

/**
 * A single step in the redirect chain
 */
export interface RedirectStep {
  url: string;
  statusCode: number;
  statusText: string;
  location: string | null;
  headers: Record<string, string>;
}

/**
 * Output interface for the redirect trace result
 */
export interface RedirectTraceResult {
  steps: RedirectStep[];
  finalUrl: string;
  statusCodes: number[];
  redirectCount: number;
  totalTimeMs: number;
  metadata: {
    startUrl: string;
    tracedAt: string;
    maxRedirectsReached: boolean;
  };
}

type RedirectTraceInput = {
  url: string;
  maxRedirects?: number;
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
 * Resolves a relative URL against a base URL
 */
function resolveUrl(base: string, relative: string): string {
  try {
    return new URL(relative, base).href;
  } catch {
    throw new Error(`Failed to resolve URL: ${relative} against base ${base}`);
  }
}

/**
 * Extracts important headers from a Response
 */
function extractHeaders(response: Response): Record<string, string> {
  const importantHeaders = ['location', 'content-type', 'cache-control', 'server', 'x-redirect-by'];

  const headers: Record<string, string> = {};

  for (const header of importantHeaders) {
    const value = response.headers.get(header);
    if (value) {
      headers[header] = value;
    }
  }

  return headers;
}

/**
 * Redirect Trace Tool
 * Traces all HTTP redirects from a URL to its final destination
 */
export const redirectTraceTool = tool({
  description:
    'Trace all HTTP redirects from a URL to its final destination. Follows redirect chains and returns each step with status codes, headers, and timing. Useful for debugging redirects, understanding URL shorteners, and analyzing redirect chains.',
  inputSchema: jsonSchema<RedirectTraceInput>({
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to trace (must be http or https)',
      },
      maxRedirects: {
        type: 'number',
        description: 'Maximum number of redirects to follow (default: 10, max: 50)',
      },
    },
    required: ['url'],
    additionalProperties: false,
  }),
  async execute({ url, maxRedirects = 10 }): Promise<RedirectTraceResult> {
    // Validate URL
    if (!url || typeof url !== 'string') {
      throw new Error('URL is required and must be a string');
    }

    if (!isValidUrl(url)) {
      throw new Error(`Invalid URL: ${url}. Must be a valid http or https URL.`);
    }

    // Validate maxRedirects
    if (typeof maxRedirects !== 'number' || maxRedirects < 1) {
      throw new Error('maxRedirects must be a positive number');
    }

    if (maxRedirects > 50) {
      throw new Error('maxRedirects cannot exceed 50');
    }

    const startTime = Date.now();
    const steps: RedirectStep[] = [];
    let currentUrl = url;
    let maxRedirectsReached = false;

    // Follow redirects manually
    for (let i = 0; i < maxRedirects; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout per request

        const response = await fetch(currentUrl, {
          method: 'GET',
          redirect: 'manual', // Don't follow redirects automatically
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; TPMJSBot/1.0; +https://tpmjs.com)',
            Accept: '*/*',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const location = response.headers.get('location');
        const headers = extractHeaders(response);

        // Record this step
        const step: RedirectStep = {
          url: currentUrl,
          statusCode: response.status,
          statusText: response.statusText,
          location,
          headers,
        };

        steps.push(step);

        // Check if this is a redirect
        if (response.status >= 300 && response.status < 400 && location) {
          // Resolve the redirect URL (handle relative URLs)
          currentUrl = resolveUrl(currentUrl, location);

          // Continue to next iteration
          continue;
        }

        // Not a redirect - we've reached the final destination
        break;
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new Error(`Request to ${currentUrl} timed out after 10 seconds`);
          }
          if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
            throw new Error(`DNS resolution failed for ${currentUrl}. Check the domain name.`);
          }
          if (error.message.includes('ECONNREFUSED')) {
            throw new Error(`Connection refused to ${currentUrl}. The server may be down.`);
          }
          if (error.message.includes('CERT_')) {
            throw new Error(
              `SSL certificate error for ${currentUrl}. The site may have an invalid certificate.`
            );
          }
          throw new Error(`Failed to fetch ${currentUrl}: ${error.message}`);
        }
        throw new Error(`Failed to fetch ${currentUrl}: Unknown network error`);
      }
    }

    // Check if we hit max redirects
    if (steps.length === maxRedirects) {
      const lastStep = steps[steps.length - 1];
      if (
        lastStep &&
        lastStep.statusCode >= 300 &&
        lastStep.statusCode < 400 &&
        lastStep.location
      ) {
        maxRedirectsReached = true;
      }
    }

    const totalTimeMs = Date.now() - startTime;
    const statusCodes = steps.map((step) => step.statusCode);
    const finalUrl = currentUrl;
    const redirectCount = steps.length - 1; // Subtract 1 because final step is not a redirect

    // Build result
    const result: RedirectTraceResult = {
      steps,
      finalUrl,
      statusCodes,
      redirectCount,
      totalTimeMs,
      metadata: {
        startUrl: url,
        tracedAt: new Date().toISOString(),
        maxRedirectsReached,
      },
    };

    return result;
  },
});

export default redirectTraceTool;
