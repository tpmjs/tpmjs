# TPMJS Homepage Copy

> Production-ready homepage copy for tpmjs.com. Each section includes the actual copy followed by an annotation block explaining the reasoning behind it.

---

> **Updated 2026-07-15 (v2 — multi-modal reframe).** Earlier this day the hero led with "the npm for AI tools — curated, scored, sandboxed," positioning tpmjs as the sandboxed layer *on top of* the official MCP registry. The founder rejected that as too small: *"we offer it as a cli, as an api, as a skill… we dont think there is a fight over apis, clis, or mcp, we think why not have all."* The pitch now leads with the **multi-modal thesis**: one curated collection, served through **every surface at once — CLI · MCP · REST · SDK · Skill**. Curation/scoring/sandboxing are features layered on top of every protocol, not the headline. The "1M+ tools" framing stays retired (real ~800). See `strategy.md` → "What changed in 2026".

## SEO Metadata

```
Meta Title: TPMJS — AI Agent Tools as CLI, MCP, REST, SDK & Skill
Meta Description: tpmjs is the tool layer for AI agents. Curate tools from npm into a collection, then serve that exact set as a CLI, an MCP server, a REST API, a typed SDK, or a loadable skill — each one health-scored and sandboxed. One source of truth, every protocol.
```

> **Annotation:** Title enumerates the surfaces (CLI/MCP/REST/SDK/Skill) — the multi-modal delivery *is* the differentiator, and it's keyword-dense for every transport a developer might search. Description leads with the "tool layer for AI agents" positioning and the write-once-serve-everywhere mechanic; trust wedge (health-scored, sandboxed) rides along as a qualifier, not the lede.

---

## 1. Hero Section

### Headline Options

**Option A (Recommended): "One collection. Every surface."** with differentiator line `CLI · MCP · REST · SDK · Skill`.

Rationale: "Collection" is the product primitive; "every surface" captures the whole thesis in three words. The mono sub-line spells out the five protocols so nobody has to guess. This is what shipped.

**Option B: "Write the tool once. Consume it everywhere."**

Rationale: Author-facing framing of the same idea (mirrors the existing ProtocolSection headline "write the tool once. we serve it everywhere."). Good for the publisher audience.

**Option C: "Tools for AI agents — every protocol, one source of truth."**

Rationale: Most literal and enterprise-legible. Every word defensible; slightly less sticky than A.

> **Retired:** (1) "Your AI Agent Just Got 1 Million Tools" / any "1M+" framing — false against the real ~800-tool registry. (2) "The npm for AI tools — curated, scored, sandboxed" as the *hero* — it made tpmjs subordinate to MCP/the registry and buried the multi-modal vision. ("npm for AI tools" survives as a supporting mental model on /getting-started, /faq, blog — just not as the headline.)

### Hero Copy

```
[Badge: {packageCount} PACKAGES / {toolCount} TOOLS — live from npm]

# ONE COLLECTION. EVERY SURFACE.
## CLI · MCP · REST · SDK · SKILL

tpmjs is the tool layer for AI agents. Curate a collection once, then hand it
to any agent the way that agent wants it — a CLI command, an MCP server, a
REST endpoint, a typed SDK, or a loadable skill. One curated, health-scored,
sandboxed source of truth; every protocol. There's no MCP-vs-CLI-vs-REST war
to pick a side in — you get all of them.

[Search Bar: $ search tools...]
Try: "web scraper", "discord", "code interpreter"

[Primary CTA: Search Tools]
[Secondary CTA: Publish a Tool]
```

> **Annotation:** Leads with the vision, not the security wedge. The headline is a three-word statement of the whole product; the mono sub-line enumerates the five surfaces. The subhead resolves the "protocol war" explicitly ("you get all of them") — the exact objection the founder wanted answered. Curated/health-scored/sandboxed appears as a mid-sentence qualifier, present but demoted. Client-specific names live in the ProtocolSection below, where each surface names its best-fit clients.

---

## 2. Social Proof Bar

