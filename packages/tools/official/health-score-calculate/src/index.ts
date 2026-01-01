/**
 * Health Score Calculate Tool for TPMJS
 * Calculates customer health score from usage, support, payment, and engagement data
 */

import { jsonSchema, tool } from 'ai';

/**
 * Usage metrics for the customer
 */
export interface UsageMetrics {
  dailyActiveUsers?: number;
  monthlyActiveUsers?: number;
  featureAdoptionRate?: number;
  apiCallsPerDay?: number;
  lastLoginDate?: string;
}

/**
 * Support ticket metrics
 */
export interface SupportMetrics {
  openTickets?: number;
  totalTickets?: number;
  avgResolutionTime?: number;
  escalationRate?: number;
  csat?: number;
}

/**
 * Payment and billing metrics
 */
export interface PaymentMetrics {
  onTimePaymentRate?: number;
  outstandingBalance?: number;
  paymentFailures?: number;
  daysUntilRenewal?: number;
}

/**
 * Engagement metrics
 */
export interface EngagementMetrics {
  npsScore?: number;
  trainingCompleted?: number;
  communityActivity?: number;
  productFeedbackSubmitted?: number;
}

/**
 * Customer data input
 */
export interface Customer {
  id: string;
  name?: string;
  usage?: UsageMetrics;
  support?: SupportMetrics;
  payment?: PaymentMetrics;
  engagement?: EngagementMetrics;
  historicalScores?: HistoricalScore[];
}

/**
 * Component weights for health score calculation
 */
export interface ComponentWeights {
  usage: number;
  support: number;
  payment: number;
  engagement: number;
}

/**
 * Component score with details
 */
export interface ComponentScore {
  score: number;
  weight: number;
  weightedScore: number;
  factors: string[];
  concerns: string[];
}

/**
 * Historical score data for trend analysis
 */
export interface HistoricalScore {
  timestamp: string;
  overallScore: number;
}

/**
 * Health score output
 */
export interface HealthScore {
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  components: {
    usage: ComponentScore;
    support: ComponentScore;
    payment: ComponentScore;
    engagement: ComponentScore;
  };
  trend: 'improving' | 'stable' | 'declining';
  recommendations: string[];
  lastCalculated: string;
}

type HealthScoreCalculateInput = {
  customer: Customer;
  weights?: ComponentWeights;
};

/**
 * Validates customer object
 */
function validateCustomer(customer: unknown): customer is Customer {
  if (!customer || typeof customer !== 'object') {
    throw new Error('Customer must be an object');
  }

  const c = customer as Record<string, unknown>;

  if (!c.id || typeof c.id !== 'string' || c.id.trim().length === 0) {
    throw new Error('Customer must have a non-empty id');
  }

  return true;
}

/**
 * Calculates usage component score
 */
