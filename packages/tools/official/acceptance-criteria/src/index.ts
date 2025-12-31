/**
 * Acceptance Criteria Tool for TPMJS
 * Formats acceptance criteria from requirements using Given/When/Then (Gherkin) format
 */

import { jsonSchema, tool } from 'ai';

/**
 * Single criterion with Given/When/Then structure
 */
export interface Criterion {
  given: string;
  when: string;
  then: string;
}

/**
 * Output interface for acceptance criteria
 */
export interface AcceptanceCriteria {
  formatted: string;
  criteriaCount: number;
}

type AcceptanceCriteriaInput = {
  story: string;
  criteria: Criterion[];
};

/**
 * Validates a single criterion object
 */
function validateCriterion(criterion: unknown, index: number): criterion is Criterion {
  if (!criterion || typeof criterion !== 'object') {
    throw new Error(`Criterion at index ${index} must be an object`);
  }

  const c = criterion as Record<string, unknown>;

  if (!c.given || typeof c.given !== 'string' || c.given.trim().length === 0) {
    throw new Error(`Criterion at index ${index} must have a non-empty 'given' property`);
  }

  if (!c.when || typeof c.when !== 'string' || c.when.trim().length === 0) {
    throw new Error(`Criterion at index ${index} must have a non-empty 'when' property`);
  }

  if (!c.then || typeof c.then !== 'string' || c.then.trim().length === 0) {
    throw new Error(`Criterion at index ${index} must have a non-empty 'then' property`);
  }

  return true;
}

/**
 * Formats a single criterion in Gherkin style
 */
function formatCriterion(criterion: Criterion, index: number): string {
  const scenarioNumber = index + 1;
  const scenarioTitle = `Scenario ${scenarioNumber}`;

  return `### ${scenarioTitle}

**Given** ${criterion.given}
**When** ${criterion.when}
**Then** ${criterion.then}`;
}

/**
 * Extracts a short title from the story for the heading
 */
function extractTitle(story: string): string {
  // Take first sentence or first 80 characters
  const firstSentence = story.split(/[.!?]/)[0]?.trim();
  if (!firstSentence) return 'User Story';

  if (firstSentence.length <= 80) {
    return firstSentence;
  }

  return `${firstSentence.substring(0, 77)}...`;
}

/**
 * Acceptance Criteria Tool
 * Formats acceptance criteria using Given/When/Then (Gherkin) format
 */
export const acceptanceCriteriaTool = tool({
  description:
    'Format acceptance criteria from requirements using the Given/When/Then (Gherkin) format. Ideal for defining testable requirements for user stories and features in BDD style.',
  inputSchema: jsonSchema<AcceptanceCriteriaInput>({
    type: 'object',
    properties: {
      story: {
        type: 'string',
        description: 'The user story or feature description',
      },
      criteria: {
        type: 'array',
        description:
          'Array of criteria objects, each with given, when, and then properties following Gherkin format',
        items: {
          type: 'object',
          properties: {
            given: {
              type: 'string',
              description: 'The initial context or precondition',
            },
            when: {
              type: 'string',
              description: 'The action or event that occurs',
            },
            then: {
              type: 'string',
              description: 'The expected outcome or result',
            },
          },
          required: ['given', 'when', 'then'],
        },
      },
    },
    required: ['story', 'criteria'],
    additionalProperties: false,
  }),
  async execute({ story, criteria }): Promise<AcceptanceCriteria> {
    // Validate story
    if (!story || typeof story !== 'string' || story.trim().length === 0) {
      throw new Error('Story is required and must be a non-empty string');
    }

    // Validate criteria array
    if (!Array.isArray(criteria)) {
      throw new Error('Criteria must be an array');
    }

    if (criteria.length === 0) {
      throw new Error('Criteria array must contain at least one criterion');
    }

    if (criteria.length > 20) {
      throw new Error('Criteria array cannot contain more than 20 criteria');
    }

    // Validate each criterion
    for (let i = 0; i < criteria.length; i++) {
      validateCriterion(criteria[i], i);
    }

    // Format the acceptance criteria
    const title = extractTitle(story);
    const formattedCriteria = criteria.map((c, i) => formatCriterion(c, i)).join('\n\n');

    const formatted = `# Acceptance Criteria

## ${title}

${story}

---

## Scenarios

${formattedCriteria}
`;

    return {
      formatted,
      criteriaCount: criteria.length,
    };
  },
});

export default acceptanceCriteriaTool;
