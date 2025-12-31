/**
 * Logistic Regression Tool for TPMJS
 * Implements binary logistic regression using gradient descent
 */

import { jsonSchema, tool } from 'ai';

/**
 * Output interface for logistic regression
 */
export interface LogisticRegressionResult {
  coefficients: number[];
  predictions: number[];
  accuracy: number;
  iterations: number;
  convergence: {
    finalLoss: number;
    converged: boolean;
  };
}

type LogisticRegressionInput = {
  x: number[][];
  y: number[];
  iterations?: number;
  learningRate?: number;
};

/**
 * Sigmoid activation function
 */
function sigmoid(z: number): number {
  // Clip z to prevent overflow
  const clipped = Math.max(-500, Math.min(500, z));
  return 1 / (1 + Math.exp(-clipped));
}

/**
 * Add intercept term (bias) to feature matrix
 */
function addIntercept(X: number[][]): number[][] {
  return X.map((row) => [1, ...row]);
}

/**
 * Matrix-vector multiplication
 */
function matVecMultiply(matrix: number[][], vector: number[]): number[] {
  return matrix.map((row) => row.reduce((sum, val, i) => sum + val * (vector[i] ?? 0), 0));
}

/**
 * Calculate predictions using sigmoid of linear combination
 */
function predict(X: number[][], coefficients: number[]): number[] {
  const linearCombination = matVecMultiply(X, coefficients);
  return linearCombination.map((z) => sigmoid(z));
}

/**
 * Calculate binary cross-entropy loss
 */
function calculateLoss(predictions: number[], y: number[]): number {
  const epsilon = 1e-15; // Prevent log(0)
  let loss = 0;

  for (let i = 0; i < y.length; i++) {
    const pred = predictions[i];
    const label = y[i];
    if (pred === undefined || label === undefined) continue;
    const p = Math.max(epsilon, Math.min(1 - epsilon, pred));
    loss -= label * Math.log(p) + (1 - label) * Math.log(1 - p);
  }

  return loss / y.length;
}

/**
 * Calculate gradient for logistic regression
 */
function calculateGradient(X: number[][], y: number[], predictions: number[]): number[] {
  const m = X.length;
  const firstRow = X[0];
  if (!firstRow) throw new Error('X must have at least one row');
  const n = firstRow.length;
  const gradient = new Array(n).fill(0);

  // gradient = (1/m) * X^T * (predictions - y)
  for (let j = 0; j < n; j++) {
    let sum = 0;
    for (let i = 0; i < m; i++) {
      const row = X[i];
      const pred = predictions[i];
      const label = y[i];
      if (row && pred !== undefined && label !== undefined) {
        const val = row[j];
        if (val !== undefined) {
          sum += val * (pred - label);
        }
      }
    }
    gradient[j] = sum / m;
  }

  return gradient;
}

/**
 * Fit logistic regression using gradient descent
 */
function fitLogisticRegression(
  X: number[][],
  y: number[],
  iterations: number,
  learningRate: number
): {
  coefficients: number[];
  finalLoss: number;
  converged: boolean;
} {
  const firstRow = X[0];
  if (!firstRow) throw new Error('X must have at least one row');
  const n = firstRow.length;
  let coefficients = new Array(n).fill(0);
  let previousLoss = Number.POSITIVE_INFINITY;
  let converged = false;
  const convergenceThreshold = 1e-6;

  for (let iter = 0; iter < iterations; iter++) {
    // Forward pass
    const predictions = predict(X, coefficients);
    const loss = calculateLoss(predictions, y);

    // Check convergence
    if (Math.abs(previousLoss - loss) < convergenceThreshold) {
      converged = true;
      break;
    }
    previousLoss = loss;

    // Calculate gradient
    const gradient = calculateGradient(X, y, predictions);

    // Update coefficients
    coefficients = coefficients.map((coef, i) => {
      const grad = gradient[i];
      return grad !== undefined ? coef - learningRate * grad : coef;
    });
  }

  return {
    coefficients,
    finalLoss: previousLoss,
    converged,
  };
}

