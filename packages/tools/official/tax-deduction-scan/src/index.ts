/**
 * Tax Deduction Scan Tool for TPMJS
 * Scans expense data for potential tax deductions by category
 */

import { jsonSchema, tool } from 'ai';

/**
 * Expense record
 */
interface Expense {
  description: string;
  amount: number;
  category: string;
  date?: string;
  vendor?: string;
}

/**
 * Entity type for tax treatment
 */
type EntityType = 'sole-proprietor' | 'partnership' | 'llc' | 's-corp' | 'c-corp' | 'individual';

/**
 * Deduction category with rules
 */
interface DeductionCategory {
  category: string;
  totalAmount: number;
  deductibleAmount: number;
  deductionRate: number;
  items: Array<{
    description: string;
    amount: number;
    deductible: number;
  }>;
  notes: string[];
  documentationRequired: string[];
}

/**
 * Input interface for tax deduction scan
 */
interface TaxDeductionScanInput {
  expenses: Expense[];
  entityType: EntityType;
  taxYear?: number;
}

/**
 * Output interface for tax deduction scan
 */
export interface TaxDeductionScanResult {
  deductions: DeductionCategory[];
  summary: {
    totalExpenses: number;
    totalDeductible: number;
    totalNonDeductible: number;
    deductionRate: number;
    topDeductionCategory: string;
    topDeductionAmount: number;
    flaggedForReview: string[];
  };
}

/**
 * Deduction rules by category and entity type
 */
const DEDUCTION_RULES: Record<
  string,
  {
    rate: number;
    notes: string[];
    documentation: string[];
    entitySpecific?: Partial<Record<EntityType, { rate: number; notes?: string[] }>>;
  }
> = {
  'office-supplies': {
    rate: 1.0,
    notes: ['Fully deductible if used exclusively for business'],
    documentation: ['Receipts', 'Purchase records'],
  },
  'home-office': {
    rate: 1.0,
    notes: ['Must be used exclusively and regularly for business'],
    documentation: ['Square footage calculation', 'Utility bills', 'Mortgage/rent statements'],
    entitySpecific: {
      individual: {
        rate: 1.0,
        notes: [
          'Simplified option: $5 per square foot up to 300 sq ft',
          'Regular method: Percentage of home expenses',
        ],
      },
    },
  },
  travel: {
    rate: 1.0,
    notes: ['Must be ordinary and necessary for business'],
    documentation: ['Travel receipts', 'Business purpose documentation', 'Itinerary'],
  },
  meals: {
    rate: 0.5,
    notes: ['Generally 50% deductible', '100% deductible for company events (all employees)'],
    documentation: ['Receipts', 'Business purpose', 'Attendees list'],
  },
  entertainment: {
    rate: 0.0,
    notes: ['Entertainment expenses are generally NOT deductible (post-TCJA)'],
    documentation: ['N/A - Not deductible'],
  },
  vehicle: {
    rate: 1.0,
    notes: [
      'Standard mileage rate or actual expenses',
      '2024 rate: $0.67/mile (business use)',
      'Keep detailed mileage log',
    ],
    documentation: ['Mileage log', 'Vehicle registration', 'Fuel receipts if using actual method'],
  },
  'professional-development': {
    rate: 1.0,
    notes: ['Training, courses, and conferences related to current business'],
    documentation: ['Course receipts', 'Conference registration', 'Business relevance'],
  },
  software: {
    rate: 1.0,
    notes: ['Business software subscriptions fully deductible'],
    documentation: ['Subscription receipts', 'Software licenses'],
  },
  advertising: {
    rate: 1.0,
    notes: ['Marketing and advertising expenses fully deductible'],
    documentation: ['Ad receipts', 'Marketing invoices', 'Campaign records'],
  },
  'professional-fees': {
    rate: 1.0,
    notes: ['Legal, accounting, consulting fees for business'],
    documentation: ['Professional service invoices', 'Engagement letters'],
  },
  insurance: {
    rate: 1.0,
    notes: ['Business insurance premiums deductible'],
    documentation: ['Insurance policies', 'Premium statements'],
    entitySpecific: {
      'sole-proprietor': {
        rate: 1.0,
        notes: ['Health insurance may be deductible as self-employed health insurance'],
      },
    },
  },
  utilities: {
    rate: 1.0,
    notes: ['Business portion of utilities deductible'],
    documentation: ['Utility bills', 'Business use percentage calculation'],
  },
  rent: {
    rate: 1.0,
    notes: ['Business space rent fully deductible'],
    documentation: ['Lease agreement', 'Rent receipts'],
  },
  'phone-internet': {
    rate: 1.0,
    notes: ['Business portion deductible', 'Personal use must be excluded'],
    documentation: ['Phone/internet bills', 'Business use percentage'],
  },
  depreciation: {
    rate: 1.0,
    notes: ['Equipment and property depreciation', 'Section 179 may allow immediate expensing'],
    documentation: ['Asset purchase records', 'Depreciation schedule'],
  },
  'charitable-contributions': {
    rate: 0.0,
    notes: ['Personal charitable contributions - itemized deduction, not business expense'],
    documentation: ['Donation receipts'],
    entitySpecific: {
      'c-corp': {
        rate: 1.0,
        notes: ['C-corps can deduct charitable contributions as business expense'],
      },
    },
  },
  other: {
    rate: 0.5,
    notes: ['Review with tax professional', 'May be partially deductible'],
    documentation: ['Receipts', 'Business purpose documentation'],
  },
};

