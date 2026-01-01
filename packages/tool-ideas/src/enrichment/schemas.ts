import { z } from 'zod';

// =============================================================================
// TOOL PARAMETER SCHEMA (all fields required for OpenAI structured output)
// =============================================================================

export const ToolParameterSchema = z.object({
  name: z.string().describe('camelCase parameter name'),
  type: z.enum(['string', 'number', 'boolean', 'array', 'object']).describe('Parameter type'),
  description: z.string().describe('What this parameter does (10-200 chars)'),
  required: z.boolean().describe('Whether this parameter is required'),
  defaultValue: z.string().describe('Default value as string, or empty string if none'),
});

export type ToolParameter = z.infer<typeof ToolParameterSchema>;

// =============================================================================
// TOOL RETURNS SCHEMA
// =============================================================================

export const ToolReturnsSchema = z.object({
  type: z.string().describe('Return type name (e.g., ParsedData, ValidationResult)'),
  description: z.string().describe('What the tool returns (10-200 chars)'),
});

export type ToolReturns = z.infer<typeof ToolReturnsSchema>;

// =============================================================================
// AI AGENT GUIDANCE SCHEMA (all fields required)
// =============================================================================

export const AIAgentSchema = z.object({
  useCase: z.string().describe('When and why an AI agent should use this tool (30-500 chars)'),
  limitations: z.string().describe('What this tool cannot do, or empty string if none'),
  examples: z.array(z.string()).describe('1-3 example user requests'),
});

export type AIAgent = z.infer<typeof AIAgentSchema>;

// =============================================================================
// TOOL EXAMPLE SCHEMA
// =============================================================================

export const ToolExampleSchema = z.object({
  inputJson: z.string().describe('Example input parameters as JSON string'),
  description: z.string().describe('What this example demonstrates (max 100 chars)'),
});

export type ToolExample = z.infer<typeof ToolExampleSchema>;

// =============================================================================
// ENRICHED TOOL SCHEMA (main output from GPT - all fields required)
// =============================================================================

export const EnrichedToolSchema = z.object({
  name: z.string().describe('Tool name in category.verbObject format (e.g., data.parseCSV)'),

  description: z.string().describe('Clear description of what the tool does (50-500 chars)'),

  parameters: z.array(ToolParameterSchema).describe('1-10 input parameters for the tool'),

  returns: ToolReturnsSchema.describe('What the tool returns'),

  aiAgent: AIAgentSchema.describe('Guidance for AI agents using this tool'),

  tags: z.array(z.string()).describe('2-8 descriptive tags for discovery'),

  examples: z.array(ToolExampleSchema).describe('1-3 usage examples'),

  isNonsensical: z.boolean().describe('True if this tool concept does not make practical sense'),

  nonsenseReason: z
    .string()
    .describe('If nonsensical, explain why. Empty string if not nonsensical'),

  qualityScore: z.number().describe('Quality score 0-1: 1=highly practical, 0=nonsensical'),
});

export type EnrichedTool = z.infer<typeof EnrichedToolSchema>;

// =============================================================================
// BATCH ENRICHMENT SCHEMA (for processing multiple skeletons)
// =============================================================================

export const BatchEnrichmentSchema = z.object({
  tools: z.array(EnrichedToolSchema).min(1).max(10),
});

export type BatchEnrichment = z.infer<typeof BatchEnrichmentSchema>;
