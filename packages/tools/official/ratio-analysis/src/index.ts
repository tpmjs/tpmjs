/**
 * Ratio Analysis Tool for TPMJS
 * Calculates key financial ratios from balance sheet and income statement data
 */

import { jsonSchema, tool } from 'ai';

/**
 * Financial statement data
 */
interface FinancialData {
  // Balance Sheet
  currentAssets?: number;
  totalAssets?: number;
  currentLiabilities?: number;
  totalLiabilities?: number;
  totalEquity?: number;
  cash?: number;
  inventory?: number;
  accountsReceivable?: number;
  accountsPayable?: number;
  longTermDebt?: number;

  // Income Statement
  revenue?: number;
  grossProfit?: number;
  operatingIncome?: number;
  netIncome?: number;
  interestExpense?: number;
  costOfGoodsSold?: number;
}

/**
 * Liquidity ratios
 */
interface LiquidityRatios {
  currentRatio?: {
    value: number;
    interpretation: string;
  };
  quickRatio?: {
    value: number;
    interpretation: string;
  };
  cashRatio?: {
    value: number;
    interpretation: string;
  };
}

/**
 * Profitability ratios
 */
interface ProfitabilityRatios {
  grossProfitMargin?: {
    value: number;
    interpretation: string;
  };
  operatingMargin?: {
    value: number;
    interpretation: string;
  };
  netProfitMargin?: {
    value: number;
    interpretation: string;
  };
  returnOnAssets?: {
    value: number;
    interpretation: string;
  };
  returnOnEquity?: {
    value: number;
    interpretation: string;
  };
}

/**
 * Leverage ratios
 */
interface LeverageRatios {
  debtToEquity?: {
    value: number;
    interpretation: string;
  };
  debtToAssets?: {
    value: number;
    interpretation: string;
  };
  equityMultiplier?: {
    value: number;
    interpretation: string;
  };
  interestCoverage?: {
    value: number;
    interpretation: string;
  };
}

/**
 * Efficiency ratios
 */
interface EfficiencyRatios {
  assetTurnover?: {
    value: number;
    interpretation: string;
  };
  inventoryTurnover?: {
    value: number;
    interpretation: string;
  };
  receivablesTurnover?: {
    value: number;
    interpretation: string;
  };
}

/**
 * Input interface for ratio analysis
 */
interface RatioAnalysisInput {
  financials: FinancialData;
}

/**
 * Output interface for financial ratios
 */
export interface FinancialRatios {
  liquidity: LiquidityRatios;
  profitability: ProfitabilityRatios;
  leverage: LeverageRatios;
  efficiency: EfficiencyRatios;
  summary: {
    totalRatiosCalculated: number;
    overallHealth: 'strong' | 'moderate' | 'weak' | 'insufficient-data';
    keyStrengths: string[];
    keyWeaknesses: string[];
  };
}

/**
 * Ratio Analysis Tool
 * Calculates financial ratios and provides interpretation
 */
