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

## COUNTER-ARGUMENTS & REBUTTALS

What people will say against the blog post, and the honest answers.

---

### 1. "MCP's security is paper security — almost nobody implements it"

**The attack:** The blog post claims MCP provides OAuth 2.1, agent identity, delegation chains, and consent flows. In reality:
- Only **8.5% of MCP servers use OAuth** (Astrix Security analysis of 5,200+ servers)
- **41% of servers in the official MCP registry require no auth at all** (Feb 2026 audit of 518 servers)
- Knostic scanned 1,862 exposed MCP servers — **every one of the 119 they tested responded without credentials**
- The `act` claim for delegation chains: **effectively 0% adoption** across all major clients (Claude Desktop, Cursor, VS Code, Windsurf)
- Only **3 of 78 authorization servers (<4%) support CIMD** (Client ID Metadata Documents) for client identity (Obsidian Security)
- Auth wasn't even in the original MCP spec (2024-11-05). It was bolted on 5 months later and has been revised 3 times since
- Christian Posta (Solo.io): "The MCP Authorization Spec Is... a Mess for Enterprise" — coupling authorization and resource servers, recommending OAuth features most auth servers don't implement
- Aaron Parecki (OAuth spec editor): had to write "Let's Fix OAuth in MCP" because the initial auth design was broken

Sources:
- https://astrix.security/learn/blog/state-of-mcp-server-security-2025/
- https://earezki.com/ai-news/2026-02-21-i-scanned-every-server-in-the-official-mcp-registry-heres-what-i-found/
- https://blog.christianposta.com/the-updated-mcp-oauth-spec-is-a-mess/
- https://aaronparecki.com/2025/04/03/15/oauth-for-model-context-protocol
- https://www.obsidiansecurity.com/blog/when-mcp-meets-oauth-common-pitfalls-leading-to-one-click-account-takeover
- https://venturebeat.com/security/mcp-shipped-without-authentication-clawdbot-shows-why-thats-a-problem
- https://securityboulevard.com/2026/03/mcp-servers-and-the-return-of-the-service-account-problem/

**The rebuttal:** This is the hardest counter-argument to answer, because the numbers are devastating. The honest response:

1. **The spec vs ecosystem distinction still holds, but barely.** MCP defines the *right* security properties. The ecosystem hasn't built them yet. That's a real problem, but it's a different problem than "these properties don't matter."
2. **The trajectory matters.** Auth went from nonexistent → broken → revised → improving (Nov 2025 added CIMD, Cross App Access). Identity providers (Cloudflare, Auth0, Stytch, Descope, WorkOS, Scalekit) are shipping MCP OAuth SDKs. Adoption will follow tooling.
3. **CLI has 0% of these properties by design.** MCP at 8.5% OAuth adoption is still infinitely more than CLI's 0%. The question isn't "is MCP security perfect?" — it's "which path leads to security at scale?" CLI has no path.
4. **First-party SaaS MCP servers will change the numbers.** When Linear, Notion, Salesforce ship their own MCP servers with their own OAuth, the "most MCP servers are insecure" stat changes overnight. The third-party wrapper era is transitional.

**Honest concession:** The blog post should acknowledge these numbers explicitly. Saying "MCP provides OAuth 2.1" without saying "but only 8.5% of servers actually use it" is misleading by omission.

---

### 2. "CLI can do structured output too — the logging argument is overstated"

**The attack:** The blog claims CLI output is "unstructured text" and MCP gives "structured logging for free." But:
- `gh pr list --json number,title,author` — GitHub CLI has first-class JSON
- `kubectl -o json`, `kubectl -o jsonpath='{...}'` — Kubernetes has full structured output
- `aws --output json` + `--query` JMESPath — AWS CLI outputs structured JSON, plus CloudTrail automatically logs every API call as structured JSON
- `terraform show -json` — Terraform has a stable JSON output spec
- `docker ps --format '{{json .}}'` — Docker supports Go template JSON
- Teams use `jq` pipelines for production log processing with 87% faster issue resolution
- API gateways (Kong, Envoy) provide structured logging, OpenTelemetry, audit trails that predate MCP by years
- AWS CloudTrail is the existence proof — structured audit logging of CLI commands at massive scale, predating MCP by a decade
- Red Hat: "robust, real-time monitoring and threat detection go beyond the protocol's structured logging" — MCP's logging alone isn't sufficient without external monitoring anyway
- Observability is an architecture concern, not a protocol concern — both CLI and MCP need external tooling (OpenTelemetry, log aggregators) for real observability

