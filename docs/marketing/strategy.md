# TPMJS 90-Day Marketing Strategy

**Document owner:** Ajax Davis
**Last updated:** 2026-07-15 (repositioned for the post-official-MCP-registry landscape; see the "What changed in 2026" note below)
**Status:** Active plan

---

## Positioning Statement

For **AI developers and teams** who need to **give their agents real-world capabilities**, TPMJS is **the protocol-agnostic tool layer for AI agents** that **discovers tools published to npm, health-scores and sandboxes them, and serves each curated collection through every surface at once — CLI, MCP, REST, SDK, and Skill**. Unlike **a bare directory that only points at packages, or a stack of hand-built MCP servers you host yourself**, TPMJS lets you **curate the tools once and consume them however each agent works best — no protocol lock-in, and never untrusted code on your own machine**.

> ### CORRECTION 2026-07-15 (v2 — the multi-modal reframe; supersedes the "curated/scored/sandboxed on top of MCP" primary message below where they conflict)
> The founder rejected leading with "sandboxed layer on top of the official MCP registry" as too small. Verbatim: *"we offer it as a cli, as an api, as a skill… we dont think there is a fight over apis, clis, or mcp, we think why not have all."* **New primary thesis: one curated collection, delivered as CLI · MCP · REST · SDK · Skill — write once, consume everywhere, no protocol war.** Curation/scoring/sandboxing are real differentiators but they are FEATURES on top of every protocol, not the headline, and tpmjs is NOT subordinate to the official MCP registry (that registry is one input among many, not the thing we sit on top of). The homepage `ProtocolSection` already carried this thesis ("mcp vs cli vs rest is the wrong argument"); it's now elevated, with **Skill added as the 5th surface**. Hero = **"ONE COLLECTION. EVERY SURFACE."**

> ### What changed in 2026 (read before touching copy)
> - **MCP is now neutral infrastructure**, donated to the **Linux Foundation (Agentic AI Foundation)** in Dec 2025. Stop teaching "what MCP is" and stop tying it to one vendor — it spans Anthropic, OpenAI, Google, Microsoft, and AWS.
> - **An official MCP registry launched** (`registry.modelcontextprotocol.io`, preview). It's a thin metadata index that *explicitly* delegates curation, scoring, and security to "downstream marketplaces." **It is our upstream, not our competitor.** But it means "the npm for AI tools" now literally describes the *free* registry — so the tagline must add what an index can't do: **curated, scored, sandboxed**.
> - **Security got real:** 2026 saw npm supply-chain worms harvesting Claude/Cursor configs, credential-stealing MCP servers submitted to legit registries, and an RCE in the official MCP SDK. "You never run untrusted code locally" is now the strongest wedge.
> - **Tool sprawl is a named crisis:** dozens of MCP servers bury an agent's context in schemas (58 tools ≈ 55K tokens). Curated collections = on-demand discovery = the fix.
> - **Kill "1M+ tools" and "the entire npm ecosystem as tools."** Both are false against our own registry (~800 tools / ~240 packages) and this audience fact-checks. Use ONE live, dated number.

---

## Messaging Hierarchy

### Primary Message
**"One collection. Every surface — CLI · MCP · REST · SDK · Skill."** Curate the tools an agent needs once, and TPMJS serves that exact set through every protocol at once. The "which transport wins" debate is the wrong argument — each is better in a different context, so you get all of them from one source of truth.

### Secondary Messages
1. **"Write the tool once. Consume it everywhere."** Author-facing framing — publish a Zod-schema'd function to npm, and it's instantly a CLI command, an MCP server, a REST endpoint, an SDK import, and a skill. No four separate integrations.
2. **"You never run an untrusted tool on your own machine."** The security wedge — every tool runs in an isolated hosted sandbox, health-scored and quality-ranked. Trust and quality ride on top of *every* surface.
3. **"On-demand discovery, not 55K tokens of schemas."** A collection is curated discovery — the fix for tool sprawl — live across all five surfaces at once.
4. **"Works with Claude Code, Cursor, ChatGPT, VS Code, your backend, and your TypeScript app."** Breadth of compatibility across surfaces, current client names, no vendor or protocol lock-in.
4. **"Already on npm? Add one keyword — live in minutes."** Lowest-friction publishing; velocity is true and verifiable.

### Tertiary Messages
- "Complementary to the official MCP registry — the curated, runnable layer on top of it." (Positioning vs the new upstream)
- "~800 tools, indexed live from npm." (One honest, dated number — never "1M+")
- "Omega Agent: chat with tools built in." (Product showcase for non-technical users)
- "Open protocol, open source." (Trust signal for developers)

---

## Channel Strategy

