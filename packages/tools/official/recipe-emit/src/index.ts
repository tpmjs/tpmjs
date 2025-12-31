/**
 * Recipe Emit Tool for TPMJS
 * Emits a recipe in standard format for workflow orchestration.
 * Validates and formats workflow recipes with steps, inputs, and outputs.
 */

import { jsonSchema, tool } from 'ai';

/**
 * A single step in the recipe workflow
 */
export interface RecipeStep {
  tool: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  description?: string;
}

/**
 * Metadata about the recipe
 */
export interface RecipeMetadata {
  author?: string;
  version?: string;
  description?: string;
  tags?: string[];
  createdAt?: string;
  [key: string]: unknown;
}

/**
 * Input for the recipe emit tool
 */
export interface RecipeEmitInput {
  name: string;
  steps: RecipeStep[];
  metadata?: RecipeMetadata;
}

/**
 * Output of the recipe emit tool
 */
export interface RecipeOutput {
  recipe: {
    name: string;
    version: string;
    steps: RecipeStep[];
    metadata: RecipeMetadata;
  };
  format: string;
  stepCount: number;
  validation: {
    isValid: boolean;
    warnings: string[];
  };
}

/**
 * Validates a recipe step
 */
function validateStep(step: RecipeStep, index: number): string[] {
  const warnings: string[] = [];

  if (!step.tool || typeof step.tool !== 'string') {
    warnings.push(`Step ${index}: Missing or invalid tool name`);
  }

  if (!step.inputs || typeof step.inputs !== 'object') {
    warnings.push(`Step ${index}: Missing or invalid inputs object`);
  }

  if (!step.outputs || typeof step.outputs !== 'object') {
    warnings.push(`Step ${index}: Missing or invalid outputs object`);
  }

  // Check for empty outputs (might indicate incomplete step)
  if (step.outputs && Object.keys(step.outputs).length === 0) {
    warnings.push(`Step ${index}: Outputs object is empty`);
  }

  return warnings;
}

/**
 * Validates the entire recipe
 */
function validateRecipe(input: RecipeEmitInput): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (!input.name || typeof input.name !== 'string') {
    warnings.push('Recipe name is required and must be a string');
  }

  if (!Array.isArray(input.steps)) {
    warnings.push('Steps must be an array');
    return { isValid: false, warnings };
  }

  if (input.steps.length === 0) {
    warnings.push('Recipe must have at least one step');
  }

  // Validate each step
  for (let i = 0; i < input.steps.length; i++) {
    const step = input.steps[i];
    if (step) {
      const stepWarnings = validateStep(step, i + 1);
      warnings.push(...stepWarnings);
    }
  }

  // Check for output/input chaining issues
  for (let i = 1; i < input.steps.length; i++) {
    const prevStep = input.steps[i - 1];
    const currentStep = input.steps[i];
    if (!prevStep || !currentStep) continue;

    const prevOutputKeys = Object.keys(prevStep.outputs);
    const currentInputKeys = Object.keys(currentStep.inputs);

    // Warning if there's no overlap (steps might not be connected)
    const hasOverlap = prevOutputKeys.some((key) => currentInputKeys.includes(key));
    if (!hasOverlap && prevOutputKeys.length > 0) {
      warnings.push(
        `Steps ${i} and ${i + 1}: No output/input connection detected (this may be intentional)`
      );
    }
  }

  const isValid = !warnings.some(
    (w) => w.includes('required') || w.includes('must be') || w.includes('Missing')
  );

  return { isValid, warnings };
}

/**
 * Recipe Emit Tool
 * Emits a recipe in standard format for workflow orchestration
 */
export const recipeEmitTool = tool({
  description:
    'Emits a recipe in standard format for workflow orchestration. Takes a recipe name, array of steps (each with tool, inputs, and outputs), and optional metadata. Returns a validated, formatted recipe ready for execution.',
  inputSchema: jsonSchema<RecipeEmitInput>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'The name of the recipe',
      },
      steps: {
        type: 'array',
        description: 'Array of workflow steps',
        items: {
          type: 'object',
          properties: {
            tool: {
              type: 'string',
              description: 'Name of the tool to execute',
            },
            inputs: {
              type: 'object',
              description: 'Input parameters for the tool',
            },
            outputs: {
              type: 'object',
              description: 'Expected outputs from the tool',
            },
            description: {
              type: 'string',
              description: 'Optional description of what this step does',
            },
          },
          required: ['tool', 'inputs', 'outputs'],
        },
      },
      metadata: {
        type: 'object',
        description: 'Optional metadata about the recipe',
        properties: {
          author: { type: 'string' },
          version: { type: 'string' },
          description: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          createdAt: { type: 'string' },
        },
      },
    },
    required: ['name', 'steps'],
    additionalProperties: false,
  }),
  async execute(input: RecipeEmitInput): Promise<RecipeOutput> {
    // Validate the recipe
    const validation = validateRecipe(input);

    // Build the formatted recipe
    const recipe = {
      name: input.name,
      version: input.metadata?.version || '1.0.0',
      steps: input.steps.map((step, index) => ({
        ...step,
        description: step.description || `Step ${index + 1}: Execute ${step.tool}`,
      })),
      metadata: {
        ...input.metadata,
        createdAt: input.metadata?.createdAt || new Date().toISOString(),
        format: 'tpmjs-recipe-v1',
      },
    };

    return {
      recipe,
      format: 'tpmjs-recipe-v1',
      stepCount: input.steps.length,
      validation,
    };
  },
});

export default recipeEmitTool;
