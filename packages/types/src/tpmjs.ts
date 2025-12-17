import { z } from 'zod';

/**
 * Valid tool categories for TPMJS registry
 */
export const TPMJS_CATEGORIES = [
  'web-scraping',
  'data-processing',
  'file-operations',
  'communication',
  'database',
  'api-integration',
  'image-processing',
  'text-analysis',
  'automation',
  'ai-ml',
  'security',
  'monitoring',
] as const;

export type TpmjsCategory = (typeof TPMJS_CATEGORIES)[number];

/**
 * Tool parameter schema
 *
 * @deprecated Parameters are now auto-extracted from the tool's inputSchema at runtime.
 * You no longer need to manually specify parameters in your package.json.
 * This schema is kept for backward compatibility as a fallback if auto-extraction fails.
 */
export const TpmjsParameterSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  description: z.string().min(1),
  required: z.boolean().default(false),
  default: z.unknown().optional(),
});

export type TpmjsParameter = z.infer<typeof TpmjsParameterSchema>;

/**
 * Return value schema
 *
 * @deprecated Return type information is now auto-extracted from the tool at runtime.
 * You no longer need to manually specify returns in your package.json.
 */
export const TpmjsReturnsSchema = z.object({
  type: z.string().min(1),
  description: z.string().min(1),
});

export type TpmjsReturns = z.infer<typeof TpmjsReturnsSchema>;

/**
 * Environment variable schema
 */
export const TpmjsEnvSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  required: z.boolean().default(true),
  default: z.string().optional(),
});

export type TpmjsEnv = z.infer<typeof TpmjsEnvSchema>;

/**
 * AI Agent guidance schema
 *
 * @deprecated AI agent guidance is now auto-extracted from the tool at runtime.
 * You no longer need to manually specify aiAgent in your package.json.
 */
export const TpmjsAiAgentSchema = z.object({
  useCase: z.string().min(10),
  limitations: z.string().optional(),
  examples: z.array(z.string()).optional(),
});

export type TpmjsAiAgent = z.infer<typeof TpmjsAiAgentSchema>;

/**
 * Individual tool definition within a multi-tool package
 *
 * Required fields:
 * - name: The export name of the tool from the package
 *
 * Optional fields (auto-extracted if not provided):
 * - description: A description of what the tool does (20-500 chars) - auto-extracted from tool
 *
 * @deprecated fields (now auto-extracted, kept for backward compatibility):
 * - parameters: Tool input parameters - auto-extracted from inputSchema
 * - returns: Tool return type - auto-extracted from tool
 * - aiAgent: AI agent guidance - auto-extracted from tool
 */
export const TpmjsToolDefinitionSchema = z
  .object({
    // New field name (preferred)
    name: z.string().min(1).optional(),
    // @deprecated - use 'name' instead. Kept for backward compatibility.
    exportName: z.string().min(1).optional(),
    // Optional - auto-extracted from tool if not provided
    description: z
      .string()
      .min(20, 'Description must be at least 20 characters')
      .max(500)
      .optional(),
    // @deprecated - now auto-extracted from tool's inputSchema
    parameters: z.array(TpmjsParameterSchema).optional(),
    // @deprecated - now auto-extracted from tool
    returns: TpmjsReturnsSchema.optional(),
    // @deprecated - now auto-extracted from tool
    aiAgent: TpmjsAiAgentSchema.optional(),
  })
  .refine((data) => data.name || data.exportName, {
    message: 'Either name or exportName is required',
  });

export type TpmjsToolDefinition = z.infer<typeof TpmjsToolDefinitionSchema>;

/**
 * Multi-tool format - NEW SCHEMA
 * Package-level metadata with optional array of tools
 *
 * If tools is not provided, TPMJS will auto-discover exports from the package.
 * Authors can override auto-discovery by providing explicit tool definitions.
 */
export const TpmjsMultiToolSchema = z.object({
  category: z.enum(TPMJS_CATEGORIES, {
    message: `Category must be one of: ${TPMJS_CATEGORIES.join(', ')}`,
  }),
  // Optional - if not provided, tools are auto-discovered from package exports
  tools: z.array(TpmjsToolDefinitionSchema).optional(),
  env: z.array(TpmjsEnvSchema).optional(),
  frameworks: z
    .array(z.enum(['vercel-ai', 'langchain', 'llamaindex', 'haystack', 'semantic-kernel']))
    .optional(),
});

export type TpmjsMultiTool = z.infer<typeof TpmjsMultiToolSchema>;

/**
 * Legacy minimal tier schema - DEPRECATED
 * Kept for backward compatibility with auto-migration
 */
export const TpmjsLegacyMinimalSchema = z.object({
  category: z.enum(TPMJS_CATEGORIES, {
    message: `Category must be one of: ${TPMJS_CATEGORIES.join(', ')}`,
  }),
  description: z.string().min(20, 'Description must be at least 20 characters').max(500),
});

export type TpmjsLegacyMinimal = z.infer<typeof TpmjsLegacyMinimalSchema>;

