/**
 * Cash Flow Project Tool for TPMJS
 * Projects cash flow based on receivables, payables, and recurring items
 */

import { jsonSchema, tool } from 'ai';

/**
 * Receivable item with expected payment date
 */
interface Receivable {
  description: string;
  amount: number;
  dueDate: string;
  probability?: number;
}

/**
 * Payable item with expected payment date
 */
interface Payable {
  description: string;
  amount: number;
  dueDate: string;
  recurring?: boolean;
  frequency?: 'weekly' | 'monthly' | 'quarterly' | 'annually';
}

/**
 * Recurring revenue or expense item
 */
interface RecurringItem {
  description: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'annually';
  type: 'income' | 'expense';
  startDate?: string;
  endDate?: string;
}

/**
 * Cash flow projection for a specific period
 */
interface CashFlowPeriod {
  period: string;
  startingBalance: number;
  inflows: number;
  outflows: number;
  netChange: number;
  endingBalance: number;
  inflowDetails: Array<{ description: string; amount: number }>;
  outflowDetails: Array<{ description: string; amount: number }>;
}

/**
 * Input interface for cash flow projection
 */
interface CashFlowProjectInput {
  currentCash: number;
  receivables: Receivable[];
  payables: Payable[];
  recurringItems?: RecurringItem[];
  projectionMonths?: number;
}

/**
 * Output interface for cash flow projection
 */
export interface CashFlowProjectResult {
  projections: CashFlowPeriod[];
  summary: {
    currentCash: number;
    projectedCashAtEnd: number;
    totalInflows: number;
    totalOutflows: number;
    netChange: number;
    averageMonthlyBurn: number;
    runwayMonths: number | null;
    lowestBalance: number;
    lowestBalancePeriod: string;
  };
}

/**
 * Cash Flow Project Tool
 * Projects future cash flow based on receivables, payables, and recurring items
 */
