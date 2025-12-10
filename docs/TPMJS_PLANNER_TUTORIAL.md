# TPMJS Planner: Building a Multi-Tool Agent System

A tutorial on implementing a hierarchical planning agent that dynamically loads tools from the TPMJS registry.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                           USER QUERY                                        │
│                    "Scrape competitor prices,                               │
│                     analyze trends, make report"                            │
│                               │                                             │
│                               ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      PLAN GENERATOR                                  │   │
│  │                                                                      │   │
│  │   Query ──► Tool Search ──► Generate Y Plans ──► Infer Skills       │   │
│  │                                                                      │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                           │
│              ┌──────────────────┼──────────────────┐                       │
│              ▼                  ▼                  ▼                        │
│         ┌────────┐         ┌────────┐         ┌────────┐                   │
│         │ Plan A │         │ Plan B │         │ Plan C │                   │
│         │12 steps│         │ 6 steps│         │ 8 steps│                   │
│         └────┬───┘         └────────┘         └────────┘                   │
│              │                                                              │
│              ▼  (user selects or auto-select)                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      CASCADING EXECUTOR                              │   │
│  │                                                                      │   │
│  │   Load Context ──► Execute Step ──► Update State ──► Next Step      │   │
│  │        ▲                                    │                        │   │
│  │        └────────────────────────────────────┘                        │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                           │
│                                 ▼                                           │
│                           FINAL OUTPUT                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 1: Core Types

```typescript
// ============================================================================
// types/planner.ts
// ============================================================================

interface Tool {
  id: string;
  packageName: string;
  exportName: string;
  description: string;
  parameters: Parameter[];
  returns: ReturnType;
  category: string;
  qualityScore: number;
}

interface ExecutionPlan {
  id: string;
  steps: PlanStep[];
  estimatedCost: number;
  confidence: number;
  skills: Skill[];          // Inferred from tools
}

interface PlanStep {
  id: string;
  tool: Tool;
  purpose: string;
  input: StepInput;
  dependsOn: string[];      // Step IDs
  fallbacks: Tool[];        // Alternative tools
}

interface Skill {
  domain: string;           // "seo", "scraping", "data-analysis"
  context: string;          // Relevant docs/knowledge
  tools: Tool[];            // Tools in this domain
}

interface ExecutionContext {
  query: string;
  variables: Map<string, any>;
  completed: Set<string>;
  errors: Error[];
}
```

---

## Part 2: Tool Discovery

```typescript
// ============================================================================
// lib/tool-discovery.ts
// ============================================================================

/**
 * Search registry for tools matching a capability
 *
 *   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
 *   │   Query     │────►│  Registry   │────►│  Ranked     │
 *   │ "scrape"    │     │   Search    │     │  Tools      │
 *   └─────────────┘     └─────────────┘     └─────────────┘
 */
async function discoverTools(
  capability: string,
  limit: number = 10
): Promise<Tool[]> {

  // 1. Search by keyword
  const keywordResults = await fetch(
    `/api/tools?search=${encodeURIComponent(capability)}&limit=${limit}`
  ).then(r => r.json());

  // 2. Search by category
  const category = inferCategory(capability);
  const categoryResults = await fetch(
    `/api/tools?category=${category}&limit=${limit}`
  ).then(r => r.json());

  // 3. Merge and rank
  const merged = mergeAndDedupe(keywordResults.data, categoryResults.data);

  return rankTools(merged, capability);
}

/**
 * Rank tools by relevance + quality
 */
function rankTools(tools: Tool[], capability: string): Tool[] {
  return tools
    .map(tool => ({
      tool,
      score:
        textSimilarity(tool.description, capability) * 0.4 +
        tool.qualityScore * 0.3 +
        (tool.healthStatus === 'HEALTHY' ? 0.3 : 0)
    }))
    .sort((a, b) => b.score - a.score)
    .map(t => t.tool);
}

/**
 * Category inference from natural language
 *
 *   "scrape website" ──► "web-scraping"
 *   "analyze data"   ──► "data-analysis"
 *   "generate pdf"   ──► "file-generation"
 */
function inferCategory(text: string): string {
  const patterns = [
    { pattern: /scrape|crawl|fetch.*web/i, category: 'web-scraping' },
    { pattern: /analyz|statistic|trend/i, category: 'data-analysis' },
    { pattern: /pdf|excel|csv|export/i, category: 'file-generation' },
    { pattern: /image|photo|picture/i, category: 'image-processing' },
    { pattern: /email|notify|alert/i, category: 'communication' },
  ];

  for (const { pattern, category } of patterns) {
    if (pattern.test(text)) return category;
  }
  return 'general';
}
```

