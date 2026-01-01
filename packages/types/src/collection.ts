import { z } from 'zod';

// Regex for valid collection names: letters, numbers, spaces, hyphens, underscores
const NAME_REGEX = /^[a-zA-Z0-9\s\-_]+$/;

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
// Response Types (for API responses)
// ============================================================================

export const CollectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isPublic: z.boolean(),
  toolCount: z.number(),
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
export type Collection = z.infer<typeof CollectionSchema>;
export type CollectionTool = z.infer<typeof CollectionToolSchema>;
export type CollectionWithTools = z.infer<typeof CollectionWithToolsSchema>;

// ============================================================================
// Constants
// ============================================================================

export const COLLECTION_LIMITS = {
  MAX_COLLECTIONS_PER_USER: 50,
  MAX_TOOLS_PER_COLLECTION: 100,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_NOTE_LENGTH: 500,
} as const;