/**
 * Legacy rich tier schema - DEPRECATED
 * Kept for backward compatibility with auto-migration
 */
export const TpmjsLegacyRichSchema = TpmjsLegacyMinimalSchema.extend({
  parameters: z.array(TpmjsParameterSchema).optional(),
  returns: TpmjsReturnsSchema.optional(),
  env: z.array(TpmjsEnvSchema).optional(),
  frameworks: z
    .array(z.enum(['vercel-ai', 'langchain', 'llamaindex', 'haystack', 'semantic-kernel']))
    .optional(),
  aiAgent: TpmjsAiAgentSchema.optional(),
});

export type TpmjsLegacyRich = z.infer<typeof TpmjsLegacyRichSchema>;

/**
 * Union type for legacy formats
 */
export type TpmjsLegacy = TpmjsLegacyMinimal | TpmjsLegacyRich;

/**
 * Union type for all formats (new multi-tool + legacy)
 */
export type TpmjsField = TpmjsMultiTool | TpmjsLegacy;

// Backward compatibility aliases
export type TpmjsMinimal = TpmjsLegacyMinimal;
export type TpmjsRich = TpmjsLegacyRich;
export const TpmjsMinimalSchema = TpmjsLegacyMinimalSchema;
export const TpmjsRichSchema = TpmjsLegacyRichSchema;

/**
 * Extended validation result type for multi-tool support
 */
export interface ValidationResult {
  valid: boolean;
  tier: 'minimal' | 'rich' | null;
  data?: TpmjsField;
  errors?: z.ZodError;
  // New fields for multi-tool support
  packageData?: {
    category: TpmjsCategory;
    env?: TpmjsEnv[];
    frameworks?: string[];
  };
  tools?: TpmjsToolDefinition[];
  wasLegacyFormat?: boolean;
  // When true, tools need to be auto-discovered from package exports
  needsAutoDiscovery?: boolean;
}

/**
 * Validates a tpmjs field and determines its tier
 * Supports both new multi-tool format and legacy single-tool format with auto-migration
 */
export function validateTpmjsField(tpmjs: unknown): ValidationResult {
  // Try new multi-tool format first
  const multiResult = TpmjsMultiToolSchema.safeParse(tpmjs);
  if (multiResult.success) {
    const data = multiResult.data;

    // Check if tools need auto-discovery
    const needsAutoDiscovery = !data.tools || data.tools.length === 0;

    // Determine tier based on tool richness
    const hasRichFields =
      (data.tools?.some((tool) => tool.parameters || tool.returns || tool.aiAgent) ?? false) ||
      data.env ||
      data.frameworks;

    return {
      valid: true,
      tier: hasRichFields ? 'rich' : 'minimal',
      data: data,
      packageData: {
        category: data.category,
        env: data.env,
        frameworks: data.frameworks,
      },
      tools: data.tools,
      wasLegacyFormat: false,
      needsAutoDiscovery,
    };
  }

  // Try legacy rich tier format with auto-migration
  const richResult = TpmjsLegacyRichSchema.safeParse(tpmjs);
  if (richResult.success) {
    const legacyData = richResult.data;

    // Auto-migrate to multi-tool format
    const tool: TpmjsToolDefinition = {
      name: 'default',
      description: legacyData.description,
      parameters: legacyData.parameters,
      returns: legacyData.returns,
      aiAgent: legacyData.aiAgent,
    };

    const hasRichFields =
      legacyData.parameters ||
      legacyData.returns ||
      legacyData.env ||
      legacyData.frameworks ||
      legacyData.aiAgent;

    return {
      valid: true,
      tier: hasRichFields ? 'rich' : 'minimal',
      data: legacyData,
      packageData: {
        category: legacyData.category,
        env: legacyData.env,
        frameworks: legacyData.frameworks,
      },
      tools: [tool],
      wasLegacyFormat: true,
      needsAutoDiscovery: false,
    };
  }

  // Try legacy minimal tier format with auto-migration
  const minimalResult = TpmjsLegacyMinimalSchema.safeParse(tpmjs);
  if (minimalResult.success) {
    // Auto-migrate to multi-tool format
    const tool: TpmjsToolDefinition = {
      name: 'default',
      description: minimalResult.data.description,
    };

    return {
      valid: true,
      tier: 'minimal',
      data: minimalResult.data,
      packageData: {
        category: minimalResult.data.category,
      },
      tools: [tool],
      wasLegacyFormat: true,
      needsAutoDiscovery: false,
    };
  }

  // Invalid - return error from multi-tool schema (most informative)
  return {
    valid: false,
    tier: null,
    errors: multiResult.error,
  };
}

/**
 * Type guard for minimal tier
 */
export function isTpmjsMinimal(tpmjs: unknown): tpmjs is TpmjsMinimal {
  return TpmjsMinimalSchema.safeParse(tpmjs).success;
}

/**
 * Type guard for rich tier
 */
export function isTpmjsRich(tpmjs: unknown): tpmjs is TpmjsRich {
  return TpmjsRichSchema.safeParse(tpmjs).success;
}
