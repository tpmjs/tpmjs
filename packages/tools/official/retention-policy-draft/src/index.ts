/**
 * Retention Policy Draft Tool for TPMJS
 * Generates data retention policy documents from data types and retention requirements.
 * Useful for GDPR, CCPA, and other privacy compliance regulations.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Data type with retention requirements
 */
export interface DataTypeRetention {
  type: string;
  retentionDays: number;
  justification: string;
  category?: string;
}

/**
 * Output interface for retention policy draft
 */
export interface RetentionPolicyDraft {
  policy: string;
  dataTypes: DataTypeRetention[];
  summary: {
    totalDataTypes: number;
    averageRetentionDays: number;
    longestRetention: {
      type: string;
      days: number;
    };
    shortestRetention: {
      type: string;
      days: number;
    };
    categoryCounts: Record<string, number>;
  };
  metadata: {
    organizationName: string;
    effectiveDate: string;
    generatedAt: string;
    version: string;
  };
}

type RetentionPolicyDraftInput = {
  dataTypes: DataTypeRetention[];
  organizationName?: string;
  effectiveDate?: string;
};

/**
 * Validates data types array
 */
function validateDataTypes(dataTypes: unknown[]): asserts dataTypes is DataTypeRetention[] {
  if (!Array.isArray(dataTypes) || dataTypes.length === 0) {
    throw new Error('dataTypes must be a non-empty array');
  }

  for (let i = 0; i < dataTypes.length; i++) {
    const dt = dataTypes[i];

    if (typeof dt !== 'object' || dt === null) {
      throw new Error(`dataTypes[${i}] must be an object`);
    }

    const dataType = dt as Record<string, unknown>;

    // Validate type
    if (typeof dataType.type !== 'string' || dataType.type.trim().length === 0) {
      throw new Error(`dataTypes[${i}].type must be a non-empty string`);
    }

    // Validate retentionDays
    if (typeof dataType.retentionDays !== 'number' || dataType.retentionDays < 0) {
      throw new Error(`dataTypes[${i}].retentionDays must be a non-negative number`);
    }

    if (!Number.isInteger(dataType.retentionDays)) {
      throw new Error(`dataTypes[${i}].retentionDays must be an integer`);
    }

    // Validate justification
    if (typeof dataType.justification !== 'string' || dataType.justification.trim().length === 0) {
      throw new Error(`dataTypes[${i}].justification must be a non-empty string`);
    }

    // Validate category if present
    if (
      dataType.category !== undefined &&
      (typeof dataType.category !== 'string' || dataType.category.trim().length === 0)
    ) {
      throw new Error(`dataTypes[${i}].category must be a non-empty string if provided`);
    }
  }
}

/**
 * Categorizes data types if not already categorized
 */
function categorizeDataTypes(dataTypes: DataTypeRetention[]): DataTypeRetention[] {
  return dataTypes.map((dt) => {
    if (dt.category) {
      return dt;
    }

    // Auto-categorize based on common patterns
    const typeLower = dt.type.toLowerCase();

    if (typeLower.includes('log') || typeLower.includes('audit')) {
      return { ...dt, category: 'Operational' };
    }
    if (
      typeLower.includes('user') ||
      typeLower.includes('customer') ||
      typeLower.includes('employee')
    ) {
      return { ...dt, category: 'Personal Data' };
    }
    if (
      typeLower.includes('financial') ||
      typeLower.includes('payment') ||
      typeLower.includes('transaction')
    ) {
      return { ...dt, category: 'Financial' };
    }
    if (typeLower.includes('contract') || typeLower.includes('legal')) {
      return { ...dt, category: 'Legal' };
    }
    if (typeLower.includes('backup') || typeLower.includes('archive')) {
      return { ...dt, category: 'Archive' };
    }

    return { ...dt, category: 'General' };
  });
}

/**
 * Converts days to human-readable format
 */
function formatRetentionPeriod(days: number): string {
  if (days === 0) {
    return 'Immediate deletion';
  }
  if (days === 1) {
    return '1 day';
  }
  if (days < 30) {
    return `${days} days`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    if (remainingDays === 0) {
      return `${months} month${months > 1 ? 's' : ''}`;
    }
    return `${months} month${months > 1 ? 's' : ''} and ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
  }

  const years = Math.floor(days / 365);
  const remainingDays = days % 365;
  if (remainingDays === 0) {
    return `${years} year${years > 1 ? 's' : ''}`;
  }
  const months = Math.floor(remainingDays / 30);
  if (months === 0) {
    return `${years} year${years > 1 ? 's' : ''} and ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
  }
  return `${years} year${years > 1 ? 's' : ''} and ${months} month${months > 1 ? 's' : ''}`;
}

