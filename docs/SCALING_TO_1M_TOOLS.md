# Scaling TPMJS & Blocks to 1 Million Tools

## Executive Summary

The current architecture uses a monolithic `blocks.yml` file (~160KB, 4339 lines, ~100 tools) to define tool specifications, domain models, and validation rules. This approach works well for development and small-scale operations but will not scale to 10K or 1M tools.

This proposal outlines a phased migration from file-based to database-first architecture, with considerations for search, validation, governance, and ecosystem growth.

---

## Current State Analysis

### What We Have Today

**1. blocks.yml Structure (160KB)**
```yaml
name: "tpmjs-official-tools"
root: "."

philosophy:
  - "Every tool MUST be a working, production-ready implementation"
  - "Tools use AI SDK v6 tool() + jsonSchema() pattern exclusively"
  # ... 8 more principles

domain:
  entities:
    url: { fields: [...], description: "..." }
    webpage: { fields: [...], description: "..." }
    # ... ~50 entities

  signals:
    # ... ~20 signals

  measures:
    # ... ~15 measures

blocks:
  tool.name:
    description: "..."
    path: "tool-path"
    domain_rules: [...]
    inputs: [...]
    outputs: [...]
  # ... ~100 tools
```

**2. Database Schema (PostgreSQL)**
- `packages` - NPM package metadata (41 packages)
- `tools` - Individual tools (92 tools)
- `sync_checkpoints` - Sync progress tracking
- `sync_logs` - Audit trail
- `simulations` - Playground executions
- `health_checks` - Tool health monitoring

**3. Dual Systems**
- **TPMJS**: NPM registry sync, web frontend, tool discovery
- **Blocks**: Development-time validation, domain modeling, AI-powered checks

### Why YAML Won't Scale

| Scale | File Size | Parse Time | Git Diffs | Edit Experience |
|-------|-----------|------------|-----------|-----------------|
| 100 tools | 160KB | ~50ms | Manageable | OK |
| 1,000 tools | 1.6MB | ~500ms | Painful | Poor |
| 10,000 tools | 16MB | ~5s | Unusable | Impossible |
| 100,000 tools | 160MB | ~50s | N/A | N/A |
| 1,000,000 tools | 1.6GB | Minutes | N/A | N/A |

**Additional Problems:**
- No partial loading (must parse entire file)
- No concurrent editing (merge conflicts)
- No versioning per-tool
- No access control
- No search/indexing
- No validation caching
- Memory pressure on CI/CD

---

## Proposed Architecture

### Phase 1: Database-First Tool Registry (Months 1-3)

**Goal:** Move tool definitions from YAML to database while maintaining blocks.yml compatibility for validation.

#### 1.1 Extended Database Schema

