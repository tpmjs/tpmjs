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
 * Input interface for runbook draft
 */
export interface RunbookDraftInput {
  title: string;
  steps: RunbookStep[];
}

/**
 * Output interface for runbook draft
 */
export interface RunbookDraft {
  runbook: string;
  stepCount: number;
  hasCommands: boolean;
}

/**
 * Formats a runbook step as markdown
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
 * Generates the runbook markdown
 */
function generateRunbook(title: string, steps: RunbookStep[]): string {
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
    },
    required: ['title', 'steps'],
    additionalProperties: false,
  }),
  async execute({ title, steps }): Promise<RunbookDraft> {
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

    // Generate the runbook
    const runbook = generateRunbook(title, steps);
    const hasCommands = steps.some((step) => step.command);

    return {
      runbook,
      stepCount: steps.length,
      hasCommands,
    };
  },
});

export default runbookDraftTool;
