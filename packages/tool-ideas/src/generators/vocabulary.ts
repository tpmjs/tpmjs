import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { getDatabase } from '../db/client.js';
import { categories, contexts, objects, qualifiers, verbs } from '../db/schema.js';

// =============================================================================
// TPMJS CATEGORIES (from @tpmjs/types)
// =============================================================================

export const TPMJS_CATEGORIES = [
  'research',
  'web',
  'data',
  'documentation',
  'engineering',
  'security',
  'statistics',
  'ops',
  'agent',
  'utilities',
  'html',
  'compliance',
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
  'monitoring',
  'doc',
  'text',
] as const;

// =============================================================================
// ZOD SCHEMAS FOR AI GENERATION
// =============================================================================

const CategorySchema = z.object({
  name: z.string().describe('Short category name in lowercase-kebab-case'),
  tpmjsCategory: z.enum(TPMJS_CATEGORIES).describe('Mapped TPMJS category'),
  description: z
    .string()
    .min(20)
    .max(100)
    .describe('Brief description of what tools in this category do'),
  priority: z.number().min(0).max(100).describe('Priority 0-100, higher = more common/important'),
});

const VerbSchema = z.object({
  name: z.string().describe('Verb in lowercase (e.g., parse, generate, analyze)'),
  pastTense: z.string().describe('Past tense form (e.g., parsed, generated)'),
  gerund: z.string().describe('Gerund form (e.g., parsing, generating)'),
  verbType: z.enum([
    'action',
    'analysis',
    'transformation',
    'detection',
    'extraction',
    'validation',
    'aggregation',
    'prediction',
    'management',
  ]),
  priority: z.number().min(0).max(100).describe('Priority 0-100, higher = more common'),
});

const ObjectSchema = z.object({
  name: z.string().describe('Object name in PascalCase (e.g., Invoice, JSON, Email)'),
  plural: z.string().describe('Plural form'),
  domain: z.enum([
    'document',
    'code',
    'data',
    'media',
    'business',
    'security',
    'communication',
    'infrastructure',
    'analytics',
    'content',
  ]),
  priority: z.number().min(0).max(100).describe('Priority 0-100, higher = more common'),
});

const ContextSchema = z.object({
  name: z.string().describe('Context name in PascalCase (e.g., Batch, Realtime, Enterprise)'),
  contextType: z.enum(['workflow', 'platform', 'industry', 'constraint']),
  description: z.string().max(100).describe('Brief description'),
});

const QualifierSchema = z.object({
  name: z.string().describe('Qualifier name in PascalCase (e.g., Daily, Bulk, Async)'),
  qualifierType: z.enum(['temporal', 'scope', 'format', 'source', 'mode']),
  description: z.string().max(100).describe('Brief description'),
});

// =============================================================================
// AI GENERATION FUNCTIONS
// =============================================================================

export async function generateCategories(count = 35): Promise<z.infer<typeof CategorySchema>[]> {
  const result = await generateObject({
    model: openai('gpt-4.1-mini'),
    schema: z.object({
      categories: z
        .array(CategorySchema)
        .min(count)
        .max(count + 5),
    }),
    prompt: `Generate ${count} distinct categories for AI tools that agents would use.

Categories should cover:
- Core development: backend, frontend, devops, testing, database
- Data operations: ETL, validation, transformation, analytics
- Content & docs: documentation, content, copywriting, translation
- Business domains: HR, finance, sales, marketing, support, legal
- Technical: security, compliance, monitoring, infrastructure
- Communication: email, messaging, notifications
- Media: image, audio, video, file operations
- AI/ML: embeddings, models, prompts, agents

Map each to the closest TPMJS category from: ${TPMJS_CATEGORIES.join(', ')}

Prioritize categories that AI agents commonly need. Higher priority = more tools will be generated.`,
    temperature: 0.7,
  });

  return result.object.categories;
}

