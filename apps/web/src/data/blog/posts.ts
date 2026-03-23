export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  author: string;
  date: string; // ISO date string
  tags: string[];
  content: string;
  ogImage?: string;
}

export const posts: BlogPost[] = [
  {
    slug: 'mcp-vs-cli-vs-rest',
    title: 'MCP vs CLI vs REST Is the Wrong Argument',
    description:
      'Everyone is debating which protocol wins for AI tools. They are all right — in their context. But if you kill MCP, you might not care about security as much as you think.',
    author: 'Thomas Davis',
    date: '2026-03-13',
    tags: ['mcp', 'cli', 'rest', 'security', 'ai-tools', 'opinion'],
    content: `
## The debate

Open Twitter on any given day and you'll find the same fight:

- "MCP is dead."
- "MCP is the future."
- "Just use REST, why do we need another protocol?"
- "CLI is all you need."

They're all right — **in their context**. The mistake is universalizing from one context to all contexts.

Eric Holmes' ["MCP is dead. Long live the CLI"](https://ejholmes.github.io/2026/02/28/mcp-is-dead-long-live-the-cli.html) hit the top of Hacker News with 400+ points. His argument: LLMs are trained on millions of man pages and shell scripts, CLIs compose naturally through pipes, and MCP initialization is flaky. He's not wrong about any of it.

But he's not seeing the full picture either.

**A disclosure before we go further:** I built [TPMJS](https://tpmjs.com), a registry for AI tools. We serve tools over CLI, MCP, REST, and SDK simultaneously. That means I have a financial interest in multi-protocol — I benefit when the answer is "use all of them." You should weigh my arguments with that in mind. I'll try to be honest about where each protocol genuinely wins and where I'm steelmanning my own position.

Here's what I've learned.

## The numbers are real — CLI is cheaper

Let's start with what the data actually shows, because the CLI advocates have receipts.

[Scalekit benchmarked](https://www.scalekit.com/blog/mcp-vs-cli-use) 75 runs on Claude Sonnet 4 against the GitHub Copilot MCP server (43 tools):

| Task | CLI tokens | MCP tokens | Multiple |
|------|-----------|------------|----------|
| Repo language & license | 1,365 | 44,026 | **32x** |
| PR details & review status | 1,648 | 32,279 | **20x** |
| Repo metadata & install | 9,386 | 82,835 | **9x** |
| Merged PRs by contributor | 5,010 | 33,712 | **7x** |
| Latest release & deps | 8,750 | 37,402 | **4x** |

CLI was 100% reliable (25/25 runs). MCP was 72% (18/25) — all failures were TCP timeouts. At 10,000 operations/month: CLI costs $3.20, MCP costs $55.20. The root cause? 43 tool definitions injected into every conversation when the agent only uses 1-2.

[Jannik Reinhard measured](https://jannikreinhard.com/2026/02/22/why-cli-tools-are-beating-mcp-for-ai-agents/) similar results: MCP at ~145,000 tokens vs CLI at ~4,150 for the same tasks — a 35x difference. [CodeRabbit found](https://www.coderabbit.ai/blog/handling-ballooning-context-in-the-mcp-era-context-engineering-on-steroids) that tool metadata takes 40-50% of available context, with one example consuming 75,000 tokens before any work begins.

These numbers are damning. And the CLI advocates are right to cite them.

But they're measuring static MCP — the worst version of MCP — against the best version of CLI. More on that below.

## Each protocol wins somewhere

### CLI — Terminal agents

**Best for:** Claude Code, Aider, Codex, any agent that lives in a terminal.

\`\`\`bash
$ tpm tool search firecrawl --limit 3

  Name             Package                    Category
  scrapeTool       @anthropic/firecrawl-tools  web
  searchTool       @anthropic/firecrawl-tools  web
  crawlTool        @anthropic/firecrawl-tools  web
\`\`\`

Why CLI wins here:

- **Fewest tokens.** The data above speaks for itself. 4-32x cheaper per call.
- **LLMs are great at bash.** As [Manveer C. notes](https://manveerc.substack.com/p/mcp-vs-cli-ai-agents), LLMs are trained on billions of Unix pipe examples — zero examples of MCP composition patterns. This training data advantage is [durable, not temporary](https://lalatenduswain.medium.com/cli-based-agents-vs-mcp-the-2026-showdown-that-every-ai-engineer-needs-to-understand-7dfbc9e3e1f9) — CLI patterns appear naturally in Stack Overflow, blog posts, and documentation. MCP traces are agent-to-server and won't appear in web crawls.
- **Natural composition.** \`terraform show -json plan.out | jq\` — no protocol needed. Holmes is right that CLIs compose through piping in a way MCP can't match.
- **Existing auth works.** \`aws profiles\`, \`gh auth login\`, \`kubeconfig\` — these work identically for humans and agents.

### MCP — GUI editors and enterprise

**Best for:** Claude Desktop, Cursor, Windsurf, any editor without a shell. And anywhere you need structured tool boundaries.

\`\`\`bash
claude mcp add my-tools \\
  https://tpmjs.com/@you/collections/my-tools/mcp \\
  -t http
\`\`\`

Why MCP wins here:

- **These environments don't have a shell.** MCP is the only structured way to give a GUI editor access to external tools. This alone justifies MCP's existence.
- **Discovery is built in.** The editor can enumerate available tools and their schemas without the user doing anything.
- **It defines the right security target.** OAuth 2.1, agent identity, delegation chains, consent flows — the spec describes what secure agent-to-service communication looks like. Whether the ecosystem has gotten there yet is another question (more on this below).
- **Structured communication by default.** JSON-RPC gives you machine-readable request/response pairs with mandatory IDs. This matters for observability, though the advantage is smaller than I used to think (more on this below too).

As [Matthew Hall argues](https://matthewhall.com/posts/mcp-isnt-dead-were-just-early/), HTTP + OAuth MCP servers eliminate local process management entirely. And with Anthropic donating MCP to the [Linux Foundation's AAIF](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation) — with OpenAI, Google, Microsoft, and AWS as platinum members — the single-vendor critique is fading.

### REST — Backends and serverless

**Best for:** Web apps, microservices, serverless functions, anything server-side.

\`\`\`bash
curl -X POST https://tpmjs.com/api/tools/execute \\
  -H "Authorization: Bearer $TPMJS_KEY" \\
  -d '{"tool":"firecrawl--scrape","input":{"url":"..."}}'
\`\`\`

Why REST wins here:

- **Universal.** No special client, no protocol library. Every language knows how to POST JSON.
- **Battle-tested.** Auth, caching, rate limiting, monitoring — the entire HTTP ecosystem applies.
- **No opinions.** REST doesn't care about your framework, your language, or your AI provider.

### SDK — Programmatic use

**Best for:** TypeScript apps, agent frameworks, anywhere you're writing code.

\`\`\`typescript
import { registrySearchTool } from '@tpmjs/registry-search';
import { registryExecuteTool } from '@tpmjs/registry-execute';

const result = await generateText({
  tools: {
    registrySearch: registrySearchTool,
    registryExecute: registryExecuteTool,
  },
  prompt: 'Find and run a web scraping tool',
});
\`\`\`

Why SDK wins here:

- **Type safety.** Zod schemas, autocomplete, compile-time errors.
- **Framework integration.** Works natively with Vercel AI SDK, LangChain, or any JS agent framework.
- **Best DX** when you're building in code, not configuring a client.

## The arguments people get wrong

### "MCP is dead"

No. MCP is the right choice when your host environment doesn't have a shell. Cursor and Claude Desktop *need* structured tool interfaces. Declaring MCP dead because CLI works better in a terminal is like declaring REST dead because GraphQL exists.

On HN, skeptics call MCP ["JSON-RPC with some descriptors"](https://news.ycombinator.com/item?id=45950814) and ["the LangChain of 2025."](https://news.ycombinator.com/item?id=44066189) [Julien Simon argues](https://julsimon.medium.com/why-mcps-disregard-for-40-years-of-rpc-best-practices-will-burn-enterprises-8ef85ce5bc9b) MCP "ignores 40 years of RPC best practices." These are fair criticisms of the protocol's maturity, but they don't address the gap it fills — no other protocol gives GUI editors structured access to external tools.

### "MCP is the future"

Not universally. In Claude Code, MCP adds 4-32x token overhead to do something the model already does natively with bash. Holmes reports "lost count of the times I've restarted Claude Code because an MCP server didn't come up." Protocol complexity has a cost.

### "Just use REST"

REST is right for your backend. It's wrong for an AI agent in an editor. MCP provides runtime tool discovery (\`tools/list\`), session state, and capability negotiation — things REST's stateless request-response model doesn't offer natively.

But I should acknowledge: [Lee Han Chung makes a strong case](https://leehanchung.github.io/blogs/2025/05/17/mcp-is-not-rest-api/) that MCP is fundamentally action-oriented RPC, not resource-centric REST. Comparing them is sometimes apples to oranges. And "just use REST" hand-waves away the hardest part: the agent needs to *discover* what endpoints exist. Dumping an entire OpenAPI spec into context is just as wasteful as MCP's tool definitions.

### "CLI is all you need"

Only if your entire world is a terminal. The moment you're in a GUI editor, a web app, or a mobile context, CLI doesn't help. And as [Mathew Pregasen points out](https://dev.to/mathewpregasen/mcp-vs-cli-tools-which-is-best-for-production-applications-bd8), models struggle with non-ASCII strings, unconventional CLI args, and newline characters through shell arguments.

## The real mistake

Every take picks ONE context and universalizes:

| Claim | True for | False for |
|-------|----------|-----------|
| "CLI is better" | Terminal agents | GUI editors, web apps |
| "MCP is the future" | Claude Desktop, Cursor | Terminal agents, backends |
| "Just use REST" | Backends, serverless | Editor integrations |
| "SDK only" | TypeScript apps | Non-JS, non-code contexts |

I know what some of you are thinking: *"'It depends' is a cop-out. It's the non-answer that avoids deeper analysis."* [Tobias Pfuetze makes this exact criticism](https://medium.com/@tobias_pfuetze/the-mcp-vs-cli-debate-is-the-wrong-fight-a87f1b4c8006) — framing the choice as "use both" misses the real architectural tensions.

Fair. So let me be specific about what it depends ON, and let me be honest about where each side's arguments break down.

## The security argument — and why it's complicated

This is the argument that the "just use CLI" and "just use REST" crowd hand-waves away. It's the one that matters most at scale. But it's also more nuanced than I originally thought.

### The problem MCP is trying to solve

CLI works great for dev use cases. But let's think about what happens when you try to make it work for real users at scale.

**Not everyone will download a CLI.** Sure, you can package it invisibly inside the agent. But then you have to figure out auth. Non-developers aren't going to open the Google Cloud Console and generate API keys. So you need OAuth — you need users to authenticate the CLI.

Here's where it gets messy:

1. **The consent screen is confusing.** The user is authenticating a CLI they might not even know exists — not the agent they're actually talking to.
2. **Device flow is awkward.** The user has no mental model of "the CLI" — they just want the agent to work.
3. **The access token doesn't identify the agent.** This is the killer problem.

When the CLI authenticates, you get back a token that looks something like:

\`\`\`json
{
  "aud": "api.google.com/drive",
  "sub": "user-id-123",
  "client_id": "CLI_CLIENT_ID"
}
\`\`\`

Two problems:

**The CLI client ID is public.** The CLI binary is distributed to everyone — anyone can inspect it, extract the client ID, and impersonate it. So "just a CLI" is already leaking trust assumptions.

**The API never knows who the agent is.** You can't apply policy based on agent identity. The token says "some user via some CLI" — not "Claude via TPMJS acting on behalf of this user."

This gets worse with agents calling agents. In a chain of Agent A → Agent B → Agent C, ideally you'd track the full delegation:

\`\`\`json
{
  "aud": "api.google.com/drive",
  "sub": "user-id-123",
  "client_id": "agent1",
  "act": { "sub": "agent2" }
}
\`\`\`

CLI-to-API gives you none of this. The API sees one opaque token and has no idea what's behind it.

### What it takes to secure an API for agents

What does it actually take to make a raw API secure for agent use?

1. **Dynamic client registration** — agents register themselves, users consent without visiting a dev portal
2. **OAuth consent, not API keys** — users can only access their own data; security enforcement on the server, not the client
3. **Sensitive action approval** — human in the loop for destructive actions, enforced server-side
4. **Good agent experience (AX)** — dedicated agent-facing API, semantic grouping, clear documentation

If you do all four of those things to your REST API, you've reinvented **MCP's security properties** — the same properties the MCP spec describes. That's not a coincidence. MCP exists because these are the properties you need for secure agent-to-service communication.

### But here's what I got wrong initially

I used to say "you just reinvented MCP." That's an overstatement, and the critics caught it.

**You can get these security properties without MCP.** [OIDC-A (OpenID Connect for Agents)](https://subramanya.ai/2025/04/28/oidc-a-proposal/) extends standard OIDC with \`delegation_chain\`, \`agent_attestation\`, and \`delegator_sub\` claims — and it's protocol-agnostic. It works with REST, gRPC, or MCP equally. JWT + mTLS + OPA policies at API gateways [provide agent identity without MCP](https://www.infoq.com/articles/building-ai-agent-gateway-mcp/). An [IETF draft for OAuth agent delegation](https://datatracker.ietf.org/doc/html/draft-oauth-ai-agents-on-behalf-of-user-02) exists that works with standard OAuth flows.

The fact that OIDC-A had to be created proves standard OAuth ISN'T enough for agent identity — but OIDC-A being protocol-agnostic proves MCP ISN'T required to solve it.

So MCP's real unique value isn't security per se. It's **runtime discovery + session state + security, bundled as a single protocol for environments that need all three** — primarily GUI editors and multi-tenant platforms where you can't assume a shell.

### MCP's security is mostly theoretical — and that matters

I should be brutally honest here. The MCP spec *describes* the right security properties, but the ecosystem has barely implemented them.

[Astrix Security analyzed 5,200+ MCP servers](https://astrix.security/learn/blog/state-of-mcp-server-security-2025/): only **8.5% use OAuth**. 53% rely on long-lived static API keys. [A separate audit of the official MCP registry](https://earezki.com/ai-news/2026-02-21-i-scanned-every-server-in-the-official-mcp-registry-heres-what-i-found/) found **41% require no authentication at all**. The \`act\` claim for delegation chains? Effectively **0% adoption** across all major clients. [Obsidian Security tested 78 authorization servers](https://www.obsidiansecurity.com/blog/when-mcp-meets-oauth-common-pitfalls-leading-to-one-click-account-takeover) and found fewer than 4% support Client ID Metadata Documents.

Auth wasn't even in the original MCP spec (November 2024). It was [bolted on 5 months later](https://aaronparecki.com/2025/04/03/15/oauth-for-model-context-protocol) and has been [revised three times since](https://auth0.com/blog/mcp-specs-update-all-about-auth/). [Christian Posta called it](https://blog.christianposta.com/the-updated-mcp-oauth-spec-is-a-mess/) "a mess for enterprise."

[Simon Willison documented](https://simonwillison.net/2025/Apr/9/mcp-prompt-injection/) tool shadowing attacks where tools mutate definitions post-install to redirect API keys. [AuthZed compiled a timeline](https://authzed.com/blog/timeline-mcp-breaches) of real MCP breaches — WhatsApp chat histories exfiltrated via tool poisoning, GitHub private repos leaked, a CVE in mcp-remote affecting 437,000+ downloads, sandbox escapes via symlinks. [Docker found](https://www.docker.com/blog/mcp-security-issues-threatening-ai-infrastructure/) 43% of MCP servers have command injection vulnerabilities.

### The pit of success problem

My original post said these were "implementation failures, not architectural ones." Several people pushed back on this, and I think they're right.

There's a concept in software design called the [pit of success](https://blog.codinghorror.com/falling-into-the-pit-of-success/) — the idea that a well-designed system makes it easy to do the right thing and hard to do the wrong thing. Rico Mariani coined it at Microsoft: *"We want our customers to simply fall into winning practices by using our platform."*

MCP is not a pit of success for security. When 43% of servers have command injection flaws and 41% have no auth, the protocol is making insecure implementations easy and secure implementations hard. [Shrivu Shankar showed](https://blog.sshh.io/p/everything-wrong-with-mcp) that tool shadowing — dynamically redefining tool descriptions after user approval — is a design-level vulnerability, not an implementation bug.

This is the same pattern as the [PHP security debate](https://phpsecurity.readthedocs.io/en/latest/_articles/PHP-Security-Default-Vulnerabilities-Security-Omissions-And-Framing-Programmers.html): "PHP isn't insecure, developers are" was debunked because if the language makes insecure code the default path, the language bears responsibility. Similarly, if MCP makes insecure servers the default path, the protocol bears responsibility.

[Rails went through this](https://codeclimate.com/blog/rails-insecure-defaults) and came out the other side — Rails 2 had wide-open mass assignment; Rails 4 introduced Strong Parameters. MCP needs the same evolution: default-deny permissions, mandatory tool description integrity checks, and changing SHOULDs to MUSTs in the spec. [The November 2025 spec revision](https://den.dev/blog/mcp-november-authorization-spec/) moved in this direction with Client ID Metadata Documents and incremental scope requests, but there's a long way to go.

### So where does this leave us?

Here's the honest version:

- **MCP defines the right security target** for agent-to-service communication
- **Almost nobody has hit that target yet** — 8.5% OAuth, 0% delegation chains
- **CLI has no security target at all** — it doesn't even attempt agent identity or delegation
- **The security properties MCP describes can be achieved without MCP** — via OIDC-A, JWT+mTLS, or API gateways
- **But MCP bundles them with discovery and session state**, which matters in GUI editors and multi-tenant contexts

Killing MCP doesn't mean you don't care about security. But it does mean you'll need to solve agent identity, delegation, and consent yourself — and the industry hasn't yet produced a simpler way to bundle those properties together.

## The observability argument — more nuanced than I thought

I used to say "MCP gives you logging for free. CLI doesn't." The critics taught me this is too simple.

### What MCP genuinely provides

MCP is JSON-RPC 2.0. Every request and response is structured JSON with a mandatory ID field:

\`\`\`json
{
  "jsonrpc": "2.0",
  "id": "req-abc-123",
  "method": "tools/call",
  "params": {
    "name": "firecrawl--scrape",
    "arguments": { "url": "https://example.com" }
  }
}
\`\`\`

Every tool call gets: tool name, exact parameters, exact result, correlation ID, timestamp. [Datadog already supports MCP natively](https://www.datadoghq.com/blog/mcp-client-monitoring/). You get structured audit trails out of the box.

### What the critics get right about CLI

My original claim that "CLI output is unstructured text" is outdated. Modern CLI tools have first-class structured output:

- \`gh pr list --json number,title,author\` — [GitHub CLI](https://cli.github.com/manual/gh_help_formatting) supports \`--json\` on most commands
- \`kubectl -o json\`, \`kubectl -o jsonpath\` — Kubernetes has full structured output
- \`aws --output json\` + \`--query\` — AWS CLI outputs structured JSON
- \`terraform show -json\` — [Terraform has a stable JSON spec](https://developer.hashicorp.com/terraform/internals/json-format)
- \`docker ps --format '{{json .}}'\` — Docker supports JSON via Go templates

More importantly, **observability is an infrastructure concern, not a protocol concern.** [AWS CloudTrail](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html) has been logging every CLI command as structured JSON for over a decade — regardless of protocol. GCP Cloud Audit Logs, Azure Activity Log, and [OpenTelemetry](https://opentelemetry.io/) all prove that comprehensive audit trails work independently of the wire protocol. The audit infrastructure sits at the service layer and captures everything. The transport is irrelevant.

### The real distinction

The honest framing: **MCP's structured logging is on by default. CLI's is opt-in and inconsistent.**

MCP gives you structured request/response pairing on every server, by definition. With CLI, you get structured output IF the tool supports \`--json\` AND the agent uses it AND you've configured log aggregation. Modern CLI tools are closing this gap fast, but MCP's advantage is that the default is structured rather than text.

For debugging, MCP's mandatory request IDs give you automatic request/response pairing across multi-step workflows. CLI has no built-in correlation — you can add \`run_id\` propagation, but that's custom infrastructure you have to build.

For compliance in regulated industries (finance, healthcare, government), "structured by default" matters because you don't get to retroactively add audit trails. But for most development workflows, CLI + CloudTrail or CLI + OpenTelemetry is perfectly adequate.

## The token bloat problem is being solved

The CLI advocates' strongest argument — the 4-32x token overhead — is a real problem being actively solved. It would be dishonest not to acknowledge the progress:

- [Anthropic's own engineers (Adam Jones & Conor Kelly)](https://www.anthropic.com/engineering/code-execution-with-mcp) proposed presenting MCP servers as filesystem-navigable code APIs. Instead of injecting all tool definitions upfront, agents explore a \`./servers/\` directory, read only the tool files they need, and write TypeScript that calls tools directly — with intermediate data staying in the execution environment. **150,000 → 2,000 tokens. 98.7% reduction.** The approach also enables privacy-preserving operations: sensitive data (meeting transcripts, PII) flows between tools without ever reaching the model's context. The agent sees \`[EMAIL_1]\` while real data passes through untouched.
- [Cloudflare's Code Mode](https://blog.cloudflare.com/code-mode/) takes a similar approach: expose entire APIs via just two tools (\`search()\` and \`execute()\`). The agent writes TypeScript against a typed SDK, executed in a sandboxed Worker. **81% fewer tokens for complex tasks**, ~1,000 tokens regardless of API surface size. Anthropic explicitly cites Cloudflare as aligned related work.
- [Speakeasy's dynamic toolsets](https://www.speakeasy.com/blog/how-we-reduced-token-usage-by-100x-dynamic-toolsets-v2) separate discovery from schema loading. **96.7% reduction**, 100% success rate.
- [Phil Schmid's MCP CLI](https://www.philschmid.de/mcp-cli): 6 servers, 60 tools, **47,000 → 400 tokens. 99% reduction.**
- [mcp2cli](https://github.com/knowsuchagency/mcp2cli) converts MCP servers into CLI commands with on-demand discovery: \`--list\` at ~16 tokens/tool vs MCP's ~121 tokens/tool injected every turn. **97.7% reduction** over a 20-turn session.

The code execution pattern is particularly compelling because it solves two problems at once: token bloat (agents only load what they need) AND data efficiency (a 10,000-row spreadsheet gets filtered in the execution environment — the agent sees 5 rows, not 10,000). It also enables reusable Skills: agents persist code as functions that other agents can import, building a toolbox of higher-level capabilities over time.

A fair critique: [most of these solutions work *around* the MCP spec, not within it](https://github.com/modelcontextprotocol/modelcontextprotocol/issues/1888). Lazy schema loading isn't in the current spec — it's a community workaround. Proposals like SEP-1888 (progressive disclosure) and SEP-1576 (token bloat mitigation) are active but not ratified. [Waleed Kadous (Canva) argues](https://waleedk.medium.com/the-evolution-of-ai-tool-use-mcp-went-sideways-8ef4b1268126) that "MCP was a stop along the way, not the destination."

However, [Block/Goose explicitly pushed back](https://block.github.io/goose/blog/2025/12/21/code-mode-doesnt-replace-mcp/) on the "Code Mode replaces MCP" narrative — Code Mode is a pattern *on top of* MCP, not a replacement. The code execution approach doesn't bypass MCP; it uses MCP as the underlying transport while adding a code layer that makes the interaction far more efficient. And dynamic MCP with lazy loading approaches CLI's cost: [Scalekit showed](https://www.scalekit.com/blog/mcp-vs-cli-use) an MCP gateway with schema filtering drops monthly costs from $55.20 to ~$5 — within range of CLI's $3.20.

### The economics are shifting anyway

Here's a number the token-counters should consider: [LLM inference costs are declining roughly 10x per year](https://a16z.com/llmflation-llm-inference-cost/). GPT-4 cost $30/MTok input in March 2023. GPT-4o costs $2.50 today. GPT-4o-mini costs $0.15. That's a 200x decline in 2 years.

At that trajectory, by 2028 a 17x token overhead costs roughly $0.01 at today's cheapest prices. The static MCP overhead that's $1,600/day today becomes ~$16/day. The overhead becomes economically irrelevant within 2-3 years.

The counter-argument is real: usage grows faster than costs decline. A [$50 proof-of-concept can scale to $847,000/month](https://medium.com/@klaushofenbitzer/token-cost-trap-why-your-ai-agents-roi-breaks-at-scale-and-how-to-fix-it-4e4a9f6f5b9a) in production. But the question is whether you're optimizing for today's costs or tomorrow's — and whether [one $4.88M data breach](https://newsroom.ibm.com/2024-07-30-ibm-report-escalating-data-breach-disruption-pushes-costs-to-new-highs) (IBM's 2024 average) is worth more than 50 million MCP sessions of token overhead.

## The full comparison

Here's how the four protocols stack up across every dimension that matters. I've tried to be honest about where each protocol's claims are theoretical vs proven.

### Performance

| | CLI | MCP | REST | SDK |
|--|-----|-----|------|-----|
| **Token cost** | ~50 per call | ~200 dynamic (static: 30K+) | N/A (server-side) | N/A (in-process) |
| **Latency** | High (process spawn) | Medium (JSON-RPC) | Medium (HTTP) | Very low (native) |
| **Cold start** | Slow (new process each call) | Fast (persistent server) | Fast (connection pool) | None |
| **Throughput** | Low (sequential) | Medium (multiplexed) | High (HTTP/2) | Very high |
| **Reliability** | High (100% in benchmarks) | Lower (72% in benchmarks) | High | Very high |

### Security

| | CLI | MCP (spec) | MCP (reality) | REST | SDK |
|--|-----|------------|---------------|------|-----|
| **Agent identity** | None | OAuth 2.1 client ID | 8.5% use OAuth | API key / OAuth | Library-dependent |
| **User consent** | Awkward device flow | Standardized OAuth | Rarely implemented | Custom UI needed | Custom code |
| **Delegation chain** | Not possible | \`act\` claim support | ~0% adoption | Scoped tokens | Flexible |
| **Permission scoping** | None | Scope-based | Mostly all-or-nothing | Endpoint-based | Function-based |
| **Prompt injection risk** | Shell injection | Tool poisoning, shadowing | 43% have injection flaws | Input validation | Type-checked |

### Observability

| | CLI | MCP | REST | SDK |
|--|-----|-----|------|-----|
| **Structured logging** | Opt-in (\`--json\` flags) | Built-in (JSON-RPC) | Good (HTTP + JSON) | Excellent (native) |
| **Request/response pairing** | Manual (\`run_id\` propagation) | Built-in (mandatory ID) | Manual (headers) | Native (return values) |
| **Server-side audit** | Excellent (CloudTrail, etc.) | Good (with gateway) | Excellent (API gateway) | With proper logging |
| **Compliance readiness** | Depends on infra | High (if implemented) | Depends on infra | Depends on infra |

### Developer Experience

| | CLI | MCP | REST | SDK |
|--|-----|-----|------|-----|
| **Setup complexity** | Very low (install binary) | Low (stdio or URL) | Medium (HTTP + auth) | Very low (import) |
| **Type safety** | None (string parsing) | JSON Schema | OpenAPI codegen | Native types |
| **Discovery** | \`--help\`, docs | Built-in introspection | OpenAPI/Swagger | IDE autocomplete |
| **Training data** | Billions of examples | Near zero | Moderate | Moderate |

### Architecture

| | CLI | MCP | REST | SDK |
|--|-----|-----|------|-----|
| **Statefulness** | Stateless | Session-based | Stateless (HTTP) | Flexible |
| **Transport** | stdout/stderr | Stdio, HTTP | HTTP/1.1, HTTP/2 | In-process |
| **Connection model** | Spawn per call | Persistent session | Per-request | No network |
| **Bidirectional** | No | Yes (spec), rarely used (practice) | No (polling) | N/A |

### The takeaway from the matrix

- **CLI** wins on token efficiency, setup simplicity, training data, and reliability. Loses on security targeting and non-terminal contexts.
- **MCP** wins on discovery, session state, non-dev UX, and security targeting (in spec). Loses on token cost, ecosystem maturity, and security reality.
- **REST** wins on universality and ecosystem maturity. Loses on agent-specific UX and requires building discovery and security yourself.
- **SDK** wins on everything except reach — it only works in a supported language.

## What the critics get right

After publishing the first version of this post, I spent time reading every counter-argument. Several changed my thinking.

### The "it depends" critique

[Tobias Pfuetze argues](https://medium.com/@tobias_pfuetze/the-mcp-vs-cli-debate-is-the-wrong-fight-a87f1b4c8006) that "use both" is a thought-terminating cliche. He's partially right. The protocol choice IS architecturally significant — MCP is action-oriented RPC with session state; REST is resource-centric and stateless. [Choosing wrong means restructuring your system](https://www.tinybird.co/blog/mcp-vs-apis-when-to-use-which-for-ai-agent-development), not just swapping an envelope.

Where I still disagree: for the **tool author**, the protocol can genuinely be a transport detail — if a registry handles the protocol adaptation. For the **consumer**, it's an architectural choice with real consequences. I should have been clearer about that distinction.

### The "MCP is being hollowed out" critique

[Simon Willison called Skills "maybe a bigger deal than MCP."](https://simonwillison.net/2025/Oct/16/claude-skills/) [DomAIn Labs reported](https://www.domainlabs.dev/blog/agent-guides/mcp-bloated-workflows-skills-architecture) developers "ripping out MCP servers and replacing them with Markdown files." Every major token-bloat solution works by circumventing MCP's static tool discovery — the protocol's signature feature.

What remains after stripping static discovery? Transport standardization, capability negotiation, auth framework, and session state. That's still valuable — but it's less distinctive than "the standard for AI tool integration" suggests. MCP may evolve from a tool protocol into a transport/auth protocol, with Skills handling the knowledge layer above it.

### The training data argument

This one doesn't get enough weight. LLMs have seen \`find . -name "*.py" | xargs grep "import"\` thousands of times. They improvise novel CLI compositions because the composability grammar is embedded in their weights. MCP composition patterns have zero training data — the model relies entirely on runtime schema injection.

This advantage is durable. MCP traces are agent-to-server interactions that don't naturally appear on Stack Overflow or in blog posts. Even as MCP adoption grows, the training data asymmetry will narrow slowly. [Cloudflare's Code Mode](https://blog.cloudflare.com/code-mode/) offers an elegant synthesis: have LLMs write TypeScript code against MCP-backed APIs, leveraging the training data advantage while using MCP as transport.

## The emerging consensus

After reading everything written on this topic, the debate has converged more than Twitter suggests:

1. **Raw MCP with static tool loading is wasteful.** Everyone agrees. The solutions converge on lazy/on-demand loading.
2. **CLI wins for developer-facing terminal workflows.** The training data advantage is real, measurable, and durable.
3. **MCP wins for GUI editors and multi-tenant platforms.** Discovery, session state, and structured tool boundaries justify the overhead in environments without a shell.
4. **MCP's security story is aspirational, not actual.** The spec defines the right properties. The ecosystem is at 8.5% adoption. This gap must close.
5. **The smartest teams use hybrid architectures.** CLI for development, MCP for customer-facing features, unified behind a Skills/abstraction layer. Both Claude Code and [Cowork](https://manveerc.substack.com/p/mcp-vs-cli-ai-agents) already do this.
6. **Token costs are declining faster than most people realize.** The 17x overhead that dominates today's debate will be economically irrelevant within 2-3 years.

## What actually matters

The protocol debate distracts from the hard problems nobody is solving:

**How do you find tools that work?** There are thousands of MCP servers and npm packages claiming to be AI tools. Most are broken, undocumented, or abandoned. [Merge.dev lists](https://www.merge.dev/blog/mcp-challenges) "poor maintenance — servers launched for marketing receive minimal support" as a top challenge. The protocol doesn't help you find the good ones.

**How do you know a tool is safe to run?** [Shrivu Shankar found](https://blog.sshh.io/p/everything-wrong-with-mcp) that "LLM-reliability often negatively correlates with instructional context" — more tools paradoxically reduces performance. The protocol doesn't tell you which tools work.

**How do you compose tools into workflows?** An agent needs a web scraper, a summarizer, and a Slack notifier. How does it find them, wire them together, and handle failures? The protocol is the least interesting part of that stack.

These are registry problems, trust problems, and quality problems. They're harder than protocol design, which is probably why people would rather argue about MCP on Twitter.

## The TPMJS approach

We built TPMJS around a simple premise: **write the tool once, serve it everywhere.**

A tool author publishes a Zod-schema'd function to npm. TPMJS indexes it, health-checks it, quality-scores it, and makes it available over every protocol:

- **CLI** — \`tpm tool search\`, \`tpm tool execute\` (fewest tokens, best for terminal agents)
- **MCP** — Every collection is an MCP server endpoint (structured auth, best for editors)
- **REST** — Standard API with Bearer auth (universal, best for backends)
- **SDK** — \`@tpmjs/registry-search\` and \`@tpmjs/registry-execute\` (type-safe, best for code)

Yes, a multi-protocol registry benefits when the answer is "use all four." I'm biased. But the data supports context-dependent protocol choice regardless of whether TPMJS exists.

## The bottom line

The protocol debate is real but overblown. Here's the honest version:

**CLI is cheaper, more reliable, and better-supported by LLM training data.** For terminal agents, it wins decisively. The training data advantage is durable.

**MCP defines the right security and discovery properties for non-terminal contexts.** But the ecosystem is years behind the spec — 8.5% OAuth adoption, 0% delegation chains, 43% of servers with injection flaws. The protocol needs to become a [pit of success](https://blog.codinghorror.com/falling-into-the-pit-of-success/) where insecure implementations are hard to build, not easy.

**REST is the universal fallback** that works everywhere, with decades of battle-tested infrastructure.

**The token cost argument is real today but shrinking.** Costs decline 10x/year. Dynamic MCP approaches CLI parity. By 2028, the overhead is a rounding error.

**Observability is an infrastructure concern, not a protocol concern.** CloudTrail, OpenTelemetry, and API gateways work regardless of wire protocol. MCP's advantage is structured defaults, not unique capability.

Don't pretend that killing MCP is free — the security properties it targets are real, even if the ecosystem hasn't delivered them yet. But don't pretend MCP has delivered them either. The protocol defines the destination. The ecosystem is still very early in the journey.

The hard problems — discovery, trust, quality, composition — aren't protocol problems. They're registry problems. And those are the ones worth solving.
`,
  },
  {
    slug: 'ai-native-execution-architecture',
    title: 'The AI-Native Execution Layer: Tool RAG, Schema Compression, and the 10M Token Trap',
    description:
      'How should tool infrastructure be designed to maximize LLM performance? Tool RAG, schema compression, execution history, and why bigger context windows make the problem worse.',
    author: 'Thomas Davis',
    date: '2026-03-13',
    tags: ['architecture', 'tool-rag', 'llm', 'execution', 'ai-infrastructure'],
    content: `
## The execution layer nobody is designing for

Every AI infrastructure company is building for the LLM of today. The right move is to build for the LLM of 12 months from now — and the research is clear about where it's heading.

Here's the uncomfortable truth: tool-calling accuracy drops to **13% when you put too many tools in context**. That number comes from Salesforce's ToolLLM benchmarks, and it matches what we see in production at TPMJS. The models don't degrade gracefully — they fall off a cliff. Give Claude 5 well-described tools and it picks the right one 95%+ of the time. Give it 50 and accuracy drops to ~40%. Give it 500 and it hallucinates tool names that don't exist.

This isn't a context window problem. It's an attention problem. And bigger context windows will make it worse, not better.

## Tool RAG: the retrieval layer LLMs need

The term "Tool RAG" is starting to circulate — retrieval-augmented generation applied to tool selection instead of document retrieval. The idea: instead of injecting all available tools into context, retrieve the 5-7 most relevant tools for a given query and inject only those.

Anthropic's own engineering team [demonstrated this pattern](https://www.anthropic.com/engineering/code-execution-with-mcp) by presenting MCP servers as navigable filesystem APIs. Cloudflare's Code Mode does the same thing with two meta-tools: \`search()\` and \`execute()\`. Both achieve 95%+ token reductions.

But what does Tool RAG look like in practice when you're selecting from 100,000 tools?

**Stage 1: Semantic search.** Embed the user's query and find the top 50 candidate tools by cosine similarity against tool description embeddings. This is fast, cheap, and eliminates 99.95% of the catalog. At TPMJS, we use BM25 for lexical matching combined with vector search — hybrid retrieval catches both exact keyword matches ("firecrawl scrape") and semantic intent ("get the text content of a webpage").

**Stage 2: Re-ranking with context.** The top 50 candidates get re-ranked using the conversation history, not just the latest message. If the user has been working with GitHub tools for the last 10 messages, a query about "create an issue" should rank \`github--create-issue\` above \`jira--create-issue\` even if both are semantically similar. This is where execution history becomes a ranking signal — more on that below.

**Stage 3: Schema-aware filtering.** Check that the candidate tools' required inputs can actually be satisfied. If a tool requires an \`apiKey\` parameter and the user hasn't configured one, demote it. If a tool's input schema expects a file path and the conversation has no files, demote it. This prevents the LLM from selecting tools it can't actually call.

**Stage 4: Inject the top 5-7.** The sweet spot from every benchmark we've seen. Below 5, you risk missing the right tool. Above 7, accuracy starts dropping. At exactly 5-7 tools with good descriptions, models achieve their peak selection accuracy.

The key insight: Tool RAG isn't optional optimization. It's a **correctness requirement**. Without it, the LLM is doing the retrieval itself — poorly, expensively, and unreliably.

## Schema compression: every token counts

A typical MCP tool definition runs 200-500 tokens. Multiply by 50 tools and you've burned 10,000-25,000 tokens before the conversation starts. Schema compression is about getting that per-tool cost down to 30-50 tokens without losing the information the model needs.

What works:

**Strip examples from schemas unless they demonstrate non-obvious behavior.** A \`url: string\` parameter doesn't need an example. A \`dateRange: string\` parameter that accepts "last-7d" or "2024-01-01..2024-03-01" does. We've found that selective examples — only on parameters with non-obvious formats — reduce schema size by 40% with zero accuracy loss.

**Collapse nested object schemas.** Instead of fully expanding \`{ options: { format: string, timeout: number, retries: number } }\`, use a single-line TypeScript signature: \`options: { format: string; timeout?: number; retries?: number }\`. LLMs parse TypeScript signatures faster than JSON Schema because they've seen orders of magnitude more TypeScript.

**Use JSDoc-style descriptions, not prose.** \`@param url - Target URL to scrape (must include protocol)\` beats "The url parameter should be a string containing the full URL of the page you want to scrape, including the protocol prefix such as https://". Dense, structured descriptions match how models encounter parameter documentation in training data.

**Function signatures over JSON Schema.** This is Cloudflare's key insight and it's correct. LLMs have seen billions of TypeScript function signatures. They've seen almost zero JSON Schema tool definitions. Present tools as:

\`\`\`typescript
/** Scrape a webpage and return its text content */
function scrape(url: string, options?: {
  format?: 'markdown' | 'text' | 'html';
  waitForSelector?: string;
}): Promise<{ content: string; title: string }>
\`\`\`

This is ~60 tokens. The equivalent JSON Schema is ~200 tokens. Same information, 70% compression, and the model understands it better because the format matches its training distribution.

## The 10M token trap

Google and Anthropic are racing toward multi-million token context windows. The assumption is that bigger windows solve the "too many tools" problem — just stuff everything in. This assumption is wrong, and the research explains why.

**Attention is not uniform across context.** The "lost in the middle" effect is well-documented: models attend strongly to the beginning and end of context, with significant accuracy drops for information in the middle. A 10M token window with 100,000 tool definitions means 99,990 of them are in the "dead zone" where attention is weakest. Tool 47,832 might be the perfect match, but the model will never find it.

**More context means more hallucination surface.** Every tool definition in context is a potential hallucination anchor. With 500 tools, the model might blend parameters from tool A with the name of tool B. With 100,000 tools, this combinatorial confusion becomes the dominant failure mode. The model doesn't fail to find the tool — it confidently selects a chimera that doesn't exist.

**Cost scales linearly, accuracy doesn't.** Even at 2028 prices, 10M tokens of context per request is not free. And you're paying that cost for worse accuracy than a 5-tool retrieval window. The economics point firmly toward retrieve-then-generate, not stuff-and-pray.

The 10M token window will be transformative for many tasks — analyzing entire codebases, processing long documents, maintaining conversation history. But for tool selection, it's a trap. The right architecture is small, curated context windows with high-quality retrieval feeding them.

## Planning vs. interleaving: let the model decide

Should an agent plan all its tool calls upfront, then execute them sequentially? Or should it interleave — call one tool, observe the result, plan the next call?

The research is clear: **interleaving wins for novel tasks, planning wins for routine ones.**

When an agent has seen a similar task before (via execution history or few-shot examples), a full plan upfront reduces latency by 2-3x because you eliminate the round-trips between LLM calls. The model generates a DAG of tool calls, the execution layer parallelizes independent branches, and results flow back in one batch.

When the task is novel — the agent hasn't seen this tool combination before, or the first tool's output determines which tool to call next — interleaving is the only viable strategy. Forcing a plan leads to hallucinated intermediate values and cascading errors.

The execution layer should support both modes and let the model choose. At TPMJS, agents can emit either a single tool call (interleaving) or a structured plan with dependencies. The infrastructure handles both — the model shouldn't have to care about execution strategy.

## Learning from execution history

This is the most underexplored dimension of tool infrastructure. When an agent successfully completes a task using tools A, B, and C in sequence, that execution trace is a training signal. Not for fine-tuning the model — for improving retrieval and planning.

**Execution traces as few-shot examples.** When a new query resembles a previous successful execution, inject the trace as a few-shot example. "Last time a user asked to 'monitor a website for changes,' you used \`firecrawl--scrape\` followed by \`diff--compare\`. Here are those tools." This is dramatically more effective than raw tool descriptions because it shows the model a proven composition pattern.

**Co-occurrence signals for retrieval.** Tools that frequently appear together in successful executions should be retrieved together. If \`github--get-pr\` is almost always followed by \`github--list-reviews\`, retrieving one should boost the other's ranking. This is collaborative filtering applied to tool selection — the same algorithm that powers "customers who bought X also bought Y."

**Failure traces as negative examples.** When an execution fails — wrong tool selected, parameters malformed, timeout — that trace should suppress similar retrievals in the future. A tool with a 10% success rate should be ranked below a tool with 90% success rate, even if their descriptions are equally relevant.

## What to build for

The execution layer of 2027 looks like this: a retrieval pipeline that selects 5-7 tools from a catalog of 100,000+, compresses their schemas to ~50 tokens each using TypeScript signatures, enriches the selection with execution history from similar past queries, and hands the model a tight, high-signal context window. The model writes TypeScript code against typed interfaces rather than emitting JSON tool calls. The execution environment runs that code in a sandbox, with intermediate data staying in the sandbox rather than flowing back through the model's context.

The models will get better at tool selection. They'll get longer context windows. Inference will get cheaper. None of that eliminates the need for this architecture — it makes the architecture more valuable, because the retrieval layer is what lets you scale from 100 tools to 100,000 without degrading the model's performance on each individual call.

Build the retrieval layer. Compress the schemas. Record the execution traces. The models will meet you there.
`,
  },
  {
    slug: 'every-collection-is-an-mcp-server',
    title: 'Every Collection Is an MCP Server',
    description:
      'TPMJS turns every tool collection into a live MCP endpoint. One URL, three tool sources, zero infrastructure. Here is how it works and why it matters.',
    author: 'Thomas Davis',
    date: '2026-03-23',
    tags: ['mcp', 'collections', 'infrastructure', 'ai-tools', 'architecture'],
    content: `
## The problem with MCP servers today

Setting up an MCP server is still too hard.

You need a runtime, a deployment target, auth middleware, rate limiting, schema validation, logging, and monitoring. Each server is its own little microservice. If you want to expose 10 tools from 3 different sources, you're running 3 servers and configuring 3 endpoints in your client.

This is the plumbing problem. Developers don't want to manage plumbing — they want to give their agent access to tools and get back to work.

## What if every collection was already an MCP server?

That's what TPMJS does. When you create a collection of tools on [tpmjs.com](https://tpmjs.com), you automatically get a live MCP endpoint:

\`\`\`
https://tpmjs.com/@yourname/collections/my-tools/mcp
\`\`\`

No deployment. No Dockerfile. No server to maintain. You curate the tools, we handle the rest.

Add it to Claude Desktop, Cursor, Windsurf, or any MCP client:

\`\`\`json
{
  "mcpServers": {
    "my-tools": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-remote",
               "https://tpmjs.com/@yourname/collections/my-tools/mcp"]
    }
  }
}
\`\`\`

That single URL serves a fully compliant MCP endpoint with JSON-RPC 2.0, tool discovery via \`tools/list\`, and execution via \`tools/call\`. It handles authentication, rate limiting, environment variable resolution, and execution tracking — all invisible to the client.

## Three tool sources, one endpoint

The interesting part isn't just hosting registry tools as MCP. It's that a single collection endpoint can unify three completely different tool sources:

### 1. Registry tools

These are npm packages from the TPMJS registry — tools that have been discovered, validated, schema-extracted, and health-checked by our pipeline. You browse the registry, add tools to your collection, and they're immediately available via MCP.

\`\`\`
tools/list → [
  { name: "firecrawl__scrapeTool", ... },
  { name: "openai__dall-e-generate", ... },
  { name: "resend__send-email", ... }
]
\`\`\`

Each tool runs in an isolated Deno executor on Railway. The collection stores encrypted environment variables (API keys etc.), so your agent can call tools without leaking credentials into the conversation.

### 2. Bridge tools

Bridge tools come from MCP servers running on your local machine. You run the TPMJS bridge CLI, which connects your local servers (filesystem access, database tools, IDE integrations) to the cloud. The bridge maintains a WebSocket connection and routes tool calls back to your machine.

This means your cloud-hosted collection can include tools that run locally. An agent using your MCP endpoint can read your local files, query your local database, or interact with your IDE — all through the same \`tools/call\` interface.

The bridge checks for staleness (2-minute timeout on last heartbeat) and degrades gracefully if the connection drops.

### 3. Custom MCP servers

You can register any remote MCP server (your own, a third party's) and cherry-pick individual tools from it into your collection. TPMJS syncs the tool definitions, caches them locally, and proxies \`tools/call\` requests to the remote server.

This is the aggregation pattern: instead of configuring 5 MCP servers in your client, you configure 1 TPMJS collection that pulls tools from all 5. The cached definitions mean tools still appear in \`tools/list\` even if a remote server is temporarily down — the call will fail, but discovery doesn't break.

## How auth works

MCP auth has been a pain point across the ecosystem. TPMJS takes a layered approach:

**Public collections** require no authentication for discovery. Anyone can call \`initialize\` and \`tools/list\` without a token. This is important — agents need to discover what tools are available before deciding whether to authenticate.

**Tool execution** on public collections works two ways:
- **Collection owners** have their encrypted env vars automatically resolved. Your API keys are stored server-side, so the agent never sees them.
- **Non-owners** must pass their own env vars in the \`tools/call\` request. If required vars are missing, the server returns a structured error listing exactly which vars are needed and their descriptions.

**Private collections** require a Bearer token (TPMJS API key) for all operations. Non-owners can't even discover that the collection exists — they get a 404, not a 401.

Rate limiting is tier-based: 1,000 requests/hour on the free plan, 10,000/hour on pro. Headers follow the standard \`X-RateLimit-*\` convention so clients can back off gracefully.

## Execution tracking

Every \`tools/call\` gets tracked as an execution event — fire-and-forget, so it doesn't add latency to the response. The event captures:

- Tool name, package, collection
- User and API key (if authenticated)
- Status (success/error) and duration
- Input arguments and output summary

This feeds the analytics dashboard, but more importantly, it builds a dataset of real tool usage patterns. Which tools get called together? What argument patterns produce errors? Which tools are slow? This data will eventually power smarter tool selection — the "Tool RAG" system described in our previous post.

## Why this matters

The MCP ecosystem has a fragmentation problem. Every tool author ships their own server. Every user configures a dozen endpoints. Every agent has a different setup.

Collections-as-MCP-servers is our answer to that. Instead of "here's a server you need to deploy," it's "here's a URL." Instead of "pick one protocol," it's "your collection works everywhere" — the same tools are accessible via MCP, REST API, CLI, and SDK simultaneously.

The endgame isn't that everyone uses TPMJS. It's that the pattern — curated, authenticated, multi-source tool bundles served over a standard protocol — becomes the default way agents discover and use tools. We're building the npm for AI tools, and every collection is a package that runs itself.

---

*Try it: [create a collection](https://tpmjs.com/dashboard/collections) and add your MCP endpoint to Claude Desktop in under a minute.*
`,
  },
  {
    slug: 'one-mcp-server-entire-registry',
    title: 'One MCP Server, the Entire Registry',
    description:
      'The TPMJS master MCP server gives any AI agent two tools: search_tools and execute_tool. That is all you need to access hundreds of tools without configuring anything.',
    author: 'Thomas Davis',
    date: '2026-03-23',
    tags: ['mcp', 'registry', 'ai-tools', 'architecture', 'search'],
    content: `
## The MCP configuration problem

Every MCP server you want to use needs its own entry in your config. GitHub tools? One server. Slack tools? Another. Web scraping? A third. Your \`claude_desktop_config.json\` ends up looking like this:

\`\`\`json
{
  "mcpServers": {
    "github": { "command": "npx", "args": ["@anthropic/mcp-remote", "..."] },
    "slack": { "command": "npx", "args": ["@anthropic/mcp-remote", "..."] },
    "firecrawl": { "command": "npx", "args": ["@anthropic/mcp-remote", "..."] },
    "postgres": { "command": "npx", "args": ["@anthropic/mcp-remote", "..."] },
    "resend": { "command": "npx", "args": ["@anthropic/mcp-remote", "..."] }
  }
}
\`\`\`

Five servers. Five processes. Five sets of tool definitions injected into your context window. And you had to know about each one in advance — you can't discover tools you don't already have configured.

What if the agent could find the right tool at runtime?

## Two tools to rule them all

The [TPMJS master MCP server](https://tpmjs.com/api/mcp/registry/http) exposes exactly two tools: \`search_tools\` and \`execute_tool\`. That's it. With those two tools, an agent can search a registry of hundreds of tools and execute any of them on the fly.

\`\`\`json
{
  "mcpServers": {
    "tpmjs": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-remote",
               "https://tpmjs.com/api/mcp/registry/http"]
    }
  }
}
\`\`\`

One server. One config entry. Access to the entire registry.

### search_tools

The agent describes what it needs in natural language. The server searches the TPMJS registry using BM25 relevance scoring — tokenizing camelCase, matching against tool names, descriptions, package names, and tags.

\`\`\`json
{
  "name": "search_tools",
  "arguments": {
    "query": "send email with html template",
    "limit": 5
  }
}
\`\`\`

The response includes everything the agent needs to decide: tool name, package name, description, input schema, version, quality score, and health status. The agent reads the schemas, picks the best match, and calls it — all within the same conversation turn.

### execute_tool

Once the agent picks a tool, it calls \`execute_tool\` with the package name, tool name, and arguments:

\`\`\`json
{
  "name": "execute_tool",
  "arguments": {
    "packageName": "@tpmjs/tools-resend",
    "toolName": "sendEmail",
    "arguments": {
      "to": "user@example.com",
      "subject": "Hello",
      "html": "<h1>Hi there</h1>"
    },
    "env": {
      "RESEND_API_KEY": "re_..."
    }
  }
}
\`\`\`

The tool runs in an isolated Deno executor on TPMJS infrastructure. The agent never needs to install anything, manage dependencies, or configure a runtime. It searched, it found, it executed.

## How the search actually works

We don't use vector embeddings or LLM-based search. The registry search is BM25 — the same algorithm that powers Elasticsearch and most traditional search engines. It's fast, deterministic, and good enough for tool discovery where queries map closely to tool names and descriptions.

The scoring pipeline:

1. **Tokenize** the query and each tool's text (name + description + package + tags)
2. **Split camelCase** — \`sendEmailTemplate\` becomes \`["send", "email", "template"]\`
3. **Calculate IDF** (inverse document frequency) for each query term across the corpus
4. **Score** each document using BM25 with k1=1.5, b=0.75
5. **Return** the top N results sorted by relevance

We fetch up to 200 candidate tools from the database, score them all, and return the top matches. For a registry of our current size this is plenty fast — sub-100ms including the database round trip.

## Auth model: search free, execute authenticated

Discovery should be free. If an agent can't even see what tools exist without an API key, you've created a chicken-and-egg problem — the user needs to know what's available before they'll bother setting up auth.

So we split it:

- **\`initialize\`**, **\`tools/list\`**, and **\`search_tools\`** work without authentication. Any MCP client can connect, discover the two meta-tools, and search the registry without a token.
- **\`execute_tool\`** requires a TPMJS API key via Bearer token, with the \`mcp:execute\` scope. This is where rate limiting and usage tracking kick in.

This means an agent can be configured with just the endpoint URL and immediately start searching. When it finds a tool worth executing, it prompts for authentication — or uses a pre-configured key.

Rate limits are tier-based: 1,000 requests/hour on free, 10,000/hour on pro. Standard \`X-RateLimit-*\` headers are returned so clients can throttle gracefully.

## The runtime discovery pattern

This is a fundamentally different model from static MCP configuration. Instead of:

1. Human browses tool catalogs
2. Human picks tools
3. Human configures MCP servers
4. Agent uses pre-configured tools

It becomes:

1. Agent receives a task
2. Agent searches for relevant tools (\`search_tools\`)
3. Agent evaluates schemas and picks the best match
4. Agent executes the tool (\`execute_tool\`)

The agent discovers tools at runtime based on what it actually needs, not what someone pre-configured. This is closer to how a developer works — you don't install every npm package before starting a project. You encounter a problem, search for a package, read the docs, and install it.

## What this enables

**Agents that grow their own capabilities.** A coding agent that encounters a PDF it needs to parse can search for PDF tools, find one, and use it — without the user ever configuring a PDF MCP server.

**Smaller context windows.** Instead of injecting 43 tool definitions upfront (the GitHub MCP problem from [our first post](/blog/mcp-vs-cli-vs-rest)), the agent starts with 2 tool definitions and dynamically loads only what it needs.

**Tool composition without pre-planning.** An agent working on a data pipeline might search for CSV parsing, then search for a charting tool, then search for an email tool to send the results — discovering and chaining tools across a single conversation.

**A universal tool layer.** Any MCP client — Claude Desktop, Cursor, Windsurf, a custom agent — can connect to one endpoint and gain access to the entire registry. Tool authors publish once to npm with the \`tpmjs\` keyword, and their tools become discoverable and executable by every agent connected to the registry.

## Both transports

The server supports both MCP transport types at separate endpoints:

- **HTTP Streamable**: \`POST /api/mcp/registry/http\` — standard request/response
- **SSE**: \`POST /api/mcp/registry/sse\` — server-sent events for streaming

Both implement the same JSON-RPC 2.0 protocol. Use whichever your client supports. The \`GET\` endpoints return server metadata so clients can auto-discover capabilities.

## Try it

Add this to your MCP client config:

\`\`\`json
{
  "mcpServers": {
    "tpmjs": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-remote",
               "https://tpmjs.com/api/mcp/registry/http"]
    }
  }
}
\`\`\`

Then ask your agent to search for tools. It will find \`search_tools\`, use it, and from there it can find and execute anything in the registry.

Get an API key at [tpmjs.com/dashboard/api-keys](https://tpmjs.com/dashboard/api-keys) to unlock \`execute_tool\`.

---

*The master registry server is open and live at [tpmjs.com/api/mcp/registry/http](https://tpmjs.com/api/mcp/registry/http). Two tools, entire registry.*
`,
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getAllPosts(): BlogPost[] {
  return [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
