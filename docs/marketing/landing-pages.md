# TPMJS Landing Pages

Three complete landing pages targeting developers who use AI tools, npm authors who publish tools, and developers evaluating MCP server options.

---

## Landing Page 1: Developer Quick-Start

**Target audience:** Developers who want to USE AI tools in Claude, Cursor, Windsurf, or custom agents.
**Traffic source:** Google Ads ("AI tools for developers", "MCP tools for Claude"), organic search.
**Goal:** Get them to add the TPMJS MCP URL to their client config.
**Key message:** "One URL. Every AI tool."

---

### Meta

**Meta title:** TPMJS - One URL Gives Your AI Agent Access to 1,000+ Tools
**Meta description:** Add a single MCP URL to Claude, Cursor, or Windsurf and get instant access to web scrapers, code runners, data tools, and more. No installs. No config. Works in 30 seconds.

---

### Headline Options

**Option A: "One URL. Every AI Tool."**
Rationale: Maximum compression of the value prop. Mirrors the simplicity of the product itself. Works well as a bold typographic hero.

**Option B: "Give Your AI Agent 1,000+ Tools in 30 Seconds"**
Rationale: Specificity (1,000+ tools, 30 seconds) creates credibility. Leads with the outcome, not the mechanism.

**Option C: "Stop Installing MCP Servers One at a Time"**
Rationale: Agitates the pain point directly. Developers already using MCP know the friction of managing individual servers. Creates an immediate "yes, that's me" reaction.

**Recommended:** Option A for brand campaigns, Option B for paid search (higher specificity converts better in ads).

---

### Section-by-Section Copy

#### HERO

```
[Headline]
One URL. Every AI tool.

[Subheadline]
Add a single MCP endpoint to Claude Desktop, Cursor, or Windsurf.
Get instant access to 1,000+ tools: web scrapers, code execution,
data analysis, search, and more.

No installs. No dependency management. Works in 30 seconds.

[CTA Button - Primary]
Copy the MCP URL

[CTA Button - Secondary]
Browse all tools

[Proof strip]
1M+ indexed packages / 1,000+ executable tools / 8 categories / Open protocol
```

#### SECTION 1: THE PROBLEM

```
[Section label]
The status quo

[Heading]
Every MCP server is its own project

[Body]
You want your AI to scrape a website, run Python code, and search the web.
That means finding three separate MCP servers, installing three sets of
dependencies, and managing three config entries. When one breaks after an
update, you debug it yourself.

TPMJS replaces that with a single URL. Your AI agent connects once and
gets access to every tool in the registry. New tools appear automatically.
Broken tools get flagged automatically. You configure once and move on.
```

#### SECTION 2: HOW IT WORKS (3 steps)

```
[Section label]
Setup takes 30 seconds

[Heading]
Three steps. No terminal required.

[Step 1]
Pick your tools
Browse the registry at tpmjs.com or create a collection with exactly
the tools you need. Web scraping, code execution, data transformation,
search -- mix and match from 1,000+ options.

[Step 2]
Copy the MCP URL
Every collection gets a unique MCP endpoint:
https://tpmjs.com/api/mcp/{username}/{collection}/sse

[Step 3]
Paste into your AI client
Add the URL to your Claude Desktop config, Cursor settings, or any
MCP-compatible client. Restart. Done.

[Code block: claude_desktop_config.json]
{
  "mcpServers": {
    "tpmjs": {
      "command": "npx",
      "args": [
        "-y", "@anthropic/mcp-remote",
        "https://tpmjs.com/api/mcp/{username}/{collection}/sse"
      ]
    }
  }
}
```

#### SECTION 3: WHAT YOU GET

```
[Section label]
Included tools

[Heading]
Tools that actually work

Every tool in the registry is health-checked. If it fails to import or
execute, it gets flagged. You only see tools that pass.

[Tool category cards - 2x4 grid]

Web Scraping
Scrape any URL, extract structured data, convert pages to markdown.
Example: Firecrawl, page-brief, web-fetch

Code Execution
Run Python, JavaScript, and 40+ languages in a sandboxed environment.
Example: unsandbox-executeCodeAsync

Search
Search the web, academic papers, news, and code repositories.
Example: Exa search, Tavily, web-search

Data Processing
Parse CSV, transform JSON, run statistics, generate charts.
Example: csv-parse, json-transform, statistics tools

Documents
Generate PDFs, create blog posts, parse markdown, build changelogs.
Example: createBlogPost, changelog-entry, toc-generate

Security
Hash data, validate inputs, check URLs, audit dependencies.
Example: recipe-hash, URL validator, input sanitizer

Engineering
DNS lookups, HTTP requests, cron scheduling, monitoring.
Example: dns-lookup, http-client, cron tools

Integration
Connect to GitHub, Discord, Slack, email, and other services.
Example: Resend email, GitHub tools, webhook tools
```

