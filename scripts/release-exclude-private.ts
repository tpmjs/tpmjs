#!/usr/bin/env tsx

/**
 * CI publish-lane enforcement of the publish exclusions.
 *
 * `changeset publish` publishes every non-private workspace package whose source
 * version is ahead of npm. It honours ONLY `private` — not the changesets
 * `ignore` config (verified against @changesets/cli 2.29.8) — so the one
 * reliable way to keep a user-gated package (e.g. @tpmjs/tools-unsandbox, whose
 * source 0.1.5 leads npm 0.1.4) from publishing is to mark it `private` in the
 * ephemeral CI checkout right before `changeset publish`. This mutation is NEVER
 * committed. See scripts/release-exclusions.ts (tpmjs/tpmjs#115).
 *
 * Wired into `changeset:publish:ci`, after `release:build` and before
 * `changeset publish`. Reads the same release-audit.json the build lane used.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { excludedManifests } from './release-exclude-private-lib';

function auditPath(args: readonly string[]): string {
  if (args.length === 0) return 'release-audit.json';
  if (args.length === 2 && args[0] === '--audit' && args[1]) return args[1];
  throw new Error('Usage: release-exclude-private [--audit <release-audit.json>]');
}

function main(): void {
  const audit = JSON.parse(readFileSync(auditPath(process.argv.slice(2)), 'utf8'));
  const manifests = excludedManifests(audit);
  if (manifests.length === 0) {
    console.log('Release publish: no publish exclusions to apply.');
    return;
  }
  for (const manifest of manifests) {
    const manifestPath = join(manifest.path, 'package.json');
    const packageJson = JSON.parse(readFileSync(manifestPath, 'utf8'));
    packageJson.private = true;
    writeFileSync(manifestPath, `${JSON.stringify(packageJson, null, 2)}\n`);
    console.log(
      `Release publish: excluded ${manifest.name} — marked private in the CI checkout so changeset publish skips it (user-gated npm trusted publisher, tpmjs/tpmjs#115).`
    );
  }
}

try {
  main();
} catch (error: unknown) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
