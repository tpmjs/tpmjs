/**
 * Bootstrap Confidence Interval Tool for TPMJS
 * Calculates bootstrap confidence intervals using resampling methodology.
 * Implements the percentile method for CI estimation.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Output interface for bootstrap confidence interval results
 */
export interface BootstrapResult {
  mean: number;
  lower: number;
  upper: number;
  confidenceLevel: number;
  iterations: number;
  sampleSize: number;
}

type BootstrapCIInput = {
  data: number[];
  confidenceLevel?: number;
  iterations?: number;
};

/**
 * Calculates the mean of an array of numbers
 */
function calculateMean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

/**
 * Generates a bootstrap sample by randomly sampling with replacement
 */
function generateBootstrapSample(data: number[]): number[] {
  const sample: number[] = [];
  const n = data.length;

  for (let i = 0; i < n; i++) {
    const randomIndex = Math.floor(Math.random() * n);
    const value = data[randomIndex];
    if (value !== undefined) {
      sample.push(value);
    }
  }

  return sample;
}

/**
 * Calculates percentile value from sorted array
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
    'Calculate bootstrap confidence interval for a sample statistic (mean) using the resampling method. The bootstrap is a powerful non-parametric method that does not assume a normal distribution. It works by repeatedly resampling the data with replacement and calculating the statistic of interest for each resample.',
  inputSchema: jsonSchema<BootstrapCIInput>({
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { type: 'number' },
        description: 'Array of numeric values to analyze (sample data)',
        minItems: 2,
      },
      confidenceLevel: {
        type: 'number',
        description: 'Confidence level as a decimal (e.g., 0.95 for 95% CI). Default: 0.95',
        minimum: 0.5,
        maximum: 0.999,
      },
      iterations: {
        type: 'number',
        description: 'Number of bootstrap iterations to perform. Default: 1000',
        minimum: 100,
        maximum: 100000,
      },
    },
    required: ['data'],
    additionalProperties: false,
  }),
  async execute({ data, confidenceLevel = 0.95, iterations = 1000 }): Promise<BootstrapResult> {
    // Validate inputs
    if (!Array.isArray(data) || data.length < 2) {
      throw new Error('Data must be an array with at least 2 numeric values');
    }

    // Check for valid numbers
    for (const value of data) {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(`Invalid data: all values must be finite numbers. Found: ${value}`);
      }
    }

    if (confidenceLevel <= 0.5 || confidenceLevel >= 1) {
      throw new Error(`Confidence level must be between 0.5 and 0.999. Got: ${confidenceLevel}`);
    }

    if (iterations < 100 || iterations > 100000) {
      throw new Error(`Iterations must be between 100 and 100000. Got: ${iterations}`);
    }

    // Calculate original sample mean
    const originalMean = calculateMean(data);

    // Perform bootstrap resampling
    const bootstrapMeans: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const bootstrapSample = generateBootstrapSample(data);
      const bootstrapMean = calculateMean(bootstrapSample);
      bootstrapMeans.push(bootstrapMean);
    }

    // Sort bootstrap means for percentile calculation
    bootstrapMeans.sort((a, b) => a - b);

    // Calculate confidence interval using percentile method
    const alpha = 1 - confidenceLevel;
    const lowerPercentile = (alpha / 2) * 100;
    const upperPercentile = (1 - alpha / 2) * 100;

    const lower = calculatePercentile(bootstrapMeans, lowerPercentile);
    const upper = calculatePercentile(bootstrapMeans, upperPercentile);

    return {
      mean: originalMean,
      lower,
      upper,
      confidenceLevel,
      iterations,
      sampleSize: data.length,
    };
  },
});

export default bootstrapCITool;
