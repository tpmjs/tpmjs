/**
 * Difference-in-Differences Tool for TPMJS
 * Implements causal inference estimator for treatment effects
 */

import { jsonSchema, tool } from 'ai';

/**
 * Output interface for difference-in-differences analysis
 */
export interface DiffInDiffResult {
  effect: number;
  standardError: number;
  tStatistic: number;
  pValue: number;
  significant: boolean;
  confidenceInterval: {
    lower: number;
    upper: number;
    level: number;
  };
  interpretation: string;
  groupMeans: {
    treatmentBefore: number;
    treatmentAfter: number;
    controlBefore: number;
    controlAfter: number;
  };
  differences: {
    treatmentDiff: number;
    controlDiff: number;
  };
}

type DiffInDiffInput = {
  treatmentBefore: number[];
  treatmentAfter: number[];
  controlBefore: number[];
  controlAfter: number[];
  confidenceLevel?: number;
};

/**
 * Calculate mean of an array
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate variance of an array
 */
function variance(values: number[]): number {
  if (values.length <= 1) return 0;
  const mu = mean(values);
  const squaredDiffs = values.map((val) => (val - mu) ** 2);
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / (values.length - 1);
}

/**
 * Calculate standard error for difference-in-differences estimator
 * Uses pooled variance approach
 */
function calculateStandardError(
  treatmentBefore: number[],
  treatmentAfter: number[],
  controlBefore: number[],
  controlAfter: number[]
): number {
  const varTB = variance(treatmentBefore);
  const varTA = variance(treatmentAfter);
  const varCB = variance(controlBefore);
  const varCA = variance(controlAfter);

  const nTB = treatmentBefore.length;
  const nTA = treatmentAfter.length;
  const nCB = controlBefore.length;
  const nCA = controlAfter.length;

  // Standard error of DiD estimator:
  // SE = sqrt(Var(T_after)/n_TA + Var(T_before)/n_TB + Var(C_after)/n_CA + Var(C_before)/n_CB)
  const se = Math.sqrt(varTA / nTA + varTB / nTB + varCA / nCA + varCB / nCB);

  return se;
}

/**
 * Calculate two-tailed t-test p-value
 * Uses normal approximation for degrees of freedom > 30
 */
function calculatePValue(tStat: number, df: number): number {
  const absTStat = Math.abs(tStat);

  // For large df (>30), use normal approximation
  if (df > 30) {
    return 2 * (1 - normalCDF(absTStat));
  }

  // For small df, use t-distribution approximation
  return 2 * (1 - tCDF(absTStat, df));
}

/**
 * Normal cumulative distribution function
 * Uses error function approximation
 */
function normalCDF(z: number): number {
  // Using error function approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const prob =
    d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

  return z > 0 ? 1 - prob : prob;
}

/**
 * Student's t cumulative distribution function
 * Approximation for t-distribution
 */
function tCDF(t: number, df: number): number {
  // For large df, approximate with normal
  if (df > 30) {
    return normalCDF(t);
  }

  // Use normal approximation with correction
  const x = t / Math.sqrt(df);
  const approx = normalCDF(x * Math.sqrt(df / (df + t * t)));

  return approx;
}

/**
 * Calculate t-distribution quantile (inverse CDF)
 * For confidence intervals
 */
function tQuantile(p: number, df: number): number {
  // For large df, use normal quantile
  if (df > 30) {
    return normalQuantile(p);
  }

  // Approximate t-quantile using iterative method
  // For 95% CI with df=20, t ≈ 2.086
  // For 95% CI with df=10, t ≈ 2.228

  // Rough approximation based on df
  const zScore = normalQuantile(p);
  const correction = zScore * zScore + 1;
  return zScore * Math.sqrt(df / (df - 2)) * Math.sqrt(correction / (correction + df));
}

/**
 * Normal distribution quantile (inverse CDF)
 * Approximation using rational function
 */
function normalQuantile(p: number): number {
  if (p <= 0 || p >= 1) {
    throw new Error('p must be between 0 and 1');
  }

  // For p > 0.5, use symmetry
  const sign = p < 0.5 ? -1 : 1;
  const q = p < 0.5 ? p : 1 - p;

  // Rational approximation
  const t = Math.sqrt(-2 * Math.log(q));
  const c0 = 2.515517;
  const c1 = 0.802853;
  const c2 = 0.010328;
  const d1 = 1.432788;
  const d2 = 0.189269;
  const d3 = 0.001308;

  const numerator = c0 + c1 * t + c2 * t * t;
  const denominator = 1 + d1 * t + d2 * t * t + d3 * t * t * t;

  return sign * (t - numerator / denominator);
}

/**
 * Generate interpretation string based on results
 */