```prisma
/// Tool Specification - replaces blocks.yml tool definitions
model ToolSpec {
  id String @id @default(cuid())

  // Identity
  name        String @unique @db.VarChar(100)  // e.g., "text.csvParse"
  slug        String @unique @db.VarChar(100)  // e.g., "csv-parse"
  version     String @db.VarChar(20)           // Spec version, not npm version

  // Classification
  category    String @db.VarChar(50)           // e.g., "text", "research", "workflow"
  subcategory String? @db.VarChar(50)
  tags        String[] @db.Text

  // Specification
  description     String @db.Text
  longDescription String? @db.Text
  inputs          Json   @db.JsonB             // Input schema
  outputs         Json   @db.JsonB             // Output schema
  domainRules     Json?  @db.JsonB             // Domain validation rules
  examples        Json?  @db.JsonB             // Usage examples

  // Domain Bindings
  consumesEntities String[] @db.Text           // e.g., ["csv_data", "text_content"]
  producesEntities String[] @db.Text
  signalMappings   Json?    @db.JsonB

  // Governance
  status      ToolStatus @default(DRAFT)       // DRAFT, REVIEW, PUBLISHED, DEPRECATED
  visibility  Visibility @default(PRIVATE)     // PRIVATE, UNLISTED, PUBLIC
  ownerId     String?    @map("owner_id")
  reviewedBy  String?    @map("reviewed_by")
  reviewedAt  DateTime?  @map("reviewed_at")

  // Metrics (aggregated from implementations)
  implementationCount Int @default(0)
  totalDownloads      Int @default(0)
  avgQualityScore     Decimal? @db.Decimal(3, 2)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  publishedAt DateTime?

  // Relations
  implementations ToolImplementation[]

  @@index([category])
  @@index([status])
  @@index([visibility])
  @@fulltext([name, description])
}

enum ToolStatus {
  DRAFT
  REVIEW
  PUBLISHED
  DEPRECATED
  ARCHIVED
}

enum Visibility {
  PRIVATE
  UNLISTED
  PUBLIC
}

/// Tool Implementation - links spec to actual npm package
model ToolImplementation {
  id String @id @default(cuid())

  specId    String   @map("spec_id")
  spec      ToolSpec @relation(fields: [specId], references: [id])

  packageId String   @map("package_id")
  package   Package  @relation(fields: [packageId], references: [id])

  toolId    String   @map("tool_id")
  tool      Tool     @relation(fields: [toolId], references: [id])

  // Compliance
  isOfficial      Boolean @default(false)
  isVerified      Boolean @default(false)
  complianceScore Decimal? @db.Decimal(3, 2)

  @@unique([specId, packageId, toolId])
}

/// Domain Entity - replaces domain.entities in blocks.yml
model DomainEntity {
  id String @id @default(cuid())

  name        String   @unique @db.VarChar(100)
  fields      String[] @db.Text
  description String   @db.Text
  category    String   @db.VarChar(50)
  schema      Json?    @db.JsonB              // Full JSON Schema
  examples    Json?    @db.JsonB

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([category])
  @@fulltext([name, description])
}

/// Domain Signal - replaces domain.signals
model DomainSignal {
  id String @id @default(cuid())

  name            String  @unique @db.VarChar(100)
  description     String  @db.Text
  extractionHint  String? @db.Text
  valueType       String  @db.VarChar(50)     // "numeric", "categorical", "boolean"
  validRange      Json?   @db.JsonB

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

/// Domain Measure - replaces domain.measures
model DomainMeasure {
  id String @id @default(cuid())

  name        String   @unique @db.VarChar(100)
  constraints String[] @db.Text
  description String?  @db.Text

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

/// Philosophy Principles - replaces philosophy array
model PhilosophyPrinciple {
  id String @id @default(cuid())

  order       Int      @unique
  principle   String   @db.Text
  rationale   String?  @db.Text
  enforcedBy  String[] @db.Text              // Which validators enforce this

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### 1.2 YAML Generation (Backward Compatibility)

Generate `blocks.yml` from database for validation:

```typescript
// packages/blocks-sync/src/generate-blocks-yml.ts

export async function generateBlocksYml(options: {
  output: string;
  filter?: { category?: string; status?: ToolStatus[] };
}): Promise<void> {
  const specs = await prisma.toolSpec.findMany({
    where: {
      status: { in: options.filter?.status ?? ['PUBLISHED'] },
      category: options.filter?.category,
    },
    include: { implementations: true },
  });

  const entities = await prisma.domainEntity.findMany();
  const signals = await prisma.domainSignal.findMany();
  const measures = await prisma.domainMeasure.findMany();
  const principles = await prisma.philosophyPrinciple.findMany({
    orderBy: { order: 'asc' },
  });

  const blocksYml = {
    name: 'tpmjs-official-tools',
    root: '.',
    philosophy: principles.map(p => p.principle),
    domain: {
      entities: Object.fromEntries(
        entities.map(e => [e.name, { fields: e.fields, description: e.description }])
      ),
      signals: Object.fromEntries(
        signals.map(s => [s.name, { description: s.description, extraction_hint: s.extractionHint }])
      ),
      measures: Object.fromEntries(
        measures.map(m => [m.name, { constraints: m.constraints }])
      ),
    },
    blocks: Object.fromEntries(
      specs.map(s => [s.name, {
        description: s.description,
        path: s.slug,
        domain_rules: s.domainRules,
        inputs: s.inputs,
        outputs: s.outputs,
      }])
    ),
  };

  await writeFile(options.output, yaml.stringify(blocksYml));
}
```

#### 1.3 Admin API for Tool Management

```typescript
// apps/web/src/app/api/admin/specs/route.ts