| Channel | Why | Content Type | Post Frequency | Time Investment/Week |
|---------|-----|-------------|----------------|---------------------|
| **Twitter/X** | Where AI developers live. High signal, fast feedback loops. | Demos, threads, hot takes, tool announcements | Daily (1-2 posts) | 5 hrs |
| **GitHub** | Credibility engine. Stars = social proof. Issues = community signal. | README, examples, issue responses, discussions | 3-4 updates/week | 3 hrs |
| **Hacker News** | One front-page post can generate 10K+ visitors in a day. High leverage. | Show HN posts, comment engagement | 1-2 submissions/month | 2 hrs |
| **Reddit** (r/LocalLLaMA, r/ChatGPT, r/MachineLearning, r/programming) | Targeted developer communities. Authentic engagement rewarded. | Tutorials, "I built this" posts, helpful comments | 2-3 posts/week | 3 hrs |
| **Dev.to / Hashnode** | SEO juice. Evergreen content that ranks. | Long-form tutorials, comparison posts | 1 post/week | 4 hrs |
| **YouTube** | Demos are more compelling in video. Long tail discovery. | 3-5 min tool demos, architecture walkthroughs | 1 video/2 weeks | 4 hrs |
| **Discord** | Community home base. Direct feedback channel. | Support, announcements, tool requests | Daily presence | 3 hrs |
| **npm** | Developers discover tools where they already install packages. | Package READMEs, keywords, tpmjs field | Ongoing with each tool publish | 1 hr |

**Total weekly time budget: ~25 hours**

---

## Phase 1: Foundation (Days 1-30)

### Goals
- Establish TPMJS presence in 3 key channels (Twitter/X, GitHub, Hacker News)
- Publish 8 pieces of content that rank for "MCP tools," "AI agent tools," and "npm AI"
- Reach 500 GitHub stars
- Get 100 registered users on tpmjs.com
- Secure 5 community-published tools in the registry

### KPIs
| Metric | Target | Tracking |
|--------|--------|----------|
| GitHub stars | 500 | GitHub API |
| tpmjs.com registered users | 100 | Database count |
| Twitter/X followers | 300 | Twitter analytics |
| Community-published tools | 5 | `prisma.package.count({ where: { isOfficial: false } })` |
| Organic search impressions | 5,000 | Google Search Console |
| Weekly site visitors | 500 | Vercel Analytics |

### Week 1: Launch Preparation

**Monday - Polish the open source repo (4 hrs)**
- Write a world-class README.md for the main repo. Structure: problem statement, 15-second GIF demo, one-liner install, feature list, architecture diagram, contributing guide.
- Add GitHub topics: `ai-tools`, `mcp`, `model-context-protocol`, `agent-tools`, `npm`, `claude`, `openai`, `cursor`.
- Create a CONTRIBUTING.md with clear first-issue labels.
- Pin 3 "good first issue" issues to encourage contributions.

*Idea Library Reference: #133 (Developer evangelism), #87 (Open source strategy)*

**Tuesday - Record the hero demo (3 hrs)**
- Record a terminal screencast: `npx @tpmjs/cli tool search "web scraper"` -> pick a tool -> `tpm tool run` -> see results in Claude.
- Record a second demo: Omega Agent conversation showing tool discovery and execution.
- Convert to GIF (ezgif.com) and embed in README + landing page.
- Upload full video to YouTube as "TPMJS in 60 seconds."

*Idea Library Reference: #1 (Video content), #89 (Product demos)*

**Wednesday - Set up analytics and tracking (2 hrs)**
- Verify Google Search Console ownership for tpmjs.com.
- Set up Vercel Analytics (already in package.json).
- Create a simple tracking spreadsheet: daily GitHub stars, weekly visitors, registered users, tools published.
- Add UTM parameters to all shared links: `?utm_source=twitter&utm_medium=social&utm_campaign=launch`.

**Thursday - Write the Show HN post (3 hrs)**
- Title: "Show HN: TPMJS - The npm for AI tools (use any npm package as an agent tool)"
- Body: Problem (building AI tools is repetitive), solution (registry that wraps npm packages), how it works (3 steps), live link, ask for feedback.
- Do NOT post yet. Queue for Monday of Week 2 (HN traffic is best Mon-Wed, 9-11am ET).

*Idea Library Reference: #35 (Hacker News strategy)*

**Friday - Create Twitter presence (3 hrs)**
- Set up @tpmjs Twitter account if not already active.
- Write 10 tweets in advance:
  1. Launch announcement with GIF demo
  2. "Every npm package is now an AI tool" with code snippet
  3. Thread: "How we built a tool registry for AI agents"
  4. Tool spotlight: `tpm-csv-parse` (show input/output)
  5. "Claude can now use 180+ tools from npm" with screenshot
  6. Comparison: "Building MCP tools from scratch vs. using TPMJS" (before/after)
  7. "What tool should we add next?" (engagement bait)
  8. Quick tip: "Add your npm package to TPMJS in 5 minutes"
  9. Architecture thread: "How TPMJS executes npm packages safely in sandboxed environments"
  10. Omega Agent demo: "Chat with an AI that has 180 tools"

