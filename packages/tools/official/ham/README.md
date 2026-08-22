# @tpmjs/tools-ham

[HAM](https://github.com/MonumentalSystems/ham) shared-agent-memory tools for AI agents: scoped
`remember` / `recall` / `context`, directed messages (`ask` / `inbox` / `reply`), structured
handoffs, an explicit task board, typed links, `supersede` / `retract`, projects and repository
mirroring — every `ham_*` MCP tool HAM exposes, as Vercel AI SDK tools.

Each export forwards to the HAM tool of the same name over HAM's authenticated Streamable-HTTP
endpoint, so HAM's own descriptions, input schemas and authorization rules are the source of
truth. The tool list and schemas are **generated from HAM's catalog** (`pnpm generate`), never
hand-maintained.

## Installation

```bash
npm install @tpmjs/tools-ham
```

## Setup

| Variable | Required | Purpose |
| --- | --- | --- |
| `HAM_API_KEY` | yes | A HAM **per-agent** credential (bearer). Administrator keys are rejected by HAM's MCP surface. |
| `HAM_API_URL` | no | Base URL of the HAM instance (default `https://ham.donto.org`). |

On tpmjs, add these as **collection env vars**: the collection owner's calls get them injected;
anyone else using the public collection supplies their own `env` (their own HAM instance / key).

## Usage

```typescript
import { context, remember, handoff } from '@tpmjs/tools-ham';

const prior = await context.execute(
  { topic: 'deploy pipeline', project: 'ham', repo: 'owner/ham' },
  { toolCallId: 'c1', messages: [] }
);

await remember.execute(
  {
    content: 'Deploys go through the transactional on-box script, never docker compose.',
    type: 'decision',
    scopes: ['shared', 'project:ham'],
    project: 'ham',
    repo: 'owner/ham',
    idempotency_key: 'ham-deploy-path-2026-08-22-v1',
  },
  { toolCallId: 'c2', messages: [] }
);
```

Every tool resolves to `{ tool, text, data? }` — HAM's textual reply plus the parsed JSON payload
when HAM returned JSON. HAM-side errors (`isError`, scope denials, version conflicts) are thrown
so the agent sees them.

## Tools

| Export | HAM tool |
| --- | --- |
| `remember`, `recall`, `recallDeep`, `recallSequence`, `context`, `recent`, `changes`, `get` | memory retrieval and storage |
| `supersede`, `retract`, `link`, `links`, `unlink`, `reflect` | lifecycle and typed relations |
| `ask`, `inbox`, `message`, `reply`, `staleMessage` | directed agent messages |
| `handoff`, `claimHandoff`, `completeHandoff` | structured handoffs |
| `taskPost`, `taskQueue`, `taskGet`, `taskClaim`, `taskUpdate` | explicit project task board |
| `projects`, `whoami`, `stats`, `repositories` | identity and catalog |
| `repositorySync`, `issue`, `issueTransition`, `issueResolveConflict`, `review`, `reviewRun`, `reviewCurrent` | repository mirroring and exception reviews |

Export names are the HAM names without the `ham_` prefix, camel-cased (`ham_recall_deep` →
`recallDeep`). `HAM_TOOL_CATALOG` exports the raw catalog and `callHam(name, args)` calls any
HAM tool by its canonical name.

## Regenerating after a HAM upgrade

```bash
HAM_API_URL=https://your-ham HAM_API_KEY=... pnpm generate -- --fetch
pnpm build
```

## License

MIT
