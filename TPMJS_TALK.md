# TPMJS: The Missing Layer Between "LLMs Can Call Tools" and "Which Tool, Exactly?"

---

## The Setup

You're building an AI agent. It needs to do things in the world—scrape a webpage, send an email, query a database, generate an image. These capabilities come from **tools**.

The problem isn't that tools don't exist. They do. Thousands of them. The problem is:

- **You can't find them.** npm has 2 million packages. Which ones are AI-callable tools? Which ones actually work?
- **You can't trust them.** No schema. No examples. README says "AI-ready" but the function signature is `(opts: any) => Promise<any>`.
- **You can't compare them.** Three packages do "web scraping." Which one handles JavaScript rendering? Which one returns structured data? Which one is maintained?

Discovery is the bottleneck. Not capability—discovery.

---

## What TPMJS Actually Is

TPMJS is infrastructure. Specifically:

1. **A registry** that indexes npm packages designed for AI tool use
2. **A metadata extraction pipeline** that pulls schemas directly from code
3. **A quality scoring system** that ranks tools by completeness and adoption
4. **A health monitoring system** that verifies tools actually work
5. **A playground** where you can test tools before integrating them

It's not magic. It's plumbing. Good plumbing.

---

## How It Works (The Technical Reality)

### Discovery: Finding Tools in the Wild

TPMJS runs three automated sync jobs:

**1. npm Changes Feed (every 2 minutes)**
```
npm registry → /_changes endpoint → filter for tpmjs-tool keyword → process
```
This catches new packages and updates in near-real-time. We track sequence numbers so we never reprocess.

**2. Keyword Search (every 15 minutes)**
```
npm search "tpmjs-tool" → up to 250 results → validate → ingest
```
Backup mechanism. Catches anything the changes feed missed.

**3. Metrics Sync (hourly)**
```
for each package → fetch download stats → recalculate quality scores → update health status
```
Keeps the registry fresh.

### The Publisher Contract

To get indexed, a package needs two things:

```json
{
  "name": "@acme/my-tool",
  "keywords": ["tpmjs-tool"],
  "tpmjs": {
    "category": "web-scraping",
    "description": "Scrapes URLs and returns structured markdown"
  }
}
```

That's the minimum. Category + description. Everything else is either optional or auto-extracted.

**Categories are fixed** (12 total): web-scraping, data-processing, file-operations, communication, database, api-integration, image-processing, text-analysis, automation, ai-ml, security, monitoring.

Why fixed? Because agents need to filter. "Give me all database tools" has to mean something.

### Schema Extraction: The Hard Part

Here's what makes TPMJS different from a glorified npm search.

When we ingest a package, we don't just read the README. We **execute it in a sandbox** and extract the actual schema:

```
1. Spin up isolated executor (Railway)
2. npm install the package
3. Import and inspect exports
4. Extract JSON Schema from TypeScript types
5. Store schema in database
```

The result:

```json
{
  "name": "scrapeUrl",
  "inputSchema": {
    "type": "object",
    "properties": {
      "url": { "type": "string", "format": "uri" },
      "waitForSelector": { "type": "string" },
      "timeout": { "type": "number", "default": 30000 }
    },
    "required": ["url"]
  }
}
```

This isn't documentation. This is **extracted from the actual function signature**. It's ground truth.

If the author provides a schema in the `tpmjs` field, we use that. If not, we extract it. Either way, every tool in the registry has a schema.

### Quality Scoring: Ranking What Matters

Every tool gets a score from 0.00 to 1.00:

```typescript
// Base score from metadata completeness
const tierScore = tier === 'rich' ? 0.6 : 0.4;

// Adoption signals
const downloadsScore = Math.min(0.2, Math.log10(downloads + 1) / 15);
const starsScore = Math.min(0.1, Math.log10(githubStars + 1) / 10);

// Metadata richness bonus
let richnessScore = 0;
if (hasParameters) richnessScore += 0.04;
if (hasReturns) richnessScore += 0.03;
if (hasEnvVars) richnessScore += 0.03;
```

**Tier** is binary:
- **Minimal**: Just category + description (40% base)
- **Rich**: Has parameters, returns, env vars, or framework tags (60% base)

The formula is deliberately simple. We're not trying to be clever. We're trying to surface tools that are well-documented and actually used.

### Health Checks: Does It Actually Work?

Two checks, run during sync and periodically:

**1. Import Health**
```
Can we require() this package without it exploding?
```
You'd be surprised how many npm packages fail this.

**2. Execution Health**
```
Can we call the main function with minimal parameters without throwing?
```
Not a full test suite. Just "does it run at all?"

Results: `HEALTHY`, `BROKEN`, or `UNKNOWN`.

Broken tools still appear in the registry (with a warning). We don't hide them—we label them.

---

## The Data Model

Here's what we actually store:

### Package (npm package level)
```
npmPackageName (unique)
npmVersion, npmDescription, npmRepository, npmLicense
npmKeywords[], npmReadme, npmAuthor
category (enum)
tier ('minimal' | 'rich')
discoveryMethod ('changes-feed' | 'keyword')
npmDownloadsLastMonth, githubStars
frameworks[] (vercel-ai, langchain, etc.)
env[] (required environment variables)
```

