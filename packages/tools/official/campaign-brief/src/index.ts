/**
 * Campaign Brief Tool for TPMJS
 * Structures marketing campaign briefs with objectives, audience, channels, and KPIs.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Target audience segment
 */
export interface AudienceSegment {
  name: string;
  demographics: string[];
  psychographics: string[];
  behaviors: string[];
}

/**
 * Marketing channel recommendation
 */
export interface ChannelRecommendation {
  channel: string;
  rationale: string;
  suggestedBudgetPercent: number;
  tactics: string[];
}

/**
 * Key performance indicator
 */
export interface KPI {
  metric: string;
  target: string;
  measurement: string;
  priority: 'primary' | 'secondary';
}

/**
 * Campaign timeline milestone
 */
export interface Milestone {
  phase: string;
  duration: string;
  activities: string[];
}

/**
 * Campaign brief output
 */
export interface CampaignBrief {
  campaignName: string;
  objective: string;
  goals: string[];
  targetAudience: AudienceSegment[];
  messaging: {
    valueProposition: string;
    keyMessages: string[];
    callToAction: string;
  };
  channels: ChannelRecommendation[];
  budget: {
    total?: number;
    allocation: { channel: string; percentage: number; amount?: number }[];
  };
  timeline: Milestone[];
  kpis: KPI[];
  successCriteria: string[];
  metadata: {
    product: string;
    createdAt: string;
    campaignType: string;
  };
}

type CampaignBriefInput = {
  campaignGoal: string;
  product: string;
  budget?: number;
};

/**
 * Determine campaign type from goal
 */
function determineCampaignType(goal: string): string {
  const lowerGoal = goal.toLowerCase();

  // Domain rule: campaign_classification - Campaign type determined by goal keywords
  if (lowerGoal.includes('awareness') || lowerGoal.includes('brand')) {
    return 'Brand Awareness';
  }
  if (lowerGoal.includes('lead') || lowerGoal.includes('generate')) {
    return 'Lead Generation';
  }
  if (lowerGoal.includes('launch') || lowerGoal.includes('introduce')) {
    return 'Product Launch';
  }
  if (lowerGoal.includes('conversion') || lowerGoal.includes('sales')) {
    return 'Conversion/Sales';
  }
  if (lowerGoal.includes('retention') || lowerGoal.includes('customer')) {
    return 'Customer Retention';
  }
  if (lowerGoal.includes('engagement') || lowerGoal.includes('nurture')) {
    return 'Engagement';
  }

  return 'Multi-Objective';
}

/**
 * Generate campaign name from product and goal
 */
function generateCampaignName(product: string, campaignType: string): string {
  const year = new Date().getFullYear();
  const quarter = Math.ceil((new Date().getMonth() + 1) / 3);

  return `${product} ${campaignType} Campaign - Q${quarter} ${year}`;
}

/**
 * Generate goals based on campaign type
 */
function generateGoals(campaignGoal: string, campaignType: string): string[] {
  const goals: string[] = [];

  // Primary goal is always the user's input
  goals.push(campaignGoal);

  // Add secondary goals based on type
  switch (campaignType) {
    case 'Brand Awareness':
      goals.push('Increase brand recognition and reach');
      goals.push('Establish thought leadership in the industry');
      goals.push('Build social media presence and engagement');
      break;
    case 'Lead Generation':
      goals.push('Generate qualified leads for sales team');
      goals.push('Build email subscriber list');
      goals.push('Drive traffic to landing pages');
      break;
    case 'Product Launch':
      goals.push('Create excitement and anticipation for new product');
      goals.push('Educate market about product benefits');
      goals.push('Drive early adopter sign-ups');
      break;
    case 'Conversion/Sales':
      goals.push('Increase conversion rate on key pages');
      goals.push('Drive direct sales and revenue');
      goals.push('Reduce customer acquisition cost');
      break;
    case 'Customer Retention':
      goals.push('Increase customer lifetime value');
      goals.push('Reduce churn rate');
      goals.push('Drive product adoption and usage');
      break;
    case 'Engagement':
      goals.push('Increase content engagement rates');
      goals.push('Build community around the brand');
      goals.push('Nurture leads through the funnel');
      break;
    default:
      goals.push('Achieve measurable business impact');
      goals.push('Optimize marketing ROI');
  }

  return goals.slice(0, 4);
}

