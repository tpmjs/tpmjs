# Marketing Psychology Playbook for TPMJS

TPMJS is the npm for AI tools: 1M+ AI-ready packages, native MCP protocol support, and seamless integration with Claude, GPT, Cursor, and Windsurf. This playbook maps cognitive biases and behavioral psychology principles to specific, actionable implementations across the TPMJS website, pricing, onboarding, and retention strategy.

Target audience: developers building with AI -- from solo hackers to platform teams at scale.

---

## Conversion Psychology

### 1. Social Proof (Bandwagon Effect)

**Principle:** People follow the actions of others, especially when uncertain. Developers trust adoption metrics because code popularity correlates with reliability and maintenance likelihood.

**Application to TPMJS:** Surface real-time aggregate numbers at every decision point. Developers evaluate tools the same way they evaluate npm packages -- stars, downloads, and community size are proxies for trust.

**Copy/UX examples:**
- Hero section: "1,247,000+ AI-ready tools. 38,000+ developers. 12M+ tool executions this month."
- Tool cards: "Installed 4,200 times this week" with a small sparkline chart showing growth.
- Category pages: "Most popular in Code Generation: 340 tools, 8,200 active users"
- Footer ticker: "Last tool installed 4 seconds ago by a developer in Berlin"
- Testimonial bar: "Used by teams at [logo grid] to ship AI features 3x faster"

**Where to use it:** Homepage hero, tool detail pages, category landing pages, CLI output after first install.

---

### 2. Authority Bias

**Principle:** People defer to perceived experts and established brands. In developer tooling, integration with respected platforms signals legitimacy and reduces perceived risk.

**Application to TPMJS:** Position TPMJS as the connective layer between developers and the AI platforms they already trust. Logo placement is not decoration -- it is a credibility transfer mechanism.

**Copy/UX examples:**
- Integration bar directly below the hero: "Works natively with" followed by high-contrast logos for Claude, GPT-4, Cursor, Windsurf, and VS Code.
- Tool detail pages: "Verified compatible with Claude 4 Opus, GPT-4o, and Cursor Agent Mode"
- Documentation callouts: "Recommended by the MCP specification authors"
- Blog posts co-authored with or citing Anthropic, OpenAI, or Cursor team members.
- CLI output: "Connected to Claude via MCP protocol v1.2 -- ready."

**Where to use it:** Homepage integration bar, tool detail sidebars, documentation headers, CLI first-run output, email signatures.

---

### 3. Zero-Price Effect

**Principle:** People disproportionately prefer free options even when a paid option offers better value per dollar. The word "free" triggers an emotional response that bypasses rational cost-benefit analysis.

**Application to TPMJS:** Make the free tier genuinely powerful so developers build real projects on it. The free tier is not a demo -- it is the product. Revenue comes from teams and scale, not from gating basic functionality.

**Copy/UX examples:**
- Pricing page header: "Free forever for individual developers. No credit card. No trial expiration. No catch."
- Feature comparison: Bold "Unlimited" in the free column for core features (tool discovery, single-agent usage, community tools).
- CTA button: "Start building -- it's free" rather than "Sign up for free trial"
- Onboarding: Never ask for payment information during setup. Zero friction to first value.
- Homepage: "Every open-source tool on TPMJS is free to use, forever."

**Where to use it:** Pricing page, homepage CTA, onboarding flow, comparison pages, paid feature upgrade prompts.

---

### 4. Endowment Effect

**Principle:** People value things more once they feel ownership over them. A configured tool feels like "my tool" even during a trial period, making abandonment psychologically costly.

**Application to TPMJS:** Get developers to invest personal configuration into the platform as early as possible. Every custom setting, every saved collection, every configured agent becomes something they would lose by leaving.

**Copy/UX examples:**
- Sandbox experience: "Your AI toolkit is ready. You've configured 3 tools, saved 2 collections, and your agent knows your coding style."
- Dashboard: "Your TPMJS workspace" (possessive language throughout).
- Export warning: "You have 12 configured tools and 3 custom agent prompts. Exporting will not preserve your execution history or quality rankings."
- Profile page: "Your toolkit score: 78/100 -- add 2 more tools to reach Expert level."
- Weekly digest email: "Your tools processed 2,340 requests this week. Here's your performance summary."

**Where to use it:** Dashboard, workspace settings, profile pages, export/cancellation flows, weekly digest emails.

---

### 5. IKEA Effect

**Principle:** People assign disproportionate value to things they helped create. A tool you configured yourself feels more valuable than an identical pre-configured one.

**Application to TPMJS:** Make tool customization and agent building feel like creation, not configuration. Frame every setup step as the developer "building" something.

