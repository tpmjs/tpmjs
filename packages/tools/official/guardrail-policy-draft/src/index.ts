/**
 * Guardrail Policy Draft Tool for TPMJS
 * Drafts guardrail policies for agent workflows with rules, severity levels, and enforcement actions.
 * Useful for establishing safety boundaries and compliance requirements.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Severity levels for policy rules
 */
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * Enforcement actions for policy violations
 */
export type Action =
  | 'block'
  | 'warn'
  | 'log'
  | 'review'
  | 'escalate'
  | 'retry'
  | 'fallback'
  | 'notify';

/**
 * A single policy rule
 */
export interface PolicyRule {
  rule: string;
  severity: Severity;
  action: Action;
}

/**
 * Statistics about the policy
 */
export interface PolicyStats {
  totalRules: number;
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  byAction: Record<Action, number>;
}

/**
 * Output interface for guardrail policy draft
 */
export interface GuardrailPolicyDraft {
  policy: string;
  rules: PolicyRule[];
  summary: string;
  stats: PolicyStats;
  createdAt: string;
}

type GuardrailPolicyDraftInput = {
  policies: PolicyRule[];
};

/**
 * Validates severity level
 */
function isValidSeverity(severity: string): severity is Severity {
  return ['critical', 'high', 'medium', 'low', 'info'].includes(severity);
}

/**
 * Validates action type
 */
function isValidAction(action: string): action is Action {
  return ['block', 'warn', 'log', 'review', 'escalate', 'retry', 'fallback', 'notify'].includes(
    action
  );
}

/**
 * Gets emoji for severity level
 */
function getSeverityEmoji(severity: Severity): string {
  const emojiMap: Record<Severity, string> = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🔵',
    info: '⚪',
  };
  return emojiMap[severity];
}

/**
 * Gets description for action
 */
function getActionDescription(action: Action): string {
  const descriptions: Record<Action, string> = {
    block: 'Prevent execution and terminate workflow',
    warn: 'Display warning but allow execution to continue',
    log: 'Record violation in logs for audit',
    review: 'Flag for human review before proceeding',
    escalate: 'Escalate to supervisor or admin',
    retry: 'Retry the operation with corrections',
    fallback: 'Use fallback behavior or default action',
    notify: 'Send notification to stakeholders',
  };
  return descriptions[action];
}

/**
 * Formats policy rules into markdown
 */
function formatPolicyMarkdown(rules: PolicyRule[]): string {
  const sections: string[] = [];

  sections.push('# Agent Guardrail Policy');
  sections.push('');
  sections.push(
    'This policy defines the guardrails and safety boundaries for agent workflow execution.'
  );
  sections.push('');
  sections.push('---');
  sections.push('');

  // Group by severity
  const bySeverity: Record<Severity, PolicyRule[]> = {
    critical: [],
    high: [],
    medium: [],
    low: [],
    info: [],
  };

  for (const rule of rules) {
    bySeverity[rule.severity].push(rule);
  }

  // Render each severity level
  const severityLevels: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];

  for (const severity of severityLevels) {
    const rulesAtLevel = bySeverity[severity];
    if (rulesAtLevel.length === 0) continue;

    sections.push(`## ${getSeverityEmoji(severity)} ${severity.toUpperCase()} Severity`);
    sections.push('');

    for (let i = 0; i < rulesAtLevel.length; i++) {
      const rule = rulesAtLevel[i];
      if (!rule) continue;

      sections.push(`### Rule ${i + 1}: ${rule.rule}`);
      sections.push('');
      sections.push(`- **Severity:** ${severity}`);
      sections.push(`- **Action:** ${rule.action}`);
      sections.push(`- **Enforcement:** ${getActionDescription(rule.action)}`);
      sections.push('');
    }
  }

  sections.push('---');
  sections.push('');
  sections.push('## Enforcement Guidelines');
  sections.push('');
  sections.push('1. **Critical & High** - Must be enforced before any execution');
  sections.push('2. **Medium** - Should be checked during execution');
  sections.push('3. **Low & Info** - May be checked post-execution for auditing');
  sections.push('');

  return sections.join('\n');
}

/**
 * Calculates statistics for the policy
 */
