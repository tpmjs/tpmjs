/**
 * Policy Document Format Tool for TPMJS
 * Formats HR policy content into standardized policy document structure
 */

import { jsonSchema, tool } from 'ai';

/**
 * Policy metadata
 */
interface PolicyMetadata {
  title?: string;
  policyNumber?: string;
  owner?: string;
  department?: string;
  effectiveDate?: string;
  reviewDate?: string;
  version?: string;
  approvedBy?: string;
}

/**
 * Input interface for policy document formatting
 */
interface PolicyDocFormatInput {
  policyContent: string;
  metadata?: PolicyMetadata;
}

/**
 * Formatted policy document structure
 */
export interface PolicyDocument {
  header: {
    title: string;
    policyNumber?: string;
    version: string;
    effectiveDate: string;
    reviewDate: string;
    owner: string;
    approvedBy?: string;
  };
  purpose: string;
  scope: string;
  policyStatement: string;
  procedures: string[];
  responsibilities: Record<string, string[]>; // Role -> Responsibilities
  definitions?: Record<string, string>; // Term -> Definition
  relatedPolicies?: string[];
  enforcement?: string;
  revisionHistory?: Array<{
    version: string;
    date: string;
    changes: string;
  }>;
  fullDocument: string;
}

/**
 * Policy Document Format Tool
 * Formats HR policy content into standardized policy document structure
 */