**Copy/UX examples:**
- Agent builder: "Build your AI agent in 4 steps" with a visual assembly interface showing components snapping together.
- Tool configuration: "Customize this tool" with sliders, toggles, and a live preview panel showing output changes in real time.
- Completion message: "You built a code review agent that uses 3 tools. Nice work."
- Share prompt: "Share your agent configuration with the community" -- framing their config as a creation worth sharing.
- Template gallery: "Start from a template, make it yours" rather than "Use a pre-built configuration."

**Where to use it:** Agent builder, tool configuration pages, onboarding wizard, community sharing features, template gallery.

---

### 6. Anchoring

**Principle:** The first number people see disproportionately influences their perception of subsequent numbers. A high anchor makes moderate prices feel reasonable.

**Application to TPMJS:** Anchor against the cost of building AI tooling infrastructure internally. The comparison is not TPMJS vs. free -- it is TPMJS vs. 3 months of engineering time.

**Copy/UX examples:**
- Pricing page: "Building an internal AI tool registry costs ~$180,000/year in engineering time. TPMJS Team starts at $49/month."
- Enterprise page: "Companies spend an average of 6 engineer-months building MCP infrastructure. Get it out of the box."
- Feature comparison table: Show the "Build it yourself" column first (with high effort/cost estimates), then TPMJS columns.
- ROI calculator: Interactive tool where developers input team size and hourly rate. Output: "TPMJS saves your team ~$14,200/month in AI infrastructure costs."
- Upgrade prompt: "For less than the cost of one engineer-hour per month, unlock team features."

**Where to use it:** Pricing page, enterprise landing page, ROI calculator widget, upgrade modals, sales collateral.

---

### 7. Loss Aversion

**Principle:** People feel losses roughly twice as intensely as equivalent gains. The fear of falling behind is a stronger motivator than the promise of getting ahead.

**Application to TPMJS:** Frame competitor adoption as a loss the developer is actively experiencing. Not "you could be faster" but "you are currently slower than teams using AI tools."

**Copy/UX examples:**
- Homepage section: "Your competitors shipped AI features last quarter. What's your timeline?"
- Blog post titles: "The AI Tooling Gap: Why Teams Without MCP Are Falling Behind in 2026"
- Churn prevention email: "Your 8 configured tools and 2 custom agents are waiting. If you don't log in within 30 days, your execution history will be archived."
- Upgrade prompt: "Teams on the free tier miss out on private tool registries, team analytics, and priority MCP routing."
- Comparison content: "Every week without AI tooling infrastructure costs your team approximately 12 hours of manual integration work."

**Where to use it:** Homepage narrative sections, blog content strategy, churn prevention emails, upgrade prompts, competitive comparison pages.

---

### 8. Mere Exposure Effect

**Principle:** Repeated exposure to a stimulus increases preference for it. Developers who see TPMJS mentioned consistently across channels develop familiarity-based trust before they ever visit the site.

**Application to TPMJS:** Maintain a consistent, recognizable brand presence across every channel where developers spend time. The goal is recognition before evaluation.

**Copy/UX examples:**
- GitHub: TPMJS badge in README files of compatible packages: "[![TPMJS Compatible](https://tpmjs.com/badge.svg)](https://tpmjs.com/tools/package-name)"
- npm: Consistent `tpmjs` keyword and field across all registered packages.
- CLI: Branded output with consistent formatting. Every `tpmjs` command starts with the TPMJS logo.
- Dev.to / Hashnode / Twitter: Weekly "Tool of the Week" content series with consistent visual branding.
- VS Code / Cursor: TPMJS extension with icon in the sidebar. Passive presence during every coding session.
- Conference talks and workshops: "Powered by TPMJS" slide in every demo.

**Where to use it:** GitHub badges, npm package metadata, CLI output branding, social media content cadence, IDE extensions, conference presence.

---

### 9. Commitment and Consistency

**Principle:** Once people take a small action, they feel compelled to behave consistently with that action. A developer who adds one tool is psychologically primed to add more.

**Application to TPMJS:** Design the funnel as a series of tiny, low-commitment steps. Each step feels trivial, but the cumulative investment builds lock-in.

**Copy/UX examples:**
- Step 1 CTA: "Add your MCP server URL -- takes 10 seconds" (not "Set up your account")
- Step 2: "Try one tool -- just paste this command" with a single copy-paste CLI snippet.
- Step 3: "Save this tool to your workspace" (now they have a workspace).
- Step 4: "Add a second tool -- people who use [tool-1] also use [tool-2]."
- Step 5: "Invite a teammate to your workspace" (now it is a team tool).
- Micro-commitments: Star a tool, bookmark a collection, follow a tool author. Each is trivial but increases investment.

