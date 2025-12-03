export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  toolCalls?: ToolCallInfo[];
}

export interface ToolCallInfo {
  id: string;
  toolName: string;
  parameters: Record<string, unknown>;
  result?: unknown;
  status?: 'pending' | 'success' | 'error';
  error?: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface ToolUsageStats {
  packageName: string;
  callCount: number;
  lastCalledAt: Date;
}

export type SSEEvent =
  | { type: 'chunk'; data: { text: string } }
  | { type: 'tool-call'; data: ToolCallInfo }
  | { type: 'complete'; data: { tokenUsage?: TokenUsage } }
  | { type: 'error'; data: { message: string } };
