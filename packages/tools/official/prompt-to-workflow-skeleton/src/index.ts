/**
 * Prompt to Workflow Skeleton Tool for TPMJS
 * Creates workflow skeleton from natural language prompt.
 * Analyzes user intent and maps to available tools to generate a workflow structure.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Input for the prompt to workflow skeleton tool
 */
export interface PromptToWorkflowSkeletonInput {
  prompt: string;
  availableTools?: string[];
}

/**
 * A step in the workflow skeleton
 */
export interface WorkflowSkeletonStep {
  stepNumber: number;
  toolName: string;
  purpose: string;
  rationale: string;
  alternatives: string[];
  estimatedInputs: string[];
  estimatedOutputs: string[];
  isAvailable: boolean;
}

/**
 * Suggested tool with reasoning
 */
export interface SuggestedTool {
  name: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  isAvailable: boolean;
}

/**
 * Output of the prompt to workflow skeleton tool
 */
export interface WorkflowSkeleton {
  skeleton: {
    name: string;
    description: string;
    steps: WorkflowSkeletonStep[];
  };
  suggestedTools: SuggestedTool[];
  confidence: number;
  analysis: {
    detectedIntent: string;
    complexity: 'simple' | 'moderate' | 'complex';
    estimatedSteps: number;
    keyActions: string[];
  };
}

/**
 * Common workflow patterns mapped to tool sequences
 */
const WORKFLOW_PATTERNS = {
  fetch_transform_save: {
    keywords: ['get', 'fetch', 'retrieve', 'process', 'transform', 'save', 'store'],
    tools: ['fetch', 'transform', 'save'],
  },
  analyze_report: {
    keywords: ['analyze', 'compute', 'calculate', 'report', 'summarize', 'generate'],
    tools: ['analyze', 'format', 'report'],
  },
  validate_action: {
    keywords: ['validate', 'check', 'verify', 'if', 'then', 'execute', 'run'],
    tools: ['validate', 'conditional', 'execute'],
  },
  scrape_extract: {
    keywords: ['scrape', 'crawl', 'extract', 'parse', 'web', 'page', 'html'],
    tools: ['scrape', 'parse', 'extract'],
  },
  email_notify: {
    keywords: ['email', 'send', 'notify', 'alert', 'message'],
    tools: ['format', 'send', 'notify'],
  },
  aggregate_filter: {
    keywords: ['aggregate', 'combine', 'merge', 'filter', 'search', 'query'],
    tools: ['aggregate', 'filter', 'format'],
  },
};

/**
 * Analyzes prompt to detect workflow intent
 * Domain rule: intent_detection - Extract actions and patterns from natural language prompts
 */
function analyzePrompt(prompt: string): {
  detectedIntent: string;
  keyActions: string[];
  complexity: 'simple' | 'moderate' | 'complex';
} {
  const lowerPrompt = prompt.toLowerCase();

  // Extract action verbs
  const actionWords = [
    'fetch',
    'get',
    'retrieve',
    'process',
    'transform',
    'save',
    'store',
    'send',
    'notify',
    'validate',
    'check',
    'analyze',
    'compute',
    'filter',
    'search',
    'scrape',
    'extract',
    'format',
    'generate',
    'create',
    'update',
    'delete',
  ];

  const detectedActions = actionWords.filter((word) => lowerPrompt.includes(word));

  // Domain rule: pattern_matching - Match prompts to workflow patterns using keyword frequency
  let detectedIntent = 'general workflow';
  for (const [patternName, pattern] of Object.entries(WORKFLOW_PATTERNS)) {
    const matchCount = pattern.keywords.filter((kw) => lowerPrompt.includes(kw)).length;
    // Domain rule: pattern_threshold - Require at least 2 matching keywords to identify pattern
    if (matchCount >= 2) {
      detectedIntent = patternName.replace(/_/g, ' ');
      break;
    }
  }

  // Assess complexity
  let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
  if (detectedActions.length > 5 || lowerPrompt.includes('loop') || lowerPrompt.includes('each')) {
    complexity = 'complex';
  } else if (detectedActions.length > 2) {
    complexity = 'moderate';
  }

  return {
    detectedIntent,
    keyActions: detectedActions,
    complexity,
  };
}