---

## Part 3: Plan Generation

```typescript
// ============================================================================
// lib/plan-generator.ts
// ============================================================================

/**
 * Generate Y alternative plans for a query
 *
 *                        ┌─────────────┐
 *                        │    Query    │
 *                        └──────┬──────┘
 *                               │
 *                    ┌──────────┼──────────┐
 *                    ▼          ▼          ▼
 *               ┌────────┐ ┌────────┐ ┌────────┐
 *               │ Plan A │ │ Plan B │ │ Plan C │
 *               │Thorough│ │ Quick  │ │Balanced│
 *               └────────┘ └────────┘ └────────┘
 */
async function generatePlans(
  query: string,
  numPlans: number = 3
): Promise<ExecutionPlan[]> {

  // 1. Analyze query
  const analysis = await analyzeQuery(query);

  // 2. Discover relevant tools
  const tools = await discoverToolsForAnalysis(analysis);

  // 3. Generate plan variants
  const strategies: PlanStrategy[] = [
    { name: 'thorough', maxSteps: 15, preferQuality: true },
    { name: 'quick', maxSteps: 5, preferSpeed: true },
    { name: 'balanced', maxSteps: 10, balanced: true },
  ];

  const plans = await Promise.all(
    strategies.slice(0, numPlans).map(strategy =>
      generateSinglePlan(analysis, tools, strategy)
    )
  );

  // 4. Infer skills for each plan
  return plans.map(plan => ({
    ...plan,
    skills: inferSkills(plan.steps.map(s => s.tool))
  }));
}

/**
 * Query analysis extracts intent and entities
 */
async function analyzeQuery(query: string): Promise<QueryAnalysis> {
  // Use LLM to extract structured info
  const response = await generateText({
    model: openai('gpt-4-turbo'),
    prompt: `Analyze this query and extract:
      - intent (what user wants to accomplish)
      - entities (URLs, names, values mentioned)
      - required_capabilities (list of needed operations)
      - output_format (what format user expects)

      Query: "${query}"

      Return JSON.`
  });

  return JSON.parse(response.text);
}

/**
 * Generate a single plan with given strategy
 */
async function generateSinglePlan(
  analysis: QueryAnalysis,
  tools: Tool[],
  strategy: PlanStrategy
): Promise<ExecutionPlan> {

  const steps: PlanStep[] = [];
  const usedTools = new Set<string>();

  for (const capability of analysis.required_capabilities) {
    // Find best tool for this capability
    const candidates = tools.filter(t =>
      matchesCapability(t, capability) && !usedTools.has(t.id)
    );

    if (candidates.length === 0) continue;

    const tool = strategy.preferQuality
      ? candidates.sort((a, b) => b.qualityScore - a.qualityScore)[0]
      : candidates[0];

    usedTools.add(tool.id);

    steps.push({
      id: `step_${steps.length + 1}`,
      tool,
      purpose: capability,
      input: inferInput(tool, analysis, steps),
      dependsOn: inferDependencies(tool, steps),
      fallbacks: candidates.slice(1, 3)  // Keep alternatives
    });

    if (steps.length >= strategy.maxSteps) break;
  }

  return {
    id: generateId(),
    steps,
    estimatedCost: estimateCost(steps),
    confidence: calculateConfidence(steps),
    skills: []  // Filled in later
  };
}
```

