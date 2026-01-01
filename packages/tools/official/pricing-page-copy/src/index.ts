/**
 * Pricing Page Copy Tool for TPMJS
 * Generates pricing page copy with tier names, feature lists, and CTAs
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 * Uses jsonSchema() to avoid Zod 4 JSON Schema conversion issues with OpenAI
 */

import { jsonSchema, tool } from 'ai';

export interface PricingTier {
  name: string;
  headline: string;
  price: string;
  billingPeriod: string;
  features: Array<{
    text: string;
    benefit: string;
    included: boolean;
  }>;
  cta: string;
  recommended?: boolean;
  badge?: string;
  valueProposition: string;
}

export interface PricingPageCopy {
  pageHeadline: string;
  pageSubheadline: string;
  tiers: PricingTier[];
  faq: Array<{
    question: string;
    answer: string;
  }>;
  trustSignals: string[];
  guarantee?: string;
}

/**
 * Input type for Pricing Page Copy Tool
 */
type PricingPageCopyInput = {
  tiers: Array<{
    name?: string;
    price: number | string;
    billingPeriod?: string;
    features: string[];
    recommended?: boolean;
  }>;
  targetAudience: string;
};

/**
 * Generate tier name if not provided
 */
function generateTierName(index: number, totalTiers: number, providedName?: string): string {
  if (providedName) return providedName;

  // Domain rule: pricing_tier_naming - Standard SaaS pricing tier names based on tier count
  const tierNames = [
    ['Free', 'Pro', 'Enterprise'],
    ['Basic', 'Professional', 'Business', 'Enterprise'],
    ['Starter', 'Growth', 'Scale', 'Enterprise'],
    ['Essential', 'Advanced', 'Premium', 'Ultimate'],
  ];

  const nameSet = tierNames.find((set) => set.length === totalTiers) || tierNames[1];
  return nameSet?.[index] || `Tier ${index + 1}`;
}

/**
 * Generate headline for tier
 */
function generateHeadline(tierName: string, index: number, totalTiers: number): string {
  const headlines: Record<string, string> = {
    free: 'Get started for free',
    starter: 'Perfect for individuals',
    basic: 'Essential features for getting started',
    pro: 'For growing teams',
    professional: 'Advanced features for professionals',
    growth: 'Scale your business',
    business: 'Built for businesses',
    scale: 'Enterprise-grade features',
    premium: 'Premium features and support',
    enterprise: 'Custom solutions for large teams',
    ultimate: 'Everything you need and more',
  };

  const nameLower = tierName.toLowerCase();
  for (const [key, headline] of Object.entries(headlines)) {
    if (nameLower.includes(key)) {
      return headline;
    }
  }

  if (index === 0) return 'Perfect for getting started';
  if (index === totalTiers - 1) return 'Maximum power and flexibility';
  return 'Best for growing teams';
}

/**
 * Convert feature to benefit-oriented copy
 */
function featureToBenefit(feature: string): string {
  const featureLower = feature.toLowerCase();

  // Common patterns
  if (featureLower.includes('unlimited')) {
    return 'Never worry about limits';
  }
  if (featureLower.includes('24/7') || featureLower.includes('support')) {
    return 'Get help whenever you need it';
  }
  if (featureLower.includes('analytics') || featureLower.includes('reporting')) {
    return 'Make data-driven decisions';
  }
  if (featureLower.includes('integration')) {
    return 'Work seamlessly with your tools';
  }
  if (featureLower.includes('storage')) {
    return 'Store all your important data';
  }
  if (featureLower.includes('user') || featureLower.includes('seat')) {
    return 'Collaborate with your team';
  }
  if (featureLower.includes('custom')) {
    return 'Tailored to your needs';
  }
  if (featureLower.includes('priority')) {
    return 'Get faster service';
  }
  if (featureLower.includes('backup')) {
    return 'Keep your data safe';
  }
  if (featureLower.includes('security')) {
    return 'Protect your information';
  }

  return 'Enhance your workflow';
}

/**
 * Generate CTA text for tier
 */
