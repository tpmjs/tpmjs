/**
 * Linear Regression OLS Tool for TPMJS
 * Performs simple linear regression using Ordinary Least Squares (OLS) method.
 * Calculates slope, intercept, R-squared, residuals, and predictions.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Output interface for regression results
 */
export interface RegressionResult {
  coefficients: number[];
  intercept: number;
  rSquared: number;
  residuals: number[];
  predictions: number[];
  standardErrors: number[];
  warnings: string[];
  metadata: {
    n: number;
    numFeatures: number;
    sst: number;
    sse: number;
  };
}

type LinearRegressionInput = {
  X: number[][];
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
 * Transpose a matrix
 */
function transpose(matrix: number[][]): number[][] {
  if (matrix.length === 0) return [];
  const rows = matrix.length;
  const cols = matrix[0]?.length ?? 0;
  const result: number[][] = Array(cols)
    .fill(0)
    .map(() => Array(rows).fill(0));

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j]![i] = matrix[i]![j] ?? 0;
    }
  }
  return result;
}

/**
 * Multiply two matrices
 */
function matrixMultiply(a: number[][], b: number[][]): number[][] {
  const aRows = a.length;
  const aCols = a[0]?.length ?? 0;
  const bCols = b[0]?.length ?? 0;

  const result: number[][] = Array(aRows)
    .fill(0)
    .map(() => Array(bCols).fill(0));

  for (let i = 0; i < aRows; i++) {
    for (let j = 0; j < bCols; j++) {
      let sum = 0;
      for (let k = 0; k < aCols; k++) {
        sum += (a[i]![k] ?? 0) * (b[k]![j] ?? 0);
      }
      result[i]![j] = sum;
    }
  }
  return result;
}

/**
 * Simple matrix inversion using Gauss-Jordan elimination
 * Domain rule: Gauss-Jordan Elimination - Transforms [A|I] to [I|A⁻¹] through row operations with partial pivoting
 */
function invertMatrix(matrix: number[][]): number[][] {
  const n = matrix.length;
  const augmented: number[][] = matrix.map((row, i) => [
    ...row,
    ...Array(n)
      .fill(0)
      .map((_, j) => (i === j ? 1 : 0)),
  ]);

  // Forward elimination
  // Domain rule: Partial Pivoting - Swaps rows to use largest magnitude element as pivot, improves numerical stability
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k]![i] ?? 0) > Math.abs(augmented[maxRow]![i] ?? 0)) {
        maxRow = k;
      }
    }

    [augmented[i], augmented[maxRow]] = [augmented[maxRow]!, augmented[i]!];

    const pivot = augmented[i]![i];
    if (Math.abs(pivot ?? 0) < 1e-10) {
      throw new Error('Matrix is singular - possible multicollinearity');
    }

    for (let j = 0; j < 2 * n; j++) {
      augmented[i]![j] = (augmented[i]![j] ?? 0) / (pivot ?? 1);
    }

    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = augmented[k]![i] ?? 0;
        for (let j = 0; j < 2 * n; j++) {
          augmented[k]![j] = (augmented[k]![j] ?? 0) - factor * (augmented[i]![j] ?? 0);
        }
      }
    }
  }

  return augmented.map((row) => row.slice(n));
}

/**
 * Check for multicollinearity using variance inflation factor (simplified)
 */
function checkMulticollinearity(X: number[][]): string[] {
  const warnings: string[] = [];
  const numFeatures = X[0]?.length ?? 0;

  // Check for perfect correlation between features
  for (let i = 0; i < numFeatures; i++) {
    for (let j = i + 1; j < numFeatures; j++) {
      const col1 = X.map((row) => row[i] ?? 0);
      const col2 = X.map((row) => row[j] ?? 0);

      const mean1 = calculateMean(col1);
      const mean2 = calculateMean(col2);

      let numerator = 0;
      let sumSq1 = 0;
      let sumSq2 = 0;

      for (let k = 0; k < col1.length; k++) {
        const diff1 = col1[k]! - mean1;
        const diff2 = col2[k]! - mean2;
        numerator += diff1 * diff2;
        sumSq1 += diff1 * diff1;
        sumSq2 += diff2 * diff2;
      }

      const correlation = numerator / Math.sqrt(sumSq1 * sumSq2);
      if (Math.abs(correlation) > 0.9) {
        warnings.push(
          `High correlation (${correlation.toFixed(2)}) between features ${i} and ${j}`
        );
      }
    }
  }

  return warnings;
}

/**
 * Perform multivariate linear regression using OLS
 */
