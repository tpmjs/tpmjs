/**
 * Risk Clause Highlight Tool for TPMJS
 * Identifies and highlights potentially risky clauses in contracts
 */

import { jsonSchema, tool } from 'ai';

/**
 * Severity level of a risk
 */
type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Category of risk
 */
type RiskCategory =
  | 'liability'
  | 'indemnification'
  | 'auto_renewal'
  | 'termination'
  | 'limitation_of_liability'
  | 'warranty_disclaimer'
  | 'data_rights'
  | 'arbitration'
  | 'unilateral_modification'
  | 'venue_jurisdiction'
  | 'assignment'
  | 'confidentiality_scope'
  | 'payment_terms'
  | 'penalty_clause'
  | 'other';

/**
 * Represents a risky clause in the contract
 */
export interface RiskClause {
  category: RiskCategory;
  severity: RiskSeverity;
  text: string;
  location: {
    startIndex: number;
    endIndex: number;
    paragraph?: number;
  };
  riskDescription: string;
  mitigationSuggestion: string;
  impact: string;
}

/**
 * Input interface for risk clause analysis
 */
interface RiskClauseHighlightInput {
  contractText: string;
}

/**
 * Output interface for contract risk analysis
 */
export interface ContractRisks {
  risks: RiskClause[];
  totalRisks: number;
  risksBySeverity: Record<RiskSeverity, number>;
  risksByCategory: Record<RiskCategory, number>;
  overallRiskScore: number;
  summary: string;
  recommendations: string[];
}

/**
 * Risk detection patterns with severity and impact information
 */
const RISK_PATTERNS: Record<
  RiskCategory,
  {
    keywords: string[];
    severity: RiskSeverity;
    riskDescription: string;
    impact: string;
    mitigation: string;
  }
