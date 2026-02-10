# SEO Content Plan for TPMJS

> Organic search strategy to establish TPMJS as the authoritative source for AI tool discovery, MCP protocol resources, and AI agent development.

---

## Keyword Research

### Informational Keywords (Top of Funnel)

These keywords target developers researching AI agents, MCP, and tool calling. Goal: educate and build awareness.

| # | Keyword | Est. Monthly Volume | Difficulty | Current Opportunity |
|---|---------|-------------------|------------|---------------------|
| 1 | what is mcp protocol | 2,400 | Low | No authoritative guide exists yet; first-mover advantage |
| 2 | model context protocol | 1,900 | Low | Anthropic docs are primary source; room for developer-focused content |
| 3 | ai agent tools | 1,600 | Medium | Fragmented results, mostly listicles; opportunity for registry-backed content |
| 4 | ai tool calling | 1,300 | Low | Mostly OpenAI docs; need framework-agnostic resource |
| 5 | function calling vs tool calling | 880 | Low | No definitive comparison exists |
| 6 | how to build ai agent | 5,400 | High | Competitive but high volume; differentiate with tools-first approach |
| 7 | mcp server tutorial | 720 | Low | Very few tutorials; high intent |
| 8 | ai agent architecture | 1,100 | Medium | Academic content dominates; need practical developer guide |
| 9 | what is tool use in ai | 590 | Low | Underserved query with growing volume |
| 10 | mcp vs function calling | 480 | Low | No content exists; pure first-mover |

### Commercial Keywords (Middle of Funnel)

These keywords target developers evaluating solutions. Goal: position TPMJS as the answer.

| # | Keyword | Est. Monthly Volume | Difficulty | Current Opportunity |
|---|---------|-------------------|------------|---------------------|
| 11 | ai tools registry | 320 | Low | No established player; define the category |
| 12 | mcp tools list | 260 | Low | Scattered GitHub repos; no central registry |
| 13 | best ai agent framework | 2,100 | High | Competitive; TPMJS angles as "tools layer" complement |
| 14 | npm ai packages | 210 | Low | No aggregated resource exists |
| 15 | ai agent sdk | 1,400 | Medium | Vercel AI SDK dominates; position as complementary |
| 16 | mcp compatible tools | 170 | Low | Zero competition; own this keyword |
| 17 | ai tool marketplace | 480 | Medium | Emerging category; establish early |
| 18 | ai agent plugins | 590 | Medium | ChatGPT plugin association; redirect to MCP narrative |
| 19 | cursor mcp tools | 390 | Low | Growing with Cursor adoption; high intent |
| 20 | windsurf mcp setup | 210 | Low | Growing with Windsurf adoption; high intent |

### Transactional Keywords (Bottom of Funnel)

These keywords target developers ready to use a tool. Goal: convert to TPMJS users.

| # | Keyword | Est. Monthly Volume | Difficulty | Current Opportunity |
|---|---------|-------------------|------------|---------------------|
| 21 | install mcp tools | 170 | Low | No clear how-to guide; high conversion intent |
| 22 | tpmjs | 90 | Low | Brand keyword; must own position 1 |
| 23 | npm install ai tool | 140 | Low | Natural search for npm-native AI tools |
| 24 | mcp tool server setup | 210 | Low | Developers searching for implementation guidance |
| 25 | add tools to claude | 480 | Low | High intent; Claude users wanting capabilities |
| 26 | cursor add mcp server | 320 | Low | Cursor users wanting tool integration |
| 27 | ai agent tool integration | 260 | Medium | Developers building agents who need tools |
| 28 | publish mcp tool | 110 | Low | Tool authors looking to distribute |
| 29 | mcp registry | 140 | Low | Direct category search; must own |
| 30 | ai tools for developers | 720 | Medium | Broad but relevant; qualify with content |

---

## Programmatic SEO

### Template: `/tools/[category]` Pages

**URL pattern:** `tpmjs.com/tools/weather`, `tpmjs.com/tools/database`, `tpmjs.com/tools/email`

**Purpose:** Capture "[category] AI tools" searches and provide curated tool listings.

**Page structure:**

