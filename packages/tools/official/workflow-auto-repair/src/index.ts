/**
 * Workflow Auto-Repair Tool for TPMJS
 * Inserts adapter steps when input/output types are mismatched.
 *
 * Domain Rules:
 * - Must insert appropriate adapters (html→text, json-repair, etc.)
 * - Must use adapter lookup table
 * - Must make minimal necessary repairs
 */

import { jsonSchema, tool } from 'ai';

/**
 * Adapter lookup table (domain rule)
 * Maps source→target type pairs to appropriate adapter tools
 */
const ADAPTER_LOOKUP: Record<string, string> = {
  'html→text': 'html-to-text',
  'html→markdown': 'html-to-markdown',
  'markdown→html': 'markdown-to-html',
  'json→yaml': 'json-to-yaml',
  'yaml→json': 'yaml-to-json',
  'text→json': 'json-parse',
  'string→json': 'json-parse',
  'json→text': 'json-stringify',
  'json→string': 'json-stringify',
  'object→string': 'json-stringify',
  'array→string': 'json-stringify',
  'csv→json': 'csv-to-json',
  'json→csv': 'json-to-csv',
  'xml→json': 'xml-to-json',
  'json→xml': 'json-to-xml',
  'string→number': 'parse-number',
  'text→number': 'parse-number',
  'number→string': 'number-to-string',
  'boolean→string': 'boolean-to-string',
  'string→boolean': 'parse-boolean',
  'malformed-json→json': 'json-repair',
  'broken-json→json': 'json-repair',
};

/**
 * Represents a step in a workflow
 */
export interface WorkflowStep {
  id: string;
  name: string;
  inputType?: string;
  outputType?: string;
  config?: Record<string, unknown>;
  dependencies?: string[];
  [key: string]: unknown;
}

/**
 * Represents a type mismatch between steps
 */
export interface TypeMismatch {
  fromStepId: string;
  toStepId: string;
  outputType: string;
  inputType: string;
}

/**
 * Represents an inserted adapter step
 */
export interface AdapterInsertion {
  position: number; // where to insert in the steps array
  adapterStep: WorkflowStep;
  reason: string;
}

/**
 * Result of the workflow repair
 */
export interface WorkflowRepairResult {
  repairedSteps: WorkflowStep[];
  insertions: AdapterInsertion[];
  unrepairable: Array<{
    fromStepId: string;
    toStepId: string;
    reason: string;
  }>;
  changesMade: number;
}

type WorkflowAutoRepairInput = {
  steps: WorkflowStep[];
};

/**
 * Detects type mismatches between consecutive workflow steps
 */
function detectTypeMismatches(steps: WorkflowStep[]): TypeMismatch[] {
  const mismatches: TypeMismatch[] = [];

  for (let i = 0; i < steps.length - 1; i++) {
    const currentStep = steps[i];
    const nextStep = steps[i + 1];

    if (!currentStep || !nextStep) continue;

    const outputType = currentStep.outputType;
    const inputType = nextStep.inputType;

    // Skip if types are not specified or already match
    if (!outputType || !inputType) continue;
    if (outputType === inputType) continue;

    mismatches.push({
      fromStepId: currentStep.id,
      toStepId: nextStep.id,
      outputType,
      inputType,
    });
  }

  return mismatches;
}

/**
 * Finds an appropriate adapter for a type conversion (domain rule: use adapter lookup table)
 */
function findAdapter(fromType: string, toType: string): string | null {
  const key = `${fromType}→${toType}`;
  return ADAPTER_LOOKUP[key] || null;
}

/**
 * Creates an adapter step to insert between mismatched steps
 */
function createAdapterStep(
  fromStepId: string,
  toStepId: string,
  adapterName: string,
  position: number
): WorkflowStep {
  return {
    id: `adapter-${fromStepId}-to-${toStepId}`,
    name: adapterName,
    inputType: undefined, // Will inherit from previous step
    outputType: undefined, // Will match next step's input
    config: {
      autoInserted: true,
      insertedAt: new Date().toISOString(),
      insertPosition: position,
    },
    dependencies: [fromStepId],
  };
}

