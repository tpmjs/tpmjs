# MCP vs CLI vs REST — Talking Points & Research

Raw material for blog posts, tweets, talks. Everything sourced.

---

## THE HARD NUMBERS

### Token cost (Scalekit benchmark, 75 runs, Claude Sonnet 4)

| Task | CLI tokens | MCP tokens | Multiple |
|------|-----------|------------|----------|
| Repo language & license | 1,365 | 44,026 | **32x** |
| PR details & review status | 1,648 | 32,279 | **20x** |
| Repo metadata & install | 9,386 | 82,835 | **9x** |
| Merged PRs by contributor | 5,010 | 33,712 | **7x** |
| Latest release & dependencies | 8,750 | 37,402 | **4x** |

Source: https://www.scalekit.com/blog/mcp-vs-cli-use

- CLI: 100% reliability (25/25 runs)
- MCP: 72% reliability (18/25 runs) — all failures were TCP timeouts
- Cost at 10K ops/month: CLI $3.20, MCP $55.20 (17x)
- Root cause: 43 tool definitions injected into every conversation, agent uses 1-2

### More token data

- Jannik Reinhard: MCP ~145K tokens vs CLI ~4.1K for same task (**35x**). Token Efficiency Score: CLI 202 vs MCP 152.
  Source: https://jannikreinhard.com/2026/02/22/why-cli-tools-are-beating-mcp-for-ai-agents/

- CodeRabbit: Tool metadata takes **40-50% of available context window**. One example: 75K tokens consumed before any work begins (37.5% of 200K window).
  Source: https://www.coderabbit.ai/blog/handling-ballooning-context-in-the-mcp-era-context-engineering-on-steroids

- Standard MCP init: ~55K tokens ($0.16/session, **$1,600/day at 10K sessions**)
  Source: https://manveerc.substack.com/p/mcp-vs-cli-ai-agents

### Token bloat solutions (these are closing the gap)

| Solution | Reduction | Source |
|----------|-----------|--------|
| Anthropic code execution pattern | 150K → 2K (98.7%) | https://www.anthropic.com/engineering/code-execution-with-mcp |
| Speakeasy dynamic toolsets | 96.7% input tokens | https://www.speakeasy.com/blog/how-we-reduced-token-usage-by-100x-dynamic-toolsets-v2 |
| Phil Schmid MCP CLI | 47K → 400 (99%) | https://www.philschmid.de/mcp-cli |
| Claude Code tool search | 51K → 8.5K (46.9%) | Claude Code release |
| DomAIn Labs Skills-first | 60-80% typical | https://www.domainlabs.dev/blog/agent-guides/mcp-bloated-workflows-skills-architecture |
| Scalekit MCP gateway + schema filtering | $55 → $5/month | https://www.scalekit.com/blog/mcp-vs-cli-use |

---

## PRO-CLI ARGUMENTS

### Eric Holmes — "MCP is dead. Long live the CLI"
Top of HN, 400+ points, ~300 comments.
Source: https://ejholmes.github.io/2026/02/28/mcp-is-dead-long-live-the-cli.html

- LLMs trained on millions of man pages, SO answers, shell scripts — CLI is the native interface
- CLIs compose naturally through piping (`terraform show -json plan.out | jq`)
- Existing auth (aws profiles, gh auth login, kubeconfig) works identically for humans and agents
- MCP initialization is flaky — "lost count of restarts because an MCP server didn't come up"
- MCP permission model is all-or-nothing vs CLI's granular scoping
- MCP is "unnecessarily opinionated about auth"

### Training data asymmetry (Manveer C.)
- LLMs trained on billions of Unix pipe examples
- Zero examples of MCP composition patterns in training data
- "Protocol is plumbing. Interface design is architecture."
Source: https://manveerc.substack.com/p/mcp-vs-cli-ai-agents