```
<h1>{Category} AI Tools</h1>
<p class="subtitle">
  {count} {category} tools available on TPMJS. Install with npm.
  Compatible with Claude, GPT, Cursor, and Windsurf.
</p>

<section id="featured">
  <h2>Featured {Category} Tools</h2>
  <!-- Top 3 tools by quality score, with descriptions and install commands -->
  <ToolCard tool={tool} showInstallCommand showDescription />
</section>

<section id="all-tools">
  <h2>All {Category} Tools</h2>
  <!-- Paginated list of all tools in category, sorted by quality score -->
  <ToolList category={category} sortBy="qualityScore" pageSize={20} />
</section>

<section id="getting-started">
  <h2>How to Use {Category} Tools with AI Agents</h2>
  <!-- 3-step guide specific to this category -->
  <Step number={1} title="Install">npm install {example-package}</Step>
  <Step number={2} title="Configure">Add to your MCP config</Step>
  <Step number={3} title="Use">Your AI agent can now {category-specific action}</Step>
</section>

<section id="faq">
  <h2>FAQ: {Category} AI Tools</h2>
  <!-- 5 category-specific FAQs with schema.org FAQ markup -->
  <FAQ items={categoryFaqs} />
</section>

<section id="related">
  <h2>Related Categories</h2>
  <!-- Links to 4-6 related categories -->
</section>
```

**SEO elements:**
- Title: `{Category} AI Tools - TPMJS Registry`
- Meta description: `Discover {count} {category} tools for AI agents. Install with npm, use with Claude, GPT, Cursor, and Windsurf through MCP. Browse the TPMJS registry.`
- H1: `{Category} AI Tools`
- Schema.org: `CollectionPage` with `ItemList` of tools
- Internal links: to individual tool pages, related categories, getting started guide
- Canonical: `https://tpmjs.com/tools/{category}`

**Target categories (initial 20):**
1. weather
2. database
3. email
4. file-system
5. web-scraping
6. api-client
7. authentication
8. payment
9. search
10. analytics
11. notification
12. storage
13. image-processing
14. pdf
15. calendar
16. translation
17. monitoring
18. testing
19. deployment
20. security

---

### Template: `/tools/[tool-name]` Individual Pages

**URL pattern:** `tpmjs.com/tools/tpmjs-weather`, `tpmjs.com/tools/tpmjs-stripe`

**Purpose:** Capture "[tool name] AI tool" and long-tail searches. Serve as the canonical page for each tool.

**Page structure:**

```
<header>
  <h1>{tool.displayName}</h1>
  <p class="description">{tool.description}</p>
  <BadgeRow>
    <Badge>{tool.category}</Badge>
    <Badge>{tool.tier}</Badge>
    <Badge>v{tool.version}</Badge>
    <Badge>{tool.npmDownloadsLastMonth} downloads/month</Badge>
  </BadgeRow>
</header>

<section id="install">
  <h2>Installation</h2>
  <CodeBlock>npm install {tool.npmPackageName}</CodeBlock>
  <Tabs>
    <Tab title="Claude">MCP config for Claude Desktop</Tab>
    <Tab title="Cursor">MCP config for Cursor</Tab>
    <Tab title="Windsurf">MCP config for Windsurf</Tab>
    <Tab title="Custom">Generic MCP client config</Tab>
  </Tabs>
</section>

<section id="tools">
  <h2>Available Tools</h2>
  <!-- List of all tools exposed by this package -->
  <ToolDefinition
    name={tool.name}
    description={tool.description}
    parameters={tool.inputSchema}
    returns={tool.outputSchema}
  />
</section>

<section id="examples">
  <h2>Usage Examples</h2>
  <!-- 2-3 examples of AI agents using this tool -->
  <Example title="Basic usage" prompt="..." response="..." />
</section>

<section id="metadata">
  <h2>Package Details</h2>
  <MetadataTable>
    <Row label="npm package">{tool.npmPackageName}</Row>
    <Row label="Version">{tool.npmVersion}</Row>
    <Row label="License">{tool.license}</Row>
    <Row label="Author">{tool.author}</Row>
    <Row label="Repository">{tool.repositoryUrl}</Row>
    <Row label="Last updated">{tool.updatedAt}</Row>
    <Row label="Quality score">{tool.qualityScore}</Row>
  </MetadataTable>
</section>

<section id="related">
  <h2>Similar Tools</h2>
  <!-- 4-6 tools in the same category -->
</section>
```