Sources:
- https://cli.github.com/manual/gh_help_formatting
- https://kubernetes.io/docs/reference/kubectl/jsonpath/
- https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-log-file-examples.html
- https://developer.hashicorp.com/terraform/internals/json-format
- https://docs.konghq.com/gateway/latest/kong-enterprise/audit-log/
- https://www.envoyproxy.io/docs/envoy/latest/configuration/observability/access_log/usage
- https://www.redhat.com/en/blog/model-context-protocol-mcp-understanding-security-risks-and-controls
- https://www.agentixlabs.com/blog/general/from-logs-to-run-reviews-agent-observability-for-production-agents/

**The rebuttal:**

1. **The blog post overstates the gap.** Modern CLI tools DO have structured output. The "unstructured stdout" framing is true for legacy tools but misleading for `gh`, `aws`, `kubectl`, etc.
2. **But "opt-in per tool" vs "built-in to protocol" is still a real distinction.** MCP gives you structured logging by default on every server. CLI gives you structured output IF the tool supports `--json` AND the agent knows to use it AND you've configured log aggregation. The default matters.
3. **The correlation ID argument holds.** Even with `--json`, CLI has no built-in request/response pairing across multi-step workflows. You can add `run_id` propagation, but that's custom infrastructure. MCP's mandatory request ID is free.
4. **CloudTrail proves the point both ways.** CloudTrail works because AWS built a structured logging layer ON TOP of CLI. You're not getting structured logs from the CLI itself — you're getting them from the server. MCP bakes this into the protocol so every server gets it, not just AWS.

**Honest concession:** The blog post should drop "CLI output is unstructured text" and instead say "CLI structured output is opt-in and inconsistent across tools, while MCP's is built into the protocol."

---

### 3. "REST + OAuth already provides everything MCP claims — you don't need a new protocol"

**The attack:**
- Standard OAuth 2.0 + OIDC already provides agent identity via JWT `azp` claims, mTLS, API gateway policies
- OIDC-A (OpenID Connect for Agents) extends OIDC with `delegator_sub`, `delegation_chain`, `delegation_purpose` claims — and it's **protocol-agnostic** (works with or without MCP)
- JWT + mTLS + OPA policies at API gateways provide agent identity, delegation, and audit without MCP
- MCP's own auth story IS OAuth 2.1 over HTTP — it didn't invent new auth, it adopted existing HTTP auth (late)
- Julien Simon: MCP "ignores 40 years of RPC best practices" and the spec revisions read like "patch notes of everything enterprises discovered was missing"
- Service meshes (Istio/Envoy) already provide mTLS identity between services
- Kong + Envoy gateways provide structured audit logging, rate limiting, auth — all the observability MCP claims

Sources:
- https://subramanya.ai/2025/04/28/oidc-a-proposal/
- https://arxiv.org/abs/2509.25974
- https://julsimon.medium.com/why-mcps-disregard-for-40-years-of-rpc-best-practices-will-burn-enterprises-8ef85ce5bc9b
- https://developers.redhat.com/articles/2025/12/12/advanced-authentication-authorization-mcp-gateway
- https://securityboulevard.com/2025/11/jwts-for-ai-agents-authenticating-non-human-identities/
- https://www.infoq.com/articles/building-ai-agent-gateway-mcp/

**The rebuttal:**

1. **The fact that OIDC-A had to be created proves standard OAuth ISN'T enough.** OIDC-A adds delegation chains, agent attestation, and capability-based access control — things standard OAuth doesn't have. If "REST + OAuth already does this," why did they need a new spec?
2. **But OIDC-A being protocol-agnostic weakens the "you need MCP" claim.** You can get agent identity without MCP. The blog's "if you add security to REST you reinvent MCP" is an overstatement — you reinvent the security properties, but you can do it without MCP's transport.
3. **MCP's real unique value isn't security — it's runtime discovery + statefulness.** The `tools/list` call, capability negotiation, and session state are what REST genuinely lacks. The security argument should be secondary.
4. **The 40-year RPC argument cuts both ways.** MCP is young and learning from mistakes. REST took years to standardize too. But MCP shipping without auth and revising 3 times in 18 months is concerning.

**Honest concession:** The blog should soften "you reinvented MCP" to "you reinvented MCP's security properties" — because you can get those properties through OIDC-A + API gateways without adopting MCP as a protocol. MCP's real unique value is discovery and session state, not auth.

---

### 4. "Dynamic MCP isn't really MCP anymore — you're gutting the protocol to save it"

