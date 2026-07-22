#!/usr/bin/env tsx

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { releaseBuildPlan } from './release-build-lib';

function auditPath(args: readonly string[]): string {
  if (args.length === 0) return 'release-audit.json';
  if (args.length === 2 && args[0] === '--audit' && args[1]) return args[1];
  throw new Error('Usage: release-build [--audit <release-audit.json>]');
}

function main(): void {
  const path = auditPath(process.argv.slice(2));
  const plan = releaseBuildPlan(JSON.parse(readFileSync(path, 'utf8')));
  if (plan.candidates.length === 0) {
    console.log('Release build: no unpublished package versions require building.');
    return;
  }

  console.log(
    `Release build: ${plan.candidates.length} package${plan.candidates.length === 1 ? '' : 's'} plus workspace dependencies: ${plan.candidates.map((candidate) => `${candidate.name}@${candidate.version}`).join(', ')}`
  );
  const result = spawnSync('pnpm', plan.turboArguments, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exitCode = result.status ?? 1;
}

try {
  main();
} catch (error: unknown) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