// Create tool spec
POST /api/admin/specs
{
  "name": "text.csvParse",
  "category": "text",
  "description": "Parses CSV text into structured rows",
  "inputs": [...],
  "outputs": [...],
  "domainRules": [...]
}

// Update tool spec
PATCH /api/admin/specs/:id
{
  "description": "Updated description",
  "status": "PUBLISHED"
}

// Bulk import from YAML
POST /api/admin/specs/import
Content-Type: multipart/form-data
file: blocks.yml

// Generate YAML for validation
GET /api/admin/specs/export?format=yaml&category=text
```

---

### Phase 2: Search & Discovery Infrastructure (Months 3-6)

**Goal:** Enable fast search, filtering, and discovery at 10K+ scale.

#### 2.1 Search Options Comparison

| Solution | 10K Tools | 100K Tools | 1M Tools | Cost | Complexity |
|----------|-----------|------------|----------|------|------------|
| PostgreSQL Full-Text | ✅ Great | ⚠️ OK | ❌ Slow | Free | Low |
| pg_trgm + GIN | ✅ Great | ✅ Good | ⚠️ OK | Free | Low |
| Meilisearch | ✅ Great | ✅ Great | ✅ Great | $29/mo | Medium |
| Typesense | ✅ Great | ✅ Great | ✅ Great | $29/mo | Medium |
| Algolia | ✅ Great | ✅ Great | ✅ Great | $$$ | Low |
| Elasticsearch | ✅ Great | ✅ Great | ✅ Great | $$$ | High |

**Recommendation:** Start with PostgreSQL full-text + pg_trgm, migrate to Meilisearch/Typesense at 10K+ tools.

#### 2.2 PostgreSQL Search Optimization

```sql
-- Add full-text search indexes
CREATE INDEX idx_tool_specs_fts ON tool_specs
  USING GIN (to_tsvector('english', name || ' ' || description));

-- Add trigram index for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_tool_specs_trgm ON tool_specs
  USING GIN (name gin_trgm_ops, description gin_trgm_ops);

-- Materialized view for search
CREATE MATERIALIZED VIEW tool_search_index AS
SELECT
  ts.id,
  ts.name,
  ts.slug,
  ts.category,
  ts.description,
  ts.tags,
  ts.status,
  ts.visibility,
  ts.implementation_count,
  ts.total_downloads,
  ts.avg_quality_score,
  ts.published_at,
  to_tsvector('english',
    ts.name || ' ' ||
    ts.description || ' ' ||
    array_to_string(ts.tags, ' ')
  ) as search_vector
FROM tool_specs ts
WHERE ts.visibility = 'PUBLIC' AND ts.status = 'PUBLISHED';

CREATE INDEX idx_tool_search_fts ON tool_search_index USING GIN (search_vector);
REFRESH MATERIALIZED VIEW CONCURRENTLY tool_search_index;
```

#### 2.3 Dedicated Search Service (Meilisearch)

```typescript
// packages/search/src/meilisearch.ts

import { MeiliSearch } from 'meilisearch';

const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST!,
  apiKey: process.env.MEILISEARCH_API_KEY!,
});

export interface ToolSearchDocument {
  id: string;
  name: string;
  slug: string;
  category: string;
  subcategory?: string;
  description: string;
  tags: string[];
  inputs: string[];      // Flattened input names for search
  outputs: string[];     // Flattened output names for search
  entities: string[];    // Domain entities consumed/produced
  downloads: number;
  qualityScore: number;
  publishedAt: number;
}

