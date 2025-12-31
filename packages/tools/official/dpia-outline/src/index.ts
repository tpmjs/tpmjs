/**
 * DPIA Outline Tool for TPMJS
 * Generates a Data Protection Impact Assessment (DPIA) outline for GDPR compliance.
 * Identifies privacy risks and suggests mitigation strategies based on data types and processing activities.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Risk identified in the DPIA
 */
export interface DPIARisk {
  risk: string;
  severity: 'high' | 'medium' | 'low';
  likelihood: 'high' | 'medium' | 'low';
  dataTypes: string[];
}

/**
 * Mitigation strategy for identified risks
 */
export interface DPIAMitigation {
  risk: string;
  strategy: string;
  controls: string[];
  responsible: string;
}

/**
 * Output interface for DPIA outline
 */
export interface DPIAResult {
  dpia: string;
  risks: DPIARisk[];
  mitigations: DPIAMitigation[];
  metadata: {
    projectName: string;
    generatedAt: string;
    dataTypesCount: number;
    processingActivitiesCount: number;
    highRiskCount: number;
    requiresDPIA: boolean;
    dpiaRecommendation: string;
  };
}

type DPIAOutlineInput = {
  project: string;
  dataTypes: string[];
  processing: string[];
};

/**
 * High-risk data types that trigger DPIA requirements
 */
const HIGH_RISK_DATA_TYPES = new Set([
  'biometric',
  'genetic',
  'health',
  'medical',
  'racial',
  'ethnic',
  'political',
  'religious',
  'philosophical',
  'trade union',
  'sexual orientation',
  'criminal',
  'children',
  'minors',
  'location',
  'financial',
  'credit card',
]);

/**
 * High-risk processing activities that trigger DPIA requirements
 */
const HIGH_RISK_PROCESSING = new Set([
  'profiling',
  'automated decision',
  'automated decision-making',
  'large scale',
  'systematic monitoring',
  'public monitoring',
  'matching',
  'combining',
  'cross-referencing',
  'tracking',
  'surveillance',
]);

/**
 * Determines if DPIA is required based on data types and processing
 */
function requiresDPIA(dataTypes: string[], processing: string[]): boolean {
  // Check for special category data (GDPR Article 9)
  const hasSpecialCategoryData = dataTypes.some((type) => {
    const normalized = type.toLowerCase();
    for (const highRisk of HIGH_RISK_DATA_TYPES) {
      if (normalized.includes(highRisk)) return true;
    }
    return false;
  });

  // Check for high-risk processing
  const hasHighRiskProcessing = processing.some((activity) => {
    const normalized = activity.toLowerCase();
    for (const highRisk of HIGH_RISK_PROCESSING) {
      if (normalized.includes(highRisk)) return true;
    }
    return false;
  });

  return hasSpecialCategoryData || hasHighRiskProcessing;
}

/**
 * Identifies privacy risks based on data types and processing
 */
function identifyRisks(dataTypes: string[], processing: string[]): DPIARisk[] {
  const risks: DPIARisk[] = [];

  // Risk: Unauthorized access
  risks.push({
    risk: 'Unauthorized access to personal data',
    severity: 'high',
    likelihood: 'medium',
    dataTypes: [...dataTypes],
  });

  // Risk: Data breach
  const hasHighRiskData = dataTypes.some((type) => {
    const normalized = type.toLowerCase();
    for (const highRisk of HIGH_RISK_DATA_TYPES) {
      if (normalized.includes(highRisk)) return true;
    }
    return false;
  });

  if (hasHighRiskData) {
    risks.push({
      risk: 'Data breach involving special category data',
      severity: 'high',
      likelihood: 'medium',
      dataTypes: dataTypes.filter((type) => {
        const normalized = type.toLowerCase();
        for (const highRisk of HIGH_RISK_DATA_TYPES) {
          if (normalized.includes(highRisk)) return true;
        }
        return false;
      }),
    });
  }

  // Risk: Automated decision-making
  if (
    processing.some(
      (p) => p.toLowerCase().includes('automat') || p.toLowerCase().includes('profil')
    )
  ) {
    risks.push({
      risk: 'Discriminatory or unfair automated decision-making',
      severity: 'high',
      likelihood: 'medium',
      dataTypes: [...dataTypes],
    });
  }

  // Risk: Excessive data collection
  if (dataTypes.length > 5) {
    risks.push({
      risk: 'Collection of excessive personal data beyond necessity',
      severity: 'medium',
      likelihood: 'medium',
      dataTypes: [...dataTypes],
    });
  }

  // Risk: Inadequate retention
  risks.push({
    risk: 'Retention of personal data beyond legal requirements',
    severity: 'medium',
    likelihood: 'high',
    dataTypes: [...dataTypes],
  });

  // Risk: Third-party processing
  if (
    processing.some((p) => p.toLowerCase().includes('transfer') || p.toLowerCase().includes('shar'))
  ) {
    risks.push({
      risk: 'Inadequate safeguards for third-party data transfers',
      severity: 'high',
      likelihood: 'medium',
      dataTypes: [...dataTypes],
    });
  }

  // Risk: Lack of transparency
  risks.push({
    risk: 'Insufficient transparency about data processing purposes',
    severity: 'medium',
    likelihood: 'medium',
    dataTypes: [...dataTypes],
  });

  // Risk: Individual rights
  risks.push({
    risk: 'Inability to exercise data subject rights (access, deletion, portability)',
    severity: 'medium',
    likelihood: 'low',
    dataTypes: [...dataTypes],
  });

  return risks;
}

