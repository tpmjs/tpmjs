/**
 * Workflow Validate I/O Tool for TPMJS
 * Validates that workflow step inputs/outputs are compatible
 * and checks type chains between steps.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Represents a workflow step with inputs and outputs
 */
export interface WorkflowStep {
  id: string;
  name?: string;
  inputs?: Record<string, { type: string; source?: string }>;
  outputs?: Record<string, { type: string }>;
}

/**
 * Workflow structure containing steps
 */
export interface Workflow {
  steps: WorkflowStep[];
}

/**
 * Issue found during validation
 */
export interface ValidationIssue {
  stepId: string;
  stepIndex: number;
  severity: 'error' | 'warning';
  message: string;
  field?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  stepCount: number;
}

type WorkflowValidateIOInput = {
  workflow: Workflow;
};

/**
 * Checks if two types are compatible
 * Handles basic type compatibility and any type
 */
function areTypesCompatible(sourceType: string, targetType: string): boolean {
  // Normalize types
  const normalizedSource = sourceType.toLowerCase().trim();
  const normalizedTarget = targetType.toLowerCase().trim();

  // Any type is compatible with everything
  if (normalizedSource === 'any' || normalizedTarget === 'any') {
    return true;
  }

  // Exact match
  if (normalizedSource === normalizedTarget) {
    return true;
  }

  // Check for array compatibility (e.g., "string[]" with "array")
  if (normalizedSource.endsWith('[]') && normalizedTarget === 'array') {
    return true;
  }
  if (normalizedTarget.endsWith('[]') && normalizedSource === 'array') {
    return true;
  }

  // Check for object compatibility
  if (
    (normalizedSource === 'object' || normalizedSource.startsWith('{')) &&
    (normalizedTarget === 'object' || normalizedTarget.startsWith('{'))
  ) {
    return true;
  }

  // Number and integer compatibility
  if (
    (normalizedSource === 'number' && normalizedTarget === 'integer') ||
    (normalizedSource === 'integer' && normalizedTarget === 'number')
  ) {
    return true;
  }

  return false;
}

/**
 * Validates workflow step I/O compatibility
 */
