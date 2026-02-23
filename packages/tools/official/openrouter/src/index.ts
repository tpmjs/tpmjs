/**
 * @tpmjs/tools-openrouter — OpenRouter API Tools for AI Agents
 *
 * Complete coverage of the OpenRouter API: chat completions, embeddings,
 * model discovery, API key management, credits, analytics, and guardrails.
 *
 * @requires OPENROUTER_API_KEY environment variable
 */

import { jsonSchema, tool } from 'ai';

// =============================================================================
// INFRASTRUCTURE
// =============================================================================

const BASE_URL = 'https://openrouter.ai/api/v1';

function resolveApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OPENROUTER_API_KEY environment variable is required. Get yours at https://openrouter.ai/keys');
  return key;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${resolveApiKey()}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.OPENROUTER_REFERER || 'https://tpmjs.com',
    'X-Title': process.env.OPENROUTER_TITLE || 'TPMJS Agent',
  };
}

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const init: RequestInit = { method, headers: headers() };
  if (body !== undefined) init.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, init);

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`OpenRouter API ${res.status}: ${text}`);
  }

  if (res.status === 204) return { success: true } as T;
  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

function qs(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

// =============================================================================
// OUTPUT TYPES
// =============================================================================

export interface ChatCompletionResponse {
  id: string;
  provider: string;
  model: string;
  object: string;
  created: number;
  choices: Array<{
    index: number;
    message: { role: string; content: string | null; tool_calls?: unknown[] };
    finish_reason: string | null;
  }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export interface EmbeddingResponse {
  object: string;
  data: Array<{ object: string; embedding: number[]; index: number }>;
  model: string;
  usage: { prompt_tokens: number; total_tokens: number };
}

export interface Model {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing: Record<string, string>;
  architecture?: Record<string, unknown>;
  top_provider?: Record<string, unknown>;
  supported_parameters?: string[];
}

export interface ApiKeyInfo {
  hash: string;
  label?: string;
  name?: string;
  disabled: boolean;
  limit?: number;
  limit_remaining?: number;
  limit_reset?: string;
  usage: number;
  created_at: string;
  updated_at?: string;
}

export interface Guardrail {
  id: string;
  name: string;
  description?: string;
  [key: string]: unknown;
}

export interface SuccessResult {
  success: boolean;
}

// =============================================================================
// CHAT & AI
// =============================================================================

export interface ChatCompletionInput {
  model: string;
  messages: Array<{ role: string; content: unknown; name?: string }>;
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stop?: string[];
  frequency_penalty?: number;
  presence_penalty?: number;
  seed?: number;
  response_format?: { type: string };
  tools?: Array<{ type: string; function: { name: string; description?: string; parameters?: unknown } }>;
  tool_choice?: unknown;
  provider?: Record<string, unknown>;
}

export const chatCompletion = tool({
  description: 'Send a chat completion request to any model via OpenRouter. Supports 400+ models with automatic fallbacks and cost optimization.',
  inputSchema: jsonSchema<ChatCompletionInput>({
    type: 'object',
    properties: {
      model: { type: 'string', description: 'Model identifier (e.g. "openai/gpt-4o", "anthropic/claude-sonnet-4-5-20250514")' },
      messages: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            role: { type: 'string', description: 'Message role: system, user, or assistant' },
            content: { description: 'Message content — string or array of content parts' },
            name: { type: 'string', description: 'Optional author name' },
          },
          required: ['role', 'content'],
        },
        description: 'Array of chat messages',
      },
      stream: { type: 'boolean', description: 'Enable streaming via SSE (default false)' },
      temperature: { type: 'number', description: 'Sampling temperature 0-2 (default 1)' },
      top_p: { type: 'number', description: 'Nucleus sampling 0-1 (default 1)' },
      max_tokens: { type: 'integer', description: 'Maximum tokens to generate' },
      stop: { type: 'array', items: { type: 'string' }, description: 'Stop sequences' },
      frequency_penalty: { type: 'number', description: 'Frequency penalty -2 to 2' },
      presence_penalty: { type: 'number', description: 'Presence penalty -2 to 2' },
      seed: { type: 'integer', description: 'Seed for reproducibility' },
      response_format: {
        type: 'object',
        properties: { type: { type: 'string', description: '"json_object" or "text"' } },
        description: 'Response format constraint',
      },
      tools: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            function: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                parameters: { description: 'JSON Schema for function parameters' },
              },
              required: ['name'],
            },
          },
          required: ['type', 'function'],
        },
        description: 'Tool/function definitions',
      },
      tool_choice: { description: 'Tool choice strategy: "auto", "none", "required", or specific tool' },
      provider: { type: 'object', description: 'Provider routing and fallback configuration' },
    },
    required: ['model', 'messages'],
    additionalProperties: false,
  }),
  async execute(input: ChatCompletionInput): Promise<ChatCompletionResponse> {
    if (!input.model) throw new Error('model is required');
    if (!input.messages?.length) throw new Error('messages array is required and must not be empty');

    const body: Record<string, unknown> = { model: input.model, messages: input.messages };
    if (input.stream !== undefined) body.stream = input.stream;
    if (input.temperature !== undefined) body.temperature = input.temperature;
    if (input.top_p !== undefined) body.top_p = input.top_p;
    if (input.max_tokens !== undefined) body.max_tokens = input.max_tokens;
    if (input.stop) body.stop = input.stop;
    if (input.frequency_penalty !== undefined) body.frequency_penalty = input.frequency_penalty;
    if (input.presence_penalty !== undefined) body.presence_penalty = input.presence_penalty;
    if (input.seed !== undefined) body.seed = input.seed;
    if (input.response_format) body.response_format = input.response_format;
    if (input.tools) body.tools = input.tools;
    if (input.tool_choice !== undefined) body.tool_choice = input.tool_choice;
    if (input.provider) body.provider = input.provider;

    return api<ChatCompletionResponse>('POST', '/chat/completions', body);
  },
});