export const policyDocFormatTool = tool({
  description:
    'Formats HR policy content into a standardized policy document structure. Creates organized sections including purpose, scope, policy statement, procedures, responsibilities, and metadata with effective date, owner, and review date.',
  inputSchema: jsonSchema<PolicyDocFormatInput>({
    type: 'object',
    properties: {
      policyContent: {
        type: 'string',
        description: 'Raw policy content to be formatted into standard structure',
        minLength: 10,
      },
      metadata: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Policy title' },
          policyNumber: { type: 'string', description: 'Policy number or identifier' },
          owner: { type: 'string', description: 'Policy owner (name or department)' },
          department: { type: 'string', description: 'Responsible department' },
          effectiveDate: { type: 'string', description: 'Policy effective date' },
          reviewDate: { type: 'string', description: 'Next review date' },
          version: { type: 'string', description: 'Policy version' },
          approvedBy: { type: 'string', description: 'Approver name or title' },
        },
        description: 'Policy metadata and administrative information',
      },
    },
    required: ['policyContent'],
    additionalProperties: false,
  }),
  execute: async ({ policyContent, metadata = {} }): Promise<PolicyDocument> => {
    // Validate inputs
    if (!policyContent || typeof policyContent !== 'string' || policyContent.trim().length < 10) {
      throw new Error('Policy content must be a non-empty string with at least 10 characters');
    }

    try {
      // Extract or generate title
      const title = metadata.title || extractTitle(policyContent) || 'Human Resources Policy';

      // Generate dates if not provided
      const today = new Date();
      const effectiveDate =
        metadata.effectiveDate ||
        today.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

      const nextYear = new Date(today);
      nextYear.setFullYear(today.getFullYear() + 1);
      const reviewDate =
        metadata.reviewDate ||
        nextYear.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

      // Build header
      const header = {
        title,
        policyNumber: metadata.policyNumber,
        version: metadata.version || '1.0',
        effectiveDate,
        reviewDate,
        owner: metadata.owner || metadata.department || 'Human Resources',
        approvedBy: metadata.approvedBy,
      };

      // Extract or generate sections
      const purpose = extractPurpose(policyContent);
      const scope = extractScope(policyContent);
      const policyStatement = extractPolicyStatement(policyContent);
      const procedures = extractProcedures(policyContent);
      const responsibilities = extractResponsibilities(policyContent);
      const definitions = extractDefinitions(policyContent);
      const relatedPolicies = extractRelatedPolicies(policyContent);
      const enforcement = extractEnforcement(policyContent);

      // Build full document
      const fullDocument = buildFullDocument(
        header,
        purpose,
        scope,
        policyStatement,
        procedures,
        responsibilities,
        definitions,
        relatedPolicies,
        enforcement
      );

      return {
        header,
        purpose,
        scope,
        policyStatement,
        procedures,
        responsibilities,
        definitions: definitions.size > 0 ? Object.fromEntries(definitions) : undefined,
        relatedPolicies: relatedPolicies.length > 0 ? relatedPolicies : undefined,
        enforcement,
        revisionHistory: [
          {
            version: header.version,
            date: effectiveDate,
            changes: 'Initial version',
          },
        ],
        fullDocument,
      };
    } catch (error) {
      throw new Error(
        `Failed to format policy document: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});

/**
 * Extract title from content
 */
function extractTitle(content: string): string | null {
  // Try to find title in first few lines
  const lines = content.split('\n').filter((l) => l.trim());
  if (lines.length > 0 && lines[0]) {
    const firstLine = lines[0].trim();
    // If first line looks like a title (short, no periods)
    if (firstLine.length < 100 && !firstLine.includes('.')) {
      return firstLine.replace(/^#+\s*/, ''); // Remove markdown headers
    }
  }
  return null;
}

/**
 * Extract purpose section
 */
function extractPurpose(content: string): string {
  const purposeMatch = content.match(
    /(?:purpose|objective|intent)[\s:]+(.+?)(?=\n\n|scope|policy|$)/is
  );
  if (purposeMatch && purposeMatch[1]) {
    return purposeMatch[1].trim();
  }

  // Generate default purpose
  return 'This policy establishes guidelines and procedures to ensure consistency, compliance, and best practices within the organization.';
}

/**
 * Extract scope section
 */
function extractScope(content: string): string {
  const scopeMatch = content.match(/scope[\s:]+(.+?)(?=\n\n|policy|procedure|$)/is);
  if (scopeMatch && scopeMatch[1]) {
    return scopeMatch[1].trim();
  }

  // Generate default scope
  return 'This policy applies to all employees, contractors, and other personnel associated with the organization.';
}

/**
 * Extract policy statement
 */
function extractPolicyStatement(content: string): string {
  const statementMatch = content.match(/policy[\s:]+(.+?)(?=\n\n|procedure|$)/is);
  if (statementMatch && statementMatch[1]) {
    return statementMatch[1].trim();
  }

  // Use first substantial paragraph as policy statement
  const paragraphs = content.split('\n\n').filter((p) => p.trim().length > 50);
  return paragraphs[0] || content.substring(0, 500);
}

/**
 * Extract procedures
 */
function extractProcedures(content: string): string[] {
  const procedures: string[] = [];

  // Look for numbered lists or bullet points
  const procedureSection = content.match(/procedure[s]?[\s:]+(.+?)(?=\n\n[A-Z]|$)/is);
  if (procedureSection && procedureSection[1]) {
    const text = procedureSection[1];
    const matches = text.match(/(?:^|\n)\s*(?:\d+\.|[-*])\s*(.+)/gm);
    if (matches) {
      procedures.push(...matches.map((m) => m.replace(/^\s*(?:\d+\.|[-*])\s*/, '').trim()));
    }
  }

  // If no procedures found, create generic ones
  if (procedures.length === 0) {
    procedures.push(
      'Review and understand this policy',
      'Follow established guidelines and procedures',
      'Report violations or concerns to management',
      'Participate in required training'
    );
  }

  return procedures;
}

/**
 * Extract responsibilities
 */
function extractResponsibilities(content: string): Record<string, string[]> {
  const responsibilities: Record<string, string[]> = {};

  // Look for responsibility sections
  const respMatch = content.match(/responsibilit(?:ies|y)[\s:]+(.+?)(?=\n\n[A-Z]|$)/is);

  if (respMatch && respMatch[1]) {
    const text = respMatch[1];
    const roleMatches = text.matchAll(/([A-Za-z\s]+?)[:]\s*(.+?)(?=\n[A-Z]|$)/gs);

    for (const match of roleMatches) {
      const role = match[1]?.trim();
      const dutiesText = match[2];
      if (role && dutiesText) {
        const duties = dutiesText
          .split(/[;,]|(?:\n\s*[-*])/g)
          .map((d) => d.trim())
          .filter((d) => d.length > 0);
        responsibilities[role] = duties;
      }
    }
  }

  // Default responsibilities if none found
  if (Object.keys(responsibilities).length === 0) {
    responsibilities['Employees'] = [
      'Comply with policy requirements',
      'Report violations or concerns',
    ];
    responsibilities['Managers'] = [
      'Ensure team compliance',
      'Address policy violations',
      'Provide guidance and support',
    ];
    responsibilities['HR Department'] = [
      'Maintain and update policy',
      'Provide training and resources',
      'Monitor compliance',
    ];
  }

  return responsibilities;
}

/**
 * Extract definitions
 */
function extractDefinitions(content: string): Map<string, string> {
  const definitions = new Map<string, string>();

  const defMatch = content.match(/definition[s]?[\s:]+(.+?)(?=\n\n[A-Z]|$)/is);
  if (defMatch && defMatch[1]) {
    const text = defMatch[1];
    const termMatches = text.matchAll(/([A-Za-z\s]+?)[:]\s*(.+?)(?=\n|$)/g);

    for (const match of termMatches) {
      const term = match[1]?.trim();
      const definition = match[2]?.trim();
      if (term && definition) {
        definitions.set(term, definition);
      }
    }
  }

  return definitions;
}

/**
 * Extract related policies
 */
function extractRelatedPolicies(content: string): string[] {
  const policies: string[] = [];

  const relatedMatch = content.match(/related\s+polic(?:ies|y)[\s:]+(.+?)(?=\n\n|$)/is);
  if (relatedMatch && relatedMatch[1]) {
    const text = relatedMatch[1];
    const policyMatches = text.match(/(?:^|\n)\s*(?:\d+\.|[-*])\s*(.+)/gm);
    if (policyMatches) {
      policies.push(...policyMatches.map((m) => m.replace(/^\s*(?:\d+\.|[-*])\s*/, '').trim()));
    }
  }

  return policies;
}

/**
 * Extract enforcement section
 */
function extractEnforcement(content: string): string {
  const enforcementMatch = content.match(/enforcement|violation[s]?[\s:]+(.+?)(?=\n\n|$)/is);
  if (enforcementMatch && enforcementMatch[1]) {
    return enforcementMatch[1].trim();
  }

  return 'Violations of this policy may result in disciplinary action up to and including termination of employment. The severity of disciplinary action will depend on the nature and circumstances of the violation.';
}

/**
 * Build full formatted document
 */
function buildFullDocument(
  header: PolicyDocument['header'],
  purpose: string,
  scope: string,
  policyStatement: string,
  procedures: string[],
  responsibilities: Record<string, string[]>,
  definitions?: Map<string, string>,
  relatedPolicies?: string[],
  enforcement?: string
): string {
  const sections: string[] = [];

  // Header
  sections.push('═'.repeat(80));
  sections.push(header.title.toUpperCase());
  sections.push('═'.repeat(80));
  sections.push('');
  if (header.policyNumber) sections.push(`Policy Number: ${header.policyNumber}`);
  sections.push(`Version: ${header.version}`);
  sections.push(`Effective Date: ${header.effectiveDate}`);
  sections.push(`Review Date: ${header.reviewDate}`);
  sections.push(`Owner: ${header.owner}`);
  if (header.approvedBy) sections.push(`Approved By: ${header.approvedBy}`);
  sections.push('');

  // Purpose
  sections.push('1. PURPOSE');
  sections.push('─'.repeat(80));
  sections.push(purpose);
  sections.push('');

  // Scope
  sections.push('2. SCOPE');
  sections.push('─'.repeat(80));
  sections.push(scope);
  sections.push('');

  // Policy Statement
  sections.push('3. POLICY STATEMENT');
  sections.push('─'.repeat(80));
  sections.push(policyStatement);
  sections.push('');

  // Procedures
  sections.push('4. PROCEDURES');
  sections.push('─'.repeat(80));
  procedures.forEach((proc, idx) => {
    sections.push(`${idx + 1}. ${proc}`);
  });
  sections.push('');

  // Responsibilities
  sections.push('5. RESPONSIBILITIES');
  sections.push('─'.repeat(80));
  for (const [role, duties] of Object.entries(responsibilities)) {
    sections.push(`${role}:`);
    duties.forEach((duty) => {
      sections.push(`  • ${duty}`);
    });
    sections.push('');
  }

  // Definitions (if any)
  if (definitions && definitions.size > 0) {
    sections.push('6. DEFINITIONS');
    sections.push('─'.repeat(80));
    for (const [term, definition] of definitions) {
      sections.push(`${term}: ${definition}`);
    }
    sections.push('');
  }

  // Related Policies (if any)
  if (relatedPolicies && relatedPolicies.length > 0) {
    sections.push('7. RELATED POLICIES');
    sections.push('─'.repeat(80));
    relatedPolicies.forEach((policy) => {
      sections.push(`• ${policy}`);
    });
    sections.push('');
  }

  // Enforcement
  if (enforcement) {
    sections.push('8. ENFORCEMENT');
    sections.push('─'.repeat(80));
    sections.push(enforcement);
    sections.push('');
  }

  sections.push('═'.repeat(80));
  sections.push('END OF POLICY DOCUMENT');
  sections.push('═'.repeat(80));

  return sections.join('\n');
}

export default policyDocFormatTool;
