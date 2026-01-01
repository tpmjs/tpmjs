/**
 * Rubric Create Tool for TPMJS
 * Creates grading rubrics with criteria, levels, and point values
 */

import { jsonSchema, tool } from 'ai';

/**
 * Performance level with description and point range
 */
export interface PerformanceLevel {
  level: string;
  description: string;
  pointsMin: number;
  pointsMax: number;
}

/**
 * Single rubric criterion with performance levels
 */
export interface RubricCriterion {
  name: string;
  description: string;
  weight: number;
  levels: PerformanceLevel[];
}

/**
 * Complete grading rubric output
 * Domain rule compliance: Criteria with levels and clear point allocation
 */
export interface GradingRubric {
  assignment: string;
  totalPoints: number;
  criteria: RubricCriterion[]; // Domain rule: rubric_structure (criteria with levels)
  formatted: string;
}

type RubricCreateInput = {
  assignment: string;
  criteria: string[];
  totalPoints: number;
};

/**
 * Validates that criteria array is valid
 */
function validateCriteria(criteria: unknown): criteria is string[] {
  if (!Array.isArray(criteria)) {
    throw new Error('Criteria must be an array');
  }

  if (criteria.length === 0) {
    throw new Error('Criteria array must contain at least one criterion');
  }

  if (criteria.length > 10) {
    throw new Error('Criteria array cannot contain more than 10 criteria');
  }

  for (let i = 0; i < criteria.length; i++) {
    if (typeof criteria[i] !== 'string' || criteria[i].trim().length === 0) {
      throw new Error(`Criterion at index ${i} must be a non-empty string`);
    }
  }

  return true;
}

/**
 * Validates total points
 */
function validateTotalPoints(totalPoints: unknown): totalPoints is number {
  if (typeof totalPoints !== 'number') {
    throw new Error('Total points must be a number');
  }

  if (totalPoints <= 0 || totalPoints > 1000) {
    throw new Error('Total points must be between 1 and 1000');
  }

  if (!Number.isInteger(totalPoints)) {
    throw new Error('Total points must be an integer');
  }

  return true;
}

/**
 * Creates performance levels for a criterion
 */
function createPerformanceLevels(criterionWeight: number, totalPoints: number): PerformanceLevel[] {
  const maxPoints = Math.round((criterionWeight * totalPoints) / 100);
  const quarterPoints = Math.ceil(maxPoints / 4);

  return [
    {
      level: 'Exemplary',
      description: 'Exceeds expectations with exceptional quality and insight',
      pointsMin: maxPoints - quarterPoints + 1,
      pointsMax: maxPoints,
    },
    {
      level: 'Proficient',
      description: 'Meets all expectations with good quality',
      pointsMin: Math.round(maxPoints * 0.5) + 1,
      pointsMax: maxPoints - quarterPoints,
    },
    {
      level: 'Developing',
      description: 'Partially meets expectations, needs improvement',
      pointsMin: quarterPoints + 1,
      pointsMax: Math.round(maxPoints * 0.5),
    },
    {
      level: 'Beginning',
      description: 'Does not meet expectations, significant improvement needed',
      pointsMin: 0,
      pointsMax: quarterPoints,
    },
  ];
}

/**
 * Creates rubric criteria from input criteria list
 */
function createRubricCriteria(criteria: string[], totalPoints: number): RubricCriterion[] {
  const equalWeight = Math.floor(100 / criteria.length);
  const remainder = 100 - equalWeight * criteria.length;

  return criteria.map((criterionName, index) => {
    // Distribute remainder to first criteria to ensure total = 100%
    const weight = index < remainder ? equalWeight + 1 : equalWeight;

    return {
      name: criterionName.trim(),
      description: `Evaluation of ${criterionName.toLowerCase()}`,
      weight,
      levels: createPerformanceLevels(weight, totalPoints),
    };
  });
}

/**
 * Formats a performance level as a table row
 */
