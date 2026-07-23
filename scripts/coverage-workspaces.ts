import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

export interface CoverageWorkspace {
  directory: string;
  name: string;
  config?: string;
}

const testPattern = /(?:^|\/)(?:[^/]+\.)?(?:test|spec)\.[cm]?[jt]sx?$/;
const configNames = [
  'vitest.config.ts',
  'vitest.config.mts',
  'vitest.config.js',
  'vitest.config.mjs',
];

function hasTestFile(directory: string): boolean {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) {
      continue;
    }

    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (hasTestFile(path)) return true;
      continue;
    }

    if (testPattern.test(entry.name)) return true;
  }

  return false;
}

function discoverInDirectory(repositoryRoot: string, directory: string): CoverageWorkspace[] {
  const workspaces: CoverageWorkspace[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === 'node_modules' || entry.name.startsWith('.')) {
      continue;
    }

    const child = join(directory, entry.name);
    const manifestPath = join(child, 'package.json');
    if (!existsSync(manifestPath)) {
      workspaces.push(...discoverInDirectory(repositoryRoot, child));
      continue;
    }

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      name?: string;
      scripts?: Record<string, string>;
    };
    if (!manifest.name || !manifest.scripts?.test || !hasTestFile(child)) {
      workspaces.push(...discoverInDirectory(repositoryRoot, child));
      continue;
    }

    const config = configNames.map((name) => join(child, name)).find(existsSync);
    workspaces.push({
      directory: relative(repositoryRoot, child).split(sep).join('/'),
      name: manifest.name,
      config,
    });
  }

  return workspaces;
}

export function discoverCoverageWorkspaces(repositoryRoot: string): CoverageWorkspace[] {
  return [
    ...discoverInDirectory(repositoryRoot, resolve(repositoryRoot, 'apps')),
    ...discoverInDirectory(repositoryRoot, resolve(repositoryRoot, 'packages')),
  ].sort((left, right) => left.name.localeCompare(right.name));
}
