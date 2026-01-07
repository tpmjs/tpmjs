import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { eq, inArray, sql } from 'drizzle-orm';
import pLimit from 'p-limit';
import { getDatabase } from '../db/client.js';
import {
  type NewToolIdea,
  type ToolSkeleton,
  categories,
  contexts,
  objects,
  processingErrors,
  toolIdeas,
  toolSkeletons,
  verbs,
} from '../db/schema.js';
import { type SkeletonWithRelations, createEnrichmentPrompt } from './prompts.js';
import { EnrichedToolSchema } from './schemas.js';

// =============================================================================
// BATCH PROCESSOR OPTIONS
// =============================================================================

export interface BatchProcessorOptions {
  dbPath?: string;
  batchSize?: number;
  concurrency?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  costLimitUsd?: number;
  model?: string;
  onProgress?: (processed: number, total: number, cost: number) => void;
  onError?: (error: Error, skeletonId: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<BatchProcessorOptions, 'dbPath' | 'onProgress' | 'onError'>> =
  {
    batchSize: 100,
    concurrency: 5,
    maxRetries: 3,
    retryDelayMs: 1000,
    costLimitUsd: 50,
    model: 'gpt-4.1-mini',
  };

// =============================================================================
// PRICING (GPT-4.1-mini)
// =============================================================================

const PRICING = {
  inputPerToken: 0.15 / 1_000_000, // $0.15 per 1M tokens
  outputPerToken: 0.6 / 1_000_000, // $0.60 per 1M tokens
};

function calculateCost(promptTokens: number, completionTokens: number): number {
  return promptTokens * PRICING.inputPerToken + completionTokens * PRICING.outputPerToken;
}

// =============================================================================
// BATCH PROCESSOR
// =============================================================================

export class BatchProcessor {
  private options: Required<Omit<BatchProcessorOptions, 'dbPath' | 'onProgress' | 'onError'>>;
  private dbPath?: string;
  private onProgress?: (processed: number, total: number, cost: number) => void;
  private onError?: (error: Error, skeletonId: number) => void;
  private totalCost = 0;
  private processedCount = 0;

  constructor(options: BatchProcessorOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.dbPath = options.dbPath;
    this.onProgress = options.onProgress;
    this.onError = options.onError;
  }

  /**
   * Process the next batch of pending skeletons
   */
  async processNextBatch(): Promise<{
    success: boolean;
    processed: number;
    failed: number;
    nonsensical: number;
    cost: number;
    message: string;
  }> {
    const db = getDatabase(this.dbPath);

    // Check cost limit
    if (this.totalCost >= this.options.costLimitUsd) {
      return {
        success: false,
        processed: 0,
        failed: 0,
        nonsensical: 0,
        cost: this.totalCost,
        message: `Cost limit reached: $${this.totalCost.toFixed(2)}`,
      };
    }

    // Get pending skeletons
    const pendingSkeletons = db
      .select()
      .from(toolSkeletons)
      .where(eq(toolSkeletons.status, 'pending'))
      .limit(this.options.batchSize)
      .all();

    if (pendingSkeletons.length === 0) {
      return {
        success: true,
        processed: 0,
        failed: 0,
        nonsensical: 0,
        cost: this.totalCost,
        message: 'No pending skeletons',
      };
    }

    // Load relations for each skeleton
    const skeletonsWithRelations = await this.loadSkeletonRelations(db, pendingSkeletons);

    // Process with concurrency limit
    const limit = pLimit(this.options.concurrency);
    let successCount = 0;
    let failedCount = 0;
    let nonsensicalCount = 0;
    let batchCost = 0;

    await Promise.all(
      skeletonsWithRelations.map((skeleton) =>
        limit(async () => {
          try {
            const result = await this.processSkeleton(db, skeleton);
            successCount++;
            batchCost += result.cost;
            if (result.isNonsensical) nonsensicalCount++;
          } catch (error) {
            failedCount++;
            if (this.onError) {
              this.onError(error as Error, skeleton.id);
            }
            await this.logError(db, skeleton.id, error as Error);
          }
        })
      )
    );

    this.totalCost += batchCost;
    this.processedCount += successCount;

    if (this.onProgress) {
      const totalPending =
        db
          .select({ count: sql<number>`count(*)` })
          .from(toolSkeletons)
          .where(eq(toolSkeletons.status, 'pending'))
          .get()?.count ?? 0;
      this.onProgress(this.processedCount, this.processedCount + totalPending, this.totalCost);
    }

    return {
      success: true,
      processed: successCount,
      failed: failedCount,
      nonsensical: nonsensicalCount,
      cost: batchCost,
      message: `Processed ${successCount}/${pendingSkeletons.length}, cost: $${batchCost.toFixed(4)}`,
    };
  }

  /**
   * Process continuously until done or cost limit reached
   */
  async processAll(): Promise<{
    totalProcessed: number;
    totalFailed: number;
    totalNonsensical: number;
    totalCost: number;
  }> {
    let totalProcessed = 0;
    let totalFailed = 0;
    let totalNonsensical = 0;

    while (true) {
      const result = await this.processNextBatch();

      totalProcessed += result.processed;
      totalFailed += result.failed;
      totalNonsensical += result.nonsensical;

      if (!result.success || result.processed === 0) {
        break;
      }

      // Check cost limit
      if (this.totalCost >= this.options.costLimitUsd) {
        console.log(`Cost limit reached: $${this.totalCost.toFixed(2)}`);
        break;
      }
    }

    return {
      totalProcessed,
      totalFailed,
      totalNonsensical,
      totalCost: this.totalCost,
    };
  }

  /**
   * Load skeleton relations from database
   */
  private async loadSkeletonRelations(
    db: ReturnType<typeof getDatabase>,
    skeletons: ToolSkeleton[]
  ): Promise<SkeletonWithRelations[]> {
    const categoryIds = [...new Set(skeletons.map((s) => s.categoryId))];
    const verbIds = [...new Set(skeletons.map((s) => s.verbId))];
    const objectIds = [...new Set(skeletons.map((s) => s.objectId))];
    const contextIds = [...new Set(skeletons.map((s) => s.contextId).filter(Boolean))] as number[];

    const categoryMap = new Map(
      db
        .select()
        .from(categories)
        .where(inArray(categories.id, categoryIds))
        .all()
        .map((c) => [c.id, c])
    );
    const verbMap = new Map(
      db
        .select()
        .from(verbs)
        .where(inArray(verbs.id, verbIds))
        .all()
        .map((v) => [v.id, v])
    );
    const objectMap = new Map(
      db
        .select()
        .from(objects)
        .where(inArray(objects.id, objectIds))
        .all()
        .map((o) => [o.id, o])
    );
    const contextMap =
      contextIds.length > 0
        ? new Map(
            db
              .select()
              .from(contexts)
              .where(inArray(contexts.id, contextIds))
              .all()
              .map((c) => [c.id, c])
          )
        : new Map();

    return skeletons
      .map((s) => {
        const category = categoryMap.get(s.categoryId);
        const verb = verbMap.get(s.verbId);
        const object = objectMap.get(s.objectId);
        if (!category || !verb || !object) return null;
        return {
          ...s,
          category,
          verb,
          object,
          context: s.contextId ? (contextMap.get(s.contextId) ?? null) : null,
        };
      })
      .filter((s): s is SkeletonWithRelations => s !== null);
  }

  /**
   * Process a single skeleton
   */
  private async processSkeleton(
    db: ReturnType<typeof getDatabase>,
    skeleton: SkeletonWithRelations
  ): Promise<{ cost: number; isNonsensical: boolean }> {
    const startTime = Date.now();

    // Mark as processing
    db.update(toolSkeletons)
      .set({ status: 'processing' })
      .where(eq(toolSkeletons.id, skeleton.id))
      .run();

    try {
      const prompt = createEnrichmentPrompt(skeleton);

      const result = await generateObject({
        model: openai(this.options.model),
        schema: EnrichedToolSchema,
        prompt,
        maxRetries: this.options.maxRetries,
      });

      const enriched = result.object;
      const processingTime = Date.now() - startTime;
      const promptTokens = result.usage?.inputTokens ?? 0;
      const completionTokens = result.usage?.outputTokens ?? 0;
      const cost = calculateCost(promptTokens, completionTokens);

      // Save enriched tool
      const toolIdea: NewToolIdea = {
        skeletonId: skeleton.id,
        name: enriched.name,
        description: enriched.description,
        parametersJson: JSON.stringify(enriched.parameters),
        returnsJson: JSON.stringify(enriched.returns),
        aiAgentJson: JSON.stringify(enriched.aiAgent),
        tagsJson: JSON.stringify(enriched.tags),
        examplesJson: JSON.stringify(enriched.examples),
        isNonsensical: enriched.isNonsensical,
        nonsenseReason: enriched.nonsenseReason ?? null,
        qualityScore: enriched.qualityScore,
        modelUsed: this.options.model,
        promptTokens,
        completionTokens,
        processingTimeMs: processingTime,
        enrichedAt: new Date().toISOString(),
      };

      db.insert(toolIdeas).values(toolIdea).run();

      // Mark skeleton as completed
      db.update(toolSkeletons)
        .set({ status: 'completed' })
        .where(eq(toolSkeletons.id, skeleton.id))
        .run();

      return { cost, isNonsensical: enriched.isNonsensical };
    } catch (error) {
      // Mark skeleton as failed
      db.update(toolSkeletons)
        .set({ status: 'failed' })
        .where(eq(toolSkeletons.id, skeleton.id))
        .run();

      throw error;
    }
  }

  /**
   * Log processing error
   */
  private async logError(db: ReturnType<typeof getDatabase>, skeletonId: number, error: Error) {
    db.insert(processingErrors)
      .values({
        skeletonId,
        batchId: null,
        errorType: error.name,
        errorMessage: error.message,
        retryCount: 0,
        createdAt: new Date().toISOString(),
      })
      .run();
  }

  /**
   * Get processing stats
   */
  getStats() {
    return {
      processedCount: this.processedCount,
      totalCost: this.totalCost,
    };
  }
}

// =============================================================================
// STATS HELPER
// =============================================================================

export function getEnrichmentStats(dbPath?: string) {
  const db = getDatabase(dbPath);

  const totalIdeas = db.select({ count: sql<number>`count(*)` }).from(toolIdeas).get()?.count ?? 0;
  const nonsensical =
    db
      .select({ count: sql<number>`count(*)` })
      .from(toolIdeas)
      .where(eq(toolIdeas.isNonsensical, true))
      .get()?.count ?? 0;

  const avgQuality =
    db
      .select({ avg: sql<number>`avg(quality_score)` })
      .from(toolIdeas)
      .where(eq(toolIdeas.isNonsensical, false))
      .get()?.avg ?? 0;

  const totalTokens = db
    .select({
      promptTokens: sql<number>`sum(prompt_tokens)`,
      completionTokens: sql<number>`sum(completion_tokens)`,
    })
    .from(toolIdeas)
    .get();

  const totalCost = calculateCost(
    totalTokens?.promptTokens ?? 0,
    totalTokens?.completionTokens ?? 0
  );

  return {
    totalIdeas,
    nonsensical,
    quality: totalIdeas - nonsensical,
    avgQualityScore: avgQuality,
    totalCost,
  };
}