// -----------------------------------------------------------------------------

export interface CreateResponseInput {
  model: string;
  input: unknown;
  stream?: boolean;
  temperature?: number;
  max_output_tokens?: number;
  tools?: unknown[];
  instructions?: string;
}

export const createResponse = tool({
  description: 'Create a response using the OpenRouter Responses API (beta). Alternative to chat completions with a simpler interface.',
  inputSchema: jsonSchema<CreateResponseInput>({
    type: 'object',
    properties: {
      model: { type: 'string', description: 'Model identifier' },
      input: { description: 'Input text (string) or array of input items' },
      stream: { type: 'boolean', description: 'Enable streaming' },
      temperature: { type: 'number', description: 'Sampling temperature 0-2' },
      max_output_tokens: { type: 'integer', description: 'Maximum output tokens' },
      tools: { type: 'array', description: 'Tool definitions' },
      instructions: { type: 'string', description: 'System-level instructions' },
    },
    required: ['model', 'input'],
    additionalProperties: false,
  }),
  async execute(input: CreateResponseInput): Promise<unknown> {
    if (!input.model) throw new Error('model is required');
    const body: Record<string, unknown> = { model: input.model, input: input.input };
    if (input.stream !== undefined) body.stream = input.stream;
    if (input.temperature !== undefined) body.temperature = input.temperature;
    if (input.max_output_tokens !== undefined) body.max_output_tokens = input.max_output_tokens;
    if (input.tools) body.tools = input.tools;
    if (input.instructions) body.instructions = input.instructions;
    return api('POST', '/responses', body);
  },
});

// -----------------------------------------------------------------------------

export interface CreateEmbeddingInput {
  model: string;
  input: string | string[];
}

export const createEmbedding = tool({
  description: 'Generate vector embeddings for text input. Supports single strings or arrays of strings.',
  inputSchema: jsonSchema<CreateEmbeddingInput>({
    type: 'object',
    properties: {
      model: { type: 'string', description: 'Embedding model identifier (e.g. "openai/text-embedding-3-small")' },
      input: { description: 'Text to embed — a single string or array of strings' },
    },
    required: ['model', 'input'],
    additionalProperties: false,
  }),
  async execute(input: CreateEmbeddingInput): Promise<EmbeddingResponse> {
    if (!input.model) throw new Error('model is required');
    if (!input.input) throw new Error('input is required');
    return api<EmbeddingResponse>('POST', '/embeddings', { model: input.model, input: input.input });
  },
});

// =============================================================================
// MODELS & DISCOVERY
// =============================================================================

export const listModels = tool({
  description: 'List all available models on OpenRouter with pricing, context length, and supported parameters.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<{ data: Model[] }> {
    return api<{ data: Model[] }>('GET', '/models');
  },
});

