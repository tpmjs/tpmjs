/**
 * Scenario Execution Service
 *
 * Orchestrates scenario execution using collection tools with AI SDK.
 * Executes scenarios by building tools from the associated collection
 * and running them through an LLM agent loop.
 */

import { openai } from '@ai-sdk/openai';
import type { Collection, Package, Scenario, ScenarioRun, Tool } from '@prisma/client';
import { prisma } from '@tpmjs/db';
import { generateText, stepCountIs } from 'ai';

import { createToolDefinition } from '../ai-agent/tool-executor-agent';
import { parseExecutorConfig, resolveExecutorConfig } from '../executors';
import {
  determineFinalVerdict,
  type EvaluatorModelId,
  evaluateScenarioRun,
  runAssertions,
} from './evaluate';

const DEFAULT_EVALUATOR: EvaluatorModelId = 'gpt-4.1-mini';
const DEFAULT_MODEL = 'gpt-4.1-mini';
const MAX_RETRIES = 1;
const MAX_TOOL_STEPS = 10;

/**
 * Collection type with full tool relations
 */
type CollectionWithTools = Collection & {
  tools: Array<{
    tool: Tool & { package: Package };
  }>;
};

interface ExecutionOptions {
  evaluatorModel?: EvaluatorModelId;
}

interface ExecutionResult {
  run: ScenarioRun;
  success: boolean;
}

/**
 * Check and decrement user's daily quota
 */
export async function checkAndDecrementQuota(
  userId: string
): Promise<{ allowed: boolean; remaining: number }> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Get or create quota record
  let quota = await prisma.scenarioQuota.findUnique({
    where: { userId },
  });

  if (!quota) {
    quota = await prisma.scenarioQuota.create({
      data: {
        userId,
        dailyLimit: 50,
        dailyUsed: 0,
        lastResetAt: startOfDay,
      },
    });
  }

  // Reset quota if it's a new day
  if (quota.lastResetAt < startOfDay) {
    quota = await prisma.scenarioQuota.update({
      where: { userId },
      data: {
        dailyUsed: 0,
        lastResetAt: startOfDay,
      },
    });
  }

  // Check if quota allows another run
  if (quota.dailyUsed >= quota.dailyLimit) {
    return { allowed: false, remaining: 0 };
  }

  // Decrement quota
  await prisma.scenarioQuota.update({
    where: { userId },
    data: {
      dailyUsed: { increment: 1 },
    },
  });

  return { allowed: true, remaining: quota.dailyLimit - quota.dailyUsed - 1 };
}

/**
 * Update scenario metrics based on run result
 */
export async function updateScenarioMetrics(
  scenarioId: string,
  status: 'pass' | 'fail' | 'error'
): Promise<void> {
  const scenario = await prisma.scenario.findUnique({
    where: { id: scenarioId },
  });

  if (!scenario) return;

  let { consecutivePasses, consecutiveFails, qualityScore, totalRuns } = scenario;

  if (status === 'pass') {
    consecutivePasses += 1;
    consecutiveFails = 0;
    // Bonus for streaks: +0.05 per pass + (streak bonus), max 1.0
    qualityScore = Math.min(1.0, qualityScore + 0.05 + consecutivePasses * 0.01);
  } else {
    consecutiveFails += 1;
    consecutivePasses = 0;
    // Penalty for fails: -0.1 per fail + (streak penalty), min 0
    qualityScore = Math.max(0, qualityScore - 0.1 - consecutiveFails * 0.02);
  }

  await prisma.scenario.update({
    where: { id: scenarioId },
    data: {
      consecutivePasses,
      consecutiveFails,
      qualityScore,
      totalRuns: totalRuns + 1,
      lastRunAt: new Date(),
      lastRunStatus: status,
    },
  });
}

/**
 * Execute a scenario using real agent with collection tools
 *
 * 1. Creates run record with 'pending' status
 * 2. Builds AI SDK tools from the scenario's collection
 * 3. Executes the scenario prompt with multi-step tool loop
 * 4. Evaluates the result with LLM judgment
 * 5. Runs any configured assertions
 * 6. Updates scenario quality metrics based on result
 *
 * @param scenario The scenario to execute
 * @param userId The user triggering the execution
 * @param options Execution options
 */