**Where to use it:** Onboarding flow, homepage CTA, tool detail pages, post-first-use prompts, email drip sequences.

---

### 10. Reciprocity

**Principle:** When someone gives you something of value, you feel obligated to return the favor. Free, genuinely useful resources create a psychological debt that converts to paid adoption.

**Application to TPMJS:** Give away substantial value with no strings attached. The SDK, documentation, community tools, and educational content should be generous enough that developers feel they owe TPMJS their attention.

**Copy/UX examples:**
- Open-source SDK: "The TPMJS SDK is MIT licensed. Build anything. No attribution required."
- Free tools: "500+ community-built tools, free forever. Built by developers, for developers."
- Educational content: "The Complete Guide to MCP Protocol" -- a 40-page technical guide, free download, no email gate.
- Free quality scores: "We calculate quality scores for every package so you don't have to evaluate tools manually."
- Community features: Free tool hosting, free analytics dashboard for open-source tool authors.
- Conference swag and sponsorships: Sponsor developer events, give away useful items (not branded junk).

**Where to use it:** SDK landing page, documentation site, blog/guides section, tool author dashboard, conference presence, email content strategy.

---

### 11. Scarcity

**Principle:** Limited availability increases perceived value. When something might run out or become unavailable, the urgency to act increases dramatically.

**Application to TPMJS:** Create genuine scarcity around premium positions and early adopter benefits. Artificial scarcity backfires with developers -- every constraint must be real and defensible.

**Copy/UX examples:**
- Featured spots: "Only 10 featured tool spots per category. 3 remaining this quarter. Apply for review."
- Early adopter program: "Founding Member pricing: $29/month locked in forever. Available to the first 500 teams. 127 spots remaining."
- Tool author benefits: "First 100 tool authors get a verified badge, priority support, and permanent placement in the 'Pioneer' collection."
- Beta features: "AI Agent Builder is in private beta. 200 developers have access. Join the waitlist."
- Limited-run integrations: "Cursor deep integration launching next month. Early access for Pro members."

**Where to use it:** Featured tool applications, pricing page (founding member tier), tool author onboarding, beta feature announcements, partnership launches.

---

### 12. Goal-Gradient Effect

**Principle:** People accelerate effort as they approach a goal. A progress bar at 70% is more motivating than one at 20% because the finish line feels close.

**Application to TPMJS:** Make onboarding and tool discovery feel like progression toward a clear finish line. Start the progress bar partially filled so the first step feels like continuation, not initiation.

**Copy/UX examples:**
- Onboarding progress: "Your AI toolkit: 60% complete" (pre-filled with account creation and first tool browse). Remaining steps: "Add your first tool (2 min), Configure an agent (3 min), Run your first execution (1 min)."
- Tool discovery milestones: "Explorer: 5 tools tried. Architect: 15 tools configured. Master: 50 tools in production."
- Weekly progress email: "You're 2 tools away from completing the Code Generation collection. Here are 2 suggestions."
- Dashboard widget: "Setup checklist: 4 of 6 complete" with the remaining items clearly labeled with time estimates.
- Achievement system: "You've hit 3 of 5 milestones this month. Complete 2 more to unlock the Advanced Analytics dashboard."

**Where to use it:** Onboarding checklist, dashboard progress widgets, weekly digest emails, achievement/milestone system, tool collection completion tracking.

---

### 13. Paradox of Choice

**Principle:** Too many options cause decision paralysis. When faced with 1M+ tools, developers freeze. Curation transforms overwhelming abundance into navigable confidence.

**Application to TPMJS:** Never present the full registry as an undifferentiated list. Every view should be curated, ranked, or filtered. The 1M+ number is a marketing asset; the curated experience is the product.

**Copy/UX examples:**
- Homepage: "Staff Picks: 12 tools our team uses every day" rather than "Browse 1,247,000 tools."
- Category pages: Show top 10 by quality score with a "Show all 340" expandable section below.
- Onboarding: "What are you building?" selector that filters to 5-8 recommended tools per use case.
- Search: "Developers who searched for [X] most often installed [Y]" -- reduce evaluation to one option.
- Collections: "The Essential AI Coding Toolkit (7 tools)" -- opinionated bundles that eliminate choice.
- Default recommendations: "Recommended for you based on your stack: React + TypeScript + Claude" with 3 curated tools.

**Where to use it:** Homepage featured section, category pages, onboarding use-case selector, search results, curated collections, personalized recommendations.

---

### 14. Status-Quo Bias

**Principle:** People prefer their current state and resist change. Switching tools feels risky and effortful. The best way to overcome this is to make the new thing feel like a natural extension of the old thing.

