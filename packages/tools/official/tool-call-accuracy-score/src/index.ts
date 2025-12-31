/**
 * Tool Call Accuracy Score Tool for TPMJS
 * Scores the accuracy of actual tool calls against expected tool calls in agent workflows.
 * Useful for testing and evaluating agent behavior.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Represents a tool call with name and arguments
 */
export interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
}

/**
 * Detailed comparison of a single tool call
 */
export interface ToolCallComparison {
  expected: ToolCall;
  actual?: ToolCall;
  status: 'correct' | 'incorrect' | 'missed';
  argsMatch: boolean;
  details?: string;
}

/**
 * Output interface for tool call accuracy scoring
 */
export interface ToolCallAccuracyScore {
  score: number;
  totalExpected: number;
  totalActual: number;
  correctCalls: ToolCallComparison[];
  incorrectCalls: ToolCallComparison[];
  missedCalls: ToolCallComparison[];
  extraCalls: ToolCall[];
  summary: string;
}

type ToolCallAccuracyScoreInput = {
  expected: ToolCall[];
  actual: ToolCall[];
};

/**
 * Deep equality check for arguments
 * Compares two objects recursively
 */
function argsEqual(args1: Record<string, unknown>, args2: Record<string, unknown>): boolean {
  const keys1 = Object.keys(args1).sort();
  const keys2 = Object.keys(args2).sort();

  if (keys1.length !== keys2.length) return false;
  if (JSON.stringify(keys1) !== JSON.stringify(keys2)) return false;

  for (const key of keys1) {
    const val1 = args1[key];
    const val2 = args2[key];

    if (typeof val1 === 'object' && val1 !== null && typeof val2 === 'object' && val2 !== null) {
      if (!argsEqual(val1 as Record<string, unknown>, val2 as Record<string, unknown>)) {
        return false;
      }
    } else if (val1 !== val2) {
      return false;
    }
  }

  return true;
}

/**
 * Finds the best match for an expected call in the actual calls
 */
function findBestMatch(
  expected: ToolCall,
  actualCalls: ToolCall[],
  usedIndices: Set<number>
): { match: ToolCall | null; index: number; argsMatch: boolean } {
  let bestMatch: ToolCall | null = null;
  let bestIndex = -1;
  let bestArgsMatch = false;

  for (let i = 0; i < actualCalls.length; i++) {
    if (usedIndices.has(i)) continue;

    const actual = actualCalls[i];
    if (!actual) continue;

    if (actual.tool === expected.tool) {
      const argsMatch = argsEqual(expected.args, actual.args);

      // Perfect match - tool name and args
      if (argsMatch) {
        return { match: actual, index: i, argsMatch: true };
      }

      // Partial match - just tool name
      if (bestMatch === null) {
        bestMatch = actual;
        bestIndex = i;
        bestArgsMatch = false;
      }
    }
  }

  return { match: bestMatch, index: bestIndex, argsMatch: bestArgsMatch };
}

/**
 * Tool Call Accuracy Score Tool
 * Compares expected vs actual tool calls and returns accuracy metrics
 */
export const toolCallAccuracyScoreTool = tool({
  description:
    'Scores the accuracy of actual tool calls against expected tool calls in agent workflows. Returns a score (0-1), lists of correct/incorrect/missed/extra calls, and a detailed summary. Useful for testing and evaluating agent behavior.',
  inputSchema: jsonSchema<ToolCallAccuracyScoreInput>({
    type: 'object',
    properties: {
      expected: {
        type: 'array',
        description: 'Array of expected tool calls with tool name and arguments',
        items: {
          type: 'object',
          properties: {
            tool: {
              type: 'string',
              description: 'Name of the tool',
            },
            args: {
              type: 'object',
              description: 'Arguments passed to the tool',
              additionalProperties: true,
            },
          },
          required: ['tool', 'args'],
        },
      },
      actual: {
        type: 'array',
        description: 'Array of actual tool calls made with tool name and arguments',
        items: {
          type: 'object',
          properties: {
            tool: {
              type: 'string',
              description: 'Name of the tool',
            },
            args: {
              type: 'object',
              description: 'Arguments passed to the tool',
              additionalProperties: true,
            },
          },
          required: ['tool', 'args'],
        },
      },
    },
    required: ['expected', 'actual'],
    additionalProperties: false,
  }),
  async execute({ expected, actual }): Promise<ToolCallAccuracyScore> {
    // Validate inputs
    if (!Array.isArray(expected)) {
      throw new Error('Expected must be an array of tool calls');
    }
    if (!Array.isArray(actual)) {
      throw new Error('Actual must be an array of tool calls');
    }

    const correctCalls: ToolCallComparison[] = [];
    const incorrectCalls: ToolCallComparison[] = [];
    const missedCalls: ToolCallComparison[] = [];
    const extraCalls: ToolCall[] = [];
    const usedActualIndices = new Set<number>();

    // Process each expected call
    for (const expectedCall of expected) {
      const { match, index, argsMatch } = findBestMatch(expectedCall, actual, usedActualIndices);

      if (match && argsMatch) {
        // Perfect match
        correctCalls.push({
          expected: expectedCall,
          actual: match,
          status: 'correct',
          argsMatch: true,
        });
        usedActualIndices.add(index);
      } else if (match && !argsMatch) {
        // Tool name matches but args don't
        incorrectCalls.push({
          expected: expectedCall,
          actual: match,
          status: 'incorrect',
          argsMatch: false,
          details: 'Tool name matches but arguments differ',
        });
        usedActualIndices.add(index);
      } else {
        // No match found - call was missed
        missedCalls.push({
          expected: expectedCall,
          status: 'missed',
          argsMatch: false,
          details: 'Expected call was not made',
        });
      }
    }

    // Find extra calls (actual calls not matched to any expected call)
    for (let i = 0; i < actual.length; i++) {
      if (!usedActualIndices.has(i)) {
        const extraCall = actual[i];
        if (extraCall) {
          extraCalls.push(extraCall);
        }
      }
    }

    // Calculate score
    // Score = (correct calls) / (expected calls + extra calls)
    // This penalizes both missing expected calls and making extra unexpected calls
    const totalExpected = expected.length;
    const totalActual = actual.length;
    const numCorrect = correctCalls.length;

    let score = 0;
    if (totalExpected === 0 && totalActual === 0) {
      score = 1.0; // Perfect score if both are empty
    } else if (totalExpected === 0) {
      score = 0; // All calls are extra
    } else {
      // Score based on precision and recall
      const precision = totalActual > 0 ? numCorrect / totalActual : 0;
      const recall = numCorrect / totalExpected;
      // F1 score (harmonic mean of precision and recall)
      score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    }

    // Generate summary
    const summary = [
      `Accuracy Score: ${(score * 100).toFixed(1)}%`,
      `Correct: ${correctCalls.length}/${totalExpected}`,
      `Incorrect: ${incorrectCalls.length}`,
      `Missed: ${missedCalls.length}`,
      `Extra: ${extraCalls.length}`,
    ].join(' | ');

    return {
      score: Math.round(score * 1000) / 1000, // Round to 3 decimal places
      totalExpected,
      totalActual,
      correctCalls,
      incorrectCalls,
      missedCalls,
      extraCalls,
      summary,
    };
  },
});

export default toolCallAccuracyScoreTool;