---

## Part 4: Skill Inference

```typescript
// ============================================================================
// lib/skill-inference.ts
// ============================================================================

/**
 * Infer skills (contextual knowledge) from tools in a plan
 *
 *   Tools in Plan                    Inferred Skills
 *   ─────────────                    ───────────────
 *   ┌─────────────────┐              ┌─────────────────┐
 *   │ web-scraper     │──┐           │ WEB SCRAPING    │
 *   │ html-parser     │──┼──────────►│ • Rate limiting │
 *   │ url-validator   │──┘           │ • Robots.txt    │
 *   └─────────────────┘              │ • Selectors     │
 *                                    └─────────────────┘
 *   ┌─────────────────┐              ┌─────────────────┐
 *   │ price-extractor │──┐           │ DATA ANALYSIS   │
 *   │ trend-analyzer  │──┼──────────►│ • Normalization │
 *   │ stats-calculator│──┘           │ • Outliers      │
 *   └─────────────────┘              └─────────────────┘
 */
function inferSkills(tools: Tool[]): Skill[] {
  // Group tools by category
  const byCategory = groupBy(tools, t => t.category);

  const skills: Skill[] = [];

  for (const [category, categoryTools] of Object.entries(byCategory)) {
    const skillContext = SKILL_CONTEXTS[category];

    if (skillContext) {
      skills.push({
        domain: category,
        context: skillContext,
        tools: categoryTools
      });
    }
  }

  return skills;
}

/**
 * Skill context library - domain knowledge for each category
 */
const SKILL_CONTEXTS: Record<string, string> = {
  'web-scraping': `
    ## Web Scraping Best Practices
    - Always check robots.txt before scraping
    - Implement rate limiting (1 req/sec default)
    - Handle pagination with cursor or offset
    - Use CSS selectors over XPath when possible
    - Handle JavaScript-rendered content with headless browser
  `,

  'data-analysis': `
    ## Data Analysis Guidelines
    - Normalize numerical data before comparison
    - Handle missing values: impute or exclude
    - Identify outliers using IQR or z-score
    - Use appropriate statistical tests
    - Visualize distributions before drawing conclusions
  `,

  'file-generation': `
    ## File Generation Standards
    - PDF: Use A4/Letter, embed fonts, compress images
    - Excel: Use proper data types, add headers, format numbers
    - CSV: Use UTF-8, escape special characters, consistent delimiters
  `,

  // ... more domains
};
```

---

## Part 5: Cascading Executor