**Application to TPMJS:** Frame TPMJS as an upgrade to existing workflows, not a replacement. Import existing configurations, support existing package managers, and use familiar conventions.

**Copy/UX examples:**
- Migration page: "Already using npm? Your packages work on TPMJS. Import your package.json in one click."
- CLI compatibility: "tpmjs install works just like npm install. Same commands, AI superpowers added."
- Integration messaging: "TPMJS plugs into your existing IDE, your existing CI/CD, your existing workflow. Change nothing, gain everything."
- Import tool: "Paste your existing MCP server config. We'll migrate it to TPMJS in 30 seconds."
- Comparison page: "Everything you have now, plus AI-native tool discovery, quality scoring, and one-click MCP integration."

**Where to use it:** Migration/import pages, CLI documentation, integration guides, comparison landing pages, onboarding flow for users coming from other tools.

---

### 15. Framing Effect

**Principle:** The way information is presented changes how people evaluate it. The same fact framed differently triggers different emotional responses and decisions.

**Application to TPMJS:** Frame the registry size, performance, and features in the way that creates the strongest positive impression for each context.

**Copy/UX examples:**
- Scale framing: "1M+ AI-ready tools" (impressive scale) vs. "Every npm package, AI-ready" (comprehensive coverage). Use "1M+" on the homepage for impact; use "every npm package" in technical docs for precision.
- Speed framing: "Add AI tools in 30 seconds" (speed) vs. "No infrastructure setup required" (effort reduction). Use speed framing in CTAs; use effort framing in enterprise pitches.
- Cost framing: "$1.63/day" (trivial daily cost) vs. "$49/month" (monthly commitment). Use daily framing in upgrade prompts; use monthly framing on the pricing page.
- Risk framing: "Join 38,000 developers" (safe, proven) vs. "Be the first on your team to adopt AI tooling" (innovative, leading-edge). Use safety framing for risk-averse enterprise; use innovation framing for early adopters.
- Negative framing for competitors: "Teams without AI tooling spend 40% more time on integration" vs. "Teams with TPMJS save 40% on integration time." Losses land harder.

**Where to use it:** Homepage hero (scale framing), CTAs (speed framing), upgrade prompts (daily cost framing), enterprise pages (risk/safety framing), competitive content (negative framing).

---

### 16. Peak-End Rule

**Principle:** People judge an experience based on its most intense moment (the peak) and its final moment (the end). Everything in between fades. Design for a spectacular first success and a satisfying conclusion to every session.

**Application to TPMJS:** The first successful tool execution is the peak. It must feel magical. The end of every session should surface what the developer accomplished and what they can do next.

**Copy/UX examples:**
- First tool execution: Full-screen success animation. "Your first AI tool is live. You just connected [tool-name] to Claude in 47 seconds." Confetti is optional but the dopamine hit is mandatory.
- Execution result: Show the actual output prominently. Do not bury results in logs. The developer should see their tool working immediately and clearly.
- Session end: "Today you configured 2 tools and ran 14 executions. Your agent handled 3 code reviews autonomously." Dashboard summary on every return visit.
- Onboarding completion: "Your AI toolkit is ready. Here's what you built today:" followed by a visual summary of configured tools.
- Error recovery: When something fails, the recovery moment becomes the new peak. "That tool had an issue, but we auto-recovered and here's your result." Make failure recovery feel competent.

**Where to use it:** First tool execution screen, execution results display, dashboard session summaries, onboarding completion screen, error recovery flows.

---

### 17. Zeigarnik Effect

**Principle:** People remember incomplete tasks better than completed ones. An unfinished checklist creates persistent mental tension that drives return visits and task completion.

**Application to TPMJS:** Strategically leave tasks incomplete. Show progress toward goals that are close but not finished. The developer should always have one more thing to do.

**Copy/UX examples:**
- Dashboard: "Your toolkit is 80% optimized. Add error handling tools to reach 100%." Always show one more step.
- Profile completion: "Your developer profile is missing 2 fields. Complete profiles get 3x more tool recommendations."
- Collection progress: "Code Generation collection: 5 of 7 tools added. Add [tool-x] and [tool-y] to complete it."
- Email subject lines: "You left 2 tools unconfigured" or "Your agent is almost ready -- one step remaining."
- Tool discovery: "You've explored 3 of 5 categories. Developers who explore all 5 find 40% more useful tools."
- Notification badge: Persistent badge on the dashboard icon showing incomplete setup items.

**Where to use it:** Dashboard widgets, profile completion prompts, collection tracking, re-engagement emails, notification badges, tool discovery progress.

---

### 18. Pratfall Effect

**Principle:** A competent entity that shows a minor flaw becomes more likeable and trustworthy. Perfection feels robotic; vulnerability feels human. Developers especially distrust marketing that oversells.