/**
 * Generates mitigation strategies for identified risks
 */
function generateMitigations(risks: DPIARisk[]): DPIAMitigation[] {
  const mitigations: DPIAMitigation[] = [];

  for (const risk of risks) {
    if (risk.risk.includes('Unauthorized access')) {
      mitigations.push({
        risk: risk.risk,
        strategy: 'Implement strong access controls and authentication',
        controls: [
          'Role-based access control (RBAC)',
          'Multi-factor authentication (MFA)',
          'Principle of least privilege',
          'Regular access reviews and audits',
          'Encryption at rest and in transit',
        ],
        responsible: 'IT Security Team',
      });
    }

    if (risk.risk.includes('Data breach')) {
      mitigations.push({
        risk: risk.risk,
        strategy: 'Implement comprehensive data security measures',
        controls: [
          'End-to-end encryption for special category data',
          'Regular security assessments and penetration testing',
          'Incident response plan and breach notification procedures',
          'Data loss prevention (DLP) tools',
          'Security awareness training for staff',
        ],
        responsible: 'Data Protection Officer / CISO',
      });
    }

    if (risk.risk.includes('automated decision')) {
      mitigations.push({
        risk: risk.risk,
        strategy: 'Ensure fairness and transparency in automated processing',
        controls: [
          'Algorithm fairness testing and bias detection',
          'Human review for significant decisions',
          'Clear explanation of decision logic to data subjects',
          'Regular audits of automated systems',
          'Right to contest automated decisions',
        ],
        responsible: 'Data Science Team / Legal Team',
      });
    }

    if (risk.risk.includes('excessive data')) {
      mitigations.push({
        risk: risk.risk,
        strategy: 'Apply data minimization principles',
        controls: [
          'Review and document necessity for each data type',
          'Collect only essential data for specified purposes',
          'Regular data inventory and classification',
          'Privacy by design and default',
          'Data protection impact assessments for new processing',
        ],
        responsible: 'Data Protection Officer',
      });
    }

    if (risk.risk.includes('Retention')) {
      mitigations.push({
        risk: risk.risk,
        strategy: 'Implement data retention and deletion policies',
        controls: [
          'Define retention periods based on legal requirements',
          'Automated deletion after retention period expires',
          'Regular data purging and anonymization',
          'Documentation of retention schedule',
          'Annual review of retention policies',
        ],
        responsible: 'Legal Team / Data Governance',
      });
    }

    if (risk.risk.includes('third-party')) {
      mitigations.push({
        risk: risk.risk,
        strategy: 'Establish robust third-party data transfer mechanisms',
        controls: [
          'Data processing agreements with all processors',
          'Standard contractual clauses for international transfers',
          'Vendor security assessments',
          'Transfer impact assessments (TIA)',
          'Monitoring of third-party compliance',
        ],
        responsible: 'Legal Team / Procurement',
      });
    }

    if (risk.risk.includes('transparency')) {
      mitigations.push({
        risk: risk.risk,
        strategy: 'Provide clear and comprehensive privacy notices',
        controls: [
          'Privacy policy with plain language explanations',
          'Just-in-time notices at point of collection',
          'Layered privacy notices (short + detailed)',
          'Regular updates to reflect processing changes',
          'Easy-to-understand data flow diagrams',
        ],
        responsible: 'Legal Team / Privacy Team',
      });
    }

    if (risk.risk.includes('data subject rights')) {
      mitigations.push({
        risk: risk.risk,
        strategy: 'Implement mechanisms to support data subject rights',
        controls: [
          'Self-service portal for access and deletion requests',
          'Documented procedures for rights requests',
          'Response within legal timeframes (1 month)',
          'Data portability in machine-readable format',
          'Training for staff handling requests',
        ],
        responsible: 'Data Protection Officer / Customer Support',
      });
    }
  }

  return mitigations;
}

/**
 * Generates the DPIA outline markdown document
 */
