import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { getDatabase } from '../db/client.js';
import {
  type Category,
  type ToolObject,
  type Verb,
  categories,
  categoryVerbAffinity,
  objects,
  verbObjectCompatibility,
  verbs,
} from '../db/schema.js';
// Drizzle operators imported as needed

// =============================================================================
// COMPATIBILITY SCHEMAS
// =============================================================================

const VerbObjectRuleSchema = z.object({
  verbName: z.string(),
  compatibleObjects: z.array(z.string()).describe('Objects this verb works well with'),
  incompatibleObjects: z.array(z.string()).describe('Objects this verb does NOT work with'),
});

const CategoryVerbRuleSchema = z.object({
  categoryName: z.string(),
  preferredVerbs: z.array(z.string()).describe('Verbs that fit well with this category'),
  score: z.number().min(0.5).max(1.0).describe('Affinity score'),
});

// =============================================================================
// GENERATE COMPATIBILITY RULES WITH AI
// =============================================================================

export async function generateVerbObjectRules(
  verbList: Verb[],
  objectList: ToolObject[]
): Promise<Map<string, { compatible: Set<string>; incompatible: Set<string> }>> {
  const result = await generateObject({
    model: openai('gpt-4.1-mini'),
    schema: z.object({
      rules: z.array(VerbObjectRuleSchema),
    }),
    prompt: `Define which verbs work with which objects for AI tools.

VERBS (${verbList.length}):
${verbList.map((v) => `- ${v.name} (${v.verbType})`).join('\n')}

OBJECTS (${objectList.length}):
${objectList.map((o) => `- ${o.name} (${o.domain})`).join('\n')}

For each verb, specify:
1. Compatible objects - objects this verb naturally operates on
2. Incompatible objects - objects that don't make sense with this verb

Examples of good combinations:
- parse: JSON, CSV, XML, YAML, HTML, Date, URL
- generate: Report, Document, Code, Test, Schema
- schedule: Meeting, Task, Job, Reminder
- transcribe: Audio, Video
- sanitize: HTML, Input, Path

Examples of bad combinations:
- parse + Meeting (can't parse a meeting)
- schedule + JSON (can't schedule JSON)
- transcribe + Code (can't transcribe code)

Focus on the most distinctive rules. Objects not mentioned are neutral (score 0.5).`,
    temperature: 0.3,
  });

  const rules = new Map<string, { compatible: Set<string>; incompatible: Set<string> }>();

  for (const rule of result.object.rules) {
    rules.set(rule.verbName, {
      compatible: new Set(rule.compatibleObjects),
      incompatible: new Set(rule.incompatibleObjects),
    });
  }

  return rules;
}

export async function generateCategoryVerbRules(
  categoryList: Category[],
  verbList: Verb[]
): Promise<Map<string, { verbs: Set<string>; score: number }>> {
  const result = await generateObject({
    model: openai('gpt-4.1-mini'),
    schema: z.object({
      rules: z.array(CategoryVerbRuleSchema),
    }),
    prompt: `Define which verbs fit best with each category for AI tools.

CATEGORIES (${categoryList.length}):
${categoryList.map((c) => `- ${c.name} (${c.description})`).join('\n')}

VERBS (${verbList.length}):
${verbList.map((v) => `- ${v.name} (${v.verbType})`).join('\n')}

For each category, list the verbs that naturally belong:
- security: scan, detect, validate, verify, audit, check
- documentation: generate, draft, format, summarize, render
- analytics: analyze, aggregate, forecast, predict, score
- data: parse, transform, validate, normalize, merge, filter
- engineering: build, test, lint, deploy, monitor

Give a score from 0.5-1.0 for how well the verbs fit.`,
    temperature: 0.3,
  });

  const rules = new Map<string, { verbs: Set<string>; score: number }>();

  for (const rule of result.object.rules) {
    rules.set(rule.categoryName, {
      verbs: new Set(rule.preferredVerbs),
      score: rule.score,
    });
  }

  return rules;
}

// =============================================================================
// SCORE CALCULATION
// =============================================================================

/**
 * Calculate compatibility score for a tool combination
 */
export function calculateCompatibilityScore(
  category: Category,
  verb: Verb,
  object: ToolObject,
  verbObjectRules: Map<string, { compatible: Set<string>; incompatible: Set<string> }>,
  categoryVerbRules: Map<string, { verbs: Set<string>; score: number }>
): number {
  let score = 0.5; // Base score

  // Check verb-object compatibility
  const voRules = verbObjectRules.get(verb.name);
  if (voRules) {
    if (voRules.compatible.has(object.name)) {
      score += 0.3;
    } else if (voRules.incompatible.has(object.name)) {
      score -= 0.4;
    }
  }

  // Check category-verb affinity
  const cvRules = categoryVerbRules.get(category.name);
  if (cvRules) {
    if (cvRules.verbs.has(verb.name)) {
      score += 0.2 * cvRules.score;
    }
  }

  // Priority bonus (higher priority items are more likely to be good)
  const priorityBonus = ((category.priority + verb.priority + object.priority) / 300) * 0.1;
  score += priorityBonus;

  return Math.max(0, Math.min(1, score));
}

