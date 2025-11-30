import { z } from 'zod';

export const ToolParameterSchema = z.object({
  name: z.string(),
  description: z.string(),
  schema: z.record(z.string(), z.unknown()),
  required: z.boolean().default(false),
});

export const ToolSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  version: z.string(),
  parameters: z.array(ToolParameterSchema),
  tags: z.array(z.string()).default([]),
});

export type Tool = z.infer<typeof ToolSchema>;
export type ToolParameter = z.infer<typeof ToolParameterSchema>;