**Application to TPMJS:** Be honest about limitations and in-progress features. Publicly acknowledge what is not yet built. This transparency builds more trust than polished messaging ever could.

**Copy/UX examples:**
- Status page: "TPMJS is in active development. Here's what works great, what's good enough, and what we're still building." Three-column layout with honest assessments.
- Changelog: "We broke search indexing for 2 hours on Tuesday. Here's what happened and how we fixed it." Incident transparency.
- Feature pages: "Private registries are in beta. They work for teams under 50. We're scaling to enterprise this quarter."
- About page: "We started TPMJS because existing tool registries were frustrating. We haven't solved everything yet, but here's our roadmap."
- Social media: Regular "building in public" updates. "This week we shipped X. We tried Y and it didn't work. Next week we're tackling Z."
- Tool quality: "Quality scores are algorithmic estimates, not guarantees. Here's exactly how we calculate them."

**Where to use it:** Status/roadmap page, changelog, feature descriptions with maturity indicators, about page, social media content, documentation caveats.

---

### 19. Hyperbolic Discounting

**Principle:** People massively overvalue immediate rewards relative to future ones. A small benefit right now beats a large benefit next month. Developers who see value in 30 seconds convert; developers who are promised value "after setup" bounce.

**Application to TPMJS:** Compress time-to-first-value to under 60 seconds. Every page should offer an immediate, tangible action with an immediate, visible result.

**Copy/UX examples:**
- Homepage CTA: "Try it now -- see results in 30 seconds" with a live sandbox that requires zero signup.
- Interactive demo: Embedded terminal on the homepage. Type a command, see a real tool execute, get real output. No account required.
- One-click install: "npx tpmjs init" -- single command from zero to working AI toolkit.
- Tool preview: Every tool detail page has a "Try it" button that executes the tool with sample input and shows real output instantly.
- Onboarding: Skip the tutorial. Drop the developer into a working environment with one pre-configured tool already running. Teach through doing, not reading.
- Landing page for organic search: "You searched for [AI code review tool]. Here's one running right now:" followed by a live demo.

**Where to use it:** Homepage interactive demo, tool detail "Try it" buttons, CLI first-run experience, landing pages for search traffic, onboarding instant-start flow.

---

### 20. Default Effect

**Principle:** People overwhelmingly stick with pre-selected options. Defaults are not suggestions -- they are decisions made on behalf of the user. Good defaults dramatically increase adoption of recommended paths.

**Application to TPMJS:** Pre-select the best tools, the recommended configuration, and the optimal settings. Let developers override, but make the default path the best path.

**Copy/UX examples:**
- Onboarding: Pre-select the "Recommended" tool collection based on the developer's stated use case. "We've selected 5 tools for React + TypeScript development. Adjust or continue."
- Tool configuration: Pre-fill all settings with sensible defaults. "These settings work for 90% of projects. Customize if needed."
- Agent builder: Default agent template pre-loaded with the most popular tool combination for the selected category.
- Pricing page: Visually highlight the recommended tier with "Most Popular" badge and a slightly larger card.
- Notification preferences: Default to weekly digest (high engagement, low annoyance) rather than all notifications or none.
- Search: Default sort by quality score (curated) rather than alphabetical or newest (uncurated).

**Where to use it:** Onboarding tool selection, tool configuration forms, agent builder templates, pricing page tier highlighting, notification settings, search and browse default sort order.

---

## Pricing Psychology

### Charm Pricing vs. Round Pricing

For developer tools, round pricing signals confidence and premium positioning. Charm pricing ($9.99) feels like consumer retail; round pricing ($10, $49, $149) feels like professional infrastructure.

**Recommendation:** Use round numbers for all tiers.
- Free: $0
- Pro: $19/month
- Team: $49/month per seat
- Enterprise: Custom pricing (contact sales)

Round pricing communicates "we're a serious tool, not a gimmick." Developers associate $X.99 pricing with consumer products and marketing tricks.

### Good-Better-Best Tier Structure

The three-tier structure leverages compromise effect (people pick the middle option) and creates clear upgrade paths.

| | Free | Pro ($19/mo) | Team ($49/mo/seat) |
|---|---|---|---|
| Tool discovery | Unlimited | Unlimited | Unlimited |
| Tool executions | 1,000/month | Unlimited | Unlimited |
| Private registry | -- | 1 registry | Unlimited |
| Team members | 1 | 1 | Unlimited |
| Analytics | Basic | Advanced | Advanced + Team |
| Support | Community | Email (48h) | Priority (4h) |
| Custom agents | 3 | Unlimited | Unlimited |
| Quality score API | -- | Included | Included |

