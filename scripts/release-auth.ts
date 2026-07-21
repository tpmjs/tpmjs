#!/usr/bin/env tsx

import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import {
  authorizeNpmPackage,
  type OidcAuthorization,
  releaseCandidates,
  requestGitHubOidcToken,
} from './release-auth-lib';

interface CliOptions {
  audit: string;
  output: string | null;
}

function optionValue(args: readonly string[], index: number, option: string): string {
  const value = args[index + 1];
  if (!value) throw new Error(`${option} requires a value`);
  return value;
}

function parseOptions(args: readonly string[]): CliOptions {
  let audit = 'release-audit.json';
  let output: string | null = null;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    switch (argument) {
      case '--audit':
        audit = optionValue(args, index, argument);
        index += 1;
        break;
      case '--output':
        output = optionValue(args, index, argument);
        index += 1;
        break;
      default:
        throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return { audit, output };
}

function appendGithubFile(path: string | undefined, content: string): void {
  if (path) appendFileSync(path, content);
}

function writeEvidence(
  options: CliOptions,
  mode: 'none' | 'oidc',
  authorizations: readonly OidcAuthorization[]
): void {
  const evidence = {
    checkedAt: new Date().toISOString(),
    mode,
    repository: process.env.GITHUB_REPOSITORY ?? null,
    workflow: process.env.GITHUB_WORKFLOW_REF ?? null,
    packages: authorizations,
  };
  if (options.output) writeFileSync(options.output, `${JSON.stringify(evidence, null, 2)}\n`);
  appendGithubFile(
    process.env.GITHUB_OUTPUT,
    `mode=${mode}\npublish-count=${authorizations.length}\n`
  );

  const lines = [
    '## npm publish authorization',
    '',
    mode === 'none'
      ? 'No unpublished package versions were found; npm authorization was not needed.'
      : `Trusted publishing authorized ${authorizations.length} package${authorizations.length === 1 ? '' : 's'} through GitHub OIDC.`,
  ];
  if (authorizations.length > 0) {
    lines.push('', '| Package | Version | Exchange expires |', '| --- | --- | --- |');
    for (const authorization of authorizations) {
      lines.push(`| ${authorization.name} | ${authorization.version} | ${authorization.expires} |`);
    }
  }
  appendGithubFile(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const candidates = releaseCandidates(JSON.parse(readFileSync(options.audit, 'utf8')));
  if (candidates.length === 0) {
    writeEvidence(options, 'none', []);
    console.log('npm authorization: not needed (nothing would publish)');
    return;
  }

  const newPackages = candidates.filter((candidate) => candidate.state === 'new-package');
  if (newPackages.length > 0) {
    throw new Error(
      `Trusted publishing cannot bootstrap an unpublished package. Publish once interactively, then configure npm trust for: ${newPackages.map((candidate) => candidate.name).join(', ')}`
    );
  }

  const requestUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
  const requestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  if (!requestUrl || !requestToken) {
    throw new Error(
      'GitHub OIDC is unavailable. The release job must run on a GitHub-hosted runner with permissions.id-token=write.'
    );
  }

  const oidcToken = await requestGitHubOidcToken({ requestUrl, requestToken });
  const authorizations: OidcAuthorization[] = [];
  for (const candidate of candidates) {
    authorizations.push(await authorizeNpmPackage(candidate, oidcToken));
  }
  writeEvidence(options, 'oidc', authorizations);
  console.log(
    `npm authorization: OIDC trusted publishing verified for ${authorizations.map((entry) => `${entry.name}@${entry.version}`).join(', ')}`
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
