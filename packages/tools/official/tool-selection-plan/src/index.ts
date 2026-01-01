/**
 * Tool Selection Plan Tool for TPMJS
 * Analyzes a task and recommends which tools to use from available options.
 *
 * Domain Rules:
 * - Must generate clear selection rules
 * - Must map goals to tool choices
 * - Must include rationale for each rule
 */

import { jsonSchema, tool } from 'ai';

/**
 * Represents an available tool
 */
export interface AvailableTool {
  name: string;
  description: string;
  parameters?: Array<{
    name: string;
    type: string;
    description?: string;
  }>;
  category?: string;
}

/**
 * Represents a planned tool usage step
 */
export interface PlannedToolStep {
  stepNumber: number;
  toolName: string;
  purpose: string;
  rationale: string; // domain rule: must include rationale for each rule
  inputSources?: string[];
  expectedOutput?: string;
  dependencies?: number[]; // step numbers this depends on
}

/**
 * Result of the tool selection planning
 */
export interface ToolSelectionPlan {
  plan: PlannedToolStep[];
  reasoning: string;
  confidence: number; // 0-1 score
  alternativeApproaches?: string[];
  warnings?: string[];
}

type ToolSelectionPlanInput = {
  task: string;
  availableTools: AvailableTool[];
};

/**
 * Extracts key action verbs and nouns from task description
 * Domain rule: task_analysis - Extract actions, domains, and complexity from task descriptions
 */
function analyzeTaskRequirements(task: string): {
  actions: string[];
  domains: string[];
  complexity: 'simple' | 'moderate' | 'complex';
} {
  const lowerTask = task.toLowerCase();

  // Common action verbs in task descriptions
  const actionPatterns = [
    'fetch',
    'get',
    'retrieve',
    'download',
    'scrape',
    'extract',
    'parse',
    'analyze',
    'process',
    'transform',
    'convert',
    'validate',
    'verify',
    'check',
    'search',
    'find',
    'filter',
    'sort',
    'rank',
    'score',
    'calculate',
    'compute',
    'generate',
    'create',
    'build',
    'format',
    'send',
    'publish',
    'upload',
    'save',
    'store',
  ];

  const actions = actionPatterns.filter((action) => lowerTask.includes(action));

  // Domain indicators
  const domains: string[] = [];
  if (lowerTask.includes('web') || lowerTask.includes('url') || lowerTask.includes('page')) {
    domains.push('web');
  }
  if (lowerTask.includes('api') || lowerTask.includes('endpoint') || lowerTask.includes('http')) {
    domains.push('api');
  }
  if (lowerTask.includes('data') || lowerTask.includes('database') || lowerTask.includes('query')) {
    domains.push('data');
  }
  if (lowerTask.includes('file') || lowerTask.includes('document') || lowerTask.includes('pdf')) {
    domains.push('file');
  }
  if (lowerTask.includes('email') || lowerTask.includes('message') || lowerTask.includes('send')) {
    domains.push('messaging');
  }

  // Determine complexity
  const hasMultipleSteps =
    lowerTask.includes('then') ||
    lowerTask.includes('and then') ||
    lowerTask.includes('after') ||
    lowerTask.includes('before');
  const hasConditionals =
    lowerTask.includes('if') || lowerTask.includes('when') || lowerTask.includes('unless');

  let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
  if (hasMultipleSteps && hasConditionals) {
    complexity = 'complex';
  } else if (hasMultipleSteps || hasConditionals || actions.length > 2) {
    complexity = 'moderate';
  }

  return { actions, domains, complexity };
}

/**
 * Scores how well a tool matches the task requirements
 * Domain rule: relevance_scoring - Calculate weighted relevance based on keyword, action, and domain matching
 */
function scoreToolRelevance(
  tool: AvailableTool,
  taskRequirements: ReturnType<typeof analyzeTaskRequirements>,
  task: string
): number {
  let score = 0;
  const lowerToolDesc = tool.description.toLowerCase();
  const lowerToolName = tool.name.toLowerCase();
  const lowerTask = task.toLowerCase();

  // Domain rule: keyword_weight - 40% weight for general keyword matching
  const taskWords = lowerTask.split(/\s+/).filter((word) => word.length > 3);
  const matchingWords = taskWords.filter(
    (word) => lowerToolDesc.includes(word) || lowerToolName.includes(word)
  );
  score += (matchingWords.length / taskWords.length) * 0.4;

  // Domain rule: action_weight - 30% weight for action verb matching
  const matchingActions = taskRequirements.actions.filter(
    (action) => lowerToolDesc.includes(action) || lowerToolName.includes(action)
  );
  score += (matchingActions.length / Math.max(taskRequirements.actions.length, 1)) * 0.3;

  // Domain rule: domain_weight - 30% weight for domain/category matching
  const matchingDomains = taskRequirements.domains.filter(
    (domain) => lowerToolDesc.includes(domain) || lowerToolName.includes(domain)
  );
  score += (matchingDomains.length / Math.max(taskRequirements.domains.length, 1)) * 0.3;

  return Math.min(score, 1.0);
}