### Week 2: Public Launch

**Monday - Show HN + Twitter launch (2 hrs active, then monitor all day)**
- Post Show HN at 10am ET.
- Simultaneously post launch tweet with demo GIF.
- Reply to every HN comment within 2 hours. Be genuine, technical, and grateful.
- Cross-post to Reddit r/programming and r/LocalLLaMA as "I built this" posts.

*Idea Library Reference: #35 (Hacker News), #36 (Reddit strategy)*

**Tuesday - Dev.to launch post (4 hrs)**
- Title: "I built an npm registry for AI agent tools -- here is what I learned"
- Content: Problem narrative, architecture decisions, code examples showing `tpm tool search` and SDK usage, link to live site.
- Canonical URL points to tpmjs.com/blog if you have a blog, otherwise self-hosted on Dev.to.
- Cross-post to Hashnode with canonical URL.

*Idea Library Reference: #2 (Blog content), #4 (Technical writing)*

**Wednesday - Respond to launch feedback (3 hrs)**
- Triage GitHub issues from HN/Reddit traffic.
- Reply to every comment on every platform.
- Collect feature requests into a public roadmap (GitHub Project board or tpmjs.com/roadmap).

**Thursday - First tool spotlight post (2 hrs)**
- Pick the most interesting official tool (e.g., `e2b` code interpreter or `compare-pages`).
- Write a 500-word Twitter thread showing real-world usage.
- Include: what it does, code to install, example prompt to an AI agent, output screenshot.

*Idea Library Reference: #38 (Social content templates)*

**Friday - Developer docs polish (3 hrs)**
- Review /docs pages on tpmjs.com: quickstart, SDK, tutorials, MCP setup.
- Ensure the quickstart gets a developer from zero to first tool execution in under 5 minutes.
- Add "copy to clipboard" buttons on all code blocks.
- Add SEO meta tags to all doc pages: title, description, og:image.

*Idea Library Reference: #87 (Product-led onboarding), #134 (Developer documentation)*

### Week 3: Content Engine

**Monday - Write SEO pillar article #1 (4 hrs)**
- Target keyword: "MCP tools" (or "model context protocol tools")
- Title: "The Complete Guide to MCP Tools: What They Are, How They Work, and Where to Find Them"
- 2,000+ words. Cover: what MCP is, how tools work, examples of tool categories, how to build one, link to TPMJS registry.
- Publish on tpmjs.com/blog (or Dev.to with canonical).

*Idea Library Reference: #3 (SEO content), #5 (Pillar content)*

**Tuesday - Build a free tool: MCP Config Generator (3 hrs)**
- A web page at tpmjs.com/tools/mcp-config-generator.
- User selects tools from a list, clicks "Generate Config," gets a `claude_desktop_config.json` they can paste.
- This is a lead magnet and SEO page. Target keyword: "claude mcp config."

*Idea Library Reference: #14 (Free tool as marketing), #15 (Interactive tool)*

**Wednesday - Publish 3 tool spotlights (2 hrs)**
- Write short-form posts (tweet + LinkedIn) for 3 tools:
  1. `tpm-changelog-entry` - "Generate changelogs from your git history"
  2. `tpm-csv-parse` - "Let Claude analyze any CSV file"
  3. `tpm-url-parse` - "Extract and validate URLs in agent workflows"
- Each post: problem, 3-line code snippet, output screenshot.

**Thursday - Outreach: find 10 MCP content creators (2 hrs)**
- Search YouTube for "MCP tools" and "Claude MCP" videos.
- Find creators with 1K-50K subscribers (reachable, actively covering MCP).
- Send 10 DMs/emails: "Hey, I built a tool registry for MCP. Would love your feedback. Here is a link: tpmjs.com"
- No ask for promotion. Just genuine feedback request. Let them discover the value.

*Idea Library Reference: #40 (Influencer outreach), #136 (Developer advocate partnerships)*

**Friday - Publish quickstart video on YouTube (4 hrs)**
- Title: "How to Add 180+ Tools to Claude in 2 Minutes with TPMJS"
- 3-minute video: install CLI, search tools, add to Claude, demo a conversation.
- Thumbnail: terminal screenshot with "180+ AI TOOLS" text overlay.
- Description: keywords, links to docs, timestamps.

*Idea Library Reference: #1 (Video content), #88 (Onboarding video)*

### Week 4: Community Seeding

