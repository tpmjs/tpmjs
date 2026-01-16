/**
 * HLLM API Client Tools for TPMJS
 * Manage topologies, sessions, prompts, files, and more.
 *
 * @requires HLLM_API_KEY environment variable (hllm_xxxx_xxx format)
 * @requires HLLM_BASE_URL environment variable (optional, defaults to https://hllm.ai/api)
 */

import { jsonSchema, tool } from 'ai';

const DEFAULT_BASE_URL = 'https://hllm.ai/api';

/**
 * Topology types supported by HLLM
 */
export const TOPOLOGY_TYPES = [
  'single',
  'sequential',
  'parallel',
  'map-reduce',
  'scatter',
  'debate',
  'reflection',
  'consensus',
  'brainstorm',
  'decomposition',
  'rhetorical-triangle',
  'tree-of-thoughts',
  'react',
] as const;

export type TopologyType = (typeof TOPOLOGY_TYPES)[number];

/**
 * Get API configuration from environment variables
 */
function getApiConfig(): { apiKey: string; baseUrl: string } {
  const apiKey = process.env.HLLM_API_KEY;
  const baseUrl = process.env.HLLM_BASE_URL || DEFAULT_BASE_URL;

  if (!apiKey) {
    throw new Error(
      'HLLM_API_KEY environment variable is required. Get your API key from https://hllm.ai/settings/api-keys'
    );
  }

  return { apiKey, baseUrl };
}

/**
 * Make an authenticated request to the HLLM API
 */
async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown
): Promise<T> {
  const { apiKey, baseUrl } = getApiConfig();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    handleApiError(response.status, errorText);
  }

  return response.json() as Promise<T>;
}

/**
 * Handle API errors with specific messages for common HTTP status codes
 */
function handleApiError(status: number, errorText: string): never {
  switch (status) {
    case 400:
      throw new Error(`Bad request: ${errorText}`);
    case 401:
      throw new Error(
        'Authentication failed: Invalid API key. Ensure HLLM_API_KEY is correct.'
      );
    case 403:
      throw new Error(`Access forbidden: ${errorText}`);
    case 404:
      throw new Error(`Resource not found: ${errorText}`);
    case 429:
      throw new Error(`Rate limit exceeded: ${errorText}`);
    case 500:
    case 502:
    case 503:
      throw new Error(`HLLM service error (${status}): ${errorText}`);
    default:
      throw new Error(`HLLM API error: HTTP ${status} - ${errorText}`);
  }
}

// ============================================================================
// Topology Execution
// ============================================================================

export interface ExecuteTopologyInput {
  topology: TopologyType;
  prompt: string;
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: string[];
  sessionId?: string;
}

export interface ExecuteTopologyResult {
  id: string;
  status: string;
  output?: string;
  tokens?: {
    input: number;
    output: number;
    total: number;
  };
  duration?: number;
  steps?: Array<{
    id: string;
    role: string;
    content: string;
  }>;
}

/**
 * Execute a topology with the given configuration.
 */
export const executeTopology = tool({
  description:
    'Execute a topology with streaming SSE response. Supports topology types: single, sequential, parallel, map-reduce, scatter, debate, reflection, consensus, brainstorm, decomposition, rhetorical-triangle, tree-of-thoughts, react.',
  inputSchema: jsonSchema<ExecuteTopologyInput>({
    type: 'object',
    properties: {
      topology: {
        type: 'string',
        enum: [...TOPOLOGY_TYPES],
        description: 'Type of topology to execute.',
      },
      prompt: {
        type: 'string',
        description: 'The prompt to send to the topology.',
      },
      model: {
        type: 'string',
        description: 'Model to use (e.g., "gpt-4", "claude-3-opus"). Uses default if not specified.',
      },
      systemPrompt: {
        type: 'string',
        description: 'System prompt to set the context.',
      },
      temperature: {
        type: 'number',
        description: 'Temperature for response randomness (0-2). Default: 0.7',
      },
      maxTokens: {
        type: 'number',
        description: 'Maximum tokens in response.',
      },
      tools: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tool IDs to make available to the topology.',
      },
      sessionId: {
        type: 'string',
        description: 'Session ID to continue a conversation.',
      },
    },
    required: ['topology', 'prompt'],
    additionalProperties: false,
  }),
  async execute(input: ExecuteTopologyInput): Promise<ExecuteTopologyResult> {
    const body: Record<string, unknown> = {
      topology: input.topology,
      prompt: input.prompt,
    };

    if (input.model) body.model = input.model;
    if (input.systemPrompt) body.systemPrompt = input.systemPrompt;
    if (input.temperature !== undefined) body.temperature = input.temperature;
    if (input.maxTokens) body.maxTokens = input.maxTokens;
    if (input.tools) body.tools = input.tools;
    if (input.sessionId) body.sessionId = input.sessionId;

    return apiRequest<ExecuteTopologyResult>('POST', '/topology/execute', body);
  },
});

