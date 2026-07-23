import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { coverageBaselines } from './coverage-baselines.js';
import { discoverCoverageWorkspaces } from './coverage-workspaces.js';

interface CoverageMetric {
  covered: number;
  pct: number;
  skipped: number;
  total: number;
}

interface FileCoverage {
  branches: CoverageMetric;
  functions: CoverageMetric;
  lines: CoverageMetric;
  statements: CoverageMetric;
}

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const coverageDirectory = resolve(repositoryRoot, 'coverage');
const summaryPath = resolve(coverageDirectory, 'coverage-summary.json');

rmSync(coverageDirectory, { force: true, recursive: true });

const workspaces = discoverCoverageWorkspaces(repositoryRoot);
if (workspaces.length === 0) {
  throw new Error('Coverage discovery found no test-bearing workspaces; refusing a vacuous pass.');
}

const build = spawnSync(
  'pnpm',
  [
    'exec',
    'turbo',
    'run',
    'build',
    '--output-logs=new-only',
    ...workspaces.map((workspace) => `--filter=${workspace.name}^...`),
  ],
  { cwd: repositoryRoot, stdio: 'inherit' }
);

if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status ?? 1);

const result = spawnSync(
  'pnpm',
  ['exec', 'vitest', 'run', '--config', 'vitest.coverage.config.ts', '--coverage'],
  { cwd: repositoryRoot, stdio: 'inherit' }
);

if (result.error) throw result.error;
if (!existsSync(summaryPath)) {
  throw new Error(
    'Vitest did not produce coverage/coverage-summary.json; refusing a vacuous pass.'
  );
}

const summary = JSON.parse(readFileSync(summaryPath, 'utf8')) as Record<string, FileCoverage>;
const metricNames = ['lines', 'statements', 'branches', 'functions'] as const;
const rows: string[] = [];

for (const [name, baseline] of Object.entries(coverageBaselines)) {
  const totals = Object.fromEntries(
    metricNames.map((metric) => [metric, { covered: 0, total: 0 }])
  ) as Record<(typeof metricNames)[number], { covered: number; total: number }>;

  for (const [file, coverage] of Object.entries(summary)) {
    if (file === 'total') continue;
    const repositoryPath = relative(repositoryRoot, file).split(sep).join('/');
    if (!repositoryPath.startsWith(`${baseline.directory}/`)) continue;

    for (const metric of metricNames) {
      totals[metric].covered += coverage[metric].covered;
      totals[metric].total += coverage[metric].total;
    }
  }

  if (totals.lines.total === 0) {
    throw new Error(`${name} has a coverage baseline but no measured source lines.`);
  }

  const percentages = Object.fromEntries(
    metricNames.map((metric) => [
      metric,
      totals[metric].total === 0 ? 100 : (totals[metric].covered / totals[metric].total) * 100,
    ])
  ) as Record<(typeof metricNames)[number], number>;

  rows.push(
    `| ${name} | ${percentages.lines.toFixed(2)}% | ${percentages.statements.toFixed(2)}% | ${percentages.branches.toFixed(2)}% | ${percentages.functions.toFixed(2)}% | ${baseline.thresholds.lines}% |`
  );
}

const report = [
  '## Test coverage',
  '',
  'All source files are included; untested files count as 0%.',
  '',
  '| Workspace | Lines | Statements | Branches | Functions | Line floor |',
  '| --- | ---: | ---: | ---: | ---: | ---: |',
  ...rows,
  '',
].join('\n');

console.log(`\n${report}`);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);

process.exitCode = result.status ?? 1;