**Monday - Launch Discord server (2 hrs)**
- Channels: #general, #show-and-tell, #tool-requests, #help, #announcements, #tool-dev.
- Post invite link on GitHub README, tpmjs.com footer, and Twitter bio.
- Seed with 3-5 interesting conversations by posting tool ideas and asking for opinions.

*Idea Library Reference: #41 (Community building), #42 (Discord strategy)*

**Tuesday - Write "How to publish a TPMJS tool" guide (3 hrs)**
- Step-by-step tutorial with code examples.
- Cover: package.json tpmjs field, tool schema, testing locally, publishing to npm.
- Post on tpmjs.com/docs/publish and cross-post to Dev.to.
- This is critical for the supply side of the marketplace.

*Idea Library Reference: #90 (Developer onboarding), #135 (Developer guides)*

**Wednesday - Create 5 "good first tool" bounties (2 hrs)**
- Open 5 GitHub issues with label "good first tool":
  1. Slack message sender
  2. GitHub issue creator
  3. Weather API wrapper
  4. Translation tool
  5. Markdown to PDF converter
- Each issue includes: tool description, expected input/output schema, link to publishing guide.
- Offer to feature any contributor's tool on the homepage.

*Idea Library Reference: #93 (Community contributions), #133 (Developer evangelism)*

**Thursday - SEO pillar article #2 (4 hrs)**
- Target keyword: "AI agent tools"
- Title: "AI Agent Tools in 2026: The Complete Developer Guide"
- Cover: what agent tools are, tool calling APIs (OpenAI, Anthropic, Google), MCP protocol, tool registries (TPMJS), building vs. buying tools.
- Internal links to TPMJS docs and tool pages.

*Idea Library Reference: #3 (SEO content), #6 (Comparison content)*

**Friday - Week 4 retrospective + plan adjustment (2 hrs)**
- Review all KPIs against targets.
- Identify what content performed best (most clicks, most stars, most signups).
- Double down on the top-performing channel for Phase 2.
- Kill any activity that produced zero signal.

---

## Phase 2: Traction (Days 31-60)

### Goals
- Build a repeatable content engine (2 posts/week minimum)
- Reach 2,000 GitHub stars
- Get 500 registered users
- 20 community-published tools
- First mention in an AI newsletter or podcast
- Rank on page 1 for "MCP tools" or "AI agent tools npm"

### KPIs
| Metric | Target | Tracking |
|--------|--------|----------|
| GitHub stars | 2,000 | GitHub API |
| Registered users | 500 | Database |
| Community tools | 20 | `prisma.package.count({ where: { isOfficial: false } })` |
| Monthly site visitors | 5,000 | Vercel Analytics |
| Newsletter/podcast mentions | 2 | Manual tracking |
| Organic search clicks | 500/month | Google Search Console |
| Discord members | 200 | Discord metrics |

### Week 5-6: Content Flywheel

**Recurring weekly schedule:**

| Day | Activity | Time |
|-----|----------|------|
| Monday | Write 1 long-form article (Dev.to/blog) targeting a specific keyword | 4 hrs |
| Tuesday | Record 1 short demo video (Twitter + YouTube Shorts) | 2 hrs |
| Wednesday | 3 tool spotlight tweets + 1 Reddit post | 2 hrs |
| Thursday | Community engagement: respond to issues, Discord, tweets | 3 hrs |
| Friday | Outreach: 5 DMs to AI creators/newsletter authors | 1 hr |

**Article topics for Weeks 5-6:**
1. "TPMJS vs. Building Custom MCP Servers: A Side-by-Side Comparison" (target: developers evaluating build vs. buy)
2. "How to Give Claude Desktop 50 New Tools in 5 Minutes" (target: Claude power users searching for MCP setup)
3. "Building an AI Agent That Can Read, Write, and Analyze Data" (target: "AI agent tutorial" keyword)
4. "The Architecture of a Tool Registry: How TPMJS Indexes 1M+ npm Packages" (target: technical credibility + HN audience)

*Idea Library Reference: #6 (Comparison posts), #7 (Tutorial content), #8 (Architecture deep dives)*

### Week 7: Integration Partnerships

**Monday-Tuesday - Build example integrations (6 hrs)**
- Create and publish working examples:
  1. `tpmjs-langchain-example` - Use TPMJS tools in a LangChain agent
  2. `tpmjs-vercel-ai-example` - Use TPMJS tools with Vercel AI SDK
  3. `tpmjs-openai-example` - Use TPMJS tools with OpenAI function calling
- Publish as GitHub repos under the tpmjs org. Include README with full setup instructions.

*Idea Library Reference: #91 (Integration examples), #92 (Template projects)*