function generateDPIAOutline(
  project: string,
  dataTypes: string[],
  processing: string[],
  risks: DPIARisk[],
  mitigations: DPIAMitigation[]
): string {
  const sections: string[] = [];

  // Title
  sections.push('# Data Protection Impact Assessment (DPIA)');
  sections.push(`## ${project}`);
  sections.push('');
  sections.push(`**Generated:** ${new Date().toISOString().split('T')[0]}`);
  sections.push('');

  // Executive Summary
  sections.push('## Executive Summary');
  sections.push('');
  sections.push(
    'This Data Protection Impact Assessment (DPIA) evaluates the privacy risks associated with the processing activities described below. It identifies potential impacts on data subjects and outlines measures to mitigate identified risks.'
  );
  sections.push('');

  // Project Description
  sections.push('## 1. Project Description');
  sections.push('');
  sections.push(`**Project Name:** ${project}`);
  sections.push('');
  sections.push('**Purpose:** [Describe the purpose and objectives of the data processing]');
  sections.push('');

  // Data Types
  sections.push('## 2. Personal Data Being Processed');
  sections.push('');
  sections.push('The following categories of personal data will be processed:');
  sections.push('');
  for (const dataType of dataTypes) {
    sections.push(`- ${dataType}`);
  }
  sections.push('');

  // Processing Activities
  sections.push('## 3. Processing Activities');
  sections.push('');
  sections.push('The following processing activities will be performed:');
  sections.push('');
  for (const activity of processing) {
    sections.push(`- ${activity}`);
  }
  sections.push('');

  // Legal Basis
  sections.push('## 4. Legal Basis for Processing');
  sections.push('');
  sections.push('[Specify the legal basis under GDPR Article 6, and Article 9 if applicable]');
  sections.push('');
  sections.push('- [ ] Consent (Article 6(1)(a))');
  sections.push('- [ ] Contract (Article 6(1)(b))');
  sections.push('- [ ] Legal obligation (Article 6(1)(c))');
  sections.push('- [ ] Vital interests (Article 6(1)(d))');
  sections.push('- [ ] Public task (Article 6(1)(e))');
  sections.push('- [ ] Legitimate interests (Article 6(1)(f))');
  sections.push('');

  // Necessity and Proportionality
  sections.push('## 5. Necessity and Proportionality');
  sections.push('');
  sections.push('[Demonstrate that the processing is necessary and proportionate to the purpose]');
  sections.push('');
  sections.push('**Necessity Assessment:**');
  sections.push('- Is the data processing necessary to achieve the purpose?');
  sections.push('- Could the purpose be achieved with less data or less intrusive methods?');
  sections.push('');
  sections.push('**Proportionality Assessment:**');
  sections.push('- Is the impact on privacy proportionate to the benefits?');
  sections.push('- Have we implemented data minimization principles?');
  sections.push('');

  // Risks
  sections.push('## 6. Privacy Risks Identified');
  sections.push('');
  sections.push('The following privacy risks have been identified:');
  sections.push('');

  for (const risk of risks) {
    sections.push(`### ${risk.risk}`);
    sections.push('');
    sections.push(`- **Severity:** ${risk.severity}`);
    sections.push(`- **Likelihood:** ${risk.likelihood}`);
    sections.push(`- **Affected Data Types:** ${risk.dataTypes.join(', ')}`);
    sections.push('');
  }

  // Mitigations
  sections.push('## 7. Risk Mitigation Measures');
  sections.push('');

  for (const mitigation of mitigations) {
    sections.push(`### ${mitigation.risk}`);
    sections.push('');
    sections.push(`**Strategy:** ${mitigation.strategy}`);
    sections.push('');
    sections.push('**Controls:**');
    for (const control of mitigation.controls) {
      sections.push(`- ${control}`);
    }
    sections.push('');
    sections.push(`**Responsible:** ${mitigation.responsible}`);
    sections.push('');
  }

  // Data Subject Rights
  sections.push('## 8. Data Subject Rights');
  sections.push('');
  sections.push('Mechanisms to support data subject rights:');
  sections.push('');
  sections.push('- **Right of access:** [Describe how subjects can access their data]');
  sections.push('- **Right to rectification:** [Describe how subjects can correct their data]');
  sections.push('- **Right to erasure:** [Describe how subjects can delete their data]');
  sections.push('- **Right to restriction:** [Describe how subjects can restrict processing]');
  sections.push('- **Right to data portability:** [Describe how subjects can export their data]');
  sections.push('- **Right to object:** [Describe how subjects can object to processing]');
  sections.push('');

  // Consultation
  sections.push('## 9. Consultation');
  sections.push('');
  sections.push('**Stakeholders Consulted:**');
  sections.push('- [ ] Data Protection Officer');
  sections.push('- [ ] IT Security Team');
  sections.push('- [ ] Legal Team');
  sections.push('- [ ] Data subjects or representatives');
  sections.push('- [ ] Supervisory authority (if required)');
  sections.push('');

  // Conclusion
  sections.push('## 10. Conclusion and Approval');
  sections.push('');
  sections.push('[Summarize the outcome of the DPIA and whether the processing can proceed]');
  sections.push('');
  sections.push('**Recommendation:**');
  sections.push('- [ ] Proceed with processing (risks acceptable)');
  sections.push('- [ ] Proceed with additional safeguards');
  sections.push('- [ ] Consult supervisory authority');
  sections.push('- [ ] Do not proceed (risks too high)');
  sections.push('');
  sections.push('**Approved by:**');
  sections.push('');
  sections.push('- Name: _________________');
  sections.push('- Title: _________________');
  sections.push('- Date: _________________');
  sections.push('');

  // Review
  sections.push('## 11. Review and Updates');
  sections.push('');
  sections.push(
    'This DPIA will be reviewed and updated when there are changes to the processing activities, data types, or risk profile.'
  );
  sections.push('');
  sections.push('**Next Review Date:** [Specify date]');
  sections.push('');

  return sections.join('\n');
}