```
[Stats Bar]

{packageCount}+ packages indexed | {toolCount}+ tools available | {categoryCount} categories
Works with: Claude Desktop / Cursor / Windsurf / Any MCP Client

[Optional logo row when partnerships exist: Compatible with Vercel AI SDK, LangChain, etc.]
```

> **Annotation:** Numbers-first social proof works for developer audiences who value data over testimonials. Showing real, live numbers (pulled from the database) is more credible than rounded estimates. The "Works with" row names specific tools developers already use, reducing perceived switching cost. This section should update dynamically from the database -- stale numbers undermine trust.

---

## 3. Problem Section

### Section Header

```
## What's Broken About AI Tool Integration

Building AI agents today means wrestling with tool configuration.
Here's what that looks like:
```

### Problem Cards

```
[Card 1: Manual Configuration]
Every AI agent requires hard-coded tool imports and hand-edited config files
for every single capability. Add a new tool? Edit three files.

[Card 2: No Discovery]
You have to know a tool exists before you can use it. There's no way for
agents to find new capabilities when they need them.

[Card 3: Version Hell]
When a tool ships a breaking change, every agent using it breaks.
You find out in production.

[Card 4: Limited by What You Configured]
Your agent can only use the tools you manually wired up. Need something
new? Stop what you're doing and go integrate it.
```

```
[Bottom line]
Agents are stuck with static, manually-configured toolsets.
```

> **Annotation:** The problem section uses the "agitation" phase of PAS (Problem-Agitate-Solve). Each card describes a pain the target audience has experienced firsthand. The language mirrors how developers actually talk about these problems ("edit three files", "find out in production"). Four cards keep it scannable. The bottom summary line reframes all four problems as one meta-problem: static toolsets. This sets up the solution section perfectly.

---

## 4. How It Works

### For Users

```
## Start Using Tools in 60 Seconds

### Step 1: Add one URL to your AI client config

Add the TPMJS MCP endpoint to Claude Desktop, Cursor, or Windsurf.
One URL. That's the entire setup.

  claude_desktop_config.json:
  {
    "mcpServers": {
      "tpmjs": {
        "command": "npx",
        "args": ["-y", "@anthropic/mcp-remote",
          "https://tpmjs.com/api/mcp/{username}/{collection}/sse"]
      }
    }
  }

### Step 2: Ask your agent for what you need

Your agent searches the TPMJS registry in real time
and loads the right tools automatically.

  "Scrape this URL and summarize the key points"
  "Find a tool to generate QR codes and make one for my site"
  "Parse this PDF invoice and extract the line items"

### Step 3: Tools execute and return results

Tools run in a secure sandbox. Results stream back to your agent.
No API keys for public tools. No manual installation.

  [Tool found: web-scraper v2.1.0]
  [Executing with sandbox isolation...]
  [Results returned in 340ms]
```

### For Publishers

```
## Publish a Tool in 15 Minutes

### Step 1: Add one keyword to package.json

Add "tpmjs" to your keywords array. That's the minimum requirement.

  {
    "name": "@yourname/my-tool",
    "keywords": ["tpmjs"]
  }

### Step 2: Publish to npm

npm publish --access public

TPMJS automatically discovers your package within 15 minutes.
Schemas are extracted from your code. No manual documentation needed.

### Step 3: Your tool is live

Developers find your tool through search.
AI agents can discover and use it immediately.
Quality scores, download stats, and health monitoring included.
```

> **Annotation:** "How it works" sections convert consideration into action. Three steps is the magic number -- it feels achievable. For users, the progression is: configure (once) > ask (natural language) > get results. For publishers, it is: add keyword > publish > done. Both flows emphasize how little work is required. The code snippets are real and copy-pasteable, which is critical for developer audiences. Showing the actual JSON config eliminates the "but how do I actually do this?" objection.

---

## 5. Key Benefits

```
## Why Developers Choose TPMJS
```

### Benefit 1: Zero-Configuration Tool Access

```
### Add once, use everything

Add one URL to your AI client. Get instant access to the entire
TPMJS registry. No per-tool installation. No dependency management.
No config files to maintain.

When new tools are published to the registry, your agent can use them
immediately. You don't touch a thing.
```