/**
 * Repairs workflow by inserting adapter steps (domain rule: insert adapters)
 */
function repairWorkflow(steps: WorkflowStep[]): WorkflowRepairResult {
  const mismatches = detectTypeMismatches(steps);
  const insertions: AdapterInsertion[] = [];
  const unrepairable: WorkflowRepairResult['unrepairable'] = [];

  // Process mismatches and create adapter insertions
  for (const mismatch of mismatches) {
    const adapter = findAdapter(mismatch.outputType, mismatch.inputType);

    if (!adapter) {
      unrepairable.push({
        fromStepId: mismatch.fromStepId,
        toStepId: mismatch.toStepId,
        reason: `No adapter found for ${mismatch.outputType}→${mismatch.inputType}`,
      });
      continue;
    }

    // Find position to insert adapter (after fromStep, before toStep)
    const fromIndex = steps.findIndex((s) => s.id === mismatch.fromStepId);
    const toIndex = steps.findIndex((s) => s.id === mismatch.toStepId);

    if (fromIndex === -1 || toIndex === -1) {
      unrepairable.push({
        fromStepId: mismatch.fromStepId,
        toStepId: mismatch.toStepId,
        reason: 'Could not find step indices in workflow',
      });
      continue;
    }

    const insertPosition = fromIndex + 1;

    const adapterStep = createAdapterStep(
      mismatch.fromStepId,
      mismatch.toStepId,
      adapter,
      insertPosition
    );

    insertions.push({
      position: insertPosition,
      adapterStep,
      reason: `Type mismatch: ${mismatch.outputType}→${mismatch.inputType}`,
    });
  }

  // Insert adapters into workflow (domain rule: make minimal necessary repairs)
  // Sort insertions by position (descending) to maintain correct indices
  insertions.sort((a, b) => b.position - a.position);

  const repairedSteps = [...steps];
  for (const insertion of insertions) {
    repairedSteps.splice(insertion.position, 0, insertion.adapterStep);
  }

  // Reverse insertions array back to ascending order for output
  insertions.reverse();

  return {
    repairedSteps,
    insertions,
    unrepairable,
    changesMade: insertions.length,
  };
}

/**
 * Workflow Auto-Repair Tool
 * Inserts adapter steps when input/output types are mismatched
 */
export const workflowAutoRepairTool = tool({
  description:
    'Inserts adapter steps when workflow steps have mismatched input/output types. Uses an adapter lookup table to find appropriate converters (html→text, json-repair, etc.). Makes minimal necessary repairs by only inserting adapters where needed.',
  inputSchema: jsonSchema<WorkflowAutoRepairInput>({
    type: 'object',
    properties: {
      steps: {
        type: 'array',
        description: 'Array of workflow steps with inputType and outputType specified',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique step ID',
            },
            name: {
              type: 'string',
              description: 'Step name',
            },
            inputType: {
              type: 'string',
              description: 'Expected input type (e.g., "html", "json", "text")',
            },
            outputType: {
              type: 'string',
              description: 'Output type produced by this step',
            },
            config: {
              type: 'object',
              description: 'Step configuration',
            },
            dependencies: {
              type: 'array',
              description: 'Array of step IDs this step depends on',
              items: { type: 'string' },
            },
          },
          required: ['id', 'name'],
        },
      },
    },
    required: ['steps'],
    additionalProperties: false,
  }),
  async execute({ steps }): Promise<WorkflowRepairResult> {
    // Validate inputs
    if (!Array.isArray(steps)) {
      throw new Error('Invalid steps: must be an array');
    }

    if (steps.length === 0) {
      return {
        repairedSteps: [],
        insertions: [],
        unrepairable: [],
        changesMade: 0,
      };
    }

    // Validate step structure
    for (const step of steps) {
      if (!step.id || !step.name) {
        throw new Error('Invalid step: each step must have id and name');
      }
    }

    // Repair workflow by inserting adapters
    return repairWorkflow(steps);
  },
});

export default workflowAutoRepairTool;