export const countModels = tool({
  description: 'Get the total count of available models on OpenRouter.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<unknown> {
    return api('GET', '/models/count');
  },
});

export const listUserModels = tool({
  description: "List models filtered by the authenticated user's preferences and settings.",
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<{ data: Model[] }> {
    return api<{ data: Model[] }>('GET', '/models/user');
  },
});

export const listEmbeddingModels = tool({
  description: 'List all available embedding models on OpenRouter.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<{ data: Model[] }> {
    return api<{ data: Model[] }>('GET', '/embeddings/models');
  },
});

export const listProviders = tool({
  description: 'List all providers available on OpenRouter (e.g. OpenAI, Anthropic, Google, etc.).',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<unknown> {
    return api('GET', '/providers');
  },
});

// -----------------------------------------------------------------------------

export interface ListEndpointsInput {
  model: string;
}

export const listEndpoints = tool({
  description: 'List all available endpoints (providers) for a specific model, with pricing and context details.',
  inputSchema: jsonSchema<ListEndpointsInput>({
    type: 'object',
    properties: {
      model: { type: 'string', description: 'Model identifier (e.g. "openai/gpt-4o")' },
    },
    required: ['model'],
    additionalProperties: false,
  }),
  async execute(input: ListEndpointsInput): Promise<unknown> {
    if (!input.model) throw new Error('model is required');
    return api('GET', `/endpoints${qs({ model: input.model })}`);
  },
});

// -----------------------------------------------------------------------------

export interface PreviewZdrInput {
  model?: string;
}

export const previewZdr = tool({
  description: 'Preview the impact of Zero Data Retention (ZDR) on the available endpoints for a model.',
  inputSchema: jsonSchema<PreviewZdrInput>({
    type: 'object',
    properties: {
      model: { type: 'string', description: 'Model identifier to check ZDR impact for' },
    },
    additionalProperties: false,
  }),
  async execute(input: PreviewZdrInput): Promise<unknown> {
    return api('GET', `/endpoints/zdr${qs({ model: input.model })}`);
  },
});

// =============================================================================
// ACCOUNT
// =============================================================================

export const getCredits = tool({
  description: 'Get remaining credits and usage information for the authenticated OpenRouter account.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<unknown> {
    return api('GET', '/credits');
  },
});

// -----------------------------------------------------------------------------

export interface CreateCoinbaseChargeInput {
  amount: number;
}

export const createCoinbaseCharge = tool({
  description: 'Create a Coinbase Commerce charge for adding credits via cryptocurrency payment.',
  inputSchema: jsonSchema<CreateCoinbaseChargeInput>({
    type: 'object',
    properties: {
      amount: { type: 'number', description: 'Amount in USD to charge' },
    },
    required: ['amount'],
    additionalProperties: false,
  }),
  async execute(input: CreateCoinbaseChargeInput): Promise<unknown> {
    if (!input.amount || input.amount <= 0) throw new Error('amount must be a positive number');
    return api('POST', '/credits/coinbase', { amount: input.amount });
  },
});

// -----------------------------------------------------------------------------

export const getUserActivity = tool({
  description: 'Get user activity grouped by endpoint. Shows API usage analytics.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<unknown> {
    return api('GET', '/analytics/user/activity');
  },
});

// -----------------------------------------------------------------------------

export interface GetGenerationInput {
  id: string;
}

export const getGeneration = tool({
  description: 'Get request and usage metadata for a specific generation by its ID.',
  inputSchema: jsonSchema<GetGenerationInput>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Generation ID (returned in chat completion responses)' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: GetGenerationInput): Promise<unknown> {
    if (!input.id) throw new Error('id is required');
    return api('GET', `/generations/${encodeURIComponent(input.id)}`);
  },
});

// =============================================================================
// API KEYS
// =============================================================================

export interface ListApiKeysInput {
  offset?: number;
  limit?: number;
}

export const listApiKeys = tool({
  description: 'List all API keys for the authenticated OpenRouter account.',
  inputSchema: jsonSchema<ListApiKeysInput>({
    type: 'object',
    properties: {
      offset: { type: 'integer', description: 'Pagination offset (default 0)' },
      limit: { type: 'integer', description: 'Maximum number of keys to return' },
    },
    additionalProperties: false,
  }),
  async execute(input: ListApiKeysInput): Promise<{ data: ApiKeyInfo[] }> {
    return api<{ data: ApiKeyInfo[] }>('GET', `/keys${qs({ offset: input.offset, limit: input.limit })}`);
  },
});

