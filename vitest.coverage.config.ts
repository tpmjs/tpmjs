import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { defineConfig, defineProject } from 'vitest/config';
import { coverageBaselines } from './scripts/coverage-baselines.js';

interface Workspace {
  directory: string;
  name: string;
  config?: string;
}

const repositoryRoot = import.meta.dirname;
const sourcePattern = 'src/**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}';
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

    const relativePath = relative(directory, path).split(sep).join('/');
    if (testPattern.test(relativePath)) return true;
  }

  return false;
}

function discoverWorkspaces(directory: string): Workspace[] {
  const workspaces: Workspace[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === 'node_modules' || entry.name.startsWith('.')) {
      continue;
    }

    const child = join(directory, entry.name);
    const manifestPath = join(child, 'package.json');
    if (!existsSync(manifestPath)) {
      workspaces.push(...discoverWorkspaces(child));
      continue;
    }

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      name?: string;
      scripts?: Record<string, string>;
    };
    if (!manifest.name || !manifest.scripts?.test || !hasTestFile(child)) {
      workspaces.push(...discoverWorkspaces(child));
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

const workspaces = [
  ...discoverWorkspaces(resolve(repositoryRoot, 'apps')),
  ...discoverWorkspaces(resolve(repositoryRoot, 'packages')),
].sort((left, right) => left.name.localeCompare(right.name));

if (workspaces.length === 0) {
  throw new Error('Coverage discovery found no test-bearing workspaces; refusing a vacuous pass.');
}

const discoveredByName = new Map(workspaces.map((workspace) => [workspace.name, workspace]));
const missingBaselines = workspaces.filter((workspace) => !coverageBaselines[workspace.name]);
const staleBaselines = Object.keys(coverageBaselines).filter((name) => !discoveredByName.has(name));

if (missingBaselines.length > 0 || staleBaselines.length > 0) {
  throw new Error(
    [
      missingBaselines.length > 0
        ? `Missing coverage baselines: ${missingBaselines.map((workspace) => workspace.name).join(', ')}`
        : undefined,
      staleBaselines.length > 0
        ? `Stale coverage baselines: ${staleBaselines.join(', ')}`
        : undefined,
    ]
      .filter(Boolean)
      .join('\n')
  );
}

for (const workspace of workspaces) {
  const baseline = coverageBaselines[workspace.name];
  if (baseline.directory !== workspace.directory) {
    throw new Error(
      `Coverage baseline path mismatch for ${workspace.name}: expected ${workspace.directory}, received ${baseline.directory}.`
    );
  }
}

export default defineConfig({
  test: {
    projects: workspaces.map((workspace) =>
      workspace.config
        ? workspace.config
        : defineProject({
            test: {
              name: workspace.name,
              root: resolve(repositoryRoot, workspace.directory),
              environment: 'node',
              globals: true,
            },
          })
    ),
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json-summary', 'lcov'],
      reportsDirectory: resolve(repositoryRoot, 'coverage'),
      include: workspaces.map((workspace) => `${workspace.directory}/${sourcePattern}`),
      exclude: [
        '**/*.test.*',
        '**/*.spec.*',
        '**/__tests__/**',
        '**/test/**',
        '**/tests/**',
        '**/test-setup.*',
      ],
      thresholds: Object.fromEntries(
        workspaces.map((workspace) => [
          `${workspace.directory}/src/**`,
          coverageBaselines[workspace.name].thresholds,
        ])
      ),
    },
  },
});