> **Annotation:** Leads with the strongest benefit: effort elimination. "Add once, use everything" is a concrete promise. The second paragraph addresses the ongoing benefit -- you don't just save time once, you save time every time a new tool appears.

### Benefit 2: Dynamic Tool Discovery

```
### Your agent finds tools on its own

Instead of you deciding which tools your agent needs ahead of time,
the agent searches the registry based on what the user asks for.

Need to parse a PDF? The agent finds a PDF parser. Need to send
an email? It finds an email tool. The right tool for every task,
discovered at runtime.
```

> **Annotation:** This is the differentiation benefit. Most tool registries require static configuration. Dynamic discovery is genuinely novel. The examples make the abstract concept concrete. "Discovered at runtime" is the technical phrase that signals sophistication to the developer audience.

### Benefit 3: Secure Sandboxed Execution

```
### Every tool runs in isolation

Tools execute in sandboxed environments with rate limiting,
timeout handling, and resource constraints. Your credentials are
encrypted at rest.

You get the power of running arbitrary tools without the risk of
running arbitrary code.
```

> **Annotation:** Security is a purchase-blocking concern for developer tools. Naming the specific mechanisms (sandboxed, rate limiting, timeout handling, encryption at rest) builds credibility without requiring a separate security page. The closing line reframes the security benefit as an enabler, not a restriction.

### Benefit 4: Built on npm and MCP

```
### Standards you already know

TPMJS uses npm for package distribution and MCP (Model Context Protocol)
for AI client communication. No proprietary formats. No lock-in.

Your tools are npm packages. Your schemas are Zod. Your protocol is
MCP. Everything is open.
```

> **Annotation:** Developers are allergic to proprietary ecosystems. Explicitly naming the standards (npm, MCP, Zod) signals that TPMJS is a layer on top of things they already trust, not a replacement. "No lock-in" directly addresses the unspoken objection.

### Benefit 5: Automatic Quality Scoring

```
### Know which tools to trust

Every tool gets a quality score based on metadata completeness,
npm download counts, and GitHub stars. Scores update hourly.

No more guessing whether a package is maintained.
The registry surfaces the best tools first.
```

> **Annotation:** Quality scoring differentiates TPMJS from a raw npm search. It solves the "npm has too many packages, which one do I use?" problem. "Scores update hourly" signals active maintenance. The last line frames this as curation, which is a premium feature.

---

## 6. Omega Agent Section

```
## Meet Omega

The AI assistant that discovers and executes tools in real time.

Describe what you need in plain English. Omega searches the entire TPMJS
registry, finds the right tools, executes them in a secure sandbox,
and returns the results -- all in one conversation.

### What you can do with Omega:

- "Scrape Hacker News and summarize the top 5 stories"
- "Find a tool to generate QR codes and make one for my site"
- "Search for data processing tools that can analyze JSON"
- "Write a blog post about the future of AI"

### How Omega works:

1. Dynamic Discovery -- Omega searches the registry to find the right
   tools for your request. No pre-configuration needed.

2. Sandboxed Execution -- Every tool runs in an isolated environment
   with rate limiting and timeout protection.

3. Intelligent Synthesis -- Results from multiple tools are combined
   into a clear, helpful response.

[CTA: Try Omega Now]
[Secondary: Sign in to start a conversation]
```

> **Annotation:** Omega is the "show, don't tell" feature for the entire platform. It demonstrates dynamic discovery, execution, and the registry in action. Leading with example prompts is more compelling than describing the architecture. The three-step "how it works" mirrors the user flow section but from Omega's perspective. The CTA is direct -- "Try Omega Now" has lower commitment language than "Sign Up."

---

## 7. Featured Tools Section

```
## Featured Tools

Production-ready tools you can use today.
Add to your AI agent in one line.

[Dynamic Grid: Top 6 tools by quality score]

Each card shows:
- Package name and tool name
- Description (3 lines max)
- Category badge
- Quality score
- Monthly download count
- "Official" badge where applicable

[CTA: Browse All {toolCount} Tools]
[Secondary: Search by Category]
```