/**
 * Generates summary statistics
 */
function generateSummary(dataTypes: DataTypeRetention[]): RetentionPolicyDraft['summary'] {
  const totalDataTypes = dataTypes.length;
  const totalDays = dataTypes.reduce((sum, dt) => sum + dt.retentionDays, 0);
  const averageRetentionDays = Math.round(totalDays / totalDataTypes);

  const sorted = [...dataTypes].sort((a, b) => a.retentionDays - b.retentionDays);
  const shortest = sorted[0];
  const longest = sorted[sorted.length - 1];

  if (!shortest || !longest) {
    throw new Error('Invalid data types array');
  }

  const shortestRetention = {
    type: shortest.type,
    days: shortest.retentionDays,
  };
  const longestRetention = {
    type: longest.type,
    days: longest.retentionDays,
  };

  const categoryCounts: Record<string, number> = {};
  for (const dt of dataTypes) {
    const category = dt.category || 'Uncategorized';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  }

  return {
    totalDataTypes,
    averageRetentionDays,
    longestRetention,
    shortestRetention,
    categoryCounts,
  };
}

/**
 * Generates the markdown policy document
 */
function generatePolicyDocument(
  dataTypes: DataTypeRetention[],
  organizationName: string,
  effectiveDate: string
): string {
  const categorized = categorizeDataTypes(dataTypes);
  const categories = new Map<string, DataTypeRetention[]>();

  // Group by category
  for (const dt of categorized) {
    const category = dt.category || 'General';
    if (!categories.has(category)) {
      categories.set(category, []);
    }
    const categoryItems = categories.get(category);
    if (categoryItems) {
      categoryItems.push(dt);
    }
  }

  // Sort categories and data types
  const sortedCategories = Array.from(categories.keys()).sort();

  let policy = '# Data Retention Policy\n\n';
  policy += `**Organization:** ${organizationName}\n`;
  policy += `**Effective Date:** ${effectiveDate}\n`;
  policy += '**Version:** 1.0\n\n';

  policy += '## 1. Purpose\n\n';
  policy += `This Data Retention Policy establishes guidelines for the retention and disposal of data collected and maintained by ${organizationName}. The purpose of this policy is to ensure compliance with legal and regulatory requirements, protect organizational interests, and respect data subject rights.\n\n`;

  policy += '## 2. Scope\n\n';
  policy += `This policy applies to all data collected, processed, and stored by ${organizationName}, including but not limited to:\n\n`;
  for (const category of sortedCategories) {
    policy += `- ${category} data\n`;
  }
  policy += '\n';

  policy += '## 3. Retention Periods\n\n';
  policy +=
    'The following retention periods have been established based on legal requirements, business needs, and data protection principles:\n\n';

  for (const category of sortedCategories) {
    const items = categories.get(category);
    if (!items) continue;

    policy += `### 3.${sortedCategories.indexOf(category) + 1} ${category}\n\n`;

    for (const item of items) {
      const period = formatRetentionPeriod(item.retentionDays);
      policy += `#### ${item.type}\n\n`;
      policy += `- **Retention Period:** ${period} (${item.retentionDays} days)\n`;
      policy += `- **Justification:** ${item.justification}\n`;
      policy +=
        '- **Disposal Method:** Secure deletion or anonymization after retention period expires\n\n';
    }
  }

  policy += '## 4. Responsibilities\n\n';
  policy += '### 4.1 Data Owners\n\n';
  policy += 'Data owners are responsible for:\n';
  policy += '- Ensuring data is classified and labeled correctly\n';
  policy += '- Implementing retention periods according to this policy\n';
  policy += '- Coordinating data disposal when retention periods expire\n\n';

  policy += '### 4.2 IT Department\n\n';
  policy += 'The IT department is responsible for:\n';
  policy += '- Implementing technical controls to enforce retention periods\n';
  policy += '- Executing secure data disposal procedures\n';
  policy += '- Maintaining audit logs of data disposal activities\n\n';

  policy += '### 4.3 Compliance Team\n\n';
  policy += 'The compliance team is responsible for:\n';
  policy += '- Reviewing this policy annually\n';
  policy += '- Monitoring adherence to retention requirements\n';
  policy += '- Updating the policy to reflect regulatory changes\n\n';

  policy += '## 5. Data Disposal\n\n';
  policy +=
    'When data reaches the end of its retention period, it must be disposed of securely:\n\n';
  policy +=
    '- **Electronic Data:** Secure deletion using industry-standard methods (e.g., DoD 5220.22-M)\n';
  policy += '- **Physical Records:** Shredding or incineration\n';
  policy += '- **Backup Systems:** Coordinated deletion from all backup and archive systems\n';
  policy +=
    '- **Anonymization:** Where applicable, data may be anonymized instead of deleted for analytical purposes\n\n';

  policy += '## 6. Legal Holds\n\n';
  policy +=
    'In the event of litigation, investigations, or audits, data subject to legal hold must be preserved regardless of retention periods specified in this policy. The legal department will issue and manage legal hold notices.\n\n';

  policy += '## 7. Exceptions\n\n';
  policy += 'Requests for exceptions to this policy must be:\n';
  policy += '- Submitted in writing to the compliance team\n';
  policy += '- Justified with specific business or legal requirements\n';
  policy += '- Approved by the Chief Privacy Officer or equivalent\n';
  policy += '- Documented and reviewed annually\n\n';

  policy += '## 8. Policy Review\n\n';
  policy += 'This policy will be reviewed annually or when:\n';
  policy += '- New data types are collected\n';
  policy += '- Regulatory requirements change\n';
  policy += '- Business operations significantly change\n';
  policy += '- Data protection incidents occur\n\n';

  policy += '## 9. Related Policies\n\n';
  policy += 'This policy should be read in conjunction with:\n';
  policy += '- Privacy Policy\n';
  policy += '- Information Security Policy\n';
  policy += '- Data Classification Policy\n';
  policy += '- Incident Response Policy\n\n';

  policy += '## 10. Contact Information\n\n';
  policy += 'Questions about this policy should be directed to:\n\n';
  policy += '**Data Protection Officer**\n';
  policy += `Email: dpo@${organizationName.toLowerCase().replace(/\s+/g, '')}.com\n\n`;

  policy += '---\n\n';
  policy +=
    '*This document was automatically generated and should be reviewed by legal counsel before implementation.*\n';

  return policy;
}

