## Project Overview

Turborepo monorepo. pnpm workspaces. Next.js 16 App Router (`apps/web`). PostgreSQL via Prisma (`packages/db`). Deployed on Vercel. Database on Neon (via Railway for some services).

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

## Vercel Build

Build command: `cd ../.. && pnpm install && pnpm --filter=@tpmjs/web... build` (the `...` suffix builds all workspace dependencies first).

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
vercel ls                                     # List deployments
vercel inspect <deployment-url>               # Build info + lambda list
vercel logs <deployment-url>                  # Runtime logs
vercel logs <deployment-url> --since 1h       # Last hour of logs
vercel env ls                                 # List env vars
```

Key things to check:
- `vercel inspect` shows lambda functions (λ) — if you only see static pages (○), API routes didn't deploy
- `vercel logs` shows runtime errors, timeouts, and cold start issues

### Railway (Database / Services)

```bash
railway status                                # Current project/environment
railway logs                                  # Service logs
railway logs --deployment <id>                # Specific deployment logs
railway variables                             # List env vars
railway connect postgres                      # Connect to DB directly
railway up                                    # Deploy current directory
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
```

**Other cron endpoints**:
```bash
curl -X POST https://tpmjs.com/api/cron/discord-summary -H "Authorization: Bearer $CRON_SECRET"  # Discord daily summary (daily 9am UTC)
curl -X POST https://tpmjs.com/api/cron/use-cases -H "Authorization: Bearer $CRON_SECRET"        # Generate use cases (daily)
```

Cron schedules are defined in `vercel.json` at the repo root.

## Discord

When using Discord MCP tools, default to the **blah** server (guild ID `1349727923434815519`) and **#tpmjs** channel (channel ID `1442666515425132644`) unless the user specifies otherwise.

## Resend

If sending an email via resend, send address should be admin@tpmjs.com 
Send emails to thomasalwyndavis@gmail.com if not specified otherwise

## Publishing Packages

```bash
pnpm changeset              # Create changeset
pnpm changeset:version      # Version packages
pnpm changeset:publish      # Publish to npm
git push --follow-tags       # Push with tags
```