// ============================================================================
// Chat Sessions
// ============================================================================

export interface Session {
  id: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

export interface SessionWithMessages extends Session {
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt: string;
  }>;
}

export interface ListSessionsResult {
  sessions: Session[];
  total: number;
}

/**
 * List all chat sessions.
 */
export const listSessions = tool({
  description: 'List all chat sessions for the authenticated user.',
  inputSchema: jsonSchema<{ limit?: number; offset?: number }>({
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of sessions to return. Default: 20',
      },
      offset: {
        type: 'number',
        description: 'Number of sessions to skip. Default: 0',
      },
    },
    additionalProperties: false,
  }),
  async execute(input: { limit?: number; offset?: number }): Promise<ListSessionsResult> {
    const params = new URLSearchParams();
    if (input.limit) params.set('limit', input.limit.toString());
    if (input.offset) params.set('offset', input.offset.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<ListSessionsResult>('GET', `/sessions${query}`, undefined);
  },
});

export interface CreateSessionInput {
  title?: string;
  systemPrompt?: string;
}

/**
 * Create a new chat session.
 */
export const createSession = tool({
  description: 'Create a new chat session with optional initial configuration.',
  inputSchema: jsonSchema<CreateSessionInput>({
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Title for the session.',
      },
      systemPrompt: {
        type: 'string',
        description: 'System prompt for the session.',
      },
    },
    additionalProperties: false,
  }),
  async execute(input: CreateSessionInput): Promise<Session> {
    return apiRequest<Session>('POST', '/sessions', input);
  },
});

/**
 * Get session details.
 */
export const getSession = tool({
  description: 'Get details of a specific chat session including messages.',
  inputSchema: jsonSchema<{ sessionId: string }>({
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: 'The session ID.',
      },
    },
    required: ['sessionId'],
    additionalProperties: false,
  }),
  async execute(input: { sessionId: string }): Promise<SessionWithMessages> {
    return apiRequest<SessionWithMessages>(
      'GET',
      `/sessions/${encodeURIComponent(input.sessionId)}`,
      undefined
    );
  },
});

export interface UpdateSessionInput {
  sessionId: string;
  title?: string;
  systemPrompt?: string;
}

/**
 * Update session properties.
 */
export const updateSession = tool({
  description: 'Update session properties like title or configuration.',
  inputSchema: jsonSchema<UpdateSessionInput>({
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: 'The session ID.',
      },
      title: {
        type: 'string',
        description: 'New title for the session.',
      },
      systemPrompt: {
        type: 'string',
        description: 'New system prompt for the session.',
      },
    },
    required: ['sessionId'],
    additionalProperties: false,
  }),
  async execute(input: UpdateSessionInput): Promise<Session> {
    const { sessionId, ...body } = input;
    return apiRequest<Session>(
      'PATCH',
      `/sessions/${encodeURIComponent(sessionId)}`,
      body
    );
  },
});

/**
 * Delete a chat session.
 */
export const deleteSession = tool({
  description: 'Delete a chat session and all its messages.',
  inputSchema: jsonSchema<{ sessionId: string }>({
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: 'The session ID to delete.',
      },
    },
    required: ['sessionId'],
    additionalProperties: false,
  }),
  async execute(input: { sessionId: string }): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>(
      'DELETE',
      `/sessions/${encodeURIComponent(input.sessionId)}`,
      undefined
    );
  },
});

