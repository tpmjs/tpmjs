/**
 * Compare Pages Tool for TPMJS
 * Compares content from two URLs, identifying agreements, conflicts, and unique points.
 *
 * @requires Node.js 18+ (uses native fetch API)
 */

import { jsonSchema, tool } from 'ai';
import natural from 'natural';

// Verify fetch is available (Node.js 18+)
if (typeof globalThis.fetch !== 'function') {
  throw new Error('Compare Pages tool requires Node.js 18+ with native fetch support');
}

const TfIdf = natural.TfIdf;

/**
 * Output interface for page comparison
 */
export interface PageComparison {
  urlA: string;
  urlB: string;
  titleA: string;
  titleB: string;
  agreements: string[];
  conflicts: Array<{
    topic: string;
    pageAPosition: string;
    pageBPosition: string;
  }>;
  uniqueToA: string[];
  uniqueToB: string[];
  metadata: {
    comparedAt: string;
    keyPointsA: number;
    keyPointsB: number;
  };
}

type ComparePagesInput = {
  urlA: string;
  urlB: string;
};

/**
 * Validates URL format
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
 * Fetch and extract text content from a URL
 */
async function fetchPageContent(url: string): Promise<{ title: string; keyPoints: string[] }> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; TPMJSBot/1.0; +https://tpmjs.com)',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch?.[1]?.trim() ?? 'Untitled';

  // Extract text content (simple approach - strip HTML tags)
  const textContent = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Split into sentences and extract key points
  const sentences = textContent.split(/[.!?]+/).filter((s) => s.trim().length > 30);

  // Take meaningful sentences as key points
  const keyPoints = sentences
    .slice(0, 50) // Limit to first 50 sentences
    .map((s) => s.trim())
    .filter((s) => s.length > 30 && s.length < 500);

  return { title, keyPoints };
}

/**
 * Calculate similarity between two sentences using TF-IDF
 */
function calculateSimilarity(sentence1: string, sentence2: string): number {
  const tfidf = new TfIdf();
  tfidf.addDocument(sentence1.toLowerCase());
  tfidf.addDocument(sentence2.toLowerCase());

  // Get terms from first document
  const terms: string[] = [];
  tfidf.listTerms(0).forEach((item: { term: string }) => {
    terms.push(item.term);
  });

  // Calculate cosine-like similarity
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  for (const term of terms) {
    const score1 = tfidf.tfidf(term, 0);
    const score2 = tfidf.tfidf(term, 1);
    dotProduct += score1 * score2;
    mag1 += score1 * score1;
    mag2 += score2 * score2;
  }

  const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
  return magnitude > 0 ? dotProduct / magnitude : 0;
}

/**
 * Find similar sentences between two sets
 */
function findSimilarSentences(
  pointsA: string[],
  pointsB: string[],
  threshold = 0.3
): Array<{ a: string; b: string; similarity: number }> {
  const matches: Array<{ a: string; b: string; similarity: number }> = [];

  for (const a of pointsA) {
    for (const b of pointsB) {
      const similarity = calculateSimilarity(a, b);
      if (similarity >= threshold) {
        matches.push({ a, b, similarity });
      }
    }
  }

  // Sort by similarity descending
  return matches.sort((x, y) => y.similarity - x.similarity);
}

/**
 * Detect potential conflicts in similar statements
 */
