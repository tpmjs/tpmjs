import { z } from 'zod';

// Regex for valid agent UID: lowercase alphanumeric and hyphens
const UID_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

// ============================================================================
// Enums
// ============================================================================

export const AIProviderSchema = z.enum(['OPENAI', 'ANTHROPIC', 'GOOGLE', 'GROQ', 'MISTRAL']);

export const MessageRoleSchema = z.enum(['USER', 'ASSISTANT', 'TOOL', 'SYSTEM']);

export type AIProvider = z.infer<typeof AIProviderSchema>;
export type MessageRole = z.infer<typeof MessageRoleSchema>;

// ============================================================================
// Agent Schemas
// ============================================================================

export const CreateAgentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  uid: z
    .string()
    .min(1, 'UID is required')
    .max(50, 'UID must be 50 characters or less')
    .regex(UID_REGEX, 'UID must be lowercase alphanumeric with hyphens')
    .optional(),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  provider: AIProviderSchema,
  modelId: z.string().min(1, 'Model ID is required').max(100),
  systemPrompt: z.string().max(10000, 'System prompt must be 10,000 characters or less').optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxToolCallsPerTurn: z.number().int().min(1).max(100).default(20),
  maxMessagesInContext: z.number().int().min(1).max(100).default(10),
  isPublic: z.boolean().default(false),
  collectionIds: z.array(z.string()).optional(),
  toolIds: z.array(z.string()).optional(),
});

export const UpdateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  uid: z.string().min(1).max(50).regex(UID_REGEX).optional(),
  description: z.string().max(500).nullable().optional(),
  provider: AIProviderSchema.optional(),
  modelId: z.string().min(1).max(100).optional(),
  systemPrompt: z.string().max(10000).nullable().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxToolCallsPerTurn: z.number().int().min(1).max(100).optional(),
  maxMessagesInContext: z.number().int().min(1).max(100).optional(),
  isPublic: z.boolean().optional(),
});

export const AddCollectionToAgentSchema = z.object({
  collectionId: z.string().min(1, 'Collection ID is required'),
  position: z.number().int().min(0).optional(),
});

export const AddToolToAgentSchema = z.object({
  toolId: z.string().min(1, 'Tool ID is required'),
  position: z.number().int().min(0).optional(),
});

// ============================================================================
// User API Key Schemas
// ============================================================================

export const SUPPORTED_PROVIDERS = ['OPENAI', 'ANTHROPIC', 'GOOGLE', 'GROQ', 'MISTRAL'] as const;

export const AddApiKeySchema = z.object({
  provider: AIProviderSchema,
  apiKey: z.string().min(10, 'API key is required'),
});

export const ApiKeyInfoSchema = z.object({
  provider: AIProviderSchema,
  keyHint: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ============================================================================
// Conversation Schemas
// ============================================================================

export const CreateConversationSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  title: z.string().max(200).optional(),
});

export const SendMessageSchema = z.object({
  message: z.string().min(1, 'Message is required').max(50000, 'Message too long'),
  env: z.record(z.string(), z.string()).optional(),
});

// ============================================================================
// Message Schemas
// ============================================================================

export const ToolCallSchema = z.object({
  id: z.string(),
  name: z.string(),
  arguments: z.string(),
});

export const MessageSchema = z.object({
  id: z.string(),
  role: MessageRoleSchema,
  content: z.string(),
  toolCalls: z.array(ToolCallSchema).nullable(),
  toolCallId: z.string().nullable(),
  toolName: z.string().nullable(),
  toolResult: z.any().nullable(),
  inputTokens: z.number().nullable(),
  outputTokens: z.number().nullable(),
  createdAt: z.date(),
});

// ============================================================================
// Response Types
// ============================================================================

export const AgentSchema = z.object({
  id: z.string(),
  uid: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  provider: AIProviderSchema,
  modelId: z.string(),
  systemPrompt: z.string().nullable(),
  temperature: z.number(),
  maxToolCallsPerTurn: z.number(),
  maxMessagesInContext: z.number(),
  isPublic: z.boolean(),
  toolCount: z.number(),
  collectionCount: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ConversationSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  slug: z.string(),
  title: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  messageCount: z.number().optional(),
});

export const ConversationWithMessagesSchema = ConversationSchema.extend({
  messages: z.array(MessageSchema),
});

// ============================================================================
// Type Exports
// ============================================================================

export type CreateAgentInput = z.infer<typeof CreateAgentSchema>;
export type UpdateAgentInput = z.infer<typeof UpdateAgentSchema>;
export type AddCollectionToAgentInput = z.infer<typeof AddCollectionToAgentSchema>;
export type AddToolToAgentInput = z.infer<typeof AddToolToAgentSchema>;
export type AddApiKeyInput = z.infer<typeof AddApiKeySchema>;
export type ApiKeyInfo = z.infer<typeof ApiKeyInfoSchema>;
export type CreateConversationInput = z.infer<typeof CreateConversationSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type ToolCall = z.infer<typeof ToolCallSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type Agent = z.infer<typeof AgentSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;
export type ConversationWithMessages = z.infer<typeof ConversationWithMessagesSchema>;

// ============================================================================
// Constants
// ============================================================================

export const AGENT_LIMITS = {
  MAX_AGENTS_PER_USER: 20,
  MAX_COLLECTIONS_PER_AGENT: 10,
  MAX_TOOLS_PER_AGENT: 50,
  MAX_SYSTEM_PROMPT_LENGTH: 10000,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_UID_LENGTH: 50,
} as const;

export const CONVERSATION_LIMITS = {
  MAX_CONVERSATIONS_PER_AGENT: 100,
  MAX_MESSAGE_LENGTH: 50000,
  MAX_TITLE_LENGTH: 200,
  MAX_SLUG_LENGTH: 100,
} as const;

// ============================================================================
// Provider Model Mappings
// ============================================================================

export const PROVIDER_MODELS = {
  OPENAI: [
    { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000 },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000 },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', contextWindow: 128000 },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', contextWindow: 16385 },
  ],
  ANTHROPIC: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', contextWindow: 200000 },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', contextWindow: 200000 },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', contextWindow: 200000 },
  ],
  GOOGLE: [
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', contextWindow: 1000000 },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', contextWindow: 1000000 },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', contextWindow: 1000000 },
  ],
  GROQ: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', contextWindow: 131072 },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', contextWindow: 131072 },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', contextWindow: 32768 },
  ],
  MISTRAL: [
    { id: 'mistral-large-latest', name: 'Mistral Large', contextWindow: 128000 },
    { id: 'mistral-small-latest', name: 'Mistral Small', contextWindow: 128000 },
  ],
} as const;

export type ProviderModel = {
  id: string;
  name: string;
  contextWindow: number;
};
