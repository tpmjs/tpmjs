/**
 * Lead Score Tool for TPMJS
 * Scores leads based on engagement signals like email opens, page visits, form fills, and company fit.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Engagement activity entry
 */
export interface EngagementActivity {
  type: 'email_open' | 'email_click' | 'page_visit' | 'form_fill' | 'download' | 'demo_request';
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * Company fit information
 */
export interface CompanyFit {
  size?: number; // Number of employees
  industry?: string;
  revenue?: number;
  location?: string;
}

/**
 * Lead data input
 */
export interface LeadData {
  name: string;
  email: string;
  company?: string;
  companyFit?: CompanyFit;
  engagementHistory?: EngagementActivity[];
  source?: string;
}

/**
 * Score breakdown by category
 */
export interface ScoreBreakdown {
  engagement: number; // 0-40 points
  companyFit: number; // 0-30 points
  recency: number; // 0-20 points
  source: number; // 0-10 points
}

/**
 * Lead score output
 */
export interface LeadScore {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  breakdown: ScoreBreakdown;
  signals: string[];
  recommendation: string;
  metadata: {
    leadName: string;
    leadEmail: string;
    scoredAt: string;
  };
}

type LeadScoreInput = {
  lead: LeadData;
};

/**
 * Calculate engagement score based on activity history
 */
function calculateEngagementScore(activities: EngagementActivity[] = []): {
  score: number;
  signals: string[];
} {
  const signals: string[] = [];
  let score = 0;

  // Count activity types
  const emailOpens = activities.filter((a) => a.type === 'email_open').length;
  const emailClicks = activities.filter((a) => a.type === 'email_click').length;
  const pageVisits = activities.filter((a) => a.type === 'page_visit').length;
  const formFills = activities.filter((a) => a.type === 'form_fill').length;
  const downloads = activities.filter((a) => a.type === 'download').length;
  const demoRequests = activities.filter((a) => a.type === 'demo_request').length;

  // Domain rule: engagement_scoring - Demo requests worth 15 points as highest intent signals
  // High-value activities (demo requests, form fills)
  if (demoRequests > 0) {
    score += 15;
    signals.push(`${demoRequests} demo request${demoRequests > 1 ? 's' : ''}`);
  }
  // Domain rule: engagement_scoring - Form fills worth up to 10 points (3 points each, capped)
  if (formFills > 0) {
    score += Math.min(10, formFills * 3);
    signals.push(`${formFills} form submission${formFills > 1 ? 's' : ''}`);
  }

  // Domain rule: engagement_scoring - Downloads worth up to 8 points (2 points each, capped)
  // Medium-value activities (downloads, email clicks)
  if (downloads > 0) {
    score += Math.min(8, downloads * 2);
    signals.push(`${downloads} content download${downloads > 1 ? 's' : ''}`);
  }
  // Domain rule: engagement_scoring - Email clicks worth up to 5 points (1 point each, capped)
  if (emailClicks > 0) {
    score += Math.min(5, emailClicks * 1);
    signals.push(`${emailClicks} email click${emailClicks > 1 ? 's' : ''}`);
  }

  // Domain rule: engagement_scoring - Page visits worth up to 5 points (requires 3+ visits, scaled by half visit count)
  // Lower-value activities (page visits, email opens)
  if (pageVisits > 2) {
    score += Math.min(5, Math.floor(pageVisits / 2));
    signals.push(`${pageVisits} page visits`);
  }
  // Domain rule: engagement_scoring - Email opens worth up to 3 points (requires 3+ opens, scaled by third of open count)
  if (emailOpens > 2) {
    score += Math.min(3, Math.floor(emailOpens / 3));
    signals.push(`${emailOpens} email opens`);
  }

  // Domain rule: engagement_scoring - Total engagement score capped at 40 points maximum
  return { score: Math.min(40, score), signals };
}

/**
 * Calculate company fit score
 */
function calculateCompanyFitScore(fit?: CompanyFit): { score: number; signals: string[] } {
  if (!fit) {
    return { score: 0, signals: [] };
  }

  const signals: string[] = [];
  let score = 0;

  // Domain rule: company_fit_scoring - Company size scored 0-15 points based on employee count tiers
  // Company size (0-15 points)
  if (fit.size) {
    // Domain rule: company_fit_scoring - Enterprise (1000+) worth 15 points as highest value segment
    if (fit.size >= 1000) {
      score += 15;
      signals.push('Enterprise-size company (1000+ employees)');
    } else if (fit.size >= 200) {
      score += 12;
      signals.push('Mid-market company (200-999 employees)');
    } else if (fit.size >= 50) {
      score += 8;
      signals.push('Small business (50-199 employees)');
    } else if (fit.size >= 10) {
      score += 5;
      signals.push('Small company (10-49 employees)');
    }
  }

  // Domain rule: company_fit_scoring - Revenue scored 0-10 points based on annual revenue tiers
  // Revenue (0-10 points)
  if (fit.revenue) {
    // Domain rule: company_fit_scoring - $100M+ revenue worth 10 points indicating strong purchasing power
    if (fit.revenue >= 100000000) {
      // $100M+
      score += 10;
      signals.push('High revenue ($100M+)');
    } else if (fit.revenue >= 10000000) {
      // $10M+
      score += 7;
      signals.push('Medium revenue ($10M-$100M)');
    } else if (fit.revenue >= 1000000) {
      // $1M+
      score += 4;
      signals.push('Growing revenue ($1M-$10M)');
    }
  }

  // Industry presence (0-5 points)
  if (fit.industry) {
    score += 5;
    signals.push(`Industry: ${fit.industry}`);
  }

  return { score: Math.min(30, score), signals };
}

/**
 * Calculate recency score based on most recent activity
 */
function calculateRecencyScore(activities: EngagementActivity[] = []): {
  score: number;
  signals: string[];
} {
  if (activities.length === 0) {
    return { score: 0, signals: [] };
  }

  const signals: string[] = [];

  // Sort by timestamp descending
  const sorted = [...activities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const mostRecent = sorted[0];
  if (!mostRecent) {
    return { score: 0, signals: [] };
  }

  const now = new Date();
  const lastActivity = new Date(mostRecent.timestamp);
  const daysSince = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

  let score = 0;
  if (daysSince <= 1) {
    score = 20;
    signals.push('Active today');
  } else if (daysSince <= 3) {
    score = 17;
    signals.push('Active in last 3 days');
  } else if (daysSince <= 7) {
    score = 14;
    signals.push('Active in last week');
  } else if (daysSince <= 14) {
    score = 10;
    signals.push('Active in last 2 weeks');
  } else if (daysSince <= 30) {
    score = 6;
    signals.push('Active in last month');
  } else {
    score = 2;
    signals.push(`Last active ${daysSince} days ago`);
  }

  return { score, signals };
}

/**
 * Calculate source score
 */
function calculateSourceScore(source?: string): { score: number; signals: string[] } {
  if (!source) {
    return { score: 0, signals: [] };
  }

  const signals: string[] = [];
  let score = 0;

  const lowerSource = source.toLowerCase();

  if (lowerSource.includes('referral') || lowerSource.includes('partner')) {
    score = 10;
    signals.push('Referral/partner source');
  } else if (lowerSource.includes('direct') || lowerSource.includes('organic')) {
    score = 8;
    signals.push('Direct/organic traffic');
  } else if (lowerSource.includes('paid') || lowerSource.includes('ad')) {
    score = 6;
    signals.push('Paid acquisition');
  } else if (lowerSource.includes('social')) {
    score = 4;
    signals.push('Social media source');
  } else {
    score = 3;
    signals.push(`Source: ${source}`);
  }

  return { score, signals };
}

/**
 * Determine grade from score
 */
function determineGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

/**
 * Generate recommendation based on score and grade
 */
function generateRecommendation(_score: number, grade: string, breakdown: ScoreBreakdown): string {
  if (grade === 'A') {
    return 'High-priority lead. Immediate sales outreach recommended. Consider assigning to senior sales rep and scheduling demo within 24-48 hours.';
  }

  if (grade === 'B') {
    return 'Qualified lead. Sales follow-up recommended within 3-5 days. Nurture with targeted content and case studies.';
  }

  if (grade === 'C') {
    if (breakdown.engagement >= 15) {
      return 'Engaged but not qualified yet. Continue nurture campaign with educational content. Re-evaluate after 2 weeks.';
    }
    return 'Moderate interest. Add to nurture campaign. Focus on building engagement before direct sales contact.';
  }

  if (grade === 'D') {
    return 'Low qualification. Add to long-term nurture campaign. Focus on educational content to build interest.';
  }

  return 'Unqualified lead. Monitor engagement but deprioritize for active outreach. Consider re-engagement campaign if no activity in 30 days.';
}

/**
 * Lead Score Tool
 * Scores leads based on engagement, company fit, recency, and source
 */
export const leadScoreTool = tool({
  description:
    'Score leads based on engagement signals (email opens, page visits, form fills), company fit (size, revenue, industry), recency of activity, and lead source. Returns a score from 0-100, grade (A-F), detailed breakdown, and recommendations for sales follow-up.',
  inputSchema: jsonSchema<LeadScoreInput>({
    type: 'object',
    properties: {
      lead: {
        type: 'object',
        description: 'Lead information with engagement history and company fit data',
        properties: {
          name: {
            type: 'string',
            description: "Lead's full name",
          },
          email: {
            type: 'string',
            description: "Lead's email address",
          },
          company: {
            type: 'string',
            description: "Lead's company name (optional)",
          },
          companyFit: {
            type: 'object',
            description: 'Company fit information (optional)',
            properties: {
              size: {
                type: 'number',
                description: 'Number of employees',
              },
              industry: {
                type: 'string',
                description: 'Industry/sector',
              },
              revenue: {
                type: 'number',
                description: 'Annual revenue in dollars',
              },
              location: {
                type: 'string',
                description: 'Company location',
              },
            },
          },
          engagementHistory: {
            type: 'array',
            description: 'Array of engagement activities',
            items: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: [
                    'email_open',
                    'email_click',
                    'page_visit',
                    'form_fill',
                    'download',
                    'demo_request',
                  ],
                  description: 'Type of engagement activity',
                },
                timestamp: {
                  type: 'string',
                  description: 'ISO 8601 timestamp of activity',
                },
                metadata: {
                  type: 'object',
                  description: 'Additional activity metadata (optional)',
                },
              },
              required: ['type', 'timestamp'],
            },
          },
          source: {
            type: 'string',
            description: 'Lead source (e.g., "organic", "paid ads", "referral")',
          },
        },
        required: ['name', 'email'],
      },
    },
    required: ['lead'],
    additionalProperties: false,
  }),
  async execute({ lead }): Promise<LeadScore> {
    // Validate inputs
    if (!lead || typeof lead !== 'object') {
      throw new Error('Lead data is required');
    }

    if (!lead.name || typeof lead.name !== 'string' || lead.name.trim().length === 0) {
      throw new Error('Lead name is required and must be a non-empty string');
    }

    if (!lead.email || typeof lead.email !== 'string' || lead.email.trim().length === 0) {
      throw new Error('Lead email is required and must be a non-empty string');
    }

    // Calculate individual scores
    const engagementResult = calculateEngagementScore(lead.engagementHistory);
    const companyFitResult = calculateCompanyFitScore(lead.companyFit);
    const recencyResult = calculateRecencyScore(lead.engagementHistory);
    const sourceResult = calculateSourceScore(lead.source);

    // Build breakdown
    const breakdown: ScoreBreakdown = {
      engagement: engagementResult.score,
      companyFit: companyFitResult.score,
      recency: recencyResult.score,
      source: sourceResult.score,
    };

    // Calculate total score
    const totalScore = Math.min(
      100,
      breakdown.engagement + breakdown.companyFit + breakdown.recency + breakdown.source
    );

    // Determine grade
    const grade = determineGrade(totalScore);

    // Collect all signals
    const signals = [
      ...engagementResult.signals,
      ...companyFitResult.signals,
      ...recencyResult.signals,
      ...sourceResult.signals,
    ];

    // Generate recommendation
    const recommendation = generateRecommendation(totalScore, grade, breakdown);

    return {
      score: totalScore,
      grade,
      breakdown,
      signals,
      recommendation,
      metadata: {
        leadName: lead.name.trim(),
        leadEmail: lead.email.trim(),
        scoredAt: new Date().toISOString(),
      },
    };
  },
});

export default leadScoreTool;