// =============================================================================
// SEED COMPATIBILITY RULES TO DATABASE
// =============================================================================

export async function seedCompatibilityRules(options: { dbPath?: string } = {}) {
  const db = getDatabase(options.dbPath);

  // Load vocabulary
  const categoryList = db.select().from(categories).all();
  const verbList = db.select().from(verbs).all();
  const objectList = db.select().from(objects).all();

  if (categoryList.length === 0 || verbList.length === 0 || objectList.length === 0) {
    throw new Error('Vocabulary must be seeded first. Run vocab:generate command.');
  }

  console.log('Generating compatibility rules with AI...');

  // Generate rules
  const [voRules, cvRules] = await Promise.all([
    generateVerbObjectRules(verbList, objectList),
    generateCategoryVerbRules(categoryList, verbList),
  ]);

  console.log(`Generated ${voRules.size} verb-object rules, ${cvRules.size} category-verb rules`);

  // Store verb-object compatibility
  let voCount = 0;
  for (const verb of verbList) {
    const rules = voRules.get(verb.name);
    if (!rules) continue;

    for (const obj of objectList) {
      let score = 0.5; // neutral
      if (rules.compatible.has(obj.name)) {
        score = 0.9;
      } else if (rules.incompatible.has(obj.name)) {
        score = 0.1;
      } else {
        continue; // Don't store neutral scores to save space
      }

      try {
        db.insert(verbObjectCompatibility)
          .values({
            verbId: verb.id,
            objectId: obj.id,
            score,
          })
          .onConflictDoNothing()
          .run();
        voCount++;
      } catch (e) {
        // Ignore duplicates
      }
    }
  }

  // Store category-verb affinity
  let cvCount = 0;
  for (const cat of categoryList) {
    const rules = cvRules.get(cat.name);
    if (!rules) continue;

    for (const verb of verbList) {
      if (!rules.verbs.has(verb.name)) continue;

      try {
        db.insert(categoryVerbAffinity)
          .values({
            categoryId: cat.id,
            verbId: verb.id,
            score: rules.score,
          })
          .onConflictDoNothing()
          .run();
        cvCount++;
      } catch (e) {
        // Ignore duplicates
      }
    }
  }

  return {
    verbObjectRules: voCount,
    categoryVerbRules: cvCount,
  };
}

// =============================================================================
// LOAD RULES FROM DATABASE
// =============================================================================

export function loadCompatibilityRules(db: ReturnType<typeof getDatabase>) {
  // Load verb-object rules
  const voRulesRaw = db.select().from(verbObjectCompatibility).all();
  const verbList = db.select().from(verbs).all();
  const objectList = db.select().from(objects).all();

  const verbMap = new Map(verbList.map((v) => [v.id, v]));
  const objectMap = new Map(objectList.map((o) => [o.id, o]));

  const voRules = new Map<string, { compatible: Set<string>; incompatible: Set<string> }>();
  for (const rule of voRulesRaw) {
    const verb = verbMap.get(rule.verbId);
    const obj = objectMap.get(rule.objectId);
    if (!verb || !obj) continue;

    if (!voRules.has(verb.name)) {
      voRules.set(verb.name, { compatible: new Set(), incompatible: new Set() });
    }

    const entry = voRules.get(verb.name)!;
    if (rule.score >= 0.7) {
      entry.compatible.add(obj.name);
    } else if (rule.score <= 0.3) {
      entry.incompatible.add(obj.name);
    }
  }

  // Load category-verb rules
  const cvRulesRaw = db.select().from(categoryVerbAffinity).all();
  const categoryList = db.select().from(categories).all();

  const categoryMap = new Map(categoryList.map((c) => [c.id, c]));

  const cvRules = new Map<string, { verbs: Set<string>; score: number }>();
  for (const rule of cvRulesRaw) {
    const cat = categoryMap.get(rule.categoryId);
    const verb = verbMap.get(rule.verbId);
    if (!cat || !verb) continue;

    if (!cvRules.has(cat.name)) {
      cvRules.set(cat.name, { verbs: new Set(), score: rule.score });
    }

    cvRules.get(cat.name)!.verbs.add(verb.name);
  }

  return { voRules, cvRules };
}
