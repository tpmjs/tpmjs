/**
 * AI Conversation Judge Tool for TPMJS
 *
 * Evaluates AI SDK conversations across 10 quality metrics to ensure
 * agentic loops are making real progress and completing user intent.
 *
 * Use this tool frequently during agentic workflows to:
 * - Verify the AI is on track
 * - Catch loops or stuck states early
 * - Ensure task completion before moving on
 * - Get actionable improvement suggestions
 */

import { jsonSchema, tool } from 'ai';

/**
 * The 10 metrics used to evaluate AI conversations
 */
export const EVALUATION_METRICS = [
  'taskCompletion',
  'accuracy',
  'relevance',
  'clarity',
  'efficiency',
  'userIntentAlignment',
  'actionability',
  'progress',
  'errorHandling',
  'completeness',
] as const;

export type EvaluationMetric = (typeof EVALUATION_METRICS)[number];

/**
 * Metric descriptions for context
 */
export const METRIC_DESCRIPTIONS: Record<EvaluationMetric, string> = {
  taskCompletion: 'Did the AI make meaningful progress toward completing the user\'s request?',
  accuracy: 'Are the responses factually correct and free of hallucinations or errors?',
  relevance: 'Are responses directly addressing what the user asked for?',
  clarity: 'Are responses clear, well-structured, and easy to understand?',
  efficiency: 'Is the AI being concise without unnecessary verbosity or token waste?',
  userIntentAlignment: 'Does the AI correctly understand what the user actually wants?',
  actionability: 'Are the outputs actionable and immediately usable by the user?',
  progress: 'Is the conversation moving forward or stuck in loops/repetition?',
  errorHandling: 'Does the AI handle errors gracefully and recover appropriately?',
  completeness: 'Has the AI fully addressed all aspects of the request?',
};

/**
 * Metric weights for overall score calculation
 */
export const METRIC_WEIGHTS: Record<EvaluationMetric, number> = {
  taskCompletion: 2.0,      // Most important - did we do what was asked?
  userIntentAlignment: 1.5, // Critical - understanding the user
  completeness: 1.5,        // Important - full coverage
  accuracy: 1.5,            // Important - correctness
  progress: 1.2,            // Catches loops
  actionability: 1.0,       // Usability
  relevance: 1.0,           // On-topic
  errorHandling: 1.0,       // Resilience
  clarity: 0.8,             // Nice to have
  efficiency: 0.5,          // Least critical
};

/**
 * AI SDK message structure
 */
interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: Array<{
    toolName: string;
    args: Record<string, unknown>;
  }>;
  toolResults?: Array<{
    toolName: string;
    result: unknown;
  }>;
}

/**
 * Individual metric evaluation result
 */
interface MetricEvaluation {
  metric: EvaluationMetric;
  score: number;
  reason: string;
  mustDos: string[];
  suggestions: string[];
  observations: string[];
}

/**
 * Verdict on whether to continue, retry, or fail
 */
type Verdict = 'pass' | 'retry' | 'fail';

/**
 * Complete evaluation result
 */
interface JudgeResult {
  overallScore: number;
  verdict: Verdict;
  verdictReason: string;
  metrics: MetricEvaluation[];
  criticalIssues: string[];
  mustDos: string[];
  suggestions: string[];
  nextSteps: string[];
  loopDetected: boolean;
  conversationSummary: string;
}

/**
 * Input for the judge tool
 */
interface JudgeInput {
  messages: Message[];
  originalUserRequest?: string;
  context?: string;
  strictMode?: boolean;
}

/**
 * Analyze messages for loop detection
 */
