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

I've spent the last year building [TPMJS](https://tpmjs.com), a registry for AI tools. We serve tools over CLI, MCP, REST, and SDK simultaneously. That forces you to think clearly about what each protocol is actually good at, because you can't play favorites when you have to support all of them.

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

But they're measuring the wrong thing.

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
- **LLMs are great at bash.** As [Manveer C. notes](https://manveerc.substack.com/p/mcp-vs-cli-ai-agents), LLMs are trained on billions of Unix pipe examples — zero examples of MCP composition patterns. CLI is the *native* interface.
- **Natural composition.** \`terraform show -json plan.out | jq\` — no protocol needed. Holmes is right that CLIs compose through piping in a way MCP can't match.
- **Existing auth works.** \`aws profiles\`, \`gh auth login\`, \`kubeconfig\` — these work identically for humans and agents.

### MCP — GUI editors and enterprise

**Best for:** Claude Desktop, Cursor, Windsurf, any editor without a shell. And anywhere you need audit trails.

\`\`\`bash
claude mcp add my-tools \\
  https://tpmjs.com/@you/collections/my-tools/mcp \\
  -t http
\`\`\`

Why MCP wins here:

- **These environments don't have a shell.** MCP is the only structured way to give a GUI editor access to external tools.
- **Discovery is built in.** The editor can enumerate available tools and their schemas without the user doing anything.
- **Security properties CLI can't match.** OAuth 2.1, agent identity, delegation chains, consent flows. More on this below.
- **Structured logging for free.** JSON-RPC gives you machine-readable audit trails. More on this below too.

As [Matthew Hall argues](https://matthewhall.com/posts/mcp-isnt-dead-were-just-early/), "CLI output is inconsistent, poorly documented, and changes between versions without warning." HTTP + OAuth MCP servers (Linear, Granola are already shipping this way) eliminate local process management entirely. The current messiness mirrors REST standardization circa 1999.

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

MCP has real problems — the ecosystem is fragmented, server quality varies wildly, and there's no good registry or discovery story. But the protocol fills a gap nothing else does.

### "MCP is the future"

Not universally. In Claude Code, MCP adds 4-32x token overhead to do something the model already does natively with bash. Holmes reports "lost count of the times I've restarted Claude Code because an MCP server didn't come up." Protocol complexity has a cost.

### "Just use REST"

REST is right for your backend. It's wrong for an AI agent in an editor. As the [MCP GitHub discussion](https://github.com/modelcontextprotocol/modelcontextprotocol/discussions/1093) notes, REST is HTTP-only while MCP supports stdio, SSE, and other transports. MCP enables bidirectional, server-initiated communication. REST requires polling. MCP provides first-class stateful operations — login, transactions with rollback. REST doesn't.

Also, "just use REST" hand-waves away the hardest part: the agent needs to *discover* what endpoints exist. Dumping an entire OpenAPI spec into context is just as wasteful as MCP's tool definitions.

### "CLI is all you need"

Only if your entire world is a terminal. The moment you're in a GUI editor, a web app, or a mobile context, CLI doesn't help. And as [Mathew Pregasen points out](https://dev.to/mathewpregasen/mcp-vs-cli-tools-which-is-best-for-production-applications-bd8), models struggle with non-ASCII strings, unconventional CLI args, and newline characters through shell arguments. CLI has difficult state maintenance across multi-step commands and is vulnerable to prompt injection in shell args.

## The real mistake

Every take picks ONE context and universalizes:

| Claim | True for | False for |
|-------|----------|-----------|
| "CLI is better" | Terminal agents | GUI editors, web apps |
| "MCP is the future" | Claude Desktop, Cursor | Terminal agents, backends |
| "Just use REST" | Backends, serverless | Editor integrations |
| "SDK only" | TypeScript apps | Non-JS, non-code contexts |

The protocol is a transport detail. It's the last mile. As Manveer C. puts it: "Protocol is plumbing. Interface design is architecture."

But there are two dimensions to this debate that change everything, and the CLI advocates consistently ignore both.

## If you kill MCP, you don't care about security

This is the argument that the "just use CLI" and "just use REST" crowd hand-waves away. And it's the one that matters most at scale.

### Why CLIs calling APIs aren't secure enough

CLI works great for dev use cases. But let's think about what happens when you try to make it work for real users at scale.

**Not everyone will download a CLI.** Sure, you can package it invisibly inside the agent. But then you have to figure out auth. Non-developers aren't going to open the Google Cloud Console and generate API keys. So you need OAuth — you need users to authenticate the CLI.

Here's where it gets messy:

1. **The consent screen is confusing.** The user is authenticating a CLI they might not even know exists — not the agent they're actually talking to.
2. **Device flow is awkward.** Existing CLIs using device flow require the agent to read codes, display them to users, navigate them through approval. The user has no mental model of "the CLI" — they just want the agent to work.
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

**The CLI client ID is public.** The CLI binary is distributed to everyone — anyone can inspect it, extract the client ID, and impersonate it. Unless you add something like DeviceCheck on macOS, you can't guarantee it's actually the CLI making the request. So "just a CLI" is already leaking trust assumptions.

**The API never knows who the agent is.** This is the one that kills security at scale. You can't apply policy based on agent identity. If the company exposing the API has a partnership with AI Lab A but not AI Lab B, it can't distinguish between them. The token says "some user via some CLI" — not "Claude via TPMJS acting on behalf of this user."

This gets worse when you think about agents calling agents. In a chain of Agent A → Agent B → Agent C, ideally you'd track the full delegation:

\`\`\`json
{
  "aud": "api.google.com/drive",
  "sub": "user-id-123",
  "client_id": "agent1",
  "act": ["agent1", "agent2", "agent3"]
}
\`\`\`

CLI-to-API gives you none of this. The API sees one opaque token and has no idea what's behind it.

### Why raw APIs aren't enough either

I actually like "code mode" — having fixed, deterministic integration code I can review. You can do code mode against any API or MCP server. But what does it actually take to make a raw API secure for agent use?

**1. Dynamic client registration.** You don't want every user to manually create a client ID and secret. You need the ability for agents to register themselves and for users to consent to access without visiting a developer portal. Non-devs will never do that. Ideally this registration is trusted — client ID metadata documents using certificates so the API knows who clients really are.

**2. OAuth consent, not API keys.** API keys are fine for server-to-server. But for anything touching user data, you need proper OAuth so users can only access their own data. There is no "master Google API key" you give to everyone. For internal enterprise use cases, you *could* create a shared API key — but then to prevent Employee A from reading Employee B's email, you'd need to implement authorization *in the client*. Putting security enforcement in the client is how you get breaches.

**3. Sensitive action approval.** If the agent is about to delete a production database or send an email as the CEO, you want a human in the loop. Again, you *could* implement this in the client. But putting the onus on the client for security checks is exactly the mistake we learned not to make in web development. You do auth on the server. You don't trust that the browser did it.

**4. Good agent experience (AX).** Your API needs clear documentation, intuitive patterns, and maybe even a dedicated agent-facing API with different operations — grouping endpoints into higher semantic actions, removing endpoints that agents shouldn't touch, adding endpoints for agent-specific workflows.

As someone who has worked on auth — both building APIs and helping others build them — I would love it if all APIs looked like this. I know they don't. Most APIs weren't designed for agents, and retrofitting these properties is a massive undertaking.

### The punchline

If you do all four of those things to your REST API — dynamic client registration, OAuth consent, action approval, and good AX — congratulations. **You just reinvented MCP.**

That's not a coincidence. MCP exists because these are the properties you need for secure agent-to-service communication. The protocol is the crystallization of what "doing it right" looks like.

Does MCP have problems? Absolutely. Context bloat is real. There are features MCP doesn't need. Most MCP servers aren't there yet on quality. The ecosystem is immature.

But killing MCP because "CLI is simpler" or "REST is universal" means you either:

1. Don't care about security at scale, or
2. Will end up rebuilding MCP's security properties inside your own stack anyway

### A note on MCP's own security problems

I should be honest here: MCP's security track record is not great. [Simon Willison documented](https://simonwillison.net/2025/Apr/9/mcp-prompt-injection/) tool shadowing attacks where tools mutate definitions post-install to redirect API keys. [AuthZed compiled a timeline](https://authzed.com/blog/timeline-mcp-breaches) of real MCP breaches — WhatsApp chat histories exfiltrated via tool poisoning, GitHub private repos leaked, a CVE in mcp-remote affecting 437,000+ downloads, sandbox escapes via symlinks.

[Shrivu Shankar's "Everything Wrong with MCP"](https://blog.sshh.io/p/everything-wrong-with-mcp) catalogs the full damage: MCP shipped without an auth spec, local stdio creates a "low-friction path for exploitation," and MCP tools can force agents to include backdoors in generated code.

This is real and serious. But here's the distinction: these are *implementation* failures, not *architectural* ones. The security properties MCP provides — agent identity, consent, delegation — are the right properties. The ecosystem just hasn't implemented them well yet. CLI doesn't even attempt to provide them.

## MCP gives you logging for free. CLI doesn't.

There's another advantage the token-counters ignore: **observability**.

MCP is JSON-RPC 2.0. Every request and response is structured, machine-readable JSON with a mandatory ID field that pairs them together:

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

Every tool call has: the tool name, the exact parameters, the exact result, a correlation ID, and a timestamp. You can pipe this directly into [Datadog](https://www.datadoghq.com/blog/mcp-client-monitoring/) (which already supports MCP natively), Splunk, or any SIEM system. You get a complete audit trail of every action every agent took, structured and queryable.

Now try that with CLI.

CLI output is stdout — unstructured text. The format varies per tool. Table widths change. Column names are inconsistent. Errors go to stderr, sometimes mixed with progress output. There's no correlation ID linking a command invocation to its output. If two CLI calls run concurrently, the outputs interleave.

You *can* make CLI output structured by always using \`--json\` flags. But that's opt-in, tool-by-tool, and there's no standard. Every tool implements its own JSON format. There's no request/response pairing. There's no trace ID. When something fails, you get a text error message that your logging system has to parse with regex.

This matters for three reasons:

**Debugging.** When an agent misbehaves, MCP logs show you exactly what tool was called, with what parameters, and what came back. CLI logs show you "the agent ran some command and here's some text that came out." Good luck doing root cause analysis on that.

**Compliance.** If you're in a regulated industry — finance, healthcare, government — you need audit trails of every action an agent takes on behalf of a user. MCP gives you this out of the box. CLI gives you a pile of text files to parse.

**Monitoring at scale.** An MCP gateway sitting between agents and servers can enforce uniform logging, attach correlation IDs across multi-step workflows, and feed structured data into dashboards. Try building that on top of N different CLI tools with N different output formats.

The "CLI is fewer tokens" argument is real. But tokens are cheap and getting cheaper. Audit trails, debugging, and compliance are expensive to retrofit.

## The token bloat problem is being solved

The CLI advocates' strongest argument — the 4-32x token overhead — is a real problem that's being actively solved. It would be dishonest not to acknowledge the progress:

- [Anthropic's own engineering team](https://www.anthropic.com/engineering/code-execution-with-mcp) proposed presenting MCP servers as code APIs: agents discover tools by exploring directories instead of loading all definitions upfront. **150,000 → 2,000 tokens. 98.7% reduction.**
- [Speakeasy's dynamic toolsets](https://www.speakeasy.com/blog/how-we-reduced-token-usage-by-100x-dynamic-toolsets-v2) separate discovery from schema loading with three functions: \`search_tools\`, \`describe_tools\`, \`execute_tool\`. **96.7% input token reduction**, 100% success rate.
- [Phil Schmid's MCP CLI](https://www.philschmid.de/mcp-cli) uses dynamic context discovery. Benchmark with 6 MCP servers and 60 tools: **47,000 → 400 tokens. 99% reduction.**
- Claude Code's deferred tool loading achieved a **46.9% reduction** (51K → 8.5K).
- Scalekit showed that an [MCP gateway with schema filtering](https://www.scalekit.com/blog/mcp-vs-cli-use) drops monthly costs from $55.20 to ~$5 — bringing it within range of CLI's $3.20.

The gap is closing fast. Static MCP (dump all schemas) is 10-32x more expensive than CLI. Dynamic MCP (lazy loading) is approaching parity.

## The full comparison

Here's how the four protocols stack up across every dimension that matters. No protocol wins everywhere — that's the point.

### Performance

| | CLI | MCP | REST | SDK |
|--|-----|-----|------|-----|
| **Token cost** | ~50 per call | ~200 per call (static: 30K+) | N/A (server-side) | N/A (in-process) |
| **Latency** | High (process spawn) | Medium (JSON-RPC) | Medium (HTTP) | Very low (native) |
| **Cold start** | Slow (new process each call) | Fast (persistent server) | Fast (connection pool) | None |
| **Throughput** | Low (sequential) | Medium (multiplexed) | High (HTTP/2) | Very high |
| **Reliability** | High (100% in benchmarks) | Lower (72% in benchmarks) | High | Very high |

### Security

| | CLI | MCP | REST | SDK |
|--|-----|-----|------|-----|
| **Agent identity** | None | OAuth 2.1 client ID | API key / OAuth | Library-dependent |
| **User consent** | Awkward device flow | Standardized OAuth | Custom UI needed | Custom code |
| **Delegation chain** | Not possible | \`act\` claim support | Scoped tokens | Flexible |
| **Secret management** | Env vars (exposed) | Opaque to agent | Server-side | Native |
| **Permission scoping** | None | Scope-based | Endpoint-based | Function-based |
| **Prompt injection risk** | Shell injection | Tool poisoning, shadowing | Input validation | Type-checked |

### Observability

| | CLI | MCP | REST | SDK |
|--|-----|-----|------|-----|
| **Structured logging** | Poor (text parsing) | Excellent (JSON-RPC) | Good (HTTP + JSON) | Excellent (native) |
| **Request/response pairing** | None | Built-in (mandatory ID) | Manual (headers) | Native (return values) |
| **Audit trail** | Text files, regex | Structured, queryable | With proper logging | With proper logging |
| **Compliance readiness** | Low | High | Medium | Medium |
| **Debugging** | Manual, fragile | Exact payloads, trace IDs | HTTP tools | Debugger, IDE |

### Developer Experience

| | CLI | MCP | REST | SDK |
|--|-----|-----|------|-----|
| **Setup complexity** | Very low (install binary) | Low (stdio or URL) | Medium (HTTP + auth) | Very low (import) |
| **Type safety** | None (string parsing) | JSON Schema | OpenAPI codegen | Native types |
| **Discovery** | \`--help\`, docs | Built-in introspection | OpenAPI/Swagger | IDE autocomplete |
| **Error handling** | Text-based, fragile | Structured error codes | HTTP status codes | Exceptions |
| **Reliability** | Fragile (output format changes) | Stable (versioned schema) | Stable (API versioning) | Very stable |
| **Training data** | Billions of examples | Near zero | Moderate | Moderate |

### User Experience

| | CLI | MCP | REST | SDK |
|--|-----|-----|------|-----|
| **Non-developer usability** | Poor (terminal required) | Excellent (invisible) | Good (web UI) | N/A (code only) |
| **Action approval** | None | Standardized | Custom UI | Custom code |
| **Transparency** | Opaque | Full audit trail | API logs | Code review |
| **Granular permissions** | None | Scope-based, time-limited | Endpoint-based | Function-based |

### Ecosystem

| | CLI | MCP | REST | SDK |
|--|-----|-----|------|-----|
| **Adoption** | Mature, fragmented | Growing fast (5000+ servers) | Universal | Per-language |
| **Standards** | None (tool-specific) | MCP spec + governance | RFC, OpenAPI | Language specs |
| **Client support** | Every OS | Claude, Cursor, Windsurf, VS Code | Every language | Per-framework |
| **Tooling** | Mature | Rapid growth | Very mature | Mature |

### Architecture

| | CLI | MCP | REST | SDK |
|--|-----|-----|------|-----|
| **Statefulness** | Stateless (by nature) | Flexible (session-based) | Stateless (HTTP) | Flexible |
| **Transport** | stdout/stderr | Stdio, HTTP, WebSocket | HTTP/1.1, HTTP/2 | In-process |
| **Connection model** | Spawn per call | Persistent session | Per-request | No network |
| **Error recovery** | Retry in agent | Built-in semantics | HTTP retry | Exception handling |
| **Exactly-once** | No mechanism | Request IDs | Idempotency keys | Native |
| **Bidirectional** | No | Yes (server-initiated) | No (polling) | N/A |

### The takeaway from the matrix

- **CLI** wins on token efficiency, setup simplicity, and training data. Loses on security, observability, and reliability for non-text outputs.
- **MCP** wins on security, observability, non-dev UX, and bidirectional communication. Loses on token cost (though closing fast) and ecosystem maturity.
- **REST** wins on universality and ecosystem maturity. Loses on agent-specific UX and requires building security yourself.
- **SDK** wins on everything except reach — it only works if you're writing code in a supported language.

No single protocol dominates. The right choice depends on your context — which is exactly why the "X is dead" takes are always wrong.

## The emerging consensus

After reading everything written on this topic, the debate has actually converged more than Twitter would suggest:

1. **Raw MCP with static tool loading is wasteful.** Everyone agrees. The solutions — dynamic discovery, code execution patterns, Skills abstractions — all converge on lazy/on-demand loading.
2. **CLI wins for developer-facing terminal workflows.** The training data advantage is real and measurable. For coding agents and infrastructure automation, CLI is cheaper, faster, and more reliable.
3. **MCP wins for enterprise, multi-tenant, and non-developer contexts.** OAuth delegation, audit trails, structured tool boundaries, and serving users who don't have terminals justify the overhead.
4. **The smartest teams use hybrid architectures.** CLI for development, MCP for customer-facing features, unified behind an abstraction layer that hides the transport choice. Both Claude Code and [Cowork](https://manveerc.substack.com/p/mcp-vs-cli-ai-agents) already do this with "Skills" — the agent calls a Skill regardless of whether it's backed by CLI or MCP.
5. **MCP's survival depends on solving context efficiency.** Progressive discovery and dynamic toolsets are closing the token gap from 32x down to near-parity. If this continues, the token argument evaporates.

## What actually matters

The protocol debate distracts from the hard problems that nobody seems to be solving:

**How do you find tools that work?** There are thousands of MCP servers and npm packages claiming to be AI tools. Most of them are broken, undocumented, or abandoned. [Merge.dev lists](https://www.merge.dev/blog/mcp-challenges) "poor maintenance — servers launched for marketing receive minimal support" as a top MCP challenge. The protocol doesn't help you find the good ones.

**How do you know a tool is safe to run?** You're giving an AI agent the ability to execute arbitrary functions. [Shrivu Shankar found](https://blog.sshh.io/p/everything-wrong-with-mcp) that "LLM-reliability often negatively correlates with the amount of instructional context" — more tools paradoxically reduces performance. Tau-Bench showed Claude 3.7 Sonnet achieving only 16% task completion on airline booking scenarios. The protocol doesn't tell you which tools actually work.

**How do you compose tools into workflows?** An agent needs a web scraper, a summarizer, and a Slack notifier. How does it find those, wire them together, and handle failures? The protocol is the least interesting part of that stack.

**How do you version and update tools without breaking agents?** Tool schemas change. Endpoints move. Auth requirements evolve. The protocol doesn't solve compatibility.

These are registry problems, trust problems, and quality problems. They're harder than protocol design, which is probably why people would rather argue about MCP on Twitter.

## The TPMJS approach

We built TPMJS around a simple premise: **write the tool once, serve it everywhere.**

A tool author publishes a Zod-schema'd function to npm. TPMJS indexes it, health-checks it, quality-scores it, and makes it available over every protocol:

- **CLI** — \`tpm tool search\`, \`tpm tool execute\` (fewest tokens, best for terminal agents)
- **MCP** — Every collection is an MCP server endpoint (structured auth, best for editors)
- **REST** — Standard API with Bearer auth (universal, best for backends)
- **SDK** — \`@tpmjs/registry-search\` and \`@tpmjs/registry-execute\` (type-safe, best for code)

The consumer picks the protocol that fits their context. The tool doesn't change — only the transport does.

CLI for dev speed. MCP for security and editor integration. REST for universality. SDK for type safety. They're not competing — they're complementary.

## The bottom line

Stop arguing about protocols as if one must win.

Use CLI where it's fast and you control the environment. Use MCP where you need auth, consent, agent identity, and audit trails. Use REST where you need universality. Use SDK where you need type safety.

But don't pretend that killing MCP is free. The security properties it provides — agent identity, delegated auth, consent flows, action approval — don't go away just because you chose a different transport. The observability it provides — structured logging, correlation IDs, machine-readable audit trails — doesn't appear magically in your CLI output. You'll either build these yourself, or you'll ship without them.

And shipping without them is how we get the next generation of security incidents.

The protocol is the envelope. The tool is the letter. But the envelope has a wax seal for a reason — and breaking it has consequences.
`,
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getAllPosts(): BlogPost[] {
  return [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