/**
 * Tax Deduction Scan Tool
 * Scans expenses and identifies potential tax deductions
 */
export const taxDeductionScanTool = tool({
  description:
    'Scans expense data for potential tax deductions by category. Applies category-specific deduction rules and identifies documentation requirements.',
  inputSchema: jsonSchema<TaxDeductionScanInput>({
    type: 'object',
    properties: {
      expenses: {
        type: 'array',
        description: 'Expense records to scan',
        items: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: 'Expense description',
            },
            amount: {
              type: 'number',
              description: 'Expense amount',
            },
            category: {
              type: 'string',
              description:
                'Expense category (e.g., office-supplies, travel, meals, vehicle, software)',
            },
            date: {
              type: 'string',
              description: 'Expense date (ISO format)',
            },
            vendor: {
              type: 'string',
              description: 'Vendor name',
            },
          },
          required: ['description', 'amount', 'category'],
        },
      },
      entityType: {
        type: 'string',
        enum: ['sole-proprietor', 'partnership', 'llc', 's-corp', 'c-corp', 'individual'],
        description: 'Business entity type for tax treatment',
      },
      taxYear: {
        type: 'number',
        description: 'Tax year (default: current year)',
      },
    },
    required: ['expenses', 'entityType'],
    additionalProperties: false,
  }),
  execute: async ({ expenses, entityType }): Promise<TaxDeductionScanResult> => {
    // Validate inputs
    if (!Array.isArray(expenses) || expenses.length === 0) {
      throw new Error('Expenses must be a non-empty array');
    }

    const validEntityTypes: EntityType[] = [
      'sole-proprietor',
      'partnership',
      'llc',
      's-corp',
      'c-corp',
      'individual',
    ];
    if (!validEntityTypes.includes(entityType)) {
      throw new Error(
        `Invalid entity type: ${entityType}. Must be one of: ${validEntityTypes.join(', ')}`
      );
    }

    // Tax year is validated but not currently used in deduction calculations
    // Future enhancement: could apply year-specific deduction rules

    // Group expenses by category
    const categoryMap = new Map<string, Expense[]>();
    let totalExpenses = 0;

    for (const expense of expenses) {
      if (!expense.category || typeof expense.amount !== 'number' || expense.amount < 0) {
        throw new Error('Each expense must have a category and non-negative amount');
      }

      const normalizedCategory = expense.category.toLowerCase().trim();
      if (!categoryMap.has(normalizedCategory)) {
        categoryMap.set(normalizedCategory, []);
      }
      categoryMap.get(normalizedCategory)!.push(expense);
      totalExpenses += expense.amount;
    }

    // Build deduction categories
    const deductions: DeductionCategory[] = [];
    let totalDeductible = 0;
    const flaggedForReview: string[] = [];

    for (const [category, categoryExpenses] of categoryMap.entries()) {
      const rules = DEDUCTION_RULES[category] || DEDUCTION_RULES['other']!;

      // Check for entity-specific rules
      let deductionRate = rules.rate;
      let notes = [...rules.notes];

      if (rules.entitySpecific?.[entityType]) {
        const entityRules = rules.entitySpecific[entityType]!;
        deductionRate = entityRules.rate;
        if (entityRules.notes) {
          notes = [...entityRules.notes, ...notes];
        }
      }

      const categoryTotal = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const deductibleAmount = categoryTotal * deductionRate;

      const items = categoryExpenses.map((exp) => ({
        description: exp.description,
        amount: exp.amount,
        deductible: Math.round(exp.amount * deductionRate * 100) / 100,
      }));

      // Flag categories that need review
      if (deductionRate === 0 && categoryTotal > 0) {
        flaggedForReview.push(
          `${category}: $${categoryTotal.toFixed(2)} - Not deductible, review classification`
        );
      }

      if (category === 'meals' && categoryTotal > 10000) {
        flaggedForReview.push(
          `${category}: High meal expenses - Ensure proper business documentation`
        );
      }

      if (category === 'other' && categoryTotal > 5000) {
        flaggedForReview.push(
          `${category}: Significant uncategorized expenses - Review with tax professional`
        );
      }

      deductions.push({
        category,
        totalAmount: Math.round(categoryTotal * 100) / 100,
        deductibleAmount: Math.round(deductibleAmount * 100) / 100,
        deductionRate,
        items,
        notes,
        documentationRequired: rules.documentation,
      });

      totalDeductible += deductibleAmount;
    }

    // Sort by deductible amount (descending)
    deductions.sort((a, b) => b.deductibleAmount - a.deductibleAmount);

    const topDeduction = deductions[0];
    const totalNonDeductible = totalExpenses - totalDeductible;
    const overallDeductionRate = totalExpenses > 0 ? (totalDeductible / totalExpenses) * 100 : 0;

    return {
      deductions,
      summary: {
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        totalDeductible: Math.round(totalDeductible * 100) / 100,
        totalNonDeductible: Math.round(totalNonDeductible * 100) / 100,
        deductionRate: Math.round(overallDeductionRate * 100) / 100,
        topDeductionCategory: topDeduction?.category || 'N/A',
        topDeductionAmount: topDeduction?.deductibleAmount || 0,
        flaggedForReview,
      },
    };
  },
});

export default taxDeductionScanTool;
