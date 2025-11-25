import { z } from 'zod';

export const RegistrySearchResultSchema = z.object({
  toolId: z.string(),
  score: z.number(),
  matchType: z.enum(['exact', 'fuzzy', 'semantic']),
});

export const RegistrySearchOptionsSchema = z.object({
  query: z.string(),
  category: z.string().optional(),
  limit: z.number().default(10),
  offset: z.number().default(0),
});

export type RegistrySearchResult = z.infer<typeof RegistrySearchResultSchema>;
export type RegistrySearchOptions = z.infer<typeof RegistrySearchOptionsSchema>;
