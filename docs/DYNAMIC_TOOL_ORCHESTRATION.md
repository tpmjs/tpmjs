# Dynamic Multi-Tool Orchestration

A comprehensive exploration of generating and executing complex multi-step tool plans from natural language queries using the TPMJS registry.

---

## Table of Contents

1. [Vision](#vision)
2. [Core Concepts](#core-concepts)
3. [Plan Generation Architecture](#plan-generation-architecture)
4. [The Y×X Framework](#the-yx-framework)
5. [Plan Schema Design](#plan-schema-design)
6. [Execution Strategies](#execution-strategies)
7. [Complex Task Examples](#complex-task-examples)
8. [Tool Discovery & Selection](#tool-discovery--selection)
9. [Context & State Management](#context--state-management)
10. [Error Handling & Recovery](#error-handling--recovery)
11. [Optimization Techniques](#optimization-techniques)
12. [Security Considerations](#security-considerations)
13. [Implementation Roadmap](#implementation-roadmap)

---

## Vision

Traditional AI tool use requires developers to predefine which tools an agent can access at build time. TPMJS flips this paradigm: **tools are discovered and loaded dynamically from a live registry at runtime**.

This unlocks a new capability: **for any sufficiently complex user query, we can generate Y alternative execution plans, each containing X sequential tool invocations, all loaded dynamically from the registry**.

### The Power of Dynamic Orchestration

```
User Query: "Analyze my competitor's landing page and create a better version"

Plan A (5 steps):
  1. web-scraper → Extract competitor's page HTML
  2. html-to-markdown → Convert to readable format
  3. sentiment-analyzer → Analyze copy tone
  4. color-extractor → Extract design palette
  5. landing-page-generator → Generate improved version

Plan B (7 steps):
  1. screenshot-tool → Capture visual snapshot
  2. image-to-text → OCR any text content
  3. seo-analyzer → Check SEO structure
  4. competitor-analyzer → Compare against benchmarks
  5. copywriting-assistant → Generate new copy
  6. tailwind-generator → Create component code
  7. preview-renderer → Generate preview image

Plan C (3 steps):
  1. full-page-analyzer → Comprehensive page analysis
  2. ai-designer → Generate complete redesign
  3. code-exporter → Export to framework of choice
```

The user chooses their preferred approach, or the system auto-selects based on available tools, cost, and reliability.

---

## Core Concepts

### 1. Tool as a Unit of Work

A **tool** in TPMJS is an atomic unit of computation that:
- Has well-defined inputs (parameters with types)
- Produces a specific output (return type)
- Is self-documenting (description, use cases, examples)
- Runs in isolation (sandboxed execution)

```typescript
// Tool metadata structure
interface Tool {
  exportName: string;
  description: string;
  parameters: Parameter[];
  returns: ReturnType;
  aiAgent?: {
    useCase: string;
    limitations?: string;
    examples?: string[];
  };
}
```

### 2. Plan as a Directed Acyclic Graph (DAG)

A **plan** is not just a linear sequence—it's a DAG where:
- Nodes are tool invocations
- Edges represent data dependencies
- Parallel branches can execute concurrently
- Convergence points combine results

```
        ┌─────────────┐
        │   INPUT     │
        └──────┬──────┘
               │
        ┌──────▼──────┐
        │  Tool A     │
        └──────┬──────┘
               │
      ┌────────┴────────┐
      │                 │
┌─────▼─────┐     ┌─────▼─────┐
│  Tool B   │     │  Tool C   │  ← Parallel execution
└─────┬─────┘     └─────┬─────┘
      │                 │
      └────────┬────────┘
               │
        ┌──────▼──────┐
        │  Tool D     │  ← Combines B + C outputs
        └──────┬──────┘
               │
        ┌──────▼──────┐
        │   OUTPUT    │
        └─────────────┘
```

### 3. Context Window

The **context window** is the accumulated state passed through the plan:
- Original user query
- Intermediate results from each tool
- Extracted entities and references
- Error history and recovery attempts

### 4. Plan Variants (Y)

For any query, we generate **Y alternative plans** that differ in:
- Tool selection (different tools for same subtask)
- Granularity (few powerful tools vs many focused tools)
- Approach (different methodologies)
- Risk profile (proven tools vs experimental tools)
- Cost (token/compute efficient vs thorough)

### 5. Step Count (X)

Each plan has **X sequential steps** where:
- Minimum X: 1 (single tool solves the task)
- Typical X: 3-10 (most workflows)
- Maximum X: 20+ (complex multi-stage pipelines)
- No hard upper limit, but diminishing returns apply

---

## Plan Generation Architecture

### Phase 1: Query Analysis

```typescript
interface QueryAnalysis {
  // What the user wants to accomplish
  intent: string;

  // Extracted entities (URLs, file paths, names, etc.)
  entities: Entity[];

  // Required capabilities to fulfill the request
  requiredCapabilities: Capability[];

  // Constraints mentioned by user
  constraints: {
    format?: string;      // "as JSON", "in markdown"
    style?: string;       // "professional", "casual"
    timeLimit?: number;   // "quickly", "in under a minute"
    quality?: string;     // "high quality", "draft"
  };

  // Ambiguities that need resolution
  ambiguities: string[];

  // Complexity score (1-10)
  complexity: number;
}
```

### Phase 2: Capability Matching

Map required capabilities to available tools:

```typescript
interface CapabilityMatch {
  capability: string;
  matchingTools: Tool[];
  confidence: number;
  alternatives: Tool[];
}

// Example capability matching
const matches = [
  {
    capability: "extract-webpage-content",
    matchingTools: [
      { name: "web-scraper", confidence: 0.95 },
      { name: "puppeteer-extractor", confidence: 0.90 },
      { name: "readability-parser", confidence: 0.85 }
    ]
  },
  {
    capability: "convert-html-to-text",
    matchingTools: [
      { name: "html-to-markdown", confidence: 0.92 },
      { name: "turndown", confidence: 0.88 },
      { name: "html-strip", confidence: 0.70 }
    ]
  }
];
```

### Phase 3: Plan Synthesis

Generate Y distinct plans by varying:

```typescript
interface PlanSynthesisStrategy {
  // Tool selection strategy
  toolSelection:
    | "highest-confidence"   // Use best-matching tools
    | "most-reliable"        // Use tools with best health scores
    | "lowest-cost"          // Minimize token usage
    | "fastest"              // Optimize for speed
    | "most-granular"        // Break into smallest steps
    | "most-consolidated";   // Use fewest powerful tools

  // Parallelization strategy
  parallelization:
    | "maximize"             // Run as much in parallel as possible
    | "sequential"           // Run everything in order
    | "balanced";            // Smart parallelization

  // Error handling strategy
  errorHandling:
    | "fail-fast"            // Stop on first error
    | "best-effort"          // Continue despite errors
    | "with-fallbacks";      // Use alternative tools on failure
}
```

---

## The Y×X Framework

### Defining Y: Number of Alternative Plans

**Factors that increase Y:**
- High ambiguity in user query
- Multiple valid approaches
- Trade-offs between speed/quality/cost
- User hasn't specified preferences

**Typical Y values:**
- Simple queries: Y = 1-2
- Moderate queries: Y = 2-4
- Complex queries: Y = 3-5
- Highly ambiguous: Y = 5-8

### Defining X: Steps per Plan

**Factors that increase X:**
- Task complexity
- Data transformation requirements
- Multiple output formats needed
- Validation/verification steps
- User's quality requirements

**Typical X values:**
- Quick tasks: X = 1-3
- Standard workflows: X = 4-8
- Complex pipelines: X = 8-15
- Enterprise workflows: X = 15-25

### The Y×X Matrix

```
            │  X = 3    │  X = 7    │  X = 12   │  X = 20
────────────┼───────────┼───────────┼───────────┼───────────
Y = 1       │  Simple   │  Standard │  Complex  │  Pipeline
            │  Task     │  Workflow │  Process  │  System
────────────┼───────────┼───────────┼───────────┼───────────
Y = 3       │  Multi-   │  Standard │  Complex  │  Enterprise
            │  Option   │  Options  │  Options  │  Options
────────────┼───────────┼───────────┼───────────┼───────────
Y = 5       │  High     │  High     │  Very     │  Maximum
            │  Choice   │  Flex     │  Complex  │  Flexibility
```

---

## Plan Schema Design

### ExecutionPlan Schema

```typescript
interface ExecutionPlan {
  id: string;
  version: "1.0";

  // Metadata
  metadata: {
    generatedAt: string;
    query: string;
    complexity: number;
    estimatedDuration: number;  // milliseconds
    estimatedCost: number;      // USD
    confidence: number;         // 0-1
  };

  // Plan classification
  classification: {
    approach: string;           // "thorough" | "quick" | "balanced"
    riskLevel: "low" | "medium" | "high";
    parallelizable: boolean;
  };

  // The actual steps
  steps: ExecutionStep[];

  // Expected final output
  expectedOutput: {
    type: string;
    schema?: JSONSchema;
    description: string;
  };
}
```

### ExecutionStep Schema

```typescript
interface ExecutionStep {
  id: string;
  order: number;

  // Tool reference
  tool: {
    packageName: string;
    exportName: string;
    version?: string;
  };

  // Why this step exists
  purpose: string;

  // Input configuration
  input: {
    // Static values
    static?: Record<string, unknown>;

    // References to previous step outputs
    fromStep?: {
      stepId: string;
      path: string;  // JSONPath to extract value
    };

    // References to original query entities
    fromQuery?: {
      entityType: string;
      index?: number;
    };

    // Dynamic values computed at runtime
    computed?: {
      expression: string;
      dependencies: string[];
    };
  };

  // Output expectations
  output: {
    type: string;
    storeAs: string;  // Variable name in context
    validate?: ValidationRule[];
  };

  // Execution configuration
  execution: {
    timeout: number;
    retries: number;
    canSkipOnError: boolean;
    fallbackTools?: string[];
  };

  // Dependencies
  dependsOn: string[];  // Step IDs that must complete first

  // Enables parallel execution with other steps
  parallelGroup?: string;
}
```

### Example: Full Plan JSON

```json
{
  "id": "plan_abc123",
  "version": "1.0",
  "metadata": {
    "generatedAt": "2024-01-15T10:30:00Z",
    "query": "Scrape the product listings from example.com/products, extract prices, and create a price comparison spreadsheet",
    "complexity": 6,
    "estimatedDuration": 45000,
    "estimatedCost": 0.12,
    "confidence": 0.87
  },
  "classification": {
    "approach": "thorough",
    "riskLevel": "low",
    "parallelizable": true
  },
  "steps": [
    {
      "id": "step_1",
      "order": 1,
      "tool": {
        "packageName": "tpmjs-web-scraper",
        "exportName": "scrapeUrl"
      },
      "purpose": "Fetch the product listings page HTML",
      "input": {
        "static": {
          "waitForSelector": ".product-card",
          "timeout": 10000
        },
        "fromQuery": {
          "entityType": "url",
          "index": 0
        }
      },
      "output": {
        "type": "string",
        "storeAs": "rawHtml",
        "validate": [
          { "rule": "minLength", "value": 1000 }
        ]
      },
      "execution": {
        "timeout": 15000,
        "retries": 2,
        "canSkipOnError": false,
        "fallbackTools": ["puppeteer-scraper", "playwright-fetch"]
      },
      "dependsOn": []
    },
    {
      "id": "step_2",
      "order": 2,
      "tool": {
        "packageName": "tpmjs-html-parser",
        "exportName": "extractElements"
      },
      "purpose": "Extract product cards from the HTML",
      "input": {
        "fromStep": {
          "stepId": "step_1",
          "path": "$.rawHtml"
        },
        "static": {
          "selector": ".product-card",
          "attributes": ["data-name", "data-price", "data-sku"]
        }
      },
      "output": {
        "type": "array",
        "storeAs": "productElements"
      },
      "execution": {
        "timeout": 5000,
        "retries": 1,
        "canSkipOnError": false
      },
      "dependsOn": ["step_1"]
    },
    {
      "id": "step_3a",
      "order": 3,
      "tool": {
        "packageName": "tpmjs-price-extractor",
        "exportName": "extractPrices"
      },
      "purpose": "Parse and normalize price values",
      "input": {
        "fromStep": {
          "stepId": "step_2",
          "path": "$.productElements[*].data-price"
        },
        "static": {
          "currency": "USD",
          "handleRanges": true
        }
      },
      "output": {
        "type": "array",
        "storeAs": "normalizedPrices"
      },
      "execution": {
        "timeout": 3000,
        "retries": 1,
        "canSkipOnError": false
      },
      "dependsOn": ["step_2"],
      "parallelGroup": "data_processing"
    },
    {
      "id": "step_3b",
      "order": 3,
      "tool": {
        "packageName": "tpmjs-text-cleaner",
        "exportName": "cleanProductNames"
      },
      "purpose": "Clean and normalize product names",
      "input": {
        "fromStep": {
          "stepId": "step_2",
          "path": "$.productElements[*].data-name"
        }
      },
      "output": {
        "type": "array",
        "storeAs": "cleanedNames"
      },
      "execution": {
        "timeout": 2000,
        "retries": 1,
        "canSkipOnError": true
      },
      "dependsOn": ["step_2"],
      "parallelGroup": "data_processing"
    },
    {
      "id": "step_4",
      "order": 4,
      "tool": {
        "packageName": "tpmjs-data-merger",
        "exportName": "mergeArrays"
      },
      "purpose": "Combine prices and names into product objects",
      "input": {
        "fromStep": [
          { "stepId": "step_3a", "path": "$.normalizedPrices" },
          { "stepId": "step_3b", "path": "$.cleanedNames" }
        ],
        "static": {
          "keys": ["price", "name"]
        }
      },
      "output": {
        "type": "array",
        "storeAs": "products"
      },
      "execution": {
        "timeout": 2000,
        "retries": 1,
        "canSkipOnError": false
      },
      "dependsOn": ["step_3a", "step_3b"]
    },
    {
      "id": "step_5",
      "order": 5,
      "tool": {
        "packageName": "tpmjs-spreadsheet-generator",
        "exportName": "createXlsx"
      },
      "purpose": "Generate Excel spreadsheet with price comparison",
      "input": {
        "fromStep": {
          "stepId": "step_4",
          "path": "$.products"
        },
        "static": {
          "sheetName": "Price Comparison",
          "columns": [
            { "header": "Product Name", "key": "name", "width": 40 },
            { "header": "Price (USD)", "key": "price", "width": 15, "format": "currency" }
          ],
          "includeStats": true,
          "sortBy": "price"
        }
      },
      "output": {
        "type": "buffer",
        "storeAs": "spreadsheet"
      },
      "execution": {
        "timeout": 5000,
        "retries": 1,
        "canSkipOnError": false
      },
      "dependsOn": ["step_4"]
    }
  ],
  "expectedOutput": {
    "type": "file",
    "schema": {
      "format": "xlsx",
      "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    },
    "description": "Excel spreadsheet containing product names and prices, sorted by price with summary statistics"
  }
}
```

---

## Execution Strategies

### 1. Sequential Execution

Execute steps one at a time in order:

```typescript
async function executeSequential(plan: ExecutionPlan): Promise<Result> {
  const context = new ExecutionContext();

  for (const step of plan.steps) {
    const result = await executeStep(step, context);
    context.store(step.output.storeAs, result);
  }

  return context.getFinalOutput();
}
```

**Pros:** Simple, predictable, easy to debug
**Cons:** Slow, doesn't utilize parallelization opportunities

### 2. Parallel Execution with Dependencies

Execute steps as soon as their dependencies are satisfied:

```typescript
async function executeParallel(plan: ExecutionPlan): Promise<Result> {
  const context = new ExecutionContext();
  const completed = new Set<string>();
  const inProgress = new Map<string, Promise<void>>();

  async function canExecute(step: ExecutionStep): boolean {
    return step.dependsOn.every(dep => completed.has(dep));
  }

  async function executeWhenReady(step: ExecutionStep): Promise<void> {
    // Wait for dependencies
    await Promise.all(
      step.dependsOn.map(dep => inProgress.get(dep))
    );

    const result = await executeStep(step, context);
    context.store(step.output.storeAs, result);
    completed.add(step.id);
  }

  // Start all steps, they'll wait for their dependencies
  const promises = plan.steps.map(step => {
    const promise = executeWhenReady(step);
    inProgress.set(step.id, promise);
    return promise;
  });

  await Promise.all(promises);
  return context.getFinalOutput();
}
```

**Pros:** Fast, maximizes throughput
**Cons:** Complex state management, harder to debug

### 3. Streaming Execution

Stream results as they become available:

```typescript
async function* executeStreaming(
  plan: ExecutionPlan
): AsyncGenerator<StepResult> {
  const context = new ExecutionContext();

  for (const step of plan.steps) {
    yield { type: 'step_start', stepId: step.id };

    try {
      const result = await executeStep(step, context);
      context.store(step.output.storeAs, result);

      yield {
        type: 'step_complete',
        stepId: step.id,
        result: summarize(result)
      };
    } catch (error) {
      yield {
        type: 'step_error',
        stepId: step.id,
        error: error.message
      };

      if (!step.execution.canSkipOnError) {
        throw error;
      }
    }
  }

  yield {
    type: 'plan_complete',
    output: context.getFinalOutput()
  };
}
```

**Pros:** Real-time feedback, good UX
**Cons:** Complexity in client handling

### 4. Checkpoint Execution

Save state after each step for resumability:

```typescript
async function executeWithCheckpoints(
  plan: ExecutionPlan,
  checkpoint?: Checkpoint
): Promise<Result> {
  const context = checkpoint?.context ?? new ExecutionContext();
  const startIndex = checkpoint?.lastCompletedStep ?? 0;

  for (let i = startIndex; i < plan.steps.length; i++) {
    const step = plan.steps[i];

    try {
      const result = await executeStep(step, context);
      context.store(step.output.storeAs, result);

      // Save checkpoint
      await saveCheckpoint({
        planId: plan.id,
        lastCompletedStep: i + 1,
        context: context.serialize()
      });
    } catch (error) {
      // Checkpoint saved, can resume from here
      throw new ResumableError(error, i, context);
    }
  }

  return context.getFinalOutput();
}
```

**Pros:** Resilient, can resume after failures
**Cons:** Storage overhead, checkpoint management

---

## Complex Task Examples

### Example 1: Content Marketing Pipeline (12 steps)

**User Query:** "Research trending topics in AI, write a blog post, create social media content, and generate promotional images"

```yaml
Plan: Content Marketing Pipeline
Steps: 12
Estimated Duration: 3-5 minutes
Estimated Cost: $0.45

Step 1: trending-topics-analyzer
  Purpose: Find trending AI topics from multiple sources
  Input: { domain: "artificial-intelligence", sources: ["reddit", "hackernews", "twitter"] }
  Output: trendingTopics[]

Step 2: topic-scorer
  Purpose: Score topics by relevance and engagement potential
  Input: { topics: $trendingTopics, criteria: ["novelty", "engagement", "relevance"] }
  Output: scoredTopics[]

Step 3: topic-selector
  Purpose: Select best topic for blog post
  Input: { topics: $scoredTopics, count: 1 }
  Output: selectedTopic

Step 4: research-aggregator
  Purpose: Gather research materials on selected topic
  Input: { topic: $selectedTopic, depth: "comprehensive" }
  Output: researchMaterials

Step 5: outline-generator
  Purpose: Create blog post outline
  Input: { topic: $selectedTopic, research: $researchMaterials, style: "informative" }
  Output: blogOutline

Step 6: blog-writer
  Purpose: Write full blog post from outline
  Input: { outline: $blogOutline, wordCount: 1500, tone: "professional" }
  Output: blogPost

Step 7: seo-optimizer
  Purpose: Optimize blog post for search engines
  Input: { content: $blogPost, targetKeywords: $selectedTopic.keywords }
  Output: optimizedBlogPost

Step 8: twitter-thread-generator (parallel group: social)
  Purpose: Create Twitter thread from blog post
  Input: { content: $optimizedBlogPost, maxTweets: 10 }
  Output: twitterThread

Step 9: linkedin-post-generator (parallel group: social)
  Purpose: Create LinkedIn post from blog post
  Input: { content: $optimizedBlogPost, format: "professional" }
  Output: linkedinPost

Step 10: image-prompt-generator
  Purpose: Generate prompts for promotional images
  Input: { content: $optimizedBlogPost, count: 3, style: "modern-tech" }
  Output: imagePrompts[]

Step 11: image-generator
  Purpose: Generate promotional images
  Input: { prompts: $imagePrompts, size: "1200x630", style: "blog-header" }
  Output: images[]

Step 12: content-package-assembler
  Purpose: Assemble final content package
  Input: {
    blog: $optimizedBlogPost,
    twitter: $twitterThread,
    linkedin: $linkedinPost,
    images: $images
  }
  Output: contentPackage
```

### Example 2: Code Repository Analysis (15 steps)

**User Query:** "Analyze my GitHub repository, identify security vulnerabilities, generate documentation, and create a README"

```yaml
Plan: Repository Analysis Pipeline
Steps: 15
Estimated Duration: 5-8 minutes
Estimated Cost: $0.75

Step 1: github-repo-fetcher
  Purpose: Clone and fetch repository metadata
  Input: { repoUrl: $userProvidedUrl }
  Output: repoData

Step 2: language-detector
  Purpose: Detect programming languages used
  Input: { files: $repoData.files }
  Output: languages[]

Step 3: dependency-extractor
  Purpose: Extract all dependencies
  Input: { repoData: $repoData, languages: $languages }
  Output: dependencies[]

Step 4: vulnerability-scanner (parallel group: analysis)
  Purpose: Scan dependencies for known vulnerabilities
  Input: { dependencies: $dependencies }
  Output: vulnerabilities[]

Step 5: code-quality-analyzer (parallel group: analysis)
  Purpose: Analyze code quality metrics
  Input: { repoData: $repoData, languages: $languages }
  Output: qualityMetrics

Step 6: architecture-detector (parallel group: analysis)
  Purpose: Detect architectural patterns
  Input: { repoData: $repoData }
  Output: architecture

Step 7: api-endpoint-extractor
  Purpose: Extract API endpoints if present
  Input: { repoData: $repoData, languages: $languages }
  Output: apiEndpoints[]

Step 8: function-documenter
  Purpose: Generate function documentation
  Input: { repoData: $repoData, languages: $languages }
  Output: functionDocs[]

Step 9: api-documenter
  Purpose: Generate API documentation
  Input: { endpoints: $apiEndpoints }
  Output: apiDocs

Step 10: security-report-generator
  Purpose: Generate security report
  Input: { vulnerabilities: $vulnerabilities, dependencies: $dependencies }
  Output: securityReport

Step 11: architecture-diagram-generator
  Purpose: Generate architecture diagram
  Input: { architecture: $architecture }
  Output: architectureDiagram

Step 12: badge-generator
  Purpose: Generate README badges
  Input: {
    languages: $languages,
    qualityMetrics: $qualityMetrics,
    vulnerabilities: $vulnerabilities
  }
  Output: badges[]

Step 13: readme-generator
  Purpose: Generate comprehensive README
  Input: {
    repoData: $repoData,
    architecture: $architecture,
    apiDocs: $apiDocs,
    badges: $badges
  }
  Output: readme

Step 14: changelog-generator
  Purpose: Generate CHANGELOG from commits
  Input: { repoData: $repoData }
  Output: changelog

Step 15: documentation-packager
  Purpose: Package all documentation
  Input: {
    readme: $readme,
    apiDocs: $apiDocs,
    functionDocs: $functionDocs,
    securityReport: $securityReport,
    changelog: $changelog,
    diagrams: [$architectureDiagram]
  }
  Output: documentationPackage
```

### Example 3: E-commerce Product Launch (20 steps)

**User Query:** "I'm launching a new product. Create product descriptions, generate images, write email campaigns, set up social media posts, and prepare a launch checklist"

```yaml
Plan: Product Launch Pipeline
Steps: 20
Estimated Duration: 10-15 minutes
Estimated Cost: $1.50

Step 1: product-info-parser
  Purpose: Parse and structure product information
  Input: { rawProductInfo: $userInput }
  Output: structuredProduct

Step 2: market-researcher
  Purpose: Research target market and competitors
  Input: { product: $structuredProduct }
  Output: marketResearch

Step 3: persona-generator
  Purpose: Generate buyer personas
  Input: { product: $structuredProduct, marketResearch: $marketResearch }
  Output: buyerPersonas[]

Step 4: unique-selling-points-extractor
  Purpose: Identify unique selling points
  Input: { product: $structuredProduct, marketResearch: $marketResearch }
  Output: usps[]

Step 5: product-description-writer
  Purpose: Write main product description
  Input: { product: $structuredProduct, usps: $usps, personas: $buyerPersonas }
  Output: productDescription

Step 6: short-description-writer (parallel group: descriptions)
  Purpose: Write short product description
  Input: { fullDescription: $productDescription }
  Output: shortDescription

Step 7: bullet-points-generator (parallel group: descriptions)
  Purpose: Generate feature bullet points
  Input: { product: $structuredProduct, usps: $usps }
  Output: bulletPoints[]

Step 8: seo-keywords-generator
  Purpose: Generate SEO keywords
  Input: { product: $structuredProduct, marketResearch: $marketResearch }
  Output: seoKeywords[]

Step 9: product-image-prompt-generator
  Purpose: Generate prompts for product images
  Input: { product: $structuredProduct, count: 5 }
  Output: imagePrompts[]

Step 10: product-image-generator
  Purpose: Generate product images
  Input: { prompts: $imagePrompts }
  Output: productImages[]

Step 11: email-sequence-planner
  Purpose: Plan email marketing sequence
  Input: { product: $structuredProduct, personas: $buyerPersonas }
  Output: emailSequencePlan

Step 12: welcome-email-writer (parallel group: emails)
  Purpose: Write welcome/announcement email
  Input: { plan: $emailSequencePlan, product: $structuredProduct }
  Output: welcomeEmail

Step 13: launch-email-writer (parallel group: emails)
  Purpose: Write launch day email
  Input: { plan: $emailSequencePlan, product: $structuredProduct, usps: $usps }
  Output: launchEmail

Step 14: followup-email-writer (parallel group: emails)
  Purpose: Write follow-up email
  Input: { plan: $emailSequencePlan, product: $structuredProduct }
  Output: followupEmail

Step 15: social-media-calendar-generator
  Purpose: Generate social media posting calendar
  Input: { product: $structuredProduct, launchDate: $userInput.launchDate }
  Output: socialCalendar

Step 16: instagram-posts-generator (parallel group: social)
  Purpose: Generate Instagram post content
  Input: { calendar: $socialCalendar, images: $productImages }
  Output: instagramPosts[]

Step 17: twitter-posts-generator (parallel group: social)
  Purpose: Generate Twitter post content
  Input: { calendar: $socialCalendar, product: $structuredProduct }
  Output: twitterPosts[]

Step 18: facebook-posts-generator (parallel group: social)
  Purpose: Generate Facebook post content
  Input: { calendar: $socialCalendar, product: $structuredProduct }
  Output: facebookPosts[]

Step 19: launch-checklist-generator
  Purpose: Generate comprehensive launch checklist
  Input: {
    product: $structuredProduct,
    emails: [$welcomeEmail, $launchEmail, $followupEmail],
    socialPosts: { instagram: $instagramPosts, twitter: $twitterPosts, facebook: $facebookPosts }
  }
  Output: launchChecklist

Step 20: launch-kit-assembler
  Purpose: Assemble complete launch kit
  Input: {
    product: $structuredProduct,
    descriptions: { full: $productDescription, short: $shortDescription, bullets: $bulletPoints },
    images: $productImages,
    emails: { welcome: $welcomeEmail, launch: $launchEmail, followup: $followupEmail },
    social: { instagram: $instagramPosts, twitter: $twitterPosts, facebook: $facebookPosts },
    checklist: $launchChecklist,
    seo: $seoKeywords
  }
  Output: launchKit
```

### Example 4: Data Pipeline (18 steps)

**User Query:** "Pull data from our API, clean it, run analytics, generate visualizations, and create a PDF report"

```yaml
Plan: Data Analytics Pipeline
Steps: 18
Estimated Duration: 8-12 minutes
Estimated Cost: $0.90

Step 1: api-data-fetcher
  Purpose: Fetch data from user's API
  Input: { endpoint: $userInput.apiEndpoint, auth: $userInput.apiKey }
  Output: rawData

Step 2: data-validator
  Purpose: Validate data structure and completeness
  Input: { data: $rawData }
  Output: validationReport

Step 3: null-handler
  Purpose: Handle missing values
  Input: { data: $rawData, strategy: "smart-impute" }
  Output: dataWithoutNulls

Step 4: outlier-detector
  Purpose: Detect and flag outliers
  Input: { data: $dataWithoutNulls }
  Output: outlierReport

Step 5: data-normalizer
  Purpose: Normalize numerical columns
  Input: { data: $dataWithoutNulls }
  Output: normalizedData

Step 6: feature-engineer
  Purpose: Create derived features
  Input: { data: $normalizedData }
  Output: enrichedData

Step 7: descriptive-stats-calculator (parallel group: analytics)
  Purpose: Calculate descriptive statistics
  Input: { data: $enrichedData }
  Output: descriptiveStats

Step 8: correlation-analyzer (parallel group: analytics)
  Purpose: Analyze correlations
  Input: { data: $enrichedData }
  Output: correlationMatrix

Step 9: trend-analyzer (parallel group: analytics)
  Purpose: Identify trends over time
  Input: { data: $enrichedData, timeColumn: $userInput.timeColumn }
  Output: trendAnalysis

Step 10: segmentation-analyzer (parallel group: analytics)
  Purpose: Perform customer/data segmentation
  Input: { data: $enrichedData }
  Output: segments

Step 11: summary-chart-generator (parallel group: viz)
  Purpose: Generate summary charts
  Input: { stats: $descriptiveStats }
  Output: summaryCharts[]

Step 12: correlation-heatmap-generator (parallel group: viz)
  Purpose: Generate correlation heatmap
  Input: { matrix: $correlationMatrix }
  Output: correlationHeatmap

Step 13: trend-chart-generator (parallel group: viz)
  Purpose: Generate trend visualizations
  Input: { trends: $trendAnalysis }
  Output: trendCharts[]

Step 14: segment-chart-generator (parallel group: viz)
  Purpose: Generate segmentation visualizations
  Input: { segments: $segments }
  Output: segmentCharts[]

Step 15: insight-generator
  Purpose: Generate key insights from analysis
  Input: {
    stats: $descriptiveStats,
    correlations: $correlationMatrix,
    trends: $trendAnalysis,
    segments: $segments
  }
  Output: insights[]

Step 16: executive-summary-writer
  Purpose: Write executive summary
  Input: { insights: $insights, validationReport: $validationReport }
  Output: executiveSummary

Step 17: report-compiler
  Purpose: Compile full report content
  Input: {
    summary: $executiveSummary,
    stats: $descriptiveStats,
    insights: $insights,
    outliers: $outlierReport
  }
  Output: reportContent

Step 18: pdf-generator
  Purpose: Generate final PDF report
  Input: {
    content: $reportContent,
    charts: [...$summaryCharts, $correlationHeatmap, ...$trendCharts, ...$segmentCharts],
    template: "analytics-report"
  }
  Output: pdfReport
```

### Example 5: Website Audit (22 steps)

**User Query:** "Perform a complete audit of my website including SEO, performance, accessibility, and security, then generate a prioritized action plan"

```yaml
Plan: Comprehensive Website Audit
Steps: 22
Estimated Duration: 15-20 minutes
Estimated Cost: $2.00

# Discovery Phase
Step 1: sitemap-discoverer
  Purpose: Discover all pages on the website
  Input: { url: $userInput.websiteUrl }
  Output: sitemap

Step 2: page-fetcher
  Purpose: Fetch all pages for analysis
  Input: { sitemap: $sitemap, maxPages: 50 }
  Output: pages[]

# SEO Analysis (parallel group: seo)
Step 3: meta-tag-analyzer
  Purpose: Analyze meta tags across all pages
  Input: { pages: $pages }
  Output: metaTagReport

Step 4: heading-structure-analyzer
  Purpose: Analyze heading hierarchy
  Input: { pages: $pages }
  Output: headingReport

Step 5: internal-link-analyzer
  Purpose: Analyze internal linking structure
  Input: { pages: $pages, sitemap: $sitemap }
  Output: internalLinkReport

Step 6: keyword-density-analyzer
  Purpose: Analyze keyword usage
  Input: { pages: $pages }
  Output: keywordReport

Step 7: schema-markup-checker
  Purpose: Check structured data markup
  Input: { pages: $pages }
  Output: schemaReport

# Performance Analysis (parallel group: performance)
Step 8: page-speed-analyzer
  Purpose: Analyze page load speeds
  Input: { pages: $pages }
  Output: speedReport

Step 9: asset-analyzer
  Purpose: Analyze images, scripts, stylesheets
  Input: { pages: $pages }
  Output: assetReport

Step 10: core-web-vitals-checker
  Purpose: Check Core Web Vitals metrics
  Input: { pages: $pages }
  Output: webVitalsReport

# Accessibility Analysis (parallel group: accessibility)
Step 11: wcag-checker
  Purpose: Check WCAG compliance
  Input: { pages: $pages }
  Output: wcagReport

Step 12: color-contrast-checker
  Purpose: Check color contrast ratios
  Input: { pages: $pages }
  Output: contrastReport

Step 13: alt-text-checker
  Purpose: Check image alt text
  Input: { pages: $pages }
  Output: altTextReport

Step 14: keyboard-nav-checker
  Purpose: Check keyboard navigation
  Input: { pages: $pages }
  Output: keyboardReport

# Security Analysis (parallel group: security)
Step 15: ssl-checker
  Purpose: Check SSL/TLS configuration
  Input: { url: $userInput.websiteUrl }
  Output: sslReport

Step 16: header-security-checker
  Purpose: Check security headers
  Input: { pages: $pages }
  Output: securityHeadersReport

Step 17: vulnerability-scanner
  Purpose: Scan for common vulnerabilities
  Input: { url: $userInput.websiteUrl }
  Output: vulnerabilityReport

# Report Generation
Step 18: seo-score-calculator
  Purpose: Calculate overall SEO score
  Input: { reports: [$metaTagReport, $headingReport, $internalLinkReport, $keywordReport, $schemaReport] }
  Output: seoScore

Step 19: performance-score-calculator
  Purpose: Calculate overall performance score
  Input: { reports: [$speedReport, $assetReport, $webVitalsReport] }
  Output: performanceScore

Step 20: accessibility-score-calculator
  Purpose: Calculate overall accessibility score
  Input: { reports: [$wcagReport, $contrastReport, $altTextReport, $keyboardReport] }
  Output: accessibilityScore

Step 21: action-plan-generator
  Purpose: Generate prioritized action plan
  Input: {
    seo: { score: $seoScore, reports: [$metaTagReport, $headingReport, $internalLinkReport, $keywordReport, $schemaReport] },
    performance: { score: $performanceScore, reports: [$speedReport, $assetReport, $webVitalsReport] },
    accessibility: { score: $accessibilityScore, reports: [$wcagReport, $contrastReport, $altTextReport, $keyboardReport] },
    security: { reports: [$sslReport, $securityHeadersReport, $vulnerabilityReport] }
  }
  Output: actionPlan

Step 22: audit-report-generator
  Purpose: Generate comprehensive audit PDF
  Input: {
    sitemap: $sitemap,
    scores: { seo: $seoScore, performance: $performanceScore, accessibility: $accessibilityScore },
    actionPlan: $actionPlan,
    allReports: [...]
  }
  Output: auditReport
```

---

## Tool Discovery & Selection

### Discovery Strategies

#### 1. Semantic Search

Match user intent to tool descriptions using embeddings:

```typescript
interface SemanticSearchResult {
  tool: Tool;
  similarity: number;
  matchedOn: "description" | "useCase" | "examples";
}

async function semanticToolSearch(
  capability: string
): Promise<SemanticSearchResult[]> {
  const embedding = await embed(capability);

  const results = await vectorStore.search({
    vector: embedding,
    topK: 10,
    filter: { healthStatus: "HEALTHY" }
  });

  return results.map(r => ({
    tool: r.metadata.tool,
    similarity: r.score,
    matchedOn: r.metadata.matchField
  }));
}
```

#### 2. Category-Based Search

Navigate the tool taxonomy:

```typescript
const categories = {
  "web-scraping": ["web-scraper", "puppeteer", "playwright", "cheerio"],
  "text-processing": ["markdown-converter", "text-cleaner", "summarizer"],
  "data-transformation": ["json-transformer", "csv-parser", "data-merger"],
  "image-generation": ["dalle", "midjourney", "stable-diffusion"],
  "file-generation": ["pdf-generator", "xlsx-creator", "docx-writer"]
};
```

#### 3. Capability Mapping

Map abstract capabilities to concrete tools:

```typescript
const capabilityMap = {
  "fetch-webpage": {
    primary: "web-scraper",
    alternatives: ["puppeteer-scraper", "playwright-fetch"],
    fallback: "http-fetcher"
  },
  "extract-text": {
    primary: "html-to-markdown",
    alternatives: ["readability", "mozilla-readability"],
    fallback: "html-strip"
  },
  "generate-image": {
    primary: "dalle-3",
    alternatives: ["stable-diffusion", "midjourney-api"],
    fallback: "placeholder-image"
  }
};
```

### Selection Criteria

```typescript
interface SelectionCriteria {
  // Quality metrics
  healthStatus: "HEALTHY";
  qualityScore: { min: 0.7 };

  // Reliability metrics
  successRate: { min: 0.95 };
  avgExecutionTime: { max: 5000 };

  // Cost metrics
  estimatedTokens: { max: 1000 };

  // Compatibility
  inputType: string;
  outputType: string;
}

function selectBestTool(
  capability: string,
  criteria: SelectionCriteria,
  context: ExecutionContext
): Tool {
  const candidates = findToolsForCapability(capability);

  return candidates
    .filter(t => t.healthStatus === criteria.healthStatus)
    .filter(t => t.qualityScore >= criteria.qualityScore.min)
    .filter(t => isCompatible(t, context))
    .sort((a, b) => scoreTool(b, criteria) - scoreTools(a, criteria))
    [0];
}
```

---

## Context & State Management

### Context Structure

```typescript
interface ExecutionContext {
  // Original request
  query: string;
  entities: Entity[];

  // Accumulated state
  variables: Map<string, unknown>;

  // Execution history
  completedSteps: StepResult[];
  currentStep: string | null;

  // Error tracking
  errors: StepError[];
  retryCount: Map<string, number>;

  // Performance tracking
  startTime: number;
  stepTimings: Map<string, number>;
  tokenUsage: TokenUsage;
}
```

### State Transitions

```
┌──────────┐
│  INIT    │
└────┬─────┘
     │ loadPlan()
     ▼
┌──────────┐
│ PLANNING │
└────┬─────┘
     │ validatePlan()
     ▼
┌──────────┐     error
│ RUNNING  │─────────────┐
└────┬─────┘             │
     │                   ▼
     │            ┌──────────┐
     │            │ RETRYING │
     │            └────┬─────┘
     │                 │
     │    ◄────────────┘
     │ allStepsComplete()
     ▼
┌──────────┐
│ COMPLETE │
└──────────┘
```

### Variable Scoping

```typescript
// Global scope - available to all steps
context.global.set("originalQuery", query);
context.global.set("entities", entities);

// Step scope - output of each step
context.step.set("step_1.output", result1);
context.step.set("step_2.output", result2);

// Computed scope - derived values
context.computed.set("combinedResults", merge(result1, result2));
```

### Data Flow Between Steps

```typescript
// Reference previous step output
{
  input: {
    fromStep: {
      stepId: "step_1",
      path: "$.data.items[*].name"  // JSONPath
    }
  }
}

// Reference multiple steps
{
  input: {
    fromSteps: [
      { stepId: "step_1", path: "$.prices", as: "prices" },
      { stepId: "step_2", path: "$.names", as: "names" }
    ]
  }
}

// Computed input
{
  input: {
    computed: {
      expression: "merge($step_1.output, $step_2.output)",
      dependencies: ["step_1", "step_2"]
    }
  }
}
```

---

## Error Handling & Recovery

### Error Types

```typescript
type ExecutionError =
  | { type: "TOOL_NOT_FOUND"; toolName: string }
  | { type: "TOOL_UNHEALTHY"; toolName: string; status: string }
  | { type: "INPUT_VALIDATION"; stepId: string; errors: ValidationError[] }
  | { type: "EXECUTION_TIMEOUT"; stepId: string; timeout: number }
  | { type: "EXECUTION_FAILED"; stepId: string; error: string }
  | { type: "OUTPUT_VALIDATION"; stepId: string; expected: string; received: string }
  | { type: "DEPENDENCY_FAILED"; stepId: string; dependencyId: string };
```

### Recovery Strategies

#### 1. Retry with Backoff

```typescript
async function executeWithRetry(
  step: ExecutionStep,
  context: ExecutionContext
): Promise<unknown> {
  const maxRetries = step.execution.retries;
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await executeStep(step, context);
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await sleep(delay);
      }
    }
  }

  throw lastError;
}
```

#### 2. Fallback Tools

```typescript
async function executeWithFallback(
  step: ExecutionStep,
  context: ExecutionContext
): Promise<unknown> {
  const tools = [
    step.tool,
    ...(step.execution.fallbackTools ?? [])
  ];

  for (const tool of tools) {
    try {
      const modifiedStep = { ...step, tool };
      return await executeStep(modifiedStep, context);
    } catch (error) {
      console.log(`Tool ${tool.exportName} failed, trying fallback...`);
    }
  }

  throw new Error(`All tools failed for step ${step.id}`);
}
```

#### 3. Skip and Continue

```typescript
async function executeWithSkip(
  step: ExecutionStep,
  context: ExecutionContext
): Promise<unknown | null> {
  try {
    return await executeStep(step, context);
  } catch (error) {
    if (step.execution.canSkipOnError) {
      context.errors.push({
        stepId: step.id,
        error: error.message,
        skipped: true
      });
      return null;
    }
    throw error;
  }
}
```

#### 4. Dynamic Re-planning

```typescript
async function executeWithReplanning(
  plan: ExecutionPlan,
  context: ExecutionContext,
  failedStepId: string
): Promise<unknown> {
  // Generate alternative plan for remaining steps
  const remainingSteps = plan.steps.filter(
    s => !context.completedSteps.includes(s.id)
  );

  const alternativePlan = await generateAlternativePlan(
    context.query,
    remainingSteps,
    context.errors
  );

  return executeParallel(alternativePlan);
}
```

---

## Optimization Techniques

### 1. Plan Caching

Cache generated plans for similar queries:

```typescript
const planCache = new LRUCache<string, ExecutionPlan>({
  max: 1000,
  ttl: 1000 * 60 * 60  // 1 hour
});

function getCachedPlan(query: string): ExecutionPlan | null {
  const normalizedQuery = normalize(query);
  const cacheKey = hash(normalizedQuery);
  return planCache.get(cacheKey);
}
```

### 2. Tool Preloading

Preload tools that are likely to be needed:

```typescript
async function preloadTools(plan: ExecutionPlan): Promise<void> {
  const toolNames = plan.steps.map(s => s.tool.packageName);

  await Promise.all(
    toolNames.map(name => warmupTool(name))
  );
}
```

### 3. Parallel Maximization

Identify and execute independent steps in parallel:

```typescript
function findParallelGroups(
  steps: ExecutionStep[]
): ExecutionStep[][] {
  const groups: ExecutionStep[][] = [];
  const completed = new Set<string>();

  while (completed.size < steps.length) {
    const ready = steps.filter(s =>
      !completed.has(s.id) &&
      s.dependsOn.every(d => completed.has(d))
    );

    if (ready.length === 0) break;

    groups.push(ready);
    ready.forEach(s => completed.add(s.id));
  }

  return groups;
}
```

### 4. Result Streaming

Stream partial results as they become available:

```typescript
async function* streamResults(
  plan: ExecutionPlan
): AsyncGenerator<PartialResult> {
  const context = new ExecutionContext();

  for (const step of plan.steps) {
    yield { type: "step_started", stepId: step.id };

    const result = await executeStep(step, context);

    yield {
      type: "step_completed",
      stepId: step.id,
      preview: summarize(result)
    };
  }
}
```

### 5. Cost Optimization

Minimize token usage by selecting efficient tools:

```typescript
function optimizeForCost(
  plan: ExecutionPlan
): ExecutionPlan {
  return {
    ...plan,
    steps: plan.steps.map(step => {
      const alternatives = findAlternativeTools(step.tool);
      const cheapest = alternatives.sort(
        (a, b) => estimateCost(a) - estimateCost(b)
      )[0];

      return { ...step, tool: cheapest };
    })
  };
}
```

---

## Security Considerations

### 1. Input Sanitization

```typescript
function sanitizeInput(input: unknown, schema: JSONSchema): unknown {
  // Remove potentially dangerous fields
  if (typeof input === 'object' && input !== null) {
    const sanitized = { ...input };
    delete sanitized.__proto__;
    delete sanitized.constructor;
    return sanitized;
  }

  // Validate against schema
  const validated = schema.parse(input);
  return validated;
}
```

### 2. Output Validation

```typescript
function validateOutput(
  output: unknown,
  expectedType: string
): boolean {
  // Ensure output matches expected type
  // Prevent data exfiltration
  // Sanitize any HTML/scripts
}
```

### 3. Rate Limiting

```typescript
const rateLimiter = {
  perIp: { limit: 100, window: "1h" },
  perPlan: { limit: 50, window: "1h" },
  perTool: { limit: 20, window: "1m" }
};
```

### 4. Sandboxed Execution

All tools run in isolated sandboxes with:
- Limited memory
- Limited CPU time
- No filesystem access (except temp)
- No network access (except whitelisted)
- No environment variable access

### 5. Audit Logging

```typescript
interface AuditLog {
  timestamp: string;
  userId: string;
  planId: string;
  steps: {
    stepId: string;
    tool: string;
    input: Record<string, unknown>;  // Redacted
    output: Record<string, unknown>; // Redacted
    duration: number;
  }[];
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Current)

- [x] Tool registry with dynamic loading
- [x] Single tool execution with AI agent
- [x] Health checking and validation
- [x] Rate limiting and abuse prevention

### Phase 2: Multi-Tool Execution

- [ ] Sequential multi-tool execution
- [ ] Context passing between tools
- [ ] Basic error handling with retries
- [ ] Execution logging and monitoring

### Phase 3: Plan Generation

- [ ] Query analysis and intent extraction
- [ ] Capability-to-tool mapping
- [ ] Single plan generation (X steps)
- [ ] Plan validation and optimization

### Phase 4: Multiple Plans (Y×X)

- [ ] Multiple plan generation (Y alternatives)
- [ ] Plan comparison and scoring
- [ ] User plan selection UI
- [ ] Auto-selection based on criteria

### Phase 5: Advanced Orchestration

- [ ] Parallel execution with DAG
- [ ] Fallback tool selection
- [ ] Dynamic re-planning on failure
- [ ] Checkpoint and resume

### Phase 6: Enterprise Features

- [ ] Plan caching and reuse
- [ ] Custom tool composition
- [ ] Team-shared workflows
- [ ] Analytics and optimization recommendations

---

## Appendix A: Query Complexity Scoring

```typescript
function calculateComplexity(query: string): number {
  let score = 0;

  // Count action verbs
  const actions = query.match(/\b(create|generate|analyze|extract|convert|compare|merge|transform)\b/gi);
  score += (actions?.length ?? 0) * 2;

  // Count conjunctions indicating multiple tasks
  const conjunctions = query.match(/\b(and|then|also|plus|after|before)\b/gi);
  score += (conjunctions?.length ?? 0) * 1.5;

  // Count output format requests
  const formats = query.match(/\b(pdf|excel|csv|json|markdown|html|image|chart|graph)\b/gi);
  score += (formats?.length ?? 0) * 1;

  // Count data sources
  const sources = query.match(/\b(from|using|based on|via|through)\b/gi);
  score += (sources?.length ?? 0) * 1;

  return Math.min(10, score);
}
```

---

## Appendix B: Tool Compatibility Matrix

```
┌─────────────────┬─────────┬─────────┬─────────┬─────────┐
│ Output Type     │ string  │ object  │ array   │ buffer  │
├─────────────────┼─────────┼─────────┼─────────┼─────────┤
│ string input    │   ✓     │   △     │   △     │   ✗     │
│ object input    │   △     │   ✓     │   △     │   ✗     │
│ array input     │   △     │   △     │   ✓     │   ✗     │
│ buffer input    │   ✗     │   ✗     │   ✗     │   ✓     │
└─────────────────┴─────────┴─────────┴─────────┴─────────┘

✓ = Direct compatibility
△ = Requires transformation
✗ = Incompatible
```

---

## Appendix C: Cost Estimation Formula

```typescript
function estimatePlanCost(plan: ExecutionPlan): number {
  const BASE_COST_PER_STEP = 0.001;  // $0.001 per step
  const TOKEN_COST = 0.00003;        // $0.00003 per token

  return plan.steps.reduce((total, step) => {
    const stepCost = BASE_COST_PER_STEP;
    const inputTokens = estimateInputTokens(step);
    const outputTokens = estimateOutputTokens(step);
    const tokenCost = (inputTokens + outputTokens) * TOKEN_COST;

    return total + stepCost + tokenCost;
  }, 0);
}
```

---

## Conclusion

Dynamic multi-tool orchestration transforms TPMJS from a tool registry into an intelligent workflow engine. By generating Y alternative plans with X sequential steps, we can solve arbitrarily complex tasks while giving users choice and transparency.

The key innovations are:

1. **Dynamic Discovery**: Tools are loaded at runtime, not build time
2. **Intelligent Planning**: AI generates optimal execution plans
3. **Flexible Execution**: Sequential, parallel, or streaming execution
4. **Robust Recovery**: Fallbacks, retries, and re-planning on failure
5. **Cost Optimization**: Smart tool selection minimizes token usage

This architecture scales from simple single-tool queries to complex 20+ step enterprise workflows, all using the same underlying primitives.