**SEO elements:**
- Title: `{tool.displayName} - AI Tool for {category} | TPMJS`
- Meta description: `{tool.description}. Install with npm, use with Claude, GPT, Cursor, and Windsurf. {tool.npmDownloadsLastMonth} monthly downloads.`
- H1: `{tool.displayName}`
- Schema.org: `SoftwareApplication` with `applicationCategory: "DeveloperApplication"`
- Structured data: `HowTo` for installation steps
- Internal links: to category page, related tools, getting started guide
- Canonical: `https://tpmjs.com/tools/{tool.slug}`

---

### Template: "Best [X] AI Tools" Comparison Pages

**URL pattern:** `tpmjs.com/compare/best-weather-ai-tools`, `tpmjs.com/compare/best-database-ai-tools`

**Purpose:** Capture "best [X] AI tools" comparison searches. High commercial intent.

**Page structure:**

```
<h1>Best {Category} AI Tools in {year}</h1>
<p class="intro">
  We compared {count} {category} tools available on TPMJS based on
  quality score, download count, documentation quality, and MCP compatibility.
  Here are the top picks for {year}.
</p>

<section id="top-picks">
  <h2>Top {Category} AI Tools</h2>
  <!-- Ranked list with detailed comparison -->
  <ComparisonCard rank={1} tool={tool}>
    <Pros items={["Fast", "Well-documented", "Active maintenance"]} />
    <Cons items={["Limited free tier"]} />
    <InstallCommand>npm install {tool.npmPackageName}</InstallCommand>
  </ComparisonCard>
  <!-- Repeat for top 5-10 tools -->
</section>

<section id="comparison-table">
  <h2>Feature Comparison</h2>
  <ComparisonTable tools={topTools} features={[
    "MCP Support",
    "TypeScript Types",
    "Monthly Downloads",
    "Quality Score",
    "Last Updated",
    "License",
    "Documentation",
  ]} />
</section>

<section id="how-we-ranked">
  <h2>How We Ranked These Tools</h2>
  <p>Methodology explanation: quality score formula, what factors matter, etc.</p>
</section>

<section id="faq">
  <h2>FAQ</h2>
  <FAQ items={comparisonFaqs} />
</section>
```

**SEO elements:**
- Title: `Best {Category} AI Tools ({year}) - TPMJS Comparison`
- Meta description: `Compare the top {count} {category} AI tools. Ranked by quality score, downloads, and MCP compatibility. Install any tool with npm.`
- Schema.org: `ItemList` with ranked tools
- Updated yearly with fresh data from the registry

---

### Template: "[Tool A] vs [Tool B]" Pages

**URL pattern:** `tpmjs.com/compare/axios-vs-node-fetch-ai-tool`

**Purpose:** Capture direct comparison searches between competing tools.

**Page structure:**

```
<h1>{Tool A} vs {Tool B}: Which AI Tool is Better?</h1>
<p class="intro">
  Side-by-side comparison of {Tool A} and {Tool B} for AI agent use cases.
  Both are available on TPMJS and compatible with Claude, GPT, Cursor, and Windsurf.
</p>

<section id="quick-comparison">
  <h2>Quick Comparison</h2>
  <SideBySideTable toolA={toolA} toolB={toolB} metrics={[
    "Monthly Downloads",
    "Quality Score",
    "MCP Tool Count",
    "TypeScript Support",
    "Last Updated",
    "Bundle Size",
    "License",
  ]} />
</section>

<section id="tool-a-overview">
  <h2>{Tool A}: Overview</h2>
  <p>{toolA.description}</p>
  <ToolStrengths tool={toolA} />
  <CodeBlock title="Install">{toolA.installCommand}</CodeBlock>
</section>

<section id="tool-b-overview">
  <h2>{Tool B}: Overview</h2>
  <p>{toolB.description}</p>
  <ToolStrengths tool={toolB} />
  <CodeBlock title="Install">{toolB.installCommand}</CodeBlock>
</section>

<section id="when-to-use">
  <h2>When to Use Each</h2>
  <UseCase title="Choose {Tool A} when:">
    <li>...</li>
  </UseCase>
  <UseCase title="Choose {Tool B} when:">
    <li>...</li>
  </UseCase>
</section>

<section id="verdict">
  <h2>Verdict</h2>
  <p>Data-driven recommendation based on quality scores and use case fit.</p>
</section>
```