> = {
  liability: {
    keywords: [
      'unlimited liability',
      'full liability',
      'liable for all',
      'responsible for any and all',
    ],
    severity: 'critical',
    riskDescription: 'Unlimited or broad liability exposure',
    impact: 'You may be held responsible for unlimited damages or losses',
    mitigation:
      'Negotiate to cap liability at a reasonable amount (e.g., contract value or insurance coverage)',
  },
  indemnification: {
    keywords: [
      'shall indemnify',
      'agree to defend',
      'hold harmless',
      'indemnification obligations',
    ],
    severity: 'high',
    riskDescription: 'Indemnification obligations may expose you to third-party claims',
    impact: 'You may be required to defend and pay for claims against the other party',
    mitigation:
      'Limit indemnification to claims arising from your gross negligence or willful misconduct',
  },
  auto_renewal: {
    keywords: ['automatically renew', 'auto-renew', 'renew automatically', 'evergreen clause'],
    severity: 'medium',
    riskDescription: 'Contract automatically renews without explicit consent',
    impact: 'You may be locked into additional contract terms without realizing it',
    mitigation:
      'Require explicit opt-in for renewals or set calendar reminders for termination notice',
  },
  termination: {
    keywords: [
      'terminate at will',
      'terminate without cause',
      'terminate immediately',
      'no termination right',
    ],
    severity: 'high',
    riskDescription: 'Unfavorable termination rights or restrictions',
    impact:
      'You may be unable to exit the contract or face immediate termination by the other party',
    mitigation: 'Negotiate mutual termination rights with reasonable notice periods',
  },
  limitation_of_liability: {
    keywords: [
      'exclude all liability',
      'no liability for',
      'limited to direct damages',
      'liability is capped',
    ],
    severity: 'medium',
    riskDescription: 'Other party limits their liability exposure',
    impact: 'You may not be able to recover full damages if the other party breaches',
    mitigation: 'Ensure liability caps are reasonable and include exceptions for gross negligence',
  },
  warranty_disclaimer: {
    keywords: [
      'as is',
      'without warranty',
      'disclaims all warranties',
      'no warranties of any kind',
    ],
    severity: 'medium',
    riskDescription: 'No warranties provided for products or services',
    impact: 'You have no recourse if products/services are defective or unsuitable',
    mitigation: 'Request specific warranties for fitness, merchantability, and non-infringement',
  },
  data_rights: {
    keywords: [
      'own all data',
      'license to use your data',
      'transfer of data rights',
      'perpetual license',
    ],
    severity: 'high',
    riskDescription: 'Broad data rights granted to the other party',
    impact: 'You may lose ownership or control of your data',
    mitigation:
      'Retain ownership of your data and grant only limited licenses necessary for service delivery',
  },
  arbitration: {
    keywords: [
      'mandatory arbitration',
      'binding arbitration',
      'waive right to jury',
      'class action waiver',
    ],
    severity: 'medium',
    riskDescription: 'Disputes must be resolved through arbitration',
    impact: 'You may be unable to pursue litigation or join class action lawsuits',
    mitigation: 'Ensure arbitration terms are fair (e.g., shared costs, neutral venue)',
  },
  unilateral_modification: {
    keywords: [
      'modify at any time',
      'change without notice',
      'reserve the right to change',
      'unilaterally modify',
    ],
    severity: 'high',
    riskDescription: 'Contract can be changed without your consent',
    impact: 'Terms can be changed unfavorably at any time',
    mitigation: 'Require advance notice of changes and the right to terminate if you disagree',
  },
  venue_jurisdiction: {
    keywords: ['exclusive jurisdiction', 'venue shall be', 'submit to jurisdiction', 'courts of'],
    severity: 'low',
    riskDescription: 'Disputes must be resolved in a specific jurisdiction',
    impact: 'You may need to litigate in an inconvenient or unfavorable location',
    mitigation: 'Negotiate for mutual jurisdiction or arbitration in a neutral location',
  },
  assignment: {
    keywords: [
      'may assign',
      'freely assign',
      'transfer this agreement',
      'assignment without consent',
    ],
    severity: 'medium',
    riskDescription: 'Other party can assign contract to a third party',
    impact: 'You may end up contracting with an unknown or undesirable third party',
    mitigation: 'Require your written consent before any assignment',
  },
  confidentiality_scope: {
    keywords: [
      'all information is confidential',
      'perpetual confidentiality',
      'confidentiality survives forever',
    ],
    severity: 'low',
    riskDescription: 'Overly broad or perpetual confidentiality obligations',
    impact: 'You may be restricted from using general knowledge or industry practices',
    mitigation:
      'Limit confidentiality to specific information and set a reasonable termination period',
  },
  payment_terms: {
    keywords: ['non-refundable', 'payment in advance', 'no refunds', 'prepaid fees'],
    severity: 'medium',
    riskDescription: 'Unfavorable payment terms or no refund policy',
    impact: 'You may lose money if you need to terminate early or if services are unsatisfactory',
    mitigation: 'Negotiate pro-rated refunds or performance-based payment terms',
  },
  penalty_clause: {
    keywords: ['penalty', 'liquidated damages', 'late fee', 'interest on overdue'],
    severity: 'medium',
    riskDescription: 'Financial penalties for breaches or late payments',
    impact: 'You may face significant penalties for minor violations',
    mitigation: 'Ensure penalties are reasonable and proportional to actual damages',
  },
  other: {
    keywords: [],
    severity: 'low',
    riskDescription: 'Other potential risk identified',
    impact: 'Impact depends on specific clause',
    mitigation: 'Review carefully with legal counsel',
  },
};

/**
 * Analyzes contract text to identify risky clauses
 */
