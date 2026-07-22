import { resolve } from 'node:path';
import { defineConfig, defineProject } from 'vitest/config';
import { coverageBaselines } from './scripts/coverage-baselines.js';
import { discoverCoverageWorkspaces } from './scripts/coverage-workspaces.js';

const repositoryRoot = import.meta.dirname;
const sourcePattern = 'src/**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}';
const workspaces = discoverCoverageWorkspaces(repositoryRoot);

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