export const cashFlowProjectTool = tool({
  description:
    'Projects cash flow based on receivables, payables, and recurring items. Calculates runway at current burn rate and identifies cash flow risks.',
  inputSchema: jsonSchema<CashFlowProjectInput>({
    type: 'object',
    properties: {
      currentCash: {
        type: 'number',
        description: 'Current cash balance',
      },
      receivables: {
        type: 'array',
        description: 'Expected receivables with due dates',
        items: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: 'Description of receivable',
            },
            amount: {
              type: 'number',
              description: 'Amount expected to receive',
            },
            dueDate: {
              type: 'string',
              description: 'Expected payment date (ISO format)',
            },
            probability: {
              type: 'number',
              description: 'Probability of payment (0-1)',
            },
          },
          required: ['description', 'amount', 'dueDate'],
        },
      },
      payables: {
        type: 'array',
        description: 'Expected payables with due dates',
        items: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: 'Description of payable',
            },
            amount: {
              type: 'number',
              description: 'Amount to pay',
            },
            dueDate: {
              type: 'string',
              description: 'Payment due date (ISO format)',
            },
            recurring: {
              type: 'boolean',
              description: 'Whether this is a recurring payment',
            },
            frequency: {
              type: 'string',
              enum: ['weekly', 'monthly', 'quarterly', 'annually'],
              description: 'Frequency if recurring',
            },
          },
          required: ['description', 'amount', 'dueDate'],
        },
      },
      recurringItems: {
        type: 'array',
        description: 'Recurring revenue or expenses',
        items: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: 'Description of recurring item',
            },
            amount: {
              type: 'number',
              description: 'Amount per period',
            },
            frequency: {
              type: 'string',
              enum: ['weekly', 'monthly', 'quarterly', 'annually'],
              description: 'Frequency of recurrence',
            },
            type: {
              type: 'string',
              enum: ['income', 'expense'],
              description: 'Whether this is income or expense',
            },
            startDate: {
              type: 'string',
              description: 'Start date (ISO format)',
            },
            endDate: {
              type: 'string',
              description: 'End date (ISO format)',
            },
          },
          required: ['description', 'amount', 'frequency', 'type'],
        },
      },
      projectionMonths: {
        type: 'number',
        description: 'Number of months to project (default: 12)',
      },
    },
    required: ['currentCash', 'receivables', 'payables'],
    additionalProperties: false,
  }),
  execute: async ({
    currentCash,
    receivables,
    payables,
    recurringItems = [],
    projectionMonths = 12,
  }): Promise<CashFlowProjectResult> => {
    // Validate inputs
    if (typeof currentCash !== 'number' || currentCash < 0) {
      throw new Error('Current cash must be a non-negative number');
    }

    if (!Array.isArray(receivables)) {
      throw new Error('Receivables must be an array');
    }

    if (!Array.isArray(payables)) {
      throw new Error('Payables must be an array');
    }

    if (projectionMonths < 1 || projectionMonths > 60) {
      throw new Error('Projection months must be between 1 and 60');
    }

    // Initialize projections
    const projections: CashFlowPeriod[] = [];
    const now = new Date();
    let runningBalance = currentCash;
    let totalInflows = 0;
    let totalOutflows = 0;
    let lowestBalance = currentCash;
    let lowestBalancePeriod = formatMonth(now);

    // Generate monthly projections
    for (let i = 0; i < projectionMonths; i++) {
      const periodStart = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);
      const periodLabel = formatMonth(periodStart);

      const inflowDetails: Array<{ description: string; amount: number }> = [];
      const outflowDetails: Array<{ description: string; amount: number }> = [];

      // Domain rule: receivables_probability - Expected receivables are weighted by collection probability (default 100%)
      // Add receivables for this period
      for (const receivable of receivables) {
        const dueDate = new Date(receivable.dueDate);
        if (dueDate >= periodStart && dueDate <= periodEnd) {
          const probability = receivable.probability ?? 1;
          const expectedAmount = receivable.amount * probability;
          inflowDetails.push({
            description: receivable.description,
            amount: expectedAmount,
          });
        }
      }

      // Add payables for this period
      for (const payable of payables) {
        const dueDate = new Date(payable.dueDate);
        if (dueDate >= periodStart && dueDate <= periodEnd) {
          outflowDetails.push({
            description: payable.description,
            amount: payable.amount,
          });
        }

        // Handle recurring payables
        if (payable.recurring && payable.frequency) {
          const shouldInclude = shouldRecur(
            new Date(payable.dueDate),
            periodStart,
            periodEnd,
            payable.frequency
          );
          if (shouldInclude && dueDate < periodStart) {
            outflowDetails.push({
              description: `${payable.description} (recurring)`,
              amount: payable.amount,
            });
          }
        }
      }

      // Add recurring items
      for (const item of recurringItems) {
        const startDate = item.startDate ? new Date(item.startDate) : new Date(0);
        const endDate = item.endDate ? new Date(item.endDate) : new Date(9999, 11, 31);

        if (periodStart >= startDate && periodEnd <= endDate) {
          const occurrences = getOccurrencesInPeriod(periodStart, periodEnd, item.frequency);

          for (let j = 0; j < occurrences; j++) {
            if (item.type === 'income') {
              inflowDetails.push({
                description: item.description,
                amount: item.amount,
              });
            } else {
              outflowDetails.push({
                description: item.description,
                amount: item.amount,
              });
            }
          }
        }
      }

      // Calculate totals for the period
      const periodInflows = inflowDetails.reduce((sum, item) => sum + item.amount, 0);
      const periodOutflows = outflowDetails.reduce((sum, item) => sum + item.amount, 0);
      const netChange = periodInflows - periodOutflows;
      const endingBalance = runningBalance + netChange;

      // Track lowest balance
      if (endingBalance < lowestBalance) {
        lowestBalance = endingBalance;
        lowestBalancePeriod = periodLabel;
      }

      projections.push({
        period: periodLabel,
        startingBalance: runningBalance,
        inflows: periodInflows,
        outflows: periodOutflows,
        netChange,
        endingBalance,
        inflowDetails,
        outflowDetails,
      });

      runningBalance = endingBalance;
      totalInflows += periodInflows;
      totalOutflows += periodOutflows;
    }

    // Domain rule: cash_runway - Runway in months = current cash / average monthly burn rate
    // Calculate runway
    const averageMonthlyBurn =
      totalOutflows > totalInflows ? (totalOutflows - totalInflows) / projectionMonths : 0;

    let runwayMonths: number | null = null;
    if (averageMonthlyBurn > 0) {
      runwayMonths = currentCash / averageMonthlyBurn;
    }

    return {
      projections,
      summary: {
        currentCash,
        projectedCashAtEnd: runningBalance,
        totalInflows,
        totalOutflows,
        netChange: totalInflows - totalOutflows,
        averageMonthlyBurn: Math.round(averageMonthlyBurn * 100) / 100,
        runwayMonths: runwayMonths !== null ? Math.round(runwayMonths * 10) / 10 : null,
        lowestBalance: Math.round(lowestBalance * 100) / 100,
        lowestBalancePeriod,
      },
    };
  },
});

/**
 * Format date as YYYY-MM
 */
function formatMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Check if a recurring item should be included in a period
 */
function shouldRecur(
  originalDate: Date,
  periodStart: Date,
  periodEnd: Date,
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'annually'
): boolean {
  if (originalDate >= periodStart && originalDate <= periodEnd) {
    return false; // Already included as one-time
  }

  const monthsDiff =
    (periodStart.getFullYear() - originalDate.getFullYear()) * 12 +
    (periodStart.getMonth() - originalDate.getMonth());

  switch (frequency) {
    case 'monthly':
      return monthsDiff > 0 && monthsDiff % 1 === 0;
    case 'quarterly':
      return monthsDiff > 0 && monthsDiff % 3 === 0;
    case 'annually':
      return monthsDiff > 0 && monthsDiff % 12 === 0;
    case 'weekly':
      // Simplified: assume 4 weeks per month
      return monthsDiff > 0;
    default:
      return false;
  }
}

/**
 * Get number of occurrences in a period
 */
function getOccurrencesInPeriod(
  _periodStart: Date,
  _periodEnd: Date,
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'annually'
): number {
  switch (frequency) {
    case 'weekly':
      return 4; // Approximate 4 weeks per month
    case 'monthly':
      return 1;
    case 'quarterly':
      return 0.33; // Approximately 1/3 per month
    case 'annually':
      return 0.08; // Approximately 1/12 per month
    default:
      return 1;
  }
}

export default cashFlowProjectTool;