// -----------------------------------------------------------------------------

export interface CreateApiKeyInput {
  name: string;
  limit?: number;
  disabled?: boolean;
  limit_reset?: string;
}

export const createApiKey = tool({
  description: 'Create a new OpenRouter API key with optional credit limit and reset schedule.',
  inputSchema: jsonSchema<CreateApiKeyInput>({
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Name/label for the API key' },
      limit: { type: 'number', description: 'Optional credit limit for this key' },
      disabled: { type: 'boolean', description: 'Create in disabled state (default false)' },
      limit_reset: { type: 'string', description: 'Limit reset schedule: "daily", "weekly", or "monthly"' },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute(input: CreateApiKeyInput): Promise<unknown> {
    if (!input.name) throw new Error('name is required');
    const body: Record<string, unknown> = { name: input.name };
    if (input.limit !== undefined) body.limit = input.limit;
    if (input.disabled !== undefined) body.disabled = input.disabled;
    if (input.limit_reset) body.limit_reset = input.limit_reset;
    return api('POST', '/keys', body);
  },
});

// -----------------------------------------------------------------------------

export interface GetApiKeyInput {
  hash: string;
}

export const getApiKey = tool({
  description: 'Get details of a specific API key including usage, limits, and status.',
  inputSchema: jsonSchema<GetApiKeyInput>({
    type: 'object',
    properties: {
      hash: { type: 'string', description: 'The API key hash identifier' },
    },
    required: ['hash'],
    additionalProperties: false,
  }),
  async execute(input: GetApiKeyInput): Promise<ApiKeyInfo> {
    if (!input.hash) throw new Error('hash is required');
    return api<ApiKeyInfo>('GET', `/keys/${encodeURIComponent(input.hash)}`);
  },
});

// -----------------------------------------------------------------------------

export const getCurrentApiKey = tool({
  description: 'Get details of the currently authenticated API key.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<ApiKeyInfo> {
    return api<ApiKeyInfo>('GET', '/keys/current');
  },
});

// -----------------------------------------------------------------------------

export interface UpdateApiKeyInput {
  hash: string;
  name?: string;
  limit?: number;
  disabled?: boolean;
  limit_reset?: string;
}

export const updateApiKey = tool({
  description: "Update an existing API key's name, credit limit, disabled status, or reset schedule.",
  inputSchema: jsonSchema<UpdateApiKeyInput>({
    type: 'object',
    properties: {
      hash: { type: 'string', description: 'The API key hash identifier' },
      name: { type: 'string', description: 'New name for the key' },
      limit: { type: 'number', description: 'New credit limit' },
      disabled: { type: 'boolean', description: 'Enable or disable the key' },
      limit_reset: { type: 'string', description: 'Limit reset schedule: "daily", "weekly", or "monthly"' },
    },
    required: ['hash'],
    additionalProperties: false,
  }),
  async execute(input: UpdateApiKeyInput): Promise<ApiKeyInfo> {
    if (!input.hash) throw new Error('hash is required');
    const body: Record<string, unknown> = {};
    if (input.name !== undefined) body.name = input.name;
    if (input.limit !== undefined) body.limit = input.limit;
    if (input.disabled !== undefined) body.disabled = input.disabled;
    if (input.limit_reset !== undefined) body.limit_reset = input.limit_reset;
    return api<ApiKeyInfo>('PATCH', `/keys/${encodeURIComponent(input.hash)}`, body);
  },
});

// -----------------------------------------------------------------------------

export interface DeleteApiKeyInput {
  hash: string;
}

export const deleteApiKey = tool({
  description: 'Permanently delete an API key by its hash.',
  inputSchema: jsonSchema<DeleteApiKeyInput>({
    type: 'object',
    properties: {
      hash: { type: 'string', description: 'The API key hash identifier to delete' },
    },
    required: ['hash'],
    additionalProperties: false,
  }),
  async execute(input: DeleteApiKeyInput): Promise<SuccessResult> {
    if (!input.hash) throw new Error('hash is required');
    return api<SuccessResult>('DELETE', `/keys/${encodeURIComponent(input.hash)}`);
  },
});

// =============================================================================
// GUARDRAILS
// =============================================================================

export const listGuardrails = tool({
  description: 'List all guardrail policies in the account.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<{ data: Guardrail[] }> {
    return api<{ data: Guardrail[] }>('GET', '/guardrails');
  },
});

