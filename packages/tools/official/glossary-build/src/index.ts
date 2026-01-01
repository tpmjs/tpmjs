/**
 * Glossary Build Tool for TPMJS
 * Builds a glossary from term definitions in text.
 * Detects patterns like "Term: definition" or "Term - definition"
 */

import { jsonSchema, tool } from 'ai';

/**
 * Individual glossary term
 */
export interface GlossaryTerm {
  term: string;
  definition: string;
}

/**
 * Warning for potentially malformed input
 */
export interface GlossaryWarning {
  line: number;
  text: string;
  reason: string;
}

/**
 * Output interface for glossary building
 */
export interface GlossaryResult {
  terms: GlossaryTerm[];
  count: number;
  alphabetized: boolean;
  warnings: GlossaryWarning[];
}

type GlossaryBuildInput = {
  text: string;
};

/**
 * Detects if a line contains a term definition
 * Patterns: "Term: definition", "Term - definition", "**Term** definition"
 */
function extractTermDefinition(line: string): { term: string; definition: string } | null {
  const trimmed = line.trim();

  // Empty lines are not definitions
  if (!trimmed || trimmed.length < 5) return null;

  // Pattern 1: "Term: definition" or "Term : definition"
  const colonMatch = trimmed.match(/^([^:]+?)\s*:\s*(.+)$/);
  if (colonMatch?.[1] && colonMatch[2]) {
    const term = colonMatch[1].trim();
    const definition = colonMatch[2].trim();
    if (term.length > 0 && definition.length > 5) {
      return { term: cleanTerm(term), definition };
    }
  }

  // Pattern 2: "Term - definition" or "Term — definition"
  const dashMatch = trimmed.match(/^([^-—]+?)\s*[-—]\s*(.+)$/);
  if (dashMatch?.[1] && dashMatch[2]) {
    const term = dashMatch[1].trim();
    const definition = dashMatch[2].trim();
    if (term.length > 0 && definition.length > 5) {
      return { term: cleanTerm(term), definition };
    }
  }

  // Pattern 3: "**Term** definition" or "*Term* definition" (Markdown bold/italic)
  const boldMatch = trimmed.match(/^\*\*([^*]+)\*\*\s+(.+)$/);
  if (boldMatch?.[1] && boldMatch[2]) {
    const term = boldMatch[1].trim();
    const definition = boldMatch[2].trim();
    if (term.length > 0 && definition.length > 5) {
      return { term: cleanTerm(term), definition };
    }
  }

  const italicMatch = trimmed.match(/^\*([^*]+)\*\s+(.+)$/);
  if (italicMatch?.[1] && italicMatch[2]) {
    const term = italicMatch[1].trim();
    const definition = italicMatch[2].trim();
    if (term.length > 0 && definition.length > 5) {
      return { term: cleanTerm(term), definition };
    }
  }

  // Pattern 4: "Term\ndefinition" (term on its own line, definition follows)
  // This is harder to detect in a single line, so we skip it for now

  return null;
}

/**
 * Cleans up term formatting (remove bold, italic, extra spaces)
 */