**Key design choices:**
- Free tier is genuinely useful (not crippled). Developers build real projects on it.
- Pro is the target tier for individual developers. Everything a solo developer needs.
- Team is priced per seat to scale revenue with organization size.
- Enterprise is unlisted price to enable value-based negotiation.

### Price Anchoring Strategy

Present the cost comparison before showing TPMJS pricing.

**Page layout:**
1. First section: "The cost of building AI tool infrastructure internally" -- show $180,000/year estimate.
2. Second section: "Or use TPMJS" -- show $19/month.
3. The $180K anchor makes $19/month feel like a rounding error.

**Alternative anchors for different audiences:**
- Individual developers: "A single AI API call costs $0.01. TPMJS Pro costs less than 2,000 API calls/month -- and saves you thousands."
- Team leads: "One engineer-hour costs $75-150. TPMJS Team costs less than one hour of engineering time per month."
- Enterprise: "Your team spent 400 hours this quarter on AI tool integration. That's $60,000 in engineering time. TPMJS Enterprise eliminates that."

### Mental Accounting Framing

Reframe the monthly cost in terms developers already accept.

**Copy examples:**
- "$0.63/day -- less than your daily coffee" (for Pro at $19/month)
- "$1.63/day per developer -- less than one Slack message worth of productivity" (for Team at $49/month)
- "The cost of 12 minutes of engineering time per month" (at $150/hour rate)
- "Less than one failed deployment costs your team in lost time"

Use daily framing in upgrade prompts (makes cost feel trivial). Use monthly framing on the pricing page (industry standard, sets expectations).

### Rule of 100 for Discounts

For prices under $100, use percentage discounts (they look larger). For prices over $100, use absolute dollar discounts.

**Application:**
- Pro annual billing: "Save 20%" (not "Save $45.60") -- $19/month becomes $15.20/month billed annually.
- Team annual billing: "Save 20%" (not "Save $117.60/seat") -- percentage still looks larger at $49/seat.
- Enterprise annual: "Save $12,000/year" (not "Save 15%") -- for an $80K/year contract, the dollar amount is more impressive.

**Annual billing CTA:** "Pay annually and save 20%. That's 2.4 months free." Framing the discount as "free months" is more tangible than a percentage for subscription products.

---

## Onboarding Psychology

### BJ Fogg Behavior Model: B = MAP

Behavior happens when Motivation, Ability, and a Prompt converge at the same moment.

**Motivation (why should I do this?):**
- Show the outcome before asking for the action. "Here's what your AI toolkit looks like when configured:" followed by a screenshot of a working dashboard with real data.
- Use social proof: "Join 38,000 developers who set up their toolkit this month."
- Loss aversion: "Every day without AI tooling is a day your competitors are shipping faster."

**Ability (can I actually do this?):**
- Reduce every step to one action: one click, one paste, one command.
- Pre-fill everything possible. If we know their GitHub profile, pre-populate their username, avatar, and language preferences.
- Show time estimates: "This step takes about 45 seconds."
- Eliminate account creation as a barrier. Let developers use tools before signing up.

**Prompt (what triggers me to act right now?):**
- Homepage: "npx tpmjs init" -- the prompt is a single terminal command.
- Email: "Your workspace is ready. Click here to add your first tool." (not "Click here to continue setup.")
- Dashboard: Persistent but non-intrusive checklist widget. "Next step: Add your first tool (1 min)."
- CLI: After any successful command, suggest the next action. "Tool installed. Run `tpmjs agent create` to build your first agent."

### Activation Energy Reduction

Every friction point in onboarding is a dropout point. Map and eliminate them systematically.

| Friction Point | Current State | Reduced State |
|---|---|---|
| Account creation | Email + password form | GitHub OAuth one-click |
| First tool discovery | Browse full registry | Pre-curated "Start here" collection |
| First tool install | Read docs, configure manually | One-click install with defaults |
| First execution | Write integration code | "Try it" button with sample input |
| First agent creation | Build from scratch | Clone a popular template |
| Team setup | Manual invitations | Auto-detect GitHub org members |

**Key principle:** If a step requires more than 10 seconds of thought, it needs to be simplified or eliminated.

**Specific implementations:**
- Replace "Choose your tools" with "We chose these tools for you. Adjust if needed."
- Replace "Configure your agent" with "This agent is pre-configured. Run it now, customize later."
- Replace "Read the documentation" with an interactive tutorial that executes real commands.
- Replace "Create an account" with "Start using tools. We'll save your progress when you sign up."

### Goal-Gradient for Setup Completion

Apply the goal-gradient effect specifically to the onboarding sequence.

