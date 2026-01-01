/**
 * Page Brief Tool for TPMJS
 * Fetches a URL, extracts main content using Readability, and returns a structured brief
 * with summary, key points, and claims needing citations.
 *
 * @requires Node.js 18+ (uses native fetch API)
 */

import { Readability } from '@mozilla/readability';
import { jsonSchema, tool } from 'ai';
import { JSDOM } from 'jsdom';
import sbd from 'sbd';

// Verify fetch is available (Node.js 18+)
if (typeof globalThis.fetch !== 'function') {
  throw new Error('Page Brief tool requires Node.js 18+ with native fetch support');
}

/**
 * Output interface for the page brief
 */
export interface PageBrief {
  url: string;
  title: string;
  summary: string;
  keyPoints: string[];
  claimsNeedingCitation: Array<{
    claim: string;
    reason: string;
  }>;
  metadata: {
    wordCount: number;
    fetchedAt: string;
    domain: string;
  };
}

type PageBriefInput = {
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
 * Identifies claims that likely need citations based on standard research claim types.
 *
 * Claim categories detected (per domain entity claim.categories):
 * - factual: Absolute statements with definitive language
 * - statistical: Numbers, percentages, metrics
 * - quote: Direct quotes or attributed statements
 * - attribution: "According to", "said", "reported" patterns
 * - prediction: Historical dates with event context
 *
 * @param sentences - Array of sentences parsed using sbd (sentence boundary detection)
 * @returns Claims with reasons indicating why citation is needed
 */
function identifyClaimsNeedingCitation(
  sentences: string[]
): Array<{ claim: string; reason: string }> {
  const claims: Array<{ claim: string; reason: string }> = [];

  for (const sentence of sentences) {
    // Skip very short sentences
    if (sentence.length < 20) continue;

    // Check for statistics/numbers
    if (/\d+%|\d+\s*(million|billion|thousand|percent)/i.test(sentence)) {
      claims.push({
        claim: sentence,
        reason: 'Contains statistics that should be cited',
      });
      continue;
    }

    // Check for specific years (except current/recent years in context)
    if (
      /\b(19|20)\d{2}\b/.test(sentence) &&
      /happened|occurred|founded|established|began/i.test(sentence)
    ) {
      claims.push({
        claim: sentence,
        reason: 'Contains historical date claim',
      });
      continue;
    }

    // Check for quotes or attributions
    if (
      /"[^"]{10,}"/.test(sentence) ||
      /according to|said|stated|claimed|reported/i.test(sentence)
    ) {
      claims.push({
        claim: sentence,
        reason: 'Contains quote or attribution that needs verification',
      });
      continue;
    }

    // Check for definitive statements about facts
    if (
      /\b(always|never|every|all|none|is the (first|only|largest|smallest|best|worst))\b/i.test(
        sentence
      )
    ) {
      claims.push({
        claim: sentence,
        reason: 'Contains absolute claim that may need verification',
      });
      continue;
    }

    // Limit to top 10 claims
    if (claims.length >= 10) break;
  }

  return claims;
}

/**
 * Extracts key points from sentences (first sentence of each paragraph-like section)
 */
function extractKeyPoints(sentences: string[], maxPoints = 5): string[] {
  const keyPoints: string[] = [];
  const minLength = 30;
  const seenStarts = new Set<string>();

  for (const sentence of sentences) {
    if (sentence.length < minLength) continue;

    // Get first 20 chars as dedup key
    const start = sentence.substring(0, 20).toLowerCase();
    if (seenStarts.has(start)) continue;
    seenStarts.add(start);

    // Prefer sentences that look like main points
    const isKeyPoint =
      /^(The|A|An|This|These|It|They|We|You|First|Second|Finally|Most|Many|Some)\b/.test(
        sentence
      ) && sentence.length < 300;

    if (isKeyPoint) {
      keyPoints.push(sentence);
      if (keyPoints.length >= maxPoints) break;
    }
  }

  // If we didn't get enough, add more sentences
  if (keyPoints.length < maxPoints) {
    for (const sentence of sentences) {
      if (sentence.length >= minLength && sentence.length < 300) {
        const start = sentence.substring(0, 20).toLowerCase();
        if (!seenStarts.has(start)) {
          seenStarts.add(start);
          keyPoints.push(sentence);
          if (keyPoints.length >= maxPoints) break;
        }
      }
    }
  }

  return keyPoints;
}

/**
 * Creates a summary from the first few meaningful sentences
 */
function createSummary(sentences: string[], maxSentences = 3): string {
  const meaningfulSentences = sentences.filter((s) => s.length > 40 && s.length < 400);
  return meaningfulSentences.slice(0, maxSentences).join(' ');
}

/**
 * Page Brief Tool
 * Fetches a URL, extracts main content, and returns a structured brief
 */
export const pageBriefTool = tool({
  description:
    'Fetch a URL, extract the main content using the Readability algorithm, and return a structured brief with summary, key points, and claims that need citations. Useful for quickly understanding what a webpage is about.',
  inputSchema: jsonSchema<PageBriefInput>({
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to fetch and analyze (must be http or https)',
      },
    },
    required: ['url'],
    additionalProperties: false,
  }),
  async execute({ url }): Promise<PageBrief> {
    // Validate URL
    if (!url || typeof url !== 'string') {
      throw new Error('URL is required and must be a string');
    }

    if (!isValidUrl(url)) {
      throw new Error(`Invalid URL: ${url}. Must be a valid http or https URL.`);
    }

    // Fetch the page with comprehensive error handling
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

    // Parse with JSDOM and extract content using @mozilla/readability
    // Domain rule: content_extraction - Uses @mozilla/readability for main content extraction
    let article: ReturnType<Readability['parse']>;
    try {
      // Create DOM from HTML using jsdom
      const dom = new JSDOM(html, { url });
      // Use @mozilla/readability's Readability algorithm to extract main content
      const reader = new Readability(dom.window.document);
      article = reader.parse();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to parse content from ${url}: ${message}`);
    }

    if (!article) {
      throw new Error(
        `Could not extract readable content from ${url}. The page may not have article content.`
      );
    }

    // Extract text content and validate it's not empty
    const textContent = article.textContent || '';
    if (textContent.trim().length === 0) {
      throw new Error(
        `Extracted content from ${url} is empty. The page may be dynamically rendered or blocked.`
      );
    }
    const sentences: string[] = sbd.sentences(textContent, {
      newline_boundaries: true,
      preserve_whitespace: false,
    });

    // Clean up sentences
    const cleanSentences = sentences
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 10);

    // Count words
    const wordCount = textContent.split(/\s+/).filter((w: string) => w.length > 0).length;

    // Build the brief
    const brief: PageBrief = {
      url,
      title: article.title || 'Untitled',
      summary: createSummary(cleanSentences),
      keyPoints: extractKeyPoints(cleanSentences),
      claimsNeedingCitation: identifyClaimsNeedingCitation(cleanSentences),
      metadata: {
        wordCount,
        fetchedAt: new Date().toISOString(),
        domain: extractDomain(url),
      },
    };

    return brief;
  },
});

export default pageBriefTool;