function calculateUsageScore(usage?: UsageMetrics, weight = 0.3): ComponentScore {
  const factors: string[] = [];
  const concerns: string[] = [];
  let score = 50; // Start at neutral

  if (!usage) {
    concerns.push('No usage data available');
    return { score: 50, weight, weightedScore: 50 * weight, factors, concerns };
  }

  // Daily/Monthly active users
  if (usage.monthlyActiveUsers !== undefined) {
    if (usage.monthlyActiveUsers > 50) {
      score += 20;
      factors.push('High monthly active users');
    } else if (usage.monthlyActiveUsers < 10) {
      score -= 15;
      concerns.push('Low monthly active users');
    }
  }

  // Feature adoption
  if (usage.featureAdoptionRate !== undefined) {
    if (usage.featureAdoptionRate > 0.7) {
      score += 15;
      factors.push('Strong feature adoption');
    } else if (usage.featureAdoptionRate < 0.3) {
      score -= 10;
      concerns.push('Low feature adoption rate');
    }
  }

  // Last login recency
  if (usage.lastLoginDate) {
    const daysSinceLogin = Math.floor(
      (Date.now() - new Date(usage.lastLoginDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLogin < 7) {
      score += 15;
      factors.push('Recent activity');
    } else if (daysSinceLogin > 30) {
      score -= 20;
      concerns.push('No recent login activity');
    }
  }

  // API usage
  if (usage.apiCallsPerDay !== undefined) {
    if (usage.apiCallsPerDay > 1000) {
      score += 10;
      factors.push('High API usage');
    } else if (usage.apiCallsPerDay < 10) {
      concerns.push('Low API usage');
    }
  }

  // Normalize to 0-100
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    weight,
    weightedScore: score * weight,
    factors,
    concerns,
  };
}

/**
 * Calculates support component score
 */
function calculateSupportScore(support?: SupportMetrics, weight = 0.25): ComponentScore {
  const factors: string[] = [];
  const concerns: string[] = [];
  let score = 70; // Start higher - fewer issues is good

  if (!support) {
    return { score: 70, weight, weightedScore: 70 * weight, factors, concerns };
  }

  // Open tickets
  if (support.openTickets !== undefined && support.totalTickets !== undefined) {
    const openRate = support.totalTickets > 0 ? support.openTickets / support.totalTickets : 0;
    if (openRate > 0.5) {
      score -= 20;
      concerns.push('High ratio of open tickets');
    } else if (openRate < 0.1) {
      score += 10;
      factors.push('Low open ticket rate');
    }
  }

  // Escalation rate
  if (support.escalationRate !== undefined) {
    if (support.escalationRate > 0.3) {
      score -= 15;
      concerns.push('High escalation rate');
    } else if (support.escalationRate < 0.1) {
      score += 10;
      factors.push('Low escalation rate');
    }
  }

  // CSAT score
  if (support.csat !== undefined) {
    if (support.csat > 4.5) {
      score += 15;
      factors.push('Excellent CSAT score');
    } else if (support.csat < 3.0) {
      score -= 20;
      concerns.push('Low customer satisfaction');
    }
  }

  // Total tickets volume
  if (support.totalTickets !== undefined) {
    if (support.totalTickets < 3) {
      factors.push('Low support burden');
    } else if (support.totalTickets > 20) {
      score -= 10;
      concerns.push('High volume of support tickets');
    }
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    weight,
    weightedScore: score * weight,
    factors,
    concerns,
  };
}

/**
 * Calculates payment component score
 */
function calculatePaymentScore(payment?: PaymentMetrics, weight = 0.25): ComponentScore {
  const factors: string[] = [];
  const concerns: string[] = [];
  let score = 80; // Start high - payment is critical

  if (!payment) {
    return { score: 80, weight, weightedScore: 80 * weight, factors, concerns };
  }

  // On-time payment rate
  if (payment.onTimePaymentRate !== undefined) {
    if (payment.onTimePaymentRate > 0.95) {
      score += 10;
      factors.push('Excellent payment history');
    } else if (payment.onTimePaymentRate < 0.8) {
      score -= 30;
      concerns.push('Poor payment history');
    }
  }

  // Outstanding balance
  if (payment.outstandingBalance !== undefined && payment.outstandingBalance > 0) {
    score -= 15;
    concerns.push('Outstanding balance exists');
  }

  // Payment failures
  if (payment.paymentFailures !== undefined && payment.paymentFailures > 0) {
    score -= 20;
    concerns.push('Recent payment failures');
  }

  // Renewal proximity
  if (payment.daysUntilRenewal !== undefined) {
    if (payment.daysUntilRenewal < 30 && payment.daysUntilRenewal > 0) {
      factors.push('Renewal approaching');
    } else if (payment.daysUntilRenewal < 0) {
      score -= 25;
      concerns.push('Contract expired');
    }
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    weight,
    weightedScore: score * weight,
    factors,
    concerns,
  };
}

/**
 * Calculates engagement component score
 */
function calculateEngagementScore(engagement?: EngagementMetrics, weight = 0.2): ComponentScore {
  const factors: string[] = [];
  const concerns: string[] = [];
  let score = 50;

  if (!engagement) {
    concerns.push('No engagement data available');
    return { score: 50, weight, weightedScore: 50 * weight, factors, concerns };
  }

  // NPS score
  if (engagement.npsScore !== undefined) {
    if (engagement.npsScore > 50) {
      score += 25;
      factors.push('High NPS score');
    } else if (engagement.npsScore < 0) {
      score -= 20;
      concerns.push('Negative NPS score');
    }
  }

  // Training completion
  if (engagement.trainingCompleted !== undefined) {
    if (engagement.trainingCompleted > 5) {
      score += 15;
      factors.push('Strong training engagement');
    } else if (engagement.trainingCompleted === 0) {
      concerns.push('No training completed');
    }
  }

  // Community activity
  if (engagement.communityActivity !== undefined) {
    if (engagement.communityActivity > 10) {
      score += 10;
      factors.push('Active in community');
    }
  }

  // Product feedback
  if (engagement.productFeedbackSubmitted !== undefined) {
    if (engagement.productFeedbackSubmitted > 3) {
      score += 10;
      factors.push('Provides product feedback');
    }
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    weight,
    weightedScore: score * weight,
    factors,
    concerns,
  };
}

/**
 * Determines risk level from overall score
 */
function determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 75) return 'low';
  if (score >= 60) return 'medium';
  if (score >= 40) return 'high';
  return 'critical';
}