function detectConflicts(
  matches: Array<{ a: string; b: string; similarity: number }>
): Array<{ topic: string; pageAPosition: string; pageBPosition: string }> {
  const conflicts: Array<{
    topic: string;
    pageAPosition: string;
    pageBPosition: string;
  }> = [];

  // Look for negation patterns that might indicate conflict
  const negationPatterns = [
    /\bnot\b/i,
    /\bno\b/i,
    /\bnever\b/i,
    /\bdoesn't\b/i,
    /\bdon't\b/i,
    /\bwon't\b/i,
    /\bisn't\b/i,
    /\baren't\b/i,
    /\bwasn't\b/i,
    /\bweren't\b/i,
    /\bdidn't\b/i,
    /\bfailed\b/i,
    /\bfalse\b/i,
    /\bunlike\b/i,
    /\bhowever\b/i,
    /\bbut\b/i,
  ];

  for (const match of matches.slice(0, 20)) {
    // Check top 20 matches
    const aHasNegation = negationPatterns.some((p) => p.test(match.a));
    const bHasNegation = negationPatterns.some((p) => p.test(match.b));

    // If one has negation and other doesn't, might be a conflict
    if (aHasNegation !== bHasNegation && match.similarity > 0.4) {
      // Extract topic from first few words
      const topic = match.a
        .split(' ')
        .slice(0, 5)
        .join(' ')
        .replace(/[^\w\s]/g, '');
      conflicts.push({
        topic: topic || 'Topic',
        pageAPosition: match.a.substring(0, 200),
        pageBPosition: match.b.substring(0, 200),
      });
    }
  }

  return conflicts.slice(0, 5); // Limit to top 5 conflicts
}

/**
 * Compare Pages Tool
 * Compares content from two URLs
 */
export const comparePagesTool = tool({
  description:
    'Compare two URLs for agreements, conflicts, and unique points. Useful for cross-source validation and identifying where sources agree or disagree.',
  inputSchema: jsonSchema<ComparePagesInput>({
    type: 'object',
    properties: {
      urlA: {
        type: 'string',
        description: 'First URL to compare',
      },
      urlB: {
        type: 'string',
        description: 'Second URL to compare',
      },
    },
    required: ['urlA', 'urlB'],
    additionalProperties: false,
  }),
  async execute({ urlA, urlB }): Promise<PageComparison> {
    // Validate URLs
    if (!urlA || !isValidUrl(urlA)) {
      throw new Error(`Invalid first URL: ${urlA}`);
    }
    if (!urlB || !isValidUrl(urlB)) {
      throw new Error(`Invalid second URL: ${urlB}`);
    }

    // Fetch both pages
    let contentA: { title: string; keyPoints: string[] };
    let contentB: { title: string; keyPoints: string[] };

    try {
      [contentA, contentB] = await Promise.all([fetchPageContent(urlA), fetchPageContent(urlB)]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch pages: ${message}`);
    }

    if (contentA.keyPoints.length === 0) {
      throw new Error(`Could not extract content from ${urlA}`);
    }
    if (contentB.keyPoints.length === 0) {
      throw new Error(`Could not extract content from ${urlB}`);
    }

    // Find similar sentences (potential agreements)
    const similarPairs = findSimilarSentences(contentA.keyPoints, contentB.keyPoints);

    // Extract agreements (high similarity pairs)
    const matchedA = new Set<string>();
    const matchedB = new Set<string>();
    const agreements: string[] = [];

    for (const pair of similarPairs.filter((p) => p.similarity > 0.5)) {
      if (!matchedA.has(pair.a) && !matchedB.has(pair.b)) {
        agreements.push(`Both sources discuss: ${pair.a.substring(0, 150)}...`);
        matchedA.add(pair.a);
        matchedB.add(pair.b);
      }
      if (agreements.length >= 5) break;
    }

    // Detect conflicts
    const conflicts = detectConflicts(similarPairs);

    // Find unique points
    const uniqueToA = contentA.keyPoints
      .filter((p) => !matchedA.has(p))
      .slice(0, 5)
      .map((p) => p.substring(0, 200));

    const uniqueToB = contentB.keyPoints
      .filter((p) => !matchedB.has(p))
      .slice(0, 5)
      .map((p) => p.substring(0, 200));

    return {
      urlA,
      urlB,
      titleA: contentA.title,
      titleB: contentB.title,
      agreements,
      conflicts,
      uniqueToA,
      uniqueToB,
      metadata: {
        comparedAt: new Date().toISOString(),
        keyPointsA: contentA.keyPoints.length,
        keyPointsB: contentB.keyPoints.length,
      },
    };
  },
});

export default comparePagesTool;