> **Annotation:** Featured tools serve two purposes: they show what's in the registry (proof of value) and they provide immediate utility (the visitor might find something they need right now). Pulling from the database by quality score ensures the best tools are showcased. Download counts add social proof at the individual tool level. The "Browse All" CTA includes the exact count for specificity.

---

## 8. Testimonial Section

```
## What Developers Are Saying

[Testimonial Template - to be populated with real testimonials]

"[Quote about specific outcome, e.g., 'Reduced our agent config from
500 lines to 3']"

— [Name], [Role] at [Company]
[Optional: link to case study or tweet]
```

### Placeholder Testimonials (replace with real ones)

```
[Slot 1: Integration speed]
"[Quote about how fast they integrated TPMJS]"
— [Name], [Role] at [Company building AI agents]

[Slot 2: Tool discovery]
"[Quote about dynamic discovery changing their workflow]"
— [Name], [Role] at [Company using agents in production]

[Slot 3: Publishing experience]
"[Quote about how easy it was to publish a tool]"
— [Name], [Role] at [Company that published a popular tool]
```

> **Annotation:** Testimonials are left as templates intentionally. Fabricated testimonials destroy trust with developer audiences. The three slots are designed to cover the three key use cases: using tools, discovering tools, and publishing tools. When populating, prioritize quotes that include specific numbers ("reduced X by Y%") over generic praise. Link to the source (tweet, blog post) for verifiability.

---

## 9. Developer Experience Section

```
## Built for the Way You Work

### Use tools with the Vercel AI SDK

  import { generateText } from 'ai';
  import { searchTools } from '@tpmjs/registry';

  const tools = await searchTools('web scraper');

  const result = await generateText({
    model: openai('gpt-4o'),
    tools,
    prompt: 'Scrape this page and summarize it',
  });

### Use tools with Claude Desktop

  // claude_desktop_config.json
  {
    "mcpServers": {
      "tpmjs": {
        "command": "npx",
        "args": ["-y", "@anthropic/mcp-remote",
          "https://tpmjs.com/api/mcp/{username}/{collection}/sse"]
      }
    }
  }

### Publish a tool in 30 seconds

  // package.json -- that's it
  {
    "name": "@yourname/my-tool",
    "keywords": ["tpmjs"],
    "tpmjs": {
      "category": "text-analysis"
    }
  }

  // Tools and schemas are auto-discovered from your code.
  // npm publish --access public
```

> **Annotation:** Code snippets are the most persuasive content for developer audiences. Each snippet is real, copy-pasteable, and demonstrates a complete workflow in under 10 lines. Three snippets cover three entry points: programmatic SDK usage, AI client config, and publishing. The comments inside the code act as inline documentation, reducing friction. Showing both JavaScript SDK and JSON config reaches both "build from scratch" and "plug into existing tool" audiences.

---

## 10. FAQ Section