function validateWorkflow(workflow: Workflow): ValidationResult {
  const issues: ValidationIssue[] = [];
  const steps = workflow.steps || [];

  // Track available outputs from previous steps
  const availableOutputs = new Map<string, { type: string; stepId: string; stepIndex: number }>();

  // Validate each step
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    if (!step) {
      issues.push({
        stepId: `step-${i}`,
        stepIndex: i,
        severity: 'error',
        message: `Step at index ${i} is undefined`,
      });
      continue;
    }

    // Validate step has an ID
    if (!step.id) {
      issues.push({
        stepId: `step-${i}`,
        stepIndex: i,
        severity: 'error',
        message: `Step at index ${i} is missing required 'id' field`,
      });
      continue;
    }

    // Validate inputs reference valid sources
    if (step.inputs) {
      for (const [inputName, inputDef] of Object.entries(step.inputs)) {
        if (!inputDef.type) {
          issues.push({
            stepId: step.id,
            stepIndex: i,
            severity: 'error',
            message: `Input '${inputName}' is missing type definition`,
            field: inputName,
          });
          continue;
        }

        // If input specifies a source, validate it exists and types match
        if (inputDef.source) {
          const sourceOutput = availableOutputs.get(inputDef.source);

          if (!sourceOutput) {
            issues.push({
              stepId: step.id,
              stepIndex: i,
              severity: 'error',
              message: `Input '${inputName}' references unknown source '${inputDef.source}'`,
              field: inputName,
            });
          } else {
            // Check type compatibility
            if (!areTypesCompatible(sourceOutput.type, inputDef.type)) {
              issues.push({
                stepId: step.id,
                stepIndex: i,
                severity: 'error',
                message: `Type mismatch: Input '${inputName}' expects type '${inputDef.type}' but source '${inputDef.source}' from step '${sourceOutput.stepId}' (index ${sourceOutput.stepIndex}) outputs type '${sourceOutput.type}'`,
                field: inputName,
              });
            }
          }
        }
      }
    }

    // Register outputs from this step
    if (step.outputs) {
      for (const [outputName, outputDef] of Object.entries(step.outputs)) {
        if (!outputDef.type) {
          issues.push({
            stepId: step.id,
            stepIndex: i,
            severity: 'error',
            message: `Output '${outputName}' is missing type definition`,
            field: outputName,
          });
          continue;
        }

        const outputKey = `${step.id}.${outputName}`;
        availableOutputs.set(outputKey, {
          type: outputDef.type,
          stepId: step.id,
          stepIndex: i,
        });
      }
    }

    // Warning if step has no inputs or outputs
    if (!step.inputs && !step.outputs) {
      issues.push({
        stepId: step.id,
        stepIndex: i,
        severity: 'warning',
        message: 'Step has no inputs or outputs defined',
      });
    }
  }

  // Check for unreferenced outputs (potential issues)
  const referencedOutputs = new Set<string>();
  for (const step of steps) {
    if (step?.inputs) {
      for (const inputDef of Object.values(step.inputs)) {
        if (inputDef.source) {
          referencedOutputs.add(inputDef.source);
        }
      }
    }
  }

  for (const [outputKey, outputInfo] of availableOutputs.entries()) {
    if (!referencedOutputs.has(outputKey) && outputInfo.stepIndex < steps.length - 1) {
      // Only warn if it's not the last step (last step outputs are expected to be final)
      issues.push({
        stepId: outputInfo.stepId,
        stepIndex: outputInfo.stepIndex,
        severity: 'warning',
        message: `Output '${outputKey}' is never used by subsequent steps`,
        field: outputKey.split('.')[1],
      });
    }
  }

  const valid = issues.filter((issue) => issue.severity === 'error').length === 0;

  return {
    valid,
    issues,
    stepCount: steps.length,
  };
}

/**
 * Workflow Validate I/O Tool
 * Validates workflow step inputs/outputs compatibility
 */
export const workflowValidateIOTool = tool({
  description:
    'Validates that workflow step inputs and outputs are compatible. Checks that input sources exist, types match between connected steps, and identifies potential issues in the workflow graph. Returns validation result with any errors or warnings found.',
  inputSchema: jsonSchema<WorkflowValidateIOInput>({
    type: 'object',
    properties: {
      workflow: {
        type: 'object',
        description:
          'Workflow object containing an array of steps. Each step should have id, inputs (optional), and outputs (optional)',
        properties: {
          steps: {
            type: 'array',
            description: 'Array of workflow steps to validate',
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
                inputs: {
                  type: 'object',
                  description:
                    'Input definitions. Keys are input names, values contain type and optional source reference',
                  additionalProperties: {
                    type: 'object',
                    properties: {
                      type: {
                        type: 'string',
                        description: 'Expected type for this input',
                      },
                      source: {
                        type: 'string',
                        description:
                          'Optional source reference in format "stepId.outputName" to connect to previous step output',
                      },
                    },
                    required: ['type'],
                  },
                },
                outputs: {
                  type: 'object',
                  description: 'Output definitions. Keys are output names, values contain type',
                  additionalProperties: {
                    type: 'object',
                    properties: {
                      type: {
                        type: 'string',
                        description: 'Type of this output',
                      },
                    },
                    required: ['type'],
                  },
                },
              },
              required: ['id'],
            },
          },
        },
        required: ['steps'],
      },
    },
    required: ['workflow'],
    additionalProperties: false,
  }),
  async execute({ workflow }): Promise<ValidationResult> {
    // Validate workflow structure
    if (!workflow || typeof workflow !== 'object') {
      throw new Error('Workflow must be an object');
    }

    if (!Array.isArray(workflow.steps)) {
      throw new Error('Workflow must contain a steps array');
    }

    // Validate workflow
    return validateWorkflow(workflow);
  },
});

export default workflowValidateIOTool;