**The attack:** Every token-bloat solution works by bypassing MCP's static tool discovery — the protocol's defining feature:
- Speakeasy wraps all tools behind 3 meta-tools (`list_tools`, `describe_tool`, `execute_tool`) — the client sees 3 tools, not the real surface
- Cloudflare Code Mode reduces the entire API to a single "write TypeScript" tool — the LLM never sees individual tool schemas. 81% savings but "MCP in name only"
- Glama code stubs treat MCP servers as "local SDKs" — 98.7% reduction by moving data by reference
- mcp2cli converts MCP servers INTO CLI tools, explicitly bypassing the protocol's tool-injection mechanism. 97.7% reduction
- Skills are absorbing knowledge use cases — "developers are ripping out MCP servers and replacing them with Markdown files" (DomAIn Labs)
- Simon Willison: "Claude Skills are awesome, maybe a bigger deal than MCP"
- Waleed Kadous (Canva): "MCP was a stop along the way, not the destination"
- **Lazy schema loading is NOT in the MCP spec.** Pagination and `notifications/tools/list_changed` exist, but deferred schemas are community workarounds (SEP-1888, SEP-1576), not ratified features
- What's left after stripping static tool discovery? A thin JSON-RPC wrapper. "JSON-RPC with some descriptors" (HN)

Sources:
- https://blog.cloudflare.com/code-mode/
- https://glama.ai/blog/2025-12-14-code-execution-with-mcp-architecting-agentic-efficiency
- https://waleedk.medium.com/the-evolution-of-ai-tool-use-mcp-went-sideways-8ef4b1268126
- https://simonwillison.net/2025/Oct/16/claude-skills/
- https://www.domainlabs.dev/blog/agent-guides/mcp-bloated-workflows-skills-architecture
- https://thenewstack.io/skills-vs-mcp-agent-architecture/
- https://github.com/modelcontextprotocol/modelcontextprotocol/issues/1888
- https://github.com/modelcontextprotocol/modelcontextprotocol/issues/1576
- https://wundergraph.com/blog/why-mcp-is-ceiling-enterprise-ai-agent-architecture

**The rebuttal:**

1. **MCP's value extends beyond tool discovery.** Even with lazy loading, MCP provides: transport standardization, capability negotiation, resource/prompt abstractions, `notifications/tools/list_changed`, session state, and (eventually) auth. Stripping static tool listing doesn't strip the protocol.
2. **This is normal protocol evolution, not gutting.** HTTP/1.0 had no persistent connections, no chunked encoding, no compression. HTTP/1.1 and HTTP/2 "gutted" the original. That didn't make them "not HTTP." Protocols mature.
3. **The spec is catching up.** SEP-1888 (progressive disclosure) and SEP-1576 (token bloat mitigation) are active proposals. Once ratified, lazy loading becomes a first-class feature, not a hack.
4. **97M+ monthly SDK downloads suggest the ecosystem disagrees** that MCP is being "hollowed out." Adoption is accelerating even as usage patterns evolve.

**Honest concession:** The blog's "token bloat is being solved" section should acknowledge that most solutions work AROUND the spec, not within it. And Cloudflare Code Mode is genuinely "MCP in name only" — the protocol is transport, not the interaction pattern.

---

### 5. "The 'implementation not architecture' defense is a cop-out"

**The attack:** The blog dismisses MCP's security problems as "implementation failures, not architectural ones." But:
- The "pit of success" vs "pit of failure" framework (Rico Mariani, Jeff Atwood): a well-designed system makes it easy to do the right thing and hard to do the wrong thing
- MCP makes insecure implementations easy and secure implementations hard — that's architecture, not implementation
- 43% of MCP servers have command injection flaws (Docker research)
- Tool shadowing (dynamically redefining tools after user approval) is a DESIGN-level issue, not an implementation bug
- Speakeasy: "perfect security is the enemy of adoption" — inadvertently admits the protocol deliberately omits security for adoption
- The PHP parallel: "PHP isn't insecure, developers are" was debunked — if the language/protocol makes insecure code the default, the design is responsible
- MCP shipped without auth, then bolted it on, then revised it 3 times. Each revision addressed things that should have been there from the start

Sources:
- https://blog.codinghorror.com/falling-into-the-pit-of-success/
- https://ricomariani.medium.com/the-pit-of-success-cfefc6cb64c8
- https://www.docker.com/blog/mcp-security-issues-threatening-ai-infrastructure/
- https://blog.sshh.io/p/everything-wrong-with-mcp
- https://www.speakeasy.com/mcp/mcp-for-skeptics/common-criticisms
- https://phpsecurity.readthedocs.io/en/latest/_articles/PHP-Security-Default-Vulnerabilities-Security-Omissions-And-Framing-Programmers.html