**SEO elements:**
- Title: `{Tool A} vs {Tool B} for AI Agents - TPMJS Comparison`
- Meta description: `Compare {Tool A} and {Tool B} for AI agent tool calling. Side-by-side metrics, features, and recommendations. Both available on TPMJS.`
- Schema.org: `ComparisonPage` (or `WebPage` with comparison structured data)
- Internal links: to both tool pages, category page, "best [category]" page

---

## Content Clusters

### Cluster 1: "AI Agent Tools" (Pillar + 10 Supporting Articles)

**Pillar page:** `tpmjs.com/guides/ai-agent-tools`
- Title: "The Complete Guide to AI Agent Tools: Discovery, Installation, and Integration"
- Word count: 3,000-4,000
- Covers: what AI agent tools are, why they matter, how to find them, how to install them, how to build them
- Links to all 10 supporting articles

**Supporting articles:**

| # | Title | Target Keyword | Word Count |
|---|-------|---------------|------------|
| 1 | What Are AI Agent Tools? A Developer's Introduction | ai agent tools | 1,500 |
| 2 | How AI Agents Use Tools: Function Calling Explained | ai tool calling | 1,800 |
| 3 | The 10 Most Popular AI Agent Tools on TPMJS | popular ai tools | 2,000 |
| 4 | How to Build a Custom AI Tool for TPMJS | build ai tool | 2,500 |
| 5 | AI Agent Tool Security: Permissions, Sandboxing, and Trust | ai tool security | 1,800 |
| 6 | Dynamic Tool Loading: How AI Agents Pick the Right Tools | dynamic tool loading | 1,500 |
| 7 | AI Tool Versioning: Managing Updates Without Breaking Agents | tool versioning | 1,200 |
| 8 | Testing AI Agent Tools: A Practical Guide | testing ai tools | 2,000 |
| 9 | AI Agent Tool Performance: Latency, Caching, and Optimization | ai tool performance | 1,500 |
| 10 | The Future of AI Agent Tools: Predictions for the Next 2 Years | future ai tools | 1,200 |

**Internal linking strategy:**
- Pillar links to all 10 articles
- Each article links back to pillar and to 2-3 sibling articles
- All articles link to relevant `/tools/[category]` pages
- All articles include TPMJS installation CTAs

---

### Cluster 2: "MCP Protocol" (Pillar + 8 Supporting Articles)

**Pillar page:** `tpmjs.com/guides/mcp-protocol`
- Title: "MCP (Model Context Protocol): The Developer's Complete Guide"
- Word count: 4,000-5,000
- Covers: what MCP is, how it works, architecture, comparison to alternatives, getting started, ecosystem
- Links to all 8 supporting articles

**Supporting articles:**

| # | Title | Target Keyword | Word Count |
|---|-------|---------------|------------|
| 1 | What is MCP? The Model Context Protocol Explained | what is mcp | 1,800 |
| 2 | MCP vs OpenAI Function Calling: A Technical Comparison | mcp vs function calling | 2,000 |
| 3 | Building Your First MCP Server: Step-by-Step Tutorial | mcp server tutorial | 2,500 |
| 4 | MCP Tools, Resources, and Prompts: Understanding the Three Primitives | mcp primitives | 1,500 |
| 5 | Setting Up MCP in Cursor: Complete Configuration Guide | cursor mcp setup | 1,800 |
| 6 | Setting Up MCP in Windsurf: Complete Configuration Guide | windsurf mcp setup | 1,800 |
| 7 | Setting Up MCP in Claude Desktop: Complete Configuration Guide | claude mcp setup | 1,800 |
| 8 | The MCP Ecosystem: Servers, Clients, Registries, and Transports | mcp ecosystem | 2,000 |

**Internal linking strategy:**
- Pillar links to all 8 articles
- Setup guides (5, 6, 7) cross-link to each other
- All articles link to TPMJS as the MCP registry
- Technical articles link to relevant tool category pages

