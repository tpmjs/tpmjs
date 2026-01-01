/**
 * Churn Risk Scoring Tool for TPMJS
 * Scores customer churn risk based on usage, engagement, and support signals
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 * Uses jsonSchema() to avoid Zod 4 JSON Schema conversion issues with OpenAI
 */

import { jsonSchema, tool } from 'ai';

export interface CustomerData {
  id: string;
  name: string;
  subscriptionStartDate: string;
  lastLoginDate?: string;
  loginCount30Days?: number;
  activeUsersCount?: number;
  totalSeats?: number;
  supportTicketsCount30Days?: number;
  negativeTicketsCount30Days?: number;
  npsScore?: number;
  billingIssues?: boolean;
  contractEndDate?: string;
}

export interface RiskFactor {
  factor: string;
  impact: 'high' | 'medium' | 'low';
  score: number;
  description: string;
}

export interface ChurnRiskScore {
  customerId: string;
  customerName: string;
  riskScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  riskFactors: RiskFactor[];
  recommendations: string[];
  summary: string;
}

/**
 * Input type for Churn Risk Score Tool
 */
type ChurnRiskScoreInput = {
  customer: CustomerData;
};

/**
 * Calculate days between two dates
 */
function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * Calculate usage risk score
 */
// Domain rule: usage_recency - Customers inactive >30 days have high churn risk, >14 days medium risk
function calculateUsageRisk(customer: CustomerData): RiskFactor[] {
  const factors: RiskFactor[] = [];

  // Last login recency
  if (customer.lastLoginDate) {
    const daysSinceLogin = daysBetween(customer.lastLoginDate, new Date().toISOString());

    if (daysSinceLogin > 30) {
      factors.push({
        factor: 'Inactive User',
        impact: 'high',
        score: 25,
        description: `No login in ${Math.round(daysSinceLogin)} days`,
      });
    } else if (daysSinceLogin > 14) {
      factors.push({
        factor: 'Low Activity',
        impact: 'medium',
        score: 15,
        description: `Last login ${Math.round(daysSinceLogin)} days ago`,
      });
    }
  }

  // Domain rule: login_frequency - <5 logins per month indicates low engagement and churn risk
  // Login frequency
  if (customer.loginCount30Days !== undefined) {
    if (customer.loginCount30Days === 0) {
      factors.push({
        factor: 'Zero Logins',
        impact: 'high',
        score: 30,
        description: 'No logins in the last 30 days',
      });
    } else if (customer.loginCount30Days < 5) {
      factors.push({
        factor: 'Low Login Frequency',
        impact: 'medium',
        score: 15,
        description: `Only ${customer.loginCount30Days} logins in 30 days`,
      });
    }
  }

  // Domain rule: seat_utilization - <30% seat usage indicates product not meeting needs
  // Seat utilization
  if (customer.activeUsersCount !== undefined && customer.totalSeats !== undefined) {
    const utilization = customer.activeUsersCount / customer.totalSeats;
    if (utilization < 0.3) {
      factors.push({
        factor: 'Low Seat Utilization',
        impact: 'medium',
        score: 12,
        description: `Only ${Math.round(utilization * 100)}% of seats are active`,
      });
    }
  }

  return factors;
}

/**
 * Calculate engagement risk score
 */
// Domain rule: nps_classification - NPS ≤6 are detractors (high risk), 7-8 are passives (medium risk), 9-10 are promoters (low risk)
function calculateEngagementRisk(customer: CustomerData): RiskFactor[] {
  const factors: RiskFactor[] = [];

  // NPS score
  if (customer.npsScore !== undefined) {
    if (customer.npsScore <= 6) {
      factors.push({
        factor: 'Detractor (NPS)',
        impact: 'high',
        score: 20,
        description: `NPS score of ${customer.npsScore} indicates dissatisfaction`,
      });
    } else if (customer.npsScore <= 8) {
      factors.push({
        factor: 'Passive (NPS)',
        impact: 'medium',
        score: 10,
        description: `NPS score of ${customer.npsScore} shows passive satisfaction`,
      });
    }
  }

  // Contract end date proximity
  if (customer.contractEndDate) {
    const daysUntilEnd = daysBetween(new Date().toISOString(), customer.contractEndDate);
    if (daysUntilEnd < 30) {
      factors.push({
        factor: 'Contract Ending Soon',
        impact: 'high',
        score: 15,
        description: `Contract ends in ${Math.round(daysUntilEnd)} days`,
      });
    } else if (daysUntilEnd < 60) {
      factors.push({
        factor: 'Contract Renewal Approaching',
        impact: 'medium',
        score: 8,
        description: `Contract ends in ${Math.round(daysUntilEnd)} days`,
      });
    }
  }

  return factors;
}

/**
 * Calculate support risk score
 */