**The rebuttal:**

1. **This one is hard to argue against.** The pit of success framework is devastating for MCP. If 43% of servers have command injection and 41% have no auth, the protocol isn't leading developers toward security.
2. **But "move fast, fix later" has precedent.** HTTP launched without HTTPS. OAuth 1.0 was replaced by OAuth 2.0. TLS has had multiple broken versions. Security in protocols is almost always iterative. The question is whether MCP is iterating fast enough.
3. **The alternative isn't better.** CLI has no security framework at all — no pit of success OR failure, just an open field. At least MCP defines what "success" looks like, even if most servers haven't reached it.
4. **Anthropic donated MCP to the Linux Foundation's AAIF** (Dec 2025), with OpenAI, Google, Microsoft, AWS as members. Neutral governance may accelerate the security story.

**Honest concession:** The blog should drop "implementation failures, not architectural ones" and instead say something like "MCP defines the right security target but hasn't yet made it easy to hit. The protocol needs to become a pit of success — making insecure implementations harder to build than secure ones."

---

### 6. "Of course a registry says 'use everything' — this is self-serving"

**The attack:**
- TPMJS benefits from multi-protocol support because it justifies the registry's existence
- "It depends" is a thought-terminating cliche that avoids deeper analysis
- Tool sprawl is a documented problem — Writer found that asking LLMs to review all tools "lowers the probability it will select the best tool"
- The "use both" position dodges the real architectural tension — choosing a protocol has real consequences for system design
- Tobias Pfuetze: "The MCP vs. CLI Debate Is the Wrong Fight" — framing "use both" misses actual architectural tension
- Victor Dibia: "No, MCPs Have NOT Won (Yet)" — MCP documentation "heavily focuses on integration with Claude Desktop," revealing single-vendor origins

Sources:
- https://writer.com/engineering/rag-mcp/
- https://pravse.medium.com/the-mcp-mess-and-how-to-solve-it-7a479b31fa11
- https://medium.com/@tobias_pfuetze/the-mcp-vs-cli-debate-is-the-wrong-fight-a87f1b4c8006
- https://newsletter.victordibia.com/p/no-mcps-have-not-won-yet
- https://cefboud.com/posts/is-mcp-overhyped/

**The rebuttal:**

1. **Yes, it's self-serving. Own it.** TPMJS exists because we believe multi-protocol is the right architecture. That's a bet, not a neutral observation. The blog should be transparent about this.
2. **But the data supports multi-protocol.** CLI is 4-32x cheaper in terminals. MCP is the only option in GUI editors. REST is universal for backends. These aren't opinions — they're measurements. "It depends" is only a cop-out if you don't specify WHAT it depends on.
3. **The tool sprawl critique is about implementation, not protocol.** TPMJS uses 2 tools (registry-search, registry-execute) as a gateway to 5,000+ tools. That's the opposite of sprawl — it's consolidation through a registry.
4. **"Use everything" ≠ "use everything everywhere."** The blog explicitly says CLI for terminals, MCP for editors, REST for backends. That's opinionated, not wishy-washy.

**Honest concession:** The blog should explicitly acknowledge that TPMJS has a financial interest in multi-protocol. Readers should know the author's incentive structure.

---

### 7. "The protocol IS architecturally significant — not just a transport detail"

**The attack:** The blog's thesis — "the protocol is a transport detail" — is directly challenged:
- Lee Han Chung: "MCP is fundamentally action-oriented RPC while REST is resource-centric. Trying to force one paradigm onto the other leads to suboptimal outcomes." The protocol shapes domain modeling — that IS architecture.
- Tinybird: "APIs excel for programmatic CRUD; MCP is for multistep actions with state. Choosing wrong means restructuring your system."
- Eric Lippert: "Design choices at the protocol level cascade into every implementation built on top."
- MCP's statefulness (session context, thread-id) vs REST's statelessness isn't a transport choice — it fundamentally changes how you design multi-turn interactions

Sources:
- https://leehanchung.github.io/blogs/2025/05/17/mcp-is-not-rest-api/
- https://www.tinybird.co/blog/mcp-vs-apis-when-to-use-which-for-ai-agent-development
- https://ericlippert.com/2007/08/14/c-and-the-pit-of-despair/

**The rebuttal:**