// -----------------------------------------------------------------------------

export interface CreateGuardrailInput {
  name: string;
  description?: string;
  config?: Record<string, unknown>;
}

export const createGuardrail = tool({
  description: 'Create a new guardrail policy to enforce content and usage rules.',
  inputSchema: jsonSchema<CreateGuardrailInput>({
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Name for the guardrail' },
      description: { type: 'string', description: 'Description of what this guardrail enforces' },
      config: { type: 'object', description: 'Guardrail configuration object' },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute(input: CreateGuardrailInput): Promise<Guardrail> {
    if (!input.name) throw new Error('name is required');
    const body: Record<string, unknown> = { name: input.name };
    if (input.description) body.description = input.description;
    if (input.config) body.config = input.config;
    return api<Guardrail>('POST', '/guardrails', body);
  },
});

// -----------------------------------------------------------------------------

export interface GetGuardrailInput {
  id: string;
}

export const getGuardrail = tool({
  description: 'Get details of a specific guardrail by ID.',
  inputSchema: jsonSchema<GetGuardrailInput>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Guardrail ID' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: GetGuardrailInput): Promise<Guardrail> {
    if (!input.id) throw new Error('id is required');
    return api<Guardrail>('GET', `/guardrails/${encodeURIComponent(input.id)}`);
  },
});

// -----------------------------------------------------------------------------

export interface UpdateGuardrailInput {
  id: string;
  name?: string;
  description?: string;
  config?: Record<string, unknown>;
}

export const updateGuardrail = tool({
  description: "Update an existing guardrail's name, description, or configuration.",
  inputSchema: jsonSchema<UpdateGuardrailInput>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Guardrail ID' },
      name: { type: 'string', description: 'New name' },
      description: { type: 'string', description: 'New description' },
      config: { type: 'object', description: 'New configuration object' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: UpdateGuardrailInput): Promise<Guardrail> {
    if (!input.id) throw new Error('id is required');
    const body: Record<string, unknown> = {};
    if (input.name !== undefined) body.name = input.name;
    if (input.description !== undefined) body.description = input.description;
    if (input.config !== undefined) body.config = input.config;
    return api<Guardrail>('PATCH', `/guardrails/${encodeURIComponent(input.id)}`, body);
  },
});

// -----------------------------------------------------------------------------

export interface DeleteGuardrailInput {
  id: string;
}

export const deleteGuardrail = tool({
  description: 'Delete a guardrail by ID.',
  inputSchema: jsonSchema<DeleteGuardrailInput>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Guardrail ID to delete' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: DeleteGuardrailInput): Promise<SuccessResult> {
    if (!input.id) throw new Error('id is required');
    return api<SuccessResult>('DELETE', `/guardrails/${encodeURIComponent(input.id)}`);
  },
});

// -----------------------------------------------------------------------------

export const listGuardrailKeyAssignments = tool({
  description: 'List all API key assignments across all guardrails.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<unknown> {
    return api('GET', '/guardrails/keys/assignments');
  },
});

export const listGuardrailMemberAssignments = tool({
  description: 'List all member assignments across all guardrails.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<unknown> {
    return api('GET', '/guardrails/members/assignments');
  },
});

// -----------------------------------------------------------------------------

export interface GuardrailIdInput {
  id: string;
}

export const getGuardrailKeys = tool({
  description: 'List API key assignments for a specific guardrail.',
  inputSchema: jsonSchema<GuardrailIdInput>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Guardrail ID' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: GuardrailIdInput): Promise<unknown> {
    if (!input.id) throw new Error('id is required');
    return api('GET', `/guardrails/${encodeURIComponent(input.id)}/keys`);
  },
});

// -----------------------------------------------------------------------------

export interface AssignGuardrailKeysInput {
  id: string;
  key_hashes: string[];
}

export const assignGuardrailKeys = tool({
  description: 'Bulk assign API keys to a guardrail by their hashes.',
  inputSchema: jsonSchema<AssignGuardrailKeysInput>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Guardrail ID' },
      key_hashes: { type: 'array', items: { type: 'string' }, description: 'Array of API key hashes to assign' },
    },
    required: ['id', 'key_hashes'],
    additionalProperties: false,
  }),
  async execute(input: AssignGuardrailKeysInput): Promise<unknown> {
    if (!input.id) throw new Error('id is required');
    if (!input.key_hashes?.length) throw new Error('key_hashes must be a non-empty array');
    return api('POST', `/guardrails/${encodeURIComponent(input.id)}/keys/assign`, { key_hashes: input.key_hashes });
  },
});