**Wednesday - Submit to AI newsletters (2 hrs)**
- Target newsletters:
  1. **TLDR AI** - submit via tldr.tech/submit
  2. **Ben's Bites** - submit via bensbites.com
  3. **The Neuron** - submit via theneuron.com
  4. **Superhuman AI** - submit via superhuman.com
  5. **AI Tool Report** - submit via aitoolreport.com
- Email template: "We launched TPMJS -- the npm for AI tools. [1 sentence what it does]. [1 metric: 180+ tools, works with Claude/GPT]. Would love to be featured. [Link]"

*Idea Library Reference: #37 (Newsletter outreach), #44 (PR strategy)*

**Thursday - Podcast outreach (2 hrs)**
- Target podcasts:
  1. Latent Space (AI engineering)
  2. Practical AI
  3. The Changelog (open source)
  4. Syntax.fm (web dev, covers AI tools)
  5. AI Engineering Podcast
- Pitch angle: "The npm ecosystem is becoming the tool layer for AI agents. Here is how."

**Friday - Create a "TPMJS for [framework]" landing page (3 hrs)**
- Build tpmjs.com/integrations/langchain (already have /integrations page)
- SEO target: "langchain tools npm" or "langchain mcp tools"
- Content: 3-step setup, code example, list of compatible tools.

*Idea Library Reference: #9 (Landing page SEO), #96 (Framework-specific content)*

### Week 8: Product-Led Growth

**Monday - Build the "Explore Tools" interactive experience (4 hrs)**
- Improve the /tool/tool-search page:
  - Add category filters (currently exists based on the code)
  - Add "Copy MCP Config" button on each tool card
  - Add "Try in Omega" button linking to /omega with the tool pre-loaded
- Every tool page becomes a mini landing page that can rank in search.

*Idea Library Reference: #87 (Product-led growth), #14 (Interactive tool pages)*

**Tuesday - Build programmatic SEO pages (4 hrs)**
- Generate pages at: `/tool/category/[category]` (e.g., /tool/category/data-analysis, /tool/category/web-scraping)
- Each page: category description, tool listings, example use cases, "Get started" CTA.
- Target long-tail keywords: "AI tools for data analysis," "MCP tools for web scraping," etc.
- These pages auto-populate from the database as new tools are added.

*Idea Library Reference: #10 (Programmatic SEO), #16 (Category pages)*

**Wednesday - Add social proof to homepage (2 hrs)**
- Add sections to the homepage:
  - "Used by developers from [company logos]" (even if it is individual developers -- use GitHub avatar grid)
  - "New tools added this week" (live feed from database)
  - Tool count that updates in real-time (already implemented)
  - "Community spotlight" featuring a user's published tool

*Idea Library Reference: #88 (Social proof), #94 (User showcase)*

**Thursday - Create shareable tool cards (3 hrs)**
- Generate OG images for each tool page (scripts/generate-og-images.ts already exists).
- Make each tool page share-friendly: when someone shares tpmjs.com/tool/csv-parse on Twitter, it shows a rich card with tool name, description, and install command.
- This turns every tool into a shareable piece of marketing.

*Idea Library Reference: #39 (Social sharing optimization), #95 (Viral mechanics)*

**Friday - Implement "Invite a friend" flow (2 hrs)**
- After a user publishes their first tool, show: "Share your tool: [copy link] [tweet it] [post to Reddit]"
- Pre-fill tweet: "I just published [tool-name] to @tpmjs -- any AI agent can use it now. Check it out: [link]"
- This turns publishers into promoters.

*Idea Library Reference: #93 (User-generated content), #96 (Referral loops)*

---

## Phase 3: Growth (Days 61-90)

### Goals
- Reach 5,000 GitHub stars
- 2,000 registered users
- 50 community-published tools
- 20,000 monthly site visitors
- Featured in 2+ major AI newsletters or publications
- Top 3 Google ranking for "MCP tools" or "AI agent tools"
- Establish TPMJS as the default answer to "where do I find AI tools?"

### KPIs
| Metric | Target | Tracking |
|--------|--------|----------|
| GitHub stars | 5,000 | GitHub API |
| Registered users | 2,000 | Database |
| Community tools | 50 | Database |
| Monthly site visitors | 20,000 | Vercel Analytics |
| Organic search clicks | 3,000/month | Google Search Console |
| Newsletter features | 5 cumulative | Manual |
| Discord members | 500 | Discord |
| npm CLI downloads | 1,000/month | npm stats |
| Omega Agent conversations | 500/month | Database |

### Week 9-10: Scale What Works

By now you have 8 weeks of data. Double down on what produced results.

**If Twitter performed best:**
- Increase to 2-3 posts/day.
- Start Twitter Spaces: "AI Tools Office Hours" every Thursday at 12pm ET.
- Engage in every trending AI thread with relevant TPMJS context.

