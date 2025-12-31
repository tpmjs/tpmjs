/**
 * Markdown to HTML Tool for TPMJS
 * Converts markdown to HTML using marked
 *
 * @requires Node.js 18+
 */

import { jsonSchema, tool } from 'ai';
import { type Token, marked } from 'marked';

/**
 * Heading information extracted from markdown
 */
export interface HeadingInfo {
  level: number;
  text: string;
}

/**
 * Options for markdown to HTML conversion
 */
export interface ConversionOptions {
  gfm?: boolean;
  sanitize?: boolean;
}

/**
 * Input for markdown to HTML conversion
 */
type MarkdownToHtmlInput = {
  markdown: string;
  options?: ConversionOptions;
};

/**
 * Output interface for markdown to HTML conversion
 */
export interface MarkdownToHtmlResult {
  html: string;
  headings: HeadingInfo[];
}

/**
 * Extract headings from markdown tokens
 */
function extractHeadings(tokens: Token[]): HeadingInfo[] {
  const headings: HeadingInfo[] = [];

  function processTokens(tokenList: Token[]): void {
    for (const token of tokenList) {
      if (token.type === 'heading') {
        headings.push({
          level: token.depth,
          text: token.text,
        });
      }

      // Process nested tokens
      if ('tokens' in token && Array.isArray(token.tokens)) {
        processTokens(token.tokens);
      }
    }
  }

  processTokens(tokens);
  return headings;
}

/**
 * Markdown to HTML Tool
 * Converts markdown to HTML with optional GitHub Flavored Markdown and sanitization
 */
export const markdownToHtmlTool = tool({
  description:
    'Convert markdown to HTML. Supports GitHub Flavored Markdown (GFM) for tables, task lists, and strikethrough. Optionally sanitize output for safety. Extracts heading structure for navigation or table of contents.',
  inputSchema: jsonSchema<MarkdownToHtmlInput>({
    type: 'object',
    properties: {
      markdown: {
        type: 'string',
        description: 'The markdown string to convert to HTML',
      },
      options: {
        type: 'object',
        description: 'Optional configuration for GFM and sanitization',
        properties: {
          gfm: {
            type: 'boolean',
            description:
              'Enable GitHub Flavored Markdown (tables, task lists, strikethrough). Default: true',
          },
          sanitize: {
            type: 'boolean',
            description:
              'Sanitize HTML output to remove potentially dangerous content. Default: false',
          },
        },
      },
    },
    required: ['markdown'],
    additionalProperties: false,
  }),
  async execute({ markdown, options }): Promise<MarkdownToHtmlResult> {
    // Validate input
    if (typeof markdown !== 'string') {
      throw new Error('Markdown input must be a string');
    }

    // Configure marked options
    marked.setOptions({
      gfm: options?.gfm !== false, // Default to true
      breaks: true,
      pedantic: false,
    });

    // Parse markdown to get tokens
    let tokens: Token[];
    try {
      tokens = marked.lexer(markdown);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to parse markdown: ${message}`);
    }

    // Extract headings from tokens
    const headings = extractHeadings(tokens);

    // Convert to HTML
    let html: string;
    try {
      html = marked.parser(tokens);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to convert markdown to HTML: ${message}`);
    }

    // Simple sanitization if requested
    if (options?.sanitize) {
      // Remove script tags and event handlers
      html = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/javascript:/gi, '');
    }

    return {
      html,
      headings,
    };
  },
});

export default markdownToHtmlTool;
