/**
 * Regex Extract Tool for TPMJS
 * Extracts all regex matches from text with optional capture group support
 */

import { jsonSchema, tool } from 'ai';

/**
 * Input interface for regex extraction
 */
interface RegexExtractInput {
  text: string;
  pattern: string;
  flags?: string;
  groups?: boolean;
}

/**
 * Match object with capture groups
 */
interface MatchWithGroups {
  match: string;
  groups: Record<string, string | undefined>;
  index: number;
}

/**
 * Output interface for regex extract result
 */
export interface RegexExtractResult {
  matches: string[] | MatchWithGroups[];
  matchCount: number;
  hasMatches: boolean;
}

/**
 * Regex Extract Tool
 * Extracts all matches from text using a regular expression pattern
 */
export const regexExtractTool = tool({
  description:
    'Extract all regex matches from text. Supports regex flags (g, i, m, s, u, y) and optional capture group extraction. Returns all matches with their positions and capture groups if requested. Useful for parsing structured text, extracting patterns, or validating formats.',
  inputSchema: jsonSchema<RegexExtractInput>({
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to search for matches',
      },
      pattern: {
        type: 'string',
        description: 'Regular expression pattern (without delimiters)',
      },
      flags: {
        type: 'string',
        description:
          'Regular expression flags (g=global, i=case-insensitive, m=multiline, s=dotAll, u=unicode, y=sticky). The "g" flag is added automatically if not present.',
      },
      groups: {
        type: 'boolean',
        description:
          'If true, return matches as objects with capture groups and positions. If false, return simple string array of full matches. (default: false)',
      },
    },
    required: ['text', 'pattern'],
    additionalProperties: false,
  }),
  execute: async ({ text, pattern, flags = '', groups = false }): Promise<RegexExtractResult> => {
    // Validate input
    if (typeof text !== 'string') {
      throw new Error('Text must be a string');
    }

    if (typeof pattern !== 'string') {
      throw new Error('Pattern must be a string');
    }

    // Ensure 'g' flag is present for matchAll
    const finalFlags = flags.includes('g') ? flags : `${flags}g`;

    try {
      // Create regex
      const regex = new RegExp(pattern, finalFlags);

      // Extract all matches
      const matchIterator = text.matchAll(regex);
      const allMatches = Array.from(matchIterator);

      if (groups) {
        // Return detailed match information with capture groups
        const matches: MatchWithGroups[] = allMatches.map((match) => ({
          match: match[0],
          groups: match.groups || {},
          index: match.index ?? 0,
        }));

        return {
          matches,
          matchCount: matches.length,
          hasMatches: matches.length > 0,
        };
      }
      // Return simple string array
      const matches = allMatches.map((match) => match[0]);

      return {
        matches,
        matchCount: matches.length,
        hasMatches: matches.length > 0,
      };
    } catch (error) {
      throw new Error(
        `Failed to extract regex matches: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});

export default regexExtractTool;
