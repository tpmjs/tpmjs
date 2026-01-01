/**
 * Normalize Whitespace Tool for TPMJS
 * Normalizes whitespace in text by trimming lines, collapsing spaces,
 * and standardizing line endings
 *
 * Domain rule: whitespace_normalization - Multiple modes for whitespace handling
 * Domain rule: line_ending_normalization - Standardizes line endings to LF
 */

import { jsonSchema, tool } from 'ai';

/**
 * Normalization modes
 */
type NormalizationMode = 'collapse' | 'trim' | 'paragraphs';

/**
 * Statistics about changes made during normalization
 */
export interface WhitespaceChanges {
  linesTrimmed: number;
  spacesCollapsed: number;
  lineEndingsNormalized: number;
  paragraphsPreserved: number;
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
  mode?: NormalizationMode;
};

/**
 * Domain rule: line_ending_normalization - Normalizes line endings to \n (LF)
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
 * Domain rule: whitespace_normalization - Trims whitespace from the start and end of each line
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
 * Domain rule: whitespace_normalization - Collapses multiple consecutive spaces into a single space
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
 * Domain rule: whitespace_normalization - Collapses all whitespace into single spaces, removing all newlines
 */
function collapseAllWhitespace(text: string): { text: string; spacesCollapsed: number } {
  let spacesCollapsed = 0;
  const collapsed = text.replace(/\s+/g, (match) => {
    spacesCollapsed += match.length - 1;
    return ' ';
  });
  return { text: collapsed.trim(), spacesCollapsed };
}

/**
 * Domain rule: whitespace_normalization - Preserves paragraph breaks (2+ newlines) while collapsing other whitespace
 */
function preserveParagraphs(text: string): {
  text: string;
  paragraphsPreserved: number;
  spacesCollapsed: number;
} {
  // Split on paragraph breaks (2+ consecutive newlines)
  const paragraphs = text.split(/\n\s*\n+/);
  let spacesCollapsed = 0;
  let paragraphsPreserved = 0;

  const normalized = paragraphs
    .map((para) => {
      // Collapse whitespace within each paragraph
      const result = collapseAllWhitespace(para);
      spacesCollapsed += result.spacesCollapsed;
      return result.text;
    })
    .filter((para) => para.length > 0);

  paragraphsPreserved = normalized.length - 1; // Number of paragraph breaks preserved

  return {
    text: normalized.join('\n\n'),
    paragraphsPreserved: Math.max(0, paragraphsPreserved),
    spacesCollapsed,
  };
}

/**
 * Normalize Whitespace Tool
 * Normalizes whitespace in text with configurable modes
 */
export const normalizeWhitespaceTool = tool({
  description:
    'Normalize whitespace in text. Supports three modes: "collapse" (all whitespace becomes single spaces), "trim" (trim lines and normalize line endings), "paragraphs" (preserve paragraph breaks while collapsing whitespace). Default mode is "collapse".',
  inputSchema: jsonSchema<NormalizeWhitespaceInput>({
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to normalize',
      },
      mode: {
        type: 'string',
        enum: ['collapse', 'trim', 'paragraphs'],
        description:
          'Normalization mode: "collapse" (all whitespace → single spaces), "trim" (trim lines, keep structure), "paragraphs" (preserve paragraph breaks). Default: "collapse"',
      },
    },
    required: ['text'],
    additionalProperties: false,
  }),
  async execute({ text, mode = 'collapse' }): Promise<NormalizeWhitespaceResult> {
    // Validate input
    if (typeof text !== 'string') {
      throw new Error('Text must be a string');
    }

    // Validate mode
    const validModes: NormalizationMode[] = ['collapse', 'trim', 'paragraphs'];
    if (!validModes.includes(mode)) {
      throw new Error(`Invalid mode: ${mode}. Must be one of: ${validModes.join(', ')}`);
    }

    // Track changes
    const changes: WhitespaceChanges = {
      linesTrimmed: 0,
      spacesCollapsed: 0,
      lineEndingsNormalized: 0,
      paragraphsPreserved: 0,
      originalLength: text.length,
      normalizedLength: 0,
    };

    let normalized: string;

    // Apply normalization based on mode
    switch (mode) {
      case 'collapse': {
        // Collapse all whitespace into single spaces
        const result = collapseAllWhitespace(text);
        normalized = result.text;
        changes.spacesCollapsed = result.spacesCollapsed;
        break;
      }

      case 'trim': {
        // Normalize line endings, trim lines, collapse spaces on each line
        let temp = text;

        const lineEndingsResult = normalizeLineEndings(temp);
        temp = lineEndingsResult.text;
        changes.lineEndingsNormalized = lineEndingsResult.count;

        const trimResult = trimLines(temp);
        temp = trimResult.text;
        changes.linesTrimmed = trimResult.count;

        const collapseResult = collapseSpaces(temp);
        normalized = collapseResult.text;
        changes.spacesCollapsed = collapseResult.count;
        break;
      }

      case 'paragraphs': {
        // Preserve paragraph breaks (2+ newlines) while collapsing whitespace
        const result = preserveParagraphs(text);
        normalized = result.text;
        changes.paragraphsPreserved = result.paragraphsPreserved;
        changes.spacesCollapsed = result.spacesCollapsed;
        break;
      }

      default:
        throw new Error(`Unknown mode: ${mode}`);
    }

    changes.normalizedLength = normalized.length;

    return {
      text: normalized,
      changes,
    };
  },
});

export default normalizeWhitespaceTool;