#### SECTION 4: WORKS EVERYWHERE

```
[Section label]
Compatibility

[Heading]
Your client. Your tools.

[Client cards - 4 across]

Claude Desktop
Add to claude_desktop_config.json. Full MCP support
including tool approval and streaming results.

Cursor
Settings > Features > MCP Servers > Add Server.
Tools appear in the Cursor AI chat.

Windsurf
Native MCP support. Add the URL in settings
and tools are available in all conversations.

Any MCP Client
TPMJS serves standard MCP protocol over SSE.
Any client that speaks MCP works out of the box.

[Also works with]
Vercel AI SDK / LangChain / LlamaIndex / Custom agents via REST API
```

#### SECTION 5: SDK OPTION

```
[Section label]
For programmatic use

[Heading]
Or use the TypeScript SDK

If you are building a custom agent, install the SDK directly:

npm install @tpmjs/registry-search @tpmjs/registry-execute ai

Your agent gets two meta-tools: registrySearch finds tools
by query, and registryExecute runs them in a sandbox.
No pre-configuration needed.

[Code block]
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { registrySearchTool } from '@tpmjs/registry-search';
import { registryExecuteTool } from '@tpmjs/registry-execute';

const result = await streamText({
  model: anthropic('claude-sonnet-4-20250514'),
  tools: {
    registrySearch: registrySearchTool,
    registryExecute: registryExecuteTool,
  },
  maxSteps: 5,
  prompt: 'Find a web scraping tool and scrape example.com',
});
```

#### SECTION 6: FAQ

```
[Heading]
Questions

Q: Is TPMJS free?
A: Yes. The registry, MCP endpoint, and tool execution are free.
   Tools that require third-party API keys (like Firecrawl or Exa)
   need you to provide your own keys.

Q: How is this different from installing individual MCP servers?
A: Individual MCP servers each need their own install, config, and
   maintenance. TPMJS gives you one URL that connects to all of them.
   New tools appear automatically. Health checks run continuously.
   You manage one config entry instead of dozens.

Q: Do tools run on my machine?
A: No. Tools execute in a remote sandboxed environment. Your AI client
   sends the request to tpmjs.com, the tool runs in an isolated Deno
   runtime, and results stream back over MCP. Nothing installs locally
   except the MCP bridge client (npx mcp-remote).

Q: Can I choose which tools my AI has access to?
A: Yes. Create a collection and add only the tools you want. Your MCP
   URL points to that collection. You can also use individual tool
   endpoints if you want one tool at a time.

Q: What happens when a tool breaks?
A: TPMJS runs automated health checks on every tool. If a tool fails
   to import or execute, its health status updates and it drops out
   of search results. You do not need to debug broken npm packages.
```

#### FINAL CTA

```
[Heading]
Start in 30 seconds

[Body]
Copy the MCP URL. Paste it into your config. Restart your client.
Your AI agent now has access to 1,000+ tools.

[CTA Button - Primary]
Get your MCP URL

[CTA Button - Secondary]
Browse the tool registry
```

---
---

## Landing Page 2: Tool Publishers

**Target audience:** npm package authors who want their tools to work with AI agents.
**Traffic source:** npm community, dev Twitter/X, blog posts, GitHub README links.
**Goal:** Get them to add the `tpmjs` keyword to package.json and publish.
**Key message:** "Publish once to npm, reach every AI agent."

---

### Meta

**Meta title:** Publish Your npm Package to Every AI Agent | TPMJS
**Meta description:** Add one keyword to your package.json. Your npm package becomes a tool that Claude, GPT, Cursor, and Windsurf can use. Auto-discovered in 15 minutes. No extra hosting.

---

### Headline Options