1. **This is the strongest counter-argument in the entire list.** The protocol choice IS architecturally significant. MCP's session state, bidirectional communication, and capability negotiation are fundamentally different from REST's stateless request-response. Calling this "just a transport detail" undersells the difference.
2. **But the TPMJS model abstracts the architecture.** The tool author writes a Zod-schema'd function. TPMJS handles the protocol adaptation. From the tool author's perspective, the protocol genuinely IS a transport detail — the registry handles the architectural translation.
3. **The consumer still needs to choose.** And that choice has architectural consequences for THEIR system. The blog shouldn't pretend otherwise.

**Honest concession:** The blog should soften "the protocol is a transport detail" to "the protocol is a transport detail FOR THE TOOL AUTHOR — but it's an architectural choice for the consumer."

---

### 8. "Bidirectional communication is overrated — most MCP is request-response"

**The attack:**
- Dmitry Degtyarev: Server-to-client SSE is "overengineered" — a "simple protocol just for tool calling would have reduced confusion and accelerated adoption"
- The vast majority of MCP usage is request-response tool calling — most MCP servers are thin wrappers over REST APIs
- Even the Vercel AI SDK had bugs treating server pings as "unsupported message type" — bidirectional is undertested because it's rarely used
- MCP's own GitHub discussions acknowledge "there is not currently a great transport for stateful usage scenarios" (SEP-1288)

Sources:
- https://mitek99.medium.com/mcps-overengineered-transport-and-protocol-design-f2e70bbbca62
- https://github.com/modelcontextprotocol/modelcontextprotocol/issues/1288
- https://github.com/vercel/ai/issues/6282

**The rebuttal:**

1. **Fair point for today's use cases.** Most MCP tool calls ARE request-response. The bidirectional capability is forward-looking.
2. **But "not needed yet" ≠ "won't be needed."** Long-running tasks (CI pipelines, data processing, model training) will need progress updates. Agent-to-agent coordination will need server-initiated messages. Building the capability now prevents retrofit later.
3. **The cost of having it unused is low.** Bidirectional support in the protocol doesn't add meaningful overhead if you're not using it.

**Honest concession:** The blog shouldn't lean heavily on bidirectional communication as a current MCP advantage. It's speculative.

---

### 9. "Tokens will always matter more than security for most developers"

**The attack:**
- At 10K automated sessions/day: $1,600/day just for MCP tool definitions
- mcp2cli: 97.7% reduction by converting MCP to CLI
- Scalekit: 17x cost multiplier for MCP vs CLI
- Economics drives adoption — developers optimize for cost first, security second
- Organizations facing $50K+/month in token costs will choose CLI regardless of security arguments

Sources:
- https://topaiproduct.com/2026/03/09/mcp2cli-the-tool-that-cuts-mcp-token-costs-by-99-just-hit-hacker-news/
- https://www.scalekit.com/blog/mcp-vs-cli-use

**The rebuttal:**

1. **These numbers are for STATIC MCP.** Dynamic MCP (Speakeasy, Cloudflare Code Mode, lazy loading) brings costs to near-parity with CLI. Comparing static MCP costs to CLI costs is comparing the worst MCP to the best CLI.
2. **Token costs are dropping exponentially.** Claude Sonnet's price has dropped ~10x in 18 months. At some point, the 17x multiplier becomes the difference between $0.003 and $0.05 — not worth optimizing for.
3. **Security costs are rising.** The average data breach costs $4.88M (IBM 2024). A $50K/month token premium that prevents one breach pays for itself 8x over.
4. **The audience matters.** Individual developers optimizing hobby projects? Token cost wins. Enterprises with compliance requirements? Security wins. Both are valid — but the blog should be explicit about which audience it's addressing.

**Honest concession:** The blog should acknowledge that for many developers and small teams, the token cost argument is decisive. Security at scale is an enterprise concern. The blog should clarify it's primarily addressing teams building production systems with real users.

---

### 10. "The training data advantage for CLI is permanent and unfixable"

**The attack:**
- LLMs trained on billions of Unix pipe examples — `find . -name "*.py" | xargs grep "import"` appears thousands of times
- The composability grammar is embedded in model weights
- MCP composition has zero training data — models rely entirely on runtime schema injection
- MCP interactions are agent-to-server, not human-authored text on the internet — they won't naturally appear in web crawls
- Bootstrapping problem: MCP traces don't end up on Stack Overflow or blog posts the way CLI commands do
- This gap will narrow but never close — CLI patterns have decades of accumulated signal