export const ratioAnalysisTool = tool({
  description:
    'Calculates key financial ratios from balance sheet and income statement data. Includes liquidity, profitability, leverage, and efficiency ratios with interpretations.',
  inputSchema: jsonSchema<RatioAnalysisInput>({
    type: 'object',
    properties: {
      financials: {
        type: 'object',
        description: 'Financial statement data',
        properties: {
          currentAssets: { type: 'number', description: 'Current assets' },
          totalAssets: { type: 'number', description: 'Total assets' },
          currentLiabilities: { type: 'number', description: 'Current liabilities' },
          totalLiabilities: { type: 'number', description: 'Total liabilities' },
          totalEquity: { type: 'number', description: 'Total equity' },
          cash: { type: 'number', description: 'Cash and cash equivalents' },
          inventory: { type: 'number', description: 'Inventory' },
          accountsReceivable: { type: 'number', description: 'Accounts receivable' },
          accountsPayable: { type: 'number', description: 'Accounts payable' },
          longTermDebt: { type: 'number', description: 'Long-term debt' },
          revenue: { type: 'number', description: 'Total revenue' },
          grossProfit: { type: 'number', description: 'Gross profit' },
          operatingIncome: { type: 'number', description: 'Operating income (EBIT)' },
          netIncome: { type: 'number', description: 'Net income' },
          interestExpense: { type: 'number', description: 'Interest expense' },
          costOfGoodsSold: { type: 'number', description: 'Cost of goods sold' },
        },
      },
    },
    required: ['financials'],
    additionalProperties: false,
  }),
  execute: async ({ financials }): Promise<FinancialRatios> => {
    // Validate input
    if (!financials || typeof financials !== 'object') {
      throw new Error('Financials must be a valid object');
    }

    const liquidity: LiquidityRatios = {};
    const profitability: ProfitabilityRatios = {};
    const leverage: LeverageRatios = {};
    const efficiency: EfficiencyRatios = {};
    const keyStrengths: string[] = [];
    const keyWeaknesses: string[] = [];
    let totalRatiosCalculated = 0;

    // === LIQUIDITY RATIOS ===

    // Current Ratio
    if (financials.currentAssets && financials.currentLiabilities) {
      const value =
        Math.round((financials.currentAssets / financials.currentLiabilities) * 100) / 100;
      liquidity.currentRatio = {
        value,
        interpretation:
          value >= 2
            ? 'Strong - Company can easily meet short-term obligations'
            : value >= 1
              ? 'Adequate - Company can meet short-term obligations'
              : 'Weak - Company may struggle with short-term obligations',
      };
      if (value >= 2) keyStrengths.push('Strong liquidity position');
      if (value < 1) keyWeaknesses.push('Insufficient liquidity');
      totalRatiosCalculated++;
    }

    // Quick Ratio (Acid Test)
    if (
      financials.currentAssets &&
      financials.inventory !== undefined &&
      financials.currentLiabilities
    ) {
      const quickAssets = financials.currentAssets - financials.inventory;
      const value = Math.round((quickAssets / financials.currentLiabilities) * 100) / 100;
      liquidity.quickRatio = {
        value,
        interpretation:
          value >= 1
            ? 'Strong - Can meet obligations without selling inventory'
            : value >= 0.5
              ? 'Moderate - Some reliance on inventory sales'
              : 'Weak - Heavy reliance on inventory to meet obligations',
      };
      totalRatiosCalculated++;
    }

    // Cash Ratio
    if (financials.cash && financials.currentLiabilities) {
      const value = Math.round((financials.cash / financials.currentLiabilities) * 100) / 100;
      liquidity.cashRatio = {
        value,
        interpretation:
          value >= 0.5
            ? 'Strong - Substantial cash reserves'
            : value >= 0.2
              ? 'Adequate - Reasonable cash position'
              : 'Low - Limited cash reserves',
      };
      totalRatiosCalculated++;
    }

    // === PROFITABILITY RATIOS ===

    // Gross Profit Margin
    if (financials.grossProfit && financials.revenue) {
      const value = Math.round((financials.grossProfit / financials.revenue) * 10000) / 100;
      profitability.grossProfitMargin = {
        value,
        interpretation:
          value >= 40
            ? 'Excellent - Strong pricing power and cost control'
            : value >= 20
              ? 'Good - Healthy profit margins'
              : 'Low - Tight margins or pricing pressure',
      };
      if (value >= 40) keyStrengths.push('Excellent gross margins');
      if (value < 20) keyWeaknesses.push('Low gross profit margins');
      totalRatiosCalculated++;
    }

    // Operating Margin
    if (financials.operatingIncome && financials.revenue) {
      const value = Math.round((financials.operatingIncome / financials.revenue) * 10000) / 100;
      profitability.operatingMargin = {
        value,
        interpretation:
          value >= 20
            ? 'Excellent - Very efficient operations'
            : value >= 10
              ? 'Good - Solid operational efficiency'
              : value >= 0
                ? 'Moderate - Room for operational improvement'
                : 'Negative - Operating losses',
      };
      if (value >= 20) keyStrengths.push('High operational efficiency');
      if (value < 0) keyWeaknesses.push('Operating losses');
      totalRatiosCalculated++;
    }

    // Net Profit Margin
    if (financials.netIncome && financials.revenue) {
      const value = Math.round((financials.netIncome / financials.revenue) * 10000) / 100;
      profitability.netProfitMargin = {
        value,
        interpretation:
          value >= 15
            ? 'Excellent - Strong bottom-line profitability'
            : value >= 5
              ? 'Good - Healthy net profitability'
              : value >= 0
                ? 'Moderate - Thin profit margins'
                : 'Negative - Net losses',
      };
      if (value >= 15) keyStrengths.push('Strong net profitability');
      if (value < 0) keyWeaknesses.push('Net losses');
      totalRatiosCalculated++;
    }

    // Return on Assets (ROA)
    if (financials.netIncome && financials.totalAssets) {
      const value = Math.round((financials.netIncome / financials.totalAssets) * 10000) / 100;
      profitability.returnOnAssets = {
        value,
        interpretation:
          value >= 10
            ? 'Excellent - Efficient use of assets'
            : value >= 5
              ? 'Good - Adequate asset utilization'
              : value >= 0
                ? 'Moderate - Low asset efficiency'
                : 'Negative - Assets not generating profit',
      };
      totalRatiosCalculated++;
    }

    // Return on Equity (ROE)
    if (financials.netIncome && financials.totalEquity) {
      const value = Math.round((financials.netIncome / financials.totalEquity) * 10000) / 100;
      profitability.returnOnEquity = {
        value,
        interpretation:
          value >= 20
            ? 'Excellent - Strong returns for shareholders'
            : value >= 10
              ? 'Good - Solid shareholder returns'
              : value >= 0
                ? 'Moderate - Low shareholder returns'
                : 'Negative - Destroying shareholder value',
      };
      if (value >= 20) keyStrengths.push('Excellent shareholder returns');
      if (value < 0) keyWeaknesses.push('Negative shareholder returns');
      totalRatiosCalculated++;
    }

    // === LEVERAGE RATIOS ===

    // Debt to Equity
    if (financials.totalLiabilities && financials.totalEquity) {
      const value = Math.round((financials.totalLiabilities / financials.totalEquity) * 100) / 100;
      leverage.debtToEquity = {
        value,
        interpretation:
          value <= 1
            ? 'Low - Conservative capital structure'
            : value <= 2
              ? 'Moderate - Balanced leverage'
              : 'High - Aggressive leverage, higher financial risk',
      };
      if (value <= 1) keyStrengths.push('Conservative leverage');
      if (value > 2) keyWeaknesses.push('High financial leverage');
      totalRatiosCalculated++;
    }

    // Debt to Assets
    if (financials.totalLiabilities && financials.totalAssets) {
      const value =
        Math.round((financials.totalLiabilities / financials.totalAssets) * 10000) / 100;
      leverage.debtToAssets = {
        value,
        interpretation:
          value <= 40
            ? 'Low - Most assets financed by equity'
            : value <= 60
              ? 'Moderate - Balanced financing mix'
              : 'High - Heavy reliance on debt financing',
      };
      totalRatiosCalculated++;
    }

    // Equity Multiplier
    if (financials.totalAssets && financials.totalEquity) {
      const value = Math.round((financials.totalAssets / financials.totalEquity) * 100) / 100;
      leverage.equityMultiplier = {
        value,
        interpretation:
          value <= 2
            ? 'Low - Conservative leverage'
            : value <= 3
              ? 'Moderate - Average leverage'
              : 'High - Aggressive use of leverage',
      };
      totalRatiosCalculated++;
    }

    // Interest Coverage
    if (financials.operatingIncome && financials.interestExpense) {
      const value =
        Math.round((financials.operatingIncome / financials.interestExpense) * 100) / 100;
      leverage.interestCoverage = {
        value,
        interpretation:
          value >= 5
            ? 'Strong - Easily covers interest obligations'
            : value >= 2.5
              ? 'Adequate - Can comfortably cover interest'
              : value >= 1
                ? 'Weak - Barely covers interest payments'
                : 'Critical - Cannot cover interest from operations',
      };
      if (value < 1.5) keyWeaknesses.push('Low interest coverage');
      totalRatiosCalculated++;
    }

    // === EFFICIENCY RATIOS ===

    // Asset Turnover
    if (financials.revenue && financials.totalAssets) {
      const value = Math.round((financials.revenue / financials.totalAssets) * 100) / 100;
      efficiency.assetTurnover = {
        value,
        interpretation:
          value >= 2
            ? 'High - Efficient use of assets to generate revenue'
            : value >= 1
              ? 'Moderate - Average asset utilization'
              : 'Low - Assets underutilized',
      };
      totalRatiosCalculated++;
    }

    // Inventory Turnover
    if (financials.costOfGoodsSold && financials.inventory) {
      const value = Math.round((financials.costOfGoodsSold / financials.inventory) * 100) / 100;
      efficiency.inventoryTurnover = {
        value,
        interpretation:
          value >= 8
            ? 'High - Fast-moving inventory, efficient management'
            : value >= 4
              ? 'Moderate - Reasonable inventory turnover'
              : 'Low - Slow-moving inventory, may indicate obsolescence',
      };
      totalRatiosCalculated++;
    }

    // Receivables Turnover
    if (financials.revenue && financials.accountsReceivable) {
      const value = Math.round((financials.revenue / financials.accountsReceivable) * 100) / 100;
      efficiency.receivablesTurnover = {
        value,
        interpretation:
          value >= 10
            ? 'High - Efficient collections'
            : value >= 6
              ? 'Moderate - Average collection efficiency'
              : 'Low - Slow collections, may indicate credit issues',
      };
      totalRatiosCalculated++;
    }

    // Determine overall health
    let overallHealth: 'strong' | 'moderate' | 'weak' | 'insufficient-data' = 'insufficient-data';
    if (totalRatiosCalculated >= 5) {
      const strengthScore = keyStrengths.length;
      const weaknessScore = keyWeaknesses.length;

      if (strengthScore > weaknessScore && strengthScore >= 2) {
        overallHealth = 'strong';
      } else if (weaknessScore > strengthScore && weaknessScore >= 2) {
        overallHealth = 'weak';
      } else {
        overallHealth = 'moderate';
      }
    }

    return {
      liquidity,
      profitability,
      leverage,
      efficiency,
      summary: {
        totalRatiosCalculated,
        overallHealth,
        keyStrengths,
        keyWeaknesses,
      },
    };
  },
});

export default ratioAnalysisTool;
