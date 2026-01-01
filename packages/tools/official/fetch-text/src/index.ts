/**
 * Fetch Text Tool for TPMJS
 * Fetches a URL and returns plain text content with metadata.
 * Strips HTML tags and returns clean text.
 *
 * @requires Node.js 18+ (uses native fetch API)
 */

import { jsonSchema, tool } from 'ai';

// Verify fetch is available (Node.js 18+)
if (typeof globalThis.fetch !== 'function') {
  throw new Error('Fetch Text tool requires Node.js 18+ with native fetch support');
}

/**
 * Output interface for the fetch text result
 */
export interface FetchResult {
  text: string;
  url: string;
  contentLength: number;
  contentType: string;
  metadata: {
    fetchedAt: string;
    statusCode: number;
    redirected: boolean;
    finalUrl: string;
  };
}

type FetchTextInput = {
  url: string;
  maxBytes?: number;
  timeoutMs?: number;
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
 * Strips HTML tags from a string and returns plain text
 */
function stripHtmlTags(html: string): string {
  // Remove script and style elements completely
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
  };

  text = text.replace(/&[a-z]+;|&#\d+;/gi, (match) => {
    return entities[match.toLowerCase()] || match;
  });

  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Fetch Text Tool
 * Fetches a URL and returns plain text content with metadata
 */
export const fetchTextTool = tool({
  description:
    'Fetch a URL and return plain text content. Automatically strips HTML tags and returns clean text with metadata including content type, length, and status code. Useful for extracting text from web pages.',
  inputSchema: jsonSchema<FetchTextInput>({
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to fetch (must be http or https)',
      },
      maxBytes: {
        type: 'number',
        description: 'Maximum bytes to read from response (default: unlimited)',
      },
      timeoutMs: {
        type: 'number',
        description: 'Request timeout in milliseconds (default: 30000)',
      },
    },
    required: ['url'],
    additionalProperties: false,
  }),
  async execute({ url, maxBytes, timeoutMs }): Promise<FetchResult> {
    // Validate URL
    if (!url || typeof url !== 'string') {
      throw new Error('URL is required and must be a string');
    }

    if (!isValidUrl(url)) {
      throw new Error(`Invalid URL: ${url}. Must be a valid http or https URL.`);
    }

    // Use configurable timeout (default 30s)
    const timeout = timeoutMs && timeoutMs > 0 ? timeoutMs : 30000;

    // Use configurable max bytes (default 5MB)
    const maxBytesLimit = maxBytes && maxBytes > 0 ? maxBytes : 5 * 1024 * 1024;

    // Fetch the page with timeout
    let response: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TPMJSBot/1.0; +https://tpmjs.com)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain,*/*;q=0.8',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request to ${url} timed out after ${timeout}ms`);
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

    // Get content type
    const contentType = response.headers.get('content-type') || 'unknown';

    // Get response text, limiting by maxBytes (default 5MB)
    let rawText: string;
    if (maxBytesLimit > 0) {
      // Read response as stream and limit to maxBytes
      const reader = response.body?.getReader();
      if (!reader) {
        rawText = await response.text();
      } else {
        const chunks: Uint8Array[] = [];
        let totalBytes = 0;
        const decoder = new TextDecoder();

        while (totalBytes < maxBytesLimit) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          totalBytes += value.length;
        }

        // Cancel the stream if we hit the limit
        if (totalBytes >= maxBytesLimit) {
          await reader.cancel();
        }

        rawText = chunks.map((chunk) => decoder.decode(chunk, { stream: true })).join('');
        // Truncate to exactly maxBytesLimit if we went over
        if (rawText.length > maxBytesLimit) {
          rawText = rawText.slice(0, maxBytesLimit);
        }
      }
    } else {
      rawText = await response.text();
    }

    // Strip HTML tags if content is HTML
    let text: string;
    if (contentType.includes('text/html') || contentType.includes('application/xhtml')) {
      text = stripHtmlTags(rawText);
    } else {
      text = rawText;
    }

    const contentLength = rawText.length;

    // Build result
    const result: FetchResult = {
      text,
      url,
      contentLength,
      contentType,
      metadata: {
        fetchedAt: new Date().toISOString(),
        statusCode: response.status,
        redirected: response.redirected,
        finalUrl: response.url,
      },
    };

    return result;
  },
});

export default fetchTextTool;