Sources:
- https://manveerc.substack.com/p/mcp-vs-cli-ai-agents
- https://lalatenduswain.medium.com/cli-based-agents-vs-mcp-the-2026-showdown-that-every-ai-engineer-needs-to-understand-7dfbc9e3e1f9

**The rebuttal:**

1. **Cloudflare Code Mode is the synthesis.** Have LLMs write TypeScript code against MCP-backed APIs. Leverage the training data advantage (LLMs are excellent at code) while still using MCP as transport. Don't fight the training data — work with it.
2. **The bootstrapping problem is real but solvable.** Fine-tuning on MCP traces, synthetic data generation, and RLHF on tool-use tasks can close the gap for specific models. It won't appear organically in web crawls, but model providers can inject it.
3. **The advantage is durable but not permanent.** As MCP adoption grows (97M+ monthly SDK downloads, 340% growth in 2025), more traces will exist. The gap narrows over time, even if it never fully closes.
4. **For GUI editor contexts, there's no CLI training data either.** Cursor and Claude Desktop users don't interact via bash. The training data advantage only applies to terminal contexts — where we already agree CLI wins.

**Honest concession:** The blog should acknowledge that the training data advantage is real, durable, and one of CLI's strongest arguments. It's not just about current costs — it's about fundamental model capability.

---

### 11. "The REST-to-HTTP-standardization analogy is a stretch"

**The attack:**
- HTTP spread organically without trillion-dollar company promotion. MCP is being pushed by Anthropic — a single company
- Victor Dibia: MCP documentation "heavily focuses on integration with Claude Desktop" — single-vendor origins, not a neutral standard
- Moncef Abboud: MCP's hype involves "megaphones and orchestrated narratives" unlike HTTP's organic adoption
- HTTP solved a genuine interoperability crisis. MCP is being introduced into an ecosystem with working solutions (REST + OpenAPI)
- Lee Han Chung: Comparing MCP to REST standardization is "apples to oranges" — MCP is RPC, not resource-centric

Sources:
- https://cefboud.com/posts/is-mcp-overhyped/
- https://newsletter.victordibia.com/p/no-mcps-have-not-won-yet
- https://leehanchung.github.io/blogs/2025/05/17/mcp-is-not-rest-api/

**The rebuttal:**

1. **The analogy was always loose.** MCP and HTTP are different kinds of protocols solving different problems. The useful parallel is about messy early standardization, not about the protocols themselves.
2. **MCP is now under neutral governance.** Anthropic donated MCP to the Linux Foundation's AAIF (Dec 2025), with OpenAI, Google, Microsoft, AWS as members. The single-vendor critique is becoming outdated.
3. **But the Claude Desktop focus is still real.** Most MCP tooling and documentation is Anthropic-centric. True multi-vendor neutrality will take time.

**Honest concession:** Drop the REST-circa-1999 comparison. It invites more criticism than it's worth.

---

## SUMMARY: WHAT THE BLOG POST SHOULD CHANGE

Based on all counter-arguments, the honest adjustments:

1. **Acknowledge MCP's 8.5% OAuth adoption rate** when claiming MCP provides security. Say "MCP defines the right security target" not "MCP provides security."
2. **Drop "CLI output is unstructured text"** — modern CLI tools have first-class JSON. Say "CLI structured output is opt-in and inconsistent" instead.
3. **Soften "you reinvented MCP"** to "you reinvented MCP's security properties" — because OIDC-A achieves these without MCP.
4. **Soften "the protocol is a transport detail"** — it IS a transport detail for tool authors, but it's an architectural choice for consumers.
5. **Drop "implementation failures not architectural ones"** — the pit of success framework makes this untenable. Say "MCP defines the right target but hasn't made it easy to hit."
6. **Acknowledge the self-serving angle** — TPMJS benefits from multi-protocol. Be transparent.
7. **Don't lean on bidirectional communication** — it's speculative for current use cases.
8. **Acknowledge training data advantage is durable** — not just a current cost gap.
9. **Drop the REST-circa-1999 analogy** — it invites more criticism than insight.
10. **Clarify the audience** — the security argument addresses enterprises building production systems, not individual developers.

---

## NEW SOURCES (from counter-argument research)

