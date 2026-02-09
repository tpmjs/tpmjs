export interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'TOOL';
  content: string;
  toolName?: string;
  toolCallId?: string;
  toolResult?: unknown;
  createdAt?: string;
}

export interface ScenarioRun {
  id: string;
  status: string;
  retryCount: number;
  evaluator: {
    model: string | null;
    verdict: string | null;
    reason: string | null;
  } | null;
  assertions: { passed: string[]; failed: string[] } | null;
  usage: {
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
    executionTimeMs: number | null;
    estimatedCost: number | null;
  } | null;
  timestamps: {
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string | null;
  };
  output?: string;
  errorLog?: string;
  conversation?: Message[];
}