function performLinearRegression(X: number[][], y: number[]): RegressionResult {
  const n = X.length;
  const numFeatures = X[0]?.length ?? 0;
  const warnings: string[] = [];

  // Check for multicollinearity
  warnings.push(...checkMulticollinearity(X));

  // Add intercept column (column of 1s)
  const XWithIntercept = X.map((row) => [1, ...row]);

  // Calculate coefficients using normal equation: β = (X'X)^(-1)X'y
  // Domain rule: OLS Normal Equation - Minimizes sum of squared residuals by solving (X'X)β = X'y
  const XT = transpose(XWithIntercept);
  const XTX = matrixMultiply(XT, XWithIntercept);

  let XTXInv: number[][];
  try {
    XTXInv = invertMatrix(XTX);
  } catch (error) {
    warnings.push('Multicollinearity detected: matrix inversion failed');
    throw new Error('Cannot perform regression: multicollinearity issue');
  }

  const XTy = XT.map((row) => row.reduce((sum, val, i) => sum + val * (y[i] ?? 0), 0));

  const beta = XTXInv.map((row) => row.reduce((sum, val, i) => sum + val * (XTy[i] ?? 0), 0));

  const intercept = beta[0] ?? 0;
  const coefficients = beta.slice(1);

  // Calculate predictions and residuals
  const predictions: number[] = [];
  const residuals: number[] = [];

  for (let i = 0; i < n; i++) {
    let predicted = intercept;
    for (let j = 0; j < numFeatures; j++) {
      predicted += (coefficients[j] ?? 0) * (X[i]![j] ?? 0);
    }
    predictions.push(predicted);
    residuals.push((y[i] ?? 0) - predicted);
  }

  // Calculate R-squared
  // Domain rule: Coefficient of Determination - R² = 1 - (SSE/SST) measures proportion of variance explained by model
  const meanY = calculateMean(y);
  let sst = 0;
  let sse = 0;

  for (let i = 0; i < n; i++) {
    sst += ((y[i] ?? 0) - meanY) ** 2;
    sse += (residuals[i] ?? 0) ** 2;
  }

  const rSquared = sst === 0 ? 1 : 1 - sse / sst;

  // Calculate standard errors
  // Domain rule: OLS Standard Errors - SE(β) = √(MSE × diag((X'X)⁻¹)) where MSE = SSE/(n-p-1)
  const mse = sse / (n - numFeatures - 1);
  const standardErrors = XTXInv.slice(1).map((row) => Math.sqrt(mse * (row[0] ?? 0)));

  return {
    coefficients,
    intercept,
    rSquared,
    residuals,
    predictions,
    standardErrors,
    warnings,
    metadata: {
      n,
      numFeatures,
      sst,
      sse,
    },
  };
}

/**
 * Linear Regression OLS Tool
 * Performs multivariate linear regression using ordinary least squares
 */
export const linearRegressionOLSTool = tool({
  description:
    'Perform multivariate linear regression using Ordinary Least Squares (OLS) to find the best-fit model for feature matrix X and target y. Returns coefficients, intercept, R-squared, residuals, predictions, standard errors, and multicollinearity warnings. Useful for modeling linear relationships with multiple predictors.',
  inputSchema: jsonSchema<LinearRegressionInput>({
    type: 'object',
    properties: {
      X: {
        type: 'array',
        items: {
          type: 'array',
          items: { type: 'number' },
        },
        description: 'Feature matrix (rows are observations, columns are features)',
        minItems: 2,
      },
      y: {
        type: 'array',
        items: { type: 'number' },
        description: 'Target values (dependent variable)',
        minItems: 2,
      },
    },
    required: ['X', 'y'],
    additionalProperties: false,
  }),
  async execute({ X, y }): Promise<RegressionResult> {
    // Validate inputs
    if (!Array.isArray(X) || X.length < 2) {
      throw new Error('X must be an array with at least 2 observations');
    }
    if (!Array.isArray(y) || y.length < 2) {
      throw new Error('y must be an array with at least 2 values');
    }

    // Check that X and y have the same number of observations
    if (X.length !== y.length) {
      throw new Error(
        `X and y must have the same number of observations (X: ${X.length}, y: ${y.length})`
      );
    }

    // Validate all rows in X have the same number of features
    const numFeatures = X[0]?.length ?? 0;
    if (numFeatures === 0) {
      throw new Error('X must have at least one feature');
    }

    for (let i = 0; i < X.length; i++) {
      if (X[i]?.length !== numFeatures) {
        throw new Error(
          `All rows in X must have ${numFeatures} features (row ${i} has ${X[i]?.length})`
        );
      }
    }

    // Validate all elements are numbers
    for (let i = 0; i < X.length; i++) {
      for (let j = 0; j < numFeatures; j++) {
        const val = X[i]![j];
        if (typeof val !== 'number' || !Number.isFinite(val)) {
          throw new Error(`X must contain only finite numbers (invalid at row ${i}, column ${j})`);
        }
      }
    }

    if (!y.every((val) => typeof val === 'number' && Number.isFinite(val))) {
      throw new Error('y must contain only finite numbers');
    }

    // Perform the regression
    return performLinearRegression(X, y);
  },
});

export default linearRegressionOLSTool;
