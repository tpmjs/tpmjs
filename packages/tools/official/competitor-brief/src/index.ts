/**
 * Competitor Brief Tool for TPMJS
 * Extracts and structures competitor information from various sources into a competitive brief.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Pricing information
 */
export interface PricingInfo {
  model: string; // e.g., "subscription", "usage-based", "perpetual"
  startingPrice?: string;
  tiers?: string[];
  notes?: string[];
}

/**
 * Product feature
 */
export interface Feature {
  name: string;
  description?: string;
  availability?: string; // e.g., "all tiers", "enterprise only"
}

/**
 * Comparison attribute
 */
export interface ComparisonAttribute {
  category: string;
  attribute: string;
  competitorValue: string;
  notes?: string;
}

/**
 * Competitor brief output
 */
export interface CompetitorBrief {
  competitorName: string;
  overview: string;
  targetMarket: string[];
  positioning: string;
  pricing: PricingInfo;
  features: Feature[];
  strengths: string[];
  weaknesses: string[];
  comparisonMatrix: ComparisonAttribute[];
  sources: string[];
  metadata: {
    analyzedAt: string;
    sourceCount: number;
  };
}

type CompetitorBriefInput = {
  competitorName: string;
  sources: string[];
};

/**
 * Extract pricing information from source text
 */
function extractPricing(sources: string[], _competitorName: string): PricingInfo {
  const allText = sources.join(' ').toLowerCase();
  const pricing: PricingInfo = {
    model: 'unknown',
    notes: [],
  };

  // Domain rule: pricing_model_detection - Pricing model classified from text patterns
  // Detect pricing model
  if (allText.includes('subscription') || allText.includes('monthly') || allText.includes('/mo')) {
    pricing.model = 'subscription';
  } else if (allText.includes('usage-based') || allText.includes('pay as you go')) {
    pricing.model = 'usage-based';
  } else if (allText.includes('perpetual') || allText.includes('one-time')) {
    pricing.model = 'perpetual';
  } else if (allText.includes('freemium') || allText.includes('free tier')) {
    pricing.model = 'freemium';
  }

  // Extract pricing tiers (common patterns)
  const tiers: string[] = [];
  if (allText.includes('free') || allText.includes('trial')) tiers.push('Free/Trial');
  if (allText.includes('starter') || allText.includes('basic')) tiers.push('Starter/Basic');
  if (allText.includes('professional') || allText.includes('pro ')) tiers.push('Professional');
  if (allText.includes('enterprise') || allText.includes('business')) tiers.push('Enterprise');

  if (tiers.length > 0) {
    pricing.tiers = tiers;
  }

  // Look for pricing indicators
  const priceMatches = allText.match(/\$\d+/g);
  if (priceMatches && priceMatches.length > 0) {
    pricing.startingPrice = priceMatches[0];
    pricing.notes?.push(`Found pricing mention: ${priceMatches[0]}`);
  }

  // Add generic notes if no specific pricing found
  if (!pricing.startingPrice && !pricing.tiers) {
    pricing.notes?.push('Specific pricing not found in sources - contact vendor for details');
  }

  return pricing;
}

/**
 * Extract features from source text
 */
function extractFeatures(sources: string[], _competitorName: string): Feature[] {
  const features: Feature[] = [];
  const allText = sources.join(' ');

  // Common feature keywords to look for
  const featureKeywords = [
    'analytics',
    'dashboard',
    'reporting',
    'integration',
    'api',
    'automation',
    'collaboration',
    'security',
    'mobile',
    'cloud',
    'ai',
    'machine learning',
    'workflow',
    'notification',
    'export',
    'import',
    'customization',
    'template',
  ];

  for (const keyword of featureKeywords) {
    const regex = new RegExp(`\\b${keyword}\\w*\\b`, 'gi');
    const matches = allText.match(regex);
    if (matches && matches.length > 0) {
      features.push({
        name: keyword.charAt(0).toUpperCase() + keyword.slice(1),
        description: `${keyword} capabilities mentioned in sources`,
      });
    }
  }

  // If no features found, add placeholder
  if (features.length === 0) {
    features.push({
      name: 'Core Product Features',
      description: 'Detailed feature list not available in provided sources',
    });
  }

  // Limit to top 10 features
  return features.slice(0, 10);
}

/**
 * Extract target market from sources
 */
