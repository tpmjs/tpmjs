/**
 * Anomaly Detection MAD Tool for TPMJS
 * Detects outliers using Median Absolute Deviation (MAD).
 * MAD is a robust statistic resistant to outliers, making it ideal for anomaly detection.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Output interface for anomaly detection results
 */
export interface AnomalyResult {
  anomalies: Array<{
    value: number;
    index: number;
    deviation: number;
    zScore: number;
  }>;
  anomalyIndices: number[];
  statistics: {
    median: number;
    mad: number;
    threshold: number;
    totalPoints: number;
    anomalyCount: number;
    anomalyPercentage: number;
  };
}

type AnomalyDetectInput = {
  data: number[];
  threshold?: number;
};

/**
 * Calculates the median of an array
 */
function calculateMedian(arr: number[]): number {
  if (arr.length === 0) return 0;

  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    const val1 = sorted[mid - 1] ?? 0;
    const val2 = sorted[mid] ?? 0;
    return (val1 + val2) / 2;
  }

  return sorted[mid] ?? 0;
}

/**
 * Calculates the Median Absolute Deviation (MAD)
 * MAD = median(|X_i - median(X)|)
 */
function calculateMAD(arr: number[], median: number): number {
  if (arr.length === 0) return 0;

  const absoluteDeviations = arr.map((val) => Math.abs(val - median));
  return calculateMedian(absoluteDeviations);
}

/**
 * Calculates modified Z-score using MAD
 * Modified Z-score = 0.6745 * (X - median) / MAD
 * The constant 0.6745 is the 75th percentile of the standard normal distribution,
 * which makes the MAD-based z-score comparable to the standard z-score
 */
function calculateModifiedZScore(value: number, median: number, mad: number): number {
  if (mad === 0) return 0;
  return (0.6745 * (value - median)) / mad;
}

/**
 * Anomaly Detection MAD Tool
 * Detects outliers using the Median Absolute Deviation method
 */
export const anomalyDetectMADTool = tool({
  description:
    'Detect anomalies (outliers) in numeric data using the Median Absolute Deviation (MAD) method. MAD is a robust statistic that is resistant to outliers themselves, making it more reliable than standard deviation for detecting anomalies. The modified z-score threshold of 3.5 is commonly used (equivalent to ±3 standard deviations in normal distribution).',
  inputSchema: jsonSchema<AnomalyDetectInput>({
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { type: 'number' },
        description: 'Array of numeric values to analyze for anomalies',
        minItems: 3,
      },
      threshold: {
        type: 'number',
        description:
          'Modified z-score threshold for anomaly detection. Default: 3.5 (recommended). Lower values = more sensitive. Common values: 2.5 (sensitive), 3.5 (balanced), 4.5 (conservative)',
        minimum: 0.1,
        maximum: 10,
      },
    },
    required: ['data'],
    additionalProperties: false,
  }),
  async execute({ data, threshold = 3.5 }): Promise<AnomalyResult> {
    // Validate inputs
    if (!Array.isArray(data) || data.length < 3) {
      throw new Error('Data must be an array with at least 3 numeric values');
    }

    // Check for valid numbers
    for (const value of data) {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(`Invalid data: all values must be finite numbers. Found: ${value}`);
      }
    }

    if (threshold <= 0.1 || threshold > 10) {
      throw new Error(`Threshold must be between 0.1 and 10. Got: ${threshold}`);
    }

    // Calculate median and MAD
    const median = calculateMedian(data);
    const mad = calculateMAD(data, median);

    // Handle edge case where MAD is 0 (all values are identical)
    if (mad === 0) {
      // If MAD is 0, check if any values differ from the median
      const uniqueValues = new Set(data);
      if (uniqueValues.size === 1) {
        // All values are identical - no anomalies
        return {
          anomalies: [],
          anomalyIndices: [],
          statistics: {
            median,
            mad: 0,
            threshold,
            totalPoints: data.length,
            anomalyCount: 0,
            anomalyPercentage: 0,
          },
        };
      }

      // MAD is 0 but values differ - this is rare but can happen
      // Flag any non-median values as anomalies
      const anomalies: AnomalyResult['anomalies'] = [];
      const anomalyIndices: number[] = [];

      data.forEach((value, index) => {
        if (value !== median) {
          anomalies.push({
            value,
            index,
            deviation: Math.abs(value - median),
            zScore: Number.POSITIVE_INFINITY,
          });
          anomalyIndices.push(index);
        }
      });

      return {
        anomalies,
        anomalyIndices,
        statistics: {
          median,
          mad: 0,
          threshold,
          totalPoints: data.length,
          anomalyCount: anomalies.length,
          anomalyPercentage: (anomalies.length / data.length) * 100,
        },
      };
    }

    // Detect anomalies using modified z-score
    const anomalies: AnomalyResult['anomalies'] = [];
    const anomalyIndices: number[] = [];

    data.forEach((value, index) => {
      const modifiedZScore = calculateModifiedZScore(value, median, mad);

      if (Math.abs(modifiedZScore) > threshold) {
        anomalies.push({
          value: Math.round(value * 1000) / 1000,
          index,
          deviation: Math.round(Math.abs(value - median) * 1000) / 1000,
          zScore: Math.round(modifiedZScore * 1000) / 1000,
        });
        anomalyIndices.push(index);
      }
    });

    // Sort anomalies by absolute z-score (most extreme first)
    anomalies.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));

    return {
      anomalies,
      anomalyIndices,
      statistics: {
        median: Math.round(median * 1000) / 1000,
        mad: Math.round(mad * 1000) / 1000,
        threshold,
        totalPoints: data.length,
        anomalyCount: anomalies.length,
        anomalyPercentage: Math.round((anomalies.length / data.length) * 10000) / 100,
      },
    };
  },
});

export default anomalyDetectMADTool;