// ============================================================================
// Session Messages
// ============================================================================

export interface AddMessageInput {
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

/**
 * Add a message to a session.
 */
export const addMessage = tool({
  description: 'Add a message to a chat session.',
  inputSchema: jsonSchema<AddMessageInput>({
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: 'The session ID.',
      },
      role: {
        type: 'string',
        enum: ['user', 'assistant', 'system'],
        description: 'The role of the message sender.',
      },
      content: {
        type: 'string',
        description: 'The message content.',
      },
    },
    required: ['sessionId', 'role', 'content'],
    additionalProperties: false,
  }),
  async execute(input: AddMessageInput): Promise<Message> {
    const { sessionId, ...body } = input;
    return apiRequest<Message>(
      'POST',
      `/sessions/${encodeURIComponent(sessionId)}/messages`,
      body
    );
  },
});

/**
 * Clear all messages from a session.
 */
export const clearMessages = tool({
  description: 'Clear all messages from a chat session.',
  inputSchema: jsonSchema<{ sessionId: string }>({
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: 'The session ID.',
      },
    },
    required: ['sessionId'],
    additionalProperties: false,
  }),
  async execute(input: { sessionId: string }): Promise<{ success: boolean; clearedCount: number }> {
    return apiRequest<{ success: boolean; clearedCount: number }>(
      'DELETE',
      `/sessions/${encodeURIComponent(input.sessionId)}/messages`,
      undefined
    );
  },
});

// ============================================================================
// Prompt Library
// ============================================================================

export interface Prompt {
  id: string;
  name: string;
  content: string;
  description?: string;
  category?: string;
  tags?: string[];
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListPromptsInput {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListPromptsResult {
  prompts: Prompt[];
  total: number;
}

/**
 * List prompts in the library.
 */
export const listPrompts = tool({
  description: 'List all prompts in the prompt library with optional filtering.',
  inputSchema: jsonSchema<ListPromptsInput>({
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: 'Filter by category.',
      },
      search: {
        type: 'string',
        description: 'Search in name and content.',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of prompts to return.',
      },
      offset: {
        type: 'number',
        description: 'Number of prompts to skip.',
      },
    },
    additionalProperties: false,
  }),
  async execute(input: ListPromptsInput): Promise<ListPromptsResult> {
    const params = new URLSearchParams();
    if (input.category) params.set('category', input.category);
    if (input.search) params.set('search', input.search);
    if (input.limit) params.set('limit', input.limit.toString());
    if (input.offset) params.set('offset', input.offset.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<ListPromptsResult>('GET', `/prompts${query}`, undefined);
  },
});

export interface CreatePromptInput {
  name: string;
  content: string;
  description?: string;
  category?: string;
  tags?: string[];
}

/**
 * Create a new prompt.
 */
export const createPrompt = tool({
  description: 'Create a new prompt in the library.',
  inputSchema: jsonSchema<CreatePromptInput>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the prompt.',
      },
      content: {
        type: 'string',
        description: 'The prompt content/template.',
      },
      description: {
        type: 'string',
        description: 'Description of what the prompt does.',
      },
      category: {
        type: 'string',
        description: 'Category for organization.',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tags for filtering.',
      },
    },
    required: ['name', 'content'],
    additionalProperties: false,
  }),
  async execute(input: CreatePromptInput): Promise<Prompt> {
    return apiRequest<Prompt>('POST', '/prompts', input);
  },
});

/**
 * Get prompt details.
 */
export const getPrompt = tool({
  description: 'Get details of a specific prompt.',
  inputSchema: jsonSchema<{ promptId: string }>({
    type: 'object',
    properties: {
      promptId: {
        type: 'string',
        description: 'The prompt ID.',
      },
    },
    required: ['promptId'],
    additionalProperties: false,
  }),
  async execute(input: { promptId: string }): Promise<Prompt> {
    return apiRequest<Prompt>(
      'GET',
      `/prompts/${encodeURIComponent(input.promptId)}`,
      undefined
    );
  },
});