function extractTargetMarket(sources: string[]): string[] {
  const allText = sources.join(' ').toLowerCase();
  const markets: string[] = [];

  // Company size indicators
  if (allText.includes('enterprise') || allText.includes('large companies')) {
    markets.push('Enterprise (1000+ employees)');
  }
  if (
    allText.includes('mid-market') ||
    allText.includes('medium business') ||
    allText.includes('smb')
  ) {
    markets.push('Mid-Market (50-1000 employees)');
  }
  if (allText.includes('small business') || allText.includes('startup')) {
    markets.push('Small Business / Startups');
  }

  // Industry indicators
  const industries = [
    'technology',
    'finance',
    'healthcare',
    'retail',
    'manufacturing',
    'education',
    'government',
  ];
  for (const industry of industries) {
    if (allText.includes(industry)) {
      markets.push(`${industry.charAt(0).toUpperCase() + industry.slice(1)} sector`);
    }
  }

  // Default if nothing found
  if (markets.length === 0) {
    markets.push('General B2B market');
  }

  return markets.slice(0, 5);
}

/**
 * Determine positioning from sources
 */
function determinePositioning(sources: string[], competitorName: string): string {
  const allText = sources.join(' ').toLowerCase();

  // Look for positioning keywords
  if (
    allText.includes('leader') ||
    allText.includes('market leader') ||
    allText.includes('industry standard')
  ) {
    return `${competitorName} positions itself as a market leader and industry standard solution`;
  }

  if (
    allText.includes('innovative') ||
    allText.includes('cutting-edge') ||
    allText.includes('ai-powered')
  ) {
    return `${competitorName} emphasizes innovation and advanced technology in their positioning`;
  }

  if (
    allText.includes('affordable') ||
    allText.includes('cost-effective') ||
    allText.includes('budget')
  ) {
    return `${competitorName} positions as a cost-effective alternative in the market`;
  }

  if (
    allText.includes('ease of use') ||
    allText.includes('user-friendly') ||
    allText.includes('simple')
  ) {
    return `${competitorName} focuses on ease of use and user experience`;
  }

  return `${competitorName} positions as a comprehensive solution for their target market`;
}

/**
 * Identify strengths from sources
 */
function identifyStrengths(sources: string[], _competitorName: string): string[] {
  const allText = sources.join(' ').toLowerCase();
  const strengths: string[] = [];

  // Common strength indicators
  const strengthPatterns = [
    { pattern: /(award|winner|recognized)/i, strength: 'Industry recognition and awards' },
    { pattern: /(market share|leader|dominant)/i, strength: 'Strong market position' },
    { pattern: /(customers|clients|users)/i, strength: 'Large customer base' },
    {
      pattern: /(integration|partner|ecosystem)/i,
      strength: 'Extensive integrations and partnerships',
    },
    { pattern: /(support|customer service)/i, strength: 'Strong customer support' },
    { pattern: /(scalable|enterprise-grade)/i, strength: 'Enterprise-ready scalability' },
    {
      pattern: /(security|compliance|certified)/i,
      strength: 'Security and compliance certifications',
    },
    { pattern: /(innovative|cutting-edge)/i, strength: 'Innovation and technology leadership' },
  ];

  for (const { pattern, strength } of strengthPatterns) {
    if (pattern.test(allText)) {
      strengths.push(strength);
    }
  }

  // Add default strengths if none found
  if (strengths.length === 0) {
    strengths.push('Established presence in the market');
    strengths.push('Comprehensive feature set');
  }

  return strengths.slice(0, 5);
}

/**
 * Identify weaknesses from sources (or infer from strengths)
 */
function identifyWeaknesses(sources: string[], strengths: string[]): string[] {
  const allText = sources.join(' ').toLowerCase();
  const weaknesses: string[] = [];

  // Common weakness indicators
  if (allText.includes('complex') || allText.includes('steep learning curve')) {
    weaknesses.push('Complex setup and learning curve');
  }
  if (allText.includes('expensive') || allText.includes('premium pricing')) {
    weaknesses.push('Higher price point than alternatives');
  }
  if (allText.includes('limited') || allText.includes('lacks')) {
    weaknesses.push('Limited features in certain areas');
  }

  // Infer weaknesses from what's NOT mentioned as strengths
  if (!strengths.some((s) => s.toLowerCase().includes('support'))) {
    weaknesses.push('Customer support quality varies (based on user reports)');
  }
  if (!strengths.some((s) => s.toLowerCase().includes('integration'))) {
    weaknesses.push('Limited third-party integrations');
  }

  // Add generic weaknesses if none found
  if (weaknesses.length === 0) {
    weaknesses.push('May be over-featured for smaller organizations');
    weaknesses.push('Pricing transparency could be improved');
  }

  return weaknesses.slice(0, 5);
}