function generateInterpretation(effect: number, significant: boolean, pValue: number): string {
  const direction = effect > 0 ? 'increased' : 'decreased';
  const magnitude = Math.abs(effect);
  const sigStatus = significant ? 'statistically significant' : 'not statistically significant';

  return `The treatment effect is ${magnitude.toFixed(3)} (${direction} by ${magnitude.toFixed(3)} units). This effect is ${sigStatus} (p = ${pValue.toFixed(4)}). ${
    significant
      ? 'We can conclude the treatment had a causal effect.'
      : 'We cannot conclude the treatment had a causal effect at the 0.05 significance level.'
  }`;
}

/**
 * Validate input data
 */
function validateInput(
  treatmentBefore: number[],
  treatmentAfter: number[],
  controlBefore: number[],
  controlAfter: number[]
): void {
  if (!Array.isArray(treatmentBefore) || treatmentBefore.length === 0) {
    throw new Error('treatmentBefore must be a non-empty array');
  }

  if (!Array.isArray(treatmentAfter) || treatmentAfter.length === 0) {
    throw new Error('treatmentAfter must be a non-empty array');
  }

  if (!Array.isArray(controlBefore) || controlBefore.length === 0) {
    throw new Error('controlBefore must be a non-empty array');
  }

  if (!Array.isArray(controlAfter) || controlAfter.length === 0) {
    throw new Error('controlAfter must be a non-empty array');
  }

  const allValues = [...treatmentBefore, ...treatmentAfter, ...controlBefore, ...controlAfter];

  if (!allValues.every((val) => typeof val === 'number' && Number.isFinite(val))) {
    throw new Error('All values must be finite numbers');
  }
}

/**
 * Difference-in-Differences Tool
 * Estimates causal treatment effect using the DiD methodology
 */
export const diffInDiffTool = tool({
  description:
    'Estimate the causal effect of a treatment using difference-in-differences (DiD) methodology. Compares changes over time between treatment and control groups to isolate the treatment effect. Returns effect size, statistical significance, and interpretation.',
  inputSchema: jsonSchema<DiffInDiffInput>({
    type: 'object',
    properties: {
      treatmentBefore: {
        type: 'array',
        items: { type: 'number' },
        description: 'Outcome values for treatment group before intervention',
      },
      treatmentAfter: {
        type: 'array',
        items: { type: 'number' },
        description: 'Outcome values for treatment group after intervention',
      },
      controlBefore: {
        type: 'array',
        items: { type: 'number' },
        description: 'Outcome values for control group before intervention',
      },
      controlAfter: {
        type: 'array',
        items: { type: 'number' },
        description: 'Outcome values for control group after intervention',
      },
      confidenceLevel: {
        type: 'number',
        description: 'Confidence level for interval (default: 0.95)',
      },
    },
    required: ['treatmentBefore', 'treatmentAfter', 'controlBefore', 'controlAfter'],
    additionalProperties: false,
  }),
  async execute({
    treatmentBefore,
    treatmentAfter,
    controlBefore,
    controlAfter,
    confidenceLevel = 0.95,
  }): Promise<DiffInDiffResult> {
    // Validate inputs
    validateInput(treatmentBefore, treatmentAfter, controlBefore, controlAfter);

    if (confidenceLevel <= 0 || confidenceLevel >= 1) {
      throw new Error('confidenceLevel must be between 0 and 1 (exclusive)');
    }

    // Calculate group means
    const meanTB = mean(treatmentBefore);
    const meanTA = mean(treatmentAfter);
    const meanCB = mean(controlBefore);
    const meanCA = mean(controlAfter);

    // Calculate differences within each group
    const treatmentDiff = meanTA - meanTB;
    const controlDiff = meanCA - meanCB;

    // Calculate DiD estimator
    // DiD = (T_after - T_before) - (C_after - C_before)
    const effect = treatmentDiff - controlDiff;

    // Calculate standard error
    const standardError = calculateStandardError(
      treatmentBefore,
      treatmentAfter,
      controlBefore,
      controlAfter
    );

    // Calculate t-statistic
    const tStatistic = standardError > 0 ? effect / standardError : 0;

    // Calculate degrees of freedom (conservative estimate)
    const df =
      treatmentBefore.length +
      treatmentAfter.length +
      controlBefore.length +
      controlAfter.length -
      4;

    // Calculate p-value
    const pValue = calculatePValue(tStatistic, df);

    // Determine significance (typically α = 0.05)
    const significant = pValue < 1 - confidenceLevel;

    // Calculate confidence interval
    const tCritical = tQuantile(1 - (1 - confidenceLevel) / 2, df);
    const marginOfError = tCritical * standardError;

    const confidenceInterval = {
      lower: effect - marginOfError,
      upper: effect + marginOfError,
      level: confidenceLevel,
    };

    // Generate interpretation
    const interpretation = generateInterpretation(effect, significant, pValue);

    return {
      effect,
      standardError,
      tStatistic,
      pValue,
      significant,
      confidenceInterval,
      interpretation,
      groupMeans: {
        treatmentBefore: meanTB,
        treatmentAfter: meanTA,
        controlBefore: meanCB,
        controlAfter: meanCA,
      },
      differences: {
        treatmentDiff,
        controlDiff,
      },
    };
  },
});

export default diffInDiffTool;