function cleanTerm(term: string): string {
  return term
    .replace(/\*\*/g, '') // Remove bold markers
    .replace(/\*/g, '') // Remove italic markers
    .replace(/`/g, '') // Remove code markers
    .replace(/^\d+\.\s*/, '') // Remove leading numbers
    .replace(/^[-•]\s*/, '') // Remove leading bullets
    .trim();
}

/**
 * Checks if a line looks like it might be a term definition but couldn't be parsed
 */
function checkForMalformedDefinition(line: string): string | null {
  const trimmed = line.trim();

  // Skip empty or very short lines
  if (!trimmed || trimmed.length < 3) return null;

  // Check for partial patterns that suggest a definition was intended
  // Short term with colon but no definition
  if (/^[^:]+:\s*$/.test(trimmed)) {
    return 'Term followed by colon but missing definition';
  }

  // Term followed by dash but no definition
  if (/^[^-—]+[-—]\s*$/.test(trimmed)) {
    return 'Term followed by dash but missing definition';
  }

  // Very long "term" (probably not a real term definition)
  const colonMatch = trimmed.match(/^([^:]+):/);
  if (colonMatch?.[1] && colonMatch[1].length > 50) {
    return 'Term is unusually long (>50 chars) - might not be a glossary entry';
  }

  // Very short definition
  const shortDefMatch = trimmed.match(/^([^:]+):\s*(.{1,5})$/);
  if (shortDefMatch?.[2]) {
    return 'Definition is too short (less than 6 characters)';
  }

  // Markdown bold with no following definition
  if (/^\*\*[^*]+\*\*\s*$/.test(trimmed)) {
    return 'Bold term but missing definition after it';
  }

  return null;
}

/**
 * Extracts glossary terms from text
 */
function extractGlossary(text: string): {
  terms: GlossaryTerm[];
  warnings: GlossaryWarning[];
} {
  const lines = text.split('\n');
  const termMap = new Map<string, { term: string; definitions: string[] }>();
  const warnings: GlossaryWarning[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const result = extractTermDefinition(line);

    if (result) {
      // Merge duplicates (case-insensitive)
      const termLower = result.term.toLowerCase();
      const existing = termMap.get(termLower);

      if (!existing) {
        termMap.set(termLower, {
          term: result.term,
          definitions: [result.definition],
        });
      } else {
        // Merge definition if it's different
        if (!existing.definitions.includes(result.definition)) {
          existing.definitions.push(result.definition);
          warnings.push({
            line: i + 1,
            text: line.slice(0, 50) + (line.length > 50 ? '...' : ''),
            reason: `Duplicate term "${result.term}" - definitions merged`,
          });
        } else {
          warnings.push({
            line: i + 1,
            text: line.slice(0, 50) + (line.length > 50 ? '...' : ''),
            reason: `Duplicate term "${result.term}" with identical definition - skipped`,
          });
        }
      }
    } else {
      // Check if this line looks like a malformed definition
      const malformedReason = checkForMalformedDefinition(line);
      if (malformedReason) {
        warnings.push({
          line: i + 1,
          text: line.slice(0, 50) + (line.length > 50 ? '...' : ''),
          reason: malformedReason,
        });
      }
    }
  }

  // Convert map to array, merging definitions with semicolons
  const terms = Array.from(termMap.values()).map((entry) => ({
    term: entry.term,
    definition: entry.definitions.join('; '),
  }));

  return { terms, warnings };
}

/**
 * Checks if an array of terms is alphabetically sorted
 */
function isAlphabetized(terms: Array<{ term: string; definition: string }>): boolean {
  if (terms.length <= 1) return true;

  for (let i = 1; i < terms.length; i++) {
    const prev = terms[i - 1]?.term.toLowerCase();
    const curr = terms[i]?.term.toLowerCase();
    if (prev && curr && prev > curr) {
      return false;
    }
  }

  return true;
}

/**
 * Glossary Build Tool
 * Builds a glossary from term definitions in text
 */
export const glossaryBuildTool = tool({
  description:
    'Build a glossary from term definitions in text. Detects patterns like "Term: definition", "Term - definition", "**Term** definition", and extracts them into a structured glossary. Returns an array of term-definition pairs with metadata about alphabetization.',
  inputSchema: jsonSchema<GlossaryBuildInput>({
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'Text containing term definitions in various formats',
      },
    },
    required: ['text'],
    additionalProperties: false,
  }),
  async execute({ text }): Promise<GlossaryResult> {
    // Validate input with specific error messages
    if (text === null || text === undefined) {
      throw new Error('Text is required - please provide text containing glossary definitions');
    }

    if (typeof text !== 'string') {
      throw new Error(
        `Text must be a string, but received ${typeof text}. Please provide text as a string.`
      );
    }

    if (text.trim().length === 0) {
      throw new Error(
        'Text cannot be empty. Please provide text containing term definitions ' +
          '(e.g., "Term: definition" or "Term - definition")'
      );
    }

    // Extract glossary terms with warnings
    const { terms, warnings } = extractGlossary(text);

    // Add warning if no terms were found but text was provided
    if (terms.length === 0 && text.trim().length > 0) {
      warnings.push({
        line: 0,
        text: '',
        reason:
          'No glossary entries found. Expected format: "Term: definition" or "Term - definition"',
      });
    }

    return {
      terms,
      count: terms.length,
      alphabetized: isAlphabetized(terms),
      warnings,
    };
  },
});

export default glossaryBuildTool;