**Option A: "Publish Once to npm. Reach Every AI Agent."**
Rationale: Direct, parallel structure. Emphasizes that this is not a new distribution channel to manage -- it piggybacks on npm, which they already use.

**Option B: "Your npm Package is 1 Keyword Away from Every AI Agent"**
Rationale: The specificity of "1 keyword" makes the barrier feel negligible. Creates curiosity about what that keyword is.

**Option C: "npm publish. That's the Whole Distribution Strategy."**
Rationale: Speaks the developer's language. Positions TPMJS as zero-effort distribution. The period at the end signals finality: there is nothing else to do.

**Recommended:** Option A for general campaigns. Option B for Twitter/social (curiosity gap drives clicks).

---

### Section-by-Section Copy

#### HERO

```
[Headline]
Publish once to npm. Reach every AI agent.

[Subheadline]
Add the "tpmjs" keyword to your package.json. Within 15 minutes,
Claude, GPT, Cursor, Windsurf, and every MCP-compatible AI client
can discover and execute your tool.

No hosting. No separate registry. No API to build.
You publish to npm. We handle the rest.

[CTA Button - Primary]
Read the publishing guide

[CTA Button - Secondary]
See an example package

[Proof strip]
1M+ packages indexed / Auto-discovered in 15 min / Quality scored / Health monitored
```

#### SECTION 1: THE PROBLEM

```
[Section label]
The current state

[Heading]
You built a tool. Now what?

You wrote a useful npm package. Maybe it scrapes websites, parses
documents, or runs calculations. It works great in Node.js.

But AI agents cannot find it. Claude does not know it exists. GPT
cannot call it. To get your tool into AI workflows, you need to
build an MCP server, host it somewhere, write documentation for
LLM consumption, and hope someone discovers it.

TPMJS eliminates all of that. You publish to npm with one extra
keyword. We index it, extract its schema, health-check it, and
serve it to every AI client through a standard MCP endpoint.

Your tool goes from "npm package" to "available in every AI agent"
in 15 minutes with zero infrastructure.
```

#### SECTION 2: HOW TO PUBLISH (3 steps)

```
[Section label]
Three steps. Fifteen minutes.

[Heading]
Add one keyword. Publish. Done.

[Step 1: Add the keyword]
Add "tpmjs" to the keywords array in your package.json. Optionally
add a tpmjs metadata field with your tool's category.

{
  "name": "@yourname/my-tool",
  "version": "1.0.0",
  "keywords": ["tpmjs"],
  "tpmjs": {
    "category": "data-processing"
  }
}

That is the minimum. TPMJS auto-discovers your exported tools
and extracts parameter schemas from your code.

[Step 2: Publish to npm]
npm publish --access public

Same command you already use. No new CLI. No new registry.

[Step 3: Verify on tpmjs.com]
Within 15 minutes, search for your package at tpmjs.com/tool/tool-search.
Your tool page shows the extracted schema, health status, quality score,
and usage instructions.
```

#### SECTION 3: WHAT TPMJS DOES FOR YOU

```
[Section label]
Automatic infrastructure

[Heading]
We handle everything after npm publish

[Feature cards - 2x3 grid]

Auto-Discovery
Your package is found within 2-15 minutes via npm's changes feed
and keyword search. No manual registration.

Schema Extraction
We analyze your tool's code and extract the input schema automatically.
Zod schemas, JSON Schema, TypeScript types -- all supported.

Health Monitoring
Every tool is import-tested and execution-tested. If your package
breaks, the health status updates and users are warned.

Quality Scoring
Your tool gets a score (0 to 1.0) based on metadata completeness,
npm downloads, and GitHub stars. Higher scores rank higher in search.

MCP Serving
Your tool is served over standard MCP protocol. Any compatible
client (Claude, Cursor, Windsurf) can call it without installing it.

Sandboxed Execution
Tools run in an isolated Deno environment. Users do not install
your package locally. You do not host anything.
```

#### SECTION 4: WHAT MAKES A GOOD TOOL

```
[Section label]
Quality guidelines

[Heading]
Tools that rank well follow these patterns

[Guideline list]

Export a standard AI SDK tool
Use the tool() function from the Vercel AI SDK (or export an object
with description, parameters, and execute). TPMJS recognizes this
format automatically.

Write descriptive Zod schemas
Add .describe() to your Zod schema fields. These descriptions are
extracted and shown to AI agents, so they know how to call your tool.

One tool, one job
Tools that do one thing well rank higher and get used more than
multi-purpose tools. Split complex functionality into separate exports.

Document environment variables
If your tool needs API keys, declare them in the tpmjs.env field.
Users see what keys they need before they add your tool.

Keep it maintained
Download counts factor into quality scores. Regular updates keep
downloads flowing and scores high.
```