function analyzeContractRisks(contractText: string): ContractRisks {
  if (!contractText || contractText.trim().length === 0) {
    throw new Error('Contract text cannot be empty');
  }

  // Domain rule: paragraph_segmentation - Contracts are segmented by double newlines to identify logical sections
  const paragraphs = contractText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  const risks: RiskClause[] = [];
  const risksBySeverity: Record<RiskSeverity, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };
  const risksByCategory: Record<RiskCategory, number> = {} as Record<RiskCategory, number>;

  // Initialize category counts
  Object.keys(RISK_PATTERNS).forEach((category) => {
    risksByCategory[category as RiskCategory] = 0;
  });

  // Domain rule: risk_identification - Contract risks are identified by matching problematic legal patterns
  // Analyze each paragraph
  paragraphs.forEach((paragraph, paraIndex) => {
    const paraText = paragraph.trim();
    const normalizedPara = paraText.toLowerCase();
    const startIndex = contractText.indexOf(paraText);

    // Check against each risk pattern
    for (const [category, pattern] of Object.entries(RISK_PATTERNS)) {
      if (category === 'other') continue;

      const keywordMatches = pattern.keywords.some((keyword) =>
        normalizedPara.includes(keyword.toLowerCase())
      );

      if (keywordMatches) {
        const risk: RiskClause = {
          category: category as RiskCategory,
          severity: pattern.severity,
          text: paraText,
          location: {
            startIndex,
            endIndex: startIndex + paraText.length,
            paragraph: paraIndex + 1,
          },
          riskDescription: pattern.riskDescription,
          mitigationSuggestion: pattern.mitigation,
          impact: pattern.impact,
        };

        risks.push(risk);
        risksBySeverity[pattern.severity]++;
        risksByCategory[category as RiskCategory]++;

        // Don't match multiple risk types for the same paragraph
        break;
      }
    }
  });

  // Domain rule: risk_scoring - Overall risk score is weighted by severity (critical=100, high=50, medium=25, low=10)
  // Calculate overall risk score (0-100, higher is riskier)
  const severityWeights = { low: 10, medium: 25, high: 50, critical: 100 };
  const totalWeightedRisks =
    risksBySeverity.low * severityWeights.low +
    risksBySeverity.medium * severityWeights.medium +
    risksBySeverity.high * severityWeights.high +
    risksBySeverity.critical * severityWeights.critical;

  const maxPossibleScore = paragraphs.length * severityWeights.critical;
  const overallRiskScore = Math.min(
    100,
    Math.round((totalWeightedRisks / Math.max(1, maxPossibleScore)) * 100)
  );

  // Generate recommendations
  const recommendations: string[] = [];

  if (risksBySeverity.critical > 0) {
    recommendations.push(
      `Address ${risksBySeverity.critical} critical risk${risksBySeverity.critical > 1 ? 's' : ''} immediately before signing`
    );
  }

  if (risksBySeverity.high > 0) {
    recommendations.push(
      `Negotiate or mitigate ${risksBySeverity.high} high-severity risk${risksBySeverity.high > 1 ? 's' : ''}`
    );
  }

  if (risksBySeverity.medium > 3) {
    recommendations.push('Consider having legal counsel review the multiple medium-risk clauses');
  }

  if (risks.length === 0) {
    recommendations.push(
      'No standard risk patterns detected, but still review the contract carefully'
    );
  } else {
    recommendations.push(
      'Review each identified risk clause with the mitigation suggestions provided'
    );
  }

  // Generate summary
  const riskLevel =
    overallRiskScore >= 75
      ? 'very high'
      : overallRiskScore >= 50
        ? 'high'
        : overallRiskScore >= 25
          ? 'moderate'
          : 'low';

  const summary = `Identified ${risks.length} potentially risky clause${risks.length !== 1 ? 's' : ''} with an overall risk score of ${overallRiskScore}/100 (${riskLevel} risk). ${risksBySeverity.critical} critical, ${risksBySeverity.high} high, ${risksBySeverity.medium} medium, and ${risksBySeverity.low} low severity risks detected.`;

  return {
    risks: risks.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    }),
    totalRisks: risks.length,
    risksBySeverity,
    risksByCategory,
    overallRiskScore,
    summary,
    recommendations,
  };
}

/**
 * Risk Clause Highlight Tool
 * Identifies and highlights potentially risky clauses in contracts
 */
export const riskClauseHighlightTool = tool({
  description:
    'Identifies and highlights potentially risky clauses in contracts such as unlimited liability, broad indemnification, auto-renewal terms, unfavorable termination rights, warranty disclaimers, data rights transfers, mandatory arbitration, and unilateral modification clauses. Returns detailed risk analysis with severity ratings, impact assessments, and mitigation suggestions for each identified risk.',
  inputSchema: jsonSchema<RiskClauseHighlightInput>({
    type: 'object',
    properties: {
      contractText: {
        type: 'string',
        description: 'The full contract text to analyze for risky clauses',
      },
    },
    required: ['contractText'],
    additionalProperties: false,
  }),
  execute: async ({ contractText }): Promise<ContractRisks> => {
    // Validate input
    if (typeof contractText !== 'string') {
      throw new Error('Contract text must be a string');
    }

    if (contractText.trim().length === 0) {
      throw new Error('Contract text cannot be empty');
    }

    try {
      return analyzeContractRisks(contractText);
    } catch (error) {
      throw new Error(
        `Failed to analyze contract risks: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});

export default riskClauseHighlightTool;
