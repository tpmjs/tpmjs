/**
 * Scenario Execution Service
 *
 * Orchestrates scenario execution using ephemeral agents.
 * Currently implements a simulated execution - full agent integration coming in Phase 3.
 */

import type { Scenario, ScenarioRun } from '@prisma/client';
import { prisma } from '@tpmjs/db';
import {
  determineFinalVerdict,
  type EvaluatorModelId,
  evaluateScenarioRun,
  runAssertions,
} from './evaluate';

const DEFAULT_EVALUATOR: EvaluatorModelId = 'claude-3-5-haiku-latest';
const MAX_RETRIES = 1;

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
 * Execute a scenario
 *
 * NOTE: This currently uses simulated execution.
 * Full agent integration will be added in Phase 3.
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

      // TODO: Phase 3 - Replace with actual agent execution
      // For now, we simulate execution
      const executionResult = await simulateExecution(scenario);

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
 * Simulated execution for development/testing
 *
 * This will be replaced with actual agent execution in Phase 3.
 */
async function simulateExecution(scenario: Scenario): Promise<{
  output: string;
  conversation: unknown[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  durationMs: number;
}> {
  // Simulate some processing time
  const durationMs = Math.floor(Math.random() * 3000) + 1000;
  await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay

  // Generate simulated output based on the prompt
  const passRate = 0.7; // 70% pass rate for simulated runs
  const willPass = Math.random() < passRate;

  const output = willPass
    ? `[SIMULATED] Successfully completed task: ${scenario.prompt.slice(0, 100)}...\n\nThe scenario was executed successfully. All requested operations were performed.`
    : `[SIMULATED] Failed to complete task: ${scenario.prompt.slice(0, 100)}...\n\nEncountered an error during execution. The requested operation could not be completed.`;

  const conversation = [
    { role: 'user', content: scenario.prompt },
    { role: 'assistant', content: output },
  ];

  const inputTokens = Math.floor(scenario.prompt.length / 4);
  const outputTokens = Math.floor(output.length / 4);

  return {
    output,
    conversation,
    usage: {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
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
