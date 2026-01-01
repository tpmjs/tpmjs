/**
 * Difference-in-Differences Tool for TPMJS
 * Implements causal inference estimator for treatment effects
 */

import { jsonSchema, tool } from 'ai';

/**
 * Output interface for difference-in-differences analysis
 */
export interface DiDEstimate {
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
  parallelTrends: {
    assumption: string;
    pretreatmentTrend: number;
    warning?: string;
  };
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
  rows: Array<Record<string, number | string | boolean>>;
  unit: string;
  time: string;
  treated: string;
  y: string;
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
 * Domain rule: DiD Standard Error - SE(DiD) = √(σ²_T,after/n_TA + σ²_T,before/n_TB + σ²_C,after/n_CA + σ²_C,before/n_CB)
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
 * Parse panel data into groups
 */
function parsePanelData(
  rows: Array<Record<string, number | string | boolean>>,
  _unit: string,
  time: string,
  treated: string,
  y: string
): {
  treatmentBefore: number[];
  treatmentAfter: number[];
  controlBefore: number[];
  controlAfter: number[];
  timePeriods: number[];
} {
  const treatmentBefore: number[] = [];
  const treatmentAfter: number[] = [];
  const controlBefore: number[] = [];
  const controlAfter: number[] = [];
  const timePeriods: number[] = [];

  // Find unique time periods to determine before/after
  const times = new Set<number>();
  for (const row of rows) {
    const timeVal = row[time];
    if (typeof timeVal === 'number') {
      times.add(timeVal);
    }
  }
  const sortedTimes = Array.from(times).sort((a, b) => a - b);
  const midpoint = sortedTimes[Math.floor(sortedTimes.length / 2)] ?? 0;

  for (const row of rows) {
    const timeVal = row[time];
    const treatedVal = row[treated];
    const yVal = row[y];

    if (typeof yVal !== 'number') continue;
    if (typeof timeVal !== 'number') continue;

    const isTreated = Boolean(treatedVal);
    const isBefore = timeVal < midpoint;

    if (isTreated && isBefore) {
      treatmentBefore.push(yVal);
    } else if (isTreated && !isBefore) {
      treatmentAfter.push(yVal);
    } else if (!isTreated && isBefore) {
      controlBefore.push(yVal);
    } else if (!isTreated && !isBefore) {
      controlAfter.push(yVal);
    }

    timePeriods.push(timeVal);
  }

  return {
    treatmentBefore,
    treatmentAfter,
    controlBefore,
    controlAfter,
    timePeriods: Array.from(new Set(timePeriods)).sort((a, b) => a - b),
  };
}

/**
 * Check parallel trends assumption
 * Compares pre-treatment trends between treatment and control groups
 * Domain rule: Parallel Trends Assumption - DiD requires treatment and control groups have same counterfactual trend
 */
function checkParallelTrends(
  treatmentBefore: number[],
  controlBefore: number[]
): { assumption: string; pretreatmentTrend: number; warning?: string } {
  if (treatmentBefore.length < 2 || controlBefore.length < 2) {
    return {
      assumption: 'Cannot assess - insufficient pre-treatment periods',
      pretreatmentTrend: 0,
      warning: 'Need at least 2 pre-treatment observations per group',
    };
  }

  // Calculate pre-treatment trends (simple approach: difference in means over time)
  const treatmentTrend = treatmentBefore[treatmentBefore.length - 1]! - treatmentBefore[0]!;
  const controlTrend = controlBefore[controlBefore.length - 1]! - controlBefore[0]!;
  const trendDifference = Math.abs(treatmentTrend - controlTrend);

  const assumption =
    trendDifference < 0.1 * Math.abs(controlTrend)
      ? 'Parallel trends assumption appears satisfied'
      : 'Parallel trends assumption may be violated';

  const warning =
    trendDifference >= 0.1 * Math.abs(controlTrend)
      ? 'Pre-treatment trends differ between groups - DiD estimate may be biased'
      : undefined;

  return {
    assumption,
    pretreatmentTrend: trendDifference,
    warning,
  };
}

/**
 * Validate input data
 */
function validateInput(
  rows: Array<Record<string, number | string | boolean>>,
  unit: string,
  time: string,
  treated: string,
  y: string
): void {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('rows must be a non-empty array');
  }

