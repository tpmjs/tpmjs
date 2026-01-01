/**
 * Workflow Variant Generate Tool for TPMJS
 * Generates variations of workflows with configurable constraints
 *
 * @requires Node.js 18+
 */

import { createHash } from 'node:crypto';
import { jsonSchema, tool } from 'ai';

/**
 * Workflow step structure
 */
export interface WorkflowStep {
  id?: string;
  action: string;
  details?: string;
  duration?: number;
  dependencies?: string[];
  [key: string]: any;
}

/**
 * Base workflow structure
 */
export interface Workflow {
  name: string;
  description?: string;
  steps: WorkflowStep[];
  metadata?: Record<string, any>;
  [key: string]: any;
}

/**
 * Constraints for variant generation
 */
export interface VariantConstraints {
  maxSteps?: number;
  minSteps?: number;
  preserveOrder?: boolean;
  allowStepRemoval?: boolean;
  allowStepAddition?: boolean;
  allowStepModification?: boolean;
  allowReordering?: boolean;
  requiredSteps?: string[];
  forbiddenSteps?: string[];
  maxDuration?: number;
}

/**
 * Generated workflow variant with metadata
 */
export interface WorkflowVariant {
  name: string;
  description: string;
  steps: WorkflowStep[];
  metadata: {
    variantNumber: number;
    derivedFrom: string;
    generatedAt: string;
    hash: string;
    modifications: string[];
  };
}

/**
 * Output interface for variant generation
 */
export interface WorkflowVariantResult {
  variants: WorkflowVariant[];
  originalHash: string;
  variantHashes: string[];
}

type WorkflowVariantInput = {
  workflow: Workflow;
  goals: string[];
};

/**
 * Validates workflow structure
 */
function validateWorkflow(workflow: Workflow): void {
  if (!workflow || typeof workflow !== 'object') {
    throw new Error('Workflow must be an object');
  }

  if (!workflow.name || typeof workflow.name !== 'string') {
    throw new Error('Workflow must have a name string');
  }

  if (!Array.isArray(workflow.steps)) {
    throw new Error('Workflow must have a steps array');
  }

  if (workflow.steps.length === 0) {
    throw new Error('Workflow must have at least one step');
  }

  for (const step of workflow.steps) {
    if (!step.action || typeof step.action !== 'string') {
      throw new Error('Each workflow step must have an action string');
    }
  }
}

/**
 * Gets constraints for a specific goal
 * Domain rule: goal_constraints - Map optimization goals to workflow modification constraints
 */
function getGoalConstraints(goal: string): VariantConstraints {
  const goalLower = goal.toLowerCase();

  // Domain rule: fast_workflow_constraints - Fast workflows minimize steps and allow reordering
  if (goalLower.includes('fast') || goalLower.includes('speed')) {
    return {
      maxSteps: 5,
      minSteps: 2,
      allowStepRemoval: true,
      allowStepModification: true,
      allowReordering: true,
      preserveOrder: false,
    };
  }

  // Domain rule: accurate_workflow_constraints - Accurate workflows preserve steps and maintain order
  if (goalLower.includes('accurate') || goalLower.includes('quality')) {
    return {
      maxSteps: 20,
      minSteps: 5,
      allowStepRemoval: false,
      allowStepModification: true,
      allowReordering: false,
      preserveOrder: true,
    };
  }

  if (goalLower.includes('low-web') || goalLower.includes('offline')) {
    return {
      allowStepRemoval: true,
      allowStepModification: true,
      allowReordering: true,
      preserveOrder: false,
      forbiddenSteps: ['fetch', 'api', 'http', 'download', 'scrape'],
    };
  }

  // Default constraints
  return {
    allowStepRemoval: true,
    allowStepModification: true,
    allowReordering: true,
  };
}

/**
 * Checks if a variant is compatible with its goal
 */
