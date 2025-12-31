/**
 * TOC Generate Tool for TPMJS
 * Generates table of contents from markdown headings
 *
 * @requires ai@6.x (Vercel AI SDK)
 */

import { jsonSchema, tool } from 'ai';

/**
 * Represents a heading in the markdown document
 */
export interface Heading {
  level: number;
  text: string;
  slug: string;
  line: number;
}

/**
 * Output interface for the TOC generation
 */
export interface TocResult {
  toc: string;
  headings: Heading[];
  depth: {
    min: number;
    max: number;
    included: number;
  };
}

type TocGenerateInput = {
  markdown: string;
  maxDepth?: number;
};

/**
 * Converts heading text to a URL-safe slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Parses markdown content and extracts headings
 */
function parseHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  const lines = markdown.split('\n');

  // Track slugs to handle duplicates
  const slugCounts = new Map<string, number>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Match ATX-style headings (# Heading)
    const atxMatch = line.match(/^(#{1,6})\s+(.+?)(?:\s*\{#([^}]+)\})?$/);
    if (atxMatch?.[1] && atxMatch[2]) {
      const level = atxMatch[1].length;
      let text = atxMatch[2].trim();

      // Remove trailing # symbols if present
      text = text.replace(/\s*#+\s*$/, '');

      // Generate slug
      let slug = atxMatch[3] || slugify(text);

      // Handle duplicate slugs
      if (slugCounts.has(slug)) {
        const count = slugCounts.get(slug)! + 1;
        slugCounts.set(slug, count);
        slug = `${slug}-${count}`;
      } else {
        slugCounts.set(slug, 0);
      }

      headings.push({
        level,
        text,
        slug,
        line: i + 1,
      });
    }
  }

  return headings;
}

/**
 * Generates markdown TOC from headings
 */
function generateToc(headings: Heading[], maxDepth: number): string {
  if (headings.length === 0) {
    return '';
  }

  const filteredHeadings = headings.filter((h) => h.level <= maxDepth);

  if (filteredHeadings.length === 0) {
    return '';
  }

  const minLevel = Math.min(...filteredHeadings.map((h) => h.level));
  const lines: string[] = [];

  for (const heading of filteredHeadings) {
    const indent = '  '.repeat(heading.level - minLevel);
    const bullet = '-';
    const link = `[${heading.text}](#${heading.slug})`;
    lines.push(`${indent}${bullet} ${link}`);
  }

  return lines.join('\n');
}

/**
 * TOC Generate Tool
 * Generates table of contents from markdown headings
 */
export const tocGenerateTool = tool({
  description:
    'Generate a table of contents from markdown headings. Parses # ## ### style headings and creates a formatted TOC with anchor links. Useful for adding navigation to long markdown documents.',
  inputSchema: jsonSchema<TocGenerateInput>({
    type: 'object',
    properties: {
      markdown: {
        type: 'string',
        description: 'The markdown content to generate table of contents from',
      },
      maxDepth: {
        type: 'number',
        description: 'Maximum heading depth to include (1-6). Default is 3.',
        minimum: 1,
        maximum: 6,
      },
    },
    required: ['markdown'],
    additionalProperties: false,
  }),
  async execute({ markdown, maxDepth = 3 }): Promise<TocResult> {
    // Validate inputs
    if (!markdown || typeof markdown !== 'string') {
      throw new Error('Markdown content is required and must be a string');
    }

    if (markdown.trim().length === 0) {
      throw new Error('Markdown content cannot be empty');
    }

    // Validate maxDepth
    const depth = maxDepth ?? 3;
    if (depth < 1 || depth > 6 || !Number.isInteger(depth)) {
      throw new Error('maxDepth must be an integer between 1 and 6');
    }

    // Parse headings
    const headings = parseHeadings(markdown);

    if (headings.length === 0) {
      return {
        toc: '',
        headings: [],
        depth: {
          min: 0,
          max: 0,
          included: 0,
        },
      };
    }

    // Generate TOC
    const toc = generateToc(headings, depth);

    // Calculate depth statistics
    const levels = headings.map((h) => h.level);
    const includedHeadings = headings.filter((h) => h.level <= depth);

    return {
      toc,
      headings,
      depth: {
        min: Math.min(...levels),
        max: Math.max(...levels),
        included: includedHeadings.length,
      },
    };
  },
});

export default tocGenerateTool;
