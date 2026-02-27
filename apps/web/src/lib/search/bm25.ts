/**
 * Shared BM25 search module
 *
 * Extracted from apps/web/src/app/api/tools/search/route.ts
 * Used by both the search API and the dynamic tool discovery searchTools meta-tool.
 */

// BM25 parameters
const k1 = 1.5; // term frequency saturation parameter
const b = 0.75; // length normalization parameter

/**
 * Split camelCase and PascalCase into words
 */
export function splitCamelCase(text: string): string {
  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase -> camel Case
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2'); // XMLParser -> XML Parser
}

/**
 * Tokenize text into words (handles camelCase, special characters)
 */
export function tokenize(text: string): string[] {
  return splitCamelCase(text)
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

/**
 * Check for exact tool name match (case-insensitive)
 */
export function hasExactNameMatch(query: string, toolName: string): boolean {
  const queryLower = query.toLowerCase();
  const nameLower = toolName.toLowerCase();
  return queryLower.includes(nameLower) || nameLower.includes(queryLower);
}

/**
 * Check for package name match (case-insensitive)
 */
export function hasPackageNameMatch(query: string, packageName: string): boolean {
  const queryLower = query.toLowerCase();
  const packageLower = packageName.toLowerCase();
  return queryLower.includes(packageLower) || packageLower.includes(queryLower);
}

/**
 * Calculate term frequency of a term in a token array
 */
function termFrequency(term: string, tokens: string[]): number {
  return tokens.filter((t) => t === term).length;
}

/**
 * Calculate BM25 score for a single document against a query
 */
export function calculateBM25(
  query: string,
  document: string,
  avgDocLength: number,
  totalDocs: number,
  docFrequencies: Map<string, number>
): number {
  const queryTokens = tokenize(query);
  const docTokens = tokenize(document);
  const docLength = docTokens.length;

  let score = 0;

  for (const term of queryTokens) {
    const tf = termFrequency(term, docTokens);
    if (tf === 0) continue;

    // IDF calculation
    const docFreq = docFrequencies.get(term) || 0;
    const idf = Math.log((totalDocs - docFreq + 0.5) / (docFreq + 0.5) + 1);

    // BM25 formula
    const numerator = tf * (k1 + 1);
    const denominator = tf + k1 * (1 - b + b * (docLength / avgDocLength));

    score += idf * (numerator / denominator);
  }

  return score;
}

/**
 * Score a set of documents against a query using BM25.
 * Returns documents sorted by score (descending).
 */
export function scoreBM25<T>(
  query: string,
  documents: Array<{ item: T; text: string }>,
  options?: { tagMatchBoost?: number; tags?: (item: T) => string[] }
): Array<{ item: T; score: number }> {
  if (documents.length === 0) return [];

  // Calculate document frequencies
  const docFrequencies = new Map<string, number>();
  const queryTokens = tokenize(query);

  for (const term of queryTokens) {
    let count = 0;
    for (const doc of documents) {
      const docTokens = tokenize(doc.text);
      if (docTokens.includes(term)) count++;
    }
    docFrequencies.set(term, count);
  }

  // Calculate average document length
  const totalTokens = documents.reduce((sum, doc) => sum + tokenize(doc.text).length, 0);
  const avgDocLength = totalTokens / documents.length;

  // Score each document
  return documents
    .map(({ item, text }) => {
      let score = calculateBM25(query, text, avgDocLength, documents.length, docFrequencies);

      // Tag-match boost: +boost when query token matches a tag exactly
      if (options?.tagMatchBoost && options.tags) {
        const itemTags = options.tags(item);
        for (const token of queryTokens) {
          if (itemTags.includes(token)) {
            score += options.tagMatchBoost;
          }
        }
      }

      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);
}