### CLI reliability edge cases (Mathew Pregasen, counterpoint)
- Models struggle with non-ASCII strings and unconventional CLI args
- Sonnet/Opus have trouble transmitting newline chars through shell arguments
- CLI has difficult state maintenance across multi-step commands
Source: https://dev.to/mathewpregasen/mcp-vs-cli-tools-which-is-best-for-production-applications-bd8

---

## PRO-MCP ARGUMENTS

### Security (the killer argument)

**CLI tokens can't identify agents:**
- Token looks like `{"aud": "api.google.com", "sub": "user-id", "client_id": "CLI_CLIENT_ID"}`
- CLI client ID is public — anyone can extract and impersonate it
- API never knows which agent is calling — can't apply policy per agent
- No delegation chain tracking for agent → agent → agent calls
- Need DeviceCheck (macOS) or equivalent to verify CLI identity — complicates "just a CLI"

**If you make your REST API secure for agents, you reinvent MCP:**
1. Dynamic client registration (agents register themselves, users consent without dev portal)
2. OAuth consent, not API keys (prevent Employee A reading Employee B's email)
3. Sensitive action approval (human-in-the-loop for destructive actions)
4. Good agent experience (dedicated agent-facing API, semantic grouping)

### Observability / Logging

- MCP: JSON-RPC 2.0 with mandatory request IDs, structured payloads, machine-readable
- CLI: unstructured stdout, no correlation IDs, interleaved output, regex parsing
- MCP gateway pattern: uniform audit logging, correlation IDs, SIEM integration
- Compliance: MCP audit trails out of the box. CLI = pile of text files to parse
- Datadog LLM Observability already supports MCP clients natively
  Source: https://www.datadoghq.com/blog/mcp-client-monitoring/

### MCP strengths (Matthew Hall — "MCP Isn't Dead. We're Just Early.")
Source: https://matthewhall.com/posts/mcp-isnt-dead-were-just-early/

- CLI output is inconsistent, poorly documented, changes between versions without warning
- CLIs don't address multi-agent workflows or token revocation
- HTTP + OAuth MCP servers (Linear, Granola already shipping) eliminate local process management
- Bidirectional streaming enables long-running tasks impossible via CLI
- Historical analogy: current messiness mirrors REST standardization circa 1999

### MCP vs REST (GitHub Discussion #1093)
Source: https://github.com/modelcontextprotocol/modelcontextprotocol/discussions/1093

- REST is HTTP-only; MCP supports stdio, SSE, other transports
- Dumping entire OpenAPI specs wastes tokens; MCP can describe focused tools
- MCP enables bidirectional, server-initiated communication (REST requires polling)
- MCP provides first-class stateful operations (login, transactions with rollback)
- MCP restricts model to "controlled subset of capabilities" vs unrestricted terminal access

---

## MCP SECURITY PROBLEMS (the counterpoint)

### Simon Willison
Source: https://simonwillison.net/2025/Apr/9/mcp-prompt-injection/

- Tool shadowing: tools mutate definitions post-install, redirect API keys to attackers
- Tool poisoning: hidden prompt instructions in tool descriptions
- WhatsApp MCP: redefined descriptions to steal message histories, whitespace obfuscation
- "No convincing mitigations for prompt injection despite knowing about it for 2.5 years"

### AuthZed — Timeline of Real MCP Breaches
Source: https://authzed.com/blog/timeline-mcp-breaches

- April 2025: WhatsApp chat histories exfiltrated via tool poisoning
- May 2025: GitHub private repo contents leaked to public PRs
- June 2025: Asana cross-tenant access; Anthropic MCP Inspector unauthenticated RCE
- July 2025: CVE in mcp-remote affecting 437K+ downloads (command injection)
- August 2025: Filesystem MCP sandbox escape via symlinks
- September 2025: Malicious Postmark MCP BCC'ing all emails to attacker
- October 2025: Smithery path traversal compromising Docker creds and Fly.io token (3K+ apps)

Five patterns: (1) localhost tools = exposed remote APIs, (2) over-privileged tokens cascade, (3) tool description manipulation is supply-chain vector, (4) centralized registries concentrate risk, (5) natural language alone triggers data exfiltration

### Palo Alto Unit 42
Source: https://unit42.paloaltonetworks.com/model-context-protocol-attack-vectors/

- Resource theft via hidden instructions (code summarizer secretly generating fiction)
- Conversation hijacking persisting across turns
- Covert tool invocation creating files without user consent

### Shrivu Shankar — "Everything Wrong with MCP"
Source: https://blog.sshh.io/p/everything-wrong-with-mcp

- MCP initially shipped without auth spec
- Local stdio creates "low-friction path for exploitation"
- MCP tools can force agents to include backdoors in code
- "Fourth-party attacks" via malicious database entries triggering RCE
- Tau-Bench: Claude 3.7 Sonnet only **16% task completion** on airline booking
- LLM reliability **negatively correlates** with instructional context — more tools = worse performance
- Different LLMs respond inconsistently to same tool descriptions (XML vs markdown)

### Merge.dev — 6 Challenges
Source: https://www.merge.dev/blog/mcp-challenges

1. Incomplete/ambiguous tool descriptions → wrong tool selection
2. Poor maintenance — servers launched for marketing get minimal support
3. Security vulnerabilities and credential theft via tool poisoning
4. Testing demands multiplied across each server
5. Limited enterprise search (no semantic search)
6. Excessive tools causing context window timeouts

---

## THE HYBRID / SYNTHESIS POSITION

### The emerging consensus (March 2026)

1. **Raw MCP with static tool loading is wasteful** — everyone agrees
2. **CLI wins for dev-facing terminal workflows** — training data advantage is real and measurable
3. **MCP wins for enterprise, multi-tenant, non-developer contexts** — OAuth, audit trails, consent
4. **Security is MCP's Achilles heel AND its biggest advantage** — the protocol provides security properties CLI can't match, but the ecosystem has been repeatedly breached
5. **Smart teams use hybrid** — CLI for dev, MCP for customer-facing, unified behind Skills/abstraction layer
6. **MCP's survival depends on context efficiency** — progressive discovery, dynamic toolsets closing the gap

### The Skills abstraction (Claude Code, Cowork, DomAIn Labs)
- Both Claude Code and Cowork unify CLI and MCP behind a "Skills" layer
- Agent calls a Skill regardless of underlying transport
- Full tool catalog never loads at initialization
- Intent detection + selective loading: ~200 tokens vs 1,500-4,500

### SmartScope's "category error"
Source: https://smartscope.blog/en/blog/mcp-agent-skills-analysis/
- MCP parallels HTTP (connectivity standard)
- Skills parallels a manual/procedural document
- Individual devs: CLI + Skills suffices
- Enterprises: MCP provides audit logging, permission management, centralized OAuth

---

## TPMJS POSITION

"Write the tool once. We serve it everywhere."

- CLI for dev speed (~50 tokens, native bash reasoning)
- MCP for security and editor integration (OAuth, audit trails, consent)
- REST for universality (any language, any framework)
- SDK for type safety (Zod schemas, Vercel AI SDK, LangChain)

The protocol is a transport detail. The hard problems are upstream: discovery, trust, quality, composition. These are registry problems, not protocol problems.

"The protocol is the envelope. The tool is the letter. But the envelope has a wax seal for a reason."

---

## QUOTABLE LINES

- "MCP vs CLI vs REST is the wrong argument"
- "They're all right — in their context"
- "The mistake is universalizing from one context to all contexts"
- "If you kill MCP, you don't care about security"
- "If you do all four of those things to your REST API, congratulations — you just reinvented MCP"
- "Tokens are cheap and getting cheaper. Audit trails are expensive to retrofit."
- "Protocol is plumbing. Interface design is architecture." (Manveer C.)
- "CLI output is inconsistent, poorly documented, and changes between versions without warning" (Matthew Hall)
- "No convincing mitigations for prompt injection despite knowing about it for 2.5 years" (Simon Willison)
- "LLM reliability negatively correlates with instructional context" (Shrivu Shankar)
- "The protocol is the envelope. The tool is the letter. Stop arguing about envelopes."

---

## ALL SOURCES

| Article | Author | Position | URL |
|---------|--------|----------|-----|
| MCP is dead. Long live the CLI | Eric Holmes | Pro-CLI | https://ejholmes.github.io/2026/02/28/mcp-is-dead-long-live-the-cli.html |
| Everything Wrong with MCP | Shrivu Shankar | Anti-MCP | https://blog.sshh.io/p/everything-wrong-with-mcp |
| MCP vs CLI: Benchmarking | Scalekit / Ravi Madabhushi | Data | https://www.scalekit.com/blog/mcp-vs-cli-use |
| MCP prompt injection problems | Simon Willison | Security | https://simonwillison.net/2025/Apr/9/mcp-prompt-injection/ |
| Timeline of MCP breaches | AuthZed | Security | https://authzed.com/blog/timeline-mcp-breaches |
| MCP sampling attack vectors | Palo Alto Unit 42 | Security | https://unit42.paloaltonetworks.com/model-context-protocol-attack-vectors/ |
| MCP Isn't Dead, We're Just Early | Matthew Hall | Pro-MCP | https://matthewhall.com/posts/mcp-isnt-dead-were-just-early/ |
| MCP vs CLI for AI Agents | Manveer C. | Synthesis | https://manveerc.substack.com/p/mcp-vs-cli-ai-agents |
| Why CLI Tools Are Beating MCP | Jannik Reinhard | Pro-CLI | https://jannikreinhard.com/2026/02/22/why-cli-tools-are-beating-mcp-for-ai-agents/ |
| MCP vs CLI for Production | Mathew Pregasen | Pro-MCP | https://dev.to/mathewpregasen/mcp-vs-cli-tools-which-is-best-for-production-applications-bd8 |
| Code Execution with MCP | Anthropic Engineering | Solution | https://www.anthropic.com/engineering/code-execution-with-mcp |
| Reducing Token Usage by 100x | Speakeasy | Solution | https://www.speakeasy.com/blog/how-we-reduced-token-usage-by-100x-dynamic-toolsets-v2 |
| MCP CLI dynamic discovery | Phil Schmid | Solution | https://www.philschmid.de/mcp-cli |
| Ballooning Context in MCP Era | CodeRabbit | Analysis | https://www.coderabbit.ai/blog/handling-ballooning-context-in-the-mcp-era-context-engineering-on-steroids |
| 6 Challenges of Using MCP | Merge.dev | Critique | https://www.merge.dev/blog/mcp-challenges |
| MCP vs Agent Skills | SmartScope | Synthesis | https://smartscope.blog/en/blog/mcp-agent-skills-analysis/ |
| Skills vs MCP Tools | LlamaIndex | Synthesis | https://www.llamaindex.ai/blog/skills-vs-mcp-tools-for-agents-when-to-use-what |
| Skills-First Architecture | DomAIn Labs | Solution | https://www.domainlabs.dev/blog/agent-guides/mcp-bloated-workflows-skills-architecture |
| A2A and MCP Protocol Wars | Koyeb | Analysis | https://www.koyeb.com/blog/a2a-and-mcp-start-of-the-ai-agent-protocol-wars |
| MCP vs REST GitHub Discussion | MCP Community | Discussion | https://github.com/modelcontextprotocol/modelcontextprotocol/discussions/1093 |
| 10 Strategies to Reduce Token Bloat | The New Stack | Solution | https://thenewstack.io/how-to-reduce-mcp-token-bloat/ |
| Datadog MCP Monitoring | Datadog | Observability | https://www.datadoghq.com/blog/mcp-client-monitoring/ |
| How to Reduce MCP Token Bloat | The New Stack | Solution | https://thenewstack.io/how-to-reduce-mcp-token-bloat/ |
