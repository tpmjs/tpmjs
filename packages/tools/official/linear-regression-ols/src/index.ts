/**
 * Linear Regression OLS Tool for TPMJS
 * Performs simple linear regression using Ordinary Least Squares (OLS) method.
 * Calculates slope, intercept, R-squared, residuals, and predictions.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Output interface for linear regression
 */
export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  residuals: number[];
  predictions: number[];
  metadata: {
    n: number;
    meanX: number;
    meanY: number;
    sst: number;
    sse: number;
  };
}

type LinearRegressionInput = {
  x: number[];
  y: number[];
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
 * Perform simple linear regression using OLS
 */
function performLinearRegression(x: number[], y: number[]): LinearRegressionResult {
  const n = x.length;

  // Calculate means
  const meanX = calculateMean(x);
  const meanY = calculateMean(y);

  // Calculate slope using OLS formula
  // slope = Σ((x - x̄)(y - ȳ)) / Σ((x - x̄)²)
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    const xVal = x[i];
    const yVal = y[i];
    if (xVal === undefined || yVal === undefined) continue;
    const xDiff = xVal - meanX;
    const yDiff = yVal - meanY;
    numerator += xDiff * yDiff;
    denominator += xDiff * xDiff;
  }

  // Handle edge case: all x values are the same
  if (denominator === 0) {
    throw new Error('Cannot perform regression: all x values are identical');
  }

  const slope = numerator / denominator;

  // Calculate intercept
  // intercept = ȳ - slope * x̄
  const intercept = meanY - slope * meanX;

  // Calculate predictions and residuals
  const predictions: number[] = [];
  const residuals: number[] = [];

  for (let i = 0; i < n; i++) {
    const xVal = x[i];
    const yVal = y[i];
    if (xVal === undefined || yVal === undefined) continue;
    const predicted = intercept + slope * xVal;
    predictions.push(predicted);
    residuals.push(yVal - predicted);
  }

  // Calculate R-squared
  // R² = 1 - (SSE / SST)
  // SST = Σ(y - ȳ)² (total sum of squares)
  // SSE = Σ(y - ŷ)² (sum of squared errors)
  let sst = 0; // Total sum of squares
  let sse = 0; // Sum of squared errors

  for (let i = 0; i < n; i++) {
    const yVal = y[i];
    const residual = residuals[i];
    if (yVal === undefined || residual === undefined) continue;
    sst += (yVal - meanY) ** 2;
    sse += residual ** 2;
  }

  // Handle edge case: all y values are the same
  const rSquared = sst === 0 ? 1 : 1 - sse / sst;

  return {
    slope,
    intercept,
    rSquared,
    residuals,
    predictions,
    metadata: {
      n,
      meanX,
      meanY,
      sst,
      sse,
    },
  };
}

/**
 * Linear Regression OLS Tool
 * Performs simple linear regression using ordinary least squares
 */
export const linearRegressionOLSTool = tool({
  description:
    'Perform simple linear regression using Ordinary Least Squares (OLS) to find the best-fit line for x and y data. Returns slope, intercept, R-squared (goodness of fit), residuals, and predictions. Useful for modeling linear relationships and making predictions.',
  inputSchema: jsonSchema<LinearRegressionInput>({
    type: 'object',
    properties: {
      x: {
        type: 'array',
        items: { type: 'number' },
        description: 'Independent variable values (predictor)',
        minItems: 2,
      },
      y: {
        type: 'array',
        items: { type: 'number' },
        description: 'Dependent variable values (response)',
        minItems: 2,
      },
    },
    required: ['x', 'y'],
    additionalProperties: false,
  }),
  async execute({ x, y }): Promise<LinearRegressionResult> {
    // Validate inputs
    if (!Array.isArray(x) || x.length < 2) {
      throw new Error('x must be an array with at least 2 values');
    }
    if (!Array.isArray(y) || y.length < 2) {
      throw new Error('y must be an array with at least 2 values');
    }

    // Check that arrays have the same length
    if (x.length !== y.length) {
      throw new Error(`x and y must have the same length (x: ${x.length}, y: ${y.length})`);
    }

    // Validate all elements are numbers
    if (!x.every((val) => typeof val === 'number' && !Number.isNaN(val))) {
      throw new Error('x must contain only valid numbers');
    }
    if (!y.every((val) => typeof val === 'number' && !Number.isNaN(val))) {
      throw new Error('y must contain only valid numbers');
    }

    // Perform the regression
    return performLinearRegression(x, y);
  },
});

export default linearRegressionOLSTool;