export interface UpdatePromptInput {
  promptId: string;
  name?: string;
  content?: string;
  description?: string;
  category?: string;
  tags?: string[];
}

/**
 * Update a prompt.
 */
export const updatePrompt = tool({
  description: 'Update an existing prompt.',
  inputSchema: jsonSchema<UpdatePromptInput>({
    type: 'object',
    properties: {
      promptId: {
        type: 'string',
        description: 'The prompt ID.',
      },
      name: {
        type: 'string',
        description: 'New name for the prompt.',
      },
      content: {
        type: 'string',
        description: 'New content for the prompt.',
      },
      description: {
        type: 'string',
        description: 'New description.',
      },
      category: {
        type: 'string',
        description: 'New category.',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'New tags.',
      },
    },
    required: ['promptId'],
    additionalProperties: false,
  }),
  async execute(input: UpdatePromptInput): Promise<Prompt> {
    const { promptId, ...body } = input;
    return apiRequest<Prompt>(
      'PATCH',
      `/prompts/${encodeURIComponent(promptId)}`,
      body
    );
  },
});

/**
 * Delete a prompt.
 */
export const deletePrompt = tool({
  description: 'Delete a prompt from the library.',
  inputSchema: jsonSchema<{ promptId: string }>({
    type: 'object',
    properties: {
      promptId: {
        type: 'string',
        description: 'The prompt ID to delete.',
      },
    },
    required: ['promptId'],
    additionalProperties: false,
  }),
  async execute(input: { promptId: string }): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>(
      'DELETE',
      `/prompts/${encodeURIComponent(input.promptId)}`,
      undefined
    );
  },
});

/**
 * Increment prompt usage count.
 */
export const incrementPromptUsage = tool({
  description: 'Increment the usage count for a prompt.',
  inputSchema: jsonSchema<{ promptId: string }>({
    type: 'object',
    properties: {
      promptId: {
        type: 'string',
        description: 'The prompt ID.',
      },
    },
    required: ['promptId'],
    additionalProperties: false,
  }),
  async execute(input: { promptId: string }): Promise<{ usageCount: number }> {
    return apiRequest<{ usageCount: number }>(
      'POST',
      `/prompts/${encodeURIComponent(input.promptId)}/usage`,
      {}
    );
  },
});

// ============================================================================
// User Profile & Stats
// ============================================================================

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  preferences?: Record<string, unknown>;
  createdAt: string;
}

/**
 * Get user profile.
 */
export const getUserProfile = tool({
  description: "Get the current user's profile information.",
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<UserProfile> {
    return apiRequest<UserProfile>('GET', '/user/profile', undefined);
  },
});

export interface UpdateUserProfileInput {
  name?: string;
  avatar?: string;
  preferences?: Record<string, unknown>;
}

/**
 * Update user profile.
 */
export const updateUserProfile = tool({
  description: "Update the current user's profile.",
  inputSchema: jsonSchema<UpdateUserProfileInput>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Display name.',
      },
      avatar: {
        type: 'string',
        description: 'Avatar URL.',
      },
      preferences: {
        type: 'object',
        description: 'User preferences object.',
        additionalProperties: true,
      },
    },
    additionalProperties: false,
  }),
  async execute(input: UpdateUserProfileInput): Promise<UserProfile> {
    return apiRequest<UserProfile>('PATCH', '/user/profile', input);
  },
});

export interface UserStats {
  totalExecutions: number;
  totalTokens: {
    input: number;
    output: number;
  };
  totalSessions: number;
  totalPrompts: number;
  topologyBreakdown: Record<string, number>;
  periodStart: string;
  periodEnd: string;
}

/**
 * Get user stats.
 */
export const getUserStats = tool({
  description: 'Get usage statistics for the current user.',
  inputSchema: jsonSchema<{ period?: 'day' | 'week' | 'month' | 'all' }>({
    type: 'object',
    properties: {
      period: {
        type: 'string',
        enum: ['day', 'week', 'month', 'all'],
        description: 'Time period for stats. Default: month',
      },
    },
    additionalProperties: false,
  }),
  async execute(input: { period?: 'day' | 'week' | 'month' | 'all' }): Promise<UserStats> {
    const query = input.period ? `?period=${input.period}` : '';
    return apiRequest<UserStats>('GET', `/user/stats${query}`, undefined);
  },
});

