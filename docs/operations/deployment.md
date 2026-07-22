# Deployment Configuration

## Current deployment (since 2026-07)

tpmjs.com is **self-hosted**: the apps run as podman containers on a single box,
built on-box from this repo, fronted by Caddy (with Cloudflare in front). There is
no Vercel hosting or deployment path. The old deployment-protection guide remains
[archived](../history/vercel-deployment.md) as historical context only.

| Component | Container | Port (localhost) |
|---|---|---|
| Web (tpmjs.com) | `tpmjs-web` | 3200 |
| Playground | `tpmjs-playground` | 3201 |
| Tutorial | `tpmjs-tutorial` | 3202 |
| Executor (Deno) | `tpmjs-railway-executor` | 3210 |
| Agent sandbox | `tpmjs-agent-sandbox` | 3211 |
| **PostgreSQL 17** | `tpmjs-pg` | **5435** (apps use `tpmjs-pg:5432` on the shared network) |

- **Database**: self-hosted PostgreSQL 17 (`tpmjs-pg` container; migrated off Neon
  2026-07-14). Runtime env (including `DATABASE_URL`) is injected via
  `EnvironmentFile=` from `/etc/donto/tpmjs-*.env` on the box — the image build is
  DB-free.
- **Deploying web or executor changes**: use the repository's transactional
  deploy command. It accepts only the exact `origin/main` revision after proving
  that revision passed authoritative CI, builds and smokes a candidate, stamps
  provenance, and rolls back automatically if activation fails.
- **DB console**: `podman exec -it tpmjs-pg psql -U tpmjs -d tpmjs` (on the box).
- **DB backup**: `podman exec tpmjs-pg pg_dump -U tpmjs -Fc tpmjs > backup.dump`.
- **Scheduled jobs**: API-driven sync crons run from GitHub Actions against
  `https://tpmjs.com`; the daily rollup/cleanup crons run from an on-box systemd
  timer (`tpmjs-cron.timer`).

---

## Infra source of truth: donto-infra

The container definitions live in the **`donto-infra`** repo on the box
(`/mnt/donto-data/workspace/donto-infra`), as systemd **Quadlet** units under
`quadlets/`: `tpmjs-web.container`, `tpmjs-playground.container`,
`tpmjs-tutorial.container`, `tpmjs-railway-executor.container`,
`tpmjs-agent-sandbox.container`, `tpmjs-pg.container`, plus `tpmjs.network` and
the cron units (`tpmjs-cron.{service,timer}`, `tpmjs-sync-keyword.{service,timer}`).
A `foo.container` quadlet generates a `foo.service` systemd unit; resource limits
(`MemoryMax=`, `CPUQuota=`) live in each quadlet's `[Service]` block.

Flow for infra changes: edit the quadlet in the repo → `./deploy.sh <name>`
(copies to `/etc/containers/systemd/` + daemon-reload) → `sudo systemctl restart
<name>` → commit+push.

## Building & deploying an app change

Images are **built on-box** (the original registry is gone — never prune the
`localhost/tpmjs-*` images without a rebuild). For the production web and
executor services, the only normal operator entry point is:

```bash
# From a clean /mnt/donto-data/workspace/tpmjs checkout on main
git fetch origin main
git merge --ff-only origin/main
scripts/deploy-on-box.sh all
scripts/deploy-on-box.sh verify
```

Use `web` or `executor` instead of `all` only when the other live service is
already at the same revision. The final `verify` intentionally rejects mixed
provenance across the live estate.

Playground and tutorial still use the parametrized app Dockerfile in
`donto-infra`; the agent sandbox uses its own app Dockerfile. Their Quadlet
definitions and deployment commands remain owned by that infra repository.

Notes:
- `NEXT_PUBLIC_*` build-time vars are filtered out of `/etc/donto/tpmjs-<APP>.env`
  into `apps/<APP>/.env.production` before the Next build (client-exposed by
  definition); runtime secrets stay in the quadlet `EnvironmentFile` and win at
  runtime.
- The transactional deploy maintains its pnpm and Turbopack caches under
  `/var/cache/tpmjs`, away from the data volume, while constructing a clean
  release snapshot from the exact CI-proven commit.

## Environment files

Per-service env files on the box, root-owned, read by systemd
(`EnvironmentFile=`): `/etc/donto/tpmjs-web.env`, `tpmjs-playground.env`,
`tpmjs-tutorial.env`, `tpmjs-railway-executor.env`, `tpmjs-agent-sandbox.env`,
`tpmjs-pg.env`. Secrets never go in the quadlets or either repo. After editing an
env file, restart the affected unit.

## Scheduled jobs (cron split)

Split by runtime length, because Cloudflare cuts proxied responses at ~100s:

**Fast syncs — GitHub Actions workflows against `https://tpmjs.com`:**

| Workflow | Schedule | Endpoint |
|---|---|---|
| `sync-changes.yml` | every 2 min | `/api/sync/changes` |
| `sync-enrich.yml` | every 2 min | `/api/sync/enrich` |
| `endpoint-health-check.yml` | every 5 min | public endpoint probes (`/api/health`, `/api/tools`, `/api/stats`, …) |

Auth is `Authorization: Bearer ${CRON_SECRET}` from GitHub Actions secrets. The
other sync workflows (e.g. `sync-keyword.yml`) are `workflow_dispatch`-only.

**Long crons — on-box systemd timers, hitting the web container directly on
`127.0.0.1:3200`** (bypassing Cloudflare; bearer comes from
`/etc/donto/tpmjs-web.env`):

| Timer | Schedule | What |
|---|---|---|
| `tpmjs-cron.timer` | daily 02:30 UTC (+jitter) | `/api/sync/health-check` (full tool sweep, minutes-long), `/api/sync/metrics`, `/api/sync/stats-snapshot`, `/api/sync/view-rollup`, `/api/sync/execution-rollup`, `/api/sync/cleanup-activity`, `/api/cron/use-cases` |
| `tpmjs-sync-keyword.timer` | every 6h | `/api/sync/keyword` (~150–175s npm keyword sweep — can never finish through the proxy) |

Check runs: `journalctl -u tpmjs-cron.service` /
`journalctl -u tpmjs-sync-keyword.service`; the keyword route logs to
`sync_logs`.

## Debugging

- App logs: `sudo podman logs -f tpmjs-web` (or any container name), or
  `journalctl -u tpmjs-web -f` for the unit view.
- Container state: `sudo podman ps` (rootless `podman ps` shows nothing — the
  containers run under root podman).
- Executor health: `curl http://127.0.0.1:3210/health`.

## Rollback

- Failed candidate smoke tests never move a live tag. If activation fails after
  a tag moves, `scripts/deploy-on-box.sh` restores the prior image and verifies
  its health automatically.
- Successful deployments retain a timestamped `rollback-<revision>-<timestamp>`
  image tag. Inspect the retained tags before any manual rollback; do not delete
  them as routine cleanup.

## CI

GitHub Actions CI gates merges. Deploys are manual on-box builds, and the deploy
script proves the exact revision's CI result again before compiling or changing
live state.
