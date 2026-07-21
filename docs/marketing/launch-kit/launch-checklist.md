# Launch checklist

Concrete steps to actually launch. **[founder]** = needs Thomas / an owner credential; **[team]** = doable by a maintainer/agent.

## Pre-launch — product must not embarrass us
- [x] **Homepage tells the truth** — real counts, no fabricated activity ticker (shipped 8a4dd141).
- [ ] **[team]** 5 surfaces visible on the tool detail page (CLI/MCP/REST/SDK/Skill switcher) — the differentiator must be obvious where a dev decides to use a tool. (tracked in #125)
- [ ] **[team]** Discovery pages SSR'd + indexable (`/tool/tool-search`, `/collections`) — currently client-only "Loading…", zero SEO. (#125)
- [ ] **[team]** Onboarding collapsed to the one 60-second flow (collection → `claude mcp add` → works).
- [ ] **[team]** Verify every command in this kit runs live the morning of launch (MCP add, REST execute, SDK).

## Distribution — where devs will find us
- [ ] **[team/founder]** Publish the updated packages to npm — READMEs are stale on npm, so `@tpmjs/compose` etc. still show bare pages. Ship via the changesets → version-PR → publish flow (release-audit gate). (in progress — release-audit + reconciliation WIP)
- [ ] **[founder]** DNS for `playground.tpmjs.com` + `tutorial.tpmjs.com` (Cloudflare; box has no CF token) — the docs link these and they're dead until DNS resolves.
- [ ] **[team]** Submit to directories: `punkpeye/awesome-mcp-servers`, `wong2/awesome-mcp-servers`, `e2b-dev/awesome-ai-agents`, the official MCP registry, and relevant "AI tools" lists. One PR each with the honest one-liner.
- [ ] **[team]** Per-tool + per-collection SEO: real `<title>`/meta with package + value context, JSON-LD on tool pages (already present — extend to collections).

## Marketing assets — ready to fire
- [ ] **[team]** Record the 60s demo (`demo-script.md`). Host it (YouTube unlisted + gif for socials).
- [ ] **[founder]** Show HN post (`launch-post.md`) — post Tue–Thu ~8–10am ET; be present to answer for the first few hours.
- [ ] **[founder]** Launch thread on X (`social.md`) + r/LocalLLaMA post, staggered a few hours after HN.
- [ ] **[team]** A one-page "for AI devs" landing variant if the generic homepage underperforms.

## Growth — make it worth returning to
- [ ] **[team]** Reignite tool discovery — the npm-changes sync runs but adds nothing (0 new tools in 30d); fix or seed high-demand tools (real search demand: resend, discord, email, python). (#124 area)
- [ ] **[team]** Seed 3–5 flagship public collections beyond the founder's (e.g. "web research", "devops", "data wrangling") so the registry doesn't look single-author.
- [ ] **[team]** Instrument the activation funnel honestly (land → search → tool view → first call) so we can see what converts. (#125 analytics)

## Timing
Don't launch until the tool page shows all 5 surfaces and the npm packages are refreshed — those are the two things a skeptical dev checks first. Everything else can ship in the days after.