// ============================================================================
// TPMJS Environment Variables
// ============================================================================

export interface EnvVar {
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListEnvVarsResult {
  envVars: EnvVar[];
}

/**
 * List environment variables.
 */
export const listEnvVars = tool({
  description: 'List all TPMJS environment variables.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<ListEnvVarsResult> {
    return apiRequest<ListEnvVarsResult>('GET', '/env-vars', undefined);
  },
});

export interface SetEnvVarInput {
  key: string;
  value: string;
}

/**
 * Set environment variable.
 */
export const setEnvVar = tool({
  description: 'Set or update a TPMJS environment variable.',
  inputSchema: jsonSchema<SetEnvVarInput>({
    type: 'object',
    properties: {
      key: {
        type: 'string',
        description: 'Variable name.',
      },
      value: {
        type: 'string',
        description: 'Variable value.',
      },
    },
    required: ['key', 'value'],
    additionalProperties: false,
  }),
  async execute(input: SetEnvVarInput): Promise<EnvVar> {
    return apiRequest<EnvVar>('PUT', '/env-vars', input);
  },
});

/**
 * Delete environment variable.
 */
export const deleteEnvVar = tool({
  description: 'Delete a TPMJS environment variable.',
  inputSchema: jsonSchema<{ key: string }>({
    type: 'object',
    properties: {
      key: {
        type: 'string',
        description: 'Variable name to delete.',
      },
    },
    required: ['key'],
    additionalProperties: false,
  }),
  async execute(input: { key: string }): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>(
      'DELETE',
      `/env-vars/${encodeURIComponent(input.key)}`,
      undefined
    );
  },
});

// ============================================================================
// Files
// ============================================================================

export interface FileInfo {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  url: string;
  createdAt: string;
}

export interface UploadFileInput {
  name: string;
  content: string; // Base64 encoded
  mimeType?: string;
}

/**
 * Upload a file.
 */
export const uploadFile = tool({
  description: 'Upload a file for use in topologies.',
  inputSchema: jsonSchema<UploadFileInput>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'File name.',
      },
      content: {
        type: 'string',
        description: 'Base64-encoded file content.',
      },
      mimeType: {
        type: 'string',
        description: 'MIME type of the file.',
      },
    },
    required: ['name', 'content'],
    additionalProperties: false,
  }),
  async execute(input: UploadFileInput): Promise<FileInfo> {
    return apiRequest<FileInfo>('POST', '/files', input);
  },
});

/**
 * Get file metadata.
 */
export const getFile = tool({
  description: 'Get file metadata and download URL.',
  inputSchema: jsonSchema<{ fileId: string }>({
    type: 'object',
    properties: {
      fileId: {
        type: 'string',
        description: 'The file ID.',
      },
    },
    required: ['fileId'],
    additionalProperties: false,
  }),
  async execute(input: { fileId: string }): Promise<FileInfo> {
    return apiRequest<FileInfo>(
      'GET',
      `/files/${encodeURIComponent(input.fileId)}`,
      undefined
    );
  },
});

/**
 * Delete a file.
 */
export const deleteFile = tool({
  description: 'Delete an uploaded file.',
  inputSchema: jsonSchema<{ fileId: string }>({
    type: 'object',
    properties: {
      fileId: {
        type: 'string',
        description: 'The file ID to delete.',
      },
    },
    required: ['fileId'],
    additionalProperties: false,
  }),
  async execute(input: { fileId: string }): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>(
      'DELETE',
      `/files/${encodeURIComponent(input.fileId)}`,
      undefined
    );
  },
});

// ============================================================================
// Models
// ============================================================================

export interface Model {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  inputPricing: number;
  outputPricing: number;
  capabilities: string[];
}

export interface ListModelsResult {
  models: Model[];
}

/**
 * List available models.
 */
