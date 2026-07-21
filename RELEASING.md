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

4. **Merge the version PR.** On merge, the Release workflow runs `pnpm changeset:publish` and publishes the bumped packages to npm using the `NPM_TOKEN` repository secret. Only packages whose source version is ahead of npm are published.

## The dry-run / provenance gate

Before (and independently of) any publish, you can see **exactly what would ship**:

```bash
pnpm release:status     # pending version bumps from changesets
pnpm release:preview    # the above, plus which packages are ahead of npm (would actually publish)
```

`release:preview` combines `changeset status --verbose` (intended bumps) with `pnpm -r publish --dry-run` (registry-aware — it lists only packages whose source version is newer than what's on npm). In CI, run the **Release Preview** workflow (`release-preview.yml`, manual dispatch) to get the same report on a clean checkout.

## Changelogs

- **Per-package `CHANGELOG.md`** files are generated and maintained by Changesets — do not edit them by hand.
- **Root `CHANGELOG.md`** is a curated, project-level narrative (high-level milestones/features), not a per-package log. Move `[Unreleased]` items under a dated heading when they ship.

## Rollback

npm publishes are effectively append-only. To back out a bad release:

- **Wrong content, right to remove within 72h:** `npm unpublish @tpmjs/<pkg>@<version>` (npm's 72-hour window).
- **After 72h:** publish a corrected higher version and, if needed, `npm deprecate @tpmjs/<pkg>@<bad-version> "use >= <fixed>"` and move the `latest` dist-tag: `npm dist-tag add @tpmjs/<pkg>@<good> latest`.
- **Registry state:** the version PR is a normal git commit — revert it to undo source bumps.

## Known drift to reconcile: `@tpmjs/tools-unsandbox`

There is a source↔npm mismatch that must be resolved carefully **without clobbering the newer published version** (tracked in [#115](https://github.com/tpmjs/tpmjs/issues/115)):

- **Source:** `0.1.3`, 85 tools.
- **npm `latest`:** `0.1.4`, 59 tools (npm is *ahead* in version number but has *fewer* tools).

A naive patch changeset from source `0.1.3` would compute `0.1.4` and **collide** with the different content already on npm. The safe reconciliation:

1. Confirm the canonical tool set (source's 85 is presumed correct; npm's 59 looks like a regression/partial publish — **maintainer to confirm**).
2. Align the source baseline so the next bump lands **above** npm: publish the canonical set as **`0.1.5`**, superseding `0.1.4` (never reuse `0.1.4` for different content).
3. Add a changeset describing the restoration, let the version PR compute `0.1.5`, then publish and verify the tool declarations persist (`health_check_config` rows).

Until this is confirmed and published, `tools-unsandbox` stays as-is; the release path above is safe because nothing is ahead of npm.
