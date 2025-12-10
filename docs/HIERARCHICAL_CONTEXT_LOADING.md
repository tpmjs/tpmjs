# Hierarchical Cascading Tree: Tool & Context Loading

A pattern for any agent chat interface where tool plans are generated speculatively,
skills/context are inferred backwards from those plans, and execution proceeds with
minimal context at each step.

---

## The Core Insight

Traditional agent flow:
```
User Query → Load ALL tools → Model picks tools → Execute
                  ↑
            (huge context)
```

Hierarchical cascading flow:
```
User Query → Generate Y Plans → Infer Skills from Plans → Load minimal context per step
                                        ↑
                              (context derived from likely tools)
```

**Key idea**: The tool plans themselves tell you what context/skills the agent needs.
You don't load everything—you load what the plan reveals is relevant.

---

## Real World Example: Website Audit

**User Query**:
> "Perform a complete audit of my website including SEO, performance, accessibility,
> and security, then generate a prioritized action plan"

### Step 1: Generate Y Plans (speculatively, in parallel)

The system generates 3 alternative plans before any execution:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              PLAN GENERATION                                     │
│                                                                                 │
│  User Query: "audit my website..."                                              │
│                                                                                 │
│         ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                 │
│         │   PLAN A     │   │   PLAN B     │   │   PLAN C     │                 │
│         │  (thorough)  │   │   (quick)    │   │  (balanced)  │                 │
│         │   22 steps   │   │   8 steps    │   │   14 steps   │                 │
│         └──────────────┘   └──────────────┘   └──────────────┘                 │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Step 2: Analyze Plans → Infer Required Domains

Look at ALL tools across ALL plans to identify skill domains:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         DOMAIN INFERENCE FROM PLANS                              │
│                                                                                 │
│  Plan A Tools:                    Plan B Tools:         Plan C Tools:           │
│  ─────────────                    ─────────────         ─────────────           │
│  sitemap-discoverer               lighthouse-runner     sitemap-discoverer      │
│  page-fetcher                     security-scanner      lighthouse-runner       │
│  meta-tag-analyzer                report-generator      wcag-checker            │
│  heading-structure-analyzer                             ssl-checker             │
│  internal-link-analyzer                                 action-plan-generator   │
│  keyword-density-analyzer                               report-generator        │
│  schema-markup-checker                                                          │
│  page-speed-analyzer                                                            │
│  asset-analyzer                                                                 │
│  core-web-vitals-checker                                                        │
│  wcag-checker                                                                   │
│  color-contrast-checker                                                         │
│  alt-text-checker                                                               │
│  keyboard-nav-checker                                                           │
│  ssl-checker                                                                    │
│  header-security-checker                                                        │
│  vulnerability-scanner                                                          │
│  ...                                                                            │
│                                                                                 │
│                              ↓ CLUSTER BY DOMAIN ↓                              │
│                                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │     SEO     │  │ PERFORMANCE │  │ACCESSIBILITY│  │  SECURITY   │            │
│  │   domain    │  │   domain    │  │   domain    │  │   domain    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Step 3: Load Domain-Specific Context (Skills)

Each domain has associated contextual knowledge:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SKILL/CONTEXT LOADING                                  │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  SEO SKILL CONTEXT                                                       │   │
│  │  ───────────────────                                                     │   │
│  │  • Meta tag best practices (title 50-60 chars, desc 150-160)            │   │
│  │  • Heading hierarchy rules (single H1, logical nesting)                 │   │
│  │  • Internal linking patterns (hub & spoke, silo structure)              │   │
│  │  • Schema.org markup types and validation                               │   │
│  │  • Core Web Vitals thresholds (LCP < 2.5s, FID < 100ms, CLS < 0.1)     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  ACCESSIBILITY SKILL CONTEXT                                             │   │
│  │  ───────────────────────────                                             │   │
│  │  • WCAG 2.1 AA requirements checklist                                   │   │
│  │  • Color contrast ratios (4.5:1 normal, 3:1 large text)                 │   │
│  │  • ARIA roles and proper usage patterns                                 │   │
│  │  • Keyboard navigation requirements                                     │   │
│  │  • Screen reader compatibility guidelines                               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  SECURITY SKILL CONTEXT                                                  │   │
│  │  ──────────────────────                                                  │   │
│  │  • Security header requirements (CSP, HSTS, X-Frame-Options)            │   │
│  │  • SSL/TLS configuration best practices                                 │   │
│  │  • OWASP Top 10 vulnerability patterns                                  │   │
│  │  • Cookie security attributes (Secure, HttpOnly, SameSite)              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Step 4: The Cascading Tree During Execution

