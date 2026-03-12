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
      'Everyone is debating which protocol wins for AI tools. They are all right — in their context. Here is why the protocol is a transport detail, and what actually matters.',
    author: 'Thomas Davis',
    date: '2026-03-13',
    tags: ['mcp', 'cli', 'rest', 'ai-tools', 'opinion'],
    content: `
## The debate

Open Twitter on any given day and you'll find the same fight:

- "MCP is dead."
- "MCP is the future."
- "Just use REST, why do we need another protocol?"
- "CLI is all you need."

They're all right — **in their context**. The mistake is universalizing from one context to all contexts.

I've spent the last year building [TPMJS](https://tpmjs.com), a registry for AI tools. We serve tools over CLI, MCP, REST, and SDK simultaneously. That forces you to think clearly about what each protocol is actually good at, because you can't play favorites when you have to support all of them.

Here's what I've learned.

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

- **Fewest tokens.** A CLI call costs ~50 tokens. MCP costs ~200 for the same operation. When you're paying per token or fighting context limits, 4x overhead matters.
- **LLMs are great at bash.** Claude Code doesn't need a structured tool interface — it already knows how to invoke commands, pipe output, parse JSON flags, and chain results. CLI is the *native* interface.
- **No overhead.** No handshake. No server. No schema negotiation. No JSON-RPC envelope. Just stdin/stdout.

The insight: for terminal-native agents, adding a protocol layer *gets in the way* of something the model is already good at.

### MCP — GUI editors

**Best for:** Claude Desktop, Cursor, Windsurf, any editor without a shell.

\`\`\`bash
claude mcp add my-tools \\
  https://tpmjs.com/@you/collections/my-tools/mcp \\
  -t http
\`\`\`

Why MCP wins here:

- **These environments don't have a shell.** MCP is the only structured way to give a GUI editor access to external tools.
- **Discovery is built in.** The editor can enumerate available tools and their schemas without the user doing anything.
- **One URL, instant connection.** Open protocol with multiple client implementations.

The JSON-RPC envelope adds overhead, but that's the cost of working in an environment where there's no terminal to fall back on.

### REST — Backends and serverless

**Best for:** Web apps, microservices, serverless functions, anything server-side.

\`\`\`bash
curl -X POST https://tpmjs.com/api/tools/execute \\
  -H "Authorization: Bearer $TPMJS_KEY" \\
  -d '{"tool":"firecrawl--scrape","input":{"url":"..."}}'
\`\`\`

Why REST wins here:

- **Universal.** No special client, no protocol library, no runtime dependency. Every language knows how to POST JSON.
- **No opinions.** REST doesn't care about your framework, your language, or your AI provider.
- **Battle-tested.** Auth, caching, rate limiting, monitoring — the entire HTTP ecosystem applies.

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

MCP has problems — the ecosystem is fragmented, server quality varies wildly, and there's no good registry or discovery story. But the protocol itself fills a real gap.

### "MCP is the future"

Not universally. In Claude Code, MCP adds ~4x token overhead to do something the model already does natively with bash. The protocol framing, JSON-RPC envelope, and schema negotiation all cost tokens for zero benefit when you already have stdout.

I've watched agents in Claude Code struggle with MCP connection issues while the equivalent CLI command would have just worked. Protocol complexity has a cost.

### "Just use REST"

REST is right for your backend. It's wrong for an AI agent in an editor. You'd need to teach the agent about auth headers, error handling, pagination, rate limits — all things that CLI and MCP abstract away in the contexts where they're used.

Also, "just use REST" hand-waves away the hardest part: the agent needs to *discover* what endpoints exist and how to call them. REST alone doesn't solve that.

### "CLI is all you need"

Only if your entire world is a terminal. The moment you're in a GUI editor, a web app, or a mobile context, CLI doesn't help you. And plenty of non-technical users will never open a terminal.

## The real mistake

Every take picks ONE context and universalizes:

| Claim | True for | False for |
|-------|----------|-----------|
| "CLI is better" | Terminal agents | GUI editors, web apps |
| "MCP is the future" | Claude Desktop, Cursor | Terminal agents, backends |
| "Just use REST" | Backends, serverless | Editor integrations |
| "SDK only" | TypeScript apps | Non-JS, non-code contexts |

The protocol is a transport detail. It's the last mile. Arguing about whether to use MCP or CLI is like arguing about whether to use HTTP/2 or HTTP/3 — it matters at the margin, but it's not the interesting question.

## What actually matters

The protocol debate distracts from the hard problems that nobody seems to be solving:

**How do you find tools that work?** There are thousands of MCP servers and npm packages claiming to be AI tools. Most of them are broken, undocumented, or abandoned. The protocol doesn't help you find the good ones.

**How do you know a tool is safe to run?** You're giving an AI agent the ability to execute arbitrary functions. Who audited that code? What permissions does it need? The protocol doesn't tell you.

**How do you compose tools into workflows?** An agent needs a web scraper, a summarizer, and a Slack notifier. How does it find those, wire them together, and handle failures? The protocol is the least interesting part of that stack.

**How do you version and update tools without breaking agents?** Tool schemas change. Endpoints move. Auth requirements evolve. The protocol doesn't solve compatibility.

These are registry problems, trust problems, and quality problems. They're harder than protocol design, which is probably why people would rather argue about MCP on Twitter.

## The TPMJS approach

We built TPMJS around a simple premise: **write the tool once, serve it everywhere.**

A tool author publishes a Zod-schema'd function to npm. TPMJS indexes it, health-checks it, quality-scores it, and makes it available over every protocol:

- **CLI** — \`tpm tool search\`, \`tpm tool execute\`
- **MCP** — Every collection is an MCP server endpoint
- **REST** — Standard API with Bearer auth
- **SDK** — \`@tpmjs/registry-search\` and \`@tpmjs/registry-execute\`

The consumer picks the protocol that fits their context. The tool doesn't change — only the transport does.

This isn't a protocol opinion. It's a registry opinion. The hard work is in indexing, validating, scoring, and curating tools so that agents can find and trust what they need. The protocol is just how you deliver the result.

## The bottom line

Stop arguing about protocols. MCP, CLI, REST, and SDK are all fine. They're all just ways to send JSON to a function and get JSON back.

Pick the one that fits your context:

- **In a terminal?** Use CLI.
- **In an editor?** Use MCP.
- **In a backend?** Use REST.
- **In TypeScript?** Use the SDK.

Then spend your energy on the actual hard problems: finding tools that work, knowing they're safe, and composing them into something useful.

The protocol is the envelope. The tool is the letter. Stop arguing about envelopes.
`,
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getAllPosts(): BlogPost[] {
  return [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