/**
 * Calculate accuracy of binary predictions
 */
function calculateAccuracy(predictions: number[], y: number[]): number {
  const binaryPredictions = predictions.map((p) => (p >= 0.5 ? 1 : 0));
  const correct = binaryPredictions.filter((pred, i) => {
    const label = y[i];
    return label !== undefined && pred === label;
  }).length;
  return correct / y.length;
}

/**
 * Validate input data
 */
function validateInput(x: number[][], y: number[]): void {
  if (!Array.isArray(x) || x.length === 0) {
    throw new Error('x must be a non-empty array of arrays');
  }

  if (!Array.isArray(y) || y.length === 0) {
    throw new Error('y must be a non-empty array');
  }

  if (x.length !== y.length) {
    throw new Error(`x and y must have same length (got x: ${x.length}, y: ${y.length})`);
  }

  // Check that all rows have same number of features
  const firstRow = x[0];
  if (!firstRow) throw new Error('x must have at least one row');
  const numFeatures = firstRow.length;
  for (let i = 0; i < x.length; i++) {
    const row = x[i];
    if (!Array.isArray(row)) {
      throw new Error(`x[${i}] must be an array`);
    }
    if (row.length !== numFeatures) {
      throw new Error(
        `All rows in x must have same number of features (expected ${numFeatures}, got ${row.length} at row ${i})`
      );
    }
  }

  // Check that y contains only 0s and 1s
  for (let i = 0; i < y.length; i++) {
    if (y[i] !== 0 && y[i] !== 1) {
      throw new Error(`y must contain only 0 or 1 (got ${y[i]} at index ${i})`);
    }
  }

  // Check for at least 2 samples
  if (x.length < 2) {
    throw new Error('Need at least 2 samples for logistic regression');
  }
}

/**
 * Logistic Regression Tool
 * Performs binary classification using gradient descent optimization
 */
export const logisticRegressionTool = tool({
  description:
    'Perform binary logistic regression using gradient descent. Fits a model to predict binary outcomes (0 or 1) from feature variables. Returns coefficients, predictions, and accuracy metrics.',
  inputSchema: jsonSchema<LogisticRegressionInput>({
    type: 'object',
    properties: {
      x: {
        type: 'array',
        items: {
          type: 'array',
          items: { type: 'number' },
        },
        description: 'Feature matrix where each row is a sample and each column is a feature',
      },
      y: {
        type: 'array',
        items: { type: 'number' },
        description: 'Binary target labels (must be 0 or 1)',
      },
      iterations: {
        type: 'number',
        description: 'Number of gradient descent iterations (default: 1000)',
      },
      learningRate: {
        type: 'number',
        description: 'Learning rate for gradient descent (default: 0.1)',
      },
    },
    required: ['x', 'y'],
    additionalProperties: false,
  }),
  async execute({
    x,
    y,
    iterations = 1000,
    learningRate = 0.1,
  }): Promise<LogisticRegressionResult> {
    // Validate inputs
    validateInput(x, y);

    if (iterations <= 0 || !Number.isFinite(iterations)) {
      throw new Error('iterations must be a positive number');
    }

    if (learningRate <= 0 || !Number.isFinite(learningRate)) {
      throw new Error('learningRate must be a positive number');
    }

    // Add intercept term
    const X = addIntercept(x);

    // Fit the model
    const { coefficients, finalLoss, converged } = fitLogisticRegression(
      X,
      y,
      iterations,
      learningRate
    );

    // Make predictions
    const probabilities = predict(X, coefficients);
    const predictions = probabilities.map((p) => (p >= 0.5 ? 1 : 0));

    // Calculate accuracy
    const accuracy = calculateAccuracy(probabilities, y);

    return {
      coefficients,
      predictions,
      accuracy,
      iterations,
      convergence: {
        finalLoss,
        converged,
      },
    };
  },
});

export default logisticRegressionTool;