// -----------------------------------------------------------------------------

export const getGuardrailMembers = tool({
  description: 'List member assignments for a specific guardrail.',
  inputSchema: jsonSchema<GuardrailIdInput>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Guardrail ID' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: GuardrailIdInput): Promise<unknown> {
    if (!input.id) throw new Error('id is required');
    return api('GET', `/guardrails/${encodeURIComponent(input.id)}/members`);
  },
});

// -----------------------------------------------------------------------------

export interface AssignGuardrailMembersInput {
  id: string;
  user_ids: string[];
}

export const assignGuardrailMembers = tool({
  description: 'Bulk assign members to a guardrail by their user IDs.',
  inputSchema: jsonSchema<AssignGuardrailMembersInput>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Guardrail ID' },
      user_ids: { type: 'array', items: { type: 'string' }, description: 'Array of user IDs to assign' },
    },
    required: ['id', 'user_ids'],
    additionalProperties: false,
  }),
  async execute(input: AssignGuardrailMembersInput): Promise<unknown> {
    if (!input.id) throw new Error('id is required');
    if (!input.user_ids?.length) throw new Error('user_ids must be a non-empty array');
    return api('POST', `/guardrails/${encodeURIComponent(input.id)}/members/assign`, { user_ids: input.user_ids });
  },
});

// -----------------------------------------------------------------------------

export interface UnassignGuardrailKeysInput {
  id: string;
  key_hashes: string[];
}

export const unassignGuardrailKeys = tool({
  description: 'Bulk unassign API keys from a guardrail.',
  inputSchema: jsonSchema<UnassignGuardrailKeysInput>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Guardrail ID' },
      key_hashes: { type: 'array', items: { type: 'string' }, description: 'Array of API key hashes to unassign' },
    },
    required: ['id', 'key_hashes'],
    additionalProperties: false,
  }),
  async execute(input: UnassignGuardrailKeysInput): Promise<unknown> {
    if (!input.id) throw new Error('id is required');
    if (!input.key_hashes?.length) throw new Error('key_hashes must be a non-empty array');
    return api('POST', `/guardrails/${encodeURIComponent(input.id)}/keys/unassign`, { key_hashes: input.key_hashes });
  },
});

// -----------------------------------------------------------------------------

export interface UnassignGuardrailMembersInput {
  id: string;
  user_ids: string[];
}

export const unassignGuardrailMembers = tool({
  description: 'Bulk unassign members from a guardrail.',
  inputSchema: jsonSchema<UnassignGuardrailMembersInput>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Guardrail ID' },
      user_ids: { type: 'array', items: { type: 'string' }, description: 'Array of user IDs to unassign' },
    },
    required: ['id', 'user_ids'],
    additionalProperties: false,
  }),
  async execute(input: UnassignGuardrailMembersInput): Promise<unknown> {
    if (!input.id) throw new Error('id is required');
    if (!input.user_ids?.length) throw new Error('user_ids must be a non-empty array');
    return api('POST', `/guardrails/${encodeURIComponent(input.id)}/members/unassign`, { user_ids: input.user_ids });
  },
});

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default {
  // Chat & AI
  chatCompletion,
  createResponse,
  createEmbedding,
  // Models & Discovery
  listModels,
  countModels,
  listUserModels,
  listEmbeddingModels,
  listProviders,
  listEndpoints,
  previewZdr,
  // Account
  getCredits,
  createCoinbaseCharge,
  getUserActivity,
  getGeneration,
  // API Keys
  listApiKeys,
  createApiKey,
  getApiKey,
  getCurrentApiKey,
  updateApiKey,
  deleteApiKey,
  // Guardrails
  listGuardrails,
  createGuardrail,
  getGuardrail,
  updateGuardrail,
  deleteGuardrail,
  listGuardrailKeyAssignments,
  listGuardrailMemberAssignments,
  getGuardrailKeys,
  assignGuardrailKeys,
  getGuardrailMembers,
  assignGuardrailMembers,
  unassignGuardrailKeys,
  unassignGuardrailMembers,
};