function calculateSupportRisk(customer: CustomerData): RiskFactor[] {
  const factors: RiskFactor[] = [];

  // Support ticket volume
  if (customer.supportTicketsCount30Days !== undefined) {
    if (customer.supportTicketsCount30Days > 10) {
      factors.push({
        factor: 'High Support Volume',
        impact: 'medium',
        score: 12,
        description: `${customer.supportTicketsCount30Days} support tickets in 30 days`,
      });
    }
  }

  // Negative support tickets
  if (
    customer.negativeTicketsCount30Days !== undefined &&
    customer.negativeTicketsCount30Days > 0
  ) {
    factors.push({
      factor: 'Negative Support Experience',
      impact: 'high',
      score: 18,
      description: `${customer.negativeTicketsCount30Days} negative support tickets`,
    });
  }

  // Billing issues
  if (customer.billingIssues) {
    factors.push({
      factor: 'Billing Issues',
      impact: 'high',
      score: 20,
      description: 'Active billing or payment issues',
    });
  }

  return factors;
}

/**
 * Generate recommendations based on risk factors
 */
function generateRecommendations(factors: RiskFactor[]): string[] {
  const recommendations: string[] = [];

  const factorNames = factors.map((f) => f.factor);

  if (factorNames.includes('Inactive User') || factorNames.includes('Zero Logins')) {
    recommendations.push('Schedule an urgent check-in call to understand barriers to adoption');
  }

  if (factorNames.includes('Detractor (NPS)')) {
    recommendations.push('Escalate to account manager for immediate intervention');
  }

  if (factorNames.includes('Low Seat Utilization')) {
    recommendations.push('Offer onboarding sessions to increase team adoption');
  }

  if (factorNames.includes('Negative Support Experience')) {
    recommendations.push('Review support tickets and follow up on unresolved issues');
  }

  if (factorNames.includes('Billing Issues')) {
    recommendations.push('Resolve billing issues immediately - top churn indicator');
  }

  if (factorNames.includes('Contract Ending Soon')) {
    recommendations.push('Initiate renewal conversation with decision maker');
  }

  if (factorNames.includes('High Support Volume')) {
    recommendations.push('Identify root cause of support issues and provide proactive solutions');
  }

  if (recommendations.length === 0) {
    recommendations.push('Continue regular engagement and monitor for changes in usage patterns');
  }

  return recommendations;
}

/**
 * Churn Risk Score Tool
 * Scores customer churn risk based on multiple signals
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 */
export const churnRiskScoreTool = tool({
  description:
    'Scores customer churn risk based on usage, engagement, and support signals. Provides risk score (0-100) with detailed contributing factors and recommendations.',
  inputSchema: jsonSchema<ChurnRiskScoreInput>({
    type: 'object',
    properties: {
      customer: {
        type: 'object',
        description: 'Customer data with activity metrics',
        properties: {
          id: { type: 'string', description: 'Customer ID' },
          name: { type: 'string', description: 'Customer name' },
          subscriptionStartDate: {
            type: 'string',
            description: 'Subscription start date (ISO format)',
          },
          lastLoginDate: { type: 'string', description: 'Last login date (ISO format)' },
          loginCount30Days: { type: 'number', description: 'Number of logins in last 30 days' },
          activeUsersCount: { type: 'number', description: 'Number of active users' },
          totalSeats: { type: 'number', description: 'Total licensed seats' },
          supportTicketsCount30Days: {
            type: 'number',
            description: 'Support tickets in last 30 days',
          },
          negativeTicketsCount30Days: {
            type: 'number',
            description: 'Negative support tickets in last 30 days',
          },
          npsScore: { type: 'number', description: 'NPS score (0-10)' },
          billingIssues: {
            type: 'boolean',
            description: 'Whether there are active billing issues',
          },
          contractEndDate: { type: 'string', description: 'Contract end date (ISO format)' },
        },
        required: ['id', 'name', 'subscriptionStartDate'],
      },
    },
    required: ['customer'],
    additionalProperties: false,
  }),
  async execute({ customer }) {
    // Validate required fields
    if (!customer.id || !customer.name) {
      throw new Error('Customer ID and name are required');
    }

    // Calculate risk factors from different signals
    const usageFactors = calculateUsageRisk(customer);
    const engagementFactors = calculateEngagementRisk(customer);
    const supportFactors = calculateSupportRisk(customer);

    const allFactors = [...usageFactors, ...engagementFactors, ...supportFactors];

    // Calculate total risk score (0-100)
    const totalScore = Math.min(
      100,
      allFactors.reduce((sum, factor) => sum + factor.score, 0)
    );

    // Determine risk level
    let riskLevel: 'critical' | 'high' | 'medium' | 'low';
    if (totalScore >= 70) {
      riskLevel = 'critical';
    } else if (totalScore >= 50) {
      riskLevel = 'high';
    } else if (totalScore >= 25) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    // Generate recommendations
    const recommendations = generateRecommendations(allFactors);

    // Create summary
    const highImpactFactors = allFactors.filter((f) => f.impact === 'high');
    let summary = `${customer.name} has a ${riskLevel} churn risk with a score of ${totalScore}/100.`;

    if (highImpactFactors.length > 0) {
      summary += ` Key concerns: ${highImpactFactors.map((f) => f.factor).join(', ')}.`;
    } else {
      summary += ' No critical risk factors identified.';
    }

    return {
      customerId: customer.id,
      customerName: customer.name,
      riskScore: totalScore,
      riskLevel,
      riskFactors: allFactors,
      recommendations,
      summary,
    };
  },
});

/**
 * Export default for convenience
 */
export default churnRiskScoreTool;
