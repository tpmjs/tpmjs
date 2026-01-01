/**
 * Runbook Draft Tool for TPMJS
 * Drafts operational runbooks from procedure steps with commands and verification.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Input interface for runbook step
 */
export interface RunbookStep {
  action: string;
  command?: string;
  verification?: string;
}

/**
 * Precheck item to run before starting the procedure
 */
export interface PrecheckItem {
  check: string;
  command?: string;
}

/**
 * Rollback step for reverting changes
 */
export interface RollbackStep {
  action: string;
  command?: string;
}

/**
 * Input interface for runbook draft
 */
export interface RunbookDraftInput {
  title: string;
  steps: RunbookStep[];
  prechecks?: PrecheckItem[];
  rollback?: RollbackStep[];
}

/**
 * Output interface for runbook draft
 */
export interface RunbookDraft {
  runbook: string;
  stepCount: number;
  hasCommands: boolean;
  hasPrechecks: boolean;
  hasRollback: boolean;
}

/**
 * Formats a runbook step as markdown
 *
 * Domain rule: markdown_template - Uses markdown heading (###) for steps, code blocks for commands
 */
function formatStep(step: RunbookStep, index: number): string {
  const lines: string[] = [];

  // Step header
  lines.push(`### Step ${index + 1}: ${step.action}`);
  lines.push('');

  // Command section
  if (step.command) {
    lines.push('**Command:**');
    lines.push('```bash');
    lines.push(step.command);
    lines.push('```');
    lines.push('');
  }

  // Verification section
  if (step.verification) {
    lines.push('**Verification:**');
    lines.push(step.verification);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Formats a precheck item as markdown
 */
function formatPrecheck(precheck: PrecheckItem, index: number): string {
  const lines: string[] = [];
  lines.push(`${index + 1}. ${precheck.check}`);
  if (precheck.command) {
    lines.push('   ```bash');
    lines.push(`   ${precheck.command}`);
    lines.push('   ```');
  }
  return lines.join('\n');
}

/**
 * Formats a rollback step as markdown
 */
function formatRollbackStep(step: RollbackStep, index: number): string {
  const lines: string[] = [];
  lines.push(`${index + 1}. ${step.action}`);
  if (step.command) {
    lines.push('   ```bash');
    lines.push(`   ${step.command}`);
    lines.push('   ```');
  }
  return lines.join('\n');
}

/**
 * Generates the runbook markdown
 *
 * Domain rule: doc_sections - Follows runbook pattern: Header -> Overview -> Prerequisites -> Prechecks -> Procedure -> Verification -> Rollback -> Completion
 * Domain rule: markdown_template - Uses # for title, ## for sections, ### for steps
 */
function generateRunbook(
  title: string,
  steps: RunbookStep[],
  prechecks?: PrecheckItem[],
  rollback?: RollbackStep[]
): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ${title}`);
  lines.push('');
  lines.push('## Overview');
  lines.push('');
  lines.push(
    `This runbook contains ${steps.length} step${steps.length !== 1 ? 's' : ''} for completing the procedure.`
  );
  lines.push('');

  // Prerequisites section
  const hasCommands = steps.some((step) => step.command);
  if (hasCommands) {
    lines.push('## Prerequisites');
    lines.push('');
    lines.push('- Access to required systems and tools');
    lines.push('- Appropriate permissions to execute commands');
    lines.push('- Familiarity with the environment');
    lines.push('');
  }

  // Prechecks section
  if (prechecks && prechecks.length > 0) {
    lines.push('## Prechecks');
    lines.push('');
    lines.push('**Before starting, verify the following conditions are met:**');
    lines.push('');
    for (let i = 0; i < prechecks.length; i++) {
      const precheck = prechecks[i];
      if (precheck) {
        lines.push(formatPrecheck(precheck, i));
      }
    }
    lines.push('');
  }

  // Procedure section
  lines.push('## Procedure');
  lines.push('');

  // Add each step
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (step) {
      lines.push(formatStep(step, i));
    }
  }

  // Verification section
  lines.push('## Verification');
  lines.push('');
  lines.push('After completing all steps, verify the procedure was successful:');
  lines.push('');
  lines.push('- [ ] All steps completed without errors');
  lines.push('- [ ] Expected outcomes are observed');
  lines.push('- [ ] System is functioning as expected');
  lines.push('');

  // Rollback section
  if (rollback && rollback.length > 0) {
    lines.push('## Rollback');
    lines.push('');
    lines.push('**If something goes wrong, follow these steps to revert changes:**');
    lines.push('');
    for (let i = 0; i < rollback.length; i++) {
      const step = rollback[i];
      if (step) {
        lines.push(formatRollbackStep(step, i));
      }
    }
    lines.push('');
  } else {
    // Add a placeholder rollback section even if none provided
    lines.push('## Rollback');
    lines.push('');
    lines.push('**If something goes wrong, consider the following:**');
    lines.push('');
    lines.push('- Identify which step caused the issue');
    lines.push('- Review logs and error messages');
    lines.push('- Revert any changes made during the procedure');
    lines.push('- Contact the on-call team if needed');
    lines.push('');
  }

  // Footer
  lines.push('## Completion');
  lines.push('');
  lines.push('Once all steps are complete and verified, the procedure is finished.');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(`*Generated: ${new Date().toISOString()}*`);

  return lines.join('\n');
}

/**
 * Runbook Draft Tool
 * Drafts operational runbooks from procedure steps
 */
export const runbookDraftTool = tool({
  description:
    'Draft operational runbooks from procedure steps with commands and verification. Creates structured documentation for operational procedures with optional command examples and verification steps.',
  inputSchema: jsonSchema<RunbookDraftInput>({
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Title of the runbook',
      },
      steps: {
        type: 'array',
        description: 'Array of procedure steps',
        items: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              description: 'Description of the action to perform',
            },
            command: {
              type: 'string',
              description: 'Optional command to execute',
            },
            verification: {
              type: 'string',
              description: 'Optional verification step to confirm success',
            },
          },
          required: ['action'],
          additionalProperties: false,
        },
      },
      prechecks: {
        type: 'array',
        description: 'Optional prechecks to run before starting the procedure',
        items: {
          type: 'object',
          properties: {
            check: {
              type: 'string',
              description: 'Description of what to check',
            },
            command: {
              type: 'string',
              description: 'Optional command to verify the check',
            },
          },
          required: ['check'],
          additionalProperties: false,
        },
      },
      rollback: {
        type: 'array',
        description: 'Optional rollback steps to revert changes if something goes wrong',
        items: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              description: 'Description of the rollback action',
            },
            command: {
              type: 'string',
              description: 'Optional command to execute for rollback',
            },
          },
          required: ['action'],
          additionalProperties: false,
        },
      },
    },
    required: ['title', 'steps'],
    additionalProperties: false,
  }),
  async execute({ title, steps, prechecks, rollback }): Promise<RunbookDraft> {
    // Domain rule: input_validation - Validates required fields (title, steps), types, and non-empty constraints
    // Validate inputs
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new Error('Title is required and must be a non-empty string');
    }

    if (!Array.isArray(steps) || steps.length === 0) {
      throw new Error('Steps must be a non-empty array');
    }

    // Validate each step
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (!step || typeof step !== 'object') {
        throw new Error(`Step ${i + 1} must be an object`);
      }
      if (!step.action || typeof step.action !== 'string' || step.action.trim().length === 0) {
        throw new Error(`Step ${i + 1} must have a non-empty action`);
      }
      if (step.command !== undefined && typeof step.command !== 'string') {
        throw new Error(`Step ${i + 1} command must be a string if provided`);
      }
      if (step.verification !== undefined && typeof step.verification !== 'string') {
        throw new Error(`Step ${i + 1} verification must be a string if provided`);
      }
    }

    // Validate prechecks if provided
    if (prechecks) {
      for (let i = 0; i < prechecks.length; i++) {
        const precheck = prechecks[i];
        if (!precheck || typeof precheck !== 'object') {
          throw new Error(`Precheck ${i + 1} must be an object`);
        }
        if (
          !precheck.check ||
          typeof precheck.check !== 'string' ||
          precheck.check.trim().length === 0
        ) {
          throw new Error(`Precheck ${i + 1} must have a non-empty check`);
        }
      }
    }

    // Validate rollback steps if provided
    if (rollback) {
      for (let i = 0; i < rollback.length; i++) {
        const step = rollback[i];
        if (!step || typeof step !== 'object') {
          throw new Error(`Rollback step ${i + 1} must be an object`);
        }
        if (!step.action || typeof step.action !== 'string' || step.action.trim().length === 0) {
          throw new Error(`Rollback step ${i + 1} must have a non-empty action`);
        }
      }
    }

    // Generate the runbook
    const runbook = generateRunbook(title, steps, prechecks, rollback);
    const hasCommands = steps.some((step) => step.command);
    const hasPrechecks = Boolean(prechecks && prechecks.length > 0);
    const hasRollback = Boolean(rollback && rollback.length > 0);

    return {
      runbook,
      stepCount: steps.length,
      hasCommands,
      hasPrechecks,
      hasRollback,
    };
  },
});

export default runbookDraftTool;
