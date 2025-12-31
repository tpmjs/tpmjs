/**
 * Novelty Score Workflow Tool for TPMJS
 * Analyzes how novel/unique a workflow is compared to existing workflows.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Represents a step in a workflow
 */
export interface WorkflowStep {
  id: string;
  name: string;
  type?: string;
  tool?: string;
  action?: string;
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Represents a workflow
 */
export interface Workflow {
  id?: string;
  name?: string;
  description?: string;
  steps: WorkflowStep[];
  category?: string;
  tags?: string[];
  [key: string]: unknown;
}

/**
 * Represents a similar workflow found during comparison
 */
export interface SimilarWorkflow {
  workflowId?: string;
  workflowName?: string;
  similarityScore: number; // 0-1, higher = more similar
  sharedSteps: string[]; // step names/IDs that are shared
  sharedPattern: string; // description of what's similar
}

/**
 * Represents a unique step not found in existing workflows
 */
export interface UniqueStep {
  stepId: string;
  stepName: string;
  reason: string;
  noveltyContribution: number; // 0-1
}

/**
 * Result of novelty scoring
 */
export interface NoveltyScore {
  noveltyScore: number; // 0-1, higher = more novel
  similarWorkflows: SimilarWorkflow[];
  uniqueSteps: UniqueStep[];
  analysis: {
    totalSteps: number;
    uniqueStepCount: number;
    mostSimilarWorkflowId?: string;
    mostSimilarWorkflowScore?: number;
  };
}

type NoveltyScoreWorkflowInput = {
  workflow: Workflow;
  existingWorkflows: Workflow[];
};

/**
 * Normalizes step identifier for comparison
 */
function normalizeStepIdentifier(step: WorkflowStep): string {
  // Combine key identifying fields
  const parts: string[] = [];

  if (step.type) parts.push(step.type.toLowerCase());
  if (step.tool) parts.push(step.tool.toLowerCase());
  if (step.action) parts.push(step.action.toLowerCase());
  if (step.name) parts.push(step.name.toLowerCase());

  return parts.join(':');
}

/**
 * Calculates Jaccard similarity between two sets
 */
function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;

  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  return intersection.size / union.size;
}

/**
 * Calculates sequence similarity (considers order)
 */
function sequenceSimilarity(seq1: string[], seq2: string[]): number {
  if (seq1.length === 0 && seq2.length === 0) return 1;
  if (seq1.length === 0 || seq2.length === 0) return 0;

  // Simple longest common subsequence ratio
  const lcs = longestCommonSubsequenceLength(seq1, seq2);
  const maxLength = Math.max(seq1.length, seq2.length);

  return lcs / maxLength;
}

/**
 * Calculates longest common subsequence length
 */
function longestCommonSubsequenceLength(seq1: string[], seq2: string[]): number {
  const m = seq1.length;
  const n = seq2.length;
  const dp: number[][] = Array(m + 1)
    .fill(0)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (seq1[i - 1] === seq2[j - 1]) {
        dp[i]![j] = dp[i - 1]?.[j - 1]! + 1;
      } else {
        dp[i]![j] = Math.max(dp[i - 1]?.[j]!, dp[i]?.[j - 1]!);
      }
    }
  }

  return dp[m]?.[n]!;
}

/**
 * Compares two workflows and returns similarity score
 */
function compareWorkflows(
  workflow1: Workflow,
  workflow2: Workflow
): {
  similarityScore: number;
  sharedSteps: string[];
  sharedPattern: string;
} {
  // Get step identifiers
  const steps1 = workflow1.steps.map(normalizeStepIdentifier);
  const steps2 = workflow2.steps.map(normalizeStepIdentifier);

  // Calculate Jaccard similarity (set-based)
  const set1 = new Set(steps1);
  const set2 = new Set(steps2);
  const jaccardScore = jaccardSimilarity(set1, set2);

  // Calculate sequence similarity (order-based)
  const sequenceScore = sequenceSimilarity(steps1, steps2);

  // Weighted combination (60% Jaccard, 40% sequence)
  const similarityScore = jaccardScore * 0.6 + sequenceScore * 0.4;

  // Find shared steps
  const sharedStepIds = [...set1].filter((s) => set2.has(s));
  const sharedSteps = sharedStepIds.map((id) => {
    const step = workflow1.steps.find((s) => normalizeStepIdentifier(s) === id);
    return step?.name || id;
  });

  // Describe the shared pattern
  let sharedPattern = 'No significant similarity';
  if (similarityScore > 0.8) {
    sharedPattern = 'Nearly identical workflows with same steps and order';
  } else if (similarityScore > 0.6) {
    sharedPattern = 'Highly similar workflows with many shared steps';
  } else if (similarityScore > 0.4) {
    sharedPattern = 'Moderately similar workflows with some shared steps';
  } else if (similarityScore > 0.2) {
    sharedPattern = 'Slightly similar workflows with few common elements';
  }

  if (sharedSteps.length > 0) {
    sharedPattern += ` (${sharedSteps.length} shared steps: ${sharedSteps.slice(0, 3).join(', ')}${sharedSteps.length > 3 ? '...' : ''})`;
  }

  return {
    similarityScore,
    sharedSteps,
    sharedPattern,
  };
}

/**
 * Identifies unique steps in the workflow
 */
