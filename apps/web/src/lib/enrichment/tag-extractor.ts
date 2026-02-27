/**
 * Tag Extractor
 *
 * Extracts searchable tags from tool metadata.
 * Sources: camelCase-split tool name, description keywords (stopword-filtered),
 * package npmKeywords, package category.
 */

import { splitCamelCase } from '../search/bm25';

const STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'shall',
  'can',
  'need',
  'dare',
  'ought',
  'used',
  'to',
  'of',
  'in',
  'for',
  'on',
  'with',
  'at',
  'by',
  'from',
  'as',
  'into',
  'through',
  'during',
  'before',
  'after',
  'above',
  'below',
  'between',
  'out',
  'off',
  'over',
  'under',
  'again',
  'further',
  'then',
  'once',
  'and',
  'but',
  'or',
  'nor',
  'not',
  'so',
  'yet',
  'both',
  'either',
  'neither',
  'each',
  'every',
  'all',
  'any',
  'few',
  'more',
  'most',
  'other',
  'some',
  'such',
  'no',
  'only',
  'own',
  'same',
  'than',
  'too',
  'very',
  'just',
  'because',
  'if',
  'when',
  'while',
  'how',
  'what',
  'which',
  'who',
  'whom',
  'this',
  'that',
  'these',
  'those',
  'it',
  'its',
  'i',
  'me',
  'my',
  'we',
  'our',
  'you',
  'your',
  'he',
  'him',
  'his',
  'she',
  'her',
  'they',
  'them',
  'their',
  'about',
  'up',
  'also',
  'tool',
  'tools',
  'using',
  'use',
  'uses',
  'used',
  'return',
  'returns',
  'get',
  'gets',
  'set',
  'sets',
  'make',
  'makes',
]);

const MAX_TAGS = 20;

interface TagInput {
  name: string;
  description?: string | null;
  package?: {
    npmKeywords?: string[] | null;
    category?: string | null;
    npmPackageName?: string | null;
  } | null;
}

/**
 * Extract tags from tool metadata.
 * Returns up to 20 unique, lowercase, alphabetically sorted tags.
 */
export function extractTags(tool: TagInput): string[] {
  const tags = new Set<string>();

  // 1. Split tool name by camelCase
  const nameWords = splitCamelCase(tool.name)
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
  for (const word of nameWords) tags.add(word);

  // 2. Extract keywords from description
  if (tool.description) {
    const descWords = tool.description
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
    // Take first 10 description keywords to keep tags focused
    for (const word of descWords.slice(0, 10)) tags.add(word);
  }

  // 3. Add npm keywords
  if (tool.package?.npmKeywords) {
    for (const kw of tool.package.npmKeywords) {
      const normalized = kw.toLowerCase().trim();
      if (normalized.length >= 2 && !STOPWORDS.has(normalized)) {
        tags.add(normalized);
      }
    }
  }

  // 4. Add category
  if (tool.package?.category) {
    tags.add(tool.package.category.toLowerCase());
  }

  // 5. Extract words from package name (without scope)
  if (tool.package?.npmPackageName) {
    const withoutScope = tool.package.npmPackageName.replace(/@[\w-]+\//, '');
    const pkgWords = withoutScope
      .split(/[-_]/)
      .filter((w) => w.length >= 2 && !STOPWORDS.has(w.toLowerCase()));
    for (const word of pkgWords) tags.add(word.toLowerCase());
  }

  // Sort alphabetically and limit
  return Array.from(tags).sort().slice(0, MAX_TAGS);
}
