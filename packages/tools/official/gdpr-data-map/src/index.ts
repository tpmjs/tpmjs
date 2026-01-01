/**
 * GDPR Data Map Tool for TPMJS
 * Maps data processing activities to GDPR requirements and legal bases
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 * Uses jsonSchema() to avoid Zod 4 JSON Schema conversion issues with OpenAI
 */

import { jsonSchema, tool } from 'ai';

/**
 * GDPR Legal Bases
 */
export type GDPRLegalBasis =
  | 'consent'
  | 'contract'
  | 'legal-obligation'
  | 'vital-interests'
  | 'public-task'
  | 'legitimate-interests';

/**
 * Data processing activity
 */
export interface ProcessingActivity {
  name: string;
  description: string;
  dataCategories: string[];
  dataSubjects?: string[];
  purpose?: string;
}

/**
 * GDPR requirement check result
 */
export interface RequirementCheck {
  requirement: string;
  status: 'compliant' | 'non-compliant' | 'needs-review';
  notes?: string;
}

/**
 * Activity mapping with legal basis
 */
export interface ActivityMapping {
  activity: string;
  legalBasis: GDPRLegalBasis;
  justification: string;
  dataCategories: string[];
  requirements: RequirementCheck[];
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

/**
 * GDPR Data Map output
 */
export interface GDPRDataMap {
  mappings: ActivityMapping[];
  overallCompliance: 'compliant' | 'partial' | 'non-compliant';
  criticalIssues: string[];
  summary: string;
}

/**
 * Input type for GDPR Data Map Tool
 */
type GDPRDataMapInput = {
  activities: ProcessingActivity[];
};

/**
 * Determine appropriate legal basis for a processing activity
 */
function determineLegalBasis(activity: ProcessingActivity): {
  basis: GDPRLegalBasis;
  justification: string;
} {
  const { purpose = '', description = '' } = activity;
  const context = `${purpose} ${description}`.toLowerCase();

  // Check for consent indicators
  if (
    context.includes('marketing') ||
    context.includes('newsletter') ||
    context.includes('promotional') ||
    context.includes('advertising')
  ) {
    return {
      basis: 'consent',
      justification:
        'Marketing and promotional activities require explicit user consent under GDPR Article 6(1)(a)',
    };
  }

  // Check for contract necessity
  if (
    context.includes('order') ||
    context.includes('purchase') ||
    context.includes('delivery') ||
    context.includes('payment') ||
    context.includes('service')
  ) {
    return {
      basis: 'contract',
      justification:
        'Processing necessary for performance of a contract with the data subject under GDPR Article 6(1)(b)',
    };
  }

  // Check for legal obligation
  if (
    context.includes('tax') ||
    context.includes('accounting') ||
    context.includes('regulatory') ||
    context.includes('compliance') ||
    context.includes('legal requirement')
  ) {
    return {
      basis: 'legal-obligation',
      justification:
        'Processing necessary for compliance with legal obligations under GDPR Article 6(1)(c)',
    };
  }

  // Check for vital interests
  if (
    context.includes('emergency') ||
    context.includes('health') ||
    context.includes('safety') ||
    context.includes('medical')
  ) {
    return {
      basis: 'vital-interests',
      justification:
        'Processing necessary to protect vital interests of the data subject under GDPR Article 6(1)(d)',
    };
  }

  // Check for public task
  if (
    context.includes('public interest') ||
    context.includes('official authority') ||
    context.includes('government')
  ) {
    return {
      basis: 'public-task',
      justification:
        'Processing necessary for performance of a task carried out in the public interest under GDPR Article 6(1)(e)',
    };
  }

  // Default to legitimate interests (requires balancing test)
  return {
    basis: 'legitimate-interests',
    justification:
      'Processing necessary for legitimate interests pursued by the controller or third party, subject to balancing test under GDPR Article 6(1)(f)',
  };
}

/**
 * Assess risk level based on data categories and processing
 */
function assessRiskLevel(activity: ProcessingActivity): 'low' | 'medium' | 'high' {
  const { dataCategories = [], description = '' } = activity;
  const context = description.toLowerCase();

  // High risk indicators
  const highRiskCategories = [
    'health',
    'biometric',
    'genetic',
    'racial',
    'ethnic',
    'political',
    'religious',
    'sexual',
    'criminal',
    'financial',
  ];

  const hasSpecialCategory = dataCategories.some((cat) =>
    highRiskCategories.some((risk) => cat.toLowerCase().includes(risk))
  );

  const hasHighRiskProcessing =
    context.includes('automated decision') ||
    context.includes('profiling') ||
    context.includes('large scale') ||
    context.includes('monitoring') ||
    context.includes('children');

  if (hasSpecialCategory || hasHighRiskProcessing) {
    return 'high';
  }

  // Medium risk indicators
  const mediumRiskCategories = ['location', 'device', 'ip address', 'browsing', 'usage'];
  const hasMediumRiskData = dataCategories.some((cat) =>
    mediumRiskCategories.some((risk) => cat.toLowerCase().includes(risk))
  );

  if (hasMediumRiskData || context.includes('third party')) {
    return 'medium';
  }

  return 'low';
}

/**
 * Check GDPR requirements for an activity
 */
function checkRequirements(
  _activity: ProcessingActivity,
  legalBasis: GDPRLegalBasis,
  riskLevel: 'low' | 'medium' | 'high'
): RequirementCheck[] {
  const checks: RequirementCheck[] = [];

  // Transparency requirements
  checks.push({
    requirement: 'Transparency and information (Articles 13-14)',
    status: 'needs-review',
    notes: 'Must provide clear information about processing to data subjects in privacy notice',
  });

  // Legal basis specific requirements
  if (legalBasis === 'consent') {
    checks.push({
      requirement: 'Valid consent (Article 7)',
      status: 'needs-review',
      notes:
        'Must obtain freely given, specific, informed, and unambiguous consent with ability to withdraw',
    });
  }

  if (legalBasis === 'legitimate-interests') {
    checks.push({
      requirement: 'Legitimate interests balancing test (Article 6(1)(f))',
      status: 'needs-review',
      notes:
        'Must conduct and document balancing test between legitimate interests and data subject rights',
    });
  }

  // Data protection by design and default
  checks.push({
    requirement: 'Data protection by design and default (Article 25)',
    status: 'needs-review',
    notes: 'Must implement appropriate technical and organizational measures',
  });

  // Security requirements
  checks.push({
    requirement: 'Security of processing (Article 32)',
    status: 'needs-review',
    notes: 'Must implement appropriate security measures including encryption and access controls',
  });

  // High risk specific requirements
  if (riskLevel === 'high') {
    checks.push({
      requirement: 'Data Protection Impact Assessment (Article 35)',
      status: 'needs-review',
      notes: 'High-risk processing requires a DPIA to assess and mitigate risks to data subjects',
    });
  }

  // Data subject rights
  checks.push({
    requirement: 'Data subject rights (Articles 15-22)',
    status: 'needs-review',
    notes:
      'Must be able to facilitate access, rectification, erasure, portability, and objection rights',
  });

  // Record keeping
  checks.push({
    requirement: 'Records of processing activities (Article 30)',
    status: 'needs-review',
    notes: 'Must maintain records of all processing activities',
  });

  return checks;
}

/**
 * Generate recommendations based on activity and compliance status
 */
function generateRecommendations(
  activity: ProcessingActivity,
  legalBasis: GDPRLegalBasis,
  riskLevel: 'low' | 'medium' | 'high'
): string[] {
  const recommendations: string[] = [];

  // Legal basis specific recommendations
  if (legalBasis === 'consent') {
    recommendations.push(
      'Implement a consent management system to track and manage user consent',
      'Ensure consent requests are clear, specific, and separate from other terms',
      'Provide easy mechanism for users to withdraw consent at any time'
    );
  }

  if (legalBasis === 'legitimate-interests') {
    recommendations.push(
      'Document legitimate interests balancing test (LIA)',
      'Consider whether data subjects would reasonably expect this processing',
      'Provide clear opt-out mechanism'
    );
  }

  // Risk-based recommendations
  if (riskLevel === 'high') {
    recommendations.push(
      'Conduct Data Protection Impact Assessment (DPIA) before processing',
      'Consider appointing a Data Protection Officer (DPO)',
      'Implement enhanced security measures (encryption, pseudonymization)',
      'Review and document necessity and proportionality of processing'
    );
  }

  if (riskLevel === 'medium') {
    recommendations.push(
      'Implement data minimization practices',
      'Review data retention periods and implement deletion schedules',
      'Conduct regular security audits'
    );
  }

  // General recommendations
  recommendations.push(
    'Update privacy notice to include this processing activity',
    'Train staff on GDPR requirements and data handling procedures',
    'Implement processes to handle data subject rights requests'
  );

  // Data transfer recommendations
  const { description = '' } = activity;
  if (
    description.toLowerCase().includes('third party') ||
    description.toLowerCase().includes('transfer')
  ) {
    recommendations.push(
      'Review data transfer mechanisms if transferring outside EEA',
      'Ensure appropriate safeguards are in place for international transfers',
      'Conduct vendor due diligence and sign Data Processing Agreements (DPAs)'
    );
  }

  return recommendations;
}

/**
 * GDPR Data Map Tool
 * Maps data processing activities to GDPR requirements and legal bases
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 */
export const gdprDataMapTool = tool({
  description:
    'Maps data processing activities to GDPR legal bases and requirements. Analyzes each activity to determine appropriate legal basis, assess compliance requirements, identify risks, and provide actionable recommendations for GDPR compliance.',
  inputSchema: jsonSchema<GDPRDataMapInput>({
    type: 'object',
    properties: {
      activities: {
        type: 'array',
        description: 'Data processing activities to map',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Activity name',
            },
            description: {
              type: 'string',
              description: 'Detailed description of the processing activity',
            },
            dataCategories: {
              type: 'array',
              description: 'Categories of personal data processed',
              items: { type: 'string' },
            },
            dataSubjects: {
              type: 'array',
              description: 'Types of data subjects (customers, employees, etc.)',
              items: { type: 'string' },
            },
            purpose: {
              type: 'string',
              description: 'Purpose of processing',
            },
          },
          required: ['name', 'description', 'dataCategories'],
        },
      },
    },
    required: ['activities'],
    additionalProperties: false,
  }),
  async execute({ activities }) {
    // Validate input
    if (!activities || activities.length === 0) {
      throw new Error('At least one processing activity is required');
    }

    const mappings: ActivityMapping[] = [];
    const criticalIssues: string[] = [];

    // Process each activity
    for (const activity of activities) {
      if (!activity.name || !activity.description || !activity.dataCategories) {
        throw new Error('Each activity must have name, description, and dataCategories');
      }

      // Determine legal basis
      const { basis, justification } = determineLegalBasis(activity);

      // Assess risk level
      const riskLevel = assessRiskLevel(activity);

      // Check requirements
      const requirements = checkRequirements(activity, basis, riskLevel);

      // Generate recommendations
      const recommendations = generateRecommendations(activity, basis, riskLevel);

      // Track critical issues
      if (riskLevel === 'high') {
        criticalIssues.push(
          `High-risk processing: ${activity.name} - requires DPIA and enhanced safeguards`
        );
      }

      if (basis === 'legitimate-interests') {
        criticalIssues.push(`Legitimate interests balancing test required for: ${activity.name}`);
      }

      mappings.push({
        activity: activity.name,
        legalBasis: basis,
        justification,
        dataCategories: activity.dataCategories,
        requirements,
        riskLevel,
        recommendations,
      });
    }

    // Determine overall compliance
    const hasHighRisk = mappings.some((m) => m.riskLevel === 'high');
    const overallCompliance: 'compliant' | 'partial' | 'non-compliant' = hasHighRisk
      ? 'partial'
      : 'compliant';

    // Generate summary
    const highRiskCount = mappings.filter((m) => m.riskLevel === 'high').length;
    const mediumRiskCount = mappings.filter((m) => m.riskLevel === 'medium').length;
    const lowRiskCount = mappings.filter((m) => m.riskLevel === 'low').length;

    const summary = `Analyzed ${mappings.length} processing activities: ${highRiskCount} high-risk, ${mediumRiskCount} medium-risk, ${lowRiskCount} low-risk. ${criticalIssues.length} critical issues require immediate attention.`;

    return {
      mappings,
      overallCompliance,
      criticalIssues,
      summary,
    };
  },
});

/**
 * Export default for convenience
 */
export default gdprDataMapTool;