**If SEO performed best:**
- Publish 3 articles/week instead of 1.
- Build 10 more programmatic category pages.
- Create comparison pages: "TPMJS vs [competitor]" for every alternative.

**If community/Discord performed best:**
- Launch weekly "Tool of the Week" community vote.
- Start "Tool Jam" events: build a TPMJS tool in 2 hours, share it in Discord.
- Feature community tools on homepage rotation.

**If YouTube/video performed best:**
- Record 2 videos/week.
- Start a "Build an AI Agent" series (5-part).
- Collaborate with 1 AI YouTuber on a joint video.

### Week 11: Amplification

**Monday - Write and submit a technical blog post to a major publication (4 hrs)**
- Target: Vercel blog, Anthropic cookbook, or a guest post on a high-DA site.
- Topic: "How npm Became the Tool Layer for AI Agents" -- thought leadership piece.
- Mention TPMJS as a case study, not a sales pitch.

*Idea Library Reference: #44 (PR), #2 (Guest posting)*

**Tuesday - Launch "TPMJS Hacktoberfest-style" contribution event (3 hrs)**
- "Tool-a-thon: Publish 5 tools, get a TPMJS t-shirt" (even if the shirt is digital/sticker-based).
- Create a leaderboard page at tpmjs.com/tool-a-thon.
- Promote on Twitter, Reddit, Discord, and Dev.to.
- Duration: 2 weeks.

*Idea Library Reference: #93 (Community contributions), #41 (Community events)*

**Wednesday - Create the "Awesome TPMJS Tools" list (2 hrs)**
- Publish awesome-tpmjs on GitHub (awesome lists get organic stars and SEO traffic).
- Curate the best 50 tools with descriptions and use cases.
- Submit to awesome-lists aggregators.

*Idea Library Reference: #3 (SEO content), #133 (Developer ecosystem)*

**Thursday - Build "Tool Playground" page (4 hrs)**
- Improve /playground to let visitors try tools without signing up.
- Pick 5 popular tools, let users input data and see output immediately.
- This is a conversion funnel: try -> sign up -> publish -> promote.

*Idea Library Reference: #15 (Interactive demo), #87 (Product-led growth)*

**Friday - Launch on Product Hunt (3 hrs active, then all-day engagement)**
- Prepare 5 screenshots/GIFs.
- Write description: "TPMJS - The npm for AI tools. Discover and use 180+ npm packages as agent tools for Claude, GPT, Cursor, and any MCP client."
- Schedule for Tuesday at 12:01am PT (highest traffic day).
- Ask Discord community and Twitter followers to support.
- Reply to every comment on Product Hunt all day.

*Idea Library Reference: #36 (Launch platforms), #88 (Social proof)*

### Week 12: Compound and Sustain

**Monday - Publish "State of AI Tools 2026" report (4 hrs)**
- Unique data from TPMJS: most popular tool categories, download trends, tool adoption curve, MCP adoption metrics.
- This becomes a citable resource that drives backlinks and press mentions.
- Publish as a downloadable PDF + web page at tpmjs.com/report/2026.

*Idea Library Reference: #8 (Data-driven content), #44 (PR asset)*

**Tuesday - Create email newsletter: "TPMJS Weekly" (3 hrs)**
- Content: 3 new tools this week, 1 tutorial tip, 1 community spotlight, 1 ecosystem news item.
- Capture emails from: tpmjs.com signup, tool playground usage, GitHub star notification.
- Send every Tuesday at 10am ET.

*Idea Library Reference: #43 (Email marketing), #38 (Content recycling)*

**Wednesday - Set up automated content pipeline (3 hrs)**
- Automate "New tool published" tweets: when a new tool passes quality threshold, auto-draft a tweet for review.
- Automate weekly stats tweet: "This week on TPMJS: X new tools, Y new users, Z tool executions."
- Automate Discord announcements for new tool publications.

*Idea Library Reference: #96 (Automation), #95 (Growth loops)*

**Thursday - Plan Phase 4 (2 hrs)**
- Review all 90-day metrics against targets.
- Identify the 3 highest-ROI activities from the past 90 days.
- Draft next quarter plan: focused on the top 3 channels only.
- Consider: paid advertising (if organic channels proved the messaging), partnerships, conference talks.

**Friday - Publish 90-day retrospective (2 hrs)**
- Write a transparent "Building in public" post: what we launched, what worked, what failed, metrics.
- Post on Twitter thread + Dev.to.
- Developers respect transparency. This builds trust and generates engagement.

*Idea Library Reference: #2 (Building in public), #38 (Authentic content)*

---

## Metrics Dashboard

Track these numbers weekly in a spreadsheet or Notion database.

### Primary Metrics (Leading Indicators)