```typescript
// ============================================================================
// lib/cascading-executor.ts
// ============================================================================

/**
 * Execute a plan with cascading context loading
 *
 *   Step 1              Step 2              Step 3
 *   ──────              ──────              ──────
 *   ┌────────────┐      ┌────────────┐      ┌────────────┐
 *   │ Load:      │      │ Load:      │      │ Load:      │
 *   │ • Tool A   │      │ • Tool B   │      │ • Tool C   │
 *   │ • Skill X  │ ───► │ • Skill X  │ ───► │ • Skill Y  │
 *   │ • Next: B  │      │ • Next: C  │      │ • Next: D  │
 *   └────────────┘      └────────────┘      └────────────┘
 *      ~800 tok            ~900 tok           ~1100 tok
 *
 *   vs Loading Everything: ~15000 tokens
 */
async function* executeWithCascading(
  plan: ExecutionPlan,
  context: ExecutionContext
): AsyncGenerator<ExecutionEvent> {

  for (let i = 0; i < plan.steps.length; i++) {
    const step = plan.steps[i];
    const nextSteps = plan.steps.slice(i + 1, i + 3);  // Preload next 2

    yield { type: 'step_start', stepId: step.id };

    // 1. Build minimal context for this step
    const stepContext = buildStepContext(step, nextSteps, plan.skills, context);

    yield { type: 'context_loaded', tokens: estimateTokens(stepContext) };

    // 2. Resolve input values
    const input = resolveInput(step.input, context);

    // 3. Execute with fallbacks
    const result = await executeWithFallbacks(step, input, stepContext);

    // 4. Store result
    context.variables.set(step.id, result);
    context.completed.add(step.id);

    yield {
      type: 'step_complete',
      stepId: step.id,
      result: summarize(result)
    };
  }

  yield { type: 'plan_complete', output: context.variables };
}

/**
 * Build minimal context for a single step
 */
function buildStepContext(
  current: PlanStep,
  upcoming: PlanStep[],
  skills: Skill[],
  context: ExecutionContext
): string {
  const parts: string[] = [];

  // 1. Current tool description
  parts.push(`## Current Tool: ${current.tool.exportName}`);
  parts.push(current.tool.description);
  parts.push(formatParameters(current.tool.parameters));

  // 2. Relevant skill context (only for this tool's domain)
  const relevantSkill = skills.find(s =>
    s.tools.some(t => t.id === current.tool.id)
  );
  if (relevantSkill) {
    parts.push(`## Domain Knowledge`);
    parts.push(relevantSkill.context);
  }

  // 3. Upcoming tools (just names, for continuity)
  if (upcoming.length > 0) {
    parts.push(`## Coming Next`);
    parts.push(upcoming.map(s => `- ${s.tool.exportName}: ${s.purpose}`).join('\n'));
  }

  // 4. Relevant prior results (summarized)
  for (const depId of current.dependsOn) {
    const prior = context.variables.get(depId);
    if (prior) {
      parts.push(`## Input from ${depId}`);
      parts.push(summarize(prior, 500));  // Max 500 chars
    }
  }

  return parts.join('\n\n');
}

/**
 * Execute step with automatic fallback on failure
 *
 *   ┌──────────┐     ┌──────────┐     ┌──────────┐
 *   │ Primary  │──X──│ Fallback │──X──│ Fallback │──► Error
 *   │  Tool    │     │    #1    │     │    #2    │
 *   └──────────┘     └──────────┘     └──────────┘
 *        │                │                │
 *        ▼                ▼                ▼
 *      Result          Result           Result
 */
async function executeWithFallbacks(
  step: PlanStep,
  input: any,
  context: string
): Promise<any> {
  const tools = [step.tool, ...step.fallbacks];

  for (const tool of tools) {
    try {
      return await executeTool(tool, input, context);
    } catch (error) {
      console.log(`Tool ${tool.exportName} failed, trying fallback...`);
    }
  }

  throw new Error(`All tools failed for step ${step.id}`);
}

/**
 * Execute a single tool via the registry
 */
async function executeTool(
  tool: Tool,
  input: any,
  context: string
): Promise<any> {
  const response = await fetch(
    `/api/tools/execute/${tool.packageName}/${tool.exportName}`,
    {
      method: 'POST',
      body: JSON.stringify({ input, context }),
    }
  );

  if (!response.ok) {
    throw new Error(`Tool execution failed: ${response.statusText}`);
  }

  return response.json();
}
```

---

## Part 6: Pathway Learning

```typescript
// ============================================================================
// lib/pathway-learning.ts
// ============================================================================

/**
 * Track and learn from pathway execution
 *
 *   ┌─────────────────────────────────────────────────────────┐
 *   │                    PATHWAY STORE                        │
 *   │                                                         │
 *   │  Query Pattern      Path              Success   Weight  │
 *   │  ─────────────      ────              ───────   ──────  │
 *   │  "scrape.*price"    A→B→D→E           847/892   0.95   │
 *   │  "scrape.*price"    A→B→C→D→E         38/52     0.73   │
 *   │  "analyze.*trend"   X→Y→Z             412/445   0.93   │
 *   │                                                         │
 *   └─────────────────────────────────────────────────────────┘
 */

interface PathwayRecord {
  queryPattern: string;
  steps: string[];          // Tool IDs in order
  successes: number;
  failures: number;
  lastUsed: Date;
}

