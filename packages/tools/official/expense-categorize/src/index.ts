/**
 * Expense Categorize Tool for TPMJS
 * Categorizes expenses into accounting categories based on description and amount
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 * Uses jsonSchema() to avoid Zod 4 JSON Schema conversion issues with OpenAI
 */

import { jsonSchema, tool } from 'ai';

/**
 * Standard accounting expense categories
 */
export type ExpenseCategory =
  | 'advertising-marketing'
  | 'bank-fees'
  | 'depreciation'
  | 'insurance'
  | 'interest'
  | 'legal-professional'
  | 'meals-entertainment'
  | 'office-supplies'
  | 'payroll'
  | 'rent-lease'
  | 'repairs-maintenance'
  | 'software-subscriptions'
  | 'taxes'
  | 'telecommunications'
  | 'travel'
  | 'utilities'
  | 'vehicle'
  | 'other';

/**
 * Expense entry to categorize
 */
export interface ExpenseEntry {
  id?: string;
  description: string;
  amount: number;
  date?: string;
  vendor?: string;
}

/**
 * Categorized expense with confidence score
 */
export interface CategorizedExpense {
  id?: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  confidence: number;
  reasoning: string;
  alternativeCategories: Array<{
    category: ExpenseCategory;
    confidence: number;
  }>;
  taxDeductible: boolean;
  notes: string[];
}

/**
 * Categorized expenses output
 */
export interface CategorizedExpenses {
  expenses: CategorizedExpense[];
  summary: {
    totalExpenses: number;
    totalAmount: number;
    byCategory: Record<ExpenseCategory, { count: number; total: number }>;
  };
  recommendations: string[];
}

/**
 * Input type for Expense Categorize Tool
 */
type ExpenseCategoriizeInput = {
  expenses: ExpenseEntry[];
};

/**
 * Category patterns - keywords that indicate specific categories
 */
const CATEGORY_PATTERNS: Record<ExpenseCategory, string[]> = {
  'advertising-marketing': [
    'ad',
    'ads',
    'advertising',
    'marketing',
    'campaign',
    'promotion',
    'google ads',
    'facebook ads',
    'social media',
    'seo',
    'ppc',
    'billboard',
  ],
  'bank-fees': [
    'bank fee',
    'service charge',
    'atm',
    'wire transfer',
    'overdraft',
    'monthly fee',
    'transaction fee',
  ],
  depreciation: ['depreciation', 'amortization'],
  insurance: ['insurance', 'premium', 'liability', 'workers comp', 'health insurance', 'coverage'],
  interest: ['interest', 'loan', 'mortgage', 'financing', 'credit card interest'],
  'legal-professional': [
    'attorney',
    'lawyer',
    'legal',
    'consultant',
    'accounting',
    'accountant',
    'cpa',
    'audit',
    'professional services',
  ],
  'meals-entertainment': [
    'restaurant',
    'meal',
    'lunch',
    'dinner',
    'coffee',
    'food',
    'catering',
    'entertainment',
    'client dinner',
  ],
  'office-supplies': [
    'office',
    'supplies',
    'stationery',
    'paper',
    'printer',
    'toner',
    'desk',
    'chair',
    'staples',
    'amazon',
  ],
  payroll: [
    'payroll',
    'salary',
    'wages',
    'paycheck',
    'employee',
    'contractor',
    'freelancer',
    'compensation',
  ],
  'rent-lease': ['rent', 'lease', 'office space', 'building', 'landlord', 'property'],
  'repairs-maintenance': [
    'repair',
    'maintenance',
    'fix',
    'service',
    'hvac',
    'plumbing',
    'electrical',
  ],
  'software-subscriptions': [
    'software',
    'saas',
    'subscription',
    'cloud',
    'hosting',
    'domain',
    'app',
    'license',
    'github',
    'aws',
    'azure',
    'google cloud',
    'microsoft 365',
    'adobe',
    'zoom',
    'slack',
  ],
  taxes: ['tax', 'sales tax', 'property tax', 'payroll tax', 'irs', 'state tax'],
  telecommunications: [
    'phone',
    'mobile',
    'internet',
    'telecom',
    'verizon',
    'at&t',
    'comcast',
    'broadband',
  ],
  travel: [
    'travel',
    'flight',
    'hotel',
    'airbnb',
    'airline',
    'uber',
    'lyft',
    'taxi',
    'rental car',
    'mileage',
    'trip',
  ],
  utilities: ['electric', 'electricity', 'gas', 'water', 'sewer', 'utility', 'power', 'energy'],
  vehicle: ['vehicle', 'car', 'truck', 'auto', 'fuel', 'gas', 'parking', 'tolls', 'car wash'],
  other: [],
};

/**
 * Tax deductibility rules (simplified - consult tax professional)
 */