/**
 * Plans tool usage steps based on task and available tools
 */
function planToolUsage(
  task: string,
  availableTools: AvailableTool[],
  taskRequirements: ReturnType<typeof analyzeTaskRequirements>
): {
  plan: PlannedToolStep[];
  reasoning: string;
  confidence: number;
  alternatives: string[];
  warnings: string[];
} {
  // Score all tools by relevance
  const scoredTools = availableTools
    .map((tool) => ({
      tool,
      score: scoreToolRelevance(tool, taskRequirements, task),
    }))
    .sort((a, b) => b.score - a.score);

  const plan: PlannedToolStep[] = [];
  const warnings: string[] = [];
  const alternatives: string[] = [];

  // If no tools score well, add warning
  const topTool = scoredTools[0];
  if (!topTool || topTool.score < 0.1) {
    warnings.push('No tools found that clearly match the task requirements.');
    return {
      plan: [],
      reasoning:
        'Unable to find suitable tools for this task. Manual implementation may be required.',
      confidence: 0,
      alternatives: [],
      warnings,
    };
  }

  // Build plan based on complexity
  if (taskRequirements.complexity === 'simple') {
    // Single tool should suffice
    plan.push({
      stepNumber: 1,
      toolName: topTool.tool.name,
      purpose: `Use ${topTool.tool.name} to ${task}`,
      rationale: `Selected ${topTool.tool.name} because it has the highest relevance score (${Math.round(topTool.score * 100)}%) for this simple task`,
      inputSources: ['task input'],
      expectedOutput: 'task result',
    });

    // Suggest alternatives
    const secondTool = scoredTools[1];
    if (secondTool && secondTool.score > 0.3) {
      alternatives.push(
        `Could alternatively use ${secondTool.tool.name} (relevance: ${Math.round(secondTool.score * 100)}%)`
      );
    }
  } else if (taskRequirements.complexity === 'moderate') {
    // Might need 2-3 tools
    const topTools = scoredTools.filter((st) => st.score > 0.2).slice(0, 3);

    topTools.forEach((scoredTool, index) => {
      plan.push({
        stepNumber: index + 1,
        toolName: scoredTool.tool.name,
        purpose: `Step ${index + 1}: ${scoredTool.tool.description}`,
        rationale: `Step ${index + 1} uses ${scoredTool.tool.name} (relevance: ${Math.round(scoredTool.score * 100)}%) to handle part of the moderate-complexity task`,
        inputSources: index === 0 ? ['task input'] : [`output from step ${index}`],
        expectedOutput: `intermediate result ${index + 1}`,
        dependencies: index > 0 ? [index] : undefined,
      });
    });

    if (topTools.length < 2) {
      warnings.push(
        'Task appears to require multiple steps, but only one suitable tool was found.'
      );
    }
  } else {
    // Complex - might need multiple tools in sequence
    const topTools = scoredTools.filter((st) => st.score > 0.15).slice(0, 5);

    // Group tools by likely execution order
    const dataFetchTools = topTools.filter((st) =>
      st.tool.description.toLowerCase().match(/fetch|get|retrieve|scrape/)
    );
    const processTools = topTools.filter((st) =>
      st.tool.description.toLowerCase().match(/process|analyze|transform|parse/)
    );
    const outputTools = topTools.filter((st) =>
      st.tool.description.toLowerCase().match(/send|save|publish|store|format/)
    );

    let stepNum = 1;

    // Add fetch step
    const fetchTool = dataFetchTools[0];
    if (fetchTool) {
      plan.push({
        stepNumber: stepNum++,
        toolName: fetchTool.tool.name,
        purpose: `Fetch/retrieve data: ${fetchTool.tool.description}`,
        rationale: `First step uses ${fetchTool.tool.name} to fetch/retrieve data, as it matches the fetch/get/retrieve pattern in the task`,
        inputSources: ['task input'],
        expectedOutput: 'raw data',
      });
    }

    // Add processing steps
    processTools.slice(0, 2).forEach((st, index) => {
      plan.push({
        stepNumber: stepNum++,
        toolName: st.tool.name,
        purpose: `Process data: ${st.tool.description}`,
        rationale: `Processing step ${index + 1} uses ${st.tool.name} to transform/analyze data from the previous step`,
        inputSources: [`output from step ${stepNum - 2}`],
        expectedOutput: `processed data ${index + 1}`,
        dependencies: [stepNum - 2],
      });
    });

    // Add output step
    const outputTool = outputTools[0];
    if (outputTool) {
      plan.push({
        stepNumber: stepNum++,
        toolName: outputTool.tool.name,
        purpose: `Output result: ${outputTool.tool.description}`,
        rationale: `Final step uses ${outputTool.tool.name} to save/send/publish the processed results`,
        inputSources: [`output from step ${stepNum - 2}`],
        expectedOutput: 'final result',
        dependencies: [stepNum - 2],
      });
    }

    if (plan.length === 0) {
      // Fallback: use top scoring tools
      topTools.slice(0, 3).forEach((st, index) => {
        plan.push({
          stepNumber: index + 1,
          toolName: st.tool.name,
          purpose: st.tool.description,
          rationale: `Fallback selection: ${st.tool.name} has relevance score of ${Math.round(st.score * 100)}%`,
          inputSources: index === 0 ? ['task input'] : [`output from step ${index}`],
          expectedOutput: `result ${index + 1}`,
          dependencies: index > 0 ? [index] : undefined,
        });
      });
    }
  }

  // Calculate confidence
  const avgScore =
    plan.reduce((sum, step) => {
      const tool = scoredTools.find((st) => st.tool.name === step.toolName);
      return sum + (tool?.score || 0);
    }, 0) / Math.max(plan.length, 1);

  let confidence = avgScore;

  // Adjust confidence based on plan completeness
  if (taskRequirements.complexity === 'complex' && plan.length < 2) {
    confidence *= 0.7;
    warnings.push('Task complexity suggests multiple tools needed, but plan is simple.');
  }

  // Generate reasoning
  const reasoning =
    `Task analysis: ${taskRequirements.actions.length} actions identified (${taskRequirements.actions.join(', ')}), ` +
    `${taskRequirements.domains.length} domains (${taskRequirements.domains.join(', ')}), ` +
    `complexity: ${taskRequirements.complexity}. ` +
    `Selected ${plan.length} tool(s) with average relevance score of ${Math.round(avgScore * 100)}%.`;

  return {
    plan,
    reasoning,
    confidence: Math.round(confidence * 100) / 100,
    alternatives,
    warnings,
  };
}

