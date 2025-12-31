/**
 * HTML to Markdown Tool for TPMJS
 * Converts HTML to markdown using turndown
 *
 * @requires Node.js 18+
 */

import { jsonSchema, tool } from 'ai';
import TurndownService from 'turndown';

/**
 * Options for HTML to markdown conversion
 */
export interface ConversionOptions {
  headingStyle?: 'setext' | 'atx';
  bulletListMarker?: '-' | '*' | '+';
}

/**
 * Input for HTML to markdown conversion
 */
type HtmlToMarkdownInput = {
  html: string;
  options?: ConversionOptions;
};

/**
 * Output interface for HTML to markdown conversion
 */
export interface HtmlToMarkdownResult {
  markdown: string;
  wordCount: number;
}

/**
 * Count words in markdown text
 */
function countWords(text: string): number {
  // Remove markdown formatting characters for accurate word count
  const plainText = text
    .replace(/[#*_`~\[\]()]/g, ' ') // Remove markdown syntax
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  if (plainText.length === 0) {
    return 0;
  }

  return plainText.split(' ').filter((word) => word.length > 0).length;
}

/**
 * HTML to Markdown Tool
 * Converts HTML to markdown with customizable formatting options
 */
export const htmlToMarkdownTool = tool({
  description:
    'Convert HTML to markdown format. Supports headings, lists, links, images, code blocks, tables, and more. Customizable output with heading style and list marker options.',
  inputSchema: jsonSchema<HtmlToMarkdownInput>({
    type: 'object',
    properties: {
      html: {
        type: 'string',
        description: 'The HTML string to convert to markdown',
      },
      options: {
        type: 'object',
        description: 'Optional configuration for markdown formatting',
        properties: {
          headingStyle: {
            type: 'string',
            enum: ['setext', 'atx'],
            description: 'Heading style: "setext" (underlined) or "atx" (# prefix). Default: "atx"',
          },
          bulletListMarker: {
            type: 'string',
            enum: ['-', '*', '+'],
            description: 'Bullet list marker character. Default: "-"',
          },
        },
      },
    },
    required: ['html'],
    additionalProperties: false,
  }),
  async execute({ html, options }): Promise<HtmlToMarkdownResult> {
    // Validate input
    if (typeof html !== 'string') {
      throw new Error('HTML input must be a string');
    }

    // Create turndown service with options
    const turndownService = new TurndownService({
      headingStyle: options?.headingStyle || 'atx',
      bulletListMarker: options?.bulletListMarker || '-',
      codeBlockStyle: 'fenced',
      emDelimiter: '*',
      strongDelimiter: '**',
    });

    // Convert HTML to markdown
    let markdown: string;
    try {
      markdown = turndownService.turndown(html);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to convert HTML to markdown: ${message}`);
    }

    // Count words in the markdown
    const wordCount = countWords(markdown);

    return {
      markdown,
      wordCount,
    };
  },
});

export default htmlToMarkdownTool;