Now execution proceeds. At each step, only load:
1. The current tool
2. Context relevant to that tool's domain
3. The likely next 1-2 tools

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     HIERARCHICAL CASCADING EXECUTION                             │
│                                                                                 │
│  Time ─────────────────────────────────────────────────────────────────────►    │
│                                                                                 │
│  STEP 1: Discovery                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │                                                                         │    │
│  │   LOADED IN CONTEXT:                                                   │    │
│  │   ┌─────────────────┐                                                  │    │
│  │   │ sitemap-        │  ← Current tool                                  │    │
│  │   │ discoverer      │                                                  │    │
│  │   └────────┬────────┘                                                  │    │
│  │            │                                                            │    │
│  │            │ likely next                                                │    │
│  │            ▼                                                            │    │
│  │   ┌─────────────────┐                                                  │    │
│  │   │  page-fetcher   │  ← Preloaded (90% likely)                        │    │
│  │   └─────────────────┘                                                  │    │
│  │                                                                         │    │
│  │   Context: [web-crawling basics, robots.txt rules]                     │    │
│  │   Tokens: ~800                                                          │    │
│  │                                                                         │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│                              ↓ output: sitemap with 47 pages                    │
│                                                                                 │
│  STEP 2: Fetch Pages                                                            │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │                                                                         │    │
│  │   LOADED IN CONTEXT:                                                   │    │
│  │   ┌─────────────────┐                                                  │    │
│  │   │  page-fetcher   │  ← Current tool                                  │    │
│  │   └────────┬────────┘                                                  │    │
│  │            │                                                            │    │
│  │     ┌──────┴──────┐   likely next (fan out to parallel)                │    │
│  │     ▼             ▼                                                     │    │
│  │   ┌─────┐     ┌─────────────┐                                          │    │
│  │   │ SEO │     │ PERFORMANCE │  ← Domain branches preloaded              │    │
│  │   │tools│     │   tools     │                                          │    │
│  │   └─────┘     └─────────────┘                                          │    │
│  │                                                                         │    │
│  │   Context: [HTTP fetching, rate limiting, caching headers]             │    │
│  │   Tokens: ~600                                                          │    │
│  │                                                                         │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│                              ↓ output: 47 page objects                          │
│                                                                                 │
│  STEP 3-7: SEO Analysis (parallel group)                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │                                                                         │    │
│  │   LOADED IN CONTEXT:                                                   │    │
│  │                                                                         │    │
│  │   ┌─────────────┬─────────────┬─────────────┬─────────────┐           │    │
│  │   │ meta-tag    │ heading     │ internal    │ schema      │           │    │
│  │   │ analyzer    │ analyzer    │ link        │ checker     │           │    │
│  │   │             │             │ analyzer    │             │           │    │
│  │   └─────────────┴─────────────┴─────────────┴─────────────┘           │    │
│  │         │             │             │             │                    │    │
│  │         └─────────────┴──────┬──────┴─────────────┘                    │    │
│  │                              ▼                                          │    │
│  │                    ┌─────────────────┐                                 │    │
│  │                    │ seo-score-calc  │  ← Convergence point            │    │
│  │                    └─────────────────┘                                 │    │
│  │                                                                         │    │
│  │   Context: [SEO SKILL - full domain context loaded]                    │    │
│  │   Tokens: ~2,400                                                        │    │
│  │                                                                         │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  ... similar parallel groups for PERFORMANCE, ACCESSIBILITY, SECURITY ...       │
│                                                                                 │
│  FINAL STEP: Report Generation                                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │                                                                         │    │
│  │   LOADED IN CONTEXT:                                                   │    │
│  │                                                                         │    │
│  │   ┌───────────────────────┐                                            │    │
│  │   │ action-plan-generator │  ← Current tool                            │    │
│  │   └───────────┬───────────┘                                            │    │
│  │               │                                                         │    │
│  │               ▼                                                         │    │
│  │   ┌───────────────────────┐                                            │    │
│  │   │ audit-report-generator│  ← Final tool                              │    │
│  │   └───────────────────────┘                                            │    │
│  │                                                                         │    │
│  │   Context: [report writing, prioritization frameworks, all scores]     │    │
│  │   Tokens: ~1,800                                                        │    │
│  │                                                                         │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## The Full Tree Visualization

