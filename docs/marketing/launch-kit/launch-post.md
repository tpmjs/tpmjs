# Launch post (Show HN style)

## Title options
1. **Show HN: TPMJS – curate AI-agent tools once, use them as CLI, MCP, REST, SDK or Skill**
2. **Show HN: One collection of AI tools, served on every protocol (open source)**
3. **Show HN: A health-scored registry of agent tools you can add to Claude with one MCP URL**

_(Lead with #1 — it says the differentiator and the "once" in one line.)_

## Body

Hi HN — I built **TPMJS** (https://tpmjs.com), an open-source registry and serving layer for AI-agent tools.

The itch: every tool for agents ships its own calling convention — some as MCP servers, some as REST, some as npm packages, some as shell commands. So you pick a protocol, wire tools up one at a time, and redo it when you move from Claude Code to Cursor to your own backend. And there's no shared signal for "does this tool actually work?"

TPMJS's take: **there's no MCP-vs-CLI-vs-REST war to pick a side in.** Each is just better in a different place. So you don't pick — you curate a **collection** of tools once, and TPMJS serves that exact set as:

- an **MCP** server (one URL),
- a **CLI** (`tpm`),
- a **REST** endpoint,
- a TypeScript **SDK** (`@tpmjs/compose`),
- and a **Skill** (a living endpoint an agent can query to *learn* the tools).

On top of that: every tool is import- and execution-**health-checked** (broken tools are flagged, not hidden), and tools run in an **isolated sandbox executor**, not in your process.

### Try it in 30 seconds

Add a real public collection to Claude Code as one MCP endpoint — no signup:

```bash
claude mcp add claude-code-tools \
  https://tpmjs.com/@ajax/collections/claude-code-tools/mcp \
  -t http
```

Or hit a tool over plain REST (public, key-free):

```bash
curl -s https://tpmjs.com/api/registry/execute \
  -H 'content-type: application/json' \
  -d '{"toolId":"@tpmjs/official-base64-encode::base64EncodeTool","params":{"data":"Hello, TPMJS!"}}'
# -> {"success":true,"result":{"base64":"SGVsbG8sIFRQTUpTIQ==","byteLength":13}, ...}
```

Same tools, from your TS app via the SDK:

```ts
import { createToolSet } from '@tpmjs/compose';
import { fromRegistry } from '@tpmjs/compose/adapters/registry';

const tools = createToolSet()
  .use('encode', await fromRegistry('@tpmjs/official-base64-encode::base64EncodeTool'))
  .build();
// pass `tools` straight to the Vercel AI SDK's generateText / streamText
```

### It's open source and self-hostable

MIT-licensed, Postgres-backed, runs as a normal Next.js app + a sandbox executor. Nothing is locked to our infra — clone it, point it at your own registry, and your collections keep working. Repo: https://github.com/tpmjs/tpmjs

### Where it's at (honestly)

It's early. The engine is real and complete — ~781 browsable tools across 237 npm packages, 36 public collections, ~96.5% tool health, five working surfaces — but adoption is just starting. I'd rather show you the idea and the code than pretend there's traction. The next things on the list: making the five surfaces obvious on every tool page, better first-run onboarding, and growing the tool catalog. Feedback, tools, and PRs very welcome.

Happy to answer anything about the architecture (query-time serving across protocols, the health-check contracts, the sandbox executor).