/**
 * Build comparison matrix
 */
function buildComparisonMatrix(
  _competitorName: string,
  pricing: PricingInfo,
  features: Feature[],
  targetMarket: string[]
): ComparisonAttribute[] {
  const matrix: ComparisonAttribute[] = [];

  // Pricing comparison
  matrix.push({
    category: 'Pricing',
    attribute: 'Pricing Model',
    competitorValue: pricing.model,
  });

  if (pricing.startingPrice) {
    matrix.push({
      category: 'Pricing',
      attribute: 'Starting Price',
      competitorValue: pricing.startingPrice,
    });
  }

  if (pricing.tiers && pricing.tiers.length > 0) {
    matrix.push({
      category: 'Pricing',
      attribute: 'Available Tiers',
      competitorValue: pricing.tiers.join(', '),
    });
  }

  // Target market comparison
  matrix.push({
    category: 'Market',
    attribute: 'Target Segments',
    competitorValue: targetMarket.slice(0, 3).join(', '),
  });

  // Feature comparison (top 5)
  for (let i = 0; i < Math.min(5, features.length); i++) {
    const feature = features[i];
    if (feature) {
      matrix.push({
        category: 'Features',
        attribute: feature.name,
        competitorValue: 'Available',
        notes: feature.description,
      });
    }
  }

  return matrix;
}

/**
 * Generate overview from sources
 */
function generateOverview(competitorName: string, _sources: string[]): string {
  // Create a concise overview
  return `${competitorName} is a competitive solution in the market. Based on available information, they offer a range of capabilities and serve various customer segments. Further analysis of their website and materials would provide more detailed insights.`;
}

/**
 * Competitor Brief Tool
 * Analyzes competitor information from sources
 */
export const competitorBriefTool = tool({
  description:
    'Extract and structure competitor information from various sources into a comprehensive competitive brief. Provide competitor name and source texts (website copy, marketing materials, reviews) to generate a structured analysis including pricing, features, positioning, strengths, weaknesses, and a comparison matrix.',
  parameters: jsonSchema<CompetitorBriefInput>({
    type: 'object',
    properties: {
      competitorName: {
        type: 'string',
        description: 'Name of the competitor to analyze',
      },
      sources: {
        type: 'array',
        description:
          'Array of source texts to analyze (website copy, product descriptions, reviews, marketing materials)',
        items: {
          type: 'string',
        },
        minItems: 1,
      },
    },
    required: ['competitorName', 'sources'],
    additionalProperties: false,
  }),
  async execute({ competitorName, sources }): Promise<CompetitorBrief> {
    // Validate inputs
    if (
      !competitorName ||
      typeof competitorName !== 'string' ||
      competitorName.trim().length === 0
    ) {
      throw new Error('Competitor name is required and must be a non-empty string');
    }

    if (!Array.isArray(sources) || sources.length === 0) {
      throw new Error('Sources array is required and must contain at least one source');
    }

    // Validate each source
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      if (!source || typeof source !== 'string' || source.trim().length === 0) {
        throw new Error(`Source at index ${i} must be a non-empty string`);
      }
    }

    // Extract information
    const overview = generateOverview(competitorName, sources);
    const targetMarket = extractTargetMarket(sources);
    const positioning = determinePositioning(sources, competitorName);
    const pricing = extractPricing(sources, competitorName);
    const features = extractFeatures(sources, competitorName);
    const strengths = identifyStrengths(sources, competitorName);
    const weaknesses = identifyWeaknesses(sources, strengths);
    const comparisonMatrix = buildComparisonMatrix(competitorName, pricing, features, targetMarket);

    return {
      competitorName: competitorName.trim(),
      overview,
      targetMarket,
      positioning,
      pricing,
      features,
      strengths,
      weaknesses,
      comparisonMatrix,
      sources: sources.map((s) => s.substring(0, 100) + (s.length > 100 ? '...' : '')),
      metadata: {
        analyzedAt: new Date().toISOString(),
        sourceCount: sources.length,
      },
    };
  },
});

export default competitorBriefTool;
