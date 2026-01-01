import { sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// =============================================================================
// VOCABULARY TABLES
// =============================================================================

/**
 * Categories - maps to TPMJS_CATEGORIES
 */
export const categories = sqliteTable(
  'categories',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull().unique(),
    tpmjsCategory: text('tpmjs_category').notNull(),
    description: text('description').notNull(),
    priority: integer('priority').notNull().default(0), // Higher = more important
  },
  (table) => [index('idx_categories_tpmjs').on(table.tpmjsCategory)]
);

/**
 * Verbs - action words for tools
 */
export const verbs = sqliteTable(
  'verbs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull().unique(),
    pastTense: text('past_tense'),
    gerund: text('gerund'),
    verbType: text('verb_type').notNull(), // action, analysis, transformation, detection, extraction, validation, aggregation, prediction, management
    priority: integer('priority').notNull().default(0),
  },
  (table) => [index('idx_verbs_type').on(table.verbType)]
);

/**
 * Objects - nouns that tools operate on
 */
export const objects = sqliteTable(
  'objects',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull().unique(),
    plural: text('plural'),
    domain: text('domain').notNull(), // document, code, data, media, business, security, communication, etc.
    priority: integer('priority').notNull().default(0),
  },
  (table) => [index('idx_objects_domain').on(table.domain)]
);

/**
 * Contexts - optional modifiers for tools
 */
export const contexts = sqliteTable(
  'contexts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull().unique(),
    contextType: text('context_type').notNull(), // workflow, platform, industry, constraint
    description: text('description'),
  },
  (table) => [index('idx_contexts_type').on(table.contextType)]
);

/**
 * Qualifiers - additional modifiers
 */
export const qualifiers = sqliteTable('qualifiers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  qualifierType: text('qualifier_type').notNull(), // temporal, scope, format, source, mode
  description: text('description'),
});

// =============================================================================
// COMPATIBILITY TABLES
// =============================================================================

/**
 * Verb-Object compatibility - which verbs work with which objects
 */
export const verbObjectCompatibility = sqliteTable(
  'verb_object_compatibility',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    verbId: integer('verb_id')
      .notNull()
      .references(() => verbs.id),
    objectId: integer('object_id')
      .notNull()
      .references(() => objects.id),
    score: real('score').notNull().default(1.0), // 0.0 to 1.0
    reasoning: text('reasoning'),
  },
  (table) => [uniqueIndex('idx_verb_object_unique').on(table.verbId, table.objectId)]
);

/**
 * Category-Verb affinity - which verbs fit which categories
 */
export const categoryVerbAffinity = sqliteTable(
  'category_verb_affinity',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
    verbId: integer('verb_id')
      .notNull()
      .references(() => verbs.id),
    score: real('score').notNull().default(1.0),
  },
  (table) => [uniqueIndex('idx_category_verb_unique').on(table.categoryId, table.verbId)]
);

// =============================================================================
// GENERATED DATA TABLES
// =============================================================================

/**
 * Tool skeletons - raw generated combinations before enrichment
 */
export const toolSkeletons = sqliteTable(
  'tool_skeletons',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    hash: text('hash').notNull().unique(), // SHA256 for deduplication
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
    verbId: integer('verb_id')
      .notNull()
      .references(() => verbs.id),
    objectId: integer('object_id')
      .notNull()
      .references(() => objects.id),
    contextId: integer('context_id').references(() => contexts.id),
    qualifierIds: text('qualifier_ids'), // JSON array of qualifier IDs
    rawName: text('raw_name').notNull(), // e.g., "data.parseCSV"
    compatibilityScore: real('compatibility_score').notNull(),
    status: text('status').notNull().default('pending'), // pending, processing, completed, failed, skipped
    generatedAt: text('generated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('idx_skeletons_status').on(table.status),
    index('idx_skeletons_score').on(table.compatibilityScore),
    index('idx_skeletons_category').on(table.categoryId),
  ]
);

/**
 * Enriched tool ideas - fully fleshed out by GPT
 */
export const toolIdeas = sqliteTable(
  'tool_ideas',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    skeletonId: integer('skeleton_id')
      .notNull()
      .unique()
      .references(() => toolSkeletons.id),

    // Core tool spec fields
    name: text('name').notNull(), // category.verbObject
    description: text('description').notNull(),
    parametersJson: text('parameters_json').notNull(), // JSON array
    returnsJson: text('returns_json').notNull(), // JSON object
    aiAgentJson: text('ai_agent_json'), // JSON object: useCase, limitations, examples
    tagsJson: text('tags_json'), // JSON array
    examplesJson: text('examples_json'), // JSON array

    // Quality metadata
    isNonsensical: integer('is_nonsensical', { mode: 'boolean' }).notNull().default(false),
    nonsenseReason: text('nonsense_reason'),
    qualityScore: real('quality_score'),

    // Processing metadata
    modelUsed: text('model_used').notNull(),
    promptTokens: integer('prompt_tokens'),
    completionTokens: integer('completion_tokens'),
    processingTimeMs: integer('processing_time_ms'),
    enrichedAt: text('enriched_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('idx_ideas_quality').on(table.qualityScore),
    index('idx_ideas_nonsensical').on(table.isNonsensical),
  ]
);

/**
 * Processing batches - track enrichment progress
 */
export const processingBatches = sqliteTable(
  'processing_batches',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    batchNumber: integer('batch_number').notNull(),
    status: text('status').notNull().default('pending'), // pending, processing, completed, failed
    skeletonStartId: integer('skeleton_start_id').notNull(),
    skeletonEndId: integer('skeleton_end_id').notNull(),
    totalCount: integer('total_count').notNull(),
    processedCount: integer('processed_count').notNull().default(0),
    successCount: integer('success_count').notNull().default(0),
    failedCount: integer('failed_count').notNull().default(0),
    nonsensicalCount: integer('nonsensical_count').notNull().default(0),
    startedAt: text('started_at'),
    completedAt: text('completed_at'),
    errorMessage: text('error_message'),
    costUsd: real('cost_usd'),
  },
  (table) => [index('idx_batches_status').on(table.status)]
);

/**
 * Processing errors - for retry logic
 */
export const processingErrors = sqliteTable(
  'processing_errors',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    skeletonId: integer('skeleton_id')
      .notNull()
      .references(() => toolSkeletons.id),
    batchId: integer('batch_id').references(() => processingBatches.id),
    errorType: text('error_type').notNull(),
    errorMessage: text('error_message').notNull(),
    retryCount: integer('retry_count').notNull().default(0),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index('idx_errors_skeleton').on(table.skeletonId)]
);

// =============================================================================
// TYPES
// =============================================================================

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Verb = typeof verbs.$inferSelect;
export type NewVerb = typeof verbs.$inferInsert;

export type ToolObject = typeof objects.$inferSelect;
export type NewToolObject = typeof objects.$inferInsert;

export type Context = typeof contexts.$inferSelect;
export type NewContext = typeof contexts.$inferInsert;

export type Qualifier = typeof qualifiers.$inferSelect;
export type NewQualifier = typeof qualifiers.$inferInsert;

export type ToolSkeleton = typeof toolSkeletons.$inferSelect;
export type NewToolSkeleton = typeof toolSkeletons.$inferInsert;

export type ToolIdea = typeof toolIdeas.$inferSelect;
export type NewToolIdea = typeof toolIdeas.$inferInsert;

export type ProcessingBatch = typeof processingBatches.$inferSelect;
export type NewProcessingBatch = typeof processingBatches.$inferInsert;