export async function initializeSearchIndex() {
  const index = client.index('tools');

  await index.updateSettings({
    searchableAttributes: [
      'name',
      'description',
      'tags',
      'category',
      'subcategory',
      'inputs',
      'outputs',
      'entities',
    ],
    filterableAttributes: [
      'category',
      'subcategory',
      'tags',
      'qualityScore',
      'downloads',
    ],
    sortableAttributes: [
      'downloads',
      'qualityScore',
      'publishedAt',
    ],
    rankingRules: [
      'words',
      'typo',
      'proximity',
      'attribute',
      'sort',
      'exactness',
      'downloads:desc',
      'qualityScore:desc',
    ],
  });
}

export async function indexTools(tools: ToolSearchDocument[]) {
  const index = client.index('tools');
  await index.addDocuments(tools, { primaryKey: 'id' });
}

export async function searchTools(query: string, options: {
  category?: string;
  limit?: number;
  offset?: number;
}) {
  const index = client.index('tools');

  return index.search(query, {
    filter: options.category ? `category = "${options.category}"` : undefined,
    limit: options.limit ?? 20,
    offset: options.offset ?? 0,
  });
}
```

#### 2.4 Search API

```typescript
// apps/web/src/app/api/search/route.ts

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';
  const category = searchParams.get('category');
  const sort = searchParams.get('sort') ?? 'relevance';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
  const offset = parseInt(searchParams.get('offset') ?? '0');

  // At 10K+ tools, use Meilisearch
  if (await shouldUseDedicatedSearch()) {
    const results = await meilisearch.searchTools(q, { category, limit, offset });
    return NextResponse.json(results);
  }

  // Under 10K tools, use PostgreSQL
  const results = await prisma.$queryRaw`
    SELECT * FROM tool_search_index
    WHERE search_vector @@ plainto_tsquery('english', ${q})
    ${category ? Prisma.sql`AND category = ${category}` : Prisma.empty}
    ORDER BY
      ts_rank(search_vector, plainto_tsquery('english', ${q})) DESC,
      total_downloads DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return NextResponse.json(results);
}
```

---

### Phase 3: Distributed Validation (Months 6-9)

**Goal:** Validate tools at scale without blocking on a single YAML file.

#### 3.1 Validation Job Queue

```typescript
// packages/validation-worker/src/queue.ts

import { Queue, Worker } from 'bullmq';

const validationQueue = new Queue('tool-validation', {
  connection: redis,
});

interface ValidationJob {
  specId: string;
  validatorIds: string[];  // Which validators to run
  priority: 'high' | 'normal' | 'low';
  triggeredBy: 'publish' | 'update' | 'scheduled' | 'manual';
}

// Enqueue validation
export async function enqueueValidation(job: ValidationJob) {
  await validationQueue.add('validate', job, {
    priority: job.priority === 'high' ? 1 : job.priority === 'normal' ? 5 : 10,
    removeOnComplete: 1000,
    removeOnFail: 5000,
  });
}

// Process validations
const worker = new Worker('tool-validation', async (job) => {
  const { specId, validatorIds } = job.data;

  // Fetch spec from database
  const spec = await prisma.toolSpec.findUnique({
    where: { id: specId },
    include: { implementations: true },
  });

  // Generate mini blocks.yml for just this tool
  const miniBlocksYml = generateSingleToolYml(spec);

  // Run validators
  const results = await Promise.all(
    validatorIds.map(id => runValidator(id, miniBlocksYml))
  );

  // Store results
  await prisma.validationResult.create({
    data: {
      specId,
      results: JSON.stringify(results),
      valid: results.every(r => r.valid),
    },
  });

  return results;
}, { connection: redis });
```

#### 3.2 Validation Results Schema