/**
 * Generates recommendations based on component scores
 */
function generateRecommendations(components: HealthScore['components']): string[] {
  const recommendations: string[] = [];

  // Usage recommendations
  if (components.usage.score < 60) {
    if (components.usage.concerns.includes('No recent login activity')) {
      recommendations.push('Schedule a check-in call to re-engage the customer');
    }
    if (components.usage.concerns.includes('Low feature adoption rate')) {
      recommendations.push('Offer product training to improve feature adoption');
    }
  }

  // Support recommendations
  if (components.support.score < 60) {
    if (components.support.concerns.includes('High ratio of open tickets')) {
      recommendations.push('Prioritize resolution of open tickets');
    }
    if (components.support.concerns.includes('Low customer satisfaction')) {
      recommendations.push('Conduct a satisfaction survey to identify pain points');
    }
  }

  // Payment recommendations
  if (components.payment.score < 70) {
    if (components.payment.concerns.includes('Outstanding balance exists')) {
      recommendations.push('Follow up on outstanding balance immediately');
    }
    if (components.payment.concerns.includes('Recent payment failures')) {
      recommendations.push('Contact customer to resolve payment issues');
    }
  }

  // Engagement recommendations
  if (components.engagement.score < 50) {
    if (components.engagement.concerns.includes('No training completed')) {
      recommendations.push('Invite customer to onboarding or training sessions');
    }
    if (components.engagement.concerns.includes('Negative NPS score')) {
      recommendations.push('Schedule executive review to address concerns');
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('Continue monitoring customer health metrics');
    recommendations.push('Schedule regular business reviews to maintain relationship');
  }

  return recommendations;
}

/**
 * Determines trend by analyzing historical score data
 */
function determineTrend(
  currentScore: number,
  historicalScores?: HistoricalScore[]
): 'improving' | 'stable' | 'declining' {
  // If no historical data, use stable as default
  if (!historicalScores || historicalScores.length === 0) {
    return 'stable';
  }

  // Sort by timestamp (most recent first)
  const sorted = [...historicalScores].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Use up to last 3 scores for trend analysis
  const recentScores = sorted.slice(0, 3).map((s) => s.overallScore);

  if (recentScores.length === 0) {
    return 'stable';
  }

  // Calculate average of recent historical scores
  const avgHistorical = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;

  // Compare current score to historical average
  const difference = currentScore - avgHistorical;

  // Thresholds for trend determination
  if (difference > 5) return 'improving';
  if (difference < -5) return 'declining';
  return 'stable';
}

/**
 * Health Score Calculate Tool
 * Calculates customer health score from usage, support, payment, and engagement data
 */
export const healthScoreCalculateTool = tool({
  description:
    'Calculates a comprehensive customer health score from usage, support, payment, and engagement data. Provides weighted component scores, risk assessment, and actionable recommendations for customer success teams.',
  inputSchema: jsonSchema<HealthScoreCalculateInput>({
    type: 'object',
    properties: {
      customer: {
        type: 'object',
        description: 'Customer data with usage, support, payment, and engagement metrics',
        properties: {
          id: {
            type: 'string',
            description: 'Customer unique identifier',
          },
          name: {
            type: 'string',
            description: 'Customer name',
          },
          usage: {
            type: 'object',
            description: 'Product usage metrics',
            properties: {
              dailyActiveUsers: { type: 'number' },
              monthlyActiveUsers: { type: 'number' },
              featureAdoptionRate: { type: 'number', description: 'Percentage as decimal (0-1)' },
              apiCallsPerDay: { type: 'number' },
              lastLoginDate: { type: 'string', description: 'ISO date string' },
            },
          },
          support: {
            type: 'object',
            description: 'Support ticket metrics',
            properties: {
              openTickets: { type: 'number' },
              totalTickets: { type: 'number' },
              avgResolutionTime: { type: 'number', description: 'Hours' },
              escalationRate: { type: 'number', description: 'Percentage as decimal (0-1)' },
              csat: { type: 'number', description: 'Customer satisfaction score (1-5)' },
            },
          },
          payment: {
            type: 'object',
            description: 'Payment and billing metrics',
            properties: {
              onTimePaymentRate: { type: 'number', description: 'Percentage as decimal (0-1)' },
              outstandingBalance: { type: 'number' },
              paymentFailures: { type: 'number' },
              daysUntilRenewal: { type: 'number' },
            },
          },
          engagement: {
            type: 'object',
            description: 'Customer engagement metrics',
            properties: {
              npsScore: { type: 'number', description: 'Net Promoter Score (-100 to 100)' },
              trainingCompleted: { type: 'number' },
              communityActivity: { type: 'number' },
              productFeedbackSubmitted: { type: 'number' },
            },
          },
          historicalScores: {
            type: 'array',
            description: 'Historical health scores for trend analysis',
            items: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', description: 'ISO date string' },
                overallScore: { type: 'number', description: 'Overall health score (0-100)' },
              },
              required: ['timestamp', 'overallScore'],
            },
          },
        },
        required: ['id'],
      },
      weights: {
        type: 'object',
        description: 'Component weights for health score calculation (must sum to 1.0)',
        properties: {
          usage: { type: 'number', description: 'Weight for usage metrics (default 0.3)' },
          support: { type: 'number', description: 'Weight for support metrics (default 0.25)' },
          payment: { type: 'number', description: 'Weight for payment metrics (default 0.25)' },
          engagement: {
            type: 'number',
            description: 'Weight for engagement metrics (default 0.2)',
          },
        },
        required: ['usage', 'support', 'payment', 'engagement'],
      },
    },
    required: ['customer'],
    additionalProperties: false,
  }),
  async execute({ customer, weights }): Promise<HealthScore> {
    // Validate customer
    validateCustomer(customer);

    // Use default weights if not provided
    const componentWeights: ComponentWeights = weights || {
      usage: 0.3,
      support: 0.25,
      payment: 0.25,
      engagement: 0.2,
    };

    // Validate weights sum to 1.0 (within tolerance)
    const weightSum =
      componentWeights.usage +
      componentWeights.support +
      componentWeights.payment +
      componentWeights.engagement;
    if (Math.abs(weightSum - 1.0) > 0.01) {
      throw new Error(`Component weights must sum to 1.0, got ${weightSum}`);
    }

    // Calculate component scores with explicit weights
    const usage = calculateUsageScore(customer.usage, componentWeights.usage);
    const support = calculateSupportScore(customer.support, componentWeights.support);
    const payment = calculatePaymentScore(customer.payment, componentWeights.payment);
    const engagement = calculateEngagementScore(customer.engagement, componentWeights.engagement);

    // Calculate overall weighted score
    const overallScore = Math.round(
      usage.weightedScore + support.weightedScore + payment.weightedScore + engagement.weightedScore
    );

    const components = { usage, support, payment, engagement };
    const riskLevel = determineRiskLevel(overallScore);
    const trend = determineTrend(overallScore, customer.historicalScores);
    const recommendations = generateRecommendations(components);

    return {
      overallScore,
      riskLevel,
      components,
      trend,
      recommendations,
      lastCalculated: new Date().toISOString(),
    };
  },
});

export default healthScoreCalculateTool;
