import { createHash } from 'node:crypto';
import { eq, count as sqlCount } from 'drizzle-orm';
import { getDatabase } from '../db/client.js';
import {
  type Category,
  type Context,
  type NewToolSkeleton,
  type ToolObject,
  type Verb,
  categories,
  contexts,
  objects,
  toolSkeletons,
  verbs,
} from '../db/schema.js';
import { calculateCompatibilityScore, loadCompatibilityRules } from './compatibility.js';

// =============================================================================
// SEEDED RANDOM NUMBER GENERATOR
// =============================================================================

class SeededRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    // LCG parameters (same as glibc)
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const temp = result[i];
      result[i] = result[j] as T;
      result[j] = temp as T;
    }
    return result;
  }

  sample<T>(array: T[], n: number): T[] {
    const shuffled = this.shuffle(array);
    return shuffled.slice(0, n);
  }
}

// =============================================================================
// SKELETON GENERATION
// =============================================================================

interface SkeletonCandidate {
  category: Category;
  verb: Verb;
  object: ToolObject;
  context: Context | null;
  score: number;
  hash: string;
  rawName: string;
}

function createHash256(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 32);
}

function generateRawName(category: Category, verb: Verb, object: ToolObject): string {
  // category.verbObject format
  const verbName = verb.name;
  const objectName = object.name;
  return `${category.name}.${verbName}${objectName}`;
}

/**
 * Generate tool skeletons deterministically
 */
export async function generateSkeletons(options: {
  dbPath?: string;
  count?: number;
  threshold?: number;
  seed?: number;
  includeContexts?: boolean;
  onProgress?: (current: number, total: number) => void;
}): Promise<{ generated: number; skipped: number }> {
  const {
    dbPath,
    count = 10000,
    threshold = 0.5,
    seed = 42,
    includeContexts = false,
    onProgress,
  } = options;

  const db = getDatabase(dbPath);
  const rng = new SeededRNG(seed);

  // Load vocabulary
  const categoryList = db.select().from(categories).all();
  const verbList = db.select().from(verbs).all();
  const objectList = db.select().from(objects).all();
  const contextList = includeContexts ? db.select().from(contexts).all() : [];

  if (categoryList.length === 0 || verbList.length === 0 || objectList.length === 0) {
    throw new Error('Vocabulary must be seeded first. Run vocab:generate command.');
  }

  // Load compatibility rules
  const { voRules, cvRules } = loadCompatibilityRules(db);

  console.log(
    `Vocabulary: ${categoryList.length} categories, ${verbList.length} verbs, ${objectList.length} objects`
  );
  console.log(`Generating up to ${count} skeletons with threshold ${threshold}...`);

  // Generate all candidates and score them
  const candidates: SkeletonCandidate[] = [];
  const seenHashes = new Set<string>();

  // Base combinations (no context)
  for (const category of categoryList) {
    for (const verb of verbList) {
      for (const object of objectList) {
        const score = calculateCompatibilityScore(category, verb, object, voRules, cvRules);

        if (score < threshold) continue;

        const rawName = generateRawName(category, verb, object);
        const hashInput = `${category.id}:${verb.id}:${object.id}:0`;
        const hash = createHash256(hashInput);

        if (seenHashes.has(hash)) continue;
        seenHashes.add(hash);

        candidates.push({
          category,
          verb,
          object,
          context: null,
          score,
          hash,
          rawName,
        });
      }
    }
  }

  // With contexts (if enabled)
  if (includeContexts) {
    for (const category of categoryList) {
      for (const verb of verbList) {
        for (const object of objectList) {
          const baseScore = calculateCompatibilityScore(category, verb, object, voRules, cvRules);
          if (baseScore < threshold - 0.1) continue; // Slightly lower threshold for context variants

          for (const context of rng.sample(contextList, 3)) {
            const score = baseScore; // Context doesn't affect compatibility for now

            const rawName = generateRawName(category, verb, object);
            const hashInput = `${category.id}:${verb.id}:${object.id}:${context.id}`;
            const hash = createHash256(hashInput);

            if (seenHashes.has(hash)) continue;
            seenHashes.add(hash);

            candidates.push({
              category,
              verb,
              object,
              context,
              score,
              hash,
              rawName,
            });
          }
        }
      }
    }
  }

  console.log(`Found ${candidates.length} candidates above threshold ${threshold}`);

  // Sort by score (highest first) and take top N
  candidates.sort((a, b) => b.score - a.score);
  const selected = candidates.slice(0, count);

  console.log(`Selected top ${selected.length} candidates`);

  // Insert in batches
  const batchSize = 1000;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < selected.length; i += batchSize) {
    const batch = selected.slice(i, i + batchSize);

    const values: NewToolSkeleton[] = batch.map((c) => ({
      hash: c.hash,
      categoryId: c.category.id,
      verbId: c.verb.id,
      objectId: c.object.id,
      contextId: c.context?.id ?? null,
      qualifierIds: null,
      rawName: c.rawName,
      compatibilityScore: c.score,
      status: 'pending',
      generatedAt: new Date().toISOString(),
    }));

    try {
      db.insert(toolSkeletons).values(values).onConflictDoNothing().run();
      inserted += batch.length;
    } catch (e) {
      // Some might be duplicates
      for (const v of values) {
        try {
          db.insert(toolSkeletons).values(v).onConflictDoNothing().run();
          inserted++;
        } catch {
          skipped++;
        }
      }
    }

    if (onProgress) {
      onProgress(Math.min(i + batchSize, selected.length), selected.length);
    }
  }

  return { generated: inserted, skipped };
}

/**
 * Get skeleton generation stats
 */
export function getSkeletonStats(dbPath?: string) {
  const db = getDatabase(dbPath);

  const total = db.select({ count: sqlCount() }).from(toolSkeletons).get()?.count ?? 0;
  const pending =
    db
      .select({ count: sqlCount() })
      .from(toolSkeletons)
      .where(eq(toolSkeletons.status, 'pending'))
      .get()?.count ?? 0;
  const completed =
    db
      .select({ count: sqlCount() })
      .from(toolSkeletons)
      .where(eq(toolSkeletons.status, 'completed'))
      .get()?.count ?? 0;
  const failed =
    db
      .select({ count: sqlCount() })
      .from(toolSkeletons)
      .where(eq(toolSkeletons.status, 'failed'))
      .get()?.count ?? 0;

  return { total, pending, completed, failed };
}
