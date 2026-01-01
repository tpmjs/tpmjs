/**
 * Compensation Band Tool for TPMJS
 * Structures compensation data into salary bands with percentiles and benchmarks
 */

import { jsonSchema, tool } from 'ai';

/**
 * Market data point for compensation analysis
 */
export interface MarketDataPoint {
  source: string;
  salary: number;
  equity?: number;
  totalComp?: number;
  location?: string;
  experienceYears?: number;
}

/**
 * Percentile breakdown for the band
 */
export interface PercentileBreakdown {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

/**
 * Market comparison context
 */
export interface MarketComparison {
  averageMarket: number;
  bandMin: number;
  bandMid: number;
  bandMax: number;
  percentiles: PercentileBreakdown;
  dataPoints: number;
  sources: string[];
}

/**
 * Compensation band output structure
 */
export interface CompensationBand {
  role: string;
  location?: string;
  min: number;
  mid: number;
  max: number;
  spread: number;
  percentiles: PercentileBreakdown;
  marketComparison: MarketComparison;
  recommendations: string[];
  formatted: string;
}

type CompensationBandInput = {
  role: string;
  marketData: MarketDataPoint[];
  location?: string;
};

/**
 * Validates market data array
 */
function validateMarketData(data: unknown): void {
  if (!Array.isArray(data)) {
    throw new Error('marketData must be an array');
  }
  if (data.length === 0) {
    throw new Error('marketData must contain at least one data point');
  }
  if (data.length > 100) {
    throw new Error('marketData cannot contain more than 100 data points');
  }

  for (let i = 0; i < data.length; i++) {
    const point = data[i];
    if (!point || typeof point !== 'object') {
      throw new Error(`Market data point at index ${i} must be an object`);
    }

    const p = point as Record<string, unknown>;

    if (!p.source || typeof p.source !== 'string' || p.source.trim().length === 0) {
      throw new Error(`Market data point at index ${i} must have a non-empty 'source' property`);
    }

    if (typeof p.salary !== 'number' || p.salary <= 0) {
      throw new Error(`Market data point at index ${i} must have a positive 'salary' number`);
    }

    if (p.equity !== undefined && (typeof p.equity !== 'number' || p.equity < 0)) {
      throw new Error(`Market data point at index ${i} equity must be a non-negative number`);
    }

    if (p.totalComp !== undefined && (typeof p.totalComp !== 'number' || p.totalComp <= 0)) {
      throw new Error(`Market data point at index ${i} totalComp must be a positive number`);
    }
  }
}

/**
 * Calculates percentile from sorted array
 */
function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0]!;

  const index = (percentile / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  return sortedValues[lower]! * (1 - weight) + sortedValues[upper]! * weight;
}

/**
 * Calculates percentile breakdown from market data
 */
function calculatePercentiles(salaries: number[]): PercentileBreakdown {
  const sorted = [...salaries].sort((a, b) => a - b);

  return {
    p10: Math.round(calculatePercentile(sorted, 10)),
    p25: Math.round(calculatePercentile(sorted, 25)),
    p50: Math.round(calculatePercentile(sorted, 50)),
    p75: Math.round(calculatePercentile(sorted, 75)),
    p90: Math.round(calculatePercentile(sorted, 90)),
  };
}

/**
 * Determines band min/mid/max from market data
 */
function calculateBand(
  _salaries: number[],
  percentiles: PercentileBreakdown
): { min: number; mid: number; max: number; spread: number } {
  // Use 25th percentile as min, 50th as mid, 75th as max
  // This creates a competitive band that covers the middle 50% of the market
  const min = percentiles.p25;
  const mid = percentiles.p50;
  const max = percentiles.p75;

  // Calculate spread (max as % of min)
  const spread = Math.round(((max - min) / min) * 100);

  return { min, mid, max, spread };
}

/**
 * Generates recommendations based on market analysis
 */
function generateRecommendations(
  band: { min: number; mid: number; max: number; spread: number },
  _percentiles: PercentileBreakdown,
  dataPoints: number,
  location?: string
): string[] {
  const recommendations: string[] = [];

  // Spread analysis
  if (band.spread < 20) {
    recommendations.push(
      'Narrow salary spread detected. Consider widening the band to allow for more growth within the role.'
    );
  } else if (band.spread > 50) {
    recommendations.push(
      'Wide salary spread detected. Ensure clear criteria for progression from min to max to maintain equity.'
    );
  } else {
    recommendations.push(
      `Salary spread of ${band.spread}% is within healthy range (20-50%), allowing room for growth.`
    );
  }

  // Data sufficiency
  if (dataPoints < 5) {
    recommendations.push(
      'Limited market data available. Consider gathering more data points for accurate benchmarking.'
    );
  } else if (dataPoints >= 10) {
    recommendations.push(
      `Strong data set with ${dataPoints} market data points provides reliable benchmarking.`
    );
  }

  // Location consideration
  if (location) {
    recommendations.push(
      `Band accounts for ${location} market. Consider location-based adjustments for remote candidates.`
    );
  } else {
    recommendations.push(
      'No location specified. Consider creating location-specific bands for accuracy.'
    );
  }

  // General guidance
  recommendations.push(
    'Position new hires at min-mid range, reserving higher end for experienced candidates and internal promotions.'
  );

  recommendations.push(
    'Review and update bands annually or when market conditions change significantly.'
  );

  return recommendations;
}

/**
 * Formats compensation band as markdown
 */