| Metric | Week 1 | Week 4 | Week 8 | Week 12 | Source |
|--------|--------|--------|--------|---------|--------|
| GitHub stars | - | 500 | 2,000 | 5,000 | GitHub API |
| Registered users | - | 100 | 500 | 2,000 | `prisma.user.count()` |
| Community tools published | - | 5 | 20 | 50 | `prisma.package.count({ where: { isOfficial: false } })` |
| Weekly site visitors | - | 500 | 1,250 | 5,000 | Vercel Analytics |
| Discord members | - | 50 | 200 | 500 | Discord |

### Secondary Metrics (Lagging Indicators)

| Metric | Target by Day 90 | Source |
|--------|-------------------|--------|
| Organic search clicks/month | 3,000 | Google Search Console |
| npm CLI installs/month | 1,000 | npm stats for @tpmjs/cli |
| Omega Agent conversations/month | 500 | Database |
| Newsletter/podcast features (cumulative) | 5 | Manual tracking |
| Backlinks to tpmjs.com | 100 | Google Search Console or Ahrefs free |
| Twitter/X impressions/month | 100,000 | Twitter Analytics |
| Dev.to total article views | 10,000 | Dev.to dashboard |

### Activation Funnel (Track Weekly)

```
Visit tpmjs.com
  -> Sign up                    (target: 10% of visitors)
  -> Search for a tool          (target: 60% of signups)
  -> Execute a tool (Omega/CLI) (target: 30% of searchers)
  -> Return within 7 days       (target: 20% of executors)
  -> Publish a tool              (target: 2% of signups)
```

---

## Competitive Moat

TPMJS needs to build defensible advantages that compound over time. Here is the moat strategy, ranked by importance:

### 1. Network Effects (Most Important)
- **Supply side:** More published tools -> more useful registry -> more developers use it -> more developers publish tools.
- **Demand side:** More users -> more download data -> better quality scores -> better tool discovery -> more users.
- **Action:** Prioritize community tool publishing above all else. Every community tool is a brick in the moat.
- **Metric:** Track community tools published per week. If this number is growing, the flywheel is spinning.

### 2. Data Advantage
- **What:** TPMJS will have unique data that no one else has: which tools are most used by AI agents, which tool combinations work well together, which tools fail in production.
- **Action:** Log (anonymized) tool execution patterns. Use this data to build: "Developers who used X also used Y" recommendations, quality scores, and the "State of AI Tools" report.
- **Moat:** This data is impossible to replicate without the same user base.

### 3. npm Ecosystem Lock-In
- **What:** By making npm the standard way to distribute AI tools (via the `tpmjs` field in package.json), TPMJS becomes the index layer on top of npm.
- **Action:** Push the `tpmjs` keyword and field convention. Get it mentioned in MCP docs, AI framework docs, and developer tutorials.
- **Moat:** Once developers publish tools with the `tpmjs` field, switching costs are high -- their tools are already in the registry.

### 4. SEO Authority
- **What:** Every tool page, category page, and tutorial is a search-indexable URL.
- **Action:** With 180+ tools and growing, TPMJS can have 500+ unique, useful pages indexed. Each ranks for long-tail keywords like "AI tool for CSV parsing" or "MCP tool for Discord."
- **Moat:** SEO authority compounds over time. A competitor starting 6 months later will have 6 months less domain authority and content.

### 5. Execution Speed
- **What:** TPMJS has a sandboxed execution runtime (Vercel + Railway). Tools run immediately without the user installing anything locally.
- **Action:** Make "try it now" the default experience. Every tool page should have a "Run in Omega" button.
- **Moat:** Building a secure execution runtime is hard. Competitors would need to replicate the sandbox infrastructure.

### 6. Brand Recognition
- **What:** "The npm for AI tools" is a sticky positioning that is easy to remember and repeat.
- **Action:** Use this phrase in every piece of content, every bio, every README. Repetition builds association.
- **Moat:** First-mover advantage in naming. Once developers associate "TPMJS = npm for AI tools," it is hard for a competitor to claim the same position.

---

## Content Calendar Summary

### Phase 1 (Days 1-30)

| Week | Monday | Tuesday | Wednesday | Thursday | Friday |
|------|--------|---------|-----------|----------|--------|
| 1 | Polish repo + README | Record demo video | Analytics setup | Write Show HN draft | Pre-write 10 tweets |
| 2 | **LAUNCH: Show HN + Twitter** | Dev.to launch post | Respond to feedback | Tool spotlight #1 | Docs polish |
| 3 | SEO article: MCP tools guide | Free tool: MCP config generator | 3 tool spotlights | Outreach: 10 creators | YouTube quickstart |
| 4 | Launch Discord | Publish "How to publish" guide | 5 "good first tool" bounties | SEO article: AI agent tools | Retrospective |

### Phase 2 (Days 31-60)

