/**
 * Workflow Auto-Repair Tool for TPMJS
 * Analyzes workflow errors and suggests repairs for broken steps.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Represents a step in a workflow
 */
export interface WorkflowStep {
  id: string;
  name: string;
  type?: string;
  config?: Record<string, unknown>;
  dependencies?: string[];
  [key: string]: unknown;
}

/**
 * Represents a workflow with steps
 */
export interface Workflow {
  id?: string;
  name?: string;
  steps: WorkflowStep[];
  [key: string]: unknown;
}

/**
 * Represents an error in a workflow step
 */
export interface StepError {
  step: string; // step ID or name
  error: string; // error message
}

/**
 * Represents a suggested repair for a broken step
 */
export interface StepRepair {
  stepId: string;
  stepName: string;
  errorType: string;
  suggestedFix: string;
  confidence: 'high' | 'medium' | 'low';
  codeChanges?: {
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }[];
}

/**
 * Result of the workflow repair analysis
 */
export interface WorkflowRepairResult {
  repairs: StepRepair[];
  fixedSteps: number;
  unfixable: Array<{
    stepId: string;
    stepName: string;
    reason: string;
  }>;
}

type WorkflowAutoRepairInput = {
  workflow: Workflow;
  errors: StepError[];
};

/**
 * Analyzes error messages to determine error types
 */
function categorizeError(errorMessage: string): {
  type: string;
  keywords: string[];
} {
  const lowerError = errorMessage.toLowerCase();

  // Network/Connection errors
  if (
    lowerError.includes('network') ||
    lowerError.includes('timeout') ||
    lowerError.includes('econnrefused') ||
    lowerError.includes('fetch failed')
  ) {
    return { type: 'network', keywords: ['network', 'timeout', 'connection'] };
  }

  // Authentication errors
  if (
    lowerError.includes('unauthorized') ||
    lowerError.includes('authentication') ||
    lowerError.includes('auth') ||
    lowerError.includes('401') ||
    lowerError.includes('403')
  ) {
    return { type: 'authentication', keywords: ['auth', 'credentials', 'token'] };
  }

  // Validation errors
  if (
    lowerError.includes('validation') ||
    lowerError.includes('invalid') ||
    lowerError.includes('required') ||
    lowerError.includes('missing')
  ) {
    return { type: 'validation', keywords: ['required', 'invalid', 'schema'] };
  }

  // Dependency errors
  if (
    lowerError.includes('not found') ||
    lowerError.includes('undefined') ||
    lowerError.includes('null') ||
    lowerError.includes('dependency')
  ) {
    return { type: 'dependency', keywords: ['dependency', 'missing', 'prerequisite'] };
  }

  // Type errors
  if (
    lowerError.includes('type') ||
    lowerError.includes('expected') ||
    lowerError.includes('cannot read')
  ) {
    return { type: 'type', keywords: ['type', 'casting', 'format'] };
  }

  // Rate limiting
  if (lowerError.includes('rate') || lowerError.includes('429') || lowerError.includes('quota')) {
    return { type: 'rate-limit', keywords: ['rate', 'quota', 'throttle'] };
  }

  // Configuration errors
  if (
    lowerError.includes('config') ||
    lowerError.includes('setting') ||
    lowerError.includes('parameter')
  ) {
    return { type: 'configuration', keywords: ['config', 'parameter', 'setting'] };
  }

  return { type: 'unknown', keywords: [] };
}

/**
 * Generates repair suggestions based on error type
 */
function generateRepairSuggestion(
  step: WorkflowStep,
  errorType: string,
  errorMessage: string
): {
  suggestedFix: string;
  confidence: 'high' | 'medium' | 'low';
  codeChanges?: StepRepair['codeChanges'];
} {
  switch (errorType) {
    case 'network':
      return {
        suggestedFix:
          'Add retry logic with exponential backoff. Increase timeout value. Verify network connectivity and endpoint availability.',
        confidence: 'high',
        codeChanges: [
          {
            field: 'retries',
            oldValue: step.config?.retries ?? 0,
            newValue: 3,
          },
          {
            field: 'timeout',
            oldValue: step.config?.timeout ?? 5000,
            newValue: 30000,
          },
        ],
      };

    case 'authentication':
      return {
        suggestedFix:
          'Verify API credentials are correct and not expired. Check if authentication token needs refresh. Ensure proper authorization headers are set.',
        confidence: 'high',
        codeChanges: [
          {
            field: 'authRefresh',
            oldValue: step.config?.authRefresh ?? false,
            newValue: true,
          },
        ],
      };

    case 'validation':
      return {
        suggestedFix:
          'Review input schema requirements. Add validation step before execution. Ensure all required fields are provided with correct types.',
        confidence: 'medium',
        codeChanges: [
          {
            field: 'validateInput',
            oldValue: step.config?.validateInput ?? false,
            newValue: true,
          },
        ],
      };

    case 'dependency':
      return {
        suggestedFix:
          'Check that prerequisite steps have completed successfully. Verify dependency IDs are correct. Add error handling for missing dependencies.',
        confidence: 'high',
        codeChanges: [
          {
            field: 'waitForDependencies',
            oldValue: step.config?.waitForDependencies ?? false,
            newValue: true,
          },
        ],
      };

    case 'type':
      return {
        suggestedFix:
          'Add type conversion or casting. Verify data format matches expected schema. Use defensive programming with null checks.',
        confidence: 'medium',
        codeChanges: [
          {
            field: 'strictTypeChecking',
            oldValue: step.config?.strictTypeChecking ?? false,
            newValue: true,
          },
        ],
      };

    case 'rate-limit':
      return {
        suggestedFix:
          'Implement rate limiting with queue. Add delay between requests. Consider using batch processing.',
        confidence: 'high',
        codeChanges: [
          {
            field: 'rateLimitDelay',
            oldValue: step.config?.rateLimitDelay ?? 0,
            newValue: 1000,
          },
          {
            field: 'maxConcurrency',
            oldValue: step.config?.maxConcurrency ?? 10,
            newValue: 1,
          },
        ],
      };

    case 'configuration':
      return {
        suggestedFix:
          'Review configuration parameters for correctness. Check environment variables are set. Validate configuration schema.',
        confidence: 'medium',
        codeChanges: [
          {
            field: 'validateConfig',
            oldValue: step.config?.validateConfig ?? false,
            newValue: true,
          },
        ],
      };

    default:
      return {
        suggestedFix: `Review error message: "${errorMessage}". Consider adding comprehensive error handling and logging to diagnose the issue.`,
        confidence: 'low',
      };
  }
}