export const listModels = tool({
  description: 'List all available AI models.',
  inputSchema: jsonSchema<{ provider?: string }>({
    type: 'object',
    properties: {
      provider: {
        type: 'string',
        description: 'Filter by provider (openai, anthropic, google, etc.).',
      },
    },
    additionalProperties: false,
  }),
  async execute(input: { provider?: string }): Promise<ListModelsResult> {
    const query = input.provider ? `?provider=${encodeURIComponent(input.provider)}` : '';
    return apiRequest<ListModelsResult>('GET', `/models${query}`, undefined);
  },
});

// ============================================================================
// Execution Logs
// ============================================================================

export interface ExecutionLog {
  id: string;
  topologyType: string;
  status: 'success' | 'error' | 'timeout';
  inputTokens: number;
  outputTokens: number;
  duration: number;
  error?: string;
  createdAt: string;
}

export interface GetExecutionLogsInput {
  sessionId?: string;
  limit?: number;
  offset?: number;
}

export interface GetExecutionLogsResult {
  logs: ExecutionLog[];
  total: number;
}

/**
 * Get execution logs.
 */
export const getExecutionLogs = tool({
  description: 'Get execution logs for topology runs.',
  inputSchema: jsonSchema<GetExecutionLogsInput>({
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: 'Filter logs by session ID.',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of logs to return.',
      },
      offset: {
        type: 'number',
        description: 'Number of logs to skip.',
      },
    },
    additionalProperties: false,
  }),
  async execute(input: GetExecutionLogsInput): Promise<GetExecutionLogsResult> {
    const params = new URLSearchParams();
    if (input.sessionId) params.set('sessionId', input.sessionId);
    if (input.limit) params.set('limit', input.limit.toString());
    if (input.offset) params.set('offset', input.offset.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<GetExecutionLogsResult>('GET', `/logs${query}`, undefined);
  },
});

// ============================================================================
// Agent Metrics
// ============================================================================

export interface AgentMetrics {
  totalRequests: number;
  successRate: number;
  averageLatency: number;
  tokenUsage: {
    input: number;
    output: number;
  };
  topologyBreakdown: Record<string, {
    count: number;
    avgLatency: number;
    successRate: number;
  }>;
  periodStart: string;
  periodEnd: string;
}

/**
 * Get agent metrics.
 */
export const getAgentMetrics = tool({
  description: 'Get agent performance metrics.',
  inputSchema: jsonSchema<{ period?: 'hour' | 'day' | 'week' | 'month' }>({
    type: 'object',
    properties: {
      period: {
        type: 'string',
        enum: ['hour', 'day', 'week', 'month'],
        description: 'Time period for metrics. Default: day',
      },
    },
    additionalProperties: false,
  }),
  async execute(input: { period?: 'hour' | 'day' | 'week' | 'month' }): Promise<AgentMetrics> {
    const query = input.period ? `?period=${input.period}` : '';
    return apiRequest<AgentMetrics>('GET', `/metrics${query}`, undefined);
  },
});

// ============================================================================
// TPMJS Tools
// ============================================================================

export interface ToolInfo {
  id: string;
  name: string;
  description: string;
  package: string;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
  }>;
}

export interface ListToolsResult {
  tools: ToolInfo[];
}

/**
 * List TPMJS tools.
 */
export const listTools = tool({
  description: 'List all available TPMJS tools.',
  inputSchema: jsonSchema<{ category?: string }>({
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: 'Filter by category.',
      },
    },
    additionalProperties: false,
  }),
  async execute(input: { category?: string }): Promise<ListToolsResult> {
    const query = input.category ? `?category=${encodeURIComponent(input.category)}` : '';
    return apiRequest<ListToolsResult>('GET', `/tools${query}`, undefined);
  },
});

/**
 * Get tool details.
 */
export const describeTool = tool({
  description: 'Get detailed description of a specific tool.',
  inputSchema: jsonSchema<{ toolId: string }>({
    type: 'object',
    properties: {
      toolId: {
        type: 'string',
        description: 'The tool ID.',
      },
    },
    required: ['toolId'],
    additionalProperties: false,
  }),
  async execute(input: { toolId: string }): Promise<ToolInfo> {
    return apiRequest<ToolInfo>(
      'GET',
      `/tools/${encodeURIComponent(input.toolId)}`,
      undefined
    );
  },
});

