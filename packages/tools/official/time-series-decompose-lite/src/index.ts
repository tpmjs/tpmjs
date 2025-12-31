/**
 * Time Series Decomposition Tool for TPMJS
 * Implements additive decomposition into trend, seasonal, and residual components
 */

import { jsonSchema, tool } from 'ai';

/**
 * Output interface for time series decomposition
 */
export interface TimeSeriesDecomposition {
  trend: number[];
  seasonal: number[];
  residual: number[];
  period: number;
  decompositionType: 'additive';
  statistics: {
    trendStrength: number;
    seasonalStrength: number;
  };
}

type TimeSeriesDecomposeInput = {
  data: number[];
  period: number;
};

/**
 * Calculate moving average for trend extraction
 * Uses centered moving average with window size = period
 */
function calculateMovingAverage(data: number[], period: number): number[] {
  const n = data.length;
  const trend = new Array(n).fill(null);
  const halfWindow = Math.floor(period / 2);

  for (let i = halfWindow; i < n - halfWindow; i++) {
    let sum = 0;
    let count = 0;

    for (let j = i - halfWindow; j <= i + halfWindow; j++) {
      if (j >= 0 && j < n) {
        const val = data[j];
        if (val !== undefined) {
          sum += val;
          count++;
        }
      }
    }

    trend[i] = sum / count;
  }

  // Fill edges with linear extrapolation
  // Forward fill from first valid point
  const firstValid = trend.findIndex((v) => v !== null);
  if (firstValid > 0) {
    for (let i = 0; i < firstValid; i++) {
      trend[i] = trend[firstValid];
    }
  }

  // Backward fill from last valid point
  let lastValid = trend.length - 1;
  while (lastValid >= 0 && trend[lastValid] === null) {
    lastValid--;
  }
  if (lastValid >= 0 && lastValid < trend.length - 1) {
    const lastValidValue = trend[lastValid];
    if (lastValidValue !== null) {
      for (let i = lastValid + 1; i < trend.length; i++) {
        trend[i] = lastValidValue;
      }
    }
  }

  return trend as number[];
}

/**
 * Extract seasonal component from detrended data
 */
function extractSeasonalComponent(detrended: number[], period: number): number[] {
  const n = detrended.length;

  // Calculate average for each position in the cycle
  const seasonalAverages = new Array(period).fill(0);
  const counts = new Array(period).fill(0);

  for (let i = 0; i < n; i++) {
    const seasonIndex = i % period;
    seasonalAverages[seasonIndex] += detrended[i];
    counts[seasonIndex]++;
  }

  for (let i = 0; i < period; i++) {
    if (counts[i] > 0) {
      seasonalAverages[i] /= counts[i];
    }
  }

  // Center the seasonal component (mean = 0)
  const seasonalMean = seasonalAverages.reduce((sum, val) => sum + val, 0) / period;
  const centeredSeasonal = seasonalAverages.map((val) => val - seasonalMean);

  // Repeat the seasonal pattern to match data length
  const seasonal = new Array(n);
  for (let i = 0; i < n; i++) {
    seasonal[i] = centeredSeasonal[i % period];
  }

  return seasonal;
}

/**
 * Calculate variance for strength metrics
 */
function calculateVariance(data: number[]): number {
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const squaredDiffs = data.map((val) => (val - mean) ** 2);
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / data.length;
}

/**
 * Calculate strength of trend and seasonal components
 * Based on variance ratios
 */
function calculateStrengths(
  residual: number[],
  detrended: number[]
): { trendStrength: number; seasonalStrength: number } {
  const residualVar = calculateVariance(residual);
  const detrendedVar = calculateVariance(detrended);

  // Trend strength: 1 - Var(residual) / Var(detrended)
  // Seasonal strength: 1 - Var(residual) / Var(detrended)
  const trendStrength = Math.max(0, Math.min(1, 1 - residualVar / detrendedVar));
  const seasonalStrength = Math.max(0, Math.min(1, 1 - residualVar / detrendedVar));

  return {
    trendStrength,
    seasonalStrength,
  };
}

/**
 * Validate input data
 */
function validateInput(data: number[], period: number): void {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('data must be a non-empty array');
  }

  if (!data.every((val) => typeof val === 'number' && Number.isFinite(val))) {
    throw new Error('data must contain only finite numbers');
  }

  if (!Number.isInteger(period) || period < 2) {
    throw new Error('period must be an integer >= 2');
  }

  if (data.length < period * 2) {
    throw new Error(
      `data must have at least ${period * 2} points (2 complete periods) for period=${period}`
    );
  }
}

/**
 * Time Series Decomposition Tool
 * Decomposes time series into trend, seasonal, and residual components
 * Uses additive model: data = trend + seasonal + residual
 */
export const timeSeriesDecomposeLiteTool = tool({
  description:
    'Decompose time series data into trend, seasonal, and residual components using additive decomposition. Useful for understanding patterns in temporal data like sales, weather, or economic indicators.',
  inputSchema: jsonSchema<TimeSeriesDecomposeInput>({
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { type: 'number' },
        description: 'Time series data points in chronological order',
      },
      period: {
        type: 'number',
        description:
          'Seasonal period (e.g., 12 for monthly data with yearly seasonality, 7 for daily data with weekly patterns)',
      },
    },
    required: ['data', 'period'],
    additionalProperties: false,
  }),
  async execute({ data, period }): Promise<TimeSeriesDecomposition> {
    // Validate inputs
    validateInput(data, period);

    // Step 1: Extract trend using centered moving average
    const trend = calculateMovingAverage(data, period);

    // Step 2: Detrend the data
    const detrended = data.map((val, i) => {
      const trendVal = trend[i];
      return trendVal !== undefined ? val - trendVal : 0;
    });

    // Step 3: Extract seasonal component
    const seasonal = extractSeasonalComponent(detrended, period);

    // Step 4: Calculate residual (what's left after removing trend and seasonal)
    const residual = data.map((val, i) => {
      const trendVal = trend[i];
      const seasonalVal = seasonal[i];
      if (trendVal === undefined || seasonalVal === undefined) return 0;
      return val - trendVal - seasonalVal;
    });

    // Step 5: Calculate component strengths
    const statistics = calculateStrengths(residual, detrended);

    return {
      trend,
      seasonal,
      residual,
      period,
      decompositionType: 'additive',
      statistics,
    };
  },
});

export default timeSeriesDecomposeLiteTool;
