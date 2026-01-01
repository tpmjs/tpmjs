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
export interface EffectSize {
  type: string;
  value: number;
  interpretation: string;
  confidenceInterval?: {
    lower: number;
    upper: number;
    level: number;
  };
  groupStats?: {
    groupA: { mean: number; sd: number; n: number };
    groupB: { mean: number; sd: number; n: number };
    meanDifference: number;
  };
}

type EffectSizeInput = {
  type: 'cohensD' | 'oddsRatio' | 'r' | 'etaSquared';
  dataA: number[];
  dataB: number[];
  confidenceLevel?: number;
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
 * Domain rule: Pooled Standard Deviation - SD_pooled = √(((n₁-1)s₁² + (n₂-1)s₂²)/(n₁+n₂-2)) assumes equal variances
 */
function calculatePooledSD(sd1: number, n1: number, sd2: number, n2: number): number {
  const numerator = (n1 - 1) * sd1 ** 2 + (n2 - 1) * sd2 ** 2;
  const denominator = n1 + n2 - 2;

  return Math.sqrt(numerator / denominator);
}

/**
 * Calculates Cohen's d using pooled standard deviation
 * Domain rule: Cohen's d - Standardized mean difference d = (μ₁ - μ₂)/SD_pooled measures effect size in SD units
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
 * Calculates correlation coefficient r from two groups
 */
function calculateCorrelationR(data1: number[], data2: number[]): number {
  if (data1.length !== data2.length) {
    throw new Error('Both groups must have the same length for correlation calculation');
  }

  const n = data1.length;
  const mean1 = calculateMean(data1);
  const mean2 = calculateMean(data2);

  let numerator = 0;
  let sumSq1 = 0;
  let sumSq2 = 0;

  for (let i = 0; i < n; i++) {
    const diff1 = (data1[i] ?? 0) - mean1;
    const diff2 = (data2[i] ?? 0) - mean2;
    numerator += diff1 * diff2;
    sumSq1 += diff1 * diff1;
    sumSq2 += diff2 * diff2;
  }

  const denominator = Math.sqrt(sumSq1 * sumSq2);
  if (denominator === 0) return 0;

  return numerator / denominator;
}

/**
 * Calculates eta squared (η²) for two groups
 * Domain rule: Eta Squared - η² = SS_between/SS_total measures proportion of total variance explained by group membership
 */
function calculateEtaSquared(data1: number[], data2: number[]): number {
  const mean1 = calculateMean(data1);
  const mean2 = calculateMean(data2);
  const grandMean = calculateMean([...data1, ...data2]);

  const ssBetween =
    data1.length * (mean1 - grandMean) ** 2 + data2.length * (mean2 - grandMean) ** 2;

  const ssWithin1 = data1.reduce((sum, val) => sum + (val - mean1) ** 2, 0);
  const ssWithin2 = data2.reduce((sum, val) => sum + (val - mean2) ** 2, 0);
  const ssWithin = ssWithin1 + ssWithin2;

  const ssTotal = ssBetween + ssWithin;
  if (ssTotal === 0) return 0;

  return ssBetween / ssTotal;
}

/**
 * Calculates odds ratio for two groups (assumes binary outcomes 0/1)
 */
function calculateOddsRatio(data1: number[], data2: number[]): number {
  const successes1 = data1.filter((x) => x === 1).length;
  const failures1 = data1.length - successes1;
  const successes2 = data2.filter((x) => x === 1).length;
  const failures2 = data2.length - successes2;

  // Add 0.5 continuity correction if any cell is 0
  const correction =
    successes1 === 0 || failures1 === 0 || successes2 === 0 || failures2 === 0 ? 0.5 : 0;

  const odds1 = (successes1 + correction) / (failures1 + correction);
  const odds2 = (successes2 + correction) / (failures2 + correction);

  if (odds2 === 0) return Number.POSITIVE_INFINITY;
  return odds1 / odds2;
}

/**
 * Interprets effect size magnitude based on the type
 */
function interpretEffectSize(effectSize: number, type: string): string {
  const absEffect = Math.abs(effectSize);

  switch (type) {
    case 'cohensD':
      if (absEffect < 0.2) return 'negligible';
      if (absEffect < 0.5) return 'small';
      if (absEffect < 0.8) return 'medium';
      return 'large';
    case 'r':
      if (absEffect < 0.1) return 'negligible';
      if (absEffect < 0.3) return 'small';
      if (absEffect < 0.5) return 'medium';
      return 'large';
    case 'etaSquared':
      if (absEffect < 0.01) return 'negligible';
      if (absEffect < 0.06) return 'small';
      if (absEffect < 0.14) return 'medium';
      return 'large';
    case 'oddsRatio':
      if (effectSize < 1.5) return 'negligible';
      if (effectSize < 3) return 'small';
      if (effectSize < 9) return 'medium';
      return 'large';
    default:
      return 'unknown';
  }
}

/**
 * Calculates confidence interval for Cohen's d using bootstrap approximation
 * Domain rule: Cohen's d CI - SE(d) ≈ √((n₁+n₂)/(n₁n₂) + d²/(2(n₁+n₂))) with normal approximation for CI
 */
function calculateCohensDCI(
  cohensD: number,
  n1: number,
  n2: number,
  confidenceLevel: number
): { lower: number; upper: number } {
  // Approximate SE for Cohen's d
  const se = Math.sqrt((n1 + n2) / (n1 * n2) + cohensD ** 2 / (2 * (n1 + n2)));
  const z = confidenceLevel === 0.95 ? 1.96 : 2.576; // 95% or 99%

  return {
    lower: cohensD - z * se,
    upper: cohensD + z * se,
  };
}

/**
 * Effect Size Suite Tool
 * Calculates various effect size measures for comparing two groups
 */
export const effectSizeSuiteTool = tool({
  description:
    "Calculate effect sizes for comparing two groups: Cohen's d, odds ratio, correlation r, or eta squared (η²). Effect sizes quantify the magnitude of difference between groups in standardized units, making comparisons across different scales meaningful. Includes confidence intervals and interpretations.",
  inputSchema: jsonSchema<EffectSizeInput>({
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['cohensD', 'oddsRatio', 'r', 'etaSquared'],
        description:
          'Effect size type: cohensD (standardized mean difference), oddsRatio (binary outcomes), r (correlation), etaSquared (variance explained)',
      },
      dataA: {
        type: 'array',
        items: { type: 'number' },
        description: 'First group of numeric values',
        minItems: 2,
      },
      dataB: {
        type: 'array',
        items: { type: 'number' },
        description: 'Second group of numeric values',
        minItems: 2,
      },
      confidenceLevel: {
        type: 'number',
        description: 'Confidence level for CI (default: 0.95)',
        minimum: 0.8,
        maximum: 0.99,
      },
    },
    required: ['type', 'dataA', 'dataB'],
    additionalProperties: false,
  }),
  async execute({ type, dataA, dataB, confidenceLevel = 0.95 }): Promise<EffectSize> {
    // Validate inputs
    if (!Array.isArray(dataA) || dataA.length < 2) {
      throw new Error('DataA must be an array with at least 2 numeric values');
    }

    if (!Array.isArray(dataB) || dataB.length < 2) {
      throw new Error('DataB must be an array with at least 2 numeric values');
    }

    // Validate all values are numbers
    for (const value of dataA) {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(`Invalid dataA: all values must be finite numbers. Found: ${value}`);
      }
    }

    for (const value of dataB) {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(`Invalid dataB: all values must be finite numbers. Found: ${value}`);
      }
    }

    // Calculate effect size based on type
    let value: number;
    let ci: { lower: number; upper: number } | undefined;

    switch (type) {
      case 'cohensD': {
        const meanA = calculateMean(dataA);
        const meanB = calculateMean(dataB);
        const sdA = calculateStandardDeviation(dataA, meanA);
        const sdB = calculateStandardDeviation(dataB, meanB);
        value = calculateCohensD(meanA, meanB, sdA, dataA.length, sdB, dataB.length);
        ci = calculateCohensDCI(value, dataA.length, dataB.length, confidenceLevel);
        break;
      }
      case 'oddsRatio':
        value = calculateOddsRatio(dataA, dataB);
        break;
      case 'r':
        value = calculateCorrelationR(dataA, dataB);
        break;
      case 'etaSquared':
        value = calculateEtaSquared(dataA, dataB);
        break;
      default:
        throw new Error(`Unknown effect size type: ${type}`);
    }

    // Calculate descriptive statistics
    const meanA = calculateMean(dataA);
    const meanB = calculateMean(dataB);
    const sdA = calculateStandardDeviation(dataA, meanA);
    const sdB = calculateStandardDeviation(dataB, meanB);

    const result: EffectSize = {
      type,
      value: Math.round(value * 1000) / 1000,
      interpretation: interpretEffectSize(value, type),
      groupStats: {
        groupA: {
          mean: Math.round(meanA * 1000) / 1000,
          sd: Math.round(sdA * 1000) / 1000,
          n: dataA.length,
        },
        groupB: {
          mean: Math.round(meanB * 1000) / 1000,
          sd: Math.round(sdB * 1000) / 1000,
          n: dataB.length,
        },
        meanDifference: Math.round((meanA - meanB) * 1000) / 1000,
      },
    };

    if (ci) {
      result.confidenceInterval = {
        lower: Math.round(ci.lower * 1000) / 1000,
        upper: Math.round(ci.upper * 1000) / 1000,
        level: confidenceLevel,
      };
    }

    return result;
  },
});

export default effectSizeSuiteTool;
