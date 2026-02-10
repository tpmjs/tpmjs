# TPMJS Email Sequences

All emails sent from: **Ajax Davis, founder of TPMJS** (`ajax@tpmjs.com`)

---

## Sequence 1: New User Onboarding (5 emails over 14 days)

---

### Email 1 — Day 0: Welcome + Quickest Path to First Tool Execution

**Subject line options:**

1. `Your first AI tool is 30 seconds away` — Creates urgency and a concrete time promise. Works because developers are skeptical of setup time and this disarms that objection.
2. `Welcome to TPMJS — here's the fastest way in` — Direct, no mystery. "Fastest way in" appeals to developer impatience.
3. `You just unlocked 1M+ AI tools` — Scale as hook. Curiosity about what "unlocked" means drives opens.

**Preview text:** One line of config. That's it.

**Body:**

Hey —

I'm Ajax. I built TPMJS because I was tired of the same loop: find an AI tool, read the docs, install dependencies, configure API keys, write boilerplate, pray it works.

TPMJS skips all of that.

Here's the fastest way to run your first tool:

**Option A: Zero install (MCP)**

Add this to your Claude Desktop config:

```json
{
  "mcpServers": {
    "tpmjs": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-remote",
        "https://tpmjs.com/api/mcp/YOUR_USERNAME/YOUR_COLLECTION/sse"]
    }
  }
}
```

Restart Claude. Ask it to scrape a website. Done.

**Option B: Code (Vercel AI SDK)**

```bash
npm install @tpmjs/registry-search @tpmjs/registry-execute ai
```

```typescript
import { registrySearchTool } from '@tpmjs/registry-search';
import { registryExecuteTool } from '@tpmjs/registry-execute';
```

Two imports. Your agent now has access to every tool in the registry.

**Option C: No code at all**

Go to tpmjs.com/omega and type what you need. Omega finds and runs the right tools for you. No setup.

Pick whichever feels right. The whole point is that it should take less time to try TPMJS than to read this email.