/**
 * Generate target audience segments
 */
function generateAudienceSegments(campaignType: string, _product: string): AudienceSegment[] {
  const segments: AudienceSegment[] = [];

  // Primary segment
  segments.push({
    name: 'Primary Target',
    demographics: [
      'Decision makers and influencers',
      'Companies with 50-500 employees',
      'Technology-forward industries',
    ],
    psychographics: [
      'Value innovation and efficiency',
      'Seek data-driven solutions',
      'Early adopters of new technology',
    ],
    behaviors: [
      'Active on LinkedIn and industry forums',
      'Consume industry thought leadership content',
      'Attend webinars and virtual events',
    ],
  });

  // Secondary segment for awareness and launch campaigns
  if (campaignType === 'Brand Awareness' || campaignType === 'Product Launch') {
    segments.push({
      name: 'Secondary Audience',
      demographics: [
        'Individual contributors and managers',
        'SMBs and startups (10-50 employees)',
        'Tech-adjacent industries',
      ],
      psychographics: [
        'Looking for cost-effective solutions',
        'Value ease of use and quick implementation',
        'Community-oriented and peer-influenced',
      ],
      behaviors: [
        'Engage with social media content',
        'Participate in online communities',
        'Respond to email campaigns',
      ],
    });
  }

  return segments;
}

/**
 * Generate messaging framework
 */
function generateMessaging(product: string, campaignGoal: string, campaignType: string) {
  const valueProposition = `${product} helps teams achieve ${campaignGoal.toLowerCase()} through innovative, user-friendly solutions that deliver measurable results.`;

  const keyMessages: string[] = [];
  keyMessages.push(`${product} solves critical challenges in your workflow`);
  keyMessages.push('Proven results with measurable ROI');
  keyMessages.push('Easy to implement and scale');

  let callToAction = 'Get Started Today';
  if (campaignType === 'Lead Generation') {
    callToAction = 'Download Free Guide';
  } else if (campaignType === 'Product Launch') {
    callToAction = 'Join the Waitlist';
  } else if (campaignType === 'Conversion/Sales') {
    callToAction = 'Start Your Free Trial';
  }

  return {
    valueProposition,
    keyMessages,
    callToAction,
  };
}

/**
 * Generate channel recommendations
 */