function isVariantCompatible(variant: WorkflowVariant, goal: string): boolean {
  const goalLower = goal.toLowerCase();
  const stepCount = variant.steps.length;

  if (goalLower.includes('fast')) {
    return stepCount <= 5;
  }

  if (goalLower.includes('accurate')) {
    return stepCount >= 5;
  }

  if (goalLower.includes('low-web')) {
    const webSteps = ['fetch', 'api', 'http', 'download', 'scrape'];
    const hasWebSteps = variant.steps.some((step) =>
      webSteps.some((web) => step.action.toLowerCase().includes(web))
    );
    return !hasWebSteps;
  }

  return true;
}

/**
 * Creates a SHA-256 hash of content
 */
function createContentHash(content: any): string {
  const json = JSON.stringify(content, null, 0);
  return createHash('sha256').update(json).digest('hex').substring(0, 16);
}

/**
 * Deep clones an object
 */
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Creates a deterministic random number generator from seed
 */
function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) | 0;
    return (state >>> 0) / 4294967296;
  };
}

/**
 * Generates a variant by modifying steps for a specific goal
 */
function generateVariant(workflow: Workflow, goal: string, variantNumber: number): WorkflowVariant {
  const constraints = getGoalConstraints(goal);
  const random = createSeededRandom(variantNumber * 12345);
  const steps = deepClone(workflow.steps);
  const modifications: string[] = [];

  // Apply constraints with defaults
  const {
    maxSteps = 20,
    minSteps = 1,
    preserveOrder = false,
    allowStepRemoval = true,
    allowStepModification = true,
    allowReordering = true,
    requiredSteps = [],
    forbiddenSteps = [],
  } = constraints;

  let variantSteps = deepClone(steps);

  // Step removal (if allowed and not preserving order)
  if (allowStepRemoval && !preserveOrder && variantSteps.length > minSteps) {
    const removeCount = Math.floor(random() * 2); // Remove 0-1 steps
    for (let i = 0; i < removeCount && variantSteps.length > minSteps; i++) {
      const indexToRemove = Math.floor(random() * variantSteps.length);
      const stepToRemove = variantSteps[indexToRemove];

      // Don't remove required steps
      if (stepToRemove && !requiredSteps.includes(stepToRemove.action)) {
        const removed = variantSteps.splice(indexToRemove, 1);
        if (removed[0]) {
          modifications.push(`Removed step: ${removed[0].action}`);
        }
      }
    }
  }

  // Step modification (if allowed)
  if (allowStepModification && variantSteps.length > 0) {
    const modifyCount = Math.min(Math.floor(random() * 3), variantSteps.length); // Modify 0-2 steps

    for (let i = 0; i < modifyCount; i++) {
      const indexToModify = Math.floor(random() * variantSteps.length);
      const step = variantSteps[indexToModify];

      if (!step) continue;

      // Modify duration or details
      if (random() > 0.5 && step.duration !== undefined) {
        const oldDuration = step.duration;
        step.duration = Math.max(1, step.duration + Math.floor((random() - 0.5) * 4));
        modifications.push(`Modified ${step.action} duration: ${oldDuration}m → ${step.duration}m`);
      } else if (step.details) {
        step.details = `${step.details} (optimized)`;
        modifications.push(`Modified ${step.action} details`);
      }
    }
  }

  // Step reordering (if allowed and not preserving order)
  if (allowReordering && !preserveOrder && variantSteps.length > 1) {
    if (random() > 0.5) {
      // Swap two adjacent steps
      const index = Math.floor(random() * (variantSteps.length - 1));
      const step1 = variantSteps[index];
      const step2 = variantSteps[index + 1];

      if (step1 && step2) {
        // Don't reorder if steps have dependencies
        const hasNoDeps =
          (!step1.dependencies || step1.dependencies.length === 0) &&
          (!step2.dependencies || step2.dependencies.length === 0);

        if (hasNoDeps) {
          [variantSteps[index], variantSteps[index + 1]] = [step2, step1];
          modifications.push(`Reordered: swapped ${step2.action} and ${step1.action}`);
        }
      }
    }
  }

  // Filter forbidden steps
  if (forbiddenSteps.length > 0) {
    const beforeLength = variantSteps.length;
    variantSteps = variantSteps.filter((step) => !forbiddenSteps.includes(step.action));
    if (variantSteps.length < beforeLength) {
      modifications.push('Filtered forbidden steps');
    }
  }

  // Ensure min steps
  if (variantSteps.length < minSteps) {
    variantSteps = deepClone(steps);
    modifications.push('Reverted to original (too few steps after modifications)');
  }

  // Truncate to max steps
  if (variantSteps.length > maxSteps) {
    variantSteps = variantSteps.slice(0, maxSteps);
    modifications.push(`Truncated to ${maxSteps} steps`);
  }

  // If no modifications were made, add a note
  if (modifications.length === 0) {
    modifications.push('No modifications (variant matches constraints)');
  }

  const variant: WorkflowVariant = {
    name: `${workflow.name} (${goal})`,
    description: workflow.description
      ? `${workflow.description} - Optimized for ${goal}`
      : `${goal} variant of ${workflow.name}`,
    steps: variantSteps,
    metadata: {
      variantNumber,
      derivedFrom: workflow.name,
      generatedAt: new Date().toISOString(),
      hash: createContentHash(variantSteps),
      modifications: [...modifications, `Goal: ${goal}`],
    },
  };

  return variant;
}

