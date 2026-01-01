/**
 * Revenue Breakdown Tool for TPMJS
 * Breaks down revenue by segment, product, or period with growth rates
 */

import { jsonSchema, tool } from 'ai';

/**
 * Revenue data item
 */
interface RevenueItem {
  product?: string;
  segment?: string;
  region?: string;
  period?: string;
  amount: number;
}

/**
 * Breakdown dimension type
 */
type Dimension = 'product' | 'segment' | 'region' | 'period';

/**
 * Revenue breakdown item with growth metrics
 */
interface BreakdownItem {
  name: string;
  revenue: number;
  percentage: number;
  growth?: number;
  growthPercentage?: number;
  periods?: Array<{
    period: string;
    revenue: number;
  }>;
}

/**
 * Input interface for revenue breakdown
 */
interface RevenueBreakdownInput {
  revenue: RevenueItem[];
  dimension: Dimension;
}

/**
 * Output interface for revenue breakdown
 */
export interface RevenueBreakdownResult {
  breakdown: BreakdownItem[];
  summary: {
    totalRevenue: number;
    numberOfCategories: number;
    topCategory: string;
    topCategoryRevenue: number;
    topCategoryPercentage: number;
    averageGrowth?: number;
  };
}

/**
 * Revenue Breakdown Tool
 * Analyzes revenue by specified dimension and calculates growth rates
 */
export const revenueBreakdownTool = tool({
  description:
    'Breaks down revenue by segment, product, region, or period. Calculates period-over-period growth rates and identifies top performers.',
  inputSchema: jsonSchema<RevenueBreakdownInput>({
    type: 'object',
    properties: {
      revenue: {
        type: 'array',
        description: 'Revenue data with segments and periods',
        items: {
          type: 'object',
          properties: {
            product: {
              type: 'string',
              description: 'Product name',
            },
            segment: {
              type: 'string',
              description: 'Business segment',
            },
            region: {
              type: 'string',
              description: 'Geographic region',
            },
            period: {
              type: 'string',
              description: 'Time period (e.g., "2024-Q1", "2024-01")',
            },
            amount: {
              type: 'number',
              description: 'Revenue amount',
            },
          },
          required: ['amount'],
        },
      },
      dimension: {
        type: 'string',
        enum: ['product', 'segment', 'region', 'period'],
        description: 'Breakdown dimension',
      },
    },
    required: ['revenue', 'dimension'],
    additionalProperties: false,
  }),
  execute: async ({ revenue, dimension }): Promise<RevenueBreakdownResult> => {
    // Validate inputs
    if (!Array.isArray(revenue) || revenue.length === 0) {
      throw new Error('Revenue must be a non-empty array');
    }

    const validDimensions: Dimension[] = ['product', 'segment', 'region', 'period'];
    if (!validDimensions.includes(dimension)) {
      throw new Error(
        `Invalid dimension: ${dimension}. Must be one of: ${validDimensions.join(', ')}`
      );
    }

    // Aggregate revenue by dimension
    const revenueMap = new Map<string, number[]>();
    const periodMap = new Map<string, Map<string, number>>();
    let totalRevenue = 0;

    for (const item of revenue) {
      if (typeof item.amount !== 'number' || item.amount < 0) {
        throw new Error('Each revenue item must have a non-negative amount');
      }

      const key = getKeyForDimension(item, dimension);
      if (!key) {
        throw new Error(
          `Revenue item missing required field for dimension "${dimension}": ${JSON.stringify(item)}`
        );
      }

      // Aggregate total revenue by key
      const current = revenueMap.get(key) || [];
      current.push(item.amount);
      revenueMap.set(key, current);

      // Track period-based data for growth calculation
      if (item.period) {
        if (!periodMap.has(key)) {
          periodMap.set(key, new Map());
        }
        const periods = periodMap.get(key)!;
        const periodRevenue = periods.get(item.period) || 0;
        periods.set(item.period, periodRevenue + item.amount);
      }

      totalRevenue += item.amount;
    }

    if (totalRevenue === 0) {
      throw new Error('Total revenue cannot be zero');
    }

    // Build breakdown items
    const breakdown: BreakdownItem[] = [];

    for (const [name, amounts] of revenueMap.entries()) {
      const itemRevenue = amounts.reduce((sum, amount) => sum + amount, 0);
      const percentage = (itemRevenue / totalRevenue) * 100;

      const breakdownItem: BreakdownItem = {
        name,
        revenue: Math.round(itemRevenue * 100) / 100,
        percentage: Math.round(percentage * 100) / 100,
      };

      // Calculate growth if period data is available
      if (periodMap.has(name)) {
        const periods = periodMap.get(name)!;
        const periodEntries = Array.from(periods.entries()).sort((a, b) =>
          a[0].localeCompare(b[0])
        );

        if (periodEntries.length >= 2) {
          const oldestPeriod = periodEntries[0]!;
          const newestPeriod = periodEntries[periodEntries.length - 1]!;
          const growth = newestPeriod[1] - oldestPeriod[1];
          const growthPercentage = oldestPeriod[1] !== 0 ? (growth / oldestPeriod[1]) * 100 : 0;

          breakdownItem.growth = Math.round(growth * 100) / 100;
          breakdownItem.growthPercentage = Math.round(growthPercentage * 100) / 100;
        }

        // Add period details
        breakdownItem.periods = periodEntries.map(([period, revenue]) => ({
          period,
          revenue: Math.round(revenue * 100) / 100,
        }));
      }

      breakdown.push(breakdownItem);
    }

    // Sort by revenue (descending)
    breakdown.sort((a, b) => b.revenue - a.revenue);

    // Calculate summary
    const topCategory = breakdown[0]!;
    const growthRates = breakdown
      .filter((item) => item.growthPercentage !== undefined)
      .map((item) => item.growthPercentage!);
    const averageGrowth =
      growthRates.length > 0
        ? Math.round((growthRates.reduce((sum, g) => sum + g, 0) / growthRates.length) * 100) / 100
        : undefined;

    return {
      breakdown,
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        numberOfCategories: breakdown.length,
        topCategory: topCategory.name,
        topCategoryRevenue: topCategory.revenue,
        topCategoryPercentage: topCategory.percentage,
        averageGrowth,
      },
    };
  },
});

/**
 * Get the appropriate key for the specified dimension
 */
function getKeyForDimension(item: RevenueItem, dimension: Dimension): string | null {
  switch (dimension) {
    case 'product':
      return item.product || null;
    case 'segment':
      return item.segment || null;
    case 'region':
      return item.region || null;
    case 'period':
      return item.period || null;
    default:
      return null;
  }
}

export default revenueBreakdownTool;