---

### Cluster 3: "Building AI Agents" (Pillar + 8 Supporting Articles)

**Pillar page:** `tpmjs.com/guides/building-ai-agents`
- Title: "Building AI Agents: A Developer's Guide to Architectures, Tools, and Frameworks"
- Word count: 4,000-5,000
- Covers: agent architectures, tool integration patterns, framework comparison, deployment, monitoring
- Links to all 8 supporting articles

**Supporting articles:**

| # | Title | Target Keyword | Word Count |
|---|-------|---------------|------------|
| 1 | AI Agent Architecture Patterns: ReAct, Plan-Execute, and Beyond | ai agent architecture | 2,500 |
| 2 | Giving AI Agents Tools: The Integration Pattern Guide | ai agent tool integration | 2,000 |
| 3 | Comparing AI Agent Frameworks: LangChain, CrewAI, Vercel AI SDK, and Autogen | ai agent framework comparison | 3,000 |
| 4 | Building an AI Agent with Node.js and TPMJS | build ai agent nodejs | 2,500 |
| 5 | AI Agent Error Handling: Retries, Fallbacks, and Graceful Degradation | ai agent error handling | 1,500 |
| 6 | Multi-Agent Systems: When One Agent Isn't Enough | multi agent systems | 2,000 |
| 7 | Deploying AI Agents to Production: Infrastructure and Monitoring | deploy ai agent | 2,000 |
| 8 | AI Agent Cost Optimization: Reducing Token Usage and API Costs | ai agent cost | 1,500 |

**Internal linking strategy:**
- Pillar links to all 8 articles
- Framework comparison (3) links to TPMJS as tools layer for all frameworks
- Tutorial (4) uses TPMJS tools throughout
- All articles include contextual links to relevant tool categories

---

## Glossary Pages

**URL pattern:** `tpmjs.com/glossary/[term]`

**Purpose:** Capture definitional searches ("what is [term]"), build topical authority, and provide internal link targets for content clusters.

**Page structure for each term:**
```
<h1>What is {Term}?</h1>
<p class="definition">Clear, 2-3 sentence definition.</p>

<section id="explanation">
  <h2>{Term} Explained</h2>
  <p>3-5 paragraphs explaining the concept in developer-friendly language.</p>
</section>

<section id="example">
  <h2>Example</h2>
  <CodeBlock>{practical code example}</CodeBlock>
</section>

<section id="related">
  <h2>Related Concepts</h2>
  <GlossaryLinks terms={relatedTerms} />
</section>

<section id="tools">
  <h2>Related Tools on TPMJS</h2>
  <ToolList category={relevantCategory} limit={5} />
</section>
```

**20 Glossary Terms:**

| # | Term | Target Keyword | Related Cluster |
|---|------|---------------|-----------------|
| 1 | Model Context Protocol (MCP) | what is mcp | Cluster 2 |
| 2 | AI Agent | what is ai agent | Cluster 3 |
| 3 | Tool Calling | what is tool calling | Cluster 1 |
| 4 | Function Calling | what is function calling | Cluster 1 |
| 5 | MCP Server | what is mcp server | Cluster 2 |
| 6 | MCP Client | what is mcp client | Cluster 2 |
| 7 | MCP Transport | what is mcp transport | Cluster 2 |
| 8 | Tool Schema | what is tool schema | Cluster 1 |
| 9 | AI Tool Registry | what is ai tool registry | Cluster 1 |
| 10 | ReAct Pattern | what is react pattern ai | Cluster 3 |
| 11 | Prompt Engineering | what is prompt engineering | Cluster 3 |
| 12 | Context Window | what is context window | Cluster 3 |
| 13 | Token | what are tokens llm | Cluster 3 |
| 14 | Embedding | what are embeddings | Cluster 1 |
| 15 | RAG (Retrieval-Augmented Generation) | what is rag | Cluster 3 |
| 16 | Agentic Workflow | what is agentic workflow | Cluster 3 |
| 17 | Tool Use | what is tool use ai | Cluster 1 |
| 18 | Structured Output | what is structured output | Cluster 1 |
| 19 | Streaming | what is streaming llm | Cluster 2 |
| 20 | Hallucination | what is ai hallucination | Cluster 3 |