function generateChannels(campaignType: string, budget?: number): ChannelRecommendation[] {
  const channels: ChannelRecommendation[] = [];

  // Content marketing (always recommended)
  channels.push({
    channel: 'Content Marketing',
    rationale: 'Build authority and organic reach through valuable content',
    suggestedBudgetPercent: 20,
    tactics: ['Blog posts', 'Whitepapers', 'Case studies', 'Video content'],
  });

  // Email marketing (always recommended)
  channels.push({
    channel: 'Email Marketing',
    rationale: 'Direct communication with engaged audience, high ROI',
    suggestedBudgetPercent: 15,
    tactics: [
      'Newsletter campaigns',
      'Drip sequences',
      'Promotional emails',
      'Segmented messaging',
    ],
  });

  // Channel selection based on campaign type
  if (campaignType === 'Brand Awareness' || campaignType === 'Product Launch') {
    channels.push({
      channel: 'Social Media (Paid + Organic)',
      rationale: 'Build awareness and reach new audiences at scale',
      suggestedBudgetPercent: 25,
      tactics: ['LinkedIn ads', 'Twitter/X engagement', 'Video shorts', 'Influencer partnerships'],
    });

    channels.push({
      channel: 'PR & Thought Leadership',
      rationale: 'Gain credibility through earned media and expert positioning',
      suggestedBudgetPercent: 15,
      tactics: ['Press releases', 'Guest articles', 'Podcast appearances', 'Industry awards'],
    });
  }

  if (campaignType === 'Lead Generation' || campaignType === 'Conversion/Sales') {
    channels.push({
      channel: 'Paid Search (SEM)',
      rationale: 'Capture high-intent traffic actively searching for solutions',
      suggestedBudgetPercent: 30,
      tactics: ['Google Ads', 'Bing Ads', 'Remarketing', 'Shopping campaigns'],
    });

    channels.push({
      channel: 'Landing Pages & CRO',
      rationale: 'Optimize conversion paths and maximize lead quality',
      suggestedBudgetPercent: 10,
      tactics: [
        'A/B testing',
        'Form optimization',
        'CTA optimization',
        'User experience improvements',
      ],
    });
  }

  // Webinars/Events for engagement and retention
  if (campaignType === 'Engagement' || campaignType === 'Customer Retention') {
    channels.push({
      channel: 'Webinars & Virtual Events',
      rationale: 'Deep engagement and education with target audience',
      suggestedBudgetPercent: 20,
      tactics: ['Live webinars', 'On-demand content', 'Virtual workshops', 'Q&A sessions'],
    });
  }

  // Account-based marketing for high-value campaigns
  if (budget && budget > 50000) {
    channels.push({
      channel: 'Account-Based Marketing (ABM)',
      rationale: 'Personalized outreach to high-value target accounts',
      suggestedBudgetPercent: 15,
      tactics: [
        'Personalized content',
        'Direct mail',
        'Executive engagement',
        'Custom landing pages',
      ],
    });
  }

  // Normalize percentages to 100%
  const totalPercent = channels.reduce((sum, ch) => sum + ch.suggestedBudgetPercent, 0);
  channels.forEach((ch) => {
    ch.suggestedBudgetPercent = Math.round((ch.suggestedBudgetPercent / totalPercent) * 100);
  });

  return channels.slice(0, 6);
}

/**
 * Generate budget allocation
 */
function generateBudgetAllocation(channels: ChannelRecommendation[], totalBudget?: number) {
  const allocation = channels.map((ch) => ({
    channel: ch.channel,
    percentage: ch.suggestedBudgetPercent,
    amount: totalBudget ? Math.round((totalBudget * ch.suggestedBudgetPercent) / 100) : undefined,
  }));

  return {
    total: totalBudget,
    allocation,
  };
}

/**
 * Generate campaign timeline
 */
function generateTimeline(campaignType: string): Milestone[] {
  const milestones: Milestone[] = [];

  // Planning phase (always first)
  milestones.push({
    phase: 'Planning & Strategy',
    duration: '2 weeks',
    activities: [
      'Finalize campaign strategy and messaging',
      'Create content calendar',
      'Set up tracking and analytics',
      'Prepare creative assets',
    ],
  });

  // Build phase
  milestones.push({
    phase: 'Build & Setup',
    duration: '2-3 weeks',
    activities: [
      'Develop landing pages and forms',
      'Create ad creative and copy',
      'Set up email automation',
      'Configure tracking pixels and conversions',
    ],
  });

  // Launch phase
  if (campaignType === 'Product Launch') {
    milestones.push({
      phase: 'Pre-Launch Teaser',
      duration: '1 week',
      activities: [
        'Release teaser content',
        'Build waitlist or early access program',
        'Generate anticipation on social media',
      ],
    });
  }

  milestones.push({
    phase: 'Launch & Activation',
    duration: '1 week',
    activities: [
      'Activate all paid campaigns',
      'Send launch emails',
      'Publish content across channels',
      'Monitor initial performance',
    ],
  });

  // Optimization phase
  milestones.push({
    phase: 'Optimization & Scale',
    duration: '4-6 weeks',
    activities: [
      'A/B test messaging and creative',
      'Optimize budget allocation based on performance',
      'Refine targeting and audiences',
      'Scale successful tactics',
    ],
  });

  // Analysis phase
  milestones.push({
    phase: 'Analysis & Reporting',
    duration: '1 week',
    activities: [
      'Compile performance metrics',
      'Analyze ROI and attribution',
      'Document learnings and insights',
      'Present results to stakeholders',
    ],
  });

  return milestones;
}