function detectLoops(messages: Message[]): { detected: boolean; details: string[] } {
  const details: string[] = [];
  const assistantMessages = messages.filter(m => m.role === 'assistant');

  if (assistantMessages.length < 2) {
    return { detected: false, details: [] };
  }

  // Check for repeated content
  const contentSet = new Set<string>();
  let duplicateCount = 0;

  for (const msg of assistantMessages) {
    const normalized = msg.content.toLowerCase().trim().slice(0, 200);
    if (contentSet.has(normalized)) {
      duplicateCount++;
    }
    contentSet.add(normalized);
  }

  if (duplicateCount > 1) {
    details.push(`Detected ${duplicateCount} duplicate or near-duplicate responses`);
  }

  // Check for repeated tool calls
  const toolCallPatterns = new Map<string, number>();
  for (const msg of assistantMessages) {
    if (msg.toolCalls) {
      for (const call of msg.toolCalls) {
        const pattern = `${call.toolName}:${JSON.stringify(call.args).slice(0, 100)}`;
        toolCallPatterns.set(pattern, (toolCallPatterns.get(pattern) || 0) + 1);
      }
    }
  }

  for (const [pattern, count] of toolCallPatterns) {
    if (count > 2) {
      details.push(`Tool call pattern repeated ${count} times: ${pattern.slice(0, 50)}...`);
    }
  }

  // Check for oscillation patterns
  if (assistantMessages.length >= 4) {
    const last4 = assistantMessages.slice(-4).map(m => m.content.slice(0, 100));
    if (last4[0] === last4[2] && last4[1] === last4[3]) {
      details.push('Detected oscillation pattern in last 4 responses');
    }
  }

  return {
    detected: details.length > 0,
    details,
  };
}

/**
 * Extract the original user request from messages
 */
function extractUserRequest(messages: Message[], provided?: string): string {
  if (provided) return provided;

  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length === 0) return 'Unknown request';

  return userMessages[0]!.content;
}

/**
 * Count tool usage statistics
 */
function analyzeToolUsage(messages: Message[]): {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  toolsUsed: string[];
} {
  let totalCalls = 0;
  let successfulCalls = 0;
  let failedCalls = 0;
  const toolsUsed = new Set<string>();

  for (const msg of messages) {
    if (msg.toolCalls) {
      for (const call of msg.toolCalls) {
        totalCalls++;
        toolsUsed.add(call.toolName);
      }
    }
    if (msg.toolResults) {
      for (const result of msg.toolResults) {
        const resultStr = JSON.stringify(result.result).toLowerCase();
        if (resultStr.includes('error') || resultStr.includes('failed') || resultStr.includes('exception')) {
          failedCalls++;
        } else {
          successfulCalls++;
        }
      }
    }
  }

  return {
    totalCalls,
    successfulCalls,
    failedCalls,
    toolsUsed: Array.from(toolsUsed),
  };
}

/**
 * Evaluate a single metric
 */