function formatCompensationBand(
  role: string,
  location: string | undefined,
  band: { min: number; mid: number; max: number; spread: number },
  percentiles: PercentileBreakdown,
  marketComparison: MarketComparison,
  recommendations: string[]
): string {
  const sections: string[] = [];

  sections.push(`# Compensation Band\n`);
  sections.push(`**Role:** ${role}`);
  if (location) {
    sections.push(`**Location:** ${location}`);
  }
  sections.push(`**Data Points:** ${marketComparison.dataPoints} market sources\n`);

  sections.push('---\n');

  // Band structure
  sections.push('## Salary Band Structure\n');
  sections.push(`| Position | Amount | Description |`);
  sections.push(`|----------|--------|-------------|`);
  sections.push(
    `| Minimum | $${band.min.toLocaleString()} | Entry point for new hires with minimum qualifications |`
  );
  sections.push(
    `| Midpoint | $${band.mid.toLocaleString()} | Market competitive rate for fully qualified performers |`
  );
  sections.push(
    `| Maximum | $${band.max.toLocaleString()} | Top of range for exceptional performers and long tenure |`
  );
  sections.push(`\n**Spread:** ${band.spread}% (min to max)\n`);

  // Market percentiles
  sections.push('## Market Percentiles\n');
  sections.push('Based on analysis of market data, here are the salary percentiles:\n');
  sections.push(`| Percentile | Salary |`);
  sections.push(`|------------|--------|`);
  sections.push(`| 10th | $${percentiles.p10.toLocaleString()} |`);
  sections.push(`| 25th | $${percentiles.p25.toLocaleString()} |`);
  sections.push(`| 50th (Median) | $${percentiles.p50.toLocaleString()} |`);
  sections.push(`| 75th | $${percentiles.p75.toLocaleString()} |`);
  sections.push(`| 90th | $${percentiles.p90.toLocaleString()} |\n`);

  // Market comparison
  sections.push('## Market Comparison\n');
  sections.push(`**Market Average:** $${marketComparison.averageMarket.toLocaleString()}`);
  sections.push(`**Our Midpoint:** $${marketComparison.bandMid.toLocaleString()}`);

  const diffPercent =
    ((marketComparison.bandMid - marketComparison.averageMarket) / marketComparison.averageMarket) *
    100;
  const diffLabel = diffPercent >= 0 ? 'above' : 'below';
  sections.push(`**Position:** ${Math.abs(diffPercent).toFixed(1)}% ${diffLabel} market average\n`);

  if (marketComparison.sources.length > 0) {
    sections.push('**Data Sources:**');
    const uniqueSources = Array.from(new Set(marketComparison.sources));
    uniqueSources.forEach((source) => {
      sections.push(`- ${source}`);
    });
    sections.push('');
  }

  // Recommendations
  sections.push('## Recommendations\n');
  recommendations.forEach((rec, idx) => {
    sections.push(`${idx + 1}. ${rec}`);
  });
  sections.push('');

  // Footer
  sections.push('---\n');
  sections.push(
    '*This compensation band should be reviewed regularly and adjusted based on market conditions, budget, and internal equity considerations.*'
  );

  return sections.join('\n');
}

/**
 * Compensation Band Tool
 * Structures compensation data into actionable salary bands
 */
export const compensationBandTool = tool({
  description:
    'Structures compensation data into salary bands with minimum, midpoint, and maximum values. Calculates percentiles, provides market comparison, and includes recommendations for competitive positioning.',
  inputSchema: jsonSchema<CompensationBandInput>({
    type: 'object',
    properties: {
      role: {
        type: 'string',
        description: 'Role title (e.g., "Senior Software Engineer", "Product Manager")',
      },
      marketData: {
        type: 'array',
        description: 'Array of market compensation data points from various sources',
        items: {
          type: 'object',
          properties: {
            source: {
              type: 'string',
              description: 'Data source (e.g., "Glassdoor", "Levels.fyi", "Payscale")',
            },
            salary: {
              type: 'number',
              description: 'Base salary amount',
            },
            equity: {
              type: 'number',
              description: 'Equity/stock compensation value',
            },
            totalComp: {
              type: 'number',
              description: 'Total compensation (salary + equity + bonus)',
            },
            location: {
              type: 'string',
              description: 'Location for this data point',
            },
            experienceYears: {
              type: 'number',
              description: 'Years of experience',
            },
          },
          required: ['source', 'salary'],
        },
      },
      location: {
        type: 'string',
        description: 'Geographic location for the role (e.g., "San Francisco, CA", "Remote - US")',
      },
    },
    required: ['role', 'marketData'],
    additionalProperties: false,
  }),
  async execute({ role, marketData, location }): Promise<CompensationBand> {
    // Validate role
    if (!role || typeof role !== 'string' || role.trim().length === 0) {
      throw new Error('Role is required and must be a non-empty string');
    }

    // Validate market data
    validateMarketData(marketData);

    // Extract salaries for analysis
    const salaries = marketData.map((d) => d.salary);
    const sources = marketData.map((d) => d.source);

    // Calculate percentiles
    const percentiles = calculatePercentiles(salaries);

    // Calculate band structure
    const band = calculateBand(salaries, percentiles);

    // Calculate market average
    const averageMarket = Math.round(salaries.reduce((sum, s) => sum + s, 0) / salaries.length);

    // Build market comparison
    const marketComparison: MarketComparison = {
      averageMarket,
      bandMin: band.min,
      bandMid: band.mid,
      bandMax: band.max,
      percentiles,
      dataPoints: marketData.length,
      sources,
    };

    // Generate recommendations
    const recommendations = generateRecommendations(band, percentiles, marketData.length, location);

    // Format the output
    const formatted = formatCompensationBand(
      role,
      location,
      band,
      percentiles,
      marketComparison,
      recommendations
    );

    return {
      role,
      location,
      min: band.min,
      mid: band.mid,
      max: band.max,
      spread: band.spread,
      percentiles,
      marketComparison,
      recommendations,
      formatted,
    };
  },
});

export default compensationBandTool;