  if (typeof unit !== 'string' || unit.length === 0) {
    throw new Error('unit must be a non-empty string');
  }

  if (typeof time !== 'string' || time.length === 0) {
    throw new Error('time must be a non-empty string');
  }

  if (typeof treated !== 'string' || treated.length === 0) {
    throw new Error('treated must be a non-empty string');
  }

  if (typeof y !== 'string' || y.length === 0) {
    throw new Error('y must be a non-empty string');
  }

  // Check that required fields exist in at least one row
  const hasFields = rows.some(
    (row) =>
      row[unit] !== undefined &&
      row[time] !== undefined &&
      row[treated] !== undefined &&
      row[y] !== undefined
  );

  if (!hasFields) {
    throw new Error('rows must contain the specified fields: unit, time, treated, y');
  }
}

/**
 * Difference-in-Differences Tool
 * Estimates causal treatment effect using the DiD methodology
 */
export const diffInDiffTool = tool({
  description:
    'Estimate the causal effect of a treatment using difference-in-differences (DiD) methodology. Takes panel data with unit identifiers, time periods, treatment indicators, and outcomes. Compares changes over time between treatment and control groups to isolate the treatment effect. Includes parallel trends assumption check.',
  inputSchema: jsonSchema<DiffInDiffInput>({
    type: 'object',
    properties: {
      rows: {
        type: 'array',
        items: { type: 'object' },
        description:
          'Panel data rows (each row is an observation with unit, time, treatment, and outcome)',
      },
      unit: {
        type: 'string',
        description: 'Name of the field containing unit identifiers (e.g., "state", "firm_id")',
      },
      time: {
        type: 'string',
        description: 'Name of the field containing time period (e.g., "year", "quarter")',
      },
      treated: {
        type: 'string',
        description:
          'Name of the field indicating treatment status (e.g., "treated", "intervention")',
      },
      y: {
        type: 'string',
        description:
          'Name of the field containing the outcome variable (e.g., "revenue", "employment")',
      },
      confidenceLevel: {
        type: 'number',
        description: 'Confidence level for interval (default: 0.95)',
      },
    },
    required: ['rows', 'unit', 'time', 'treated', 'y'],
    additionalProperties: false,
  }),
  async execute({ rows, unit, time, treated, y, confidenceLevel = 0.95 }): Promise<DiDEstimate> {
    // Validate inputs
    validateInput(rows, unit, time, treated, y);

    if (confidenceLevel <= 0 || confidenceLevel >= 1) {
      throw new Error('confidenceLevel must be between 0 and 1 (exclusive)');
    }

    // Parse panel data into groups
    const { treatmentBefore, treatmentAfter, controlBefore, controlAfter } = parsePanelData(
      rows,
      unit,
      time,
      treated,
      y
    );

    // Validate that we have data in all groups
    if (treatmentBefore.length === 0) {
      throw new Error('No observations found for treatment group before period');
    }
    if (treatmentAfter.length === 0) {
      throw new Error('No observations found for treatment group after period');
    }
    if (controlBefore.length === 0) {
      throw new Error('No observations found for control group before period');
    }
    if (controlAfter.length === 0) {
      throw new Error('No observations found for control group after period');
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
    // Domain rule: Difference-in-Differences Estimator - DiD = (Y_T,after - Y_T,before) - (Y_C,after - Y_C,before) isolates treatment effect
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

    // Check parallel trends assumption
    const parallelTrends = checkParallelTrends(treatmentBefore, controlBefore);

    return {
      effect,
      standardError,
      tStatistic,
      pValue,
      significant,
      confidenceInterval,
      parallelTrends,
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