| Week | Monday | Tuesday | Wednesday | Thursday | Friday |
|------|--------|---------|-----------|----------|--------|
| 5 | Article: TPMJS vs custom MCP | Demo video | 3 spotlights + Reddit | Community engagement | Outreach: 5 DMs |
| 6 | Article: Claude + 50 tools | Demo video | 3 spotlights + Reddit | Community engagement | Outreach: 5 DMs |
| 7 | Integration: LangChain example | Integration: Vercel AI example | Newsletter submissions (5) | Podcast outreach (5) | Framework landing page |
| 8 | Improve tool search UX | Programmatic SEO pages | Social proof on homepage | Shareable tool cards | "Invite a friend" flow |

### Phase 3 (Days 61-90)

| Week | Monday | Tuesday | Wednesday | Thursday | Friday |
|------|--------|---------|-----------|----------|--------|
| 9 | Scale top channel (2x) | Scale top channel (2x) | Scale top channel (2x) | Community engagement | Outreach |
| 10 | Scale top channel (2x) | Scale top channel (2x) | Scale top channel (2x) | Community engagement | Outreach |
| 11 | Guest post: major publication | Tool-a-thon launch | awesome-tpmjs list | Tool Playground improvements | **Product Hunt launch** |
| 12 | "State of AI Tools" report | Launch email newsletter | Automate content pipeline | Plan Phase 4 | 90-day retrospective |

---

## Quick Reference: Idea Library Mapping

| Idea # | Category | How TPMJS Uses It |
|--------|----------|-------------------|
| #1 | Video content | YouTube quickstarts, Twitter demo GIFs |
| #2 | Blog content | Dev.to articles, "building in public" posts |
| #3 | SEO content | Pillar articles, programmatic tool/category pages |
| #6 | Comparison content | "TPMJS vs building custom MCP servers" |
| #8 | Data content | "State of AI Tools 2026" report |
| #9 | Landing pages | Framework-specific pages (/integrations/langchain) |
| #10 | Programmatic SEO | /tool/category/[category] auto-generated pages |
| #14 | Free tool | MCP Config Generator, Tool Playground |
| #15 | Interactive tool | "Try in Omega" on every tool page |
| #35 | Hacker News | Show HN launch, architecture posts |
| #36 | Launch platforms | Product Hunt, Reddit, Show HN |
| #37 | Newsletter outreach | TLDR AI, Ben's Bites, The Neuron |
| #38 | Social templates | Tool spotlight format, weekly stats tweet |
| #39 | Social sharing | OG images for every tool page |
| #40 | Influencer outreach | AI YouTubers, MCP content creators |
| #41 | Community building | Discord server, Tool-a-thon events |
| #42 | Discord strategy | Structured channels, community votes |
| #43 | Email marketing | TPMJS Weekly newsletter |
| #44 | PR strategy | Guest posts, data reports, podcast pitches |
| #87 | Product-led growth | Try tools without signup, "Run in Omega" CTAs |
| #88 | Social proof | User logos, download counts, tool count |
| #89 | Product demos | 60-second video, terminal GIFs |
| #90 | Developer onboarding | 5-minute quickstart, CLI-first experience |
| #91 | Integration examples | LangChain, Vercel AI SDK, OpenAI examples |
| #92 | Template projects | Starter repos for tool publishers |
| #93 | Community contributions | "Good first tool" bounties, Tool-a-thon |
| #94 | User showcase | Community spotlight, published tool features |
| #95 | Viral mechanics | Share-after-publish flow, pre-filled tweets |
| #96 | Automation | Auto-tweet new tools, weekly stats, Discord bots |
| #133 | Developer evangelism | GitHub presence, contributing guide, issue engagement |
| #134 | Developer docs | Quickstart, SDK docs, tutorial series |
| #135 | Developer guides | "How to publish a tool" guide |
| #136 | DevRel partnerships | Co-created content with AI framework maintainers |

---

## Non-Negotiable Principles

1. **Ship content, not perfection.** A good-enough blog post published today beats a perfect one next week. The content flywheel needs volume to spin.

2. **Reply to everything.** Every GitHub issue, every HN comment, every tweet mention, every Discord message. In the first 90 days, the founder IS the community.

3. **Show, do not tell.** Every piece of content should include a working code example, a GIF, or a live link. Developers do not trust words; they trust demos.

4. **Measure weekly, adjust monthly.** Check metrics every Friday. Make strategic changes at the end of each phase, not mid-week based on feelings.

5. **Solve real problems publicly.** When you fix a bug, write about it. When you make an architecture decision, explain it. "Building in public" is the highest-trust marketing channel for solo founders.

6. **One channel at a time.** Do not spread across 8 channels equally. Find the one that works and go deep. The channel strategy above is a menu, not a mandate.
