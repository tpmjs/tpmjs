# Build and release system

TPMJS production releases are built and activated on the host. Vercel and
Railway are not part of the production path. The supported operator interface
is:

```bash
scripts/deploy-on-box.sh executor
scripts/deploy-on-box.sh web
scripts/deploy-on-box.sh all
scripts/deploy-on-box.sh verify
```

## Release contract

The deploy script accepts only a clean local `main` that exactly matches
`origin/main`. It then proves that the full commit SHA has a successful
main-branch `ci.yml` push run before enabling the optimized release build.
This proof is what permits the host to omit Next.js's duplicate TypeScript
validation; ordinary developer and CI builds still run it.

Every candidate is built with the exact commit SHA, inspected for that
provenance, and smoke-tested as a running container before a live image tag can
move. The previous image receives a timestamped rollback tag first. A failed
activation restarts that exact prior image.

`verify` is read-only. It proves that both systemd services are active, both
live images carry the expected revision, the executor serves protocol 1.1, the
web app can reach PostgreSQL, and the public health endpoint reports the same
revision.

## Why warm builds are fast

The canonical checkout is on `/mnt/donto-data`, whose workload is optimized for
capacity rather than build latency. Releases therefore use three disposable,
reconstructable caches on the root volume:

| Path | Purpose |
| --- | --- |
| `/var/cache/tpmjs/release-worktree` | Exact source snapshot and generated standalone output |
| `/var/cache/tpmjs/release-staging` | Short-lived exact-commit archive used to refresh the worktree |
| `/var/cache/tpmjs/pnpm-store` | Content-addressed dependencies for the web workspace |
| `/var/cache/tpmjs/next-turbopack` | Source-root-namespaced Turbopack production compiler state |

The source snapshot comes from `git archive <full-sha>`, not from ambient
untracked files. `rsync --delete` removes stale source paths while preserving
workspace `node_modules`, Turbo's local artifact cache, and `.next`; the two
required web environment files are then copied explicitly with mode `0600`.
The release preparation explicitly builds the web app's workspace dependencies
from this snapshot, so success never depends on ignored `dist/` files left in
the canonical checkout. These directories contain no database or user data and
can always be reconstructed from Git, pnpm, and the deployment environment.

Turbopack's production filesystem cache is opt-in, so
`apps/web/next.config.ts` enables it explicitly. GitHub Actions preserves both
the Next compiler cache, TypeScript `.tsbuildinfo` files, and Turbo's
content-addressed build/type-check artifacts. Repository-wide type coverage
remains a mandatory 95% gate, but runs in parallel with ordinary type checking
and preserves its file-level analysis cache. The architecture job runs the
architecture ratchets directly instead of rebuilding the entire monorepo a
second time. On-box compiler artifacts are namespaced by the absolute
release-workspace path because Turbopack caches are not portable between source
roots.

Podman layer reuse remains enabled for both images. A tiny release-provenance
file invalidates only the metadata tail of each Dockerfile, so a new Git commit
cannot inherit stale labels while expensive operating-system and Deno layers
remain reusable.

The executor's static Deno dependencies use pinned `npm:` registry specifiers
instead of build-time CDN imports. `deno.json` is copied before `server.ts`, and
the dependency install plus type check both enforce the committed `deno.lock`
with `--frozen`. This removes `esm.sh` from the executor image's static build
graph, verifies dependency integrity, and lets normal source changes reuse the
dependency layer. Dynamic tool packages are request-selected at runtime and
retain their separate `esm.sh`-then-`npm:` resolution path.

## Measured baseline

The 2026-07-22 baseline on the production host was approximately 28 minutes for
the web release build. Next compilation took 4.8 minutes and the repeated
TypeScript phase took 11.8 minutes. During the measurement, `/dev/sdb` was at
100% utilization with high small-read latency.

The first cache-only optimization completed in 9m14s while another workspace
was actively saturating `/dev/sdb`, proving that the remaining delay was source
and dependency traversal. The final root-volume release workspace completed a
clean production build in 68.5s (47s compilation, 4.1s static generation). The
immediate warm build took 19.95s, and a build after a complete exact-source
refresh took 29.2s. A warm source refresh, dependency check, and cached workspace
build took 68.2s under the same data-disk contention, for roughly 97s before
container packaging. This is an approximately 17x end-to-end improvement before
image-layer reuse, and an approximately 84x improvement for repeated builds of
the same source.

After locking and separating the executor dependency graph, an on-box image
build took 14.0s from the first new dependency layer and 4.6s unchanged. The
finished image also passed its frozen type check with networking disabled.

## Regression gates

`pnpm check-architecture` runs `scripts/check-build-performance.mjs`. The gate
fails if a maintainer accidentally:

- disables the production compiler cache;
- bypasses TypeScript without exact-SHA CI proof;
- moves release compilation back to the data volume;
- restores the duplicate architecture build;
- disables Podman layers; or
- disables the executor lockfile or restores static CDN imports; or
- permits stale image provenance.

Use normal builds for local validation:

```bash
pnpm type-check
pnpm test
pnpm build
```

`TPMJS_CI_VALIDATED_RELEASE=1` is reserved for the deployment script. Do not set
it during development or ad hoc builds.

## Operational overrides

The cache locations can be changed without editing the script:

```bash
TPMJS_RELEASE_ROOT=/fast/tpmjs/worktree \
TPMJS_RELEASE_STAGING_ROOT=/fast/tpmjs/staging \
TPMJS_PNPM_STORE_ROOT=/fast/tpmjs/pnpm-store \
TPMJS_NEXT_BUILD_CACHE_ROOT=/fast/tpmjs/next-cache \
  scripts/deploy-on-box.sh web
```

Keep all three on a low-latency local filesystem with at least 5 GiB free. Do
not place durable application data in them.