---

## Technical SEO Requirements

### Site Architecture

```
tpmjs.com/
  /tools/                          # Tool registry (main product pages)
    /tools/[category]/             # Category pages (programmatic)
    /tools/[tool-name]/            # Individual tool pages (programmatic)
  /compare/                        # Comparison pages
    /compare/best-[category]-ai-tools/  # "Best X" pages
    /compare/[tool-a]-vs-[tool-b]/      # Versus pages
  /guides/                         # Content cluster pillars
    /guides/ai-agent-tools/
    /guides/mcp-protocol/
    /guides/building-ai-agents/
  /blog/                           # Supporting articles
    /blog/[article-slug]/
  /glossary/                       # Glossary terms
    /glossary/[term]/
  /docs/                           # Technical documentation
```

### On-Page SEO Checklist (Every Page)

- [ ] Unique title tag (under 60 characters)
- [ ] Unique meta description (under 160 characters)
- [ ] Single H1 tag containing primary keyword
- [ ] Logical heading hierarchy (H1 > H2 > H3)
- [ ] Schema.org structured data (type depends on page)
- [ ] Open Graph tags for social sharing
- [ ] Twitter Card tags
- [ ] Canonical URL
- [ ] Internal links to 3-5 related pages
- [ ] External links to 1-2 authoritative sources (Anthropic docs, npm, etc.)
- [ ] Alt text on all images
- [ ] Page load time under 2 seconds
- [ ] Mobile responsive

### Technical Requirements

- **Sitemap:** Auto-generated XML sitemap at `tpmjs.com/sitemap.xml` including all tool pages, category pages, guides, and glossary entries
- **Robots.txt:** Allow all crawlers, disallow `/api/` routes
- **Structured data:** JSON-LD on every page (SoftwareApplication for tools, Article for blog posts, FAQPage for FAQ sections, HowTo for tutorials)
- **Page speed:** Target Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Dynamic rendering:** All tool pages should be server-rendered (Next.js SSR/ISR) for crawlability
- **Hreflang:** Not needed initially (English only), but plan for future internationalization

### Link Building Strategy

**Tier 1: High Authority (target 5-10 links)**
- Anthropic MCP documentation (contribute to ecosystem page)
- Vercel case studies (Turborepo monorepo deployment)
- npm blog (ecosystem spotlight)
- Dev.to featured posts (naturally earned)

**Tier 2: Medium Authority (target 20-30 links)**
- AI tool comparison sites
- Developer newsletter features
- Tech podcast show notes
- GitHub awesome-mcp lists
- Stack Overflow answers referencing TPMJS

**Tier 3: Community (target 50+ links)**
- Reddit posts and comments
- Hacker News discussions
- Dev.to articles
- GitHub README mentions from tool authors
- Blog posts from developers using TPMJS

### Content Publishing Cadence

| Content Type | Frequency | Owner |
|-------------|-----------|-------|
| Blog posts (supporting articles) | 2-3 per week | Ajax + eventual content hire |
| Tool pages | Automated (on new tool publish) | Sync system |
| Category pages | Automated (on category creation) | System |
| Comparison pages | 2 per month | Ajax |
| Glossary entries | 5 per month until complete | Ajax |
| Pillar page updates | Monthly | Ajax |

### Measurement and KPIs

| Metric | Tool | Month 1 Target | Month 6 Target |
|--------|------|----------------|----------------|
| Organic sessions | Google Search Console | 500 | 10,000 |
| Indexed pages | Google Search Console | 100 | 5,000+ |
| Keywords ranking top 10 | Ahrefs/SEMrush | 10 | 100 |
| Keywords ranking top 3 | Ahrefs/SEMrush | 3 | 30 |
| Domain Rating | Ahrefs | 15 | 35 |
| Referring domains | Ahrefs | 20 | 150 |
| Avg. position for "mcp tools" | GSC | 20 | 3 |
| Avg. position for "ai agent tools" | GSC | 50 | 10 |
| Organic conversions (signups) | Analytics | 20 | 500 |
| Pages per session (organic) | Analytics | 2.5 | 3.5 |
