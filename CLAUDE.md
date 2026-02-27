## Project Overview

Turborepo monorepo. pnpm workspaces. Next.js 16 App Router (`apps/web`). PostgreSQL via Prisma (`packages/db`). Deployed on Vercel. Database on Neon (via Railway for some services).

## Agent Sandbox

Sandbox and executors are **independent concepts**:

- **Executor** = Where tools run (`default` TPMJS infrastructure, or `custom_url` user's own server)
- **Sandbox** = A persistent workspace toggle (`agent.sandboxEnabled`) that auto-injects 4 tools: `shellExec`, `readFile`, `writeFile`, `listFiles`

An agent can have both a custom executor AND sandbox enabled simultaneously. Sandbox tools always route to the sandbox server; other tools route to the configured executor.

- Sandbox URL/key come from env vars: `AGENT_SANDBOX_URL`, `AGENT_SANDBOX_API_KEY`
- Session ID format: `agentId:conversationId`
- Session TTL: 24 hours of inactivity, extended on each tool call
- After expiry, workspace is deleted and next message starts fresh (TODO: persist to object storage)
- Server code: `templates/agent-sandbox/server.ts`
- Sandbox tools are injected in `apps/web/src/lib/agents/build-tools.ts` → `injectSandboxTools()`

## Architecture Rules

1. **Use `@tpmjs/ui` components** — never raw HTML `<button>`, `<input>`, `<table>`, etc.
2. **No barrel exports** — import directly: `@tpmjs/ui/Button/Button`, not `@tpmjs/ui`
3. **Module boundaries** — apps import packages, never the reverse. UI has no deps on utils.
4. **Avoid `count()` in API routes** — use `take: limit + 1` technique for pagination (Prisma cold start is slow in serverless)
5. **All API routes need** `export const runtime = 'nodejs'` and `export const maxDuration = 60`

## Essential Commands

```bash
pnpm install                          # Install deps
pnpm dev --filter=@tpmjs/web          # Dev server
pnpm build                            # Build all
pnpm type-check                       # Type-check all
pnpm lint                             # Lint all
pnpm format                           # Biome format
pnpm --filter=@tpmjs/db db:generate   # Regenerate Prisma client (after schema changes)
pnpm --filter=@tpmjs/db db:push       # Push schema to DB (dev)
pnpm --filter=@tpmjs/db db:migrate    # Create migration (prod)
pnpm --filter=@tpmjs/db db:studio     # Prisma Studio GUI
```

## Git Hooks (Lefthook)

Pre-commit runs: format, lint, type-check. Pre-push runs: test. If hooks pass locally, CI will pass too.

## Vercel

The Vercel project is `tpmjs-web` (configured in `/.vercel/project.json`). Domains: `tpmjs.com`, `tpmjs-web.vercel.app`.

**Always run Vercel CLI commands from the repo root** so it picks up the correct project:

```bash
vercel env add MY_VAR production              # Add env var
vercel env ls                                 # List env vars
vercel redeploy <deployment-url>              # Redeploy with latest env vars
```

Build command: `cd ../.. && pnpm install && pnpm --filter=@tpmjs/web... build` (the `...` suffix builds all workspace dependencies first).

Auto-deploys on push to `main` via GitHub integration. To redeploy with new env vars:

```bash
vercel redeploy <current-deployment-url>      # Redeploy with latest env vars
```

## Railway

Two services in the `tpmjs` project:

| Service | URL | Purpose |
|---------|-----|---------|
| `tpmjs-tools-executor` | `endearing-commitment-production.up.railway.app` | Stateless tool executor (Deno) |
| `agent-sandbox` | `agent-sandbox-production-aa9f.up.railway.app` | Stateful sandbox server (Deno + Docker) |

Link to a service before running commands:

```bash
railway service agent-sandbox                 # Link to sandbox service
railway service tpmjs-tools-executor          # Link to executor service
railway variables                             # List env vars for linked service
railway variables --set "KEY=value"           # Set env var (triggers redeploy)
railway deployment list                       # List recent deployments
railway up /path/to/dir --path-as-root --detach  # Deploy from a subdirectory
```

The sandbox server lives in `templates/agent-sandbox/`. Deploy with:

```bash
railway service agent-sandbox
railway up templates/agent-sandbox --path-as-root --detach
```

## Debugging Production Issues

You have access to `gh`, `vercel`, and `railway` CLIs. **Always use these first** when debugging production problems rather than guessing at fixes.

### Verify Deployment Status

```bash
# Check what commit is live in production
curl -s https://tpmjs.com/api/health | jq .

# Compare with local commit
git log --oneline -1
```

The health endpoint returns `commitSha`, `commitMessage`, and `deploymentUrl`.

### GitHub Actions (CI)

```bash
gh run list --limit 10                        # Recent runs
gh run view <run-id> --log-failed             # See failure logs
gh run view <run-id> --job <job-id> --log     # Specific job logs
gh run rerun <run-id> --failed                # Rerun failed jobs
gh run watch                                  # Watch current run
gh pr checks <pr-number>                      # Check status on a PR
```

### Vercel (Deployments)

```bash
vercel ls                                     # List deployments (run from repo root!)
vercel inspect <deployment-url>               # Build info + lambda list
vercel logs <deployment-url>                  # Runtime logs
vercel logs <deployment-url> --since 1h       # Last hour of logs
vercel env ls                                 # List env vars (run from repo root!)
```

Key things to check:
- `vercel inspect` shows lambda functions (λ) — if you only see static pages (○), API routes didn't deploy
- `vercel logs` shows runtime errors, timeouts, and cold start issues

### Railway (Services)

```bash
railway status                                # Current project/environment/service
railway logs                                  # Service logs (streams, use timeout)
railway logs --build <deployment-id>          # Build logs for a deployment
railway variables                             # List env vars
railway deployment list                       # List recent deployments
```

### Debugging Workflow

1. **Identify the problem**: Is it a build failure, runtime error, or timeout?
2. **Check CI first**: `gh run list` then `gh run view <id> --log-failed`
3. **Check Vercel**: `vercel inspect <url>` to verify lambdas deployed, `vercel logs <url>` for runtime errors
4. **Check database**: `railway logs` or connect directly with `railway connect postgres`
5. **Verify the fix**: Push, watch CI with `gh run watch`, then `curl https://tpmjs.com/api/health`

### Direct Database Access

The production database is Neon PostgreSQL. Connection strings are in `.env.local` (`DATABASE_URL` for pooled, `DATABASE_URL_UNPOOLED` for direct).

**Prisma Studio** (GUI for browsing/editing data):
```bash
# Reads connection from packages/db/.env or DATABASE_URL env var
pnpm --filter=@tpmjs/db db:studio
```

**psql** (raw SQL queries):
```bash
# Connect using the unpooled URL for direct access
psql "$DATABASE_URL_UNPOOLED"

# Common queries
SELECT count(*) FROM tools;
SELECT id, name, slug, quality_score, view_count FROM tools ORDER BY view_count DESC LIMIT 20;
SELECT * FROM stats_snapshots ORDER BY date DESC LIMIT 5;
SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 10;
SELECT * FROM page_views ORDER BY date DESC LIMIT 20;
```

**One-off Prisma scripts** (when you need Prisma's type safety):
```bash
# Run a .ts script against prod DB using tsx
cd packages/db && npx tsx scripts/my-script.ts
```

**Note:** Prisma reads `.env` from `packages/db/`, not the root. If `db:studio` can't connect, ensure `DATABASE_URL` is set there or exported in your shell.

### Manual Cron Triggers

All cron endpoints require `Authorization: Bearer <CRON_SECRET>`. The `CRON_SECRET` value lives in `.env.local` at the repo root (and `apps/web/.env.local`). Source it before running:

```bash
source .env.local
```

**Sync endpoints** (discovery, enrichment, metrics):
```bash
curl -X POST https://tpmjs.com/api/sync/changes -H "Authorization: Bearer $CRON_SECRET"          # NPM changes feed (every 4h)
curl -X POST https://tpmjs.com/api/sync/keyword -H "Authorization: Bearer $CRON_SECRET"          # NPM keyword search (every 6h)
curl -X POST https://tpmjs.com/api/sync/enrich -H "Authorization: Bearer $CRON_SECRET"           # Schema extraction + health (every 2min)
curl -X POST https://tpmjs.com/api/sync/metrics -H "Authorization: Bearer $CRON_SECRET"          # Download stats + quality scores (daily)
curl -X POST https://tpmjs.com/api/sync/health-check -H "Authorization: Bearer $CRON_SECRET"     # Full health check for all tools (daily 2am UTC)
curl -X POST https://tpmjs.com/api/sync/package -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" -d '{"packageName":"some-package"}'                         # Sync a specific package
```

**Rollup / snapshot endpoints** (aggregation):
```bash
curl -X POST https://tpmjs.com/api/sync/stats-snapshot -H "Authorization: Bearer $CRON_SECRET"   # Daily stats snapshot (homepage depends on this)
curl -X POST https://tpmjs.com/api/sync/view-rollup -H "Authorization: Bearer $CRON_SECRET"      # Roll up page views (daily 0:30 UTC)
curl -X POST https://tpmjs.com/api/sync/execution-rollup -H "Authorization: Bearer $CRON_SECRET" # Roll up executions (daily 1am UTC)
curl -X POST https://tpmjs.com/api/sync/cleanup-activity -H "Authorization: Bearer $CRON_SECRET"  # Delete old activity >90d (daily 3am UTC)
curl -X POST https://tpmjs.com/api/sync/cleanup-executions -H "Authorization: Bearer $CRON_SECRET" # Delete old execution events >90d (daily 3:15am UTC)
curl -X POST https://tpmjs.com/api/sync/cleanup-api-usage -H "Authorization: Bearer $CRON_SECRET"  # Delete old API usage records >30d (daily 3:30am UTC)
curl -X POST https://tpmjs.com/api/sync/cleanup-search-logs -H "Authorization: Bearer $CRON_SECRET" # Delete old search logs >90d (daily 3:45am UTC)
```

**Other cron endpoints**:
```bash
curl -X POST https://tpmjs.com/api/cron/discord-summary -H "Authorization: Bearer $CRON_SECRET"  # Discord daily summary (daily 9am UTC)
curl -X POST https://tpmjs.com/api/cron/use-cases -H "Authorization: Bearer $CRON_SECRET"        # Generate use cases (daily)
```

Cron schedules are defined in `vercel.json` at the repo root.

## Admin Dashboard

Admin routes are at `/dashboard/admin` (overview) and `/dashboard/admin/users` (user management). Only users with `role = 'ADMIN'` can access these.

**API routes** (require admin session):
- `GET /api/admin/stats` — latest StatsSnapshot + 30-day trend data
- `GET /api/admin/users` — paginated user list with search, sorting
- `GET /api/admin/search-logs` — recent searches, top queries, daily volume

**Promote a user to admin:**
```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'user@example.com';
```

## Discord

When using Discord MCP tools, default to the **blah** server (guild ID `1349727923434815519`) and **#tpmjs** channel (channel ID `1442666515425132644`) unless the user specifies otherwise.

## Resend

If sending an email via resend, send address should be admin@tpmjs.com 
Send emails to thomasalwyndavis@gmail.com if not specified otherwise

## Memory

Use the `mcp__claude-code-tools__official-memory--createMemory` tool to save a memory (namespace: `tpmjs`) when any of these happen:

- You solve a difficult or non-obvious bug (include the root cause, the fix, and why it wasn't obvious)
- You complete a milestone or ship a feature (summarize what was built, key files, architectural decisions)
- You discover a codebase gotcha or sharp edge that would bite someone again
- You find a workaround for a library/framework limitation (e.g., Prisma JSON filters, Next.js quirks)
- You make an architectural decision worth remembering (what was chosen, what was rejected, why)
- You learn something about the production infrastructure (deploy behavior, env var gotchas, service interactions)

Keep memory content structured with concrete details (file paths, error messages, code patterns). Tag with relevant topics like `bug`, `feature`, `prisma`, `vercel`, `architecture`, etc.

## Publishing Packages

```bash
pnpm changeset              # Create changeset
pnpm changeset:version      # Version packages
pnpm changeset:publish      # Publish to npm
git push --follow-tags       # Push with tags
```
