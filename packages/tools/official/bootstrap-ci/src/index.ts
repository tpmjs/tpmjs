/**
 * Bootstrap Confidence Interval Tool for TPMJS
 * Calculates bootstrap confidence intervals using resampling methodology.
 * Implements the percentile method for CI estimation.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Output interface for bootstrap confidence interval results
 */
export interface ConfidenceInterval {
  estimate: number;
  lower: number;
  upper: number;
  confidenceLevel: number;
  iterations: number;
  sampleSize: number;
}

type BootstrapCIInput = {
  samples: number[];
  statistic?: 'mean' | 'median' | 'custom';
  confidence?: number;
  iterations?: number;
  seed?: number;
};

/**
 * Calculates the mean of an array of numbers
 */
function calculateMean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

/**
 * Calculates the median of an array of numbers
 */
function calculateMedian(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
  }
  return sorted[mid] ?? 0;
}

/**
 * Seeded random number generator using a simple LCG algorithm
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

/**
 * Generates a bootstrap sample by randomly sampling with replacement
 * Domain rule: Bootstrap Resampling - Creates new dataset of size n by sampling with replacement from original data
 */
function generateBootstrapSample(data: number[], rng?: SeededRandom): number[] {
  const sample: number[] = [];
  const n = data.length;

  for (let i = 0; i < n; i++) {
    const randomValue = rng ? rng.next() : Math.random();
    const randomIndex = Math.floor(randomValue * n);
    const value = data[randomIndex];
    if (value !== undefined) {
      sample.push(value);
    }
  }

  return sample;
}

/**
 * Calculates percentile value from sorted array
 * Domain rule: Linear Interpolation Percentile - Uses weighted average between adjacent values for non-integer percentile indices
 */
function calculatePercentile(sortedArray: number[], percentile: number): number {
  if (sortedArray.length === 0) return 0;

  const index = (percentile / 100) * (sortedArray.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) {
    return sortedArray[lower] ?? 0;
  }

  const lowerVal = sortedArray[lower] ?? 0;
  const upperVal = sortedArray[upper] ?? 0;
  return lowerVal * (1 - weight) + upperVal * weight;
}

/**
 * Bootstrap Confidence Interval Tool
 * Uses the percentile method to calculate confidence intervals via bootstrap resampling
 */
export const bootstrapCITool = tool({
  description:
    'Calculate bootstrap confidence interval for a sample statistic (mean, median, or custom) using the resampling method. The bootstrap is a powerful non-parametric method that does not assume a normal distribution. It works by repeatedly resampling the data with replacement and calculating the statistic of interest for each resample.',
  inputSchema: jsonSchema<BootstrapCIInput>({
    type: 'object',
    properties: {
      samples: {
        type: 'array',
        items: { type: 'number' },
        description: 'Array of numeric values to analyze (sample data)',
        minItems: 2,
      },
      statistic: {
        type: 'string',
        enum: ['mean', 'median', 'custom'],
        description: 'Statistic to compute: mean, median, or custom. Default: mean',
      },
      confidence: {
        type: 'number',
        description: 'Confidence level as a decimal (e.g., 0.95 for 95% CI). Default: 0.95',
        minimum: 0.5,
        maximum: 0.999,
      },
      iterations: {
        type: 'number',
        description: 'Number of bootstrap iterations to perform (minimum 1000). Default: 1000',
        minimum: 1000,
        maximum: 100000,
      },
      seed: {
        type: 'number',
        description: 'Random seed for reproducibility. If provided, results will be deterministic.',
      },
    },
    required: ['samples'],
    additionalProperties: false,
  }),
  async execute({
    samples,
    statistic = 'mean',
    confidence = 0.95,
    iterations = 1000,
    seed,
  }): Promise<ConfidenceInterval> {
    // Validate inputs
    if (!Array.isArray(samples) || samples.length < 2) {
      throw new Error('Samples must be an array with at least 2 numeric values');
    }

    // Check for valid numbers
    for (const value of samples) {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(`Invalid data: all values must be finite numbers. Found: ${value}`);
      }
    }

    if (confidence <= 0.5 || confidence >= 1) {
      throw new Error(`Confidence level must be between 0.5 and 0.999. Got: ${confidence}`);
    }

    if (iterations < 1000 || iterations > 100000) {
      throw new Error(`Iterations must be at least 1000. Got: ${iterations}`);
    }

    // Select statistic function
    let statisticFn: (arr: number[]) => number;
    switch (statistic) {
      case 'mean':
        statisticFn = calculateMean;
        break;
      case 'median':
        statisticFn = calculateMedian;
        break;
      case 'custom':
        // For custom, default to mean
        statisticFn = calculateMean;
        break;
      default:
        statisticFn = calculateMean;
    }

    // Calculate original sample statistic
    const originalEstimate = statisticFn(samples);

    // Create seeded RNG if seed is provided
    const rng = seed !== undefined ? new SeededRandom(seed) : undefined;

    // Perform bootstrap resampling
    // Domain rule: Bootstrap Distribution - Generates empirical sampling distribution through repeated resampling
    const bootstrapStatistics: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const bootstrapSample = generateBootstrapSample(samples, rng);
      const bootstrapStat = statisticFn(bootstrapSample);
      bootstrapStatistics.push(bootstrapStat);
    }

    // Sort bootstrap statistics for percentile calculation
    bootstrapStatistics.sort((a, b) => a - b);

    // Calculate confidence interval using percentile method
    // Domain rule: Percentile CI Method - CI bounds are the α/2 and 1-α/2 quantiles of bootstrap distribution
    const alpha = 1 - confidence;
    const lowerPercentile = (alpha / 2) * 100;
    const upperPercentile = (1 - alpha / 2) * 100;

    const lower = calculatePercentile(bootstrapStatistics, lowerPercentile);
    const upper = calculatePercentile(bootstrapStatistics, upperPercentile);

    return {
      estimate: originalEstimate,
      lower,
      upper,
      confidenceLevel: confidence,
      iterations,
      sampleSize: samples.length,
    };
  },
});

export default bootstrapCITool;
