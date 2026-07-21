#!/usr/bin/env tsx

import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import {
  authorizeNpmPackages,
  type OidcAuthorization,
  type OidcDenial,
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

function evidenceSummary(
  mode: 'none' | 'oidc' | 'denied',
  authorizedCount: number,
  deniedCount: number
): string {
  if (mode === 'none') {
    return 'No unpublished package versions were found; npm authorization was not needed.';
  }
  if (mode === 'oidc') {
    return `Trusted publishing authorized ${authorizedCount} package${authorizedCount === 1 ? '' : 's'} through GitHub OIDC.`;
  }
  return `Trusted publishing denied ${deniedCount} package${deniedCount === 1 ? '' : 's'}; nothing was built or published.`;
}

function evidenceTables(
  authorizations: readonly OidcAuthorization[],
  denials: readonly OidcDenial[]
): string[] {
  const lines: string[] = [];
  if (authorizations.length > 0) {
    lines.push('', '| Package | Version | Exchange expires |', '| --- | --- | --- |');
    for (const authorization of authorizations) {
      lines.push(`| ${authorization.name} | ${authorization.version} | ${authorization.expires} |`);
    }
  }
  if (denials.length > 0) {
    lines.push('', '| Denied package | Version | Reason |', '| --- | --- | --- |');
    for (const denial of denials) {
      lines.push(`| ${denial.name} | ${denial.version} | ${denial.error} |`);
    }
  }
  return lines;
}

function writeEvidence(
  options: CliOptions,
  mode: 'none' | 'oidc' | 'denied',
  authorizations: readonly OidcAuthorization[],
  denials: readonly OidcDenial[]
): void {
  const evidence = {
    checkedAt: new Date().toISOString(),
    mode,
    repository: process.env.GITHUB_REPOSITORY ?? null,
    workflow: process.env.GITHUB_WORKFLOW_REF ?? null,
    authorized: authorizations,
    denied: denials,
  };
  if (options.output) writeFileSync(options.output, `${JSON.stringify(evidence, null, 2)}\n`);
  appendGithubFile(
    process.env.GITHUB_OUTPUT,
    `mode=${mode}\nauthorized-count=${authorizations.length}\ndenied-count=${denials.length}\n`
  );

  const lines = [
    '## npm publish authorization',
    '',
    evidenceSummary(mode, authorizations.length, denials.length),
    ...evidenceTables(authorizations, denials),
  ];
  appendGithubFile(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const candidates = releaseCandidates(JSON.parse(readFileSync(options.audit, 'utf8')));
  if (candidates.length === 0) {
    writeEvidence(options, 'none', [], []);
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
  const report = await authorizeNpmPackages(candidates, oidcToken);
  if (report.denied.length > 0) {
    writeEvidence(options, 'denied', report.authorized, report.denied);
    throw new Error(
      `npm trusted publishing preflight denied ${report.denied.length} package${report.denied.length === 1 ? '' : 's'}:\n${report.denied.map((denial) => `- ${denial.error}`).join('\n')}`
    );
  }
  writeEvidence(options, 'oidc', report.authorized, []);
  console.log(
    `npm authorization: OIDC trusted publishing verified for ${report.authorized.map((entry) => `${entry.name}@${entry.version}`).join(', ')}`
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