**Onboarding progress bar design:**
1. Start at 40% complete (account creation and initial browse count as progress).
2. Show 5 remaining steps, each worth 12% of the bar.
3. Time estimates on each step: "(~1 min)", "(~2 min)", "(~30 sec)".
4. Visual acceleration: As the bar fills, celebrate each step with micro-animations.
5. Final step has a distinct visual treatment -- gold/highlighted -- signaling imminent completion.

**Step sequence (designed to front-load easy wins):**
1. Choose your stack (30 sec) -- dropdown selection, instant feedback.
2. Install the CLI (1 min) -- single copy-paste command.
3. Add your first tool (1 min) -- one-click from recommended list.
4. Run your first execution (30 sec) -- pre-filled sample input.
5. Customize your workspace name and avatar (30 sec) -- feels personal, not functional.

**Post-completion:** "Setup complete. You now have a working AI toolkit." Followed immediately by a suggested next action (not a dead-end congratulations screen).

### Commitment Escalation Path

Design a deliberate escalation from zero commitment to deep investment.

**Commitment ladder:**

| Stage | Action | Commitment Level | Time Investment |
|---|---|---|---|
| 1. Curious | Visit homepage, browse tools | Zero | 0 minutes |
| 2. Engaged | Try a tool in the sandbox | Minimal | 2 minutes |
| 3. Invested | Create account, install CLI | Low | 5 minutes |
| 4. Active | Configure 3+ tools, create first agent | Medium | 30 minutes |
| 5. Committed | Invite team members, set up private registry | High | 1 hour |
| 6. Locked in | Production deployment, custom integrations | Very high | Days |

**Escalation triggers between stages:**
- Curious to Engaged: Interactive demo on homepage (no signup required).
- Engaged to Invested: "Save your progress" prompt after sandbox usage.
- Invested to Active: Onboarding checklist with goal-gradient.
- Active to Committed: "Your tools are working. Invite your team to share this setup."
- Committed to Locked in: "Deploy to production" guide with CI/CD integration.

Each transition should feel natural and low-effort. Never jump stages -- a developer on step 2 should never see a prompt for step 5.

---

## Retention Psychology

### Switching Costs

The most effective retention mechanism is making the cost of leaving higher than the cost of staying. For developer tools, switching costs must be technical (hard to migrate) and social (team adoption).

**Technical switching costs:**
- Custom agent configurations that only work on TPMJS.
- Execution history and analytics data that cannot be exported in a usable format.
- Quality score algorithms that developers learn to rely on for tool selection.
- MCP protocol optimizations specific to the TPMJS runtime.
- Private registry configurations with team-specific tool versions.

**Social switching costs:**
- Team members trained on TPMJS workflows.
- Shared collections and team-wide tool standards.
- Integration with team CI/CD pipelines.
- Community reputation (tool author profiles, contribution history).

**Copy for retention moments:**
- Cancellation flow: "Your team has 47 configured tools, 12 custom agents, and 6 months of execution analytics. This data cannot be transferred to another platform."
- Downgrade flow: "Downgrading will remove access to your 3 private registries. Your team's 8 members will lose shared workspace access."
- Comparison page: "Migrating your TPMJS workspace to [competitor] requires manually reconfiguring each tool and agent. Estimated time: 40+ hours."

### Endowment Effect (Retention Application)

Beyond onboarding, continuously deepen the developer's sense of ownership.

**Strategies:**
- Personalized dashboard: "Your AI toolkit" with custom layout, pinned tools, and personal analytics.
- Yearly recap: "Your 2026 in review: You executed 14,230 tool runs, configured 23 tools, and your agents saved your team an estimated 120 hours." Make the developer feel the weight of what they have built.
- Custom domain: Allow teams to brand their TPMJS workspace (e.g., tools.yourcompany.com). A branded workspace feels owned.
- Contribution recognition: "You've contributed 3 tools to the community. 1,240 developers use your tools." The developer is now a stakeholder, not just a user.

**Copy examples:**
- Monthly email: "Your toolkit performance this month: 98.7% uptime, 4,200 executions, 0 errors. You've built something reliable."
- Dashboard greeting: "Welcome back, [name]. Your 12 tools are running smoothly."

### Network Effects

Each new user and tool makes the platform more valuable for everyone. Design features that create and amplify network effects.

**Direct network effects:**
- Team workspaces: The more team members on TPMJS, the more valuable shared tools become.
- Community tools: Each published tool increases the registry's value for all users.
- Quality scores: More usage data improves quality score accuracy, which improves discovery for everyone.

**Indirect network effects:**
- Tool authors attract users. Users attract tool authors. The marketplace flywheel.
- Integration partners (Claude, GPT, Cursor) build deeper integrations as adoption grows.
- Content creators write tutorials and guides as the community grows, attracting more developers.