export async function generateVerbs(count = 50): Promise<z.infer<typeof VerbSchema>[]> {
  const result = await generateObject({
    model: openai('gpt-4.1-mini'),
    schema: z.object({
      verbs: z
        .array(VerbSchema)
        .min(count)
        .max(count + 10),
    }),
    prompt: `Generate ${count} distinct verbs that AI tools commonly perform.

Verb types needed:
- action: create, generate, build, compose, draft, format, render, send, upload, download
- analysis: analyze, evaluate, assess, audit, review, inspect, compare, benchmark
- transformation: convert, transform, normalize, encode, decode, parse, stringify, sanitize, compress, merge, split
- detection: detect, identify, recognize, classify, categorize, scan, find, locate
- extraction: extract, scrape, fetch, pull, read, capture
- validation: validate, verify, check, lint, test, assert
- aggregation: summarize, aggregate, collect, group, cluster, rank, sort, filter, dedupe
- prediction: predict, forecast, estimate, score, recommend
- management: schedule, track, monitor, log, alert, notify, sync

Include all common operations agents need. Higher priority = more frequently used.`,
    temperature: 0.7,
  });

  return result.object.verbs;
}

export async function generateObjects(count = 150): Promise<z.infer<typeof ObjectSchema>[]> {
  const result = await generateObject({
    model: openai('gpt-4.1-mini'),
    schema: z.object({
      objects: z
        .array(ObjectSchema)
        .min(count)
        .max(count + 20),
    }),
    prompt: `Generate ${count} distinct objects/nouns that AI tools operate on.

Domains to cover:
- document: Report, Document, Proposal, Contract, Invoice, Resume, Email, Article, BlogPost, Changelog, ReleaseNotes, Minutes, Transcript, Summary, Brief, Checklist, Template, FAQ, Readme, Spec
- code: Code, Function, Component, Module, API, Endpoint, Schema, Query, Migration, Test, Dependency, Package, Config, Variable, Commit, Branch, PullRequest, Issue, Workflow, Pipeline
- data: Data, Dataset, Record, Row, Table, JSON, CSV, XML, YAML, Markdown, HTML, URL, Path, Timestamp, Date, Number, String, Hash, Token, UUID
- media: Image, Audio, Video, File, Attachment, Screenshot, Diagram, Chart, Graph
- business: Customer, Lead, Opportunity, Deal, Account, Order, Payment, Invoice, Expense, Budget, Forecast, Report
- security: Vulnerability, Threat, Risk, Incident, Alert, Secret, Credential, Token, Certificate, Key
- communication: Message, Notification, Email, Thread, Channel, Comment, Mention, Reply
- infrastructure: Server, Container, Instance, Cluster, Service, Endpoint, Database, Cache, Queue
- analytics: Metric, KPI, Dashboard, Trend, Anomaly, Event, Session, Conversion
- content: Text, Paragraph, Sentence, Word, Heading, Link, Citation, Quote, Reference

Use PascalCase. Higher priority = more commonly operated on by agents.`,
    temperature: 0.7,
  });

  return result.object.objects;
}

export async function generateContexts(count = 40): Promise<z.infer<typeof ContextSchema>[]> {
  const result = await generateObject({
    model: openai('gpt-4.1-mini'),
    schema: z.object({
      contexts: z
        .array(ContextSchema)
        .min(count)
        .max(count + 10),
    }),
    prompt: `Generate ${count} distinct contexts that modify how AI tools operate.

Context types:
- workflow: Batch, Realtime, Scheduled, OnDemand, Triggered, Streaming, Incremental, Periodic
- platform: Web, API, CLI, Mobile, Serverless, Cloud, OnPrem, Hybrid
- industry: Enterprise, Startup, Ecommerce, SaaS, Healthcare, Finance, Legal, Education, Media, Gaming
- constraint: HighVolume, LowLatency, Secure, Compliant, Auditable, Encrypted, Cached, Optimized

These add specificity to tools. Use PascalCase.`,
    temperature: 0.7,
  });

  return result.object.contexts;
}

export async function generateQualifiers(count = 25): Promise<z.infer<typeof QualifierSchema>[]> {
  const result = await generateObject({
    model: openai('gpt-4.1-mini'),
    schema: z.object({
      qualifiers: z
        .array(QualifierSchema)
        .min(count)
        .max(count + 5),
    }),
    prompt: `Generate ${count} distinct qualifiers that modify AI tools.

Qualifier types:
- temporal: Daily, Weekly, Monthly, Historical, Live, Recent, Archived
- scope: Bulk, Single, Incremental, Full, Partial, Recursive
- format: Structured, Unstructured, Formatted, Raw, Pretty, Minified
- source: External, Internal, ThirdParty, Public, Private, Cached
- mode: Async, Sync, Streaming, Parallel, Sequential, Lazy, Eager

Use PascalCase.`,
    temperature: 0.7,
  });

  return result.object.qualifiers;
}