```prisma
model ValidationResult {
  id String @id @default(cuid())

  specId String   @map("spec_id")
  spec   ToolSpec @relation(fields: [specId], references: [id])

  valid      Boolean
  validators Json    @db.JsonB    // { validatorId: { valid, issues, context } }
  summary    String? @db.Text

  createdAt DateTime @default(now())

  @@index([specId])
  @@index([valid])
  @@index([createdAt])
}
```

#### 3.3 Incremental Validation

Only validate what changed:

```typescript
// packages/validation/src/incremental.ts

export async function validateIncremental(specId: string) {
  const spec = await prisma.toolSpec.findUnique({ where: { id: specId } });
  const lastValidation = await prisma.validationResult.findFirst({
    where: { specId },
    orderBy: { createdAt: 'desc' },
  });

  // Check what changed
  const specHash = hashSpec(spec);
  const lastHash = lastValidation?.metadata?.specHash;

  if (specHash === lastHash) {
    return lastValidation; // No changes, return cached
  }

  // Determine which validators need to re-run
  const changedFields = diffSpecs(spec, lastValidation?.spec);
  const validators = selectValidatorsForChanges(changedFields);

  return enqueueValidation({
    specId,
    validatorIds: validators,
    priority: 'normal',
    triggeredBy: 'update',
  });
}
```

---

### Phase 4: Governance & Quality (Months 9-12)

**Goal:** Maintain quality at scale with automated and human review.

#### 4.1 Multi-Stage Review Pipeline

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌───────────┐
│    DRAFT    │────▶│   AUTOMATED  │────▶│  HUMAN REVIEW │────▶│ PUBLISHED │
│             │     │    REVIEW    │     │   (optional)  │     │           │
└─────────────┘     └──────────────┘     └───────────────┘     └───────────┘
       │                   │                     │                    │
       │                   │                     │                    │
       ▼                   ▼                     ▼                    ▼
  - Author creates    - Schema valid?      - Trusted author?   - Visible in
  - Saves draft       - Domain rules ok?   - Skip review       - Search index
                      - Philosophy ok?     - OR                - API available
                      - Tests pass?        - Manual approve    - Stats tracked
```

#### 4.2 Automated Quality Gates

```typescript
// packages/governance/src/quality-gates.ts

export interface QualityGate {
  id: string;
  name: string;
  required: boolean;
  check: (spec: ToolSpec) => Promise<QualityResult>;
}

export const qualityGates: QualityGate[] = [
  {
    id: 'schema-valid',
    name: 'Schema Validation',
    required: true,
    check: async (spec) => {
      const ajv = new Ajv();
      const inputValid = ajv.validateSchema(spec.inputs);
      const outputValid = ajv.validateSchema(spec.outputs);
      return { valid: inputValid && outputValid, issues: ajv.errors };
    },
  },
  {
    id: 'has-description',
    name: 'Has Description',
    required: true,
    check: async (spec) => ({
      valid: spec.description.length >= 20,
      issues: spec.description.length < 20 ? ['Description too short'] : [],
    }),
  },
  {
    id: 'has-examples',
    name: 'Has Examples',
    required: false,
    check: async (spec) => ({
      valid: spec.examples && spec.examples.length > 0,
      issues: !spec.examples ? ['No examples provided'] : [],
    }),
  },
  {
    id: 'domain-compliance',
    name: 'Domain Compliance',
    required: true,
    check: async (spec) => {
      // Run blocks domain validator
      return runDomainValidator(spec);
    },
  },
  {
    id: 'naming-convention',
    name: 'Naming Convention',
    required: true,
    check: async (spec) => {
      const pattern = /^[a-z]+(\.[a-zA-Z]+)+$/;
      return {
        valid: pattern.test(spec.name),
        issues: !pattern.test(spec.name)
          ? ['Name must be category.toolName format']
          : [],
      };
    },
  },
  {
    id: 'security-scan',
    name: 'Security Scan',
    required: true,
    check: async (spec) => {
      // Scan for suspicious patterns in domain rules
      return securityScanner.scan(spec);
    },
  },
];

