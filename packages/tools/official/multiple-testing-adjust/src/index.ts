/**
 * Multiple Testing Adjustment Tool for TPMJS
 * Adjusts p-values for multiple testing using Bonferroni, Benjamini-Hochberg (BH),
 * or Holm methods to control family-wise error rate or false discovery rate.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Output interface for multiple testing adjustment
 */
export interface MultipleTestingResult {
  adjusted: number[];
  significant: number[];
  method: string;
  alpha: number;
  metadata: {
    totalTests: number;
    significantCount: number;
    originalSignificant: number;
  };
}

type MultipleTestingInput = {
  pValues: number[];
  method?: 'bonferroni' | 'bh' | 'holm';
  alpha?: number;
};

/**
 * Bonferroni correction: multiply each p-value by the number of tests
 */
function bonferroniCorrection(pValues: number[]): number[] {
  const n = pValues.length;
  return pValues.map((p) => Math.min(1, p * n));
}

/**
 * Benjamini-Hochberg (BH) procedure for controlling false discovery rate
 */
function benjaminiHochberg(pValues: number[]): number[] {
  const n = pValues.length;

  // Create array of [index, p-value] pairs
  const indexed = pValues.map((p, i) => ({ index: i, pValue: p }));

  // Sort by p-value (ascending)
  indexed.sort((a, b) => a.pValue - b.pValue);

  // Calculate adjusted p-values
  const adjusted = new Array<number>(n).fill(0);
  let minAdjusted = 1;

  // Work backwards to ensure monotonicity
  for (let i = n - 1; i >= 0; i--) {
    const rank = i + 1;
    const item = indexed[i];
    if (!item) continue;
    const adjustedP = Math.min(1, (item.pValue * n) / rank);

    // Ensure monotonicity (adjusted p-values should decrease)
    minAdjusted = Math.min(minAdjusted, adjustedP);
    adjusted[item.index] = minAdjusted;
  }

  return adjusted;
}

/**
 * Holm step-down procedure (more powerful than Bonferroni)
 */
function holmCorrection(pValues: number[]): number[] {
  const n = pValues.length;

  // Create array of [index, p-value] pairs
  const indexed = pValues.map((p, i) => ({ index: i, pValue: p }));

  // Sort by p-value (ascending)
  indexed.sort((a, b) => a.pValue - b.pValue);

  // Calculate adjusted p-values
  const adjusted = new Array<number>(n).fill(0);
  let maxAdjusted = 0;

  // Work forwards with step-down multiplier
  for (let i = 0; i < n; i++) {
    const multiplier = n - i;
    const item = indexed[i];
    if (!item) continue;
    const adjustedP = Math.min(1, item.pValue * multiplier);

    // Ensure monotonicity (adjusted p-values should increase)
    maxAdjusted = Math.max(maxAdjusted, adjustedP);
    adjusted[item.index] = maxAdjusted;
  }

  return adjusted;
}

/**
 * Perform multiple testing adjustment
 */
function adjustPValues(
  pValues: number[],
  method: 'bonferroni' | 'bh' | 'holm',
  alpha: number
): MultipleTestingResult {
  // Calculate adjusted p-values based on method
  let adjusted: number[];

  switch (method) {
    case 'bonferroni':
      adjusted = bonferroniCorrection(pValues);
      break;
    case 'bh':
      adjusted = benjaminiHochberg(pValues);
      break;
    case 'holm':
      adjusted = holmCorrection(pValues);
      break;
    default:
      throw new Error(`Unknown method: ${method}`);
  }

  // Determine which tests are significant after adjustment
  const significant = adjusted.map((p, i) => (p < alpha ? i : -1)).filter((i) => i >= 0);

  // Count original significant tests (before adjustment)
  const originalSignificant = pValues.filter((p) => p < alpha).length;

  return {
    adjusted,
    significant,
    method,
    alpha,
    metadata: {
      totalTests: pValues.length,
      significantCount: significant.length,
      originalSignificant,
    },
  };
}

/**
 * Multiple Testing Adjustment Tool
 * Adjusts p-values for multiple comparisons
 */
export const multipleTestingAdjustTool = tool({
  description:
    'Adjust p-values for multiple testing using Bonferroni, Benjamini-Hochberg (BH), or Holm methods. Returns adjusted p-values and indices of significant tests. Use Bonferroni for strict family-wise error control, BH for false discovery rate control, or Holm for a more powerful alternative to Bonferroni.',
  inputSchema: jsonSchema<MultipleTestingInput>({
    type: 'object',
    properties: {
      pValues: {
        type: 'array',
        items: { type: 'number', minimum: 0, maximum: 1 },
        description: 'Array of p-values to adjust (each between 0 and 1)',
        minItems: 1,
      },
      method: {
        type: 'string',
        enum: ['bonferroni', 'bh', 'holm'],
        description:
          'Adjustment method: bonferroni (most conservative), bh (Benjamini-Hochberg, controls FDR), or holm (step-down, more powerful than Bonferroni). Default: bonferroni',
      },
      alpha: {
        type: 'number',
        description: 'Significance level (default: 0.05)',
        minimum: 0,
        maximum: 1,
      },
    },
    required: ['pValues'],
    additionalProperties: false,
  }),
  async execute({ pValues, method = 'bonferroni', alpha = 0.05 }): Promise<MultipleTestingResult> {
    // Validate inputs
    if (!Array.isArray(pValues) || pValues.length === 0) {
      throw new Error('pValues must be a non-empty array');
    }

    // Validate all p-values are valid
    if (!pValues.every((p) => typeof p === 'number' && p >= 0 && p <= 1 && !Number.isNaN(p))) {
      throw new Error('All p-values must be numbers between 0 and 1');
    }

    // Validate method
    if (!['bonferroni', 'bh', 'holm'].includes(method)) {
      throw new Error('method must be one of: bonferroni, bh, holm');
    }

    // Validate alpha
    if (typeof alpha !== 'number' || alpha <= 0 || alpha >= 1) {
      throw new Error('alpha must be a number between 0 and 1');
    }

    // Perform the adjustment
    return adjustPValues(pValues, method, alpha);
  },
});

export default multipleTestingAdjustTool;