export interface ExecuteToolInput {
  toolId: string;
  parameters: Record<string, unknown>;
}

export interface ExecuteToolResult {
  success: boolean;
  result: unknown;
  duration: number;
}

/**
 * Execute a TPMJS tool.
 */
export const executeTool = tool({
  description: 'Execute a TPMJS tool directly.',
  inputSchema: jsonSchema<ExecuteToolInput>({
    type: 'object',
    properties: {
      toolId: {
        type: 'string',
        description: 'The tool ID to execute.',
      },
      parameters: {
        type: 'object',
        description: 'Tool parameters.',
        additionalProperties: true,
      },
    },
    required: ['toolId', 'parameters'],
    additionalProperties: false,
  }),
  async execute(input: ExecuteToolInput): Promise<ExecuteToolResult> {
    return apiRequest<ExecuteToolResult>(
      'POST',
      `/tools/${encodeURIComponent(input.toolId)}/execute`,
      { parameters: input.parameters }
    );
  },
});

// ============================================================================
// Prompt Generation
// ============================================================================

export interface GeneratePromptInput {
  task: string;
  context?: string;
  style?: 'concise' | 'detailed' | 'creative';
}

export interface GeneratePromptResult {
  prompt: string;
  suggestions?: string[];
}

/**
 * Generate a prompt.
 */
export const generatePrompt = tool({
  description: 'Generate a prompt using AI assistance.',
  inputSchema: jsonSchema<GeneratePromptInput>({
    type: 'object',
    properties: {
      task: {
        type: 'string',
        description: 'Description of what the prompt should accomplish.',
      },
      context: {
        type: 'string',
        description: 'Additional context for prompt generation.',
      },
      style: {
        type: 'string',
        enum: ['concise', 'detailed', 'creative'],
        description: 'Style of the generated prompt.',
      },
    },
    required: ['task'],
    additionalProperties: false,
  }),
  async execute(input: GeneratePromptInput): Promise<GeneratePromptResult> {
    return apiRequest<GeneratePromptResult>('POST', '/prompts/generate', input);
  },
});

export interface ImprovePromptInput {
  prompt: string;
  goal?: string;
}

/**
 * Improve an existing prompt.
 */
export const improvePrompt = tool({
  description: 'Improve an existing prompt using AI.',
  inputSchema: jsonSchema<ImprovePromptInput>({
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'The prompt to improve.',
      },
      goal: {
        type: 'string',
        description: 'What improvement to focus on.',
      },
    },
    required: ['prompt'],
    additionalProperties: false,
  }),
  async execute(input: ImprovePromptInput): Promise<GeneratePromptResult> {
    return apiRequest<GeneratePromptResult>('POST', '/prompts/improve', input);
  },
});

// ============================================================================
// Export/Import
// ============================================================================

export interface ExportDataInput {
  include?: ('sessions' | 'prompts' | 'settings' | 'files')[];
}

export interface ExportDataResult {
  data: string; // Base64 encoded
  format: string;
  exportedAt: string;
}

/**
 * Export user data.
 */
export const exportData = tool({
  description: 'Export user data including sessions, prompts, and settings.',
  inputSchema: jsonSchema<ExportDataInput>({
    type: 'object',
    properties: {
      include: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['sessions', 'prompts', 'settings', 'files'],
        },
        description: 'What data to include. Default: all',
      },
    },
    additionalProperties: false,
  }),
  async execute(input: ExportDataInput): Promise<ExportDataResult> {
    return apiRequest<ExportDataResult>('POST', '/export', input);
  },
});

export interface ImportDataInput {
  data: string; // Base64 encoded
  overwrite?: boolean;
}

export interface ImportDataResult {
  success: boolean;
  imported: {
    sessions?: number;
    prompts?: number;
    settings?: boolean;
    files?: number;
  };
}

