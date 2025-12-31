/**
 * Normalize Whitespace Tool for TPMJS
 * Normalizes whitespace in text by trimming lines, collapsing spaces,
 * and standardizing line endings
 */

import { jsonSchema, tool } from 'ai';

/**
 * Options for whitespace normalization
 */
export interface NormalizeOptions {
  trimLines?: boolean;
  collapseSpaces?: boolean;
  normalizeLineEndings?: boolean;
}

/**
 * Statistics about changes made during normalization
 */
export interface WhitespaceChanges {
  linesTrimmed: number;
  spacesCollapsed: number;
  lineEndingsNormalized: number;
  originalLength: number;
  normalizedLength: number;
}

/**
 * Output interface for normalize whitespace result
 */
export interface NormalizeWhitespaceResult {
  text: string;
  changes: WhitespaceChanges;
}

type NormalizeWhitespaceInput = {
  text: string;
  options?: NormalizeOptions;
};

/**
 * Default normalization options
 */
const DEFAULT_OPTIONS: Required<NormalizeOptions> = {
  trimLines: true,
  collapseSpaces: true,
  normalizeLineEndings: true,
};

/**
 * Normalizes line endings to \n (LF)
 */
function normalizeLineEndings(text: string): { text: string; count: number } {
  let count = 0;
  const normalized = text.replace(/\r\n/g, () => {
    count++;
    return '\n';
  });
  return { text: normalized, count };
}

/**
 * Trims whitespace from the start and end of each line
 */
function trimLines(text: string): { text: string; count: number } {
  const lines = text.split('\n');
  let count = 0;

  const trimmed = lines.map((line) => {
    const before = line.length;
    const trimmedLine = line.trim();
    if (trimmedLine.length < before) {
      count++;
    }
    return trimmedLine;
  });

  return { text: trimmed.join('\n'), count };
}

/**
 * Collapses multiple consecutive spaces into a single space
 */
function collapseSpaces(text: string): { text: string; count: number } {
  let count = 0;
  const collapsed = text.replace(/ {2,}/g, (match) => {
    count += match.length - 1;
    return ' ';
  });
  return { text: collapsed, count };
}

/**
 * Normalize Whitespace Tool
 * Normalizes whitespace in text with configurable options
 */
export const normalizeWhitespaceTool = tool({
  description:
    'Normalize whitespace in text by trimming lines, collapsing multiple spaces, and standardizing line endings. Useful for cleaning up text data, formatting content, or preparing text for processing.',
  inputSchema: jsonSchema<NormalizeWhitespaceInput>({
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to normalize',
      },
      options: {
        type: 'object',
        description: 'Normalization options',
        properties: {
          trimLines: {
            type: 'boolean',
            description: 'Trim whitespace from start and end of each line (default: true)',
          },
          collapseSpaces: {
            type: 'boolean',
            description: 'Collapse multiple consecutive spaces into one (default: true)',
          },
          normalizeLineEndings: {
            type: 'boolean',
            description: 'Convert all line endings to LF (\\n) (default: true)',
          },
        },
        additionalProperties: false,
      },
    },
    required: ['text'],
    additionalProperties: false,
  }),
  async execute({ text, options = {} }): Promise<NormalizeWhitespaceResult> {
    // Validate input
    if (typeof text !== 'string') {
      throw new Error('Text must be a string');
    }

    // Merge with default options
    const opts: Required<NormalizeOptions> = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    // Track changes
    const changes: WhitespaceChanges = {
      linesTrimmed: 0,
      spacesCollapsed: 0,
      lineEndingsNormalized: 0,
      originalLength: text.length,
      normalizedLength: 0,
    };

    let normalized = text;

    // Apply normalizations in order
    if (opts.normalizeLineEndings) {
      const result = normalizeLineEndings(normalized);
      normalized = result.text;
      changes.lineEndingsNormalized = result.count;
    }

    if (opts.collapseSpaces) {
      const result = collapseSpaces(normalized);
      normalized = result.text;
      changes.spacesCollapsed = result.count;
    }

    if (opts.trimLines) {
      const result = trimLines(normalized);
      normalized = result.text;
      changes.linesTrimmed = result.count;
    }

    changes.normalizedLength = normalized.length;

    return {
      text: normalized,
      changes,
    };
  },
});

export default normalizeWhitespaceTool;
