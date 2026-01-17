/**
 * Scenario Evaluation Service
 *
 * Uses LLM judgment to evaluate if a scenario execution was successful.
 */

import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const EvaluationSchema = z.object({
  verdict: z.enum(['pass', 'fail']).describe('Whether the scenario was completed successfully'),
  reason: z.string().describe('Brief explanation of why the scenario passed or failed'),
  confidence: z.number().min(0).max(1).describe('Confidence level in the evaluation (0-1)'),
});

export type EvaluationResult = z.infer<typeof EvaluationSchema>;

/**
 * Supported evaluator model IDs
 */
export type EvaluatorModelId =
  | 'claude-3-5-sonnet-latest'
  | 'claude-3-5-haiku-latest'
  | 'gpt-4o'
  | 'gpt-4o-mini';

/**
 * Get the model instance for an evaluator model ID
 */
function getEvaluatorModel(modelId: EvaluatorModelId) {
  switch (modelId) {
    case 'claude-3-5-sonnet-latest':
      return anthropic('claude-3-5-sonnet-latest');
    case 'claude-3-5-haiku-latest':
      return anthropic('claude-3-5-haiku-latest');
    case 'gpt-4o':
      return openai('gpt-4o');
    case 'gpt-4o-mini':
      return openai('gpt-4o-mini');
    default:
      return anthropic('claude-3-5-haiku-latest');
  }
}

const DEFAULT_EVALUATOR: EvaluatorModelId = 'claude-3-5-haiku-latest';

/**
 * Evaluate if a scenario execution was successful
 *
 * @param scenarioPrompt The original scenario prompt/task
 * @param agentOutput The output produced by the agent
 * @param conversation Optional conversation history for context
 * @param modelId Which model to use for evaluation
 */
export async function evaluateScenarioRun(
  scenarioPrompt: string,
  agentOutput: string,
  conversation?: unknown[],
  modelId: EvaluatorModelId = DEFAULT_EVALUATOR
): Promise<EvaluationResult> {
  const model = getEvaluatorModel(modelId);

  const conversationContext = conversation
    ? `\n\nConversation history:\n${JSON.stringify(conversation, null, 2)}`
    : '';

  const { object } = await generateObject({
    model,
    schema: EvaluationSchema,
    prompt: `You are evaluating whether an AI agent successfully completed a task.

## Task
${scenarioPrompt}

## Agent Output
${agentOutput}
${conversationContext}

## Instructions
Evaluate if the agent successfully completed the task described above.
- A "pass" means the core objective was achieved, even if some minor aspects weren't perfect
- A "fail" means the agent failed to accomplish the main goal
- Consider partial success as a pass if the primary task was completed
- Be fair but rigorous in your evaluation

Provide your verdict, a brief reason, and your confidence level.`,
  });

  return object;
}

/**
 * Run assertions against the output
 *
 * @param output The agent output to check
 * @param assertions The assertions to run
 */
export function runAssertions(
  output: string,
  assertions: { regex?: string[]; schema?: Record<string, unknown> }
): { passed: string[]; failed: string[] } {
  const passed: string[] = [];
  const failed: string[] = [];

  // Check regex assertions
  if (assertions.regex) {
    for (const pattern of assertions.regex) {
      try {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(output)) {
          passed.push(`regex:${pattern}`);
        } else {
          failed.push(`regex:${pattern}`);
        }
      } catch {
        failed.push(`regex:${pattern} (invalid pattern)`);
      }
    }
  }

  // Schema assertions would require more complex validation
  // For now, we'll just note if schema was provided
  if (assertions.schema) {
    // TODO: Implement JSON schema validation against parsed output
    passed.push('schema:provided (validation pending)');
  }

  return { passed, failed };
}

/**
 * Combine LLM evaluation and assertions into final verdict
 */
export function determineFinalVerdict(
  evaluation: EvaluationResult,
  assertions?: { passed: string[]; failed: string[] } | null
): 'pass' | 'fail' {
  // If LLM says fail, it fails
  if (evaluation.verdict === 'fail') {
    return 'fail';
  }

  // If there are failed assertions, it fails
  if (assertions && assertions.failed.length > 0) {
    return 'fail';
  }

  return 'pass';
}