class PathwayLearner {
  private records: Map<string, PathwayRecord[]> = new Map();

  /**
   * Record outcome of a pathway execution
   */
  recordOutcome(
    query: string,
    steps: string[],
    success: boolean
  ): void {
    const pattern = extractPattern(query);
    const pathKey = steps.join('→');

    let records = this.records.get(pattern) || [];
    let record = records.find(r => r.steps.join('→') === pathKey);

    if (!record) {
      record = {
        queryPattern: pattern,
        steps,
        successes: 0,
        failures: 0,
        lastUsed: new Date()
      };
      records.push(record);
    }

    if (success) record.successes++;
    else record.failures++;
    record.lastUsed = new Date();

    this.records.set(pattern, records);
  }

  /**
   * Get recommended pathway using Thompson Sampling
   *
   *   Path A: Beta(91, 11)  ──► Sample: 0.88
   *   Path B: Beta(5, 2)    ──► Sample: 0.91  ◄── Winner (uncertain but sampled high)
   */
  recommendPathway(query: string): string[] | null {
    const pattern = extractPattern(query);
    const records = this.records.get(pattern);

    if (!records || records.length === 0) return null;

    // Thompson Sampling: sample from Beta distribution for each path
    let bestPath: string[] | null = null;
    let bestSample = -1;

    for (const record of records) {
      // Beta(successes + 1, failures + 1)
      const sample = sampleBeta(
        record.successes + 1,
        record.failures + 1
      );

      // Apply recency decay
      const daysSinceUse = daysBetween(record.lastUsed, new Date());
      const recencyFactor = Math.pow(0.99, daysSinceUse);
      const adjustedSample = sample * recencyFactor;

      if (adjustedSample > bestSample) {
        bestSample = adjustedSample;
        bestPath = record.steps;
      }
    }

    return bestPath;
  }

  /**
   * Get K-factor (convergence toward determinism)
   *
   *   K → 0.0: No dominant path, explore freely
   *   K → 1.0: Strong dominant path, nearly deterministic
   */
  getKFactor(query: string): number {
    const pattern = extractPattern(query);
    const records = this.records.get(pattern);

    if (!records || records.length === 0) return 0;

    const total = records.reduce((sum, r) => sum + r.successes + r.failures, 0);
    if (total < 10) return 0;  // Not enough data

    const topPath = records.sort((a, b) =>
      (b.successes / (b.successes + b.failures)) -
      (a.successes / (a.successes + a.failures))
    )[0];

    const topUsage = (topPath.successes + topPath.failures) / total;
    const topSuccess = topPath.successes / (topPath.successes + topPath.failures);

    return topUsage * topSuccess;
  }
}

/**
 * Sample from Beta distribution
 */
function sampleBeta(alpha: number, beta: number): number {
  // Simplified: use gamma sampling
  const x = sampleGamma(alpha);
  const y = sampleGamma(beta);
  return x / (x + y);
}
```

---

## Part 7: The Main Orchestrator

```typescript
// ============================================================================
// lib/planner-orchestrator.ts
// ============================================================================

/**
 * Main entry point: Query → Plans → Execution → Result
 *
 *   ┌─────────────────────────────────────────────────────────────────────┐
 *   │                                                                     │
 *   │   1. QUERY        2. PLANS         3. SELECT       4. EXECUTE      │
 *   │   ───────         ───────          ────────        ─────────       │
 *   │                                                                     │
 *   │   "analyze      ┌────────┐                                         │
 *   │    competitor   │ Plan A │───┐     User picks     ┌──────────┐     │
 *   │    prices"  ───►│ Plan B │───┼───► or auto   ───► │ Cascade  │───► │
 *   │                 │ Plan C │───┘     select         │ Execute  │     │
 *   │                 └────────┘                        └──────────┘     │
 *   │                                                                     │
 *   └─────────────────────────────────────────────────────────────────────┘
 */
class PlannerOrchestrator {
  private learner = new PathwayLearner();