function calculateStats(rules: PolicyRule[]): PolicyStats {
  const stats: PolicyStats = {
    totalRules: rules.length,
    bySeverity: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    },
    byAction: {
      block: 0,
      warn: 0,
      log: 0,
      review: 0,
      escalate: 0,
      retry: 0,
      fallback: 0,
      notify: 0,
    },
  };

  for (const rule of rules) {
    stats.bySeverity[rule.severity]++;
    stats.byAction[rule.action]++;
  }

  return stats;
}

/**
 * Generates a summary of the policy
 */
function generateSummary(_rules: PolicyRule[], stats: PolicyStats): string {
  const parts: string[] = [];

  parts.push(`${stats.totalRules} total rules`);

  const criticalAndHigh = stats.bySeverity.critical + stats.bySeverity.high;
  if (criticalAndHigh > 0) {
    parts.push(`${criticalAndHigh} critical/high priority`);
  }

  const blockCount = stats.byAction.block;
  if (blockCount > 0) {
    parts.push(`${blockCount} blocking rule(s)`);
  }

  return parts.join(' | ');
}

/**
 * Guardrail Policy Draft Tool
 * Creates a formatted policy document from rules
 */
export const guardrailPolicyDraftTool = tool({
  description:
    'Drafts guardrail policies for agent workflows with rules, severity levels, and enforcement actions. Returns a formatted markdown policy document with statistics and summary. Useful for establishing safety boundaries, compliance requirements, and operational constraints.',
  inputSchema: jsonSchema<GuardrailPolicyDraftInput>({
    type: 'object',
    properties: {
      policies: {
        type: 'array',
        description: 'Array of policy rules with rule text, severity level, and enforcement action',
        items: {
          type: 'object',
          properties: {
            rule: {
              type: 'string',
              description:
                'The policy rule or constraint (e.g., "Do not access production database")',
            },
            severity: {
              type: 'string',
              enum: ['critical', 'high', 'medium', 'low', 'info'],
              description:
                'Severity level: critical (immediate risk), high (significant risk), medium (moderate risk), low (minor risk), info (informational)',
            },
            action: {
              type: 'string',
              enum: ['block', 'warn', 'log', 'review', 'escalate', 'retry', 'fallback', 'notify'],
              description:
                'Action to take on violation: block (stop execution), warn (show warning), log (record), review (human review), escalate (notify admin), retry (attempt correction), fallback (use default), notify (send alert)',
            },
          },
          required: ['rule', 'severity', 'action'],
        },
      },
    },
    required: ['policies'],
    additionalProperties: false,
  }),
  async execute({ policies }): Promise<GuardrailPolicyDraft> {
    // Validate input
    if (!Array.isArray(policies)) {
      throw new Error('policies must be an array of policy rules');
    }

    if (policies.length === 0) {
      throw new Error('At least one policy rule is required');
    }

    // Validate and normalize each policy
    const validatedRules: PolicyRule[] = [];

    for (let i = 0; i < policies.length; i++) {
      const policy = policies[i];

      if (!policy || typeof policy !== 'object') {
        throw new Error(`Policy at index ${i} must be an object`);
      }

      const { rule, severity, action } = policy;

      if (!rule || typeof rule !== 'string' || rule.trim().length === 0) {
        throw new Error(`Policy at index ${i}: rule must be a non-empty string`);
      }

      if (!severity || typeof severity !== 'string') {
        throw new Error(`Policy at index ${i}: severity is required`);
      }

      if (!isValidSeverity(severity)) {
        throw new Error(
          `Policy at index ${i}: severity must be one of: critical, high, medium, low, info`
        );
      }

      if (!action || typeof action !== 'string') {
        throw new Error(`Policy at index ${i}: action is required`);
      }

      if (!isValidAction(action)) {
        throw new Error(
          `Policy at index ${i}: action must be one of: block, warn, log, review, escalate, retry, fallback, notify`
        );
      }

      validatedRules.push({
        rule: rule.trim(),
        severity,
        action,
      });
    }

    // Calculate statistics
    const stats = calculateStats(validatedRules);

    // Generate summary
    const summary = generateSummary(validatedRules, stats);

    // Format policy document
    const policy = formatPolicyMarkdown(validatedRules);

    return {
      policy,
      rules: validatedRules,
      summary,
      stats,
      createdAt: new Date().toISOString(),
    };
  },
});

export default guardrailPolicyDraftTool;
