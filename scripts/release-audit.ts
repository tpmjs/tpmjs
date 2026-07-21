#!/usr/bin/env tsx

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  classifyRelease,
  type RegistryPackage,
  type ReleaseAuditEntry,
  summarizeAudit,
  type WorkspacePackage,
} from './release-audit-lib';

type OutputFormat = 'text' | 'json' | 'markdown';

interface RegistryDocument {
  'dist-tags'?: { latest?: unknown };
  versions?: unknown;
}

interface CliOptions {
  format: OutputFormat;
  output: string | null;
  jsonOutput: string | null;
}

function optionValue(args: readonly string[], index: number, option: string): string {
  const value = args[index + 1];
  if (!value) throw new Error(`${option} requires a value`);
  return value;
}

function outputFormat(value: string): OutputFormat {
  if (value !== 'text' && value !== 'json' && value !== 'markdown') {
    throw new Error('--format must be text, json, or markdown');
  }
  return value;
}

function parseOptions(args: readonly string[]): CliOptions {
  let format: OutputFormat = 'text';
  let output: string | null = null;
  let jsonOutput: string | null = null;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    switch (argument) {
      case '--format':
        format = outputFormat(optionValue(args, index, argument));
        index += 1;
        break;
      case '--output':
        output = optionValue(args, index, argument);
        index += 1;
        break;
      case '--json-output':
        jsonOutput = optionValue(args, index, argument);
        index += 1;
        break;
      default:
        throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return { format, output, jsonOutput };
}

function readWorkspaces(): WorkspacePackage[] {
  const result = execFileSync('pnpm', ['list', '-r', '--depth', '-1', '--json'], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  const parsed: unknown = JSON.parse(result);
  if (!Array.isArray(parsed)) throw new Error('pnpm returned an invalid workspace list');

  const workspaces: WorkspacePackage[] = [];
  for (const item of parsed) {
    if (typeof item !== 'object' || item === null) continue;
    const record = item as Record<string, unknown>;
    if (
      typeof record.name !== 'string' ||
      typeof record.version !== 'string' ||
      typeof record.path !== 'string'
    ) {
      throw new Error('pnpm returned a workspace without a name, version, or path');
    }
    workspaces.push({
      name: record.name,
      version: record.version,
      path: record.path,
      private: record.private === true,
    });
  }

  return workspaces
    .filter((workspace) => !workspace.private)
    .sort((left, right) => left.name.localeCompare(right.name));
}

function registryUrl(packageName: string): string {
  return `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;
}

function parseRegistryDocument(value: unknown, packageName: string): RegistryPackage {
  if (typeof value !== 'object' || value === null) {
    throw new Error(`npm returned invalid metadata for ${packageName}`);
  }
  const document = value as RegistryDocument;
  const latest =
    typeof document['dist-tags']?.latest === 'string' ? document['dist-tags'].latest : null;
  const versions =
    typeof document.versions === 'object' && document.versions !== null
      ? new Set(Object.keys(document.versions))
      : new Set<string>();
  return { latest, versions };
}

async function fetchRegistryPackage(packageName: string): Promise<RegistryPackage | null> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(registryUrl(packageName), {
        headers: { Accept: 'application/vnd.npm.install-v1+json' },
        signal: AbortSignal.timeout(15_000),
      });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`npm registry returned HTTP ${response.status}`);
      return parseRegistryDocument(await response.json(), packageName);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 250));
    }
  }
  throw new Error(`Could not read npm metadata for ${packageName}: ${lastError?.message}`);
}

function readChangelog(workspace: WorkspacePackage): string | null {
  const path = join(workspace.path, 'CHANGELOG.md');
  return existsSync(path) ? readFileSync(path, 'utf8') : null;
}

async function mapConcurrent<T, R>(
  values: readonly T[],
  concurrency: number,
  operation: (value: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await operation(values[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, () => worker()));
  return results;
}

function importantEntries(entries: readonly ReleaseAuditEntry[]): ReleaseAuditEntry[] {
  return entries.filter((entry) => entry.state !== 'current');
}

function asText(entries: readonly ReleaseAuditEntry[]): string {
  const summary = summarizeAudit(entries);
  const lines = [
    `Release audit: ${summary.safe ? 'SAFE' : 'UNSAFE'}`,
    `Publishable workspaces: ${summary.total}`,
    `Would publish: ${summary.publishCount}`,
  ];
  for (const entry of importantEntries(entries)) {
    lines.push(
      `${entry.safe ? 'OK' : 'BLOCK'} ${entry.name} source=${entry.version} npm=${entry.latest ?? 'unpublished'} state=${entry.state}`,
      `  ${entry.reason}`
    );
  }
  if (importantEntries(entries).length === 0) lines.push('All source versions match npm latest.');
  return `${lines.join('\n')}\n`;
}

function escapeTableCell(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function asMarkdown(entries: readonly ReleaseAuditEntry[]): string {
  const summary = summarizeAudit(entries);
  const lines = [
    `## Release audit: ${summary.safe ? 'SAFE' : 'UNSAFE'}`,
    '',
    `- Publishable workspaces: ${summary.total}`,
    `- Would publish: ${summary.publishCount}`,
    `- Unsafe entries: ${entries.filter((entry) => !entry.safe).length}`,
    '',
  ];
  const important = importantEntries(entries);
  if (important.length === 0) {
    lines.push('All source versions match npm latest.');
  } else {
    lines.push('| Gate | Package | Source | npm latest | State | Reason |');
    lines.push('| --- | --- | --- | --- | --- | --- |');
    for (const entry of important) {
      lines.push(
        `| ${entry.safe ? 'PASS' : 'BLOCK'} | ${escapeTableCell(entry.name)} | ${entry.version} | ${entry.latest ?? 'unpublished'} | ${entry.state} | ${escapeTableCell(entry.reason)} |`
      );
    }
  }
  return `${lines.join('\n')}\n`;
}

function render(entries: readonly ReleaseAuditEntry[], format: OutputFormat): string {
  if (format === 'json') {
    return `${JSON.stringify({ summary: summarizeAudit(entries), packages: entries }, null, 2)}\n`;
  }
  return format === 'markdown' ? asMarkdown(entries) : asText(entries);
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const workspaces = readWorkspaces();
  const concurrency = 16;
  const entries = await mapConcurrent(workspaces, concurrency, async (workspace) =>
    classifyRelease(workspace, await fetchRegistryPackage(workspace.name), readChangelog(workspace))
  );
  const output = render(entries, options.format);
  if (options.output) writeFileSync(options.output, output);
  else process.stdout.write(output);
  if (options.jsonOutput) writeFileSync(options.jsonOutput, render(entries, 'json'));
  if (!summarizeAudit(entries).safe) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
});