/**
 * Generates rationale for why a step is needed
 */
function generateRationale(action: string, index: number, totalSteps: number): string {
  if (index === 0) {
    return `Initial step to ${action} the input data and prepare it for processing`;
  }
  if (index === totalSteps - 1) {
    return `Final step to ${action} the results and produce the desired output`;
  }
  return `Intermediate step to ${action} the data from previous step and pass it forward`;
}

/**
 * Generates alternative tool suggestions for a step
 */
function generateAlternatives(action: string, availableTools: string[] | undefined): string[] {
  const alternatives: string[] = [];

  // Action-specific alternatives
  const alternativeMap: Record<string, string[]> = {
    fetch: ['retrieve', 'get', 'download'],
    transform: ['process', 'convert', 'modify'],
    save: ['store', 'persist', 'write'],
    validate: ['check', 'verify', 'test'],
    analyze: ['compute', 'calculate', 'evaluate'],
    filter: ['select', 'search', 'query'],
  };

  const possibleAlternatives = alternativeMap[action] || [];
  const toolSet = new Set(availableTools?.map((t) => t.toLowerCase()) || []);

  for (const alt of possibleAlternatives) {
    const altToolName = `${alt}Tool`;
    if (
      !availableTools ||
      toolSet.has(alt.toLowerCase()) ||
      toolSet.has(altToolName.toLowerCase())
    ) {
      alternatives.push(alt);
    }
  }

  return alternatives.slice(0, 3); // Max 3 alternatives
}

/**
 * Generates workflow steps based on detected actions
 */
function generateSteps(
  keyActions: string[],
  availableTools: string[] | undefined
): WorkflowSkeletonStep[] {
  if (keyActions.length === 0) {
    return [
      {
        stepNumber: 1,
        toolName: 'genericTool',
        purpose: 'Execute the requested action',
        rationale: 'No specific actions detected, using generic tool to process request',
        alternatives: [],
        estimatedInputs: ['parameters'],
        estimatedOutputs: ['result'],
        isAvailable: false,
      },
    ];
  }

  const toolSet = new Set(availableTools?.map((t) => t.toLowerCase()) || []);

  return keyActions.map((action, index) => {
    const toolName = `${action}Tool`;
    const isAvailable = availableTools
      ? toolSet.has(toolName.toLowerCase()) || toolSet.has(action.toLowerCase())
      : false;

    return {
      stepNumber: index + 1,
      toolName: isAvailable ? action : toolName,
      purpose: `${action.charAt(0).toUpperCase()}${action.slice(1)} the data`,
      rationale: generateRationale(action, index, keyActions.length),
      alternatives: generateAlternatives(action, availableTools),
      estimatedInputs: index === 0 ? ['inputData'] : [`output${index}`],
      estimatedOutputs: [`output${index + 1}`],
      isAvailable,
    };
  });
}

/**
 * Generates suggested tools based on prompt analysis
 */
function generateSuggestedTools(
  keyActions: string[],
  availableTools: string[] | undefined
): SuggestedTool[] {
  const toolSet = new Set(availableTools?.map((t) => t.toLowerCase()) || []);
  const suggestions: SuggestedTool[] = [];

  // Suggest tools for each key action
  for (const action of keyActions) {
    const toolName = `${action}Tool`;
    const isAvailable = availableTools
      ? toolSet.has(toolName.toLowerCase()) || toolSet.has(action.toLowerCase())
      : false;

    suggestions.push({
      name: isAvailable ? action : toolName,
      reason: `Required to ${action} data in the workflow`,
      priority: 'high',
      isAvailable,
    });
  }

  // Add common utility tools if available
  const utilityTools = [
    {
      name: 'validate',
      reason: 'Ensure data integrity between steps',
      priority: 'medium' as const,
    },
    { name: 'log', reason: 'Track workflow execution and debugging', priority: 'low' as const },
    { name: 'error-handler', reason: 'Handle failures gracefully', priority: 'medium' as const },
  ];

  for (const util of utilityTools) {
    const isAvailable = availableTools
      ? toolSet.has(util.name.toLowerCase()) || toolSet.has(`${util.name}Tool`.toLowerCase())
      : false;

    if (isAvailable || !availableTools) {
      suggestions.push({
        ...util,
        isAvailable,
      });
    }
  }

  return suggestions;
}