function generateCTA(tierName: string, price: string | number, index: number): string {
  const isFree = price === 0 || price === '0' || String(price).toLowerCase().includes('free');

  if (isFree) {
    return 'Start for free';
  }

  const nameLower = tierName.toLowerCase();

  if (nameLower.includes('enterprise') || nameLower.includes('custom')) {
    return 'Contact sales';
  }

  if (index === 0) {
    return 'Get started';
  }

  return 'Start free trial';
}

/**
 * Generate badge for recommended tier
 */
function generateBadge(tierName: string, recommended?: boolean): string | undefined {
  if (recommended) {
    return 'Most Popular';
  }

  const nameLower = tierName.toLowerCase();

  if (nameLower.includes('pro') || nameLower.includes('professional')) {
    return 'Best Value';
  }

  return undefined;
}

/**
 * Generate value proposition for tier
 */
function generateValueProposition(
  tierName: string,
  features: string[],
  targetAudience: string
): string {
  const nameLower = tierName.toLowerCase();

  if (nameLower.includes('free') || nameLower.includes('starter')) {
    return `Perfect for ${targetAudience} just getting started`;
  }

  if (nameLower.includes('enterprise')) {
    return `Comprehensive solution for large-scale ${targetAudience}`;
  }

  const featureCount = features.length;
  return `Everything ${targetAudience} need${targetAudience.endsWith('s') ? '' : 's'} with ${featureCount}+ features`;
}

/**
 * Format price display
 */
function formatPrice(price: number | string, billingPeriod?: string): string {
  const priceNum = typeof price === 'string' ? Number.parseFloat(price) : price;

  if (isNaN(priceNum)) {
    return String(price);
  }

  if (priceNum === 0) {
    return 'Free';
  }

  const formatted = `$${priceNum.toFixed(0)}`;
  return billingPeriod ? `${formatted}/${billingPeriod}` : formatted;
}

/**
 * Determine billing period if not provided
 */
function determineBillingPeriod(providedPeriod?: string): string {
  if (providedPeriod) return providedPeriod;
  return 'month';
}

/**
 * Process features and add benefit text
 */
function processFeaturesWithBenefits(
  features: string[],
  _tierIndex: number,
  _allTierFeatures: string[][]
): Array<{ text: string; benefit: string; included: boolean }> {
  return features.map((feature) => ({
    text: feature,
    benefit: featureToBenefit(feature),
    included: true,
  }));
}

/**
 * Generate page headline
 */
function generatePageHeadline(targetAudience: string): string {
  return `Simple, transparent pricing for ${targetAudience}`;
}

/**
 * Generate page subheadline
 */
function generatePageSubheadline(tierCount: number): string {
  if (tierCount === 1) {
    return 'One simple plan with everything you need';
  }
  if (tierCount === 2) {
    return 'Choose the plan that fits your needs';
  }
  return "Choose the plan that's right for you. All plans include a 14-day free trial.";
}

/**
 * Generate FAQ items
 */
function generateFAQ(
  tiers: PricingTier[],
  _targetAudience: string
): Array<{ question: string; answer: string }> {
  const faq: Array<{ question: string; answer: string }> = [];

  faq.push({
    question: 'Can I change plans later?',
    answer:
      'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.',
  });

  const hasTrial = tiers.some((tier) => tier.cta.toLowerCase().includes('trial'));
  if (hasTrial) {
    faq.push({
      question: 'What happens after the free trial?',
      answer:
        "After your 14-day free trial, you'll be charged for your selected plan. Cancel anytime during the trial at no cost.",
    });
  }

  const hasEnterprise = tiers.some((tier) => tier.name.toLowerCase().includes('enterprise'));
  if (hasEnterprise) {
    faq.push({
      question: "What's included in the Enterprise plan?",
      answer:
        'Enterprise plans include custom features, dedicated support, advanced security, and volume pricing. Contact our sales team for details.',
    });
  }

  faq.push({
    question: 'Do you offer discounts?',
    answer:
      'Yes! We offer discounts for annual billing, nonprofits, and educational institutions. Contact us for details.',
  });

  faq.push({
    question: 'Is my data secure?',
    answer:
      'Absolutely. We use industry-standard encryption and security practices to protect your data. All plans include secure data storage.',
  });

  return faq;
}

