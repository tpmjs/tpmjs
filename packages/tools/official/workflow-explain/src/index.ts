/**
 * Workflow Explain Tool for TPMJS
 * Explains what a workflow does in plain language.
 * Analyzes workflow steps and generates human-readable explanations.
 */

import { jsonSchema, tool } from 'ai';

/**
 * A single step in a workflow
 */
export interface WorkflowStep {
  tool: string;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  description?: string;
  [key: string]: unknown;
}

/**
 * A workflow to explain
 */
export interface Workflow {
  name: string;
  steps: WorkflowStep[];
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Input for the workflow explain tool
 */
export interface WorkflowExplainInput {
  workflow: Workflow;
}

/**
 * Summary of a single workflow step
 */
export interface StepSummary {
  stepNumber: number;
  tool: string;
  action: string;
  inputSummary: string;
  outputSummary: string;
}

/**
 * Complexity assessment levels
 */
export type ComplexityLevel = 'simple' | 'moderate' | 'complex' | 'very-complex';

/**
 * Output of the workflow explain tool
 */
export interface WorkflowExplanation {
  explanation: string;
  stepSummaries: StepSummary[];
  complexity: ComplexityLevel;
  metrics: {
    totalSteps: number;
    uniqueTools: number;
    estimatedDuration: string;
    hasConditionals: boolean;
    hasLoops: boolean;
  };
}

/**
 * Generates a human-readable action description for a tool
 */
function generateActionDescription(toolName: string, stepDescription?: string): string {
  if (stepDescription) {
    return stepDescription;
  }

  // Generate reasonable descriptions based on common tool name patterns
  const lowerTool = toolName.toLowerCase();

  if (lowerTool.includes('fetch') || lowerTool.includes('get') || lowerTool.includes('retrieve')) {
    return 'fetches data';
  }
  if (
    lowerTool.includes('transform') ||
    lowerTool.includes('process') ||
    lowerTool.includes('convert')
  ) {
    return 'processes data';
  }
  if (lowerTool.includes('save') || lowerTool.includes('store') || lowerTool.includes('write')) {
    return 'saves data';
  }
  if (
    lowerTool.includes('validate') ||
    lowerTool.includes('check') ||
    lowerTool.includes('verify')
  ) {
    return 'validates data';
  }
  if (lowerTool.includes('send') || lowerTool.includes('notify') || lowerTool.includes('email')) {
    return 'sends notification';
  }
  if (
    lowerTool.includes('analyze') ||
    lowerTool.includes('compute') ||
    lowerTool.includes('calculate')
  ) {
    return 'analyzes data';
  }
  if (lowerTool.includes('filter') || lowerTool.includes('search') || lowerTool.includes('query')) {
    return 'filters data';
  }
  if (lowerTool.includes('merge') || lowerTool.includes('combine') || lowerTool.includes('join')) {
    return 'combines data';
  }
  if (
    lowerTool.includes('format') ||
    lowerTool.includes('render') ||
    lowerTool.includes('display')
  ) {
    return 'formats output';
  }

  return 'executes';
}

/**
 * Summarizes inputs for a step
 */
function summarizeInputs(inputs?: Record<string, unknown>): string {
  if (!inputs || Object.keys(inputs).length === 0) {
    return 'no inputs';
  }

  const keys = Object.keys(inputs);
  if (keys.length === 1) {
    return `using ${keys[0]}`;
  }
  if (keys.length === 2) {
    return `using ${keys[0]} and ${keys[1]}`;
  }
  return `using ${keys.length} inputs (${keys.slice(0, 2).join(', ')}, ...)`;
}

/**
 * Summarizes outputs for a step
 */
function summarizeOutputs(outputs?: Record<string, unknown>): string {
  if (!outputs || Object.keys(outputs).length === 0) {
    return 'no outputs';
  }

  const keys = Object.keys(outputs);
  if (keys.length === 1) {
    return `producing ${keys[0]}`;
  }
  if (keys.length === 2) {
    return `producing ${keys[0]} and ${keys[1]}`;
  }
  return `producing ${keys.length} outputs (${keys.slice(0, 2).join(', ')}, ...)`;
}

/**
 * Assesses workflow complexity
 */
function assessComplexity(workflow: Workflow): ComplexityLevel {
  const stepCount = workflow.steps.length;
  const uniqueTools = new Set(workflow.steps.map((s) => s.tool)).size;

  // Check for advanced patterns
  const hasConditionals = workflow.steps.some(
    (s) => s.tool.toLowerCase().includes('if') || s.tool.toLowerCase().includes('condition')
  );
  const hasLoops = workflow.steps.some(
    (s) => s.tool.toLowerCase().includes('loop') || s.tool.toLowerCase().includes('iterate')
  );

  if (stepCount <= 3 && !hasConditionals && !hasLoops) {
    return 'simple';
  }
  if (stepCount <= 7 && uniqueTools <= 5) {
    return 'moderate';
  }
  if (stepCount <= 15 || hasConditionals || hasLoops) {
    return 'complex';
  }
  return 'very-complex';
}

/**
 * Estimates workflow duration based on step count
 */
function estimateDuration(stepCount: number): string {
  if (stepCount <= 3) {
    return '< 1 minute';
  }
  if (stepCount <= 7) {
    return '1-3 minutes';
  }
  if (stepCount <= 15) {
    return '3-10 minutes';
  }
  return '10+ minutes';
}

/**
 * Generates overall workflow explanation
 */
function generateExplanation(workflow: Workflow, stepSummaries: StepSummary[]): string {
  const { name, description, steps } = workflow;

  let explanation = `This workflow "${name}" `;

  if (description) {
    explanation += `${description}. `;
  } else {
    explanation += `executes a ${steps.length}-step process. `;
  }

  // Add high-level flow description
  const firstSummary = stepSummaries[0];
  const lastSummary = stepSummaries[steps.length - 1];

  if (steps.length === 1 && firstSummary) {
    explanation += `It performs a single action: ${firstSummary.action}.`;
  } else if (steps.length === 2 && firstSummary && stepSummaries[1]) {
    explanation += `It performs two main actions: first ${firstSummary.action}, then ${stepSummaries[1].action}.`;
  } else if (firstSummary && lastSummary) {
    const firstAction = firstSummary.action;
    const lastAction = lastSummary.action;
    explanation += `It begins by ${firstAction}, then processes through ${steps.length - 2} intermediate steps, and finally ${lastAction}.`;
  }

  return explanation;
}

/**
 * Workflow Explain Tool
 * Explains what a workflow does in plain language
 */
export const workflowExplainTool = tool({
  description:
    'Explains what a workflow does in plain language. Takes a workflow object with name and steps, then generates a human-readable explanation with step summaries and complexity assessment. Useful for documentation and understanding existing workflows.',
  inputSchema: jsonSchema<WorkflowExplainInput>({
    type: 'object',
    properties: {
      workflow: {
        type: 'object',
        description: 'The workflow to explain',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the workflow',
          },
          steps: {
            type: 'array',
            description: 'Array of workflow steps',
            items: {
              type: 'object',
              properties: {
                tool: {
                  type: 'string',
                  description: 'Name of the tool',
                },
                inputs: {
                  type: 'object',
                  description: 'Input parameters',
                },
                outputs: {
                  type: 'object',
                  description: 'Output values',
                },
                description: {
                  type: 'string',
                  description: 'Optional step description',
                },
              },
              required: ['tool'],
            },
          },
          description: {
            type: 'string',
            description: 'Optional workflow description',
          },
          metadata: {
            type: 'object',
            description: 'Optional workflow metadata',
          },
        },
        required: ['name', 'steps'],
      },
    },
    required: ['workflow'],
    additionalProperties: false,
  }),
  async execute({ workflow }: WorkflowExplainInput): Promise<WorkflowExplanation> {
    // Validate workflow has steps
    if (!workflow.steps || workflow.steps.length === 0) {
      throw new Error('Workflow must have at least one step');
    }

    // Generate step summaries
    const stepSummaries: StepSummary[] = workflow.steps.map((step, index) => ({
      stepNumber: index + 1,
      tool: step.tool,
      action: generateActionDescription(step.tool, step.description),
      inputSummary: summarizeInputs(step.inputs),
      outputSummary: summarizeOutputs(step.outputs),
    }));

    // Assess complexity
    const complexity = assessComplexity(workflow);

    // Check for advanced patterns
    const hasConditionals = workflow.steps.some(
      (s) => s.tool.toLowerCase().includes('if') || s.tool.toLowerCase().includes('condition')
    );
    const hasLoops = workflow.steps.some(
      (s) => s.tool.toLowerCase().includes('loop') || s.tool.toLowerCase().includes('iterate')
    );

    // Calculate metrics
    const metrics = {
      totalSteps: workflow.steps.length,
      uniqueTools: new Set(workflow.steps.map((s) => s.tool)).size,
      estimatedDuration: estimateDuration(workflow.steps.length),
      hasConditionals,
      hasLoops,
    };

    // Generate overall explanation
    const explanation = generateExplanation(workflow, stepSummaries);

    return {
      explanation,
      stepSummaries,
      complexity,
      metrics,
    };
  },
});

export default workflowExplainTool;