Here's the complete hierarchical tree for the website audit:

```
                                    USER QUERY
                                        │
                                        │ "audit my website..."
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
              ┌─────────┐         ┌─────────┐         ┌─────────┐
              │ PLAN A  │         │ PLAN B  │         │ PLAN C  │
              │thorough │         │  quick  │         │balanced │
              └────┬────┘         └────┬────┘         └────┬────┘
                   │                   │                   │
                   │                   │                   │
         ┌─────────┴─────────┐         │         ┌────────┴────────┐
         │                   │         │         │                 │
         ▼                   ▼         ▼         ▼                 ▼
    ┌─────────┐         ┌─────────┐  (...)  ┌─────────┐       ┌─────────┐
    │  SKILL  │         │  SKILL  │         │  SKILL  │       │  SKILL  │
    │   SEO   │         │SECURITY │         │  PERF   │       │  A11Y   │
    └────┬────┘         └────┬────┘         └────┬────┘       └────┬────┘
         │                   │                   │                 │
         │ context           │ context           │ context         │ context
         │ docs              │ docs              │ docs            │ docs
         ▼                   ▼                   ▼                 ▼
    ┌─────────┐         ┌─────────┐         ┌─────────┐       ┌─────────┐
    │meta-tag │         │ssl-check│         │lighthouse│      │wcag-    │
    │heading  │         │headers  │         │webvitals│       │contrast │
    │links    │         │vulns    │         │assets   │       │alt-text │
    │schema   │         │...      │         │...      │       │keyboard │
    └─────────┘         └─────────┘         └─────────┘       └─────────┘



DETAIL: Cascading through SEO branch
═══════════════════════════════════════════════════════════════════════════════

Step 1                    Step 2                    Step 3 (parallel)
─────────────────────────────────────────────────────────────────────────────

   ┌──────────────┐
   │   sitemap-   │
   │  discoverer  │◄─── ACTIVE
   └──────┬───────┘
          │
          │ preload likely next
          ▼
   ┌──────────────┐        ┌──────────────┐
   │    page-     │        │    page-     │
   │   fetcher    │───────►│   fetcher    │◄─── ACTIVE
   └──────────────┘        └──────┬───────┘
      (shadowed)                  │
                                  │ preload domain tools
                                  ▼
                           ┌──────────────┐
                           │  SEO tools   │
                           │  (grouped)   │───────────────┐
                           └──────────────┘               │
                              (shadowed)                  │
                                                          ▼
                                                   ┌─────────────────────────┐
                                                   │                         │
                                                   │   ┌──────────────┐      │
                                                   │   │  meta-tag    │◄──   │
                                                   │   │  analyzer    │  │   │
                                                   │   └──────────────┘  │   │
                                                   │                     │   │
                                                   │   ┌──────────────┐  │   │
                                                   │   │  heading     │◄─┤   │
                                                   │   │  analyzer    │  │   │
                                                   │   └──────────────┘  ├───┼── ALL ACTIVE
                                                   │                     │   │   (parallel)
                                                   │   ┌──────────────┐  │   │
                                                   │   │  link        │◄─┤   │
                                                   │   │  analyzer    │  │   │
                                                   │   └──────────────┘  │   │
                                                   │                     │   │
                                                   │   ┌──────────────┐  │   │
                                                   │   │  schema      │◄──   │
                                                   │   │  checker     │      │
                                                   │   └──────────────┘      │
                                                   │                         │
                                                   │  + SEO SKILL CONTEXT    │
                                                   │    loaded for all       │
                                                   │                         │
                                                   └─────────────────────────┘


CONTEXT SIZE AT EACH STEP
═══════════════════════════════════════════════════════════════════════════════

Traditional approach (load everything):
┌─────────────────────────────────────────────────────────────────────────────┐
│ █████████████████████████████████████████████████████████████████████████   │
│ ALL 22 tools + ALL skill docs = ~45,000 tokens                              │
└─────────────────────────────────────────────────────────────────────────────┘

Hierarchical cascading approach:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│ Step 1:  ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~800 tokens           │
│ Step 2:  ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~600 tokens           │
│ Step 3:  █████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2,400 tokens         │
│ Step 4:  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2,100 tokens         │
│ Step 5:  ███████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~1,900 tokens         │
│ Step 6:  ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~1,600 tokens         │
│ Final:   ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~1,800 tokens         │
│                                                                             │
│ Average per step: ~1,600 tokens (96% reduction from loading everything)     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## The Algorithm

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  1. PLAN GENERATION PHASE                                                   │
│     ─────────────────────                                                   │
│                                                                             │
│     Input: User query                                                       │
│     Output: Y candidate plans                                               │
│                                                                             │
│     ┌─────────────┐                                                         │
│     │ Query       │                                                         │
│     │ Analyzer    │──────► Extract intent, entities, constraints            │
│     └──────┬──────┘                                                         │
│            │                                                                │
│            ▼                                                                │
│     ┌─────────────┐                                                         │
│     │ Tool        │                                                         │
│     │ Searcher    │──────► Find candidate tools (semantic + keyword)        │
│     └──────┬──────┘                                                         │
│            │                                                                │
│            ▼                                                                │
│     ┌─────────────┐                                                         │
│     │ Plan        │                                                         │
│     │ Generator   │──────► Generate Y distinct plans                        │
│     └─────────────┘                                                         │
│                                                                             │
│                                                                             │
│  2. SKILL INFERENCE PHASE                                                   │
│     ──────────────────────                                                  │
│                                                                             │
│     Input: Y plans                                                          │
│     Output: Skill domains + contextual docs                                 │
│                                                                             │
│     ┌─────────────┐                                                         │
│     │ Tool        │                                                         │
│     │ Clusterer   │──────► Group tools by domain/category                   │
│     └──────┬──────┘                                                         │
│            │                                                                │
│            ▼                                                                │
│     ┌─────────────┐                                                         │
│     │ Skill       │                                                         │
│     │ Mapper      │──────► Map domains → skill documents                    │
│     └──────┬──────┘                                                         │
│            │                                                                │
│            ▼                                                                │
│     ┌─────────────┐                                                         │
│     │ Context     │                                                         │
│     │ Loader      │──────► Fetch relevant docs, examples, constraints       │
│     └─────────────┘                                                         │
│                                                                             │
│                                                                             │
│  3. EXECUTION PHASE (cascading)                                             │
│     ───────────────────────────                                             │
│                                                                             │
│     For each step:                                                          │
│                                                                             │
│     ┌─────────────┐                                                         │
│     │ Probability │                                                         │
│     │ Calculator  │──────► Calculate P(next_tool) for all candidates        │
│     └──────┬──────┘                                                         │
│            │                                                                │
│            ▼                                                                │
│     ┌─────────────┐                                                         │
│     │ Context     │                                                         │
│     │ Assembler   │──────► current_tool + top_k likely + domain_context     │
│     └──────┬──────┘                                                         │
│            │                                                                │
│            ▼                                                                │
│     ┌─────────────┐                                                         │
│     │ Executor    │──────► Run tool, capture output                         │
│     └──────┬──────┘                                                         │
│            │                                                                │
│            ▼                                                                │
│     ┌─────────────┐                                                         │
│     │ State       │                                                         │
│     │ Updater     │──────► Update context, prune unlikely branches          │
│     └─────────────┘                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Probability-Based Preloading

At each step, calculate which tools are most likely needed next:

```
                          CURRENT STATE
                               │
                               │ completed: [step_1, step_2]
                               │ current: step_3
                               │
                               ▼
              ┌────────────────────────────────────┐
              │       NEXT TOOL PROBABILITIES      │
              │                                    │
              │  Based on:                         │
              │  • Plan structure (what's next)    │
              │  • Current output type             │
              │  • Historical patterns             │
              │  • User's stated goals             │
              │                                    │
              │  ┌──────────────────────────────┐  │
              │  │ seo-score-calc      P=0.92  │──┼──► PRELOAD
              │  │ accessibility-check P=0.85  │──┼──► PRELOAD
              │  │ perf-score-calc     P=0.78  │──┼──► PRELOAD
              │  │ security-scanner    P=0.45  │  │
              │  │ other-tool          P=0.12  │  │
              │  │ ...                         │  │
              │  └──────────────────────────────┘  │
              │                                    │
              │  Threshold: P > 0.70 → preload     │
              │                                    │
              └────────────────────────────────────┘
```

---

## The User Choice Interface

When Y plans are generated, present them to the user:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  Your request: "Audit my website for SEO, performance, and security"        │
│                                                                             │
│  I've generated 3 approaches:                                               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ◉ PLAN A: Comprehensive Audit                              [SELECT] │   │
│  │                                                                     │   │
│  │   22 steps • ~15 min • $2.00 estimated                             │   │
│  │                                                                     │   │
│  │   Covers: SEO (7), Performance (3), Accessibility (4), Security (3)│   │
│  │   Plus: Scoring, prioritization, PDF report                        │   │
│  │                                                                     │   │
│  │   Skills loaded: SEO best practices, WCAG 2.1, Security headers,   │   │
│  │                  Core Web Vitals, Schema.org markup                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ○ PLAN B: Quick Scan                                       [SELECT] │   │
│  │                                                                     │   │
│  │   8 steps • ~3 min • $0.40 estimated                               │   │
│  │                                                                     │   │
│  │   Covers: Lighthouse audit, basic security scan                    │   │
│  │   Output: Summary scores only                                      │   │
│  │                                                                     │   │
│  │   Skills loaded: Lighthouse interpretation, SSL basics             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ○ PLAN C: Balanced Review                                  [SELECT] │   │
│  │                                                                     │   │
│  │   14 steps • ~8 min • $1.20 estimated                              │   │
│  │                                                                     │   │
│  │   Covers: Key checks from each domain                              │   │
│  │   Output: Prioritized action items                                 │   │
│  │                                                                     │   │
│  │   Skills loaded: SEO essentials, A11y critical, Security must-haves│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Or: [Let AI decide based on your site] [Customize plan] [Cancel]          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Adaptive Execution: Plan as Guide, Not Law

Once skills are loaded from the plan, execution can be:

### Mode 1: Strict Plan Following
```
Plan Step 1 → Execute Tool A → Plan Step 2 → Execute Tool B → ...

The plan is the law. Execute exactly as specified.
```

### Mode 2: Plan-Guided Free Execution
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  Plan provides:                                                             │
│  • Which tools are available (pre-approved set)                             │
│  • What context/skills are loaded                                           │
│  • Rough ordering guidance                                                  │
│                                                                             │
│  Model decides:                                                             │
│  • Exact tool call order                                                    │
│  • Whether to skip steps                                                    │
│  • Whether to repeat steps                                                  │
│  • Parameter values                                                         │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Agent has access to:                                               │   │
│  │                                                                      │   │
│  │  TOOLS (from plan):        SKILLS (from plan):                      │   │
│  │  ├── sitemap-discoverer    ├── SEO best practices                   │   │
│  │  ├── page-fetcher          ├── WCAG 2.1 guidelines                  │   │
│  │  ├── meta-analyzer         ├── Security header docs                 │   │
│  │  ├── wcag-checker          └── Core Web Vitals guide                │   │
│  │  ├── ssl-checker                                                    │   │
│  │  └── report-generator                                               │   │
│  │                                                                      │   │
│  │  Agent can call these tools in any order, with the skills           │   │
│  │  providing domain expertise for intelligent decisions.              │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Mode 3: Hybrid (Checkpoints)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  Phase 1: Discovery          Phase 2: Analysis          Phase 3: Report    │
│  ─────────────────          ──────────────────          ────────────────   │
│                                                                             │
│  [sitemap-discoverer]       [CHECKPOINT: got pages]     [CHECKPOINT: got   │
│         │                           │                    all scores]       │
│         ▼                           ▼                           │          │
│  [page-fetcher]             Agent freely uses:                  ▼          │
│         │                   • seo tools                 [action-plan-gen]  │
│         ▼                   • perf tools                        │          │
│  [CHECKPOINT]               • a11y tools                        ▼          │
│                             • security tools            [report-generator] │
│                             in whatever order                              │
│                             makes sense                                    │
│                                                                             │
│  Strict                     Flexible                    Strict             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Dynamic Tool Installation (Registry Integration)

In a registry-backed system (like TPMJS), if the agent needs a tool that isn't loaded:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  During execution, agent realizes it needs a tool not in the plan:          │
│                                                                             │
│  Agent: "The SSL certificate uses ECDSA which my ssl-checker doesn't        │
│          fully support. I need a more specialized tool."                    │
│                                                                             │
│         ┌──────────────────────────────────────────────────────┐            │
│         │                                                      │            │
│         │   🔍 Searching registry for: "ECDSA certificate"     │            │
│         │                                                      │            │
│         │   Found:                                             │            │
│         │   ┌──────────────────────────────────────────────┐   │            │
│         │   │ ecdsa-cert-analyzer                          │   │            │
│         │   │ "Analyzes ECDSA and EdDSA certificates"     │   │            │
│         │   │ Health: ✓ Healthy                           │   │            │
│         │   │ Quality: 0.87                               │   │            │
│         │   └──────────────────────────────────────────────┘   │            │
│         │                                                      │            │
│         │   [Install and use] [Skip this check] [Ask user]     │            │
│         │                                                      │            │
│         └──────────────────────────────────────────────────────┘            │
│                                                                             │
│  On install:                                                                │
│  1. Fetch tool metadata from registry                                       │
│  2. Load tool's associated skill/context docs                               │
│  3. Add to current execution context                                        │
│  4. Continue execution                                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Summary: The Complete Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                          USER QUERY ARRIVES                                 │
│                                 │                                           │
│                                 ▼                                           │
│                    ┌───────────────────────┐                                │
│                    │  1. GENERATE Y PLANS  │                                │
│                    │     (speculative)     │                                │
│                    └───────────┬───────────┘                                │
│                                │                                            │
│              ┌─────────────────┼─────────────────┐                          │
│              ▼                 ▼                 ▼                          │
│         ┌────────┐        ┌────────┐        ┌────────┐                      │
│         │ Plan A │        │ Plan B │        │ Plan C │                      │
│         └────┬───┘        └────┬───┘        └────┬───┘                      │
│              │                 │                 │                          │
│              └─────────────────┼─────────────────┘                          │
│                                │                                            │
│                                ▼                                            │
│                    ┌───────────────────────┐                                │
│                    │ 2. CLUSTER TOOLS BY   │                                │
│                    │    DOMAIN/SKILL       │                                │
│                    └───────────┬───────────┘                                │
│                                │                                            │
│              ┌─────────┬───────┼───────┬─────────┐                          │
│              ▼         ▼       ▼       ▼         ▼                          │
│         ┌────────┐ ┌──────┐ ┌─────┐ ┌──────┐ ┌───────┐                      │
│         │SEO     │ │Perf  │ │A11y │ │Sec   │ │Report │                      │
│         │domain  │ │domain│ │domain│ │domain│ │domain │                      │
│         └────┬───┘ └──┬───┘ └──┬──┘ └──┬───┘ └───┬───┘                      │
│              │        │        │       │         │                          │
│              └────────┴────────┼───────┴─────────┘                          │
│                                │                                            │
│                                ▼                                            │
│                    ┌───────────────────────┐                                │
│                    │ 3. LOAD SKILL DOCS    │                                │
│                    │    FOR EACH DOMAIN    │                                │
│                    └───────────┬───────────┘                                │
│                                │                                            │
│                                ▼                                            │
│             ┌──────────────────────────────────────┐                        │
│             │  4. PRESENT PLANS TO USER (optional) │                        │
│             │     or AUTO-SELECT                   │                        │
│             └───────────────────┬──────────────────┘                        │
│                                 │                                           │
│                                 ▼                                           │
│                    ┌───────────────────────┐                                │
│                    │ 5. EXECUTE WITH       │                                │
│                    │    CASCADING CONTEXT  │                                │
│                    └───────────┬───────────┘                                │
│                                │                                            │
│              ┌─────────────────┴─────────────────┐                          │
│              │                                   │                          │
│              ▼                                   ▼                          │
│    ┌─────────────────────┐            ┌─────────────────────┐              │
│    │ Strict: Follow plan │            │ Flexible: Use plan  │              │
│    │ exactly             │            │ as context guide    │              │
│    └─────────────────────┘            └─────────────────────┘              │
│                                                                             │
│    At each step:                                                            │
│    • Load only current tool + likely next tools                             │
│    • Load only relevant domain context                                      │
│    • Keep context window small (~1-3k tokens)                               │
│    • Prune unlikely branches as execution proceeds                          │
│                                                                             │
│                                 │                                           │
│                                 ▼                                           │
│                    ┌───────────────────────┐                                │
│                    │      FINAL OUTPUT     │                                │
│                    └───────────────────────┘                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Takeaways

1. **Plans reveal skills**: Instead of loading all context upfront, generate plans first
   and let them tell you what context is actually needed.

2. **Small context, right context**: At each step, load only what's needed for that step
   plus likely next steps. 96% reduction in context size.

3. **User choice as a feature**: Multiple plans aren't a bug—they're a feature. Users
   can pick their preferred approach.

4. **Adaptive execution**: Plans can be strict guides or loose frameworks. The skill
   context enables intelligent tool use either way.

5. **Registry as escape hatch**: If the agent needs something not in the plan, it can
   query the registry, install on-demand, and continue.

The hierarchical cascading tree pattern makes agents both more capable (access to any
tool in the registry) and more efficient (minimal context at each step).
