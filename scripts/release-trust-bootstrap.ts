#!/usr/bin/env tsx

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { npmTrustGithubArgs, publishedPackageNames } from './release-auth-lib';

interface CliOptions {
  audit: string;
  repository: string;
  workflow: string;
}

function optionValue(args: readonly string[], index: number, option: string): string {
  const value = args[index + 1];
  if (!value) throw new Error(`${option} requires a value`);
  return value;
}

function parseOptions(args: readonly string[]): CliOptions {
  let audit = 'release-audit.json';
  let repository = process.env.GITHUB_REPOSITORY ?? '';
  let workflow = 'release.yml';

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    switch (argument) {
      case '--audit':
        audit = optionValue(args, index, argument);
        index += 1;
        break;
      case '--repo':
        repository = optionValue(args, index, argument);
        index += 1;
        break;
      case '--file':
        workflow = optionValue(args, index, argument);
        index += 1;
        break;
      default:
        throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!repository.includes('/')) throw new Error('--repo must be an owner/repository pair');
  if (!workflow.endsWith('.yml') && !workflow.endsWith('.yaml')) {
    throw new Error('--file must be a GitHub Actions workflow filename');
  }
  return { audit, repository, workflow };
}

function main(): void {
  const options = parseOptions(process.argv.slice(2));
  if (!process.env.NODE_AUTH_TOKEN) {
    throw new Error('NODE_AUTH_TOKEN is required for the one-time npm trust bootstrap');
  }

  const packages = publishedPackageNames(JSON.parse(readFileSync(options.audit, 'utf8')));
  if (packages.length === 0) {
    console.log('npm trust bootstrap: no existing npm packages found');
    return;
  }

  console.log(
    `npm trust bootstrap: configuring ${packages.length} package${packages.length === 1 ? '' : 's'} for ${options.repository}/${options.workflow}`
  );
  for (const [index, packageName] of packages.entries()) {
    console.log(`[${index + 1}/${packages.length}] ${packageName}`);
    const result = spawnSync(
      'npm',
      npmTrustGithubArgs(packageName, {
        repository: options.repository,
        workflow: options.workflow,
      }),
      { stdio: 'inherit', env: process.env }
    );
    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error(`npm trust bootstrap failed for ${packageName} (exit ${result.status})`);
    }
  }
  console.log(`npm trust bootstrap: configured ${packages.length} packages`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