[Try Omega now -- no setup required](https://tpmjs.com/omega)

Talk soon,
Ajax

P.S. If you hit any friction during setup, reply to this email. I read every one and usually respond within a few hours.

---

### Email 2 — Day 1: Your First Collection

**Subject line options:**

1. `Curate your own tool stack (takes 2 minutes)` — Specific time + ownership language. Developers like curating their own stacks.
2. `What kind of AI work do you do?` — Question-based subject lines get 10-15% higher open rates. This one also feels personal.
3. `The feature that makes TPMJS click` — Curiosity gap. "Click" implies an aha moment they haven't had yet.

**Preview text:** Collections turn random tools into a system.

**Body:**

Hey —

Yesterday you signed up. Today I want to show you the feature that makes everything else work: **Collections**.

A collection is a curated set of tools for a specific job. Think of it like a playlist, but for AI capabilities.

Here's why they matter:

Instead of searching for tools every time your agent needs something, you pre-select exactly the tools it should have access to. Your agent becomes focused and fast instead of searching a million tools every request.

**How to create one:**

1. Go to your dashboard
2. Click "New Collection"
3. Search for tools and add them
4. Give it a name like "Content Pipeline" or "Data Analysis Kit"

Some starting points depending on what you do:

- **Web scraping + research:** Add Firecrawl, Exa search, and the page brief tool
- **Content creation:** Add the blog post creator, markdown tools, and image generators
- **Data work:** Add CSV parsers, JSON transformers, and chart generators
- **DevOps:** Add GitHub tools, deployment monitors, and log analyzers

Once you have a collection, you get an MCP endpoint URL. One URL, all your tools, works in Claude Desktop, Cursor, and Windsurf.

[Create your first collection](https://tpmjs.com/dashboard/collections)

— Ajax

P.S. Collections are shareable. Some developers are publishing collections that others use as starting points. Browse them at tpmjs.com/collections.

---

### Email 3 — Day 3: Meet Omega

**Subject line options:**

1. `Chat with 1M+ tools (no config needed)` — The contrast between "1M+ tools" and "no config" is the hook. Scale meets simplicity.
2. `Meet Omega — your AI that finds its own tools` — Personification works. "Finds its own tools" is a novel concept that drives curiosity.
3. `I built an agent that uses the entire npm registry` — Founder voice + audacious claim. Developers will open this to see if it's real.

**Preview text:** Describe the task. Omega handles the rest.

**Body:**

Hey —

Quick question: have you ever wished you could just describe a task and have an AI figure out which tools to use?

That's Omega.

Here's what happens when you type "Scrape Hacker News and summarize the top 5 stories" into Omega:

1. Omega searches the TPMJS registry for web scraping tools
2. It picks the best one (usually Firecrawl)
3. It executes the scrape in a secure sandbox
4. It reads the results and writes a clean summary
5. You get the answer

You didn't install anything. You didn't configure anything. You didn't even know which tool was right for the job.

Some things people have used Omega for this week:

- Generating QR codes for their app's URLs
- Scraping competitor pricing pages
- Creating blog posts with proper frontmatter
- Searching academic papers
- Analyzing JSON datasets

The whole idea is that you describe the outcome and Omega figures out the tools. If a tool doesn't exist yet, Omega tells you — and that's usually a sign someone should build it.

[Try Omega](https://tpmjs.com/omega)

— Ajax

P.S. Omega is free while we're in this phase. I'd rather have people using it and giving feedback than gating it behind a paywall right now.

---

### Email 4 — Day 7: Publish Your Own Tool

**Subject line options:**

1. `Your npm package is already 90% of an AI tool` — Reframes what they already have. Developers who publish to npm will feel this is directly relevant.
2. `One keyword turns your npm package into an AI tool` — Concrete and surprising. "One keyword" is specific enough to be believable.
3. `The fastest way to get your code into every AI agent` — Ambitious outcome. "Every AI agent" is the distribution promise.

**Preview text:** Add one keyword to package.json. Publish. That's it.

**Body:**

Hey —

If you've published anything to npm, you're one keyword away from making it available to every AI agent on the planet.

Here's the entire process:

**Step 1:** Add `"tpmjs"` to your package.json keywords:

```json
{
  "keywords": ["tpmjs"]
}
```

**Step 2:** Add a tpmjs field with your category:

```json
{
  "tpmjs": {
    "category": "text-analysis"
  }
}
```

**Step 3:** Publish to npm.

```bash
npm publish
```

That's it. Seriously.

Within 15 minutes, TPMJS automatically:

- Discovers your package from the npm changes feed
- Scans your exports for AI SDK-compatible tools
- Extracts parameter schemas from your Zod definitions
- Assigns a quality score
- Lists it in the registry

You don't need to register anywhere. You don't need to fill out a form. You don't need to wait for approval. The npm registry IS the source of truth.

If you want to go further, we have a scaffolding tool:

```bash
npx @tpmjs/create-basic-tools
```

It generates a production-ready tool package with 2-3 tools, proper TypeScript setup, and best practices baked in. Takes about 60 seconds.

Right now there are thousands of tools in the registry. The ones that get the most usage have three things in common: clear descriptions, good Zod schemas with field descriptions, and documented environment variables.

[Read the full publishing guide](https://tpmjs.com/publish)

— Ajax

P.S. If you already have a package that could be a tool, reply with the npm name and I'll take a look. Happy to give specific suggestions on how to make it TPMJS-ready.

---

### Email 5 — Day 14: Community + What's New

**Subject line options:**

1. `What we shipped since you joined (it's a lot)` — Inclusive language ("since you joined") + curiosity about what changed.
2. `The TPMJS community is building some wild stuff` — "Wild stuff" is informal and curiosity-inducing. Community proof.
3. `14 days in — here's what you might have missed` — Time anchor creates a sense of "I should check in." FOMO without being pushy.

**Preview text:** New tools, new features, and where this is going.

**Body:**

Hey —

You've been on TPMJS for two weeks now. Here's a quick snapshot of what's been happening:

**New platform features:**

- **Custom Agents** — Build your own AI agents with specific LLMs, system prompts, and curated tool collections. Share them publicly or keep them private. Think of it as building a specialized Omega for your use case.
- **Test Scenarios** — Every collection can now have AI-generated test scenarios. They validate that your tools actually do what they claim. We track pass rates, execution times, and quality scores.
- **Living Skills** — Documentation that evolves from real usage. As people use tools in collections, skills emerge from question patterns and proven behaviors.

**Trending tools this week:**

Browse the registry at tpmjs.com/tool/tool-search to see what's getting the most traction. The search is fast and category filtering actually works.

**What's coming next:**

I'm working on making collections even more powerful. The goal: you should be able to describe a workflow in plain English and have TPMJS generate a collection of tools that handles it.

If you haven't yet, here's what I'd suggest:

1. Browse the public collections page — see what others are building
2. Try creating an agent — pick a use case you care about and wire it up
3. If you build something interesting, share it — other developers benefit

This project only works if developers build with it. Every tool published, every collection shared, every agent created makes the platform more useful for everyone.

[Browse public collections](https://tpmjs.com/collections)

— Ajax

P.S. Want to talk about what you're building? I do 1:1 calls with anyone using TPMJS for real projects. Just reply and we'll find a time.

---

## Sequence 2: Tool Publisher Activation (4 emails over 10 days)

---

### Email 1 — Day 0: Your Tool Is Live

**Subject line options:**

1. `Your tool is live on TPMJS` — Simple, direct, immediate dopamine hit. Works because they just published and want confirmation.
2. `[package-name] is now available to every AI agent` — Personalized with their package name. The scale implication drives opens.
3. `Congrats — developers can now discover [package-name]` — Celebration + concrete outcome. "Discover" implies it's findable.

**Preview text:** Here's how it looks and what happens next.

**Body:**

Hey —

Your package just showed up in the TPMJS registry. Congrats — that means every AI agent with TPMJS access can now find and use your tool.

Here's what we detected:

- **Package:** [package-name]
- **Tools found:** [X tools auto-discovered]
- **Category:** [detected category]
- **Quality score:** [X.XX]

You can see your full tool page at: tpmjs.com/tool/[package-name]

**What happens now:**

1. Your tool is searchable in the registry
2. Omega can discover and execute it when users describe relevant tasks
3. Other developers can add it to their collections
4. Download stats and quality scores update hourly

**Quick wins to improve visibility:**

- Make sure your tool descriptions are clear — they're what AI agents read when deciding whether to use your tool
- Add `.describe()` to your Zod schema fields — we extract those as parameter documentation
- If your tool needs API keys, list them in the `env` field so users know what to configure

Your quality score will evolve over time based on downloads, documentation quality, and usage patterns.

[View your tool page](https://tpmjs.com/tool/tool-search)

— Ajax

P.S. I personally review new tool submissions. If I spot something that would boost your quality score, I'll send you a note.

---

### Email 2 — Day 2: How to Get More Installs

**Subject line options:**

1. `3 things that 10x tool installs` — Specific number + multiplier. Developers love concrete optimization advice.
2. `Why some TPMJS tools get 100x more usage` — Comparison creates curiosity. "100x" is big enough to demand attention.
3. `The quality score formula (and how to game it)` — "Game it" is honest and developer-friendly. Transparency builds trust.

**Preview text:** The difference between 10 installs and 10,000.

**Body:**

Hey —

Your tool has been live for a couple days. Here's what separates tools that get discovered constantly from tools that sit idle.

**1. Descriptions are everything.**

AI agents read your tool's description to decide if it's relevant. Developers read it to decide if they should add it to their collection. Write it for both audiences.

Bad: "A text processing tool"
Good: "Analyzes sentiment in text, returning positive/negative/neutral classification with confidence scores. Supports English, Spanish, and French."

The description should answer: what does this do, what does it return, and what are the constraints?

**2. Zod schemas with field descriptions.**

TPMJS auto-extracts your parameter schemas. If you add `.describe()` to your Zod fields, those descriptions show up in the tool page and help AI agents pass the right arguments.

```typescript
const params = z.object({
  text: z.string().describe("The text to analyze for sentiment"),
  language: z.enum(["en", "es", "fr"]).describe("ISO 639-1 language code")
});
```

Tools with described parameters consistently rank higher because agents can use them correctly without guessing.

**3. Document your environment variables.**

If your tool needs API keys, put them in the `tpmjs.env` field:

```json
{
  "tpmjs": {
    "env": [{
      "name": "MY_API_KEY",
      "description": "API key from myservice.com/keys",
      "required": true
    }]
  }
}
```

Users who know exactly what credentials they need are far more likely to actually set up and use your tool.

**Bonus: Publish updates regularly.**

Our metrics sync runs hourly. Every new version bumps your package in the changes feed, which means more visibility windows.

[View your tool's quality score](https://tpmjs.com/tool/tool-search)

— Ajax

P.S. I built a quick quality checklist based on what high-ranking tools have in common. Reply if you want me to run your tool through it.

---

### Email 3 — Day 5: How to Get Featured

**Subject line options:**

1. `How featured tools get selected (inside look)` — "Inside look" implies exclusive info. Transparency about the process drives curiosity.
2. `Want your tool on the TPMJS homepage?` — Direct question with an aspirational outcome. Who wouldn't open this?
3. `The 6 tools on our homepage — and how they got there` — Concrete number + implied formula. Developers want to reverse-engineer success.

**Preview text:** It's not random. Here's the algorithm.

**Body:**

Hey —

The TPMJS homepage features 6 tools. They rotate based on quality score. Here's exactly how the algorithm works so you can optimize for it.

**The quality score formula:**

Your score is a number between 0 and 1, calculated from three factors:

1. **Tier (60% weight):** "Rich" tools (complete metadata, good descriptions, documented env vars) score 0.6. "Minimal" tools score 0.4. The gap between rich and minimal is the single biggest lever you have.

2. **Downloads (30% weight):** Logarithmic scale based on monthly npm downloads, maxing out at 0.3. This means going from 0 to 100 downloads matters more than going from 10,000 to 100,000.

3. **GitHub stars (10% weight):** Also logarithmic, maxing out at 0.1. Helpful but not a dealbreaker.

**What "rich tier" requires:**

- Clear, specific tool descriptions (not generic)
- Zod schemas with .describe() on parameters
- Environment variables documented in the tpmjs.env field
- A valid repository URL in package.json
- At least one tool with a properly extractable schema

**What actually gets you featured:**

The homepage shows the top 6 tools by quality score. If you hit 0.7 or above, you're in competitive range. Most tools sit between 0.4 and 0.5, so the bar is achievable.

Beyond the homepage, high-scoring tools:

- Appear first in search results
- Get recommended by Omega more often
- Show up in "Related Tools" on other tool pages

**The fastest path to a high score:**

1. Upgrade from minimal to rich tier (immediate +0.2)
2. Add .describe() to all Zod fields
3. Document env vars properly
4. Make sure your npm package has a repository URL

If you're already close, a few targeted improvements can push you over the line.

[Check your current quality score](https://tpmjs.com/tool/tool-search)

— Ajax

P.S. If you think your score is wrong or the extraction missed something, let me know. The auto-extraction is good but not perfect, and I fix edge cases when people report them.

---

### Email 4 — Day 10: What Top Tools Do Differently

**Subject line options:**

1. `What the top 10 TPMJS tools have in common` — List format + "in common" implies a discoverable pattern. Very clickable for competitive developers.
2. `I analyzed our most-used tools — here's what I found` — Founder doing analysis = authentic. "Here's what I found" = irresistible to developers.
3. `The tool pattern that gets 50x more executions` — Specific multiplier + "pattern" implies a replicable strategy.

**Preview text:** I looked at the data. Three patterns keep showing up.

**Body:**

Hey —

I spent time looking at which tools get the most executions on TPMJS. Not downloads — actual executions through Omega and MCP. Here are the patterns.

**Pattern 1: They solve one problem completely.**

The most-used tools don't try to be Swiss Army knives. They do one thing and handle the edge cases. A tool that scrapes a URL and returns clean markdown beats a tool that scrapes, summarizes, translates, and generates images.

AI agents are better at chaining simple tools than figuring out complex multi-mode tools.

**Pattern 2: Their outputs are structured.**

Top tools return typed, structured data. Not strings. Not "here's some text." They return objects with clear fields that downstream tools or the agent can work with.

If your tool returns `{ sentiment: "positive", confidence: 0.92, language: "en" }`, an agent knows exactly what to do with that. If it returns `"The text seems positive"`, the agent has to parse natural language — which defeats the purpose.

**Pattern 3: They fail gracefully.**

The tools that maintain high execution success rates handle errors with useful messages. Instead of throwing `Error: request failed`, they return `{ error: "API rate limit exceeded", retryAfter: 30 }`.

Agents can work with structured errors. They can retry, try a different tool, or explain the issue to the user. Unstructured crashes just break the chain.

**What this means for your tool:**

- Narrow the scope. If your tool does 5 things, consider splitting it into 5 tools.
- Return typed objects, not strings.
- Handle errors as data, not exceptions.
- Write descriptions that tell the agent exactly when to use this tool and when not to.

The developers who internalize these patterns tend to ship tools that get adopted. The ones who don't tend to ship tools that technically work but never get picked by agents.

[Browse top tools for inspiration](https://tpmjs.com/tool/tool-search)

— Ajax

P.S. I'm considering starting a "Tool of the Week" spotlight. If your tool is doing something genuinely useful, reply and tell me about it. I might feature it.

---

## Sequence 3: Inactive User Win-Back (3 emails over 21 days)

---

### Email 1 — Day 0: We Shipped 12 Features Since You Left

**Subject line options:**

1. `TPMJS is different now (12 new features)` — "Different now" implies they should re-evaluate. Specific number adds weight.
2. `A lot changed since your last login` — Personal, slightly guilt-inducing without being aggressive. Curiosity about what changed.
3. `We built the thing you were probably waiting for` — Bold assumption that creates curiosity. "Probably" softens it enough.

**Preview text:** Collections, Omega, custom agents, and more.

**Body:**

Hey —

It's been a while since you logged in. I get it — the tool was probably missing something you needed.

We've been shipping aggressively. Here's what's new:

**Omega Agent** — An AI assistant with access to over 1M tools. You describe what you need, Omega finds the tools and executes them. No configuration. No installation. Just results. [Try it](https://tpmjs.com/omega)

**Collections** — Curate specific tool sets for your use cases. Get an MCP endpoint URL that works in Claude Desktop, Cursor, and Windsurf. Share collections publicly or keep them private.

**Custom Agents** — Build your own AI agents with specific LLMs, system prompts, and curated tool collections. Like building a specialized version of Omega for a specific job.

**Test Scenarios** — AI-generated tests that validate whether tools actually do what they claim. Track pass rates and quality scores over time.

**MCP Protocol Support** — One URL gives any MCP-compatible client access to all your tools. Works with Claude Desktop, Cursor, Windsurf, and anything else that speaks MCP.

**Auto-Discovery** — You can now publish a tool with just a `tpmjs` keyword in package.json. We scan your exports, extract schemas, and list it automatically. Zero manual registration.

The platform is in a fundamentally different place than when you last checked in.

[See what's new](https://tpmjs.com/features)

— Ajax

P.S. If there was a specific thing that made you stop using TPMJS, I'd genuinely like to hear it. No sales pitch, just product feedback from someone who actually tried it.

---

### Email 2 — Day 7: What Developers Are Building

**Subject line options:**

1. `A developer scraped 500 pages in one prompt` — Specific, impressive result. Social proof through a concrete story.
2. `What people are actually building with TPMJS` — "Actually" implies real-world usage, not marketing speak. Curiosity about real use cases.
3. `The use case I didn't expect` — Founder surprise = authentic. People want to know what surprised the creator.

**Preview text:** Real projects from real developers.

**Body:**

Hey —

I wanted to share some of the things developers are actually doing with TPMJS. Not hypotheticals — real usage from the last month.

**Research automation:**

A developer built a collection with web scraping, search, and summarization tools. They use it through Claude Desktop to research topics by just typing "Research [topic] and give me a briefing." The agent scrapes relevant pages, cross-references sources, and produces a structured report.

**Content pipelines:**

A small agency created a custom agent that takes a topic, searches for source material, generates a blog post with proper frontmatter, and outputs it in their CMS format. They went from 3 hours per article to 15 minutes of review time.

**Data analysis workflows:**

A data team set up a collection of CSV parsing, JSON transformation, and charting tools. Their analysts can now describe what they want to see in plain English and get structured outputs without writing scripts.

**DevOps monitoring:**

Someone published tools for checking deployment status, reading logs, and monitoring uptime. They wired it into a custom agent that their team uses through Cursor to debug production issues.

The common thread: nobody is using a single tool in isolation. They're building collections of tools that work together, accessible through a single MCP URL or custom agent.

The platform has enough tools and infrastructure now that the interesting question isn't "does this work?" but "what can I build with this?"

[Browse public collections for inspiration](https://tpmjs.com/collections)

— Ajax

P.S. If any of these use cases are close to something you need, reply and I'll point you to the specific tools and collections that would get you started fastest.

---

### Email 3 — Day 21: Last Chance + Direct Question

**Subject line options:**

1. `Should I stop emailing you?` — Disarmingly honest. Highest open rate of any win-back subject line because it gives control back to the reader.
2. `One question before I go` — Brevity + finality. Creates urgency without being manipulative.
3. `Last email (unless you want more)` — Clear boundary. Respectful. People open this out of mild guilt and curiosity.

**Preview text:** Honest question. No tricks.

**Body:**

Hey —

This is my last automated email to you. I want to ask one question:

**Is there a specific problem TPMJS should solve for you that it doesn't?**

I'm not asking because of a retention metric. I'm asking because I'm building this for developers like you, and if the platform isn't useful, I need to understand why.

Three possible answers:

1. **"I'm just busy"** — Totally fine. TPMJS will be here. Bookmark tpmjs.com/omega for when you have 5 minutes.

2. **"It's missing [specific thing]"** — Tell me. I read every reply and I've built features based on user emails before. If your request makes sense, it goes on the roadmap.

3. **"I'm not interested"** — Also fine. Click unsubscribe below and I won't email again. No hard feelings.

If none of those apply and you just haven't gotten around to it, here's the 60-second version:

Go to tpmjs.com/omega. Type "Scrape https://news.ycombinator.com and summarize the top stories." Watch what happens.

If that's interesting, everything else follows naturally. If it's not, we're probably not the right tool for you right now.

Either way, thanks for signing up in the first place.

— Ajax

P.S. If you do reply, it goes to my actual inbox. Not a ticketing system. Not a support queue. Just me.

---

## Sequence 4: Weekly Newsletter

---

### Newsletter Structure

**Sender:** Ajax Davis (`ajax@tpmjs.com`)
**Schedule:** Every Tuesday at 10am ET
**Tone:** Founder's log. Short, direct, opinionated. Not a corporate roundup.

**Sections:**

1. **The lead** (2-3 sentences) — One observation, opinion, or announcement. Sets the tone.
2. **What we shipped** — Bullet list of features, fixes, improvements from the past week.
3. **Tool spotlight** — One tool from the registry that deserves attention. Why it's good. How to use it.
4. **Community picks** — 2-3 interesting collections, agents, or use cases shared by users.
5. **One link** — A single external link (article, tool, repo) that's relevant to the TPMJS audience.
6. **P.S.** — Personal note, question, or preview of what's coming next.

---

### Edition 1: Launch Week Recap

**Subject line options:**

1. `TPMJS week 1: 847 tools and counting` — Specific number signals real traction. "And counting" implies momentum.
2. `What happened when we opened the registry` — Story-based. "What happened" is a natural curiosity trigger.
3. `The Tuesday TPMJS dispatch: Edition 1` — Establishes the recurring format. "Edition 1" signals this is the beginning of something.

**Preview text:** First newsletter. Real numbers. No fluff.

**Body:**

Hey —

First edition of the Tuesday dispatch. I'll keep these short and useful.

**The observation:**

We opened the registry to auto-sync from npm last week. Within 72 hours, 847 tools were indexed and searchable. I expected maybe 200. The npm ecosystem already has far more AI-compatible tool packages than most people realize. They just weren't discoverable until now.

**What we shipped:**

- Omega Agent is live — chat interface that dynamically discovers and executes tools
- MCP protocol support — one URL gives Claude Desktop, Cursor, and Windsurf access to your collections
- Auto-discovery for published tools — just add the `tpmjs` keyword to package.json
- Quality scoring algorithm — tools are now ranked by tier, downloads, and GitHub stars
- Public collections — browse and fork tool collections shared by other developers

**Tool spotlight: @firecrawl/ai-sdk**

If you need to scrape a URL and get clean markdown, this is the tool. Pass a URL, get structured content back. Works in Omega, works through MCP, works in code. The Zod schema is clean and the error handling is solid. It's one of the highest-quality tools in the registry right now.

**Community picks:**

- A developer published a collection for "AI Content Pipeline" that chains scraping, summarization, and blog post generation
- Someone built a custom agent specifically for code review using GitHub tools
- The first test scenarios are being generated — early results show which tools actually deliver on their descriptions

**One link:**

Anthropic's MCP protocol spec is worth reading if you haven't yet. It's the reason one URL can give any compatible client access to your entire tool stack. The protocol is simpler than you'd expect.

[Browse the registry](https://tpmjs.com/tool/tool-search)

— Ajax

P.S. Next week I'm going to break down the most common mistakes I see in published tools and how to fix them. If you've published a tool and want feedback before then, reply and I'll take a look.

---

### Edition 2: The Tools Are the Moat

**Subject line options:**

1. `Why npm is the right distribution layer for AI tools` — Opinionated take. Developers who agree will open to validate. Developers who disagree will open to argue.
2. `Tuesday dispatch: 1,200 tools + why descriptions matter more than code` — Two hooks in one subject line. The second claim is counterintuitive enough to drive opens.
3. `The one thing that makes or breaks an AI tool` — Curiosity gap with a strong opinion behind it.

**Preview text:** The tool that gets picked is the one the agent understands.

**Body:**

Hey —

This week's observation is something I keep seeing in the data.

**The observation:**

The best-performing tools on TPMJS aren't the ones with the most features. They're the ones with the best descriptions. An agent deciding which tool to use reads the description and parameter docs. If those are clear, the tool gets picked. If they're vague, the tool gets skipped — even if the underlying code is better.

This means writing good descriptions is now a core development skill, not a marketing afterthought.

**What we shipped:**

- Improved search ranking — tools with described Zod parameters now rank higher
- Collection sharing — public collections get shareable URLs and embeddable MCP configs
- Agent chat history — conversations with custom agents are now persistent
- Bug fix: tool execution timeout handling now returns structured errors instead of silent failures
- Performance: registry search is 3x faster on cold start

**Tool spotlight: @tpmjs/create-basic-tools**

This isn't a tool you use in an agent — it's a scaffolding CLI that generates a complete tool package. Run `npx @tpmjs/create-basic-tools`, answer a few questions, and you get a production-ready package with Zod schemas, TypeScript config, and tpmjs metadata already set up. If you've been meaning to publish a tool, this removes every excuse.

**Community picks:**

- A new collection for "Research Assistant" is getting traction — 4 tools for search, scrape, summarize, and cite
- Someone published an MCP bridge tutorial showing how to route TPMJS tools through a local proxy
- First user-built agent hit 100 conversations this week

**One link:**

Vercel AI SDK 4.0 just landed with better tool support. If you're building agents in TypeScript, the streamText + tools pattern is becoming the standard. TPMJS tools work with it out of the box.

[Explore trending tools](https://tpmjs.com/tool/tool-search)

— Ajax

P.S. I'm building a "featured publisher" program for developers who consistently ship high-quality tools. More details next week. If you're interested, reply.

---

### Edition 3: Collections Are the Product

**Subject line options:**

1. `The feature I almost didn't build (that changed everything)` — Founder vulnerability + "changed everything" is a strong claim that demands investigation.
2. `Tuesday dispatch: why collections matter more than individual tools` — Direct thesis statement. Opens from people who want to understand the reasoning.
3. `From 1 tool to 15 tools in one URL` — Concrete before/after. The jump from 1 to 15 is tangible.

**Preview text:** Individual tools are ingredients. Collections are recipes.

**Body:**

Hey —

Quick take this week.

**The observation:**

I almost shipped TPMJS without collections. The original plan was: registry of tools, search, execute, done. But watching early users, I noticed something. Nobody wanted to search for tools every time. They wanted to set up their stack once and use it everywhere.

Collections solved that. You curate 10-15 tools, get a single MCP URL, add it to your editor config, and your AI assistant just has those capabilities from that point on.

The shift from "search and execute" to "curate and integrate" is what made the platform actually useful for daily work instead of just occasional experimentation.

**What we shipped:**

- Collection forking — copy any public collection to your account and customize it
- Scenario quality scores — test results now contribute to overall collection health metrics
- Skills page — documentation that evolves from real usage patterns within a collection
- API keys per collection — store encrypted credentials that auto-inject when tools execute
- Mobile-responsive collection pages

**Tool spotlight: Exa search**

Exa is a search engine built for AI. Unlike general web search, it returns structured, relevant results optimized for programmatic consumption. In TPMJS, it's one of the most-used tools because agents can search the web and get clean data back. Pairs well with scraping tools for a "search then deep-read" workflow.

**Community picks:**

- A "Full-Stack AI Assistant" collection combining code generation, testing, deployment, and monitoring tools hit 50 forks
- New custom agent for academic research — searches papers, extracts key findings, and generates citation-ready summaries
- A developer documented their entire TPMJS workflow in a blog post showing before/after productivity metrics

**One link:**

The Model Context Protocol documentation site has a great section on building MCP servers. If you want to understand what's happening under the hood when TPMJS serves tools via MCP, this is the place to start.

[Browse public collections](https://tpmjs.com/collections)

— Ajax

P.S. We're at the point where collections created by users are more interesting than anything I could curate myself. If you've built a collection that does something useful, share it publicly. Other developers will find it.

---

### Edition 4: The 1M Tool Milestone

**Subject line options:**

1. `1,000,000 tools` — Just the number. Stark. Impossible to ignore.
2. `Tuesday dispatch: we hit 1M tools (what now?)` — Milestone + forward-looking question. "What now?" implies this is a turning point.
3. `Every npm package is now a potential AI tool` — Reframes npm itself. Bold statement that positions TPMJS as infrastructure, not just a product.

**Preview text:** The registry is now the size of npm. Here's what that means.

**Body:**

Hey —

We hit 1 million tools in the registry this week.

**The observation:**

When I started TPMJS, the question was "can we get enough tools for this to be useful?" That question is answered. A million tools — covering web scraping, data processing, image generation, code analysis, search, APIs, file manipulation, and categories I hadn't even thought of.

The new question is: "How do we help agents pick the RIGHT tool from a million options?"

That's what we're focused on now. Better search ranking. Better quality signals. Better tool descriptions that help agents make good choices. The quantity problem is solved. The quality problem is where the real work begins.

**What we shipped:**

- Registry hit 1M indexed tools
- Search improvements — BM25 ranking with quality score boosting
- Agent memory — custom agents now remember context across conversations
- Bulk tool testing — run all scenarios in a collection with one click
- New onboarding flow for first-time users (you might see it if you share your link with someone)

**Tool spotlight: The long tail**

This week's spotlight isn't one tool — it's the long tail. Among the 1M tools, there are thousands of niche packages that solve very specific problems: converting between obscure file formats, interfacing with legacy APIs, parsing domain-specific data structures. These are tools that no curated marketplace would ever manually add, but they're exactly what makes a registry valuable. When someone needs to parse a DICOM medical image file, that tool exists. When someone needs to interface with a specific IoT protocol, that tool exists too.

The long tail is the moat.

**Community picks:**

- The collections page is now organized by use case — browse by "Research," "Content," "DevOps," and more
- A university research group published a collection for scientific data analysis that's been forked 30+ times
- The first enterprise team is using TPMJS custom agents for internal developer tooling

**One link:**

I wrote a technical deep-dive on how we scaled the registry to 1M tools while keeping search under 200ms. It covers the indexing strategy, quality scoring pipeline, and the npm sync system. Published on the TPMJS blog.

[Search the full registry](https://tpmjs.com/tool/tool-search)

— Ajax

P.S. The next milestone I care about isn't a tool count — it's the number of tools that agents actually use regularly. Right now that number is in the hundreds. I want it in the thousands. If you have ideas on how to get there, I'm listening.
