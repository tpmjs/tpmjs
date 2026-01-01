/**
 * Budget Variance Tool for TPMJS
 * Calculates budget vs actual variance with percentage and trend analysis
 */

import { jsonSchema, tool } from 'ai';

/**
 * Budget line item
 */
interface BudgetItem {
  category: string;
  amount: number;
  period?: string;
}

/**
 * Actual spending line item
 */
interface ActualItem {
  category: string;
  amount: number;
  period?: string;
}

/**
 * Variance analysis for a single category
 */
interface VarianceItem {
  category: string;
  budget: number;
  actual: number;
  variance: number;
  percentageVariance: number;
  trend: 'favorable' | 'unfavorable' | 'neutral';
  status: 'over' | 'under' | 'on-track';
}

/**
 * Input interface for budget variance calculation
 */
interface BudgetVarianceInput {
  budget: BudgetItem[];
  actual: ActualItem[];
}

/**
 * Output interface for budget variance analysis
 */
export interface BudgetVarianceResult {
  variances: VarianceItem[];
  summary: {
    totalBudget: number;
    totalActual: number;
    totalVariance: number;
    overallPercentageVariance: number;
    categoriesOverBudget: number;
    categoriesUnderBudget: number;
    categoriesOnTrack: number;
  };
}

/**
 * Budget Variance Tool
 * Calculates variance between budgeted and actual amounts with trend analysis
 */
export const budgetVarianceTool = tool({
  description:
    'Calculates budget vs actual variance with percentage and trend analysis. Identifies favorable and unfavorable trends, and provides summary statistics.',
  inputSchema: jsonSchema<BudgetVarianceInput>({
    type: 'object',
    properties: {
      budget: {
        type: 'array',
        description: 'Budget line items with category and amount',
        items: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Budget category name',
            },
            amount: {
              type: 'number',
              description: 'Budgeted amount',
            },
            period: {
              type: 'string',
              description: 'Optional budget period (e.g., "2024-Q1")',
            },
          },
          required: ['category', 'amount'],
        },
      },
      actual: {
        type: 'array',
        description: 'Actual spending line items with category and amount',
        items: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Spending category name',
            },
            amount: {
              type: 'number',
              description: 'Actual amount spent',
            },
            period: {
              type: 'string',
              description: 'Optional spending period (e.g., "2024-Q1")',
            },
          },
          required: ['category', 'amount'],
        },
      },
    },
    required: ['budget', 'actual'],
    additionalProperties: false,
  }),
  execute: async ({ budget, actual }): Promise<BudgetVarianceResult> => {
    // Validate inputs
    if (!Array.isArray(budget) || budget.length === 0) {
      throw new Error('Budget must be a non-empty array');
    }

    if (!Array.isArray(actual) || actual.length === 0) {
      throw new Error('Actual must be a non-empty array');
    }

    // Create maps for quick lookup
    const budgetMap = new Map<string, number>();
    const actualMap = new Map<string, number>();

    // Aggregate budget by category
    for (const item of budget) {
      if (!item.category || typeof item.amount !== 'number') {
        throw new Error('Each budget item must have a category and amount');
      }
      const current = budgetMap.get(item.category) || 0;
      budgetMap.set(item.category, current + item.amount);
    }

    // Aggregate actual by category
    for (const item of actual) {
      if (!item.category || typeof item.amount !== 'number') {
        throw new Error('Each actual item must have a category and amount');
      }
      const current = actualMap.get(item.category) || 0;
      actualMap.set(item.category, current + item.amount);
    }

    // Get all unique categories
    const allCategories = new Set([...budgetMap.keys(), ...actualMap.keys()]);

    // Calculate variances
    const variances: VarianceItem[] = [];
    let totalBudget = 0;
    let totalActual = 0;
    let categoriesOverBudget = 0;
    let categoriesUnderBudget = 0;
    let categoriesOnTrack = 0;

    for (const category of allCategories) {
      const budgetAmount = budgetMap.get(category) || 0;
      const actualAmount = actualMap.get(category) || 0;
      const variance = actualAmount - budgetAmount;
      const percentageVariance =
        budgetAmount !== 0 ? (variance / budgetAmount) * 100 : actualAmount !== 0 ? 100 : 0;

      // Domain rule: budget_variance_trend - Under budget is favorable, over budget is unfavorable, ±5% is neutral
      // Determine trend (for spending, under budget is favorable)
      let trend: 'favorable' | 'unfavorable' | 'neutral';
      if (Math.abs(percentageVariance) < 5) {
        // Within 5% is considered neutral/on-track
        trend = 'neutral';
      } else if (variance < 0) {
        // Under budget is favorable
        trend = 'favorable';
      } else {
        // Over budget is unfavorable
        trend = 'unfavorable';
      }

      // Domain rule: variance_tolerance - ±5% variance threshold determines on-track status
      // Determine status
      let status: 'over' | 'under' | 'on-track';
      if (Math.abs(percentageVariance) < 5) {
        status = 'on-track';
        categoriesOnTrack++;
      } else if (variance > 0) {
        status = 'over';
        categoriesOverBudget++;
      } else {
        status = 'under';
        categoriesUnderBudget++;
      }

      variances.push({
        category,
        budget: budgetAmount,
        actual: actualAmount,
        variance,
        percentageVariance: Math.round(percentageVariance * 100) / 100,
        trend,
        status,
      });

      totalBudget += budgetAmount;
      totalActual += actualAmount;
    }

    // Sort by absolute variance (largest first)
    variances.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));

    const totalVariance = totalActual - totalBudget;
    const overallPercentageVariance =
      totalBudget !== 0 ? (totalVariance / totalBudget) * 100 : totalActual !== 0 ? 100 : 0;

    return {
      variances,
      summary: {
        totalBudget,
        totalActual,
        totalVariance,
        overallPercentageVariance: Math.round(overallPercentageVariance * 100) / 100,
        categoriesOverBudget,
        categoriesUnderBudget,
        categoriesOnTrack,
      },
    };
  },
});

export default budgetVarianceTool;