export async function executeScenario(
  scenario: Scenario,
  userId: string,
  options: ExecutionOptions = {}
): Promise<ExecutionResult> {
  const { evaluatorModel = DEFAULT_EVALUATOR } = options;

  // Create run record
  const run = await prisma.scenarioRun.create({
    data: {
      scenarioId: scenario.id,
      userId,
      status: 'pending',
    },
  });

  let lastError: Error | null = null;
  let retryCount = 0;

  // Retry loop
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    retryCount = attempt;

    try {
      // Update status to running
      await prisma.scenarioRun.update({
        where: { id: run.id },
        data: {
          status: 'running',
          startedAt: new Date(),
          retryCount: attempt,
        },
      });

      // Execute scenario using real agent with collection tools
      const executionResult = await executeWithAgent(scenario);

      // Evaluate with LLM
      const evaluation = await evaluateScenarioRun(
        scenario.prompt,
        executionResult.output,
        executionResult.conversation,
        evaluatorModel
      );

      // Run assertions if defined
      const assertions = scenario.assertions as {
        regex?: string[];
        schema?: Record<string, unknown>;
      } | null;
      const assertionResults = assertions
        ? runAssertions(executionResult.output, assertions)
        : null;

      // Determine final verdict
      const finalStatus = determineFinalVerdict(evaluation, assertionResults);

      // Update run record
      const updatedRun = await prisma.scenarioRun.update({
        where: { id: run.id },
        data: {
          status: finalStatus,
          conversation: executionResult.conversation as object,
          output: executionResult.output,
          evaluatorModel,
          evaluatorVerdict: evaluation.verdict,
          evaluatorReason: evaluation.reason,
          assertionResults: assertionResults as object,
          inputTokens: executionResult.usage.inputTokens,
          outputTokens: executionResult.usage.outputTokens,
          totalTokens: executionResult.usage.totalTokens,
          executionTimeMs: executionResult.durationMs,
          completedAt: new Date(),
        },
      });

      // Update scenario metrics
      await updateScenarioMetrics(scenario.id, finalStatus);

      return { run: updatedRun, success: finalStatus === 'pass' };
    } catch (error) {
      lastError = error as Error;

      // If this is the last attempt, mark as error
      if (attempt === MAX_RETRIES) {
        const errorRun = await prisma.scenarioRun.update({
          where: { id: run.id },
          data: {
            status: 'error',
            retryCount,
            errorLog: (error as Error).stack || (error as Error).message,
            completedAt: new Date(),
          },
        });

        await updateScenarioMetrics(scenario.id, 'error');

        return { run: errorRun, success: false };
      }
    }
  }

  // Should never reach here, but TypeScript needs this
  throw lastError || new Error('Unknown execution error');
}

/**
 * Fetch collection with all tool relations needed for execution
 */
async function fetchCollectionWithTools(collectionId: string): Promise<CollectionWithTools | null> {
  return prisma.collection.findUnique({
    where: { id: collectionId },
    include: {
      tools: {
        include: {
          tool: {
            include: { package: true },
          },
        },
        orderBy: { position: 'asc' },
      },
    },
  });
}

/**
 * Sanitize npm package name to valid tool name
 * OpenAI limits tool names to 64 characters
 */
function sanitizeToolName(name: string): string {
  const sanitized = name.replace(/[@/]/g, '-').replace(/^-+/, '');
  return sanitized.slice(0, 64);
}

/**
 * Parse environment variables from JSON field
 */