| Article | Author | Position | URL |
|---------|--------|----------|-----|
| State of MCP Server Security 2025 | Astrix Security | Data | https://astrix.security/learn/blog/state-of-mcp-server-security-2025/ |
| 41% of MCP Servers Lack Auth | Earezki (Dev Journal) | Data | https://earezki.com/ai-news/2026-02-21-i-scanned-every-server-in-the-official-mcp-registry-heres-what-i-found/ |
| MCP Auth Spec Is a Mess for Enterprise | Christian Posta (Solo.io) | Critique | https://blog.christianposta.com/the-updated-mcp-oauth-spec-is-a-mess/ |
| Let's Fix OAuth in MCP | Aaron Parecki | Fix | https://aaronparecki.com/2025/04/03/15/oauth-for-model-context-protocol |
| MCP Auth Spec Update (Nov 2025) | Aaron Parecki | Update | https://aaronparecki.com/2025/11/25/1/mcp-authorization-spec-update |
| When MCP Meets OAuth (Account Takeover) | Obsidian Security | Security | https://www.obsidiansecurity.com/blog/when-mcp-meets-oauth-common-pitfalls-leading-to-one-click-account-takeover |
| MCP shipped without authentication | VentureBeat | Security | https://venturebeat.com/security/mcp-shipped-without-authentication-clawdbot-shows-why-thats-a-problem |
| MCP Servers = Return of the Service Account | Security Boulevard | Security | https://securityboulevard.com/2026/03/mcp-servers-and-the-return-of-the-service-account-problem/ |
| OIDC-A Proposal | Subramanya.ai | Solution | https://subramanya.ai/2025/04/28/oidc-a-proposal/ |
| Why MCP Ignores 40 Years of RPC | Julien Simon | Critique | https://julsimon.medium.com/why-mcps-disregard-for-40-years-of-rpc-best-practices-will-burn-enterprises-8ef85ce5bc9b |
| MCP is not REST API | Lee Han Chung | Analysis | https://leehanchung.github.io/blogs/2025/05/17/mcp-is-not-rest-api/ |
| Code Mode: better way to use MCP | Cloudflare | Solution | https://blog.cloudflare.com/code-mode/ |
| MCP Went Sideways | Waleed Kadous (Canva) | Critique | https://waleedk.medium.com/the-evolution-of-ai-tool-use-mcp-went-sideways-8ef4b1268126 |
| Claude Skills are awesome | Simon Willison | Analysis | https://simonwillison.net/2025/Oct/16/claude-skills/ |
| Are MCP Servers Going Obsolete? | Peter Kellner | Analysis | https://peterkellner.net/2026-03-10-are-mcp-servers-going-obsolete-skills-vs-mcp/ |
| Why MCP Is the Ceiling, Not the Foundation | WunderGraph | Architecture | https://wundergraph.com/blog/why-mcp-is-ceiling-enterprise-ai-agent-architecture |
| The MCP Mess | Praveen Seshadri | Critique | https://pravse.medium.com/the-mcp-mess-and-how-to-solve-it-7a479b31fa11 |
| Falling Into The Pit of Success | Jeff Atwood | Framework | https://blog.codinghorror.com/falling-into-the-pit-of-success/ |
| MCP Security Issues | Docker | Security | https://www.docker.com/blog/mcp-security-issues-threatening-ai-infrastructure/ |
| No, MCPs Have NOT Won Yet | Victor Dibia | Critique | https://newsletter.victordibia.com/p/no-mcps-have-not-won-yet |
| Is MCP Overhyped? | Moncef Abboud | Critique | https://cefboud.com/posts/is-mcp-overhyped/ |
| MCP vs CLI Debate Is the Wrong Fight | Tobias Pfuetze | Synthesis | https://medium.com/@tobias_pfuetze/the-mcp-vs-cli-debate-is-the-wrong-fight-a87f1b4c8006 |
| MCP Overengineered Transport | Dmitry Degtyarev | Critique | https://mitek99.medium.com/mcps-overengineered-transport-and-protocol-design-f2e70bbbca62 |
| mcp2cli: 99% Token Reduction | topaiproduct | Solution | https://topaiproduct.com/2026/03/09/mcp2cli-the-tool-that-cuts-mcp-token-costs-by-99-just-hit-hacker-news/ |
| A2A Protocol (Google) | Google | Protocol | https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/ |
| OAuth for MCP Enterprise Patterns | GitGuardian | Analysis | https://blog.gitguardian.com/oauth-for-mcp-emerging-enterprise-patterns-for-agent-authorization/ |
| MCP vs APIs: When to Use Which | Tinybird | Analysis | https://www.tinybird.co/blog/mcp-vs-apis-when-to-use-which-for-ai-agent-development |
| MCP for Skeptics | Speakeasy | Defense | https://www.speakeasy.com/mcp/mcp-for-skeptics |
| LLMflation: LLM Inference Cost | a16z | Economics | https://a16z.com/llmflation-llm-inference-cost/ |
| IBM 2024 Cost of Data Breach | IBM/Ponemon | Data | https://newsroom.ibm.com/2024-07-30-ibm-report-escalating-data-breach-disruption-pushes-costs-to-new-highs |
| Token Cost Trap at Scale | Klaus Hofenbitzer | Economics | https://medium.com/@klaushofenbitzer/token-cost-trap-why-your-ai-agents-roi-breaks-at-scale-and-how-to-fix-it-4e4a9f6f5b9a |
| AAIF Formation | Linux Foundation | Governance | https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation |
| Code Mode Doesn't Replace MCP | Block/Goose | Defense | https://block.github.io/goose/blog/2025/12/21/code-mode-doesnt-replace-mcp/ |
| mcp2cli GitHub | knowsuchagency | Solution | https://github.com/knowsuchagency/mcp2cli |
| IETF OAuth AI Agents Draft | Senarath/Dissanayaka | Standard | https://datatracker.ietf.org/doc/html/draft-oauth-ai-agents-on-behalf-of-user-02 |
| MCP Nov 2025 Auth Spec Analysis | Den Delimarsky | Analysis | https://den.dev/blog/mcp-november-authorization-spec/ |
| Rails Insecure Defaults | Code Climate | Framework | https://codeclimate.com/blog/rails-insecure-defaults |
| Pit of Success (Rico Mariani) | Rico Mariani | Framework | https://ricomariani.medium.com/the-pit-of-success-cfefc6cb64c8 |
| SEP-1888: Progressive Disclosure | MCP Community | Proposal | https://github.com/modelcontextprotocol/modelcontextprotocol/issues/1888 |
| SEP-1576: Token Bloat Mitigation | Huawei | Proposal | https://github.com/modelcontextprotocol/modelcontextprotocol/issues/1576 |
| Why MCP Won | The New Stack | Analysis | https://thenewstack.io/why-the-model-context-protocol-won/ |
| LLM Inference Price Trends | Epoch AI | Data | https://epoch.ai/data-insights/llm-inference-price-trends |