function evaluateMetric(
  metric: EvaluationMetric,
  messages: Message[],
  userRequest: string,
  loopInfo: { detected: boolean; details: string[] },
  toolStats: ReturnType<typeof analyzeToolUsage>
): MetricEvaluation {
  const mustDos: string[] = [];
  const suggestions: string[] = [];
  const observations: string[] = [];
  let score = 5;
  let reason = '';

  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
  const assistantCount = messages.filter(m => m.role === 'assistant').length;
  const userCount = messages.filter(m => m.role === 'user').length;

  switch (metric) {
    case 'taskCompletion': {
      // Check if there's evidence of task completion
      const lastContent = lastAssistant?.content.toLowerCase() || '';
      const completionIndicators = ['done', 'completed', 'finished', 'created', 'updated', 'fixed', 'resolved', 'here is', 'here\'s'];
      const hasCompletion = completionIndicators.some(ind => lastContent.includes(ind));

      if (hasCompletion && toolStats.successfulCalls > 0) {
        score = 8;
        reason = 'Evidence of task completion with successful tool usage';
        suggestions.push('Verify the output matches user expectations');
      } else if (hasCompletion) {
        score = 6;
        reason = 'Claims of completion but limited tool usage to verify';
        mustDos.push('Verify claims with actual tool calls or evidence');
      } else if (toolStats.totalCalls > 0) {
        score = 4;
        reason = 'Tools were used but no clear completion signal';
        mustDos.push('Explicitly confirm task completion to the user');
      } else {
        score = 2;
        reason = 'No evidence of task completion';
        mustDos.push('Actually complete the task using appropriate tools');
      }
      break;
    }

    case 'accuracy': {
      if (toolStats.failedCalls > toolStats.successfulCalls) {
        score = 3;
        reason = 'More failed tool calls than successful ones indicates potential accuracy issues';
        mustDos.push('Investigate and fix the failing tool calls');
        observations.push(`${toolStats.failedCalls} failed vs ${toolStats.successfulCalls} successful calls`);
      } else if (toolStats.successfulCalls > 0) {
        score = 7;
        reason = 'Successful tool calls suggest accurate execution';
        suggestions.push('Consider validating outputs against expected results');
      } else {
        score = 5;
        reason = 'No tool calls to verify accuracy';
        observations.push('Unable to assess accuracy without tool results');
      }
      break;
    }

    case 'relevance': {
      // Simple heuristic: check if user request terms appear in responses
      const requestTerms = userRequest.toLowerCase().split(/\s+/).filter(t => t.length > 3);
      const responseText = messages.filter(m => m.role === 'assistant').map(m => m.content.toLowerCase()).join(' ');
      const matchedTerms = requestTerms.filter(t => responseText.includes(t));
      const relevanceRatio = requestTerms.length > 0 ? matchedTerms.length / requestTerms.length : 0.5;

      score = Math.round(relevanceRatio * 10);
      if (score >= 7) {
        reason = 'Responses are highly relevant to the user request';
      } else if (score >= 4) {
        reason = 'Responses are partially relevant but may have drifted off-topic';
        suggestions.push('Refocus on the core user request');
      } else {
        reason = 'Responses appear to have drifted from the original request';
        mustDos.push('Re-read the original request and address it directly');
      }
      observations.push(`${matchedTerms.length}/${requestTerms.length} key terms addressed`);
      break;
    }

    case 'clarity': {
      const totalWords = messages.filter(m => m.role === 'assistant')
        .reduce((sum, m) => sum + m.content.split(/\s+/).length, 0);
      const avgWordsPerResponse = assistantCount > 0 ? totalWords / assistantCount : 0;

      if (avgWordsPerResponse > 50 && avgWordsPerResponse < 500) {
        score = 8;
        reason = 'Responses are well-balanced in length for clarity';
      } else if (avgWordsPerResponse <= 50) {
        score = 6;
        reason = 'Responses may be too brief for complex explanations';
        suggestions.push('Provide more detailed explanations where helpful');
      } else {
        score = 5;
        reason = 'Responses may be too verbose';
        suggestions.push('Be more concise while maintaining clarity');
      }
      observations.push(`Average ${Math.round(avgWordsPerResponse)} words per response`);
      break;
    }

    case 'efficiency': {
      const messageRatio = assistantCount / Math.max(userCount, 1);

      if (messageRatio <= 3 && toolStats.totalCalls > 0) {
        score = 8;
        reason = 'Efficient conversation with purposeful tool usage';
      } else if (messageRatio > 5) {
        score = 4;
        reason = 'High number of assistant messages may indicate inefficiency';
        suggestions.push('Try to accomplish more per response');
      } else {
        score = 6;
        reason = 'Reasonable efficiency';
      }
      observations.push(`${assistantCount} assistant messages for ${userCount} user messages`);
      break;
    }

    case 'userIntentAlignment': {
      // Check if the conversation seems to understand the request
      const hasQuestions = messages.some(m => m.role === 'assistant' && m.content.includes('?'));
      const hasConfirmation = messages.some(m => m.role === 'assistant' &&
        (m.content.toLowerCase().includes('i understand') ||
         m.content.toLowerCase().includes('let me') ||
         m.content.toLowerCase().includes('i\'ll')));

      if (hasConfirmation && !hasQuestions) {
        score = 8;
        reason = 'AI appears to understand and is executing on user intent';
      } else if (hasQuestions && hasConfirmation) {
        score = 7;
        reason = 'AI is clarifying while also executing';
        observations.push('Asking clarifying questions shows engagement');
      } else if (hasQuestions) {
        score = 5;
        reason = 'AI is asking questions but may not be executing';
        suggestions.push('Balance clarification with action');
      } else {
        score = 4;
        reason = 'Unclear if AI fully understands user intent';
        mustDos.push('Confirm understanding of the user request');
      }
      break;
    }

    case 'actionability': {
      const lastContent = lastAssistant?.content || '';
      const hasCode = lastContent.includes('```') || lastContent.includes('function') || lastContent.includes('const ');
      const hasSteps = /\d+\.\s/.test(lastContent) || lastContent.includes('- ');
      const hasFiles = toolStats.toolsUsed.some(t => t.toLowerCase().includes('write') || t.toLowerCase().includes('create'));

      if (hasFiles) {
        score = 9;
        reason = 'Concrete files/artifacts were created';
        observations.push('Created tangible outputs');
      } else if (hasCode && hasSteps) {
        score = 7;
        reason = 'Provided code and clear steps';
      } else if (hasCode || hasSteps) {
        score = 6;
        reason = 'Some actionable content provided';
        suggestions.push('Add more concrete next steps or examples');
      } else {
        score = 4;
        reason = 'Response lacks actionable content';
        mustDos.push('Provide concrete actions, code, or steps the user can take');
      }
      break;
    }

    case 'progress': {
      if (loopInfo.detected) {
        score = 2;
        reason = 'Loop or repetition detected - conversation is stuck';
        mustDos.push('Break out of the current approach and try something different');
        observations.push(...loopInfo.details);
      } else if (assistantCount > 10) {
        score = 5;
        reason = 'Long conversation may indicate slow progress';
        suggestions.push('Consider a more direct approach');
      } else if (toolStats.successfulCalls > 0) {
        score = 8;
        reason = 'Making forward progress with successful tool usage';
      } else {
        score = 6;
        reason = 'Conversation appears to be progressing';
      }
      break;
    }

    case 'errorHandling': {
      if (toolStats.failedCalls === 0) {
        score = 8;
        reason = 'No errors encountered or all handled gracefully';
      } else if (toolStats.failedCalls > 0 && toolStats.successfulCalls > toolStats.failedCalls) {
        score = 6;
        reason = 'Some errors occurred but conversation continued';
        suggestions.push('Review failed operations for potential fixes');
      } else if (toolStats.failedCalls > toolStats.successfulCalls) {
        score = 3;
        reason = 'More failures than successes indicates poor error handling';
        mustDos.push('Investigate root cause of failures before retrying');
      } else {
        score = 5;
        reason = 'Error handling status unclear';
      }
      observations.push(`${toolStats.failedCalls} failed, ${toolStats.successfulCalls} successful calls`);
      break;
    }

    case 'completeness': {
      // Check for common incompleteness indicators
      const lastContent = lastAssistant?.content.toLowerCase() || '';
      const incompleteIndicators = ['todo', 'later', 'next time', 'will add', 'placeholder', 'not yet', 'tbd', '...'];
      const hasIncomplete = incompleteIndicators.some(ind => lastContent.includes(ind));

      const completeIndicators = ['all done', 'complete', 'finished', 'everything', 'all set'];
      const hasComplete = completeIndicators.some(ind => lastContent.includes(ind));

      if (hasComplete && !hasIncomplete) {
        score = 9;
        reason = 'Explicit completion signals without incompleteness markers';
      } else if (hasIncomplete) {
        score = 4;
        reason = 'Found incompleteness indicators in response';
        mustDos.push('Complete all TODO items and placeholders before finishing');
        observations.push('Response contains placeholder or incomplete markers');
      } else if (toolStats.successfulCalls > 2) {
        score = 7;
        reason = 'Multiple successful tool calls suggest thorough work';
      } else {
        score = 5;
        reason = 'Completeness is unclear';
        suggestions.push('Explicitly list what has been completed');
      }
      break;
    }
  }

  return {
    metric,
    score: Math.max(0, Math.min(10, score)),
    reason,
    mustDos,
    suggestions,
    observations,
  };
}

