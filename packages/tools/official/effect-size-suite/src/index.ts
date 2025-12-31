/**
 * Effect Size Suite Tool for TPMJS
 * Calculates multiple effect size measures for comparing two groups:
 * - Cohen's d (pooled standard deviation)
 * - Hedge's g (bias-corrected for small samples)
 * - Glass's delta (control group standard deviation)
 */

import { jsonSchema, tool } from 'ai';

/**
 * Output interface for effect size results
 */
export interface EffectSizeResult {
  cohensD: number;
  hedgesG: number;
  glassDelta: number;
  interpretation: {
    cohensD: string;
    hedgesG: string;
    glassDelta: string;
  };
  groupStats: {
    group1: { mean: number; sd: number; n: number };
    group2: { mean: number; sd: number; n: number };
    meanDifference: number;
  };
}

type EffectSizeInput = {
  group1: number[];
  group2: number[];
};

/**
 * Calculates the mean of an array
 */
function calculateMean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

/**
 * Calculates the sample standard deviation
 */
function calculateStandardDeviation(arr: number[], mean?: number): number {
  if (arr.length <= 1) return 0;

  const m = mean ?? calculateMean(arr);
  const squaredDiffs = arr.map((val) => (val - m) ** 2);
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / (arr.length - 1);

  return Math.sqrt(variance);
}

/**
 * Calculates pooled standard deviation for two groups
 */
function calculatePooledSD(sd1: number, n1: number, sd2: number, n2: number): number {
  const numerator = (n1 - 1) * sd1 ** 2 + (n2 - 1) * sd2 ** 2;
  const denominator = n1 + n2 - 2;

  return Math.sqrt(numerator / denominator);
}

/**
 * Calculates Cohen's d using pooled standard deviation
 */
function calculateCohensD(
  mean1: number,
  mean2: number,
  sd1: number,
  n1: number,
  sd2: number,
  n2: number
): number {
  const pooledSD = calculatePooledSD(sd1, n1, sd2, n2);

  if (pooledSD === 0) {
    throw new Error('Pooled standard deviation is zero. Cannot calculate effect size.');
  }

  return (mean1 - mean2) / pooledSD;
}

/**
 * Calculates Hedge's g (bias-corrected Cohen's d for small samples)
 */
function calculateHedgesG(cohensD: number, n1: number, n2: number): number {
  const totalN = n1 + n2;
  const correctionFactor = 1 - 3 / (4 * totalN - 9);

  return cohensD * correctionFactor;
}

/**
 * Calculates Glass's delta using control group (group2) standard deviation
 */
function calculateGlassDelta(mean1: number, mean2: number, sd2: number): number {
  if (sd2 === 0) {
    throw new Error('Control group standard deviation is zero. Cannot calculate Glass delta.');
  }

  return (mean1 - mean2) / sd2;
}

/**
 * Interprets effect size magnitude based on Cohen's conventions
 */
function interpretEffectSize(effectSize: number): string {
  const absEffect = Math.abs(effectSize);

  if (absEffect < 0.2) {
    return 'negligible';
  }
  if (absEffect < 0.5) {
    return 'small';
  }
  if (absEffect < 0.8) {
    return 'medium';
  }
  return 'large';
}

/**
 * Effect Size Suite Tool
 * Calculates Cohen's d, Hedge's g, and Glass's delta for two groups
 */
export const effectSizeSuiteTool = tool({
  description:
    "Calculate multiple effect size measures for comparing two groups. Returns Cohen's d (using pooled standard deviation), Hedge's g (bias-corrected for small samples), and Glass's delta (using control group standard deviation). Effect sizes quantify the magnitude of difference between groups in standardized units, making comparisons across different scales meaningful.",
  inputSchema: jsonSchema<EffectSizeInput>({
    type: 'object',
    properties: {
      group1: {
        type: 'array',
        items: { type: 'number' },
        description: 'First group of numeric values (treatment or experimental group)',
        minItems: 2,
      },
      group2: {
        type: 'array',
        items: { type: 'number' },
        description:
          'Second group of numeric values (control or comparison group, used as denominator in Glass delta)',
        minItems: 2,
      },
    },
    required: ['group1', 'group2'],
    additionalProperties: false,
  }),
  async execute({ group1, group2 }): Promise<EffectSizeResult> {
    // Validate inputs
    if (!Array.isArray(group1) || group1.length < 2) {
      throw new Error('Group 1 must be an array with at least 2 numeric values');
    }

    if (!Array.isArray(group2) || group2.length < 2) {
      throw new Error('Group 2 must be an array with at least 2 numeric values');
    }

    // Validate all values are numbers
    for (const value of group1) {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(`Invalid group1 data: all values must be finite numbers. Found: ${value}`);
      }
    }

    for (const value of group2) {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(`Invalid group2 data: all values must be finite numbers. Found: ${value}`);
      }
    }

    // Calculate descriptive statistics for each group
    const mean1 = calculateMean(group1);
    const mean2 = calculateMean(group2);
    const sd1 = calculateStandardDeviation(group1, mean1);
    const sd2 = calculateStandardDeviation(group2, mean2);
    const n1 = group1.length;
    const n2 = group2.length;

    const meanDifference = mean1 - mean2;

    // Calculate effect sizes
    const cohensD = calculateCohensD(mean1, mean2, sd1, n1, sd2, n2);
    const hedgesG = calculateHedgesG(cohensD, n1, n2);
    const glassDelta = calculateGlassDelta(mean1, mean2, sd2);

    // Interpret effect sizes
    const interpretation = {
      cohensD: interpretEffectSize(cohensD),
      hedgesG: interpretEffectSize(hedgesG),
      glassDelta: interpretEffectSize(glassDelta),
    };

    return {
      cohensD: Math.round(cohensD * 1000) / 1000,
      hedgesG: Math.round(hedgesG * 1000) / 1000,
      glassDelta: Math.round(glassDelta * 1000) / 1000,
      interpretation,
      groupStats: {
        group1: {
          mean: Math.round(mean1 * 1000) / 1000,
          sd: Math.round(sd1 * 1000) / 1000,
          n: n1,
        },
        group2: {
          mean: Math.round(mean2 * 1000) / 1000,
          sd: Math.round(sd2 * 1000) / 1000,
          n: n2,
        },
        meanDifference: Math.round(meanDifference * 1000) / 1000,
      },
    };
  },
});

export default effectSizeSuiteTool;
