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

### Content-addressed CI reuse

Pull requests run the complete nine-job validation suite. After GitHub creates
a normal merge commit on `main`, the push workflow proves that the merge tree is
byte-identical to the pull request's second-parent tree and that the exact
second-parent SHA already completed this repository's `ci.yml` pull-request
workflow successfully. Only then does the main workflow reuse that validation
instead of repeating the same lint, type, test, migration, build, executor,
architecture, and dead-code work.

This is validation reuse, not branch-name trust. Direct pushes, squash or
rebase commits, merge-tree changes, missing Git history, unsuccessful or
unrelated workflow runs, malformed API responses, and GitHub API failures all
run the complete suite. Pull-request check names remain unchanged. The
resulting successful main-branch workflow run still attests the exact merge SHA
that the deployment preflight requires.

GitHub scopes cache visibility by branch and does not make caches created on a
pull-request merge ref available to the base branch. The provenance proof
therefore removes the truly duplicate main run without adding an external
cache service or placing TPMJS infrastructure on Vercel.

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
second time. Build and type-check jobs fetch complete Git history and use
Turbo's dependency-aware `--affected` graph, so an executor-only change cannot
trigger hundreds of unrelated tool-package builds. Changes to shared packages
still include every transitive dependent, while a missing comparison base
safely falls back to the full graph. `pnpm build` and `pnpm type-check` remain
the explicit full-repository commands. CI queries the affected package count
first and exits successfully when it is zero. The comparison range uses exact
GitHub event SHAs rather than a local `main` branch name: pull requests compare
their base SHA with the checked merge SHA, and pushes compare the event's
`before` SHA with the new SHA. This prevents a missing local branch from making
Turbo conservatively rebuild all 235 workspaces. TypeScript cache paths
enumerate only workspace output depths; a recursive `**/*.tsbuildinfo` glob is
forbidden because it traverses the installed dependency tree during post-job
cleanup. On-box compiler artifacts are namespaced by the absolute
release-workspace path because Turbopack caches are not portable between source
roots.

### Native TypeScript split

Direct `tsc` builds and checks run on TypeScript 7's native compiler. Tools that
still import the JavaScript compiler API—currently the directive-sensitive UI
build, typescript-eslint, and type-coverage—resolve the official TypeScript 6
compatibility package instead. Both identities live in the default pnpm catalog:

```yaml
catalog:
  '@typescript/native': npm:typescript@^7.0.2
  typescript: npm:@typescript/typescript6@^6.0.2
```

Every workspace manifest refers to `typescript` through `catalog:`. The root's
`@typescript/native` alias owns the `tsc` binary, while the compatibility
package exposes `tsc6` and the API imported by legacy tooling. pnpm replaces
catalog references with ordinary version ranges when packages are packed or
published.

Turbo already runs independent packages concurrently, so each package-level
`tsc` command uses `--checkers 1`. This avoids multiplying TypeScript's internal
checker pool by Turbo's task pool. On the production host, the web compiler
check fell from 39.46s and 1.5 GB RSS with four checkers to 13.38s and 1.21 GB
with one checker. The first cold 238-task repository run completed in 3m10s
despite the canonical checkout's saturated data volume; the prior cold baseline
was approximately 4m06s.

The shared config explicitly declares Node ambient types and stable type
ordering. Its temporary `ignoreDeprecations: "6.0"` exists only because tsup's
declaration worker injects `baseUrl` internally; repository configs themselves
contain no removed TypeScript 7 option. Remove that compatibility flag when the
declaration pipeline leaves tsup.

### Library package builds

The 188 packages with the standard `src/index.ts` → ESM `.js` + `.d.ts`
contract use the pinned root `tsdown.config.ts`. The 42-entry CLI extends that
contract with a package-local entry list, source maps, Node shims, and
content-addressed shared chunks that remain inside its published `dist/`.
Packages deliberately remain independent Turbo tasks: that preserves
content-addressed caching and releases each declaration compiler's memory when
its package finishes. Twenty formerly-specialized non-UI packages now extend
the same contract with explicit multi-entry maps, source-map profiles, shims,
or source-owned executable shebangs. The UI package alone retains tsup because
its many React entry points require directive-preserving output and a separate
declaration pass.
`turbo.json` treats the shared config as a global dependency, so changing that
contract invalidates every affected package cache instead of replaying stale
artifacts. Routine tasks request warning-only tsdown output to avoid multiplying
startup logs across the cohort.

A single tsdown workspace process is forbidden for this repository. In the
full-cohort trial it retained more than 4.5 GB of heap, reached V8's heap limit,
and began using swap. Eight isolated package processes completed without that
growth. On the same 8-core host and SSD checkout, the cold 188-package cohort
fell from 238.02s with tsup to 204.10s with tsdown (14.3%). A ten-package sample
fell from 23.54s to 16.19s. The isolated 42-entry CLI build fell from 20.14s and
995,288 KB peak RSS to 6.48s and 349,556 KB; its generated oclif manifest and
public exports remained identical. Before migrating the final non-UI cohort,
its 20 cold tsup tasks took 32.30s and 402 MB peak coordinator RSS on the same
host; the UI package took only 3.29s alone and was therefore excluded from that
migration. The equivalent cold tsdown cohort completed in 27.61s (14.5%
faster); a separate release-strength run with publint and ATTW enabled completed
all 20 packages in 26.56s.

Normal builds optimize for fast feedback. The release builder additionally
sets `TPMJS_VALIDATE_PACKAGES=1`, which makes every migrated release candidate
pass publint at error level and Are the Types Wrong? under the ESM-only profile.
This proves that declared export files exist and that runtime/module-resolution
shape agrees with the generated declarations before npm publishing begins.

### Local commit hooks

Lefthook is pinned to `2.1.10`. The pre-commit formatter uses `stage_fixed`
while formatting, linting, and affected type checks run in parallel; older
2.0.x releases can finish those child processes and then deadlock while
restaging their results. The architecture gate protects both the fixed runner
version and the formatter's atomic-restaging contract.

Podman layer reuse remains enabled for both images. A tiny release-provenance
file invalidates only the metadata tail of each Dockerfile, so a new Git commit
cannot inherit stale labels while expensive operating-system and Deno layers
remain reusable.

The executor's static Deno dependencies use exact versions in `package.json`
instead of build-time CDN imports. The package manifest and Deno lock/config
are copied before `server.ts`, and the dependency install plus type check both
enforce the committed `deno.lock` with `--frozen`. This removes `esm.sh` from
the executor image's static build graph, verifies dependency integrity, and
lets normal source changes reuse the dependency layer. Dynamic tool packages
are request-selected at runtime and retain their separate
`esm.sh`-then-`npm:` resolution path.

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
- bypasses the TypeScript 7/6 compiler catalog or restores nested checker pools;
- bypasses TypeScript without exact-SHA CI proof;
- moves release compilation back to the data volume;
- restores the duplicate architecture build;
- repeats exact green pull-request validation on an identical merge tree or
  lets uncertain provenance skip full validation;
- removes dependency-aware affected builds or their required Git history;
- restores recursive dependency-tree traversal to TypeScript cache collection;
- restores duplicate standard tsup configs, uses a monolithic tsdown workspace
  build, or lets release builds skip package-contract validation;
- weakens the pinned, atomic-restaging pre-commit hook contract;
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