#### SECTION 5: REAL EXAMPLE

```
[Section label]
Live example

[Heading]
From package.json to AI agent in 15 minutes

Here is a real package on TPMJS: @tpmjs/createblogpost

package.json:
{
  "name": "@tpmjs/createblogpost",
  "version": "0.2.0",
  "keywords": ["tpmjs", "blog", "content"],
  "tpmjs": {
    "category": "text-analysis",
    "frameworks": ["vercel-ai", "langchain"],
    "tools": [
      {
        "name": "createBlogPostTool",
        "description": "Creates structured blog posts with frontmatter and SEO metadata"
      }
    ]
  }
}

What TPMJS does automatically:
- Discovers the package via npm changes feed
- Extracts the full input schema (title, author, content, excerpt, tags, format)
- Tests that the tool imports and executes
- Assigns a quality score
- Makes it available via MCP and REST API
- Shows it on the tool page with full documentation

What the developer did:
- Added "tpmjs" to keywords
- Added a tpmjs field with category
- Ran npm publish

Total extra work: ~2 minutes.
```

#### SECTION 6: USE THE GENERATOR

```
[Section label]
Fastest path

[Heading]
Start with the package generator

Do not want to set up from scratch? Our CLI scaffolds a complete
TPMJS tool package with 2-3 example tools, proper exports, and
all metadata pre-configured.

npx @tpmjs/create-basic-tools

You get:
- TypeScript project with Vercel AI SDK tool format
- Zod schemas with descriptions (auto-extracted by TPMJS)
- package.json with tpmjs keyword and metadata
- Build scripts and npm publish ready
- Example tools you can modify or replace

[CTA Button]
View generator docs on GitHub
```

#### SECTION 7: FAQ

```
[Heading]
Questions

Q: Do I need to change my package's code?
A: No. If your package already exports a function with description
   and execute properties (Vercel AI SDK tool format), TPMJS discovers
   it automatically. You only need to add the "tpmjs" keyword to
   package.json.

Q: What if my tool needs API keys?
A: Declare them in the tpmjs.env field. When users add your tool to
   their collection, they see which keys are required and can configure
   them. Keys are encrypted and injected at execution time.

Q: How is the quality score calculated?
A: Three factors: metadata completeness (40-60% of score), monthly npm
   downloads (up to 20%), and GitHub stars (up to 10%). Better
   documentation and more usage means higher scores and better
   search ranking.

Q: Can I control which tools are exported?
A: Yes. You can list specific tools in the tpmjs.tools array, or omit
   it entirely and let TPMJS auto-discover all exports that match the
   AI SDK tool format.

Q: What categories are available?
A: text-analysis, code-generation, data-processing, image-generation,
   audio-processing, search, integration, and other. Pick the one that
   best matches your tool.
```

#### FINAL CTA

```
[Heading]
Ship your tool to every AI agent

[Body]
Add one keyword. Publish to npm. Your tool is live in 15 minutes.
No hosting. No API. No maintenance.

[CTA Button - Primary]
Read the publishing guide

[CTA Button - Secondary]
Use the package generator
```

---
---

## Landing Page 3: MCP Protocol

**Target audience:** Developers evaluating MCP server options for their AI workflows.
**Traffic source:** Search ("MCP tools", "MCP server", "best MCP servers"), Claude docs referrals, MCP protocol documentation.
**Goal:** Get them to use tpmjs.com as their MCP endpoint.
**Key message:** "The largest MCP tool registry."

---

### Meta

**Meta title:** TPMJS MCP Server - 1,000+ Tools for Claude, Cursor, and Windsurf
**Meta description:** The largest MCP tool registry. One endpoint gives your AI client access to web scrapers, code execution, search, data tools, and more. Works with Claude Desktop, Cursor, Windsurf, and any MCP client.

---

### Headline Options

**Option A: "The Largest MCP Tool Registry"**
Rationale: Direct positioning statement. When someone is comparing MCP servers, "largest" is the most relevant differentiator. Sets the competitive frame immediately.

