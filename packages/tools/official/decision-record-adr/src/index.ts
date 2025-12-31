/**
 * Decision Record ADR Tool for TPMJS
 * Creates Architecture Decision Records (ADR) from structured input
 * Follows the standard ADR template format
 */

import { jsonSchema, tool } from 'ai';

/**
 * Output interface for the ADR
 */
export interface DecisionRecord {
  adr: string;
  date: string;
  status: string;
}

type DecisionRecordInput = {
  title: string;
  context: string;
  decision: string;
  consequences: string[];
};

/**
 * Formats a date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Sanitizes the title to create a valid filename
 */
function sanitizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Categorizes consequences as positive or negative based on keywords
 */
function categorizeConsequences(consequences: string[]): {
  positive: string[];
  negative: string[];
  neutral: string[];
} {
  const positive: string[] = [];
  const negative: string[] = [];
  const neutral: string[] = [];

  for (const consequence of consequences) {
    const lower = consequence.toLowerCase();

    // Check for positive indicators
    if (
      /\b(benefit|improve|increase|better|enhance|gain|advantage|efficient|simplif|easier)\b/i.test(
        lower
      )
    ) {
      positive.push(consequence);
    }
    // Check for negative indicators
    else if (
      /\b(cost|risk|complex|difficult|challenge|problem|issue|concern|limitation|drawback|overhead)\b/i.test(
        lower
      )
    ) {
      negative.push(consequence);
    }
    // Otherwise neutral
    else {
      neutral.push(consequence);
    }
  }

  return { positive, negative, neutral };
}

/**
 * Decision Record ADR Tool
 * Creates Architecture Decision Records following the standard template
 */
export const decisionRecordADRTool = tool({
  description:
    'Create an Architecture Decision Record (ADR) from structured input. Follows the standard ADR format with title, status, context, decision, and consequences. Useful for documenting important technical and architectural decisions.',
  inputSchema: jsonSchema<DecisionRecordInput>({
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Title of the decision (e.g., "Use PostgreSQL for primary database")',
      },
      context: {
        type: 'string',
        description:
          'Context and background information that led to this decision. What forces are at play?',
      },
      decision: {
        type: 'string',
        description: 'The decision that was made. What are we going to do?',
      },
      consequences: {
        type: 'array',
        description:
          'Array of consequences (both positive and negative). What becomes easier or harder?',
        items: {
          type: 'string',
        },
      },
    },
    required: ['title', 'context', 'decision', 'consequences'],
    additionalProperties: false,
  }),
  async execute({ title, context, decision, consequences }): Promise<DecisionRecord> {
    // Validate input
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new Error('Title is required and must be a non-empty string');
    }

    if (!context || typeof context !== 'string' || context.trim().length === 0) {
      throw new Error('Context is required and must be a non-empty string');
    }

    if (!decision || typeof decision !== 'string' || decision.trim().length === 0) {
      throw new Error('Decision is required and must be a non-empty string');
    }

    if (!Array.isArray(consequences) || consequences.length === 0) {
      throw new Error('Consequences must be a non-empty array');
    }

    // Validate all consequences are strings
    for (let i = 0; i < consequences.length; i++) {
      const consequence = consequences[i];
      if (!consequence || typeof consequence !== 'string' || consequence.trim().length === 0) {
        throw new Error(`Consequence at index ${i} must be a non-empty string`);
      }
    }

    const date = formatDate(new Date());
    const status = 'Accepted';
    const filename = sanitizeTitle(title);

    // Categorize consequences
    const categorized = categorizeConsequences(consequences);

    // Build consequences section
    let consequencesSection = '## Consequences\n\n';

    if (categorized.positive.length > 0) {
      consequencesSection += '### Positive\n\n';
      consequencesSection += categorized.positive.map((c) => `- ${c}`).join('\n');
      consequencesSection += '\n\n';
    }

    if (categorized.negative.length > 0) {
      consequencesSection += '### Negative\n\n';
      consequencesSection += categorized.negative.map((c) => `- ${c}`).join('\n');
      consequencesSection += '\n\n';
    }

    if (categorized.neutral.length > 0) {
      consequencesSection += '### Other\n\n';
      consequencesSection += categorized.neutral.map((c) => `- ${c}`).join('\n');
      consequencesSection += '\n';
    }

    // Format the ADR in standard format
    const adr = `# ${title}

**Status:** ${status}

**Date:** ${date}

**Filename:** \`${filename}.md\`

## Context

${context}

## Decision

${decision}

${consequencesSection}`;

    return {
      adr,
      date,
      status,
    };
  },
});

export default decisionRecordADRTool;