/**
 * Import data.
 */
export const importData = tool({
  description: 'Import previously exported data.',
  inputSchema: jsonSchema<ImportDataInput>({
    type: 'object',
    properties: {
      data: {
        type: 'string',
        description: 'Base64 encoded export data.',
      },
      overwrite: {
        type: 'boolean',
        description: 'Whether to overwrite existing data. Default: false',
      },
    },
    required: ['data'],
    additionalProperties: false,
  }),
  async execute(input: ImportDataInput): Promise<ImportDataResult> {
    return apiRequest<ImportDataResult>('POST', '/import', input);
  },
});

// ============================================================================
// Public Endpoints
// ============================================================================

export interface HealthResult {
  status: string;
  version: string;
  uptime: number;
}

/**
 * Health check.
 */
export const healthCheck = tool({
  description: 'Check HLLM API health status.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<HealthResult> {
    const { baseUrl } = getApiConfig();
    const response = await fetch(`${baseUrl}/health`);
    return response.json() as Promise<HealthResult>;
  },
});

export interface PublicStats {
  totalUsers: number;
  totalExecutions: number;
  totalTokens: number;
  uptimePercent: number;
}

/**
 * Get public stats.
 */
export const getStats = tool({
  description: 'Get public HLLM statistics.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<PublicStats> {
    const { baseUrl } = getApiConfig();
    const response = await fetch(`${baseUrl}/stats`);
    return response.json() as Promise<PublicStats>;
  },
});

// ============================================================================
// API Keys
// ============================================================================

export interface ApiKey {
  id: string;
  name: string;
  keyHint: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface ListApiKeysResult {
  apiKeys: ApiKey[];
}

/**
 * List API keys.
 */
export const listApiKeys = tool({
  description: 'List all API keys for the authenticated user.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<ListApiKeysResult> {
    return apiRequest<ListApiKeysResult>('GET', '/api-keys', undefined);
  },
});

export interface CreateApiKeyInput {
  name: string;
}

export interface CreateApiKeyResult {
  id: string;
  name: string;
  key: string; // Full key, only shown once
  createdAt: string;
}

/**
 * Create API key.
 */
export const createApiKey = tool({
  description: 'Create a new API key.',
  inputSchema: jsonSchema<CreateApiKeyInput>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name for the API key.',
      },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute(input: CreateApiKeyInput): Promise<CreateApiKeyResult> {
    return apiRequest<CreateApiKeyResult>('POST', '/api-keys', input);
  },
});

/**
 * Delete API key.
 */
export const deleteApiKey = tool({
  description: 'Delete an API key.',
  inputSchema: jsonSchema<{ keyId: string }>({
    type: 'object',
    properties: {
      keyId: {
        type: 'string',
        description: 'The API key ID to delete.',
      },
    },
    required: ['keyId'],
    additionalProperties: false,
  }),
  async execute(input: { keyId: string }): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>(
      'DELETE',
      `/api-keys/${encodeURIComponent(input.keyId)}`,
      undefined
    );
  },
});

// ============================================================================
// Default Export
// ============================================================================

export default {
  // Topology
  executeTopology,
  // Sessions
  listSessions,
  createSession,
  getSession,
  updateSession,
  deleteSession,
  // Messages
  addMessage,
  clearMessages,
  // Prompts
  listPrompts,
  createPrompt,
  getPrompt,
  updatePrompt,
  deletePrompt,
  incrementPromptUsage,
  // User
  getUserProfile,
  updateUserProfile,
  getUserStats,
  // Env Vars
  listEnvVars,
  setEnvVar,
  deleteEnvVar,
  // Files
  uploadFile,
  getFile,
  deleteFile,
  // Models
  listModels,
  // Logs
  getExecutionLogs,
  // Metrics
  getAgentMetrics,
  // Tools
  listTools,
  describeTool,
  executeTool,
  // Prompt Generation
  generatePrompt,
  improvePrompt,
  // Export/Import
  exportData,
  importData,
  // Public
  healthCheck,
  getStats,
  // API Keys
  listApiKeys,
  createApiKey,
  deleteApiKey,
};
