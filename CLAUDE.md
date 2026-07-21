## Project Overview

Turborepo monorepo. pnpm workspaces. Next.js 16 App Router (`apps/web`). PostgreSQL via Prisma (`packages/db`). Deployed on-box via podman quadlets (tpmjs.com). Database is a self-hosted PostgreSQL 17 container (`tpmjs-pg`) on the same box.

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

## Deployment (on-box podman)

Production is the box itself: every tpmjs service runs as a podman Quadlet unit. The quadlets are source-controlled in the **donto-infra** repo (`/mnt/donto-data/workspace/donto-infra/quadlets/tpmjs-*.container` plus the cron `.service`/`.timer` units) — edit there, never in `/etc/containers/systemd/` directly.

| Unit / container | What | Host port (127.0.0.1) |
|---|---|---|
| `tpmjs-web` | tpmjs.com Next.js app (Caddy + Cloudflare in front) | 3200 |
| `tpmjs-playground` | Tool playground | 3201 |
| `tpmjs-tutorial` | Tutorial site | 3202 |
| `tpmjs-railway-executor` | Deno tool executor — the DEFAULT executor ("railway" in the name is historical) | 3210 |
| `tpmjs-agent-sandbox` | Deno agent sandbox (stateful workspaces) | 3211 |
| `tpmjs-pg` | PostgreSQL 17 — the production DB | 5435 |

All containers share the `tpmjs` podman network and reach each other by container name (web → `tpmjs-pg:5432`, playground → `tpmjs-railway-executor:3002`). Secrets/env live in `/etc/donto/tpmjs-<name>.env` (root:ajax 640) — never in the repo, and there are no `.env.local` files in the checkout.

**Deploy from `main` with the transactional operator script.** It refuses a dirty or non-`origin/main` checkout, low disk headroom, and web deploys whose Prisma migration ledger differs from the repository. It builds under a candidate tag, smoke-tests the candidate runtime, preserves the exact old image, activates the candidate, and automatically restores the old image if live commit health fails. `all` deploys the executor before the web app; `verify` is read-only:

```bash
cd /mnt/donto-data/workspace/tpmjs
scripts/deploy-on-box.sh all
scripts/deploy-on-box.sh verify
```

Use `executor` or `web` to deploy one service. The script does not apply database migrations or modify Quadlets: migrations remain a separate backup-verified operation, and a changed Quadlet must be merged in `donto-infra`, installed, and reloaded before running this deploy.

**Manual web fallback.** Next.js standalone output keeps the production image limited to traced runtime dependencies rather than the entire monorepo. The repo-root `Dockerfile` expects `apps/web/.next` as its build context. There is no image registry, so retain a rollback tag and never prune the live image without a verified replacement:

```bash
cd /mnt/donto-data/workspace/tpmjs
COMMIT_SHA=$(git rev-parse --short=8 HEAD)
COMMIT_MESSAGE=$(git log -1 --pretty=%s)
LIVE_SHA=$(curl -fsS https://tpmjs.com/api/health | jq -r .build.commitSha)
pnpm --filter @tpmjs/web build
sudo podman tag localhost/tpmjs-web:built "localhost/tpmjs-web:rollback-${LIVE_SHA}"
sudo podman build --no-cache --network=host \
  --build-arg "COMMIT_SHA=${COMMIT_SHA}" \
  --build-arg "COMMIT_MESSAGE=${COMMIT_MESSAGE}" \
  -t localhost/tpmjs-web:built -f Dockerfile apps/web/.next
sudo systemctl restart tpmjs-web
curl -fsS https://tpmjs.com/api/health
```

The playground and tutorial still use the parametrized `donto-infra/build/tpmjs.Dockerfile` until they adopt standalone output. Run `donto-infra/deploy.sh tpmjs-<app>` only when a Quadlet changed, not for an image-only deployment.

**Manual Deno fallback** (each service builds from its own directory in this repo):

```bash
cd /mnt/donto-data/workspace/tpmjs
COMMIT_SHA=$(git rev-parse --short=8 HEAD)
COMMIT_MESSAGE=$(git log -1 --pretty=%s)
OLD_SHA=$(sudo podman image inspect localhost/tpmjs-railway-executor:local \
  --format '{{ index .Labels "org.opencontainers.image.revision" }}')
sudo podman tag localhost/tpmjs-railway-executor:local \
  "localhost/tpmjs-railway-executor:rollback-${OLD_SHA:-legacy}"
sudo podman build \
  --build-arg "COMMIT_SHA=${COMMIT_SHA}" \
  --build-arg "COMMIT_MESSAGE=${COMMIT_MESSAGE}" \
  -t localhost/tpmjs-railway-executor:local apps/railway-executor/
sudo systemctl restart tpmjs-railway-executor
curl -fsS http://127.0.0.1:3210/health | jq --arg sha "$COMMIT_SHA" \
  --exit-status '.protocolVersion == "1.1" and .implementationVersion == $sha'

sudo podman build -t tpmjs-agent-sandbox:local /mnt/donto-data/workspace/tpmjs/templates/agent-sandbox/
sudo systemctl restart tpmjs-agent-sandbox
```