const TAX_DEDUCTIBLE_CATEGORIES: ExpenseCategory[] = [
  'advertising-marketing',
  'bank-fees',
  'depreciation',
  'insurance',
  'interest',
  'legal-professional',
  'office-supplies',
  'rent-lease',
  'repairs-maintenance',
  'software-subscriptions',
  'taxes',
  'telecommunications',
  'travel',
  'utilities',
  'vehicle',
];

/**
 * Categorize a single expense based on description and amount
 */
// Domain rule: keyword_scoring - Expenses are categorized by matching description keywords to category patterns
function categorizeExpense(expense: ExpenseEntry): {
  category: ExpenseCategory;
  confidence: number;
  alternatives: Array<{ category: ExpenseCategory; confidence: number }>;
  reasoning: string;
} {
  const description = expense.description.toLowerCase();
  const vendor = expense.vendor?.toLowerCase() || '';
  const searchText = `${description} ${vendor}`;

  const categoryScores: Record<ExpenseCategory, number> = {
    'advertising-marketing': 0,
    'bank-fees': 0,
    depreciation: 0,
    insurance: 0,
    interest: 0,
    'legal-professional': 0,
    'meals-entertainment': 0,
    'office-supplies': 0,
    payroll: 0,
    'rent-lease': 0,
    'repairs-maintenance': 0,
    'software-subscriptions': 0,
    taxes: 0,
    telecommunications: 0,
    travel: 0,
    utilities: 0,
    vehicle: 0,
    other: 0,
  };

  // Score each category based on keyword matches
  for (const [category, keywords] of Object.entries(CATEGORY_PATTERNS)) {
    let score = 0;
    const matchedKeywords: string[] = [];

    for (const keyword of keywords) {
      if (searchText.includes(keyword)) {
        score += 1;
        matchedKeywords.push(keyword);
      }
    }

    if (score > 0) {
      // Domain rule: exact_match_boost - Exact keyword matches receive 2x scoring weight
      // Boost score for exact matches
      if (matchedKeywords.some((k) => searchText === k)) {
        score *= 2;
      }
      categoryScores[category as ExpenseCategory] = score;
    }
  }

  // Domain rule: amount_heuristics - Large amounts (≥$10k) unlikely to be office supplies, small fees (<$50) likely bank fees
  // Amount-based heuristics
  if (expense.amount >= 10000 && categoryScores['office-supplies'] > 0) {
    categoryScores['office-supplies'] *= 0.5; // Large amounts unlikely to be supplies
  }

  if (expense.amount < 50 && description.includes('fee')) {
    categoryScores['bank-fees'] += 1;
  }

  // Find top categories
  const sortedCategories = (Object.entries(categoryScores) as [ExpenseCategory, number][]).sort(
    (a, b) => b[1] - a[1]
  );

  const topCategory = sortedCategories[0]?.[0] ?? 'other';
  const topScore = sortedCategories[0]?.[1] ?? 0;

  // Calculate confidence (0-1 scale)
  let confidence = 0;
  if (topScore === 0) {
    confidence = 0.3; // Low confidence for no matches
  } else if (topScore >= 3) {
    confidence = 0.95;
  } else if (topScore === 2) {
    confidence = 0.8;
  } else {
    confidence = 0.6;
  }

  // Get alternative categories
  const alternatives = sortedCategories
    .slice(1, 4)
    .filter(([_, score]) => score > 0)
    .map(([cat, score]) => ({
      category: cat,
      confidence: Math.min(0.8, (score / (topScore || 1)) * confidence),
    }));

  // Generate reasoning
  let reasoning = '';
  if (topScore === 0) {
    reasoning = 'No strong keyword matches found. Categorized as "other" by default.';
  } else {
    const matchedKeywords = CATEGORY_PATTERNS[topCategory].filter((k) => searchText.includes(k));
    reasoning = `Matched keywords: ${matchedKeywords.join(', ')}`;
  }

  return {
    category: topScore > 0 ? topCategory : 'other',
    confidence,
    alternatives,
    reasoning,
  };
}

/**
 * Generate notes and warnings for an expense
 */
function generateNotes(
  expense: ExpenseEntry,
  category: ExpenseCategory,
  confidence: number
): string[] {
  const notes: string[] = [];

  if (confidence < 0.5) {
    notes.push('Low confidence - manual review recommended');
  }

  if (category === 'meals-entertainment') {
    notes.push('Typically 50% deductible for business meals');
  }

  if (category === 'travel') {
    notes.push('Ensure trip is business-related for tax deduction');
  }

  if (category === 'vehicle') {
    notes.push('Track business vs personal use; may need to separate or use standard mileage rate');
  }

  if (expense.amount >= 2500 && category === 'office-supplies') {
    notes.push('Large asset purchase may require depreciation instead of immediate expense');
  }

  if (category === 'other') {
    notes.push('Could not automatically categorize - manual review required');
  }

  return notes;
}