function formatLevelRow(level: PerformanceLevel): string {
  const pointRange =
    level.pointsMin === level.pointsMax
      ? `${level.pointsMax}`
      : `${level.pointsMin}-${level.pointsMax}`;
  return `| ${level.level} | ${level.description} | ${pointRange} |`;
}

/**
 * Formats a single criterion as a markdown section
 */
function formatCriterion(criterion: RubricCriterion, totalPoints: number): string {
  const maxPoints = Math.round((criterion.weight * totalPoints) / 100);
  const levelRows = criterion.levels.map(formatLevelRow).join('\n');

  return `### ${criterion.name} (${criterion.weight}% - Max ${maxPoints} points)

${criterion.description}

| Level | Description | Points |
|-------|-------------|--------|
${levelRows}`;
}

/**
 * Formats the complete rubric as markdown
 */
function formatRubric(rubric: Omit<GradingRubric, 'formatted'>): string {
  const criteriaFormatted = rubric.criteria
    .map((c) => formatCriterion(c, rubric.totalPoints))
    .join('\n\n');

  const totalWeights = rubric.criteria.reduce((sum, c) => sum + c.weight, 0);

  return `# Grading Rubric

## Assignment: ${rubric.assignment}

**Total Points:** ${rubric.totalPoints}

---

## Evaluation Criteria

${criteriaFormatted}

---

## Scoring Summary

${rubric.criteria
  .map((c) => {
    const maxPoints = Math.round((c.weight * rubric.totalPoints) / 100);
    return `- **${c.name}**: ${c.weight}% (${maxPoints} points)`;
  })
  .join('\n')}

**Total Weight:** ${totalWeights}%
`;
}

/**
 * Rubric Create Tool
 * Creates grading rubrics with criteria, levels, and point values
 */
export const rubricCreateTool = tool({
  description:
    'Create a grading rubric with performance criteria, levels, and point values. Generates structured rubrics with four performance levels (Exemplary, Proficient, Developing, Beginning) for educational assessments.',
  inputSchema: jsonSchema<RubricCreateInput>({
    type: 'object',
    properties: {
      assignment: {
        type: 'string',
        description: 'The assignment or task being evaluated',
      },
      criteria: {
        type: 'array',
        description: 'Array of criteria to evaluate (e.g., "Content Quality", "Organization")',
        items: {
          type: 'string',
        },
      },
      totalPoints: {
        type: 'number',
        description: 'Total possible points for the assignment',
      },
    },
    required: ['assignment', 'criteria', 'totalPoints'],
    additionalProperties: false,
  }),
  async execute({ assignment, criteria, totalPoints }): Promise<GradingRubric> {
    // Validate assignment
    if (!assignment || typeof assignment !== 'string' || assignment.trim().length === 0) {
      throw new Error('Assignment is required and must be a non-empty string');
    }

    // Validate criteria
    validateCriteria(criteria);

    // Validate total points
    validateTotalPoints(totalPoints);

    // Create rubric criteria
    const rubricCriteria = createRubricCriteria(criteria, totalPoints);

    // Validate totalPoints allocation (domain rule: scoring_clarity)
    const allocatedPoints = rubricCriteria.reduce((sum, criterion) => {
      const maxPoints = Math.round((criterion.weight * totalPoints) / 100);
      return sum + maxPoints;
    }, 0);

    // Allow small rounding differences (within 1% of total)
    const pointsDifference = Math.abs(allocatedPoints - totalPoints);
    const tolerance = Math.max(1, Math.floor(totalPoints * 0.01));

    if (pointsDifference > tolerance) {
      throw new Error(
        `Point allocation error: criteria allocate ${allocatedPoints} points but totalPoints is ${totalPoints}. Difference of ${pointsDifference} exceeds tolerance of ${tolerance}.`
      );
    }

    // Build rubric object
    const rubric: Omit<GradingRubric, 'formatted'> = {
      assignment: assignment.trim(),
      totalPoints,
      criteria: rubricCriteria,
    };

    // Format as markdown
    const formatted = formatRubric(rubric);

    return {
      ...rubric,
      formatted,
    };
  },
});

export default rubricCreateTool;