/**
 * Generate trust signals
 */
function generateTrustSignals(tiers: PricingTier[]): string[] {
  const signals: string[] = [
    '14-day free trial, no credit card required',
    'Cancel anytime',
    'Secure payment processing',
  ];

  const hasEnterprise = tiers.some((tier) => tier.name.toLowerCase().includes('enterprise'));
  if (hasEnterprise) {
    signals.push('Dedicated account manager for Enterprise');
  }

  signals.push('99.9% uptime SLA');
  signals.push('24/7 customer support');

  return signals;
}

/**
 * Generate money-back guarantee
 */
function generateGuarantee(): string {
  return "30-day money-back guarantee. If you're not satisfied, we'll refund your purchase, no questions asked.";
}

/**
 * Pricing Page Copy Tool
 * Generates pricing page copy with tier names, feature lists, and CTAs
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 */
export const pricingPageCopyTool = tool({
  description:
    'Generates comprehensive pricing page copy with tier names, headlines, benefit-oriented feature lists, CTAs, FAQs, and trust signals. Frames features as benefits and clearly differentiates tiers.',
  inputSchema: jsonSchema<PricingPageCopyInput>({
    type: 'object',
    properties: {
      tiers: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Tier name (optional, will be generated if not provided)',
            },
            price: {
              oneOf: [{ type: 'number' }, { type: 'string' }],
              description: 'Price amount (number or "custom", "free", etc.)',
            },
            billingPeriod: {
              type: 'string',
              description: 'Billing period (month, year, etc.)',
            },
            features: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of features included in this tier',
            },
            recommended: {
              type: 'boolean',
              description: 'Whether this tier is recommended/most popular',
            },
          },
          required: ['price', 'features'],
        },
        minItems: 1,
        description: 'Pricing tiers with features and prices',
      },
      targetAudience: {
        type: 'string',
        description: 'Primary target audience (e.g., "small businesses", "developers", "teams")',
      },
    },
    required: ['tiers', 'targetAudience'],
    additionalProperties: false,
  }),
  async execute({ tiers, targetAudience }) {
    // Validate required fields
    if (!tiers || tiers.length === 0) {
      throw new Error('At least one pricing tier is required');
    }

    if (!targetAudience || targetAudience.trim().length === 0) {
      throw new Error('Target audience is required');
    }

    // Validate each tier
    for (const tier of tiers) {
      if (!tier.features || tier.features.length === 0) {
        throw new Error('Each tier must have at least one feature');
      }
    }

    const allTierFeatures = tiers.map((t: { features: string[] }) => t.features);

    // Process each tier
    const processedTiers: PricingTier[] = tiers.map(
      (
        tier: {
          name?: string;
          price: number | string;
          billingPeriod?: string;
          features: string[];
          recommended?: boolean;
        },
        index: number
      ) => {
        const name = generateTierName(index, tiers.length, tier.name);
        const headline = generateHeadline(name, index, tiers.length);
        const billingPeriod = determineBillingPeriod(tier.billingPeriod);
        const price = formatPrice(tier.price, billingPeriod);
        const features = processFeaturesWithBenefits(tier.features, index, allTierFeatures);
        const cta = generateCTA(name, tier.price, index);
        const badge = generateBadge(name, tier.recommended);
        const valueProposition = generateValueProposition(name, tier.features, targetAudience);

        return {
          name,
          headline,
          price,
          billingPeriod,
          features,
          cta,
          recommended: tier.recommended,
          badge,
          valueProposition,
        };
      }
    );

    // Generate page-level content
    const pageHeadline = generatePageHeadline(targetAudience);
    const pageSubheadline = generatePageSubheadline(tiers.length);
    const faq = generateFAQ(processedTiers, targetAudience);
    const trustSignals = generateTrustSignals(processedTiers);
    const guarantee = generateGuarantee();

    return {
      pageHeadline,
      pageSubheadline,
      tiers: processedTiers,
      faq,
      trustSignals,
      guarantee,
    };
  },
});

/**
 * Export default for convenience
 */
export default pricingPageCopyTool;
