/**
 * Renewal Forecast Tool for TPMJS
 * Forecasts renewal likelihood based on health score and engagement patterns
 */

import { jsonSchema, tool } from 'ai';

/**
 * Account information for renewal forecasting
 */
export interface Account {
  id: string;
  name?: string;
  healthScore?: number;
  renewalDate: string;
  contractValue?: number;
  tier?: 'free' | 'basic' | 'premium' | 'enterprise';
  daysToRenewal?: number;
  engagementHistory?: {
    lastContactDate?: string;
    executiveSponsor?: boolean;
    qbrCompleted?: boolean;
    supportTickets30d?: number;
    usageTrend?: 'increasing' | 'stable' | 'decreasing';
  };
}

/**
 * Risk factor affecting renewal
 */
export interface RiskFactor {
  factor: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

/**
 * Recommended action to improve renewal likelihood
 */
export interface RecommendedAction {
  action: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expectedImpact: string;
  timeline: string;
}

/**
 * Renewal forecast output
 */
export interface RenewalForecast {
  renewalLikelihood: number;
  confidence: 'low' | 'medium' | 'high';
  outcome: 'likely-renew' | 'at-risk' | 'high-risk' | 'churn-likely';
  riskFactors: RiskFactor[];
  positiveSignals: string[];
  recommendedActions: RecommendedAction[];
  forecastDate: string;
  accountSummary: {
    daysToRenewal: number;
    contractValue: number;
    currentHealthScore: number;
  };
}

type RenewalForecastInput = {
  account: Account;
};

/**
 * Validates account object
 */
function validateAccount(account: unknown): account is Account {
  if (!account || typeof account !== 'object') {
    throw new Error('Account must be an object');
  }

  const a = account as Record<string, unknown>;

  if (!a.id || typeof a.id !== 'string' || a.id.trim().length === 0) {
    throw new Error('Account must have a non-empty id');
  }

  if (!a.renewalDate || typeof a.renewalDate !== 'string') {
    throw new Error('Account must have a renewalDate');
  }

  // Validate date format
  const renewalDate = new Date(a.renewalDate as string);
  if (Number.isNaN(renewalDate.getTime())) {
    throw new Error('renewalDate must be a valid date string');
  }

  if (a.healthScore !== undefined) {
    if (typeof a.healthScore !== 'number' || a.healthScore < 0 || a.healthScore > 100) {
      throw new Error('healthScore must be a number between 0 and 100');
    }
  }

  return true;
}

/**
 * Calculates days until renewal
 */
function calculateDaysToRenewal(renewalDate: string): number {
  const now = new Date();
  const renewal = new Date(renewalDate);
  const diffTime = renewal.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculates base renewal likelihood from health score
 */
function calculateBaseLikelihood(healthScore: number): number {
  // Higher health score = higher renewal likelihood
  // 100 health score = 95% likelihood
  // 75 health score = 80% likelihood
  // 50 health score = 50% likelihood
  // 25 health score = 25% likelihood
  // 0 health score = 10% likelihood

  if (healthScore >= 90) return 95;
  if (healthScore >= 75) return 80;
  if (healthScore >= 60) return 65;
  if (healthScore >= 50) return 50;
  if (healthScore >= 40) return 35;
  if (healthScore >= 25) return 25;
  return 10;
}

/**
 * Identifies risk factors
 */
function identifyRiskFactors(account: Account, daysToRenewal: number): RiskFactor[] {
  const factors: RiskFactor[] = [];

  // Health score risks
  if (account.healthScore !== undefined) {
    if (account.healthScore < 40) {
      factors.push({
        factor: 'Critical Health Score',
        impact: 'critical',
        description: `Health score of ${account.healthScore} indicates serious issues`,
      });
    } else if (account.healthScore < 60) {
      factors.push({
        factor: 'Low Health Score',
        impact: 'high',
        description: `Health score of ${account.healthScore} below healthy threshold`,
      });
    }
  } else {
    factors.push({
      factor: 'No Health Score Data',
      impact: 'medium',
      description: 'Unable to assess customer health without metrics',
    });
  }

  // Engagement risks
  if (account.engagementHistory) {
    const { lastContactDate, executiveSponsor, qbrCompleted, supportTickets30d, usageTrend } =
      account.engagementHistory;

    if (lastContactDate) {
      const daysSinceContact = Math.floor(
        (Date.now() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceContact > 60) {
        factors.push({
          factor: 'No Recent Contact',
          impact: 'high',
          description: `Last contact was ${daysSinceContact} days ago`,
        });
      } else if (daysSinceContact > 30) {
        factors.push({
          factor: 'Limited Recent Contact',
          impact: 'medium',
          description: `Last contact was ${daysSinceContact} days ago`,
        });
      }
    }

    if (!executiveSponsor) {
      factors.push({
        factor: 'No Executive Sponsor',
        impact: 'medium',
        description: 'Lack of executive buy-in increases churn risk',
      });
    }

    if (!qbrCompleted && daysToRenewal < 90) {
      factors.push({
        factor: 'QBR Not Completed',
        impact: 'high',
        description: 'Quarterly business review not conducted before renewal',
      });
    }

    if (supportTickets30d && supportTickets30d > 10) {
      factors.push({
        factor: 'High Support Volume',
        impact: 'medium',
        description: `${supportTickets30d} support tickets in last 30 days`,
      });
    }

    if (usageTrend === 'decreasing') {
      factors.push({
        factor: 'Declining Usage',
        impact: 'critical',
        description: 'Product usage trending downward',
      });
    }
  }

  // Time proximity risk
  if (daysToRenewal < 30 && daysToRenewal > 0) {
    factors.push({
      factor: 'Renewal Imminent',
      impact: 'high',
      description: `Only ${daysToRenewal} days until renewal`,
    });
  } else if (daysToRenewal < 0) {
    factors.push({
      factor: 'Contract Expired',
      impact: 'critical',
      description: 'Contract renewal date has passed',
    });
  }

  return factors;
}

/**
 * Identifies positive signals
 */
function identifyPositiveSignals(account: Account): string[] {
  const signals: string[] = [];

  if (account.healthScore !== undefined && account.healthScore >= 75) {
    signals.push(`Strong health score of ${account.healthScore}`);
  }

  if (account.engagementHistory) {
    const { executiveSponsor, qbrCompleted, usageTrend, lastContactDate } =
      account.engagementHistory;

    if (executiveSponsor) {
      signals.push('Executive sponsor identified');
    }

    if (qbrCompleted) {
      signals.push('Quarterly business review completed');
    }

    if (usageTrend === 'increasing') {
      signals.push('Product usage trending upward');
    }

    if (lastContactDate) {
      const daysSinceContact = Math.floor(
        (Date.now() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceContact < 14) {
        signals.push('Recent positive engagement');
      }
    }
  }

  if (account.tier === 'enterprise' || account.tier === 'premium') {
    signals.push('Premium tier customer with higher retention rates');
  }

  return signals;
}

/**
 * Generates recommended actions
 */
function generateRecommendedActions(
  _account: Account,
  riskFactors: RiskFactor[],
  daysToRenewal: number
): RecommendedAction[] {
  const actions: RecommendedAction[] = [];

  // Critical health score action
  const criticalHealthRisk = riskFactors.find((f) => f.factor === 'Critical Health Score');
  if (criticalHealthRisk) {
    actions.push({
      action: 'Schedule executive escalation call',
      priority: 'urgent',
      expectedImpact: 'Address critical issues before renewal decision',
      timeline: 'Within 48 hours',
    });
  }

  // No recent contact action
  const contactRisk = riskFactors.find((f) => f.factor === 'No Recent Contact');
  if (contactRisk) {
    actions.push({
      action: 'Reach out to customer success contact',
      priority: 'high',
      expectedImpact: 'Re-establish relationship and identify concerns',
      timeline: 'Within 1 week',
    });
  }

  // QBR action
  const qbrRisk = riskFactors.find((f) => f.factor === 'QBR Not Completed');
  if (qbrRisk) {
    actions.push({
      action: 'Schedule and conduct Quarterly Business Review',
      priority: daysToRenewal < 60 ? 'urgent' : 'high',
      expectedImpact: 'Demonstrate value and align on future goals',
      timeline: daysToRenewal < 60 ? 'Within 2 weeks' : 'Within 1 month',
    });
  }

  // Declining usage action
  const usageRisk = riskFactors.find((f) => f.factor === 'Declining Usage');
  if (usageRisk) {
    actions.push({
      action: 'Conduct usage audit and provide training',
      priority: 'high',
      expectedImpact: 'Increase product adoption and demonstrate ROI',
      timeline: 'Within 2 weeks',
    });
  }

  // No executive sponsor action
  const sponsorRisk = riskFactors.find((f) => f.factor === 'No Executive Sponsor');
  if (sponsorRisk) {
    actions.push({
      action: 'Identify and engage executive sponsor',
      priority: 'medium',
      expectedImpact: 'Secure executive buy-in for renewal',
      timeline: 'Within 1 month',
    });
  }

  // High support volume action
  const supportRisk = riskFactors.find((f) => f.factor === 'High Support Volume');
  if (supportRisk) {
    actions.push({
      action: 'Review and resolve outstanding support issues',
      priority: 'high',
      expectedImpact: 'Improve customer satisfaction',
      timeline: 'Within 1 week',
    });
  }

  // Renewal imminent action
  if (daysToRenewal < 30 && daysToRenewal > 0) {
    actions.push({
      action: 'Send renewal proposal with incentives',
      priority: 'urgent',
      expectedImpact: 'Facilitate renewal decision',
      timeline: 'Immediately',
    });
  }

  // Default actions if no specific risks
  if (actions.length === 0) {
    actions.push({
      action: 'Send renewal check-in email',
      priority: 'medium',
      expectedImpact: 'Confirm renewal intent',
      timeline: daysToRenewal < 90 ? 'Within 1 week' : 'Within 1 month',
    });
    actions.push({
      action: 'Prepare customer success story',
      priority: 'low',
      expectedImpact: 'Reinforce value delivered',
      timeline: 'Within 2 months',
    });
  }

  // Sort by priority
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return actions;
}

/**
 * Adjusts likelihood based on risk factors
 */
function adjustLikelihoodForRisks(baseLikelihood: number, riskFactors: RiskFactor[]): number {
  let adjusted = baseLikelihood;

  for (const risk of riskFactors) {
    switch (risk.impact) {
      case 'critical':
        adjusted -= 15;
        break;
      case 'high':
        adjusted -= 10;
        break;
      case 'medium':
        adjusted -= 5;
        break;
      case 'low':
        adjusted -= 2;
        break;
    }
  }

  return Math.max(0, Math.min(100, adjusted));
}

/**
 * Determines forecast outcome
 */
function determineOutcome(
  likelihood: number
): 'likely-renew' | 'at-risk' | 'high-risk' | 'churn-likely' {
  if (likelihood >= 70) return 'likely-renew';
  if (likelihood >= 50) return 'at-risk';
  if (likelihood >= 30) return 'high-risk';
  return 'churn-likely';
}

/**
 * Determines confidence level
 */
function determineConfidence(account: Account): 'low' | 'medium' | 'high' {
  let dataPoints = 0;

  if (account.healthScore !== undefined) dataPoints++;
  if (account.engagementHistory?.lastContactDate) dataPoints++;
  if (account.engagementHistory?.usageTrend) dataPoints++;
  if (account.engagementHistory?.qbrCompleted !== undefined) dataPoints++;
  if (account.engagementHistory?.executiveSponsor !== undefined) dataPoints++;

  if (dataPoints >= 4) return 'high';
  if (dataPoints >= 2) return 'medium';
  return 'low';
}

/**
 * Renewal Forecast Tool
 * Forecasts renewal likelihood based on health score and engagement patterns
 */
export const renewalForecastTool = tool({
  description:
    'Forecasts customer renewal likelihood based on health score and engagement patterns. Provides risk assessment, positive signals, and prioritized actions to improve renewal outcomes.',
  inputSchema: jsonSchema<RenewalForecastInput>({
    type: 'object',
    properties: {
      account: {
        type: 'object',
        description: 'Account information for renewal forecasting',
        properties: {
          id: {
            type: 'string',
            description: 'Account unique identifier',
          },
          name: {
            type: 'string',
            description: 'Account name',
          },
          healthScore: {
            type: 'number',
            description: 'Customer health score (0-100)',
          },
          renewalDate: {
            type: 'string',
            description: 'Contract renewal date (ISO format)',
          },
          contractValue: {
            type: 'number',
            description: 'Annual contract value',
          },
          tier: {
            type: 'string',
            enum: ['free', 'basic', 'premium', 'enterprise'],
            description: 'Account tier',
          },
          engagementHistory: {
            type: 'object',
            description: 'Historical engagement data',
            properties: {
              lastContactDate: {
                type: 'string',
                description: 'Last customer contact date (ISO format)',
              },
              executiveSponsor: {
                type: 'boolean',
                description: 'Whether executive sponsor is identified',
              },
              qbrCompleted: {
                type: 'boolean',
                description: 'Whether quarterly business review was completed',
              },
              supportTickets30d: {
                type: 'number',
                description: 'Number of support tickets in last 30 days',
              },
              usageTrend: {
                type: 'string',
                enum: ['increasing', 'stable', 'decreasing'],
                description: 'Product usage trend',
              },
            },
          },
        },
        required: ['id', 'renewalDate'],
      },
    },
    required: ['account'],
    additionalProperties: false,
  }),
  async execute({ account }): Promise<RenewalForecast> {
    // Validate account
    validateAccount(account);

    // Calculate days to renewal
    const daysToRenewal = account.daysToRenewal ?? calculateDaysToRenewal(account.renewalDate);

    // Calculate base likelihood
    const healthScore = account.healthScore ?? 50; // Default to neutral if not provided
    const baseLikelihood = calculateBaseLikelihood(healthScore);

    // Identify risk factors and positive signals
    const riskFactors = identifyRiskFactors(account, daysToRenewal);
    const positiveSignals = identifyPositiveSignals(account);

    // Adjust likelihood based on risks
    const renewalLikelihood = adjustLikelihoodForRisks(baseLikelihood, riskFactors);

    // Determine outcome and confidence
    const outcome = determineOutcome(renewalLikelihood);
    const confidence = determineConfidence(account);

    // Generate recommended actions
    const recommendedActions = generateRecommendedActions(account, riskFactors, daysToRenewal);

    return {
      renewalLikelihood,
      confidence,
      outcome,
      riskFactors,
      positiveSignals,
      recommendedActions,
      forecastDate: new Date().toISOString(),
      accountSummary: {
        daysToRenewal,
        contractValue: account.contractValue ?? 0,
        currentHealthScore: healthScore,
      },
    };
  },
});

export default renewalForecastTool;