/**
 * Calculate overall score with weights
 */
function calculateOverallScore(metrics: MetricEvaluation[]): number {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const evaluation of metrics) {
    const weight = METRIC_WEIGHTS[evaluation.metric];
    weightedSum += evaluation.score * weight;
    totalWeight += weight;
  }

  return Math.round((weightedSum / totalWeight) * 10) / 10;
}

/**
 * Determine verdict based on metrics
 */
function determineVerdict(
  metrics: MetricEvaluation[],
  overallScore: number,
  loopDetected: boolean,
  strictMode: boolean
): { verdict: Verdict; reason: string } {
  const threshold = strictMode ? 7 : 5;

  // Critical failures that always result in retry/fail
  const taskCompletion = metrics.find(m => m.metric === 'taskCompletion')?.score || 0;
  const progress = metrics.find(m => m.metric === 'progress')?.score || 0;

  if (loopDetected) {
    return { verdict: 'retry', reason: 'Loop detected - must try a different approach' };
  }

  if (taskCompletion <= 2) {
    return { verdict: 'fail', reason: 'No meaningful task completion detected' };
  }

  if (progress <= 2) {
    return { verdict: 'retry', reason: 'Conversation is stuck and not making progress' };
  }

  if (overallScore >= 8) {
    return { verdict: 'pass', reason: 'High quality execution across all metrics' };
  }

  if (overallScore >= threshold) {
    return { verdict: 'pass', reason: 'Acceptable quality with room for improvement' };
  }

  if (overallScore >= 4) {
    return { verdict: 'retry', reason: 'Below threshold - retry with improvements' };
  }

  return { verdict: 'fail', reason: 'Quality too low across multiple metrics' };
}