---

## ADDITIONAL RESEARCH DATA (Round 2)

### Token Economics at Scale

| Year | GPT-4o-mini Output $/MTok | 17x MCP overhead cost | 1x CLI cost |
|------|--------------------------|----------------------|-------------|
| 2026 | $0.60 | $10.20 | $0.60 |
| 2027 | $0.06 | $1.02 | $0.06 |
| 2028 | $0.006 | $0.102 | $0.006 |

Source: a16z "LLMflation" (10x/year decline) + Epoch AI price trends

### Dynamic MCP Cost Comparison at 10K Sessions/Day

| Approach | Tokens/Session | Daily Cost (Sonnet) |
|----------|---------------|-------------------|
| Native MCP (43 tools) | ~44K | ~$6,600 |
| CLI | ~1.4K | ~$210 |
| mcp2cli (96% reduction) | ~1.8K | ~$270 |
| Speakeasy dynamic (100x) | ~440 | ~$66 |
| Cloudflare Code Mode (81%) | ~8.4K | ~$1,260 |

### MCP Auth Adoption (Hard Numbers)

| Property | Spec Status | Adoption |
|----------|-------------|----------|
| OAuth 2.1 | Mandatory since March 2025 | 8.5% |
| `act` claim / delegation | Via RFC 8693 | ~0% |
| CIMD (client identity) | Since Nov 2025 | <4% |
| Any auth at all | Expected | 59% |

### OIDC-A Status
- Independent proposal by Subramanya Nagabhushanaradhya (UMass Amherst)
- NOT an IETF draft, NOT OpenID Foundation spec
- arXiv paper (2509.25974), GitHub (2 stars, 0 forks, no implementations)
- Protocol-agnostic — works with REST, gRPC, or MCP
- No known real-world implementations

### AAIF Members (as of March 2026)
- **Platinum:** AWS, Anthropic, Block, Bloomberg, Cloudflare, Google, Microsoft, OpenAI
- **Gold:** American Express, Cisco, Datadog, Docker, Huawei, IBM, JPMorgan, Okta, Oracle, Salesforce, SAP, ServiceNow, Shopify, Snowflake + others
- **Silver:** 146+ members including Hugging Face, Pydantic, Uber, Zapier
- Auth is NOT a priority — no auth working group exists, DPoP and Workload Identity Federation are "on the horizon" but low priority

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