/**
 * Generate KPIs based on campaign type
 */
function generateKPIs(campaignType: string): KPI[] {
  const kpis: KPI[] = [];

  // Universal KPIs
  kpis.push({
    metric: 'Return on Ad Spend (ROAS)',
    target: '3:1 or higher',
    measurement: 'Revenue generated / Ad spend',
    priority: 'primary',
  });

  // Type-specific KPIs
  switch (campaignType) {
    case 'Brand Awareness':
      kpis.push({
        metric: 'Brand Awareness Lift',
        target: '20% increase',
        measurement: 'Pre/post campaign brand surveys',
        priority: 'primary',
      });
      kpis.push({
        metric: 'Reach & Impressions',
        target: '1M+ impressions',
        measurement: 'Ad platform analytics',
        priority: 'primary',
      });
      kpis.push({
        metric: 'Social Engagement Rate',
        target: '3%+ engagement',
        measurement: 'Likes, comments, shares / reach',
        priority: 'secondary',
      });
      break;

    case 'Lead Generation':
      kpis.push({
        metric: 'Marketing Qualified Leads (MQLs)',
        target: '500+ MQLs',
        measurement: 'CRM lead count with qualification criteria',
        priority: 'primary',
      });
      kpis.push({
        metric: 'Cost Per Lead (CPL)',
        target: 'Under $50',
        measurement: 'Total spend / leads generated',
        priority: 'primary',
      });
      kpis.push({
        metric: 'Lead-to-Opportunity Conversion',
        target: '25%+',
        measurement: 'Opportunities / MQLs',
        priority: 'secondary',
      });
      break;

    case 'Product Launch':
      kpis.push({
        metric: 'Sign-ups / Early Adopters',
        target: '1,000+ sign-ups',
        measurement: 'Product registration count',
        priority: 'primary',
      });
      kpis.push({
        metric: 'Launch Day Traffic',
        target: '10,000+ visits',
        measurement: 'Google Analytics traffic spike',
        priority: 'primary',
      });
      kpis.push({
        metric: 'Press Mentions',
        target: '20+ articles',
        measurement: 'Media monitoring tools',
        priority: 'secondary',
      });
      break;

    case 'Conversion/Sales':
      kpis.push({
        metric: 'Conversion Rate',
        target: '5%+ conversion',
        measurement: 'Conversions / visitors',
        priority: 'primary',
      });
      kpis.push({
        metric: 'Revenue Generated',
        target: 'Based on budget (3x+)',
        measurement: 'CRM attributed revenue',
        priority: 'primary',
      });
      kpis.push({
        metric: 'Customer Acquisition Cost (CAC)',
        target: 'Under $200',
        measurement: 'Total spend / new customers',
        priority: 'secondary',
      });
      break;

    case 'Customer Retention':
      kpis.push({
        metric: 'Customer Retention Rate',
        target: '90%+',
        measurement: 'Retained customers / total customers',
        priority: 'primary',
      });
      kpis.push({
        metric: 'Product Adoption Rate',
        target: '40%+ feature usage',
        measurement: 'Product analytics',
        priority: 'primary',
      });
      kpis.push({
        metric: 'Net Promoter Score (NPS)',
        target: '50+',
        measurement: 'Customer surveys',
        priority: 'secondary',
      });
      break;

    case 'Engagement':
      kpis.push({
        metric: 'Email Open Rate',
        target: '25%+',
        measurement: 'Email platform analytics',
        priority: 'primary',
      });
      kpis.push({
        metric: 'Content Engagement Time',
        target: '3+ minutes average',
        measurement: 'Google Analytics engagement metrics',
        priority: 'primary',
      });
      kpis.push({
        metric: 'Community Growth',
        target: '20% increase',
        measurement: 'Subscriber/follower growth rate',
        priority: 'secondary',
      });
      break;

    default:
      kpis.push({
        metric: 'Website Traffic',
        target: '50%+ increase',
        measurement: 'Google Analytics sessions',
        priority: 'primary',
      });
      kpis.push({
        metric: 'Lead Generation',
        target: '100+ leads',
        measurement: 'Form submissions and CRM entries',
        priority: 'secondary',
      });
  }

  return kpis;
}