/**
 * Retention Policy Draft Tool
 * Generates a comprehensive data retention policy document
 */
export const retentionPolicyDraft = tool({
  description:
    'Drafts a data retention policy document from data types, retention periods, and justifications. Takes an array of data types with retention requirements and generates a comprehensive markdown policy document suitable for compliance review. Useful for GDPR, CCPA, and other privacy regulations.',
  inputSchema: jsonSchema<RetentionPolicyDraftInput>({
    type: 'object',
    properties: {
      dataTypes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: 'Name of the data type (e.g., "User Account Data")',
            },
            retentionDays: {
              type: 'number',
              description: 'Retention period in days',
            },
            justification: {
              type: 'string',
              description: 'Business or legal justification for retention period',
            },
            category: {
              type: 'string',
              description:
                'Optional category (e.g., "Personal Data", "Financial"). Auto-categorized if omitted.',
            },
          },
          required: ['type', 'retentionDays', 'justification'],
        },
        description: 'Array of data types with retention requirements',
        minItems: 1,
      },
      organizationName: {
        type: 'string',
        description: 'Organization name for the policy document (default: "Your Organization")',
      },
      effectiveDate: {
        type: 'string',
        description: 'Effective date in ISO 8601 format (default: current date)',
      },
    },
    required: ['dataTypes'],
    additionalProperties: false,
  }),
  async execute({ dataTypes, organizationName, effectiveDate }): Promise<RetentionPolicyDraft> {
    // Validate inputs
    validateDataTypes(dataTypes);

    const orgName = organizationName || 'Your Organization';
    const defaultDate = new Date().toISOString().split('T')[0] || new Date().toISOString();
    const effDate = effectiveDate || defaultDate;

    // Generate policy document
    const policy = generatePolicyDocument(dataTypes, orgName, effDate);

    // Generate summary
    const summary = generateSummary(dataTypes);

    // Add metadata
    const metadata: RetentionPolicyDraft['metadata'] = {
      organizationName: orgName,
      effectiveDate: effDate,
      generatedAt: new Date().toISOString(),
      version: '1.0',
    };

    return {
      policy,
      dataTypes: categorizeDataTypes(dataTypes),
      summary,
      metadata,
    };
  },
});

export default retentionPolicyDraft;