/**
 * Generate recommendations for expense management
 */
function generateRecommendations(expenses: CategorizedExpense[]): string[] {
  const recommendations: string[] = [];

  const lowConfidence = expenses.filter((e) => e.confidence < 0.6).length;
  if (lowConfidence > 0) {
    recommendations.push(
      `${lowConfidence} expense(s) have low categorization confidence - review these manually`
    );
  }

  const uncategorized = expenses.filter((e) => e.category === 'other').length;
  if (uncategorized > 0) {
    recommendations.push(
      `${uncategorized} expense(s) could not be automatically categorized - add more details to descriptions`
    );
  }

  const hasTravel = expenses.some((e) => e.category === 'travel');
  if (hasTravel) {
    recommendations.push('Keep detailed records of business travel including purpose and receipts');
  }

  const hasMeals = expenses.some((e) => e.category === 'meals-entertainment');
  if (hasMeals) {
    recommendations.push('Document business purpose for meals and entertainment expenses');
  }

  recommendations.push(
    'Consider using expense tracking software for better categorization',
    'Review categorizations with your accountant before tax filing',
    'Keep all receipts for expenses over $75 (or as required by your jurisdiction)'
  );

  return recommendations;
}

/**
 * Expense Categorize Tool
 * Categorizes expenses into accounting categories based on description and amount
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 */
export const expenseCategoriizeTool = tool({
  description:
    'Categorizes business expenses into standard accounting categories (advertising, payroll, office supplies, travel, etc.) based on description, amount, and vendor. Provides confidence scores, alternative categories, tax deductibility flags, and recommendations for proper expense tracking.',
  inputSchema: jsonSchema<ExpenseCategoriizeInput>({
    type: 'object',
    properties: {
      expenses: {
        type: 'array',
        description: 'Expense entries to categorize',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Optional expense identifier',
            },
            description: {
              type: 'string',
              description: 'Expense description',
            },
            amount: {
              type: 'number',
              description: 'Expense amount in dollars',
            },
            date: {
              type: 'string',
              description: 'Optional expense date',
            },
            vendor: {
              type: 'string',
              description: 'Optional vendor/merchant name',
            },
          },
          required: ['description', 'amount'],
        },
      },
    },
    required: ['expenses'],
    additionalProperties: false,
  }),
  async execute({ expenses }) {
    // Validate input
    if (!expenses || expenses.length === 0) {
      throw new Error('At least one expense entry is required');
    }

    const categorizedExpenses: CategorizedExpense[] = [];
    const categorySummary: Record<ExpenseCategory, { count: number; total: number }> = {
      'advertising-marketing': { count: 0, total: 0 },
      'bank-fees': { count: 0, total: 0 },
      depreciation: { count: 0, total: 0 },
      insurance: { count: 0, total: 0 },
      interest: { count: 0, total: 0 },
      'legal-professional': { count: 0, total: 0 },
      'meals-entertainment': { count: 0, total: 0 },
      'office-supplies': { count: 0, total: 0 },
      payroll: { count: 0, total: 0 },
      'rent-lease': { count: 0, total: 0 },
      'repairs-maintenance': { count: 0, total: 0 },
      'software-subscriptions': { count: 0, total: 0 },
      taxes: { count: 0, total: 0 },
      telecommunications: { count: 0, total: 0 },
      travel: { count: 0, total: 0 },
      utilities: { count: 0, total: 0 },
      vehicle: { count: 0, total: 0 },
      other: { count: 0, total: 0 },
    };

    // Process each expense
    for (const expense of expenses) {
      if (!expense.description || typeof expense.amount !== 'number') {
        throw new Error('Each expense must have a description and numeric amount');
      }

      const { category, confidence, alternatives, reasoning } = categorizeExpense(expense);

      const taxDeductible = TAX_DEDUCTIBLE_CATEGORIES.includes(category);
      const notes = generateNotes(expense, category, confidence);

      categorizedExpenses.push({
        id: expense.id,
        description: expense.description,
        amount: expense.amount,
        category,
        confidence,
        reasoning,
        alternativeCategories: alternatives,
        taxDeductible,
        notes,
      });

      // Update summary
      categorySummary[category].count++;
      categorySummary[category].total += expense.amount;
    }

    // Calculate totals
    const totalExpenses = categorizedExpenses.length;
    const totalAmount = categorizedExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Generate recommendations
    const recommendations = generateRecommendations(categorizedExpenses);

    return {
      expenses: categorizedExpenses,
      summary: {
        totalExpenses,
        totalAmount,
        byCategory: categorySummary,
      },
      recommendations,
    };
  },
});

/**
 * Export default for convenience
 */
export default expenseCategoriizeTool;