(The sandbox image builds from `templates/agent-sandbox/` — NOT `services/sandbox-executor/`, which is the unused legacy Node executor.)

**Logs / status**:

```bash
sudo podman ps --filter name=tpmjs      # what's running (tpmjs-pg has a healthcheck)
sudo podman logs --tail 100 tpmjs-web   # container stdout
journalctl -u tpmjs-web -f              # same via systemd, plus restarts
systemctl status tpmjs-web
```

## Retired hosting platforms

- **Vercel hosting**: forbidden. TPMJS has no Vercel deployment config, analytics, Blob, or KV dependency. The product may still integrate with Vercel as a third-party tool/executor target; that does not host TPMJS itself. The architecture gate prevents regressions; external project/GitHub-App removal is tracked in #138.
- **Railway**: the old `tpmjs-tools-executor` and `agent-sandbox` services migrated on-box 2026-07 (now `tpmjs-railway-executor` :3210 and `tpmjs-agent-sandbox` :3211). Don't `railway up` anything.
- **Neon**: the DB migrated to the self-hosted `tpmjs-pg` container 2026-07-14 (final dump archived at `/mnt/donto-data/backups/tpmjs-neon-final-2026-07-14.dump`). The pooled/unpooled DSN split is a Neon leftover — both vars now hold the same DSN.

## Debugging Production Issues

You have `gh` plus the on-box tooling (`sudo podman`, `systemctl`/`journalctl`, `psql`). **Always use these first** when debugging production problems rather than guessing at fixes.

### Verify Deployment Status

There is NO auto-deploy: production is whatever `localhost/tpmjs-web:built` was last built from, so a pushed commit is not live until the image is rebuilt and the unit restarted.

```bash
# Is the app up? Build fields must match the deployed commit.
curl -s https://tpmjs.com/api/health | jq .

# When was the live image built?
sudo podman image inspect localhost/tpmjs-web:built --format '{{.Created}}'

# Compare with local commit
git log --oneline -1
```

### GitHub Actions (CI)

```bash
gh run list --limit 10                        # Recent runs
gh run view <run-id> --log-failed             # See failure logs
gh run view <run-id> --job <job-id> --log     # Specific job logs
gh run rerun <run-id> --failed                # Rerun failed jobs
gh run watch                                  # Watch current run
gh pr checks <pr-number>                      # Check status on a PR
```

### On-box Services (podman/systemd)

```bash
sudo podman ps --filter name=tpmjs            # What's running (+ tpmjs-pg health)
sudo podman logs --tail 200 tpmjs-web         # Runtime logs (also: -playground, -tutorial,
                                              #   -railway-executor, -agent-sandbox, -pg)
journalctl -u tpmjs-web --since -1h           # Same logs via systemd, plus unit restarts
systemctl status tpmjs-web tpmjs-pg           # Unit state / restart loops
systemctl list-timers 'tpmjs-*'               # Cron timers: next/last run
journalctl -u tpmjs-cron.service --since -1d  # Did last night's daily crons run/fail?
```

For sync/cron issues, the `sync_logs` table is often the fastest signal:

```sql
SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 10;
```

### Debugging Workflow

1. **Identify the problem**: Is it a build failure, runtime error, or timeout?
2. **Check CI first**: `gh run list` then `gh run view <id> --log-failed`
3. **Check the containers**: `sudo podman logs --tail 200 tpmjs-web` for runtime errors, `systemctl status tpmjs-web` for restart loops
4. **Check database**: the production DB is the on-box `tpmjs-pg` container — from the box: `sudo podman exec -it tpmjs-pg psql -U tpmjs -d tpmjs`
5. **Verify the fix**: Push, watch CI with `gh run watch`, then rebuild the image + `sudo systemctl restart tpmjs-web` (no auto-deploy!) and `curl https://tpmjs.com/api/health`

### Direct Database Access

The production database is the local `tpmjs-pg` PostgreSQL 17 container (same box as the site; apps reach it as `tpmjs-pg:5432` on the podman network, host tooling uses `127.0.0.1:5435`). There is **no `.env` in the repo** (`packages/db/` ships only `.env.example`, and no `.env.local` exists) — the canonical `DATABASE_URL` lives in `/etc/donto/tpmjs-web.env` (root:ajax 640) and points at the container-DNS host `tpmjs-pg:5432`. For host tooling, rewrite the host to `127.0.0.1:5435`:

```bash
export DATABASE_URL=$(sudo grep '^DATABASE_URL=' /etc/donto/tpmjs-web.env | cut -d= -f2- | sed 's/tpmjs-pg:5432/127.0.0.1:5435/')
```

(`DATABASE_URL_UNPOOLED` holds the same DSN — the pooled/unpooled split was a Neon artifact, kept only because `schema.prisma`'s `directUrl` reads the second var.)

Quickest interactive path, no DSN needed: `sudo podman exec -it tpmjs-pg psql -U tpmjs -d tpmjs`.

**Prisma Studio** (GUI for browsing/editing data):
```bash
# Reads connection from packages/db/.env or DATABASE_URL env var
pnpm --filter=@tpmjs/db db:studio
```

**psql** (raw SQL queries):
```bash
# Connect directly (works the same locally)
psql "$DATABASE_URL"

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

**Note:** Prisma reads `.env` from `packages/db/`, not the root — and that file doesn't exist in the checkout. Export `DATABASE_URL` in your shell (recipe above) or create a local gitignored `packages/db/.env` from `.env.example`.

### Cron Jobs (schedules + manual triggers)

Schedules are split across two lanes — the split exists because **Cloudflare cuts proxied responses at ~100s**, so anything long-running must hit `127.0.0.1:3200` from the box:

**Fast crons — GitHub Actions workflows** (`.github/workflows/`, curl `https://tpmjs.com` with the repo's `CRON_SECRET` secret):
- `sync-changes.yml` → `POST /api/sync/changes` — NPM changes feed, **every 2min**
- `sync-enrich.yml` → `POST /api/sync/enrich` — schema extraction + health, **every 2min**
- `endpoint-health-check.yml` — public-endpoint smoke checks, **every 5min**
- `discord-summary.yml` — Discord daily summary, **daily 9am UTC** (drives the `ajax/tpmjs-discord` agent via the conversation API, not `/api/cron/discord-summary`)
- Dispatch-only (schedules removed — they 524'd through Cloudflare or can't reach the on-box DB): `sync-keyword.yml`, `sync-metrics.yml`, `health-check.yml`, `sync-package.yml`, `sync-manual.yml`

**Long crons — on-box systemd timers** (units in `donto-infra/quadlets/`, curl `http://127.0.0.1:3200` directly):
- `tpmjs-cron.timer` — **daily ~02:30 UTC** (+ ≤10min jitter): `health-check` (full tool sweep, takes minutes), `metrics`, `stats-snapshot` (homepage depends on this), `view-rollup`, `execution-rollup`, `cleanup-activity`, `/api/cron/use-cases`
- `tpmjs-sync-keyword.timer` — **every 6h**: `keyword` (moved on-box 2026-07-18; the ~150-175s sweep never survived the GH lane)

Currently unscheduled (manual trigger only): `cleanup-executions`, `cleanup-api-usage`, `cleanup-search-logs`, `/api/cron/discord-summary`.

**Manual triggers.** All cron endpoints require `Authorization: Bearer <CRON_SECRET>`. The secret lives in `/etc/donto/tpmjs-web.env` (root:ajax 640; rotated 2026-07-18) — there is no `.env.local` in the repo:

```bash
export CRON_SECRET=$(sudo grep '^CRON_SECRET=' /etc/donto/tpmjs-web.env | cut -d= -f2)

# Short endpoints work through the public domain:
curl -X POST https://tpmjs.com/api/sync/changes -H "Authorization: Bearer $CRON_SECRET"
curl -X POST https://tpmjs.com/api/sync/package -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" -d '{"packageName":"some-package"}'

# Long endpoints (health-check, keyword, metrics) will 524 through Cloudflare even though
# the sync completes server-side — hit the container directly from the box instead:
curl -X POST http://127.0.0.1:3200/api/sync/health-check -H "Authorization: Bearer $CRON_SECRET"
curl -X POST http://127.0.0.1:3200/api/sync/keyword -H "Authorization: Bearer $CRON_SECRET"
```

Every sync endpoint under `/api/sync/*` (see `apps/web/src/app/api/sync/`) accepts the same bearer auth; check `sync_logs` for the outcome.

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

Keep memory content structured with concrete details (file paths, error messages, code patterns). Tag with relevant topics like `bug`, `feature`, `prisma`, `podman`, `architecture`, etc.

## Publishing Packages

```bash
pnpm changeset              # Create changeset
pnpm changeset:version      # Version packages
pnpm changeset:publish      # Publish to npm
git push --follow-tags       # Push with tags
```