/**
 * Generate success criteria
 */
function generateSuccessCriteria(campaignType: string): string[] {
  const criteria: string[] = [];

  criteria.push('Achieve or exceed all primary KPI targets');
  criteria.push('Maintain cost per acquisition within budget constraints');
  criteria.push('Generate positive ROI (minimum 3:1)');

  if (campaignType === 'Brand Awareness' || campaignType === 'Product Launch') {
    criteria.push('Achieve strong social media engagement and sentiment');
    criteria.push('Generate earned media coverage');
  } else if (campaignType === 'Lead Generation') {
    criteria.push('Deliver high-quality leads with strong sales acceptance rate');
    criteria.push('Build sustainable lead pipeline for future quarters');
  } else if (campaignType === 'Conversion/Sales') {
    criteria.push('Drive measurable revenue impact');
    criteria.push('Improve conversion funnel metrics');
  }

  criteria.push('Document learnings for future campaign optimization');

  return criteria;
}

/**
 * Campaign Brief Tool
 * Generates comprehensive marketing campaign briefs
 */
export const campaignBriefTool = tool({
  description:
    'Structure a comprehensive marketing campaign brief with objectives, target audience, messaging, channels, budget allocation, timeline, and KPIs. Provide the campaign goal, product name, and optional budget to generate a complete campaign strategy document.',
  inputSchema: jsonSchema<CampaignBriefInput>({
    type: 'object',
    properties: {
      campaignGoal: {
        type: 'string',
        description:
          'Primary campaign objective (e.g., "Generate 500 qualified leads", "Launch new product", "Increase brand awareness")',
      },
      product: {
        type: 'string',
        description: 'Product or service being promoted in the campaign',
      },
      budget: {
        type: 'number',
        description: 'Total campaign budget in dollars (optional)',
        minimum: 0,
      },
    },
    required: ['campaignGoal', 'product'],
    additionalProperties: false,
  }),
  async execute({ campaignGoal, product, budget }): Promise<CampaignBrief> {
    // Validate inputs
    if (!campaignGoal || typeof campaignGoal !== 'string' || campaignGoal.trim().length === 0) {
      throw new Error('Campaign goal is required and must be a non-empty string');
    }

    if (!product || typeof product !== 'string' || product.trim().length === 0) {
      throw new Error('Product is required and must be a non-empty string');
    }

    if (budget !== undefined && (typeof budget !== 'number' || budget < 0)) {
      throw new Error('Budget must be a positive number');
    }

    // Determine campaign type
    const campaignType = determineCampaignType(campaignGoal);

    // Generate campaign components
    const campaignName = generateCampaignName(product, campaignType);
    const goals = generateGoals(campaignGoal, campaignType);
    const targetAudience = generateAudienceSegments(campaignType, product);
    const messaging = generateMessaging(product, campaignGoal, campaignType);
    const channels = generateChannels(campaignType, budget);
    const budgetAllocation = generateBudgetAllocation(channels, budget);
    const timeline = generateTimeline(campaignType);
    const kpis = generateKPIs(campaignType);
    const successCriteria = generateSuccessCriteria(campaignType);

    return {
      campaignName,
      objective: campaignGoal.trim(),
      goals,
      targetAudience,
      messaging,
      channels,
      budget: budgetAllocation,
      timeline,
      kpis,
      successCriteria,
      metadata: {
        product: product.trim(),
        createdAt: new Date().toISOString(),
        campaignType,
      },
    };
  },
});

export default campaignBriefTool;