/**
 * Generate conversation summary
 */
function generateSummary(messages: Message[], toolStats: ReturnType<typeof analyzeToolUsage>): string {
  const userCount = messages.filter(m => m.role === 'user').length;
  const assistantCount = messages.filter(m => m.role === 'assistant').length;

  return `Conversation with ${userCount} user message(s), ${assistantCount} assistant response(s), and ${toolStats.totalCalls} tool call(s) (${toolStats.successfulCalls} successful, ${toolStats.failedCalls} failed). Tools used: ${toolStats.toolsUsed.join(', ') || 'none'}.`;
}

/**
 * The main judge tool
 */
export const judgeConversation = tool({
  description: `Evaluate an AI conversation across 10 quality metrics to ensure the AI is making real progress and completing user intent.

USE THIS TOOL FREQUENTLY in agentic loops to:
- Verify the AI is on track before moving to the next step
- Catch loops, stuck states, or regressions early
- Ensure task completion before declaring success
- Get actionable must-dos and improvement suggestions

The 10 metrics evaluated:
1. Task Completion - Did the AI complete what was asked?
2. Accuracy - Are responses correct and error-free?
3. Relevance - Are responses on-topic?
4. Clarity - Are responses clear and understandable?
5. Efficiency - Is the AI being concise?
6. User Intent Alignment - Does the AI understand the user?
7. Actionability - Are outputs usable?
8. Progress - Is the conversation moving forward?
9. Error Handling - Are errors handled gracefully?
10. Completeness - Are all aspects addressed?

Returns a verdict (pass/retry/fail) with specific must-dos for any issues.`,
  inputSchema: jsonSchema<JudgeInput>({
    type: 'object',
    properties: {
      messages: {
        type: 'array',
        description: 'Array of AI SDK messages to evaluate. Each message should have role and content.',
        items: {
          type: 'object',
          properties: {
            role: {
              type: 'string',
              enum: ['user', 'assistant', 'system', 'tool'],
              description: 'Message role',
            },
            content: {
              type: 'string',
              description: 'Message content',
            },
            toolCalls: {
              type: 'array',
              description: 'Optional tool calls made by assistant',
              items: {
                type: 'object',
                properties: {
                  toolName: { type: 'string' },
                  args: { type: 'object' },
                },
              },
            },
            toolResults: {
              type: 'array',
              description: 'Optional tool results',
              items: {
                type: 'object',
                properties: {
                  toolName: { type: 'string' },
                  result: {},
                },
              },
            },
          },
          required: ['role', 'content'],
        },
      },
      originalUserRequest: {
        type: 'string',
        description: 'Optional: The original user request if different from first message',
      },
      context: {
        type: 'string',
        description: 'Optional: Additional context about what the conversation should accomplish',
      },
      strictMode: {
        type: 'boolean',
        description: 'Optional: If true, requires higher scores to pass (default: false)',
      },
    },
    required: ['messages'],
    additionalProperties: false,
  }),
  async execute(input: JudgeInput): Promise<JudgeResult> {
    const { messages, originalUserRequest, context: _context, strictMode = false } = input;

    if (!messages || messages.length === 0) {
      return {
        overallScore: 0,
        verdict: 'fail',
        verdictReason: 'No messages provided to evaluate',
        metrics: [],
        criticalIssues: ['No messages to evaluate'],
        mustDos: ['Provide messages to evaluate'],
        suggestions: [],
        nextSteps: ['Call this tool with actual conversation messages'],
        loopDetected: false,
        conversationSummary: 'Empty conversation',
      };
    }

    const userRequest = extractUserRequest(messages, originalUserRequest);
    const loopInfo = detectLoops(messages);
    const toolStats = analyzeToolUsage(messages);

    // Evaluate all metrics
    const metrics = EVALUATION_METRICS.map(metric =>
      evaluateMetric(metric, messages, userRequest, loopInfo, toolStats)
    );

    const overallScore = calculateOverallScore(metrics);
    const { verdict, reason: verdictReason } = determineVerdict(metrics, overallScore, loopInfo.detected, strictMode);

    // Aggregate must-dos and suggestions
    const allMustDos = metrics.flatMap(m => m.mustDos);
    const allSuggestions = metrics.flatMap(m => m.suggestions);

    // Identify critical issues (metrics with score <= 3)
    const criticalIssues = metrics
      .filter(m => m.score <= 3)
      .map(m => `${m.metric}: ${m.reason}`);

    // Generate next steps based on verdict
    const nextSteps: string[] = [];
    if (verdict === 'pass') {
      nextSteps.push('Proceed to the next task or confirm completion with the user');
    } else if (verdict === 'retry') {
      nextSteps.push('Address the must-dos listed above');
      nextSteps.push('Try a different approach if stuck');
      if (loopInfo.detected) {
        nextSteps.push('Break out of the current pattern - do something different');
      }
    } else {
      nextSteps.push('Re-read the original user request');
      nextSteps.push('Start fresh with a clear plan');
      nextSteps.push('Focus on actually completing the task, not just responding');
    }

    return {
      overallScore,
      verdict,
      verdictReason,
      metrics,
      criticalIssues,
      mustDos: [...new Set(allMustDos)], // Deduplicate
      suggestions: [...new Set(allSuggestions)],
      nextSteps,
      loopDetected: loopInfo.detected,
      conversationSummary: generateSummary(messages, toolStats),
    };
  },
});

export default judgeConversation;