/**
 * Finds a step in the workflow by ID or name
 */
function findStep(workflow: Workflow, stepIdentifier: string): WorkflowStep | undefined {
  return workflow.steps.find((step) => step.id === stepIdentifier || step.name === stepIdentifier);
}

/**
 * Determines if an error is fixable based on error type and context
 */
function isErrorFixable(errorType: string, step: WorkflowStep): boolean {
  // Most error types are fixable with proper configuration
  const fixableTypes = [
    'network',
    'authentication',
    'validation',
    'dependency',
    'type',
    'rate-limit',
    'configuration',
  ];

  if (!fixableTypes.includes(errorType)) {
    return false;
  }

  // Check if step has enough information to suggest a fix
  if (!step.id && !step.name) {
    return false;
  }

  return true;
}

/**
 * Workflow Auto-Repair Tool
 * Analyzes workflow errors and suggests repairs
 */
export const workflowAutoRepairTool = tool({
  description:
    'Analyzes errors in a workflow and suggests repairs for broken steps. Categorizes errors by type (network, authentication, validation, etc.) and provides actionable fix recommendations with confidence levels.',
  inputSchema: jsonSchema<WorkflowAutoRepairInput>({
    type: 'object',
    properties: {
      workflow: {
        type: 'object',
        description: 'The workflow object containing steps array and metadata',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                type: { type: 'string' },
                config: { type: 'object' },
                dependencies: { type: 'array', items: { type: 'string' } },
              },
              required: ['id', 'name'],
            },
          },
        },
        required: ['steps'],
      },
      errors: {
        type: 'array',
        description: 'Array of error objects with step identifier and error message',
        items: {
          type: 'object',
          properties: {
            step: {
              type: 'string',
              description: 'Step ID or name that failed',
            },
            error: {
              type: 'string',
              description: 'Error message from the failed step',
            },
          },
          required: ['step', 'error'],
        },
      },
    },
    required: ['workflow', 'errors'],
    additionalProperties: false,
  }),
  async execute({ workflow, errors }): Promise<WorkflowRepairResult> {
    // Validate inputs
    if (!workflow || !workflow.steps || !Array.isArray(workflow.steps)) {
      throw new Error('Invalid workflow: must contain a steps array');
    }

    if (!errors || !Array.isArray(errors)) {
      throw new Error('Invalid errors: must be an array');
    }

    if (errors.length === 0) {
      return {
        repairs: [],
        fixedSteps: 0,
        unfixable: [],
      };
    }

    const repairs: StepRepair[] = [];
    const unfixable: WorkflowRepairResult['unfixable'] = [];

    // Process each error
    for (const error of errors) {
      const step = findStep(workflow, error.step);

      if (!step) {
        unfixable.push({
          stepId: error.step,
          stepName: error.step,
          reason: `Step not found in workflow. Step identifier: ${error.step}`,
        });
        continue;
      }

      // Categorize the error
      const { type: errorType } = categorizeError(error.error);

      // Check if fixable
      if (!isErrorFixable(errorType, step)) {
        unfixable.push({
          stepId: step.id,
          stepName: step.name,
          reason: `Error type "${errorType}" cannot be automatically repaired. Manual intervention required.`,
        });
        continue;
      }

      // Generate repair suggestion
      const repairSuggestion = generateRepairSuggestion(step, errorType, error.error);

      repairs.push({
        stepId: step.id,
        stepName: step.name,
        errorType,
        suggestedFix: repairSuggestion.suggestedFix,
        confidence: repairSuggestion.confidence,
        codeChanges: repairSuggestion.codeChanges,
      });
    }

    return {
      repairs,
      fixedSteps: repairs.filter((r) => r.confidence === 'high').length,
      unfixable,
    };
  },
});

export default workflowAutoRepairTool;