function parseEnvVars(envVars: unknown): Record<string, string> {
  if (!envVars || typeof envVars !== 'object') {
    return {};
  }
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(envVars)) {
    if (typeof value === 'string') {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Build AI SDK tools from a collection
 * Similar to buildAgentTools but works directly with Collection
 */
function buildCollectionTools(
  collection: CollectionWithTools
): Record<string, ReturnType<typeof createToolDefinition>> {
  const tools: Record<string, ReturnType<typeof createToolDefinition>> = {};
  const seenTools = new Set<string>();

  // Parse collection-level executor config
  const collectionExecutorConfig = parseExecutorConfig(
    collection.executorType,
    collection.executorConfig
  );

  // Resolve executor config (collection config or system default)
  const resolvedConfig = resolveExecutorConfig(null, collectionExecutorConfig);

  // Parse collection env vars
  const envVars = parseEnvVars(collection.envVars);

  for (const collectionTool of collection.tools) {
    const tool = collectionTool.tool;
    const toolKey = `${tool.package.npmPackageName}::${tool.name}`;

    // Avoid duplicates
    if (seenTools.has(toolKey)) continue;
    seenTools.add(toolKey);

    const toolName = sanitizeToolName(`${tool.package.npmPackageName}-${tool.name}`);
    tools[toolName] = createToolDefinition(tool, resolvedConfig, envVars);
  }

  return tools;
}

/**
 * Execute scenario using real agent with collection tools
 */
async function executeWithAgent(scenario: Scenario): Promise<{
  output: string;
  conversation: unknown[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  durationMs: number;
}> {
  const startTime = Date.now();

  // Verify scenario has a collection
  if (!scenario.collectionId) {
    throw new Error('Scenario has no associated collection');
  }

  // Fetch collection with tools
  const collection = await fetchCollectionWithTools(scenario.collectionId);
  if (!collection) {
    throw new Error(`Collection not found: ${scenario.collectionId}`);
  }

  if (collection.tools.length === 0) {
    throw new Error('Collection has no tools configured');
  }

  // Build tools from collection
  const tools = buildCollectionTools(collection);

  console.log('[executeWithAgent] Executing scenario with tools:', Object.keys(tools));

  // Build system prompt for scenario execution
  const systemPrompt = `You are an AI assistant tasked with completing the following scenario using the available tools.

IMPORTANT: You must actually USE the tools to complete the task. Do not just describe what you would do - execute the tools.

Available tools: ${Object.keys(tools).join(', ')}

Complete the user's task to the best of your ability using the tools provided.`;

  // Execute with generateText and multi-step tool loop
  const result = await generateText({
    model: openai(DEFAULT_MODEL),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: scenario.prompt },
    ],
    tools,
    stopWhen: stepCountIs(MAX_TOOL_STEPS),
  });

  // Build conversation history from response
  const conversation: unknown[] = [{ role: 'user', content: scenario.prompt }];

  // Add all steps to conversation
  for (const step of result.steps || []) {
    if (step.toolCalls && step.toolCalls.length > 0) {
      for (const toolCall of step.toolCalls) {
        conversation.push({
          role: 'assistant',
          toolCall: {
            id: toolCall.toolCallId,
            name: toolCall.toolName,
            // AI SDK v6 uses 'input' property for DynamicToolCall
            input: (toolCall as { input?: unknown }).input,
          },
        });
      }
    }

    if (step.toolResults && step.toolResults.length > 0) {
      for (const toolResult of step.toolResults) {
        conversation.push({
          role: 'tool',
          toolCallId: toolResult.toolCallId,
          output: toolResult.output,
        });
      }
    }

    if (step.text) {
      conversation.push({ role: 'assistant', content: step.text });
    }
  }

  // Final assistant message
  if (result.text) {
    conversation.push({ role: 'assistant', content: result.text });
  }

  const durationMs = Date.now() - startTime;

  // Get token usage
  const usage = result.usage || { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

  console.log(
    '[executeWithAgent] Completed in',
    durationMs,
    'ms with',
    result.steps?.length || 0,
    'steps'
  );

  return {
    output: result.text || '[No output generated]',
    conversation,
    usage: {
      inputTokens: usage.inputTokens ?? 0,
      outputTokens: usage.outputTokens ?? 0,
      totalTokens: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
    },
    durationMs,
  };
}

/**
 * Get user's current quota status
 */
export async function getQuotaStatus(
  userId: string
): Promise<{ used: number; limit: number; remaining: number; resetsAt: Date }> {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const quota = await prisma.scenarioQuota.findUnique({
    where: { userId },
  });

  if (!quota) {
    return { used: 0, limit: 50, remaining: 50, resetsAt: tomorrow };
  }

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const used = quota.lastResetAt < startOfDay ? 0 : quota.dailyUsed;

  return {
    used,
    limit: quota.dailyLimit,
    remaining: quota.dailyLimit - used,
    resetsAt: tomorrow,
  };
}
