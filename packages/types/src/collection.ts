import { z } from 'zod';

import { ExecutorTypeSchema } from './executor';

// Regex for valid collection names: letters, numbers, spaces, hyphens, underscores
const NAME_REGEX = /^[a-zA-Z0-9\s\-_]+$/;

// Executor config for updates (simplified schema that maps to database JSON)
const ExecutorConfigUpdateSchema = z
  .object({
    url: z.string().url(),
    apiKey: z.string().optional(),
  })
  .nullable()
  .optional();

// ============================================================================
// Collection Schemas
// ============================================================================

export const CreateCollectionSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .regex(NAME_REGEX, 'Name can only contain letters, numbers, spaces, hyphens, and underscores'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  isPublic: z.boolean().default(false),
});

export const UpdateCollectionSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .regex(NAME_REGEX, 'Name can only contain letters, numbers, spaces, hyphens, and underscores')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .nullable()
    .optional(),
  isPublic: z.boolean().optional(),
  // Executor configuration
  executorType: ExecutorTypeSchema.nullable().optional(),
  executorConfig: ExecutorConfigUpdateSchema,
  // Tool environment variables
  envVars: z.record(z.string(), z.string()).nullable().optional(),
});

// ============================================================================
// Collection Tool Schemas
// ============================================================================

export const AddToolToCollectionSchema = z.object({
  toolId: z.string().min(1, 'Tool ID is required'),
  note: z.string().max(500, 'Note must be 500 characters or less').optional(),
  position: z.number().int().min(0).optional(),
});

export const UpdateCollectionToolSchema = z.object({
  note: z.string().max(500, 'Note must be 500 characters or less').nullable().optional(),
  position: z.number().int().min(0).optional(),
});

export const ReorderToolsSchema = z.object({
  toolIds: z.array(z.string().min(1)),
});

// ============================================================================
// Bridge Tool Schemas
// ============================================================================

export const AddBridgeToolToCollectionSchema = z.object({
  serverId: z.string().min(1, 'Server ID is required').max(100),
  toolName: z.string().min(1, 'Tool name is required').max(100),
  displayName: z.string().max(100).optional(),
  note: z.string().max(500, 'Note must be 500 characters or less').optional(),
});

export const UpdateCollectionBridgeToolSchema = z.object({
  displayName: z.string().max(100).nullable().optional(),
  note: z.string().max(500, 'Note must be 500 characters or less').nullable().optional(),
});

// ============================================================================
// Clone Schemas
// ============================================================================

export const CloneCollectionSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .regex(NAME_REGEX, 'Name can only contain letters, numbers, spaces, hyphens, and underscores')
    .optional(), // If not provided, will use original name or append "(copy)"
});

// ============================================================================
// Use Case Types (AI-generated workflows)
// ============================================================================

export const UseCaseToolStepSchema = z.object({
  toolName: z.string().describe('Name of the tool being invoked'),
  packageName: z.string().describe('NPM package name containing the tool'),
  purpose: z.string().max(100).describe('Why this tool is called at this step'),
  order: z.number().int().min(1).describe('Execution order (1-based)'),
});

export const UseCaseSchema = z.object({
  id: z.string().describe('Unique identifier for this use case'),
  userPrompt: z
    .string()
    .min(20)
    .max(200)
    .describe('Example user prompt that triggers this workflow'),
  description: z.string().min(30).max(150).describe('Brief description of what this accomplishes'),
  toolSequence: z
    .array(UseCaseToolStepSchema)
    .min(1)
    .max(10)
    .describe('Ordered sequence of tool calls'),
});

export const CollectionUseCasesSchema = z.array(UseCaseSchema).max(6);

export type UseCaseToolStep = z.infer<typeof UseCaseToolStepSchema>;
export type UseCase = z.infer<typeof UseCaseSchema>;
export type CollectionUseCases = z.infer<typeof CollectionUseCasesSchema>;

// ============================================================================
// Response Types (for API responses)
// ============================================================================

export const CollectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().nullable(),
  description: z.string().nullable(),
  isPublic: z.boolean(),
  toolCount: z.number(),
  forkCount: z.number().default(0),
  forkedFromId: z.string().nullable().optional(),
  useCases: CollectionUseCasesSchema.nullable().optional(),
  useCasesGeneratedAt: z.date().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CollectionToolSchema = z.object({
  id: z.string(),
  toolId: z.string(),
  position: z.number(),
  note: z.string().nullable(),
  addedAt: z.date(),
  tool: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    package: z.object({
      id: z.string(),
      npmPackageName: z.string(),
      category: z.string(),
    }),
  }),
});

export const CollectionWithToolsSchema = CollectionSchema.extend({
  tools: z.array(CollectionToolSchema),
});

// ============================================================================
// Type Exports
// ============================================================================

export type CreateCollectionInput = z.infer<typeof CreateCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof UpdateCollectionSchema>;
export type AddToolToCollectionInput = z.infer<typeof AddToolToCollectionSchema>;
export type UpdateCollectionToolInput = z.infer<typeof UpdateCollectionToolSchema>;
export type ReorderToolsInput = z.infer<typeof ReorderToolsSchema>;
export type CloneCollectionInput = z.infer<typeof CloneCollectionSchema>;
export type AddBridgeToolToCollectionInput = z.infer<typeof AddBridgeToolToCollectionSchema>;
export type UpdateCollectionBridgeToolInput = z.infer<typeof UpdateCollectionBridgeToolSchema>;
export type Collection = z.infer<typeof CollectionSchema>;
export type CollectionTool = z.infer<typeof CollectionToolSchema>;
export type CollectionWithTools = z.infer<typeof CollectionWithToolsSchema>;

// ============================================================================
// Constants
// ============================================================================

export const COLLECTION_LIMITS = {
  MAX_COLLECTIONS_PER_USER: 50,
  MAX_TOOLS_PER_COLLECTION: 100,
  MAX_BRIDGE_TOOLS_PER_COLLECTION: 50,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_NOTE_LENGTH: 500,
} as const;
