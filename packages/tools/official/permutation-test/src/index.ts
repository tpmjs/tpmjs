/**
 * Permutation Test Tool for TPMJS
 * Performs a permutation test to assess the significance of the difference in means
 * between two groups using random permutations of the data.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Output interface for the permutation test
 */
export interface PermutationTestResult {
  pValue: number;
  observedDiff: number;
  significant: boolean;
  iterations: number;
  metadata: {
    group1Size: number;
    group2Size: number;
    group1Mean: number;
    group2Mean: number;
    alpha: number;
  };
}

type PermutationTestInput = {
  group1: number[];
  group2: number[];
  iterations?: number;
};

/**
 * Calculate the mean of an array of numbers
 */
function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffle(array: number[]): number[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    if (temp !== undefined) {
      const swap = shuffled[j];
      if (swap !== undefined) {
        shuffled[i] = swap;
        shuffled[j] = temp;
      }
    }
  }
  return shuffled;
}

/**
 * Perform permutation test for difference in means
 */
function performPermutationTest(
  group1: number[],
  group2: number[],
  iterations: number
): PermutationTestResult {
  // Calculate observed difference in means
  const mean1 = calculateMean(group1);
  const mean2 = calculateMean(group2);
  const observedDiff = Math.abs(mean1 - mean2);

  // Combine all data
  const combined = [...group1, ...group2];
  const n1 = group1.length;
  const n2 = group2.length;

  // Perform permutations
  let extremeCount = 0;

  for (let i = 0; i < iterations; i++) {
    // Shuffle combined data
    const shuffled = shuffle(combined);

    // Split into two groups
    const permGroup1 = shuffled.slice(0, n1);
    const permGroup2 = shuffled.slice(n1);

    // Calculate difference in means for this permutation
    const permMean1 = calculateMean(permGroup1);
    const permMean2 = calculateMean(permGroup2);
    const permDiff = Math.abs(permMean1 - permMean2);

    // Count if permutation difference is as extreme or more extreme
    if (permDiff >= observedDiff) {
      extremeCount++;
    }
  }

  // Calculate p-value
  const pValue = extremeCount / iterations;

  // Determine significance (alpha = 0.05)
  const alpha = 0.05;
  const significant = pValue < alpha;

  return {
    pValue,
    observedDiff,
    significant,
    iterations,
    metadata: {
      group1Size: n1,
      group2Size: n2,
      group1Mean: mean1,
      group2Mean: mean2,
      alpha,
    },
  };
}

/**
 * Permutation Test Tool
 * Tests the significance of the difference in means between two groups
 */
export const permutationTestTool = tool({
  description:
    'Perform a permutation test to assess the statistical significance of the difference in means between two groups. Returns p-value, observed difference, and significance status. Useful for non-parametric hypothesis testing without assuming normal distribution.',
  inputSchema: jsonSchema<PermutationTestInput>({
    type: 'object',
    properties: {
      group1: {
        type: 'array',
        items: { type: 'number' },
        description: 'First group of numeric values',
        minItems: 1,
      },
      group2: {
        type: 'array',
        items: { type: 'number' },
        description: 'Second group of numeric values',
        minItems: 1,
      },
      iterations: {
        type: 'number',
        description: 'Number of permutations to perform (default: 10000)',
        minimum: 100,
        maximum: 100000,
      },
    },
    required: ['group1', 'group2'],
    additionalProperties: false,
  }),
  async execute({ group1, group2, iterations = 10000 }): Promise<PermutationTestResult> {
    // Validate inputs
    if (!Array.isArray(group1) || group1.length === 0) {
      throw new Error('group1 must be a non-empty array of numbers');
    }
    if (!Array.isArray(group2) || group2.length === 0) {
      throw new Error('group2 must be a non-empty array of numbers');
    }

    // Validate all elements are numbers
    if (!group1.every((val) => typeof val === 'number' && !Number.isNaN(val))) {
      throw new Error('group1 must contain only valid numbers');
    }
    if (!group2.every((val) => typeof val === 'number' && !Number.isNaN(val))) {
      throw new Error('group2 must contain only valid numbers');
    }

    // Validate iterations
    if (typeof iterations !== 'number' || iterations < 100 || iterations > 100000) {
      throw new Error('iterations must be between 100 and 100000');
    }

    // Perform the test
    return performPermutationTest(group1, group2, iterations);
  },
});

export default permutationTestTool;
