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
 */
export const TpmjsReturnsSchema = z.object({
  type: z.string().min(1),
  description: z.string().min(1),
});

export type TpmjsReturns = z.infer<typeof TpmjsReturnsSchema>;

/**
 * Authentication configuration schema
 */
export const TpmjsAuthenticationSchema = z.object({
  required: z.boolean(),
  type: z.enum(['api-key', 'oauth', 'basic-auth', 'custom']),
  envVar: z.string().optional(),
  docsUrl: z.string().url().optional(),
});

export type TpmjsAuthentication = z.infer<typeof TpmjsAuthenticationSchema>;

/**
 * External links schema
 */
export const TpmjsLinksSchema = z.object({
  documentation: z.string().url().optional(),
  playground: z.string().url().optional(),
  repository: z.string().url().optional(),
  homepage: z.string().url().optional(),
});

export type TpmjsLinks = z.infer<typeof TpmjsLinksSchema>;

/**
 * AI Agent guidance schema
 */
export const TpmjsAiAgentSchema = z.object({
  useCase: z.string().min(10),
  limitations: z.string().optional(),
  examples: z.array(z.string()).optional(),
});

export type TpmjsAiAgent = z.infer<typeof TpmjsAiAgentSchema>;

/**
 * Minimal tier schema - required fields only
 * This is the minimum required to publish a tool to TPMJS
 */
export const TpmjsMinimalSchema = z.object({
  category: z.enum(TPMJS_CATEGORIES, {
    message: `Category must be one of: ${TPMJS_CATEGORIES.join(', ')}`,
  }),
  description: z.string().min(20, 'Description must be at least 20 characters').max(500),
  example: z.string().min(10, 'Example must be at least 10 characters'),
});

export type TpmjsMinimal = z.infer<typeof TpmjsMinimalSchema>;

/**
 * Rich tier schema - includes optional enhanced metadata
 * Tools with these fields get better visibility and quality scores
 */
export const TpmjsRichSchema = TpmjsMinimalSchema.extend({
  parameters: z.array(TpmjsParameterSchema).optional(),
  returns: TpmjsReturnsSchema.optional(),
  authentication: TpmjsAuthenticationSchema.optional(),
  frameworks: z
    .array(z.enum(['vercel-ai', 'langchain', 'llamaindex', 'haystack', 'semantic-kernel']))
    .optional(),
  links: TpmjsLinksSchema.optional(),
  tags: z.array(z.string().min(2).max(30)).max(10).optional(),
  status: z.enum(['experimental', 'beta', 'stable', 'deprecated']).optional(),
  aiAgent: TpmjsAiAgentSchema.optional(),
});

export type TpmjsRich = z.infer<typeof TpmjsRichSchema>;

/**
 * Union type for either tier
 */
export type TpmjsField = TpmjsMinimal | TpmjsRich;

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  tier: 'minimal' | 'rich' | null;
  data?: TpmjsField;
  errors?: z.ZodError;
}

/**
 * Validates a tpmjs field and determines its tier
 */
export function validateTpmjsField(tpmjs: unknown): ValidationResult {
  // Try rich tier first
  const richResult = TpmjsRichSchema.safeParse(tpmjs);
  if (richResult.success) {
    // Check if it has any rich-tier fields
    const data = richResult.data;
    const hasRichFields =
      data.parameters ||
      data.returns ||
      data.authentication ||
      data.frameworks ||
      data.links ||
      data.tags ||
      data.status ||
      data.aiAgent;

    return {
      valid: true,
      tier: hasRichFields ? 'rich' : 'minimal',
      data: richResult.data,
    };
  }

  // Try minimal tier
  const minimalResult = TpmjsMinimalSchema.safeParse(tpmjs);
  if (minimalResult.success) {
    return {
      valid: true,
      tier: 'minimal',
      data: minimalResult.data,
    };
  }

  // Invalid
  return {
    valid: false,
    tier: null,
    errors: minimalResult.error,
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