**Option B: "1,000+ MCP Tools. One Endpoint."**
Rationale: The contrast between 1,000+ and one creates tension that resolves in the reader's favor. Concrete numbers outperform vague claims.

**Option C: "Stop Running 12 MCP Servers"**
Rationale: Directly addresses the pain of managing multiple MCP server processes. The specific number "12" is more believable than a round number and suggests you understand their situation.

**Recommended:** Option A for SEO-focused pages (targets "MCP tool registry" search intent). Option C for paid campaigns (pain-point driven copy converts better in ads).

---

### Section-by-Section Copy

#### HERO

```
[Headline]
The largest MCP tool registry

[Subheadline]
One endpoint. 1,000+ tools. Works with Claude Desktop, Cursor,
Windsurf, and every MCP-compatible client.

Add a single URL to your config and your AI gets access to web
scrapers, code execution, search, data processing, document
generation, and more.

[CTA Button - Primary]
Get the MCP URL

[CTA Button - Secondary]
Browse all tools

[Proof strip]
1,000+ tools / 8 categories / Health-checked / Sandboxed execution / Open protocol
```

#### SECTION 1: THE PROBLEM

```
[Section label]
MCP server sprawl

[Heading]
Every tool is a separate MCP server

The MCP protocol unlocked tool use for AI clients. But the ecosystem
grew fragmented. Want web scraping? Install an MCP server. Code
execution? Another server. Search? A third.

Each server has its own:
- Installation process (npm, pip, Docker, binary)
- Configuration format
- Dependency chain
- Update cycle
- Failure modes

Three tools means three servers. Ten tools means ten servers. Each
one is a process on your machine, a config entry to maintain, and
a potential point of failure.

TPMJS consolidates all of them into one MCP endpoint. You add one
URL. Your AI client connects to it. Every tool in the registry is
available. New tools appear without any action on your part.
```

#### SECTION 2: HOW TPMJS MCP WORKS

```
[Section label]
Architecture

[Heading]
One connection. Every tool.

TPMJS runs an MCP server at tpmjs.com that speaks standard MCP
protocol over Server-Sent Events (SSE). When your AI client
connects, it receives the list of available tools. When it calls
a tool, TPMJS routes the request to a sandboxed executor.

[Diagram description: 3-column flow]

Your AI Client                TPMJS MCP Server              Tool Executor
(Claude, Cursor,    ---->     Receives MCP request   ---->  Sandboxed Deno runtime
 Windsurf)          <----     Routes to executor     <----  Returns structured result
                              Streams result back

[Key points]
- Standard MCP protocol -- no proprietary extensions
- Tools run remotely in isolated Deno sandboxes
- Results stream back over SSE
- Connection stays open for the session
- New tools appear automatically as they are published
```

#### SECTION 3: SETUP FOR EACH CLIENT

```
[Section label]
Configuration

[Heading]
Add TPMJS to your AI client

[Tab: Claude Desktop]
Open ~/Library/Application Support/Claude/claude_desktop_config.json
(macOS) or %APPDATA%\Claude\claude_desktop_config.json (Windows):

{
  "mcpServers": {
    "tpmjs": {
      "command": "npx",
      "args": [
        "-y", "@anthropic/mcp-remote",
        "https://tpmjs.com/api/mcp/{username}/{collection}/sse"
      ]
    }
  }
}

Restart Claude Desktop. Your tools appear in the tool panel.

[Tab: Cursor]
Open Settings > Features > MCP Servers > Add Server.
Or edit .cursor/mcp.json in your project:

{
  "mcpServers": {
    "tpmjs": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://tpmjs.com/api/mcp/{username}/{collection}/sse"
      ]
    }
  }
}

[Tab: Windsurf]
Add the MCP server in Windsurf settings. Same URL format.

[Tab: Any MCP Client]
The endpoint URL follows MCP protocol over SSE. Any compliant
client can connect using the same URL pattern.

[Note]
Replace {username} and {collection} with your TPMJS username and
collection slug. Create a free collection at tpmjs.com/dashboard/collections.
```

#### SECTION 4: WHAT TOOLS ARE AVAILABLE

