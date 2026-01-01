// Database
export { getDatabase } from './db/client.js';
export * from './db/schema.js';

// Generators
export { seedVocabulary, getVocabularyStats } from './generators/vocabulary.js';
export {
  generateVerbObjectRules,
  generateCategoryVerbRules,
  calculateCompatibilityScore,
  seedCompatibilityRules,
  loadCompatibilityRules,
} from './generators/compatibility.js';
export { generateSkeletons, getSkeletonStats } from './generators/skeleton-generator.js';

// Enrichment
export * from './enrichment/schemas.js';
export { createEnrichmentPrompt, createBatchEnrichmentPrompt } from './enrichment/prompts.js';
export { BatchProcessor, getEnrichmentStats } from './enrichment/batch-processor.js';
export type { BatchProcessorOptions } from './enrichment/batch-processor.js';