export async function runQualityGates(spec: ToolSpec): Promise<{
  passed: boolean;
  results: Record<string, QualityResult>;
}> {
  const results: Record<string, QualityResult> = {};

  for (const gate of qualityGates) {
    results[gate.id] = await gate.check(spec);
  }

  const requiredPassed = qualityGates
    .filter(g => g.required)
    .every(g => results[g.id].valid);

  return { passed: requiredPassed, results };
}
```

#### 4.3 Trusted Publishers

```prisma
model Publisher {
  id String @id @default(cuid())

  userId      String @unique
  displayName String
  verified    Boolean @default(false)
  trustLevel  TrustLevel @default(STANDARD)

  // Auto-publish settings
  autoPublish       Boolean @default(false)  // Skip manual review
  autoPublishLimit  Int     @default(10)     // Max auto-publish per day

  // Stats
  publishedCount Int @default(0)
  rejectedCount  Int @default(0)
  qualityAvg     Decimal? @db.Decimal(3, 2)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum TrustLevel {
  NEW           // First 10 tools need review
  STANDARD      // Normal review process
  TRUSTED       // Can auto-publish up to limit
  CORE          // Official maintainer, unlimited auto-publish
}
```

#### 4.4 Moderation Queue

```typescript
// apps/web/src/app/api/admin/moderation/route.ts

// Get pending reviews
GET /api/admin/moderation?status=pending&limit=20

// Approve tool
POST /api/admin/moderation/:specId/approve
{
  "comment": "Looks good, approved"
}

// Reject tool
POST /api/admin/moderation/:specId/reject
{
  "reason": "Missing required examples",
  "comment": "Please add at least 2 usage examples"
}

// Request changes
POST /api/admin/moderation/:specId/request-changes
{
  "changes": [
    "Add more detailed description",
    "Fix input schema - missing required field"
  ]
}
```

---

### Phase 5: Scale to 1 Million (Months 12-18)

#### 5.1 Infrastructure Changes

| Component | 10K Tools | 100K Tools | 1M Tools |
|-----------|-----------|------------|----------|
| Database | Single PostgreSQL | Read replicas | Sharded PostgreSQL or CockroachDB |
| Search | Meilisearch single | Meilisearch cluster | Elasticsearch cluster |
| Cache | Redis single | Redis cluster | Redis cluster + CDN |
| Validation | Single worker | Worker pool | Distributed workers (k8s) |
| API | Single region | Multi-region | Global edge (Cloudflare Workers) |

#### 5.2 Caching Strategy

```typescript
// packages/cache/src/strategy.ts

export const cacheConfig = {
  // Tool specs - rarely change
  specs: {
    ttl: 3600,            // 1 hour
    staleWhileRevalidate: 86400,  // 1 day
  },

  // Search results - personalized, shorter cache
  search: {
    ttl: 60,              // 1 minute
    staleWhileRevalidate: 300,    // 5 minutes
  },

  // Domain entities - almost never change
  domain: {
    ttl: 86400,           // 1 day
    staleWhileRevalidate: 604800, // 1 week
  },

  // Validation results - cache until spec changes
  validation: {
    ttl: 0,               // Invalidate on spec change
    keyPrefix: (specId: string, specHash: string) =>
      `validation:${specId}:${specHash}`,
  },
};

// Multi-layer caching
export async function getToolSpec(id: string): Promise<ToolSpec> {
  // L1: In-memory (per-request)
  const memory = memoryCache.get(id);
  if (memory) return memory;

  // L2: Redis
  const redis = await redisCache.get(`spec:${id}`);
  if (redis) {
    memoryCache.set(id, redis);
    return redis;
  }

  // L3: Database
  const db = await prisma.toolSpec.findUnique({ where: { id } });
  if (db) {
    await redisCache.set(`spec:${id}`, db, cacheConfig.specs.ttl);
    memoryCache.set(id, db);
  }

  return db;
}
```

#### 5.3 Database Sharding Strategy

For 1M+ tools, consider sharding by category:

```typescript
// Sharding key: category
// Shard 0: text.*, data.*, research.*
// Shard 1: workflow.*, automation.*, integration.*
// Shard 2: security.*, compliance.*, legal.*
// Shard 3: ml.*, ai.*, analysis.*
// Shard 4: finance.*, accounting.*, ops.*
// ...

// Cross-shard queries use scatter-gather
export async function searchAcrossShards(query: string) {
  const shards = getAllShards();
  const results = await Promise.all(
    shards.map(shard => shard.search(query))
  );
  return mergeAndRank(results);
}
```

#### 5.4 CDN-First API Design

```typescript
// Edge function for tool lookup
// Deployed to Cloudflare Workers / Vercel Edge

export default {
  async fetch(request: Request) {
    const url = new URL(request.url);
    const slug = url.pathname.replace('/api/tools/', '');

    // Check edge cache
    const cached = await caches.default.match(request);
    if (cached) return cached;

    // Fetch from origin with cache headers
    const response = await fetch(`${ORIGIN_URL}/api/tools/${slug}`, {
      cf: { cacheTtl: 3600 },
    });

    // Clone and cache
    const cloned = response.clone();
    await caches.default.put(request, cloned);

    return response;
  },
};
```

---

### Phase 6: Ecosystem Features (Ongoing)

#### 6.1 Tool Composition / Recipes

```prisma
model Recipe {
  id String @id @default(cuid())

  name        String @unique
  description String @db.Text

  // Ordered list of tools in the recipe
  steps Json @db.JsonB
  // [
  //   { specId: "...", inputMappings: { ... } },
  //   { specId: "...", inputMappings: { ... } },
  // ]

  // Computed metrics
  estimatedDuration Int?     // milliseconds
  complexity        String?  // "simple" | "moderate" | "complex"

  publisherId String
  visibility  Visibility

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### 6.2 Tool Analytics

```prisma
model ToolAnalytics {
  id String @id @default(cuid())

  specId String @map("spec_id")
  date   DateTime @db.Date

  // Usage
  views       Int @default(0)
  apiCalls    Int @default(0)
  uniqueUsers Int @default(0)

  // Performance
  avgLatencyMs  Int?
  p95LatencyMs  Int?
  errorRate     Decimal? @db.Decimal(5, 4)  // 0.0000 to 1.0000

  // Discovery
  searchImpressions Int @default(0)
  searchClicks      Int @default(0)
  directLinks       Int @default(0)

  @@unique([specId, date])
  @@index([date])
}
```

#### 6.3 Versioning & Changelogs

```prisma
model ToolSpecVersion {
  id String @id @default(cuid())

  specId  String   @map("spec_id")
  version String   @db.VarChar(20)  // semver

  // Snapshot of spec at this version
  snapshot Json @db.JsonB

  // Changelog
  changelog String? @db.Text
  breaking  Boolean @default(false)

  createdAt DateTime @default(now())

  @@unique([specId, version])
  @@index([specId])
}
```

---

## Migration Path

### Step 1: Import Existing blocks.yml to Database

```typescript
// scripts/migrate-blocks-yml.ts

import yaml from 'yaml';

async function migrate() {
  const content = await readFile('packages/tools/official/blocks.yml', 'utf-8');
  const blocks = yaml.parse(content);

  // Import philosophy
  for (const [index, principle] of blocks.philosophy.entries()) {
    await prisma.philosophyPrinciple.upsert({
      where: { order: index },
      create: { order: index, principle },
      update: { principle },
    });
  }

  // Import domain entities
  for (const [name, entity] of Object.entries(blocks.domain.entities)) {
    await prisma.domainEntity.upsert({
      where: { name },
      create: {
        name,
        fields: entity.fields,
        description: entity.description,
        category: inferCategory(name),
      },
      update: { fields: entity.fields, description: entity.description },
    });
  }

  // Import tool specs
  for (const [name, block] of Object.entries(blocks.blocks)) {
    const [category, ...rest] = name.split('.');
    await prisma.toolSpec.upsert({
      where: { name },
      create: {
        name,
        slug: block.path,
        category,
        description: block.description,
        inputs: block.inputs,
        outputs: block.outputs,
        domainRules: block.domain_rules,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
      },
      update: { /* ... */ },
    });
  }
}
```

### Step 2: Maintain Dual-Write During Transition

```typescript
// Write to both database and regenerate YAML
export async function updateToolSpec(id: string, data: Partial<ToolSpec>) {
  // Update database
  await prisma.toolSpec.update({
    where: { id },
    data,
  });

  // Regenerate YAML for validation
  await generateBlocksYml({
    output: 'packages/tools/official/blocks.yml',
  });
}
```

### Step 3: Switch to Database-First

Once validated:
1. Remove YAML as source of truth
2. Generate YAML only for blocks validation
3. Update CI/CD to use database
4. Archive blocks.yml (keep for reference)

---

## Cost Estimates

| Scale | Database | Search | Cache | Workers | CDN | Total/mo |
|-------|----------|--------|-------|---------|-----|----------|
| 1K tools | $20 (Neon) | $0 (PG) | $0 | $0 | $0 | ~$20 |
| 10K tools | $50 | $29 | $20 | $0 | $0 | ~$100 |
| 100K tools | $200 | $99 | $100 | $50 | $50 | ~$500 |
| 1M tools | $1000 | $500 | $500 | $500 | $200 | ~$2,700 |

---

## Open Questions

1. **Blocks validation at scale**: Should each tool have its own mini-blocks.yml, or should we batch validate?

2. **Real-time sync vs eventual consistency**: How fresh do search results need to be?

3. **Multi-tenancy**: Will organizations want private tool registries?

4. **Federation**: Should tools be able to reference tools from other registries?

5. **AI-generated tools**: How do we handle LLM-generated tool specs at scale?

6. **Deprecation policy**: How long to keep deprecated tools available?

7. **Breaking changes**: How to handle breaking changes to popular tools?

---

## Appendix: Schema Migrations

### Migration 1: Add ToolSpec Table

```sql
CREATE TABLE tool_specs (
  id TEXT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  version VARCHAR(20) NOT NULL,
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(50),
  tags TEXT[],
  description TEXT NOT NULL,
  long_description TEXT,
  inputs JSONB NOT NULL,
  outputs JSONB NOT NULL,
  domain_rules JSONB,
  examples JSONB,
  consumes_entities TEXT[],
  produces_entities TEXT[],
  signal_mappings JSONB,
  status VARCHAR(20) DEFAULT 'DRAFT',
  visibility VARCHAR(20) DEFAULT 'PRIVATE',
  owner_id TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMP,
  implementation_count INTEGER DEFAULT 0,
  total_downloads INTEGER DEFAULT 0,
  avg_quality_score DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP
);

CREATE INDEX idx_tool_specs_category ON tool_specs(category);
CREATE INDEX idx_tool_specs_status ON tool_specs(status);
CREATE INDEX idx_tool_specs_visibility ON tool_specs(visibility);
```

### Migration 2: Add Full-Text Search

```sql
ALTER TABLE tool_specs
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector('english',
    coalesce(name, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(array_to_string(tags, ' '), '')
  )
) STORED;

CREATE INDEX idx_tool_specs_search ON tool_specs USING GIN(search_vector);
```

---

## Summary

Scaling from 100 to 1M tools requires:

1. **Database-first architecture** - Move tool specs from YAML to PostgreSQL
2. **Search infrastructure** - PostgreSQL full-text → Meilisearch/Typesense
3. **Distributed validation** - Job queues with incremental validation
4. **Governance pipeline** - Automated quality gates + human review
5. **Caching strategy** - Multi-layer caching + CDN
6. **Sharding/replication** - At 1M+ tools, consider sharding

The migration can be done incrementally, maintaining backward compatibility with the existing blocks.yml workflow throughout.