```
[Section label]
Registry

[Heading]
1,000+ tools across 8 categories

Every tool is health-checked before it appears in search results.
Broken tools are flagged automatically. Quality scores help you
find the best option for each task.

[Category table]

Category            Tools    Examples
-----------------------------------------------------------------
Web Scraping         80+    Firecrawl, page-brief, URL extractors
Code Execution       40+    Python runner, JS sandbox, multi-lang
Search               60+    Exa, Tavily, web search, code search
Data Processing     120+    CSV parsers, JSON transform, statistics
Documents           100+    PDF generation, markdown, blog posts
Security             50+    Hashing, validation, URL checking
Engineering          80+    DNS, HTTP, monitoring, cron
Integration         100+    Email (Resend), webhooks, GitHub

[CTA]
Browse all tools at tpmjs.com/tool/tool-search
```

#### SECTION 5: COLLECTIONS

```
[Section label]
Curation

[Heading]
Pick exactly the tools you need

You do not have to expose all 1,000+ tools to your AI. Create a
collection with only the tools you want.

[How collections work]
1. Create a collection at tpmjs.com/dashboard/collections
2. Search the registry and add specific tools
3. Get a unique MCP URL for that collection
4. Your AI client only sees the tools in that collection

[Why this matters]
- Smaller tool lists help AI agents pick the right tool faster
- You control what your AI can and cannot do
- Different collections for different workflows
  (e.g., "research" vs "development" vs "content creation")
- Share collections with your team
```

#### SECTION 6: COMPARED TO ALTERNATIVES

```
[Section label]
Comparison

[Heading]
Why one registry instead of many servers

[Comparison table]

                        Individual MCP Servers    TPMJS
-----------------------------------------------------------------
Setup                   Install each server       One URL
Configuration           One config per server     One config total
Dependencies            Each has its own          None (remote execution)
Updates                 Manual per server         Automatic
Health monitoring       You check manually        Automated checks
Tool discovery          Browse GitHub/npm         Search + categories
Execution environment   Your machine              Remote sandbox
New tools               Find, install, config     Appear automatically
Failure handling        Debug each server         Flagged automatically
```

#### SECTION 7: SECURITY

```
[Section label]
Security model

[Heading]
Sandboxed by default

Every tool executes in an isolated Deno runtime. Tools cannot:
- Access your filesystem
- Read your environment variables
- Make requests to your local network
- Persist state between executions
- Access other tools' data

API keys you provide are encrypted at rest and injected only
during execution of the tool that needs them. Keys are never
logged or stored in execution results.

Rate limiting and timeout handling prevent runaway executions.
If a tool does not respond within the timeout window, the
execution is terminated and an error is returned.
```

#### SECTION 8: FAQ

```
[Heading]
Questions

Q: Does TPMJS replace individual MCP servers entirely?
A: For most use cases, yes. If you need a tool that is in the
   TPMJS registry, there is no reason to also run it as a
   standalone MCP server. For tools that require local filesystem
   access (like a code editor MCP server), you still need the
   individual server since TPMJS runs tools remotely.

Q: What MCP protocol version does TPMJS support?
A: TPMJS implements the MCP protocol over SSE transport. It
   works with the @anthropic/mcp-remote bridge client and any
   MCP client that supports SSE connections.

Q: Is there latency compared to local MCP servers?
A: Tool execution adds a network round-trip since tools run
   remotely. For most tools (web scraping, API calls, data
   processing), this adds 100-500ms. Tools that are already
   making external API calls (like Firecrawl) show no
   meaningful difference.

Q: Can I self-host the TPMJS MCP server?
A: TPMJS is open source (github.com/tpmjs/tpmjs). You can
   deploy your own instance, though the hosted version at
   tpmjs.com is free and maintained.

Q: How do I add my own tools to the registry?
A: Publish an npm package with the "tpmjs" keyword. Your tool
   is auto-discovered within 15 minutes. See our publishing
   guide at tpmjs.com/publish.
```

#### FINAL CTA

```
[Heading]
One URL. Every tool.

[Body]
Stop managing a dozen MCP servers. Add the TPMJS endpoint to your
AI client and get instant access to the full registry.

[CTA Button - Primary]
Get your MCP URL

[CTA Button - Secondary]
Browse all 1,000+ tools

[Footer note]
Works with Claude Desktop, Cursor, Windsurf, and any MCP-compatible client.
Free. Open source. No account required to browse.
```
