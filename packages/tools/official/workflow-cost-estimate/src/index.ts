/**
 * Workflow Cost Estimate Tool for TPMJS
 * Estimates cost of running a workflow based on step count,
 * step types, and estimated API calls.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Represents a workflow step with optional metadata
 */
export interface WorkflowStep {
  id: string;
  name?: string;
  type?: string;
  estimatedCalls?: number;
  customCost?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Workflow structure containing steps
 */
export interface Workflow {
  steps: WorkflowStep[];
  metadata?: Record<string, unknown>;
}

/**
 * Cost breakdown for a single step
 */
export interface StepCostBreakdown {
  stepId: string;
  stepIndex: number;
  stepName?: string;
  stepType?: string;
  estimatedCalls: number;
  costPerCall: number;
  stepCost: number;
}

/**
 * Cost estimate result
 */
export interface CostEstimate {
  totalCost: number;
  stepCount: number;
  breakdown: StepCostBreakdown[];
  currency: string;
  metadata: {
    averageCostPerStep: number;
    totalEstimatedCalls: number;
    baseRate: number;
  };
}

type WorkflowCostEstimateInput = {
  workflow: Workflow;
  costPerStep?: number;
};

/**
 * Default cost per API call (in dollars)
 */
const DEFAULT_COST_PER_STEP = 0.01;

/**
 * Step type multipliers for more accurate cost estimation
 * Different step types have different typical costs
 */
const STEP_TYPE_MULTIPLIERS: Record<string, number> = {
  llm: 3.0, // LLM calls are typically more expensive
  'llm-small': 1.0, // Small/fast models
  'llm-large': 5.0, // Large/advanced models
  api: 1.0, // Standard API calls
  database: 0.5, // Database queries are usually cheaper
  compute: 2.0, // Compute-intensive operations
  storage: 0.3, // Storage operations
  transform: 0.5, // Data transformation
  validation: 0.3, // Validation steps
  http: 1.0, // HTTP requests
  default: 1.0, // Default multiplier
};

/**
 * Estimates cost for a single workflow step
 */
function estimateStepCost(
  step: WorkflowStep,
  stepIndex: number,
  baseCostPerCall: number
): StepCostBreakdown {
  // Use custom cost if provided
  if (step.customCost !== undefined) {
    return {
      stepId: step.id,
      stepIndex,
      stepName: step.name,
      stepType: step.type,
      estimatedCalls: step.estimatedCalls || 1,
      costPerCall: step.customCost,
      stepCost: step.customCost * (step.estimatedCalls || 1),
    };
  }

  // Get type multiplier
  const stepType = step.type?.toLowerCase() || 'default';
  const multiplier = STEP_TYPE_MULTIPLIERS[stepType] ?? STEP_TYPE_MULTIPLIERS.default ?? 1.0;

  // Calculate cost per call for this step type
  const costPerCall = baseCostPerCall * multiplier;

  // Use estimated calls or default to 1
  const estimatedCalls = step.estimatedCalls || 1;

  // Calculate step cost
  const stepCost = costPerCall * estimatedCalls;

  return {
    stepId: step.id,
    stepIndex,
    stepName: step.name,
    stepType: step.type,
    estimatedCalls,
    costPerCall,
    stepCost,
  };
}

/**
 * Calculates workflow cost estimate
 */
function calculateWorkflowCost(
  workflow: Workflow,
  costPerStep: number = DEFAULT_COST_PER_STEP
): CostEstimate {
  const steps = workflow.steps || [];
  const breakdown: StepCostBreakdown[] = [];
  let totalCost = 0;
  let totalEstimatedCalls = 0;

  // Calculate cost for each step
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (!step) continue;

    const stepBreakdown = estimateStepCost(step, i, costPerStep);

    breakdown.push(stepBreakdown);
    totalCost += stepBreakdown.stepCost;
    totalEstimatedCalls += stepBreakdown.estimatedCalls;
  }

  // Round to 4 decimal places to avoid floating point issues
  totalCost = Math.round(totalCost * 10000) / 10000;

  const averageCostPerStep = steps.length > 0 ? totalCost / steps.length : 0;

  return {
    totalCost,
    stepCount: steps.length,
    breakdown,
    currency: 'USD',
    metadata: {
      averageCostPerStep: Math.round(averageCostPerStep * 10000) / 10000,
      totalEstimatedCalls,
      baseRate: costPerStep,
    },
  };
}

/**
 * Workflow Cost Estimate Tool
 * Estimates the cost of running a workflow
 */
export const workflowCostEstimateTool = tool({
  description:
    'Estimates the cost of running a workflow based on step count, step types, and estimated API calls. Supports custom costs per step and type-based multipliers (e.g., LLM calls are more expensive than database queries). Returns total cost, breakdown by step, and metadata.',
  inputSchema: jsonSchema<WorkflowCostEstimateInput>({
    type: 'object',
    properties: {
      workflow: {
        type: 'object',
        description: 'Workflow object containing an array of steps to estimate cost for',
        properties: {
          steps: {
            type: 'array',
            description: 'Array of workflow steps',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'Unique identifier for the step',
                },
                name: {
                  type: 'string',
                  description: 'Optional human-readable name for the step',
                },
                type: {
                  type: 'string',
                  description:
                    'Optional step type (e.g., "llm", "api", "database"). Affects cost multiplier. Supported types: llm, llm-small, llm-large, api, database, compute, storage, transform, validation, http',
                },
                estimatedCalls: {
                  type: 'number',
                  description: 'Optional estimated number of API calls for this step (default: 1)',
                },
                customCost: {
                  type: 'number',
                  description:
                    'Optional custom cost for this step in dollars. Overrides type-based calculation',
                },
                metadata: {
                  type: 'object',
                  description: 'Optional metadata for the step',
                },
              },
              required: ['id'],
            },
          },
          metadata: {
            type: 'object',
            description: 'Optional workflow metadata',
          },
        },
        required: ['steps'],
      },
      costPerStep: {
        type: 'number',
        description: 'Base cost per step in USD (default: 0.01). Used as baseline for calculations',
      },
    },
    required: ['workflow'],
    additionalProperties: false,
  }),
  async execute({ workflow, costPerStep }): Promise<CostEstimate> {
    // Validate workflow structure
    if (!workflow || typeof workflow !== 'object') {
      throw new Error('Workflow must be an object');
    }

    if (!Array.isArray(workflow.steps)) {
      throw new Error('Workflow must contain a steps array');
    }

    // Validate costPerStep if provided
    if (costPerStep !== undefined) {
      if (typeof costPerStep !== 'number' || costPerStep < 0) {
        throw new Error('costPerStep must be a non-negative number');
      }
    }

    // Validate steps
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];

      if (!step) {
        throw new Error(`Step at index ${i} is undefined`);
      }

      if (!step.id) {
        throw new Error(`Step at index ${i} is missing required 'id' field`);
      }

      if (step.estimatedCalls !== undefined) {
        if (typeof step.estimatedCalls !== 'number' || step.estimatedCalls < 0) {
          throw new Error(
            `Step '${step.id}' has invalid estimatedCalls. Must be a non-negative number`
          );
        }
      }

      if (step.customCost !== undefined) {
        if (typeof step.customCost !== 'number' || step.customCost < 0) {
          throw new Error(
            `Step '${step.id}' has invalid customCost. Must be a non-negative number`
          );
        }
      }
    }

    // Calculate cost estimate
    return calculateWorkflowCost(workflow, costPerStep);
  },
});

export default workflowCostEstimateTool;