/**
 * Tool Selection Plan Tool
 * Analyzes a task and recommends which tools to use
 */
export const toolSelectionPlanTool = tool({
  description:
    'Analyzes a task description and available tools to create an execution plan. Recommends which tools to use, in what order, and with what confidence level. Useful for automated workflow planning and tool orchestration.',
  inputSchema: jsonSchema<ToolSelectionPlanInput>({
    type: 'object',
    properties: {
      task: {
        type: 'string',
        description: 'Description of the task to accomplish',
      },
      availableTools: {
        type: 'array',
        description: 'Array of available tools with name and description',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Tool name',
            },
            description: {
              type: 'string',
              description: 'What the tool does',
            },
            parameters: {
              type: 'array',
              description: 'Tool parameters (optional)',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
            category: {
              type: 'string',
              description: 'Tool category (optional)',
            },
          },
          required: ['name', 'description'],
        },
      },
    },
    required: ['task', 'availableTools'],
    additionalProperties: false,
  }),
  async execute({ task, availableTools }): Promise<ToolSelectionPlan> {
    // Validate inputs
    if (!task || typeof task !== 'string' || task.trim().length === 0) {
      throw new Error('Invalid task: must be a non-empty string');
    }

    if (!availableTools || !Array.isArray(availableTools)) {
      throw new Error('Invalid availableTools: must be an array');
    }

    if (availableTools.length === 0) {
      return {
        plan: [],
        reasoning: 'No tools available to plan with.',
        confidence: 0,
        warnings: ['No tools provided in availableTools array.'],
      };
    }

    // Validate tool structure
    for (const tool of availableTools) {
      if (!tool.name || !tool.description) {
        throw new Error('Invalid tool in availableTools: each tool must have name and description');
      }
    }

    // Analyze task requirements
    const taskRequirements = analyzeTaskRequirements(task);

    // Plan tool usage
    const { plan, reasoning, confidence, alternatives, warnings } = planToolUsage(
      task,
      availableTools,
      taskRequirements
    );

    return {
      plan,
      reasoning,
      confidence,
      alternativeApproaches: alternatives.length > 0 ? alternatives : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  },
});

export default toolSelectionPlanTool;
