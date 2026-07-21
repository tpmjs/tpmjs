# Deployment Configuration

## Current deployment (since 2026-07)

tpmjs.com is **self-hosted**: the apps run as podman containers on a single box,
built on-box from this repo, fronted by Caddy (with Cloudflare in front). There is
no Vercel hosting or deployment path. The old deployment-protection guide remains
archived at `docs/history/vercel-deployment.md` as historical context only.

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
- **Deploying app changes**: rebuild the image on the box from the infra repo's
  Dockerfile, then restart the systemd-managed container
  (`systemctl restart tpmjs-web`).
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
`localhost/tpmjs-*` images without a rebuild). The three Next.js apps share one
parametrized Dockerfile in donto-infra:

```bash
# from the box, context = this repo's checkout
podman build --network=host --build-arg APP=web \
  -t localhost/tpmjs-web:built \
  -f /mnt/donto-data/workspace/donto-infra/build/tpmjs.Dockerfile \
  /mnt/donto-data/workspace/tpmjs

sudo systemctl restart tpmjs-web
```

Same recipe with `APP=playground` / `APP=tutorial` (tags
`localhost/tpmjs-playground:built` / `localhost/tpmjs-tutorial:built`). The
executor and agent-sandbox build from their own app Dockerfiles
(`apps/railway-executor/Dockerfile` → `localhost/tpmjs-railway-executor:local`,
`apps/agent-sandbox` → `tpmjs-agent-sandbox:local`).

Notes:
- `NEXT_PUBLIC_*` build-time vars are filtered out of `/etc/donto/tpmjs-<APP>.env`
  into `apps/<APP>/.env.production` before the Next build (client-exposed by
  definition); runtime secrets stay in the quadlet `EnvironmentFile` and win at
  runtime.
- The `pnpm --filter "{./apps/<APP>}..."` brace filter builds the app **and** its
  workspace deps (`@tpmjs/ui`, `@tpmjs/env` export from `dist/`) in topo order.

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

- **App-level**: `sudo systemctl stop <unit>`, then start the old stopped docker
  container (`sudo docker start <old-container-name>`) — the pre-migration docker
  containers are kept stopped with `--restart=no` for this purpose.
- Or rebuild the image from a known-good git ref and restart the unit.

## CI

GitHub Actions CI (`ci.yml`) was re-enabled 2026-07-18 and is green. CI gates
merges only — deploys are manual on-box builds (see above), so a green main is
the thing you build from, not an auto-deploy trigger.