### Tool (individual callable within a package)
```
packageId (FK)
name (export name: "scrapeUrl", "default", etc.)
description
inputSchema (JSON Schema)
schemaSource ('extracted' | 'author')
qualityScore (0.00-1.00)
importHealth, executionHealth (HEALTHY | BROKEN | UNKNOWN)
toolDiscoverySource ('auto' | 'manual')
```

One package can have multiple tools. `@acme/web-tools` might export `scrapeUrl`, `screenshotPage`, and `extractLinks`. Each is a separate tool with its own schema and health status.

### Simulation (playground execution)
```
toolId
userPrompt (what the user asked)
parameters (JSON, what was passed to the tool)
status (pending | running | success | error | timeout)
executionTimeMs, output, error
model, agentSteps
```

We track every playground execution. Not for surveillance—for debugging and improving the system.

---

## The API

### Search & Discovery

```
GET /api/tools
  ?q=scrape
  &category=web-scraping
  &importHealth=HEALTHY
  &executionHealth=HEALTHY
  &limit=20
  &offset=0

→ Returns tools sorted by quality score
```

```
GET /api/tools/search
  ?q=I need to extract text from PDFs

→ BM25-ranked semantic search
```

### Execution

```
POST /api/tools/execute/{toolId}
{
  "prompt": "Scrape the homepage of Hacker News",
  "parameters": { "url": "https://news.ycombinator.com" }
}

→ Server-Sent Events stream with:
   - Agent reasoning steps
   - Tool call results
   - Final output
```

Rate limited: 10 requests per IP per hour. We're not a free compute platform.

### Schema Operations

```
POST /api/tools/extract-schema
{ "packageName": "@acme/my-tool", "toolName": "scrapeUrl" }

→ Forces re-extraction of schema from source
```

---

## The Playground

A Next.js app where you can:

1. **Browse tools** by category, health status, quality score
2. **Inspect schemas** before you commit to anything
3. **Test execution** with an AI agent
4. **See real responses** with actual latency and token usage

It's not a demo. It's a debugging tool. "Does this tool do what I think it does?" Answer that question in 30 seconds instead of 30 minutes.

---

## What This Enables

### For Engineers Building Agents

Before TPMJS:
```
1. Search npm for "web scraper"
2. Get 500 results
3. Click through 20 of them
4. Read READMEs that say "easy to use!"
5. npm install three of them
6. Write test code for each
7. Find out two are broken
8. Pick the one that works
9. Hope it keeps working
```

After TPMJS:
```
1. Search tpmjs.com for "web scraper"
2. Filter by HEALTHY status
3. Sort by quality score
4. Click top result
5. See exact input schema
6. Test in playground
7. Integrate
```

### For Tool Authors

Before TPMJS:
```
Publish to npm → hope someone finds it → no visibility into usage
```

After TPMJS:
```
Publish to npm with tpmjs-tool keyword → indexed within 2 minutes →
schema auto-extracted → quality scored → discoverable by search →
execution stats tracked
```

Your tool becomes findable. Not just by humans grepping npm, but by agents querying the registry API.

### For Agents (Yes, Really)

Agents can query TPMJS at runtime:

```typescript
const tools = await fetch('https://tpmjs.com/api/tools?' + new URLSearchParams({
  q: 'send email',
  executionHealth: 'HEALTHY',
  limit: '5'
})).then(r => r.json());

// Agent now has 5 working email tools with full schemas
// It can pick the best one for this specific task
```

This is the endgame. Not humans browsing a registry—agents dynamically selecting tools based on capability, health, and fit.

---

## What TPMJS Is Not

**Not a package manager.** We don't host packages. npm does that. We index and enrich.

**Not an execution platform.** The playground runs tools for testing. Production execution is your responsibility.

**Not a security guarantee.** We check if tools work. We don't audit them for malice. Same rules as npm: don't run untrusted code.

**Not magic.** We're not using AI to understand what tools do. We're extracting schemas and running health checks. Boring, reliable, debuggable.

---

## The Technical Stack

- **Database**: PostgreSQL via Prisma
- **Web**: Next.js 16 (App Router)
- **Deployment**: Vercel (web) + Railway (sandbox executor)
- **Sync**: Vercel Cron + GitHub Actions backup
- **AI**: Vercel AI SDK for playground execution
- **Monorepo**: Turborepo + pnpm

Key internal packages:
- `@tpmjs/npm-client` — npm registry integration
- `@tpmjs/package-executor` — sandbox execution client
- `@tpmjs/types` — schema validation and migration
- `@tpmjs/db` — Prisma client and models

---

## Current State

- **~100 tools indexed** (and growing with every npm publish)
- **12 categories** covering most agent use cases
- **Automated sync** running 24/7
- **Health checks** on every tool
- **Schema extraction** working for TypeScript and JavaScript
- **Playground** functional for testing

---

## The Pitch (Finally)

Tools are the API surface of AI agents. The ecosystem is a mess. TPMJS is the index.

We don't compete with npm—we sit on top of it. We don't replace tool authors—we make them discoverable. We don't build agents—we give agents a way to find their tools.

Discovery is the bottleneck. We're fixing discovery.

---

## Try It

- **Browse**: https://tpmjs.com/tool-search
- **Playground**: https://tpmjs.com/playground
- **Publish**: Add `tpmjs-tool` keyword + `tpmjs` field to your package.json
- **API**: `GET https://tpmjs.com/api/tools`

---

*Tools are inevitable. Discovery chaos isn't.*