/**
 * Calculates confidence score for the generated workflow
 */
function calculateConfidence(
  keyActions: string[],
  steps: WorkflowSkeletonStep[],
  availableTools: string[] | undefined
): number {
  let confidence = 0.5; // Base confidence

  // Higher confidence if we detected clear actions
  if (keyActions.length > 0) {
    confidence += 0.2;
  }

  // Higher confidence if tools are available
  if (availableTools) {
    const availableCount = steps.filter((s) => s.isAvailable).length;
    const availabilityRatio = availableCount / steps.length;
    confidence += availabilityRatio * 0.3;
  } else {
    // Slight penalty for not having tool availability info
    confidence -= 0.1;
  }

  // Higher confidence for moderate complexity (not too simple, not too complex)
  if (keyActions.length >= 2 && keyActions.length <= 5) {
    confidence += 0.1;
  }

  return Math.max(0, Math.min(1, confidence));
}

/**
 * Generates a workflow name from the prompt
 */
function generateWorkflowName(prompt: string): string {
  const words = prompt.split(/\s+/).slice(0, 5);
  const cleaned = words.map((w) => w.replace(/[^a-zA-Z0-9]/g, '')).filter((w) => w.length > 2);

  if (cleaned.length === 0) {
    return 'Generated Workflow';
  }

  return cleaned
    .slice(0, 3)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Prompt to Workflow Skeleton Tool
 * Creates workflow skeleton from natural language prompt
 */
export const promptToWorkflowSkeletonTool = tool({
  description:
    'Creates workflow skeleton from natural language prompt. Analyzes the prompt to detect intent, identifies key actions, and generates a workflow structure with suggested tools. Optionally validates against available tools. Returns a skeleton with steps, suggested tools, and confidence score.',
  inputSchema: jsonSchema<PromptToWorkflowSkeletonInput>({
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'Natural language description of the desired workflow',
      },
      availableTools: {
        type: 'array',
        description: 'Optional array of available tool names that can be used in the workflow',
        items: {
          type: 'string',
        },
      },
    },
    required: ['prompt'],
    additionalProperties: false,
  }),
  async execute({
    prompt,
    availableTools,
  }: PromptToWorkflowSkeletonInput): Promise<WorkflowSkeleton> {
    // Validate input
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('Prompt is required and must be a non-empty string');
    }

    // Analyze the prompt
    const analysis = analyzePrompt(prompt);

    // Generate workflow steps
    const steps = generateSteps(analysis.keyActions, availableTools);

    // Generate suggested tools
    const suggestedTools = generateSuggestedTools(analysis.keyActions, availableTools);

    // Calculate confidence
    const confidence = calculateConfidence(analysis.keyActions, steps, availableTools);

    // Generate workflow name and description
    const workflowName = generateWorkflowName(prompt);
    const description = prompt.length > 100 ? `${prompt.substring(0, 100)}...` : prompt;

    return {
      skeleton: {
        name: workflowName,
        description,
        steps,
      },
      suggestedTools,
      confidence,
      analysis: {
        detectedIntent: analysis.detectedIntent,
        complexity: analysis.complexity,
        estimatedSteps: steps.length,
        keyActions: analysis.keyActions,
      },
    };
  },
});

export default promptToWorkflowSkeletonTool;