```
## Frequently Asked Questions

### Is TPMJS free?

Yes. Browsing the registry, searching for tools, and using the MCP
endpoint are all free. Omega agent conversations require a free account.

---

### How does TPMJS find new tools?

TPMJS monitors the npm registry in real time. Any package published
with the "tpmjs" keyword is automatically discovered within 15 minutes.
We also run periodic keyword searches as a backup. No manual submission
required.

---

### What AI clients does TPMJS support?

Any client that supports the Model Context Protocol (MCP). This includes
Claude Desktop, Cursor, Windsurf, and any custom agent built with the
Vercel AI SDK or LangChain. If your client speaks MCP, it works with TPMJS.

---

### How are tools executed? Is it safe?

Every tool runs in an isolated sandbox with rate limiting, timeout
handling, and resource constraints. Tools cannot access your filesystem,
network, or other tools outside their sandbox. Credentials are encrypted
at rest.

---

### Do I need API keys to use tools?

Public tools work without any API keys. Some tools require external
service credentials (e.g., a Stripe API key for payment tools). These
requirements are documented on each tool's page and in the package
metadata.

---

### How do I publish a tool?

Add "tpmjs" to the keywords in your package.json, optionally add a
"tpmjs" metadata field with a category, and run npm publish. Your tool
appears on tpmjs.com within 15 minutes. Schemas and parameters are
auto-extracted from your code.

---

### What is the quality score?

Every tool receives a score from 0 to 1 based on three factors: metadata
completeness (minimal, basic, or rich), npm download volume (logarithmic
scale), and GitHub stars (logarithmic scale). Scores update hourly. Higher
scores mean better visibility in search results.

---

### Can I use TPMJS with my own self-hosted agents?

Yes. The MCP endpoint is a standard HTTP URL. Any agent that can make HTTP
requests to an MCP server can use TPMJS tools. You can also use the
@tpmjs/registry SDK to search and load tools programmatically in your own
code.

---

### What is Omega?

Omega is TPMJS's built-in AI assistant. It has access to the entire tool
registry and can dynamically discover and execute tools based on your
natural language requests. Think of it as a demo of what's possible when
an agent has access to 1M+ tools.

---

### How is TPMJS different from installing npm packages directly?

When you install an npm package, you get code to run locally. TPMJS
turns those packages into remotely executable tools that AI agents can
discover and invoke via MCP. You don't install anything -- the tools run
on TPMJS infrastructure, and your agent communicates through the protocol.
```

> **Annotation:** FAQs serve three purposes: (1) answer real objections that block conversion, (2) provide SEO-rich content with natural keyword density, and (3) reduce support burden. The questions are ordered by frequency of concern: price first (the biggest blocker), then how it works, then safety, then specifics. Each answer is 2-4 sentences -- long enough to be complete, short enough to scan. The "How is TPMJS different" question at the end handles the most sophisticated objection and is positioned last because only serious evaluators will read that far.

---

## 11. Final CTA Section

```
## Start Building with TPMJS

Add one URL to your AI client config. Get instant access to {toolCount}+
tools across {categoryCount} categories. No credit card. No installation.
No configuration beyond a single line.

Publishing? Add one keyword to your package.json. Your tool goes live
within 15 minutes.

[Primary CTA: Browse the Registry]
[Secondary CTA: Publish a Tool]
[Tertiary: Try Omega Agent]
```

> **Annotation:** The final CTA recaps the two core value propositions (use tools, publish tools) with maximum specificity. "No credit card. No installation. No configuration beyond a single line." is a risk-reversal stack -- each "no" removes a potential objection. Three CTAs serve three audience segments: browsers (registry), builders (publish), and explorers (Omega). The primary CTA is the lowest-commitment action (browsing), which maximizes click-through. The section is deliberately short -- by this point, the visitor has either decided to act or has not. Long closing copy adds friction.

---

## Implementation Notes for Frontend Developers

### Dynamic Data

The following values should be pulled from the database at render time:

- `{packageCount}` -- `prisma.package.count()`
- `{toolCount}` -- `prisma.tool.count()`
- `{categoryCount}` -- count of distinct categories
- Featured tools grid -- top 6 by `qualityScore`

### Section Order (Recommended)

1. Hero (with search)
2. Social proof bar (stats + client logos)
3. Problem section (4 cards)
4. How it works -- Users (3 steps)
5. How it works -- Publishers (3 steps)
6. Key benefits (5 cards)
7. Omega Agent section
8. Featured tools (dynamic grid)
9. Developer experience (code snippets)
10. Testimonials (when available)
11. FAQ (accordion recommended)
12. Final CTA

### Design Tokens

The current site uses a brutalist/mono design language:
- `font-mono` for headings and labels
- `font-sans` for body text
- Dashed borders (`border-dashed`)
- No border radius (`border-radius: 0`)
- Primary accent color via `text-primary` / `bg-primary`
- Brutalist accent for highlights via `text-brutalist-accent`

### Accessibility

- All sections should have proper heading hierarchy (h1 > h2 > h3)
- Code blocks need `aria-label` or surrounding context
- CTA buttons must have descriptive text (not "Click here")
- FAQ should use `<details>/<summary>` or an accessible accordion pattern
- Color contrast must meet WCAG AA for all text