// =============================================================================
// GET VOCABULARY STATS
// =============================================================================

export function getVocabularyStats(dbPath?: string) {
  const db = getDatabase(dbPath);

  const catCount = db.select().from(categories).all().length;
  const verbCount = db.select().from(verbs).all().length;
  const objCount = db.select().from(objects).all().length;
  const ctxCount = db.select().from(contexts).all().length;
  const qualCount = db.select().from(qualifiers).all().length;

  return {
    categories: catCount,
    verbs: verbCount,
    objects: objCount,
    contexts: ctxCount,
    qualifiers: qualCount,
    total: catCount + verbCount + objCount + ctxCount + qualCount,
  };
}

// =============================================================================
// SEED VOCABULARY TO DATABASE
// =============================================================================

export interface SeedVocabularyOptions {
  dbPath?: string;
  regenerate?: boolean;
  counts?: {
    categories?: number;
    verbs?: number;
    objects?: number;
    contexts?: number;
    qualifiers?: number;
  };
  onProgress?: (type: string, current: number, total: number) => void;
}

export async function seedVocabulary(options: SeedVocabularyOptions = {}) {
  const db = getDatabase(options.dbPath);
  const counts = options.counts ?? {};
  const onProgress = options.onProgress;

  // Estimate token costs
  let totalCost = 0;
  const estimatedCostPerCall = 0.002; // ~$0.002 per generateObject call

  // Generate all vocabulary (5 parallel calls)
  onProgress?.('categories', 0, 5);
  const [cats, vbs, objs, ctxs, quals] = await Promise.all([
    generateCategories(counts.categories ?? 40),
    generateVerbs(counts.verbs ?? 60),
    generateObjects(counts.objects ?? 250),
    generateContexts(counts.contexts ?? 50),
    generateQualifiers(counts.qualifiers ?? 30),
  ]);

  totalCost = 5 * estimatedCostPerCall;

  // Insert categories
  onProgress?.('categories', 1, 5);
  for (const cat of cats) {
    try {
      db.insert(categories)
        .values({
          name: cat.name,
          tpmjsCategory: cat.tpmjsCategory,
          description: cat.description,
          priority: cat.priority,
        })
        .onConflictDoNothing()
        .run();
    } catch (e) {
      // Ignore duplicates
    }
  }

  // Insert verbs
  onProgress?.('verbs', 2, 5);
  for (const verb of vbs) {
    try {
      db.insert(verbs)
        .values({
          name: verb.name,
          pastTense: verb.pastTense,
          gerund: verb.gerund,
          verbType: verb.verbType,
          priority: verb.priority,
        })
        .onConflictDoNothing()
        .run();
    } catch (e) {
      // Ignore duplicates
    }
  }

  // Insert objects
  onProgress?.('objects', 3, 5);
  for (const obj of objs) {
    try {
      db.insert(objects)
        .values({
          name: obj.name,
          plural: obj.plural,
          domain: obj.domain,
          priority: obj.priority,
        })
        .onConflictDoNothing()
        .run();
    } catch (e) {
      // Ignore duplicates
    }
  }

  // Insert contexts
  onProgress?.('contexts', 4, 5);
  for (const ctx of ctxs) {
    try {
      db.insert(contexts)
        .values({
          name: ctx.name,
          contextType: ctx.contextType,
          description: ctx.description,
        })
        .onConflictDoNothing()
        .run();
    } catch (e) {
      // Ignore duplicates
    }
  }

  // Insert qualifiers
  onProgress?.('qualifiers', 5, 5);
  for (const qual of quals) {
    try {
      db.insert(qualifiers)
        .values({
          name: qual.name,
          qualifierType: qual.qualifierType,
          description: qual.description,
        })
        .onConflictDoNothing()
        .run();
    } catch (e) {
      // Ignore duplicates
    }
  }

  // Get final counts
  const stats = getVocabularyStats(options.dbPath);

  return {
    ...stats,
    totalCost,
  };
}