function identifyUniqueSteps(workflow: Workflow, existingWorkflows: Workflow[]): UniqueStep[] {
  const uniqueSteps: UniqueStep[] = [];

  // Create a set of all step identifiers from existing workflows
  const existingStepIds = new Set<string>();
  for (const existingWorkflow of existingWorkflows) {
    for (const step of existingWorkflow.steps) {
      existingStepIds.add(normalizeStepIdentifier(step));
    }
  }

  // Check each step in the new workflow
  for (const step of workflow.steps) {
    const stepId = normalizeStepIdentifier(step);

    if (!existingStepIds.has(stepId)) {
      // This step is unique
      let reason = 'Step not found in any existing workflow';

      // Provide more specific reason based on what makes it unique
      if (step.tool) {
        reason = `Uses novel tool: ${step.tool}`;
      } else if (step.action) {
        reason = `Performs unique action: ${step.action}`;
      } else if (step.type) {
        reason = `Introduces new step type: ${step.type}`;
      }

      uniqueSteps.push({
        stepId: step.id,
        stepName: step.name,
        reason,
        noveltyContribution: 1.0 / workflow.steps.length, // Equal contribution
      });
    }
  }

  return uniqueSteps;
}

/**
 * Calculates overall novelty score
 */
function calculateNoveltyScore(
  workflow: Workflow,
  similarWorkflows: SimilarWorkflow[],
  uniqueSteps: UniqueStep[]
): number {
  if (similarWorkflows.length === 0) {
    // No existing workflows to compare against - maximally novel
    return 1.0;
  }

  // Find the most similar workflow
  const maxSimilarity = Math.max(...similarWorkflows.map((sw) => sw.similarityScore));

  // Novelty is inverse of similarity
  const baseNovelty = 1 - maxSimilarity;

  // Boost novelty based on unique steps
  const uniqueStepRatio = uniqueSteps.length / Math.max(workflow.steps.length, 1);
  const uniquenessBoost = uniqueStepRatio * 0.3; // Up to 30% boost

  // Combine base novelty with uniqueness boost
  const noveltyScore = Math.min(baseNovelty + uniquenessBoost, 1.0);

  return Math.round(noveltyScore * 100) / 100;
}

/**
 * Novelty Score Workflow Tool
 * Analyzes how novel a workflow is compared to existing workflows
 */
export const noveltyScoreWorkflowTool = tool({
  description:
    'Analyzes how novel/unique a workflow is by comparing it to existing workflows. Calculates a novelty score (0-1), identifies similar workflows, and highlights unique steps. Higher scores indicate more novel workflows.',
  inputSchema: jsonSchema<NoveltyScoreWorkflowInput>({
    type: 'object',
    properties: {
      workflow: {
        type: 'object',
        description: 'The workflow to analyze for novelty',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                type: { type: 'string' },
                tool: { type: 'string' },
                action: { type: 'string' },
                config: { type: 'object' },
              },
              required: ['id', 'name'],
            },
          },
          category: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['steps'],
      },
      existingWorkflows: {
        type: 'array',
        description: 'Array of existing workflows to compare against',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            steps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  type: { type: 'string' },
                  tool: { type: 'string' },
                  action: { type: 'string' },
                },
                required: ['id', 'name'],
              },
            },
          },
          required: ['steps'],
        },
      },
    },
    required: ['workflow', 'existingWorkflows'],
    additionalProperties: false,
  }),
  async execute({ workflow, existingWorkflows }): Promise<NoveltyScore> {
    // Validate inputs
    if (!workflow || !workflow.steps || !Array.isArray(workflow.steps)) {
      throw new Error('Invalid workflow: must contain a steps array');
    }

    if (workflow.steps.length === 0) {
      throw new Error('Workflow must have at least one step');
    }

    if (!Array.isArray(existingWorkflows)) {
      throw new Error('Invalid existingWorkflows: must be an array');
    }

    // Validate existing workflows
    for (const existing of existingWorkflows) {
      if (!existing.steps || !Array.isArray(existing.steps)) {
        throw new Error('Each existing workflow must have a steps array');
      }
    }

    // If no existing workflows, this is maximally novel
    if (existingWorkflows.length === 0) {
      return {
        noveltyScore: 1.0,
        similarWorkflows: [],
        uniqueSteps: workflow.steps.map((step) => ({
          stepId: step.id,
          stepName: step.name,
          reason: 'No existing workflows to compare against',
          noveltyContribution: 1.0 / workflow.steps.length,
        })),
        analysis: {
          totalSteps: workflow.steps.length,
          uniqueStepCount: workflow.steps.length,
        },
      };
    }

    // Compare with each existing workflow
    const similarWorkflows: SimilarWorkflow[] = [];

    for (const existingWorkflow of existingWorkflows) {
      const comparison = compareWorkflows(workflow, existingWorkflow);

      // Only include workflows with meaningful similarity (>10%)
      if (comparison.similarityScore > 0.1) {
        similarWorkflows.push({
          workflowId: existingWorkflow.id,
          workflowName: existingWorkflow.name,
          similarityScore: Math.round(comparison.similarityScore * 100) / 100,
          sharedSteps: comparison.sharedSteps,
          sharedPattern: comparison.sharedPattern,
        });
      }
    }

    // Sort by similarity (most similar first)
    similarWorkflows.sort((a, b) => b.similarityScore - a.similarityScore);

    // Identify unique steps
    const uniqueSteps = identifyUniqueSteps(workflow, existingWorkflows);

    // Calculate novelty score
    const noveltyScore = calculateNoveltyScore(workflow, similarWorkflows, uniqueSteps);

    // Build analysis
    const mostSimilar = similarWorkflows[0];

    return {
      noveltyScore,
      similarWorkflows: similarWorkflows.slice(0, 5), // Top 5 most similar
      uniqueSteps,
      analysis: {
        totalSteps: workflow.steps.length,
        uniqueStepCount: uniqueSteps.length,
        mostSimilarWorkflowId: mostSimilar?.workflowId,
        mostSimilarWorkflowScore: mostSimilar?.similarityScore,
      },
    };
  },
});

export default noveltyScoreWorkflowTool;