**Copy that reinforces network effects:**
- "1,247,000+ tools and growing. Every day, developers add new AI tools to the registry."
- "Your quality score is calculated from 12M+ monthly executions across the community."
- "The more your team uses TPMJS, the smarter your recommendations get."

### Habit Formation (Hook Model)

Design a habit loop that brings developers back to TPMJS daily.

**Trigger (external):**
- Daily digest email: "3 new tools in your categories. 2 tools you use released updates."
- IDE notification: "TPMJS: New tool recommendation based on your current project."
- CLI prompt: After a git push, suggest: "Run `tpmjs check` to verify your AI tools are up to date."
- Slack/Discord integration: "#tpmjs-updates: 2 tools updated, 1 new tool matching your stack."

**Trigger (internal):**
- When a developer thinks "I need an AI tool for X," the automatic thought should be "check TPMJS."
- When a developer starts a new project, the instinct should be "run `tpmjs init`."
- When evaluating tools, the reflex should be "check the quality score on TPMJS."

**Action (simple behavior):**
- Browse the "What's New" feed (2 minutes).
- Check tool execution analytics (30 seconds).
- Try a recommended tool (1 minute with one-click install).

**Variable reward:**
- New tool discoveries: "Today's recommendation: [tool] -- used by 400 developers in your category."
- Performance insights: "Your agent's response time improved 12% this week."
- Community recognition: "Your tool [name] reached 500 installs."
- Serendipitous discovery: Random "Tool of the Day" surfacing unexpected but useful tools.

**Investment (increase future value):**
- Save a tool to a collection (makes future browsing more relevant).
- Rate or review a tool (improves recommendations).
- Configure a new agent (deepens workspace value).
- Publish a tool (creates reputation and community ties).

**Cadence targets:**
- Daily: Check dashboard or receive a notification (passive engagement).
- Weekly: Discover and try at least one new tool (active exploration).
- Monthly: Configure a new agent or update existing tools (deepening investment).
- Quarterly: Evaluate and adopt a new collection or category (expansion).

---

## Implementation Priority

For maximum impact with minimum effort, implement in this order:

**Phase 1 -- Immediate (Week 1-2):**
1. Social proof numbers on homepage (tool count, user count, execution count).
2. Authority logos bar (Claude, GPT, Cursor, Windsurf).
3. Default pre-selected tools in onboarding.
4. "Try it now" interactive sandbox on homepage.
5. Framing: "1M+ AI-ready tools" as primary headline.

**Phase 2 -- Short-term (Week 3-6):**
6. Onboarding progress bar with goal-gradient design.
7. Curated collections to counter paradox of choice.
8. Loss aversion messaging in competitive content.
9. Commitment ladder (micro-steps from browse to install to configure).
10. Peak-end experience for first tool execution.

**Phase 3 -- Medium-term (Month 2-3):**
11. Pricing page with anchoring against internal build costs.
12. Zeigarnik effect dashboard widgets (incomplete tasks).
13. Reciprocity content strategy (free guides, open SDK).
14. Scarcity for featured spots and early adopter programs.
15. Status-quo bias import tools (migrate existing configs).

**Phase 4 -- Long-term (Quarter 2+):**
16. Habit loop infrastructure (notifications, triggers, variable rewards).
17. Network effect amplification features (community, sharing, reputation).
18. Full retention system (switching costs, endowment deepening).
19. Pratfall content strategy (building in public, honest limitations).
20. Mere exposure brand consistency across all channels.

---

## Measurement Framework

Track these metrics to measure psychological principle effectiveness:

| Principle | Primary Metric | Target |
|---|---|---|
| Social proof | Homepage-to-signup conversion rate | +15% |
| Authority bias | Trust score in user surveys | 8/10+ |
| Zero-price effect | Free tier activation rate | 60%+ |
| Endowment effect | 30-day retention rate | 40%+ |
| IKEA effect | Agent builder completion rate | 70%+ |
| Anchoring | Pricing page conversion rate | +20% |
| Loss aversion | Win-back email click rate | 12%+ |
| Commitment & consistency | Onboarding step completion rate | 80%+ per step |
| Reciprocity | Content-to-signup attribution | 25%+ |
| Scarcity | Featured spot application rate | 50%+ of eligible |
| Goal-gradient | Onboarding completion rate | 75%+ |
| Paradox of choice | Time-to-first-install | Under 3 minutes |
| Default effect | Default tool acceptance rate | 70%+ |
| Peak-end rule | Post-first-execution NPS | 50+ |
| Zeigarnik effect | Return visit rate within 48h | 45%+ |
| Hyperbolic discounting | Sandbox-to-signup conversion | 30%+ |
