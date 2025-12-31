/**
 * Diff Text Unified Tool for TPMJS
 * Creates unified diff between two text strings with context lines
 */

import { jsonSchema, tool } from 'ai';
import { createTwoFilesPatch } from 'diff';

/**
 * Output interface for the diff result
 */
export interface DiffResult {
  diff: string;
  additions: number;
  deletions: number;
  changes: number;
  hasChanges: boolean;
  summary: string;
}

type DiffTextUnifiedInput = {
  original: string;
  modified: string;
  contextLines?: number;
};

/**
 * Counts additions and deletions from a unified diff
 */
function analyzeDiff(diffString: string): {
  additions: number;
  deletions: number;
} {
  const lines = diffString.split('\n');
  let additions = 0;
  let deletions = 0;

  for (const line of lines) {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      additions++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      deletions++;
    }
  }

  return { additions, deletions };
}

/**
 * Diff Text Unified Tool
 * Creates unified diff between two text strings
 */
export const diffTextUnified = tool({
  description:
    'Creates a unified diff between two text strings, showing additions, deletions, and context lines. Returns the diff in unified format along with statistics about changes. Useful for comparing versions of code, documents, or any text content.',
  inputSchema: jsonSchema<DiffTextUnifiedInput>({
    type: 'object',
    properties: {
      original: {
        type: 'string',
        description: 'The original text to compare from',
      },
      modified: {
        type: 'string',
        description: 'The modified text to compare to',
      },
      contextLines: {
        type: 'number',
        description: 'Number of context lines to show around changes (default: 3)',
        default: 3,
      },
    },
    required: ['original', 'modified'],
    additionalProperties: false,
  }),
  async execute({ original, modified, contextLines = 3 }): Promise<DiffResult> {
    // Validate inputs
    if (typeof original !== 'string') {
      throw new Error('original must be a string');
    }
    if (typeof modified !== 'string') {
      throw new Error('modified must be a string');
    }
    if (contextLines !== undefined && (typeof contextLines !== 'number' || contextLines < 0)) {
      throw new Error('contextLines must be a non-negative number');
    }

    // Create unified diff
    const diff = createTwoFilesPatch(
      'original',
      'modified',
      original,
      modified,
      undefined,
      undefined,
      { context: contextLines }
    );

    // Analyze the diff
    const { additions, deletions } = analyzeDiff(diff);
    const changes = additions + deletions;
    const hasChanges = changes > 0;

    // Create summary
    let summary: string;
    if (!hasChanges) {
      summary = 'No changes detected';
    } else {
      const parts: string[] = [];
      if (additions > 0) parts.push(`${additions} addition${additions !== 1 ? 's' : ''}`);
      if (deletions > 0) parts.push(`${deletions} deletion${deletions !== 1 ? 's' : ''}`);
      summary = parts.join(', ');
    }

    return {
      diff,
      additions,
      deletions,
      changes,
      hasChanges,
      summary,
    };
  },
});

export default diffTextUnified;
