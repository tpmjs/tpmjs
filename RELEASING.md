# Releasing

How TPMJS packages get versioned and published to npm. The goals: **every release is reviewable, reproducible, and provenance-checked before anything hits npm.**

## Version authority

- **Source is the version authority.** Each package's `package.json` `version` is the source of truth, managed through [Changesets](https://github.com/changesets/changesets).
- **Release intent lives in git.** A change that should ship is accompanied by a changeset file in `.changeset/*.md`. These files **are committed** (they are no longer gitignored) so the intended version bumps are reviewable in the PR that makes the change.
- **The maintainer owns releases.** Publishing is gated (see the flow below); no package reaches npm without a merged version PR.

## The release flow

1. **Author a changeset** with your change:
   ```bash
   pnpm changeset
   ```
   Pick the affected packages and the bump type (patch/minor/major), and write a human-readable summary. Commit the generated `.changeset/*.md` alongside your code.

2. **Merge to `main`.** The **Release** workflow (`.github/workflows/release.yml`) runs on push to `main`. With pending changesets it opens (or updates) a **"Version Packages" PR** that applies the bumps and updates each package's `CHANGELOG.md`. It does **not** publish yet.

3. **Review the version PR.** It shows exactly which packages bump to which versions and why. This is the human gate.

4. **Merge the version PR.** On merge, the Release workflow proves package-level publish authority through npm Trusted Publishing, runs `pnpm changeset:publish`, and publishes the bumped packages. Only packages whose source version is ahead of npm are published.

The publish lane builds exactly once. It reads the provenance audit, selects only
the packages that will publish, and asks Turborepo to build those packages plus
their complete workspace dependency graphs. Pushes that only update a version PR
perform no release build, and unrelated applications are never compiled for an
npm package release.

> [!IMPORTANT]
> **Every push to `main` runs `changeset publish`.** When there are no pending changesets, the Release workflow still runs the publish step to catch up any package whose source `version` is **ahead of npm** — and it *will* publish it. In other words: **bumping a package's `version` in `package.json` and pushing to `main` publishes it.** Always bump versions through changesets (never by hand on `main`), and run `pnpm release:preview` first to see exactly what is ahead of npm. New non-published packages (examples, demos, internal tooling) must be marked `"private": true` so they're never picked up.

## The release audit / provenance gate

Before (and independently of) any publish, you can see **exactly what would ship**:

```bash
pnpm release:status     # pending version bumps from changesets
pnpm release:audit      # compare every publishable workspace version with npm
pnpm release:preview    # run both checks in sequence
```

The registry audit is fail-closed and machine-readable. It blocks when:

- a source package is behind npm;
- a source version is unpublished without the matching Changesets-generated `CHANGELOG.md` entry;
- npm metadata is invalid or unavailable after bounded retries; or
- a workspace contains an invalid semantic version.

`pnpm release:audit --format json` emits the complete plan for automation, while `--format markdown` produces a review summary. Pass `--json-output <path>` to persist the full JSON evidence alongside any selected display format without refetching npm. The manual **Release Preview** workflow uploads its status, human summary, and package-by-package JSON audit as immutable run artifacts. The Release workflow runs the same audit immediately before Changesets can publish.

## npm authentication

TPMJS publishes through [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/) rather than a rotating registry token. The Release job has GitHub's `id-token: write` permission and uses npm 11.18.0. Before the monorepo build, `pnpm release:auth` requests an identity token with the exact `npm:registry.npmjs.org` audience and exchanges it with npm independently for every package in the audited publish set. The short-lived exchange tokens are checked in memory and discarded; release evidence contains only package names, versions, and expiry times.

Every existing npm package must trust this exact publisher:

```text
GitHub owner/repository: tpmjs/tpmjs
Workflow filename:       release.yml
Allowed action:          npm publish
Environment:             (none)
```

An npm maintainer with an interactive session and 2FA can configure a package with npm 11.18.0:

```bash
npm trust github @tpmjs/PACKAGE --file release.yml --repo tpmjs/tpmjs --allow-publish
```

For a scope-wide migration, the manual **Bootstrap npm Trusted Publishing** workflow derives every
existing npm package from the fail-closed release audit and configures the same publisher for each.
It uses `NPM_TOKEN` only inside GitHub Actions; remove that legacy secret after the bootstrap run and
the normal release lane remains entirely OIDC-based.

Trusted Publishing cannot bootstrap a name that does not exist on npm. A genuinely new package must be published once by a maintainer, then configured with the command above before normal automated releases. The preflight fails explicitly for that state.

During the July 2026 migration, the required commands for the pending releases are:

```bash
npm trust github @tpmjs/tools-unsandbox --file release.yml --repo tpmjs/tpmjs --allow-publish
npm trust github @tpmjs/tools-vercel --file release.yml --repo tpmjs/tpmjs --allow-publish
```

## Changelogs

- **Per-package `CHANGELOG.md`** files are generated and maintained by Changesets — do not edit them by hand.
- **Root `CHANGELOG.md`** is a curated, project-level narrative (high-level milestones/features), not a per-package log. Move `[Unreleased]` items under a dated heading when they ship.

## Rollback

npm publishes are effectively append-only. To back out a bad release:

- **Wrong content, right to remove within 72h:** `npm unpublish @tpmjs/<pkg>@<version>` (npm's 72-hour window).
- **After 72h:** publish a corrected higher version and, if needed, `npm deprecate @tpmjs/<pkg>@<bad-version> "use >= <fixed>"` and move the `latest` dist-tag: `npm dist-tag add @tpmjs/<pkg>@<good> latest`.
- **Registry state:** the version PR is a normal git commit — revert it to undo source bumps.

## 2026-07 registry reconciliation

The first complete registry audit found four packages whose source version lagged npm. They were reconciled without reusing any published version:

- `@tpmjs/social-post-draft` and `@tpmjs/ticket-categorize`: npm `0.1.1` and source `0.1.0` had byte-identical compiled JavaScript and declarations. Their source baselines were aligned to `0.1.1`; no release is needed.
- `@tpmjs/tools-unsandbox`: npm `0.1.4` was published from git commit `ae0d5e37` with 59 tools. The later source commit `1be86cbe` deliberately expanded that surface to 85 tools with no removals, and the health-check work added 22 execution/cleanup contracts. Source was aligned to the existing `0.1.4` baseline and its committed patch changeset produces `0.1.5`.
- `@tpmjs/tools-vercel`: npm `0.2.0` contains 14 tools, while a later unreleased source rewrite contains 167. Before release, all 167 routes were checked against Vercel's current official OpenAPI document, 35 stale routes/request shapes were repaired, and runtime mapping tests plus a weekly upstream-contract workflow were added. Source was aligned to the existing `0.2.0` baseline and its committed minor changeset produces `0.3.0`.

The invariant is simple: a published version is immutable. Source may be aligned to an existing registry baseline only as part of a reviewed reconciliation with a pending changeset that lands above npm.