/**
 * Workflow Variant Generate Tool
 * Creates meaningful workflow variants for different goals (fast, accurate, low-web)
 */
export const workflowVariantGenerateTool = tool({
  description:
    'Creates meaningful workflow variants for different goals (fast, accurate, low-web). Applies variant rules per goal, checks variant compatibility, and produces meaningfully different variants.',
  inputSchema: jsonSchema<WorkflowVariantInput>({
    type: 'object',
    properties: {
      workflow: {
        type: 'object',
        description: 'Base workflow to generate variants from',
        properties: {
          name: {
            type: 'string',
            description: 'Workflow name (required)',
          },
          description: {
            type: 'string',
            description: 'Optional workflow description',
          },
          steps: {
            type: 'array',
            description: 'Array of workflow steps',
            items: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  description: 'Step action name (required)',
                },
                details: {
                  type: 'string',
                  description: 'Optional step details',
                },
                duration: {
                  type: 'number',
                  description: 'Optional step duration in minutes',
                },
              },
              required: ['action'],
            },
          },
        },
        required: ['name', 'steps'],
      },
      goals: {
        type: 'array',
        description: 'Variant goals (fast, accurate, low-web)',
        items: {
          type: 'string',
        },
      },
    },
    required: ['workflow', 'goals'],
    additionalProperties: false,
  }),
  async execute({ workflow, goals }): Promise<WorkflowVariantResult> {
    // Validate inputs
    validateWorkflow(workflow);

    if (!Array.isArray(goals) || goals.length === 0) {
      throw new Error('Goals must be a non-empty array');
    }

    // Generate original hash
    const originalHash = createContentHash(workflow.steps);

    // Generate variants for each goal
    const variants: WorkflowVariant[] = [];
    const variantHashes: string[] = [];

    for (let i = 0; i < goals.length; i++) {
      const goal = goals[i]!;
      const variant = generateVariant(workflow, goal, i + 1);

      // Check compatibility
      if (!isVariantCompatible(variant, goal)) {
        // Retry with different seed
        const retryVariant = generateVariant(workflow, goal, i + 100);
        if (isVariantCompatible(retryVariant, goal)) {
          variants.push(retryVariant);
          variantHashes.push(retryVariant.metadata.hash);
        } else {
          // Add note about incompatibility
          variant.metadata.modifications.push(
            'Warning: Variant may not fully satisfy goal constraints'
          );
          variants.push(variant);
          variantHashes.push(variant.metadata.hash);
        }
      } else {
        variants.push(variant);
        variantHashes.push(variant.metadata.hash);
      }
    }

    return {
      variants,
      originalHash,
      variantHashes,
    };
  },
});

export default workflowVariantGenerateTool;