  async processQuery(
    query: string,
    options: OrchestratorOptions = {}
  ): AsyncGenerator<OrchestratorEvent> {

    const { numPlans = 3, autoSelect = false } = options;

    // ─────────────────────────────────────────────────────────────────
    // Step 1: Check for learned pathway
    // ─────────────────────────────────────────────────────────────────
    const kFactor = this.learner.getKFactor(query);

    yield { type: 'k_factor', value: kFactor };

    if (kFactor > 0.9) {
      // Near-deterministic: use learned path directly
      const learnedPath = this.learner.recommendPathway(query);
      if (learnedPath) {
        yield { type: 'using_learned_path', path: learnedPath };

        const plan = await this.pathToExecutionPlan(learnedPath, query);
        yield* this.executePlan(plan, query);
        return;
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // Step 2: Generate Y plans
    // ─────────────────────────────────────────────────────────────────
    yield { type: 'generating_plans' };

    const plans = await generatePlans(query, numPlans);

    yield {
      type: 'plans_ready',
      plans: plans.map(p => ({
        id: p.id,
        steps: p.steps.length,
        cost: p.estimatedCost,
        confidence: p.confidence,
        skills: p.skills.map(s => s.domain)
      }))
    };

    // ─────────────────────────────────────────────────────────────────
    // Step 3: Select plan
    // ─────────────────────────────────────────────────────────────────
    let selectedPlan: ExecutionPlan;

    if (autoSelect) {
      // Auto-select: use Thompson Sampling across plans
      selectedPlan = this.selectPlanThompson(plans);
      yield { type: 'auto_selected', planId: selectedPlan.id };
    } else {
      // Wait for user selection
      yield { type: 'awaiting_selection' };
      const selection = await this.waitForUserSelection(plans);
      selectedPlan = plans.find(p => p.id === selection)!;
    }

    // ─────────────────────────────────────────────────────────────────
    // Step 4: Execute with cascading context
    // ─────────────────────────────────────────────────────────────────
    yield* this.executePlan(selectedPlan, query);
  }

  private async* executePlan(
    plan: ExecutionPlan,
    query: string
  ): AsyncGenerator<OrchestratorEvent> {

    yield {
      type: 'execution_start',
      totalSteps: plan.steps.length,
      skills: plan.skills.map(s => s.domain)
    };

    const context: ExecutionContext = {
      query,
      variables: new Map(),
      completed: new Set(),
      errors: []
    };

    let success = true;

    try {
      for await (const event of executeWithCascading(plan, context)) {
        yield { type: 'execution_event', event };
      }
    } catch (error) {
      success = false;
      yield { type: 'execution_error', error };
    }

    // Record outcome for learning
    const pathSteps = plan.steps.map(s => s.tool.id);
    this.learner.recordOutcome(query, pathSteps, success);

    yield {
      type: 'execution_complete',
      success,
      output: Object.fromEntries(context.variables)
    };
  }

  /**
   * Thompson Sampling for plan selection
   */
  private selectPlanThompson(plans: ExecutionPlan[]): ExecutionPlan {
    let best = plans[0];
    let bestScore = -1;

    for (const plan of plans) {
      // Sample based on confidence + randomness
      const sample = sampleBeta(
        plan.confidence * 100,
        (1 - plan.confidence) * 100
      );

      if (sample > bestScore) {
        bestScore = sample;
        best = plan;
      }
    }

    return best;
  }
}
```

---

## Part 8: React Integration

```typescript
// ============================================================================
// components/PlannerPlayground.tsx
// ============================================================================

/**
 * UI for the planner system
 *
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │  Query: [_______________________________________] [Generate]    │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │                                                                 │
 *   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
 *   │  │  ◉ Plan A   │  │  ○ Plan B   │  │  ○ Plan C   │             │
 *   │  │  12 steps   │  │  6 steps    │  │  8 steps    │             │
 *   │  │  $0.45      │  │  $0.15      │  │  $0.28      │             │
 *   │  │  94% conf   │  │  87% conf   │  │  91% conf   │             │
 *   │  └─────────────┘  └─────────────┘  └─────────────┘             │
 *   │                                                                 │
 *   │  Skills: [SEO] [Scraping] [Data Analysis]                      │
 *   │                                                                 │
 *   │  [Execute Selected Plan]                                        │
 *   │                                                                 │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │  Execution Progress:                                            │
 *   │  ✓ Step 1: Fetch webpage         (823ms)                       │
 *   │  ✓ Step 2: Parse HTML            (234ms)                       │
 *   │  ► Step 3: Extract prices...     [████████░░] 80%              │
 *   │  ○ Step 4: Analyze trends                                       │
 *   │  ○ Step 5: Generate report                                      │
 *   │                                                                 │
 *   │  Context: 1,240 tokens (vs 12,400 if loaded all)               │
 *   └─────────────────────────────────────────────────────────────────┘
 */

function PlannerPlayground() {
  const [query, setQuery] = useState('');
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [execution, setExecution] = useState<ExecutionState | null>(null);
  const [kFactor, setKFactor] = useState<number>(0);

  const orchestrator = useRef(new PlannerOrchestrator());

  async function handleGenerate() {
    setPlans([]);
    setExecution(null);

    for await (const event of orchestrator.current.processQuery(query)) {
      switch (event.type) {
        case 'k_factor':
          setKFactor(event.value);
          break;

        case 'plans_ready':
          setPlans(event.plans);
          break;

        case 'execution_start':
          setExecution({
            status: 'running',
            totalSteps: event.totalSteps,
            currentStep: 0,
            skills: event.skills,
            events: []
          });
          break;

        case 'execution_event':
          setExecution(prev => ({
            ...prev!,
            events: [...prev!.events, event.event],
            currentStep: event.event.type === 'step_complete'
              ? prev!.currentStep + 1
              : prev!.currentStep
          }));
          break;

        case 'execution_complete':
          setExecution(prev => ({
            ...prev!,
            status: event.success ? 'complete' : 'error',
            output: event.output
          }));
          break;
      }
    }
  }

  return (
    <div className="planner-playground">
      {/* Query Input */}
      <QueryInput value={query} onChange={setQuery} onSubmit={handleGenerate} />

      {/* K-Factor Indicator */}
      {kFactor > 0 && (
        <KFactorBadge value={kFactor} />
      )}

      {/* Plan Selection */}
      {plans.length > 0 && (
        <PlanSelector
          plans={plans}
          selected={selectedPlan}
          onSelect={setSelectedPlan}
        />
      )}

      {/* Execution Progress */}
      {execution && (
        <ExecutionProgress execution={execution} />
      )}
    </div>
  );
}
```

---

## Part 9: API Routes

```typescript
// ============================================================================
// app/api/planner/generate/route.ts
// ============================================================================

export async function POST(req: Request) {
  const { query, numPlans } = await req.json();

  const plans = await generatePlans(query, numPlans);

  return Response.json({
    success: true,
    data: plans.map(p => ({
      id: p.id,
      steps: p.steps.map(s => ({
        id: s.id,
        tool: s.tool.exportName,
        purpose: s.purpose
      })),
      estimatedCost: p.estimatedCost,
      confidence: p.confidence,
      skills: p.skills.map(s => s.domain)
    }))
  });
}

// ============================================================================
// app/api/planner/execute/route.ts
// ============================================================================

export async function POST(req: Request) {
  const { planId, query } = await req.json();

  // Get full plan from cache/DB
  const plan = await getPlan(planId);

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const context: ExecutionContext = {
        query,
        variables: new Map(),
        completed: new Set(),
        errors: []
      };

      for await (const event of executeWithCascading(plan, context)) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
      }

      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache'
    }
  });
}
```

---

## Summary: The Complete Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                        TPMJS PLANNER ARCHITECTURE                           │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                           USER QUERY                                  │ │
│  │                  "Scrape competitor prices and analyze"               │ │
│  └─────────────────────────────────┬─────────────────────────────────────┘ │
│                                    │                                        │
│                                    ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                      1. CHECK LEARNED PATHS                           │ │
│  │                                                                       │ │
│  │   K-factor = 0.85 ──► Strong pattern exists                          │ │
│  │   K-factor = 0.30 ──► Generate new plans                             │ │
│  └─────────────────────────────────┬─────────────────────────────────────┘ │
│                                    │                                        │
│                                    ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                      2. DISCOVER TOOLS                                │ │
│  │                                                                       │ │
│  │   Query Registry ──► Rank by relevance ──► Top 20 tools              │ │
│  └─────────────────────────────────┬─────────────────────────────────────┘ │
│                                    │                                        │
│                                    ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                      3. GENERATE Y PLANS                              │ │
│  │                                                                       │ │
│  │   ┌─────────┐    ┌─────────┐    ┌─────────┐                          │ │
│  │   │ Plan A  │    │ Plan B  │    │ Plan C  │                          │ │
│  │   │Thorough │    │  Quick  │    │Balanced │                          │ │
│  │   │12 steps │    │ 5 steps │    │ 8 steps │                          │ │
│  │   └─────────┘    └─────────┘    └─────────┘                          │ │
│  └─────────────────────────────────┬─────────────────────────────────────┘ │
│                                    │                                        │
│                                    ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                      4. INFER SKILLS                                  │ │
│  │                                                                       │ │
│  │   Tools ──► Cluster by domain ──► Load domain context                │ │
│  │                                                                       │ │
│  │   [web-scraping: robots.txt, selectors, rate limits]                 │ │
│  │   [data-analysis: normalization, outliers, trends]                   │ │
│  └─────────────────────────────────┬─────────────────────────────────────┘ │
│                                    │                                        │
│                                    ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                      5. USER SELECTS (or auto)                        │ │
│  │                                                                       │ │
│  │   Thompson Sampling if auto ──► Pick plan with highest sample        │ │
│  └─────────────────────────────────┬─────────────────────────────────────┘ │
│                                    │                                        │
│                                    ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                      6. CASCADE EXECUTE                               │ │
│  │                                                                       │ │
│  │   For each step:                                                      │ │
│  │   ┌────────────────────────────────────────────────────────────────┐ │ │
│  │   │ • Load current tool + relevant skill context (~1k tokens)     │ │ │
│  │   │ • Preload next 2 likely tools                                  │ │ │
│  │   │ • Execute via registry                                         │ │ │
│  │   │ • Try fallbacks on failure                                     │ │ │
│  │   │ • Store result, update state                                   │ │ │
│  │   └────────────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────┬─────────────────────────────────────┘ │
│                                    │                                        │
│                                    ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                      7. RECORD OUTCOME                                │ │
│  │                                                                       │ │
│  │   Success/Failure ──► Update pathway stats ──► Adjust K-factor       │ │
│  └─────────────────────────────────┬─────────────────────────────────────┘ │
│                                    │                                        │
│                                    ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                         FINAL OUTPUT                                  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Files to Create

```
apps/web/
├── src/
│   ├── lib/
│   │   ├── planner/
│   │   │   ├── tool-discovery.ts      # Part 2
│   │   │   ├── plan-generator.ts      # Part 3
│   │   │   ├── skill-inference.ts     # Part 4
│   │   │   ├── cascading-executor.ts  # Part 5
│   │   │   ├── pathway-learning.ts    # Part 6
│   │   │   └── orchestrator.ts        # Part 7
│   │   └── types/
│   │       └── planner.ts             # Part 1
│   ├── components/
│   │   └── PlannerPlayground.tsx      # Part 8
│   └── app/
│       └── api/
│           └── planner/
│               ├── generate/route.ts  # Part 9
│               └── execute/route.ts   # Part 9

packages/db/prisma/
└── schema.prisma                      # Add PathwayRecord model
```