/**
 * DPIA Outline Tool
 * Generates a Data Protection Impact Assessment outline
 */
export const dpiaOutlineTool = tool({
  description:
    'Generate a Data Protection Impact Assessment (DPIA) outline for GDPR compliance. Creates a comprehensive DPIA document template, identifies privacy risks based on data types and processing activities, and suggests appropriate mitigation strategies. Required when processing high-risk personal data or using automated decision-making.',
  inputSchema: jsonSchema<DPIAOutlineInput>({
    type: 'object',
    properties: {
      project: {
        type: 'string',
        description: 'Project or system name and brief description',
      },
      dataTypes: {
        type: 'array',
        items: {
          type: 'string',
        },
        description:
          'Types of personal data being processed (e.g., "email addresses", "health records", "biometric data")',
      },
      processing: {
        type: 'array',
        items: {
          type: 'string',
        },
        description:
          'Processing activities being performed (e.g., "automated profiling", "data transfer to third parties", "large-scale monitoring")',
      },
    },
    required: ['project', 'dataTypes', 'processing'],
    additionalProperties: false,
  }),
  async execute({ project, dataTypes, processing }): Promise<DPIAResult> {
    // Validate input
    if (!project || typeof project !== 'string' || project.trim().length === 0) {
      throw new Error('Project name is required and must be a non-empty string');
    }

    if (!Array.isArray(dataTypes) || dataTypes.length === 0) {
      throw new Error('At least one data type is required');
    }

    if (!Array.isArray(processing) || processing.length === 0) {
      throw new Error('At least one processing activity is required');
    }

    // Validate each data type
    for (const dataType of dataTypes) {
      if (typeof dataType !== 'string' || dataType.trim().length === 0) {
        throw new Error('Each data type must be a non-empty string');
      }
    }

    // Validate each processing activity
    for (const activity of processing) {
      if (typeof activity !== 'string' || activity.trim().length === 0) {
        throw new Error('Each processing activity must be a non-empty string');
      }
    }

    // Identify risks and generate mitigations
    const risks = identifyRisks(dataTypes, processing);
    const mitigations = generateMitigations(risks);

    // Generate the DPIA outline
    const dpia = generateDPIAOutline(project, dataTypes, processing, risks, mitigations);

    // Determine if DPIA is required
    const isDPIARequired = requiresDPIA(dataTypes, processing);
    const highRiskCount = risks.filter((r) => r.severity === 'high').length;

    // Generate recommendation
    let dpiaRecommendation: string;
    if (isDPIARequired) {
      dpiaRecommendation =
        'DPIA is REQUIRED under GDPR Article 35 due to high-risk processing or special category data. Complete this assessment before proceeding.';
    } else if (highRiskCount > 0) {
      dpiaRecommendation =
        'DPIA is RECOMMENDED due to identified high-severity risks. Consider completing this assessment to demonstrate compliance.';
    } else {
      dpiaRecommendation =
        'DPIA may not be strictly required, but is good practice for documenting privacy considerations.';
    }

    return {
      dpia,
      risks,
      mitigations,
      metadata: {
        projectName: project,
        generatedAt: new Date().toISOString(),
        dataTypesCount: dataTypes.length,
        processingActivitiesCount: processing.length,
        highRiskCount,
        requiresDPIA: isDPIARequired,
        dpiaRecommendation,
      },
    };
  },
});

export default dpiaOutlineTool;
