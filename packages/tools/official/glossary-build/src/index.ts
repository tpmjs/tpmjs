/**
 * Glossary Build Tool for TPMJS
 * Builds a glossary from term definitions in text.
 * Detects patterns like "Term: definition" or "Term - definition"
 */

import { jsonSchema, tool } from 'ai';

/**
 * Output interface for glossary building
 */
export interface GlossaryResult {
  terms: Array<{
    term: string;
    definition: string;
  }>;
  count: number;
  alphabetized: boolean;
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
 * Extracts glossary terms from text
 */
function extractGlossary(text: string): Array<{ term: string; definition: string }> {
  const lines = text.split('\n');
  const terms: Array<{ term: string; definition: string }> = [];
  const seenTerms = new Set<string>();

  for (const line of lines) {
    const result = extractTermDefinition(line);

    if (result) {
      // Avoid duplicates (case-insensitive)
      const termLower = result.term.toLowerCase();
      if (!seenTerms.has(termLower)) {
        seenTerms.add(termLower);
        terms.push(result);
      }
    }
  }

  return terms;
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
    // Validate input
    if (!text || typeof text !== 'string') {
      throw new Error('Text is required and must be a string');
    }

    if (text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    // Extract glossary terms
    const terms = extractGlossary(text);

    return {
      terms,
      count: terms.length,
      alphabetized: isAlphabetized(terms),
    };
  },
});

export default glossaryBuildTool;
