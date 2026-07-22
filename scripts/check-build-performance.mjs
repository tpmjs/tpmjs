import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const failures = [];

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

function requireText(source, expected, message) {
  if (!source.includes(expected)) failures.push(message);
}

function trackedWorkspaceManifests() {
  return execFileSync('git', ['ls-files', '-z', '--', 'package.json', 'apps', 'packages'], {
    encoding: 'utf8',
  })
    .split('\0')
    .filter((path) => path === 'package.json' || path.endsWith('/package.json'));
}

const nextConfig = read('apps/web/next.config.ts');
const deploy = read('scripts/deploy-on-box.sh');
const executorDockerfile = read('apps/railway-executor/Dockerfile');
const executorServer = read('apps/railway-executor/server.ts');
const executorPackage = JSON.parse(read('apps/railway-executor/package.json'));
const executorDenoLock = JSON.parse(read('apps/railway-executor/deno.lock'));
const webDockerfile = read('Dockerfile');
const ci = read('.github/workflows/ci.yml');
const reusePrValidation = read('scripts/reuse-pr-validation.mjs');
const compilerCacheDelta = read('scripts/compiler-cache-delta.mjs');
const sandboxTests = read('.github/workflows/sandbox-tests.yml');
const release = read('.github/workflows/release.yml');
const releasePreview = read('.github/workflows/release-preview.yml');
const releaseBuildCommand = read('scripts/release-build.ts');
const releaseBuild = read('scripts/release-build-lib.ts');
const createTool = read('scripts/create-tool.ts');
const tsdownConfig = read('tsdown.config.ts');
const rootPackage = JSON.parse(read('package.json'));
const turboConfig = JSON.parse(read('turbo.json'));
const lefthook = read('lefthook.yml');
const workspaceConfig = read('pnpm-workspace.yaml');
const baseTypeScriptConfig = JSON.parse(read('packages/config/tsconfig/base.json'));

requireText(
  workspaceConfig,
  "'@typescript/native': npm:typescript@^7.0.2",
  'the compiler catalog must pin the native TypeScript 7 command-line implementation'
);
requireText(
  workspaceConfig,
  'typescript: npm:@typescript/typescript6@^6.0.2',
  'the compiler catalog must retain the TypeScript 6 compatibility API for ecosystem tools'
);
if (rootPackage.devDependencies?.['@typescript/native'] !== 'catalog:') {
  failures.push('the workspace root must expose the cataloged native TypeScript compiler');
}
if (rootPackage.engines?.node !== '>=22.18') {
  failures.push('the workspace Node.js floor must satisfy tsdown 0.22.x');
}
if (
  rootPackage.devDependencies?.tsdown !== '0.22.13' ||
  rootPackage.devDependencies?.publint !== '0.3.21' ||
  rootPackage.devDependencies?.['@arethetypeswrong/core'] !== '0.18.5'
) {
  failures.push('the shared library builder and package-contract validators must stay pinned');
}
if (rootPackage.devDependencies?.lefthook !== '2.1.10') {
  failures.push('Lefthook must stay pinned to the stage_fixed-safe 2.1.10 release');
}
if (baseTypeScriptConfig.compilerOptions?.stableTypeOrdering !== true) {
  failures.push('TypeScript 6 compatibility must use TypeScript 7 stable type ordering');
}
if (!baseTypeScriptConfig.compilerOptions?.types?.includes('node')) {
  failures.push('TypeScript 7 projects must declare their Node.js ambient types explicitly');
}

for (const path of trackedWorkspaceManifests()) {
  const manifest = JSON.parse(read(path));
  const packageDirectory = dirname(path);
  const typeScript = manifest.devDependencies?.typescript;
  if (typeScript && typeScript !== 'catalog:') {
    failures.push(`${path} must consume TypeScript through the workspace compiler catalog`);
  }

  for (const task of ['build', 'type-check']) {
    const command = manifest.scripts?.[task];
    if (command?.startsWith('tsc') && !command.includes('--checkers 1')) {
      failures.push(`${path} ${task} must avoid nested TypeScript checker parallelism`);
    }
  }

  if (manifest.scripts?.build?.startsWith('tsdown')) {
    const sourceMapped = manifest.scripts.build.startsWith('tsdown --sourcemap ');
    if (!/^tsdown(?: --sourcemap)? --logLevel warn(?: && .+)?$/.test(manifest.scripts.build)) {
      failures.push(`${path} must keep routine tsdown output concise`);
    }
    const expectedDev = sourceMapped ? 'tsdown --sourcemap --watch' : 'tsdown --watch';
    if (manifest.scripts?.dev !== expectedDev) {
      failures.push(`${path} must use tsdown for both build and watch mode`);
    }
    if (manifest.devDependencies?.tsup) {
      failures.push(`${path} must not retain a package-local tsup dependency`);
    }
    if (existsSync(join(packageDirectory, 'tsup.config.ts'))) {
      failures.push(`${path} must not retain a legacy tsup config`);
    }
  }

  if (
    manifest.scripts?.build?.startsWith('tsup') &&
    !existsSync(join(packageDirectory, 'tsup.config.ts'))
  ) {
    failures.push(`${path} uses tsup without a package-specific config`);
  }
  if (manifest.scripts?.build?.startsWith('tsup') && path !== 'packages/ui/package.json') {
    failures.push(`${path} must not restore tsup outside the directive-sensitive UI build`);
  }
}

requireText(
  createTool,
  "build: 'tsdown --logLevel warn'",
  'new official tools must use the shared builder'
);
if (createTool.includes('tsup')) {
  failures.push('the official-tool generator must not recreate legacy tsup configuration');
}
requireText(tsdownConfig, 'fixedExtension: false', 'shared builds must preserve .js/.d.ts exports');
requireText(
  tsdownConfig,
  'codeSplitting: false',
  'shared builds must preserve self-contained entry artifacts'
);
requireText(
  tsdownConfig,
  'codeSplitting: true',
  'shared multi-entry builds must enable Rolldown code splitting'
);
if (/\bsplitting\s*:/.test(tsdownConfig)) {
  failures.push('shared builds must use Rolldown outputOptions.codeSplitting, not a stale option');
}
if (!turboConfig.globalDependencies?.includes('tsdown.config.ts')) {
  failures.push('Turbo must invalidate package caches when the shared tsdown config changes');
}
requireText(
  tsdownConfig,
  "profile: 'esm-only', level: 'error'",
  'release builds must fail on ESM package-contract errors'
);
requireText(
  releaseBuildCommand,
  "TPMJS_VALIDATE_PACKAGES: '1'",
  'release builds must enable publint and attw package-contract validation'
);

for (const task of ['build', 'test', 'lint', 'type-check']) {
  if (!rootPackage.scripts?.[task]?.includes('--output-logs=new-only')) {
    failures.push(`${task} must suppress replay of cached task logs`);
  }
}
if (rootPackage.scripts?.build?.includes('tsdown')) {
  failures.push(
    'the root build must preserve Turbo package isolation instead of using tsdown workspace mode'
  );
}

requireText(
  lefthook,
  "type-check --filter='...[HEAD]' --output-logs=new-only",
  'the staged type-check must not replay cached task logs'
);
requireText(
  lefthook,
  'stage_fixed: true',
  'the formatter must atomically restage its fixes before a commit'
);

requireText(
  nextConfig,
  'turbopackFileSystemCacheForBuild: true',
  'Next.js production filesystem caching must remain enabled'
);
requireText(
  nextConfig,
  'ignoreBuildErrors: ciValidatedRelease',
  'release-only type-check elision must remain gated by CI validation'
);
requireText(
  deploy,
  'assert_ci_passed',
  'the deploy preflight must prove the exact origin/main SHA passed CI'
);
requireText(
  deploy,
  'TPMJS_CI_VALIDATED_RELEASE=1',
  'the optimized release build must use the CI-validated configuration'
);
requireText(
  deploy,
  '/var/cache/tpmjs/next-turbopack',
  'on-box Turbopack cache must stay off the saturated data volume'
);
requireText(
  deploy,
  '/var/cache/tpmjs/release-worktree',
  'on-box release compilation must use the root-volume workspace'
);
requireText(
  deploy,
  '/var/cache/tpmjs/release-staging',
  'exact-commit snapshot staging must stay on the root volume'
);
requireText(
  deploy,
  'git archive --format=tar "$COMMIT_SHA_FULL"',
  'the release workspace must be populated from the exact CI-proven commit'
);
requireText(
  deploy,
  'rsync --archive --delete',
  'stale source files must be removed from the reusable release workspace'
);
requireText(
  deploy,
  "--exclude 'node_modules/'",
  'release refreshes must preserve nested pnpm workspace links'
);
requireText(
  deploy,
  "--filter='@tpmjs/web^...'",
  'release preparation must build the web workspace dependencies explicitly'
);
requireText(
  deploy,
  'prepare_next_build_cache',
  'the web release must prepare its dedicated fast compiler cache'
);
requireText(
  deploy,
  'cache_namespace=$(printf',
  'Turbopack state must be namespaced by the absolute release source root'
);
requireText(deploy, 'podman build --layers', 'executor image builds must reuse Podman layers');
requireText(
  deploy,
  'podman build --layers --network=host',
  'web image builds must reuse Podman layers'
);

if (deploy.includes('--no-cache')) {
  failures.push('transactional deploys must not discard the complete container layer cache');
}

for (const [name, dockerfile] of [
  ['executor', executorDockerfile],
  ['web', webDockerfile],
]) {
  const markerMatch = /^COPY .*\.tpmjs-release-provenance.*$/m.exec(dockerfile);
  const marker = markerMatch?.index ?? -1;
  const metadata = dockerfile.indexOf('ARG COMMIT_SHA');
  if (marker < 0 || metadata < 0 || marker > metadata) {
    failures.push(
      `${name} image provenance must be content-invalidated before metadata is stamped`
    );
  }
}

requireText(ci, 'apps/web/.next/cache', 'CI must preserve Next.js incremental compiler state');
requireText(
  ci,
  'permissions:\n  contents: read\n  actions: read\n  pull-requests: read',
  'CI provenance lookup must retain least-privilege workflow-run read access'
);
requireText(
  ci,
  '  validation_provenance:',
  'CI must retain the exact pull-request validation provenance job'
);
requireText(
  ci,
  'run: node scripts/reuse-pr-validation.mjs',
  'CI must run the validation provenance decision before expensive jobs'
);
const validationProvenanceJob = ci.slice(
  ci.indexOf('  validation_provenance:'),
  ci.indexOf('  lint:')
);
requireText(
  validationProvenanceJob,
  'fetch-depth: 2',
  'validation provenance must fetch both merge parents without cloning complete history'
);
if (validationProvenanceJob.includes('fetch-depth: 0')) {
  failures.push('validation provenance must not refetch the complete repository history');
}
requireText(
  ci,
  `run-id: \${{ steps.provenance.outputs.source_run_id }}`,
  'main cache promotion must import only the exact validated pull-request run'
);
for (const artifact of ['pr-compiler-state-typescript', 'pr-compiler-state-build']) {
  requireText(ci, `name: ${artifact}`, `main cache promotion must import the exact ${artifact}`);
}
requireText(
  ci,
  "if: steps.typescript_state.outcome == 'success'",
  'TypeScript cache promotion must require a successful exact artifact import'
);
requireText(
  ci,
  `build_baseline_available: \${{ steps.build_baseline.outputs.cache-matched-key != '' }}`,
  'main must expose whether a reusable default-branch build baseline exists'
);
requireText(
  ci,
  `build_refresh_required: \${{ steps.delta_budget.outputs.refresh-required }}`,
  'an oversized validated delta must force a complete baseline refresh'
);
requireText(
  ci,
  'lookup-only: true',
  'validated main merges must inspect baseline availability without downloading it'
);
requireText(
  ci,
  'MAX_PROMOTED_TURBO_DELTA_BYTES: 134217728',
  'promoted Turbo deltas must retain an explicit 128 MiB compaction boundary'
);
requireText(
  ci,
  'node scripts/compiler-cache-delta.mjs inspect .ci/compiler-state-build',
  'cache promotion must validate and measure the exact delta before saving it'
);
requireText(
  ci,
  "if: steps.delta_budget.outputs.promotable == 'true'",
  'main must promote only a validated in-budget Turbo delta'
);

for (const promotion of [
  'Promote validated TypeScript state to main cache scope',
  'Promote validated Turbo delta to main cache scope',
  'Seed reusable main build baseline',
  'Promote direct-push Turbo delta',
]) {
  const start = ci.indexOf(`- name: ${promotion}`);
  const end = ci.indexOf('\n      - name:', start + 1);
  const section = ci.slice(start, end < 0 ? ci.length : end);
  requireText(section, 'continue-on-error: true', `${promotion} must remain best-effort`);
  requireText(section, 'uses: actions/cache/save@v5', `${promotion} must use an explicit save`);
}
const validatedDeltaPromotion = ci.slice(
  ci.indexOf('- name: Promote validated Turbo delta to main cache scope'),
  ci.indexOf('\n  lint:')
);
requireText(
  validatedDeltaPromotion,
  'path: .ci/compiler-state-build',
  'validated main merges must save only the bounded Turbo delta'
);
if (
  validatedDeltaPromotion.includes('apps/web/.next/cache') ||
  validatedDeltaPromotion.includes('\n            .turbo')
) {
  failures.push('validated main merges must never copy the broad Next/Turbo baseline');
}
const bestEffortExportSteps = ci.match(
  /name: Export validated [^\n]+\n\s+if: github\.event_name == 'pull_request'\n\s+continue-on-error: true/g
);
if (bestEffortExportSteps?.length !== 2) {
  failures.push('both pull-request compiler-state exports must remain best-effort optimizations');
}
for (const [exactKey, expectedCount, purpose] of [
  [
    `key: \${{ runner.os }}-build-baseline-v2-\${{ hashFiles('pnpm-lock.yaml') }}-\${{ github.sha }}`,
    3,
    'versioned baseline lookup, restore, and seed',
  ],
  [
    `key: \${{ runner.os }}-turbo-build-delta-\${{ hashFiles('pnpm-lock.yaml') }}-\${{ github.sha }}`,
    3,
    'validated, restored, and direct-push Turbo deltas',
  ],
  [
    `key: \${{ runner.os }}-typescript-\${{ hashFiles('pnpm-lock.yaml') }}-\${{ github.sha }}`,
    2,
    'TypeScript restore and promotion',
  ],
]) {
  if (ci.split(exactKey).length - 1 !== expectedCount) {
    failures.push(`${purpose} must use the expected exact cache key`);
  }
}
const cacheAwareBuildJob = ci.slice(ci.indexOf('  build:'), ci.indexOf('  executor:'));
if (cacheAwareBuildJob.includes('uses: actions/cache@v5')) {
  failures.push(
    'pull-request builds must restore caches explicitly without saving broad branch copies'
  );
}
requireText(
  cacheAwareBuildJob,
  'Restore latest promoted Turbo build delta',
  'pull-request builds must layer the latest default-branch Turbo delta over the stable baseline'
);
requireText(
  cacheAwareBuildJob,
  "steps.build_baseline.outputs.cache-matched-key == '' ||",
  'a baseline miss must seed a complete default-branch build cache'
);
requireText(
  cacheAwareBuildJob,
  "steps.prepared_delta_budget.outputs.refresh-required == 'true'",
  'an oversized direct-push delta must compact into a new complete baseline'
);
requireText(
  ci,
  'node --test scripts/reuse-pr-validation.test.mjs',
  'CI must exercise the validation provenance contract tests'
);
requireText(
  ci,
  'node --test scripts/compiler-cache-delta.test.mjs',
  'CI must exercise the compiler-cache delta contract tests'
);
requireText(
  reusePrValidation,
  "git(['rev-list', '--parents', '-n', '1', sha])",
  'validation reuse must inspect the exact pushed commit topology'
);
requireText(
  reusePrValidation,
  "git(['show', '-s', '--format=%T', sourceSha])",
  'normal-merge validation reuse must compare the local pull-request head tree'
);
requireText(
  reusePrValidation,
  `\`https://api.github.com/repos/\${repository}/commits/\${sha}/pulls\``,
  'single-parent validation reuse must use GitHub commit-to-pull-request provenance'
);
for (const invariant of [
  "pullRequest?.state === 'closed'",
  'pullRequest?.merge_commit_sha === sha',
  'pullRequest?.base?.repo?.full_name === repository',
  'pullRequest?.base?.ref === refName',
  "typeof pullRequest?.head?.ref === 'string'",
  "typeof pullRequest?.head?.repo?.full_name === 'string'",
  'matchingPullRequests.length !== 1',
]) {
  requireText(
    reusePrValidation,
    invariant,
    `single-parent validation reuse must retain provenance invariant: ${invariant}`
  );
}
requireText(
  reusePrValidation,
  `\`https://api.github.com/repos/\${repository}/git/commits/\${encodeURIComponent(sourceSha)}\``,
  'single-parent validation reuse must resolve the associated head tree from GitHub'
);
requireText(
  reusePrValidation,
  'mergeTree !== sourceTree',
  'all validation reuse paths must require exact tree equality'
);
requireText(
  reusePrValidation,
  'run?.head_branch === source.sourceHeadRef',
  'squash validation reuse must bind the workflow run to the associated head branch'
);
requireText(
  reusePrValidation,
  'run?.head_repository?.full_name === source.sourceHeadRepository',
  'squash validation reuse must bind the workflow run to the associated head repository'
);
requireText(
  reusePrValidation,
  'run?.path === CI_WORKFLOW_PATH',
  'validation reuse must require the authoritative CI workflow'
);
requireText(
  compilerCacheDelta,
  'const TURBO_CACHE_ENTRY = /^[0-9a-f]{16}',
  'compiler-state promotion must admit only content-addressed Turbo cache entries'
);
requireText(
  compilerCacheDelta,
  'copyFileSync(source, join(cacheDir, name), constants.COPYFILE_EXCL)',
  'compiler-state promotion must never overwrite an inherited cache entry'
);
requireText(
  compilerCacheDelta,
  "throw new Error('delta directory contains undeclared entries')",
  'compiler-state promotion must reject files absent from its validated manifest'
);
requireText(
  compilerCacheDelta,
  'export function inspectCompilerCacheDelta',
  'compiler-state deltas must expose validated byte accounting for the compaction boundary'
);

const fullyValidatedJobs = [
  'lint',
  'type-check',
  'type-coverage',
  'test',
  'migrations',
  'build',
  'executor',
  'architecture',
  'deadcode',
];
for (const [index, job] of fullyValidatedJobs.entries()) {
  const start = ci.indexOf(`  ${job}:`);
  if (start < 0) {
    failures.push(`CI must retain the ${job} validation job`);
    continue;
  }
  const nextStarts = fullyValidatedJobs
    .slice(index + 1)
    .map((nextJob) => ci.indexOf(`  ${nextJob}:`, start + 1))
    .filter((position) => position >= 0);
  const end = nextStarts.length > 0 ? Math.min(...nextStarts) : ci.length;
  const section = ci.slice(start, end);
  requireText(
    section,
    'needs: validation_provenance',
    `${job} must wait for the validation provenance decision`
  );
  if (job === 'build') {
    for (const condition of [
      "github.event_name != 'push' ||",
      "needs.validation_provenance.outputs.reuse != 'true' ||",
      "needs.validation_provenance.outputs.build_baseline_available != 'true' ||",
      "needs.validation_provenance.outputs.build_refresh_required == 'true'",
    ]) {
      requireText(section, condition, `build must retain its fail-open condition: ${condition}`);
    }
  } else {
    requireText(
      section,
      "always() && (github.event_name != 'push' || needs.validation_provenance.outputs.reuse != 'true')",
      `${job} must run for pull requests and whenever exact validation reuse is unproven`
    );
  }
}
requireText(
  ci,
  'packages/tools/official/*/tsconfig.tsbuildinfo',
  'CI must preserve incremental TypeScript state without traversing dependency trees'
);
if (ci.includes('**/*.tsbuildinfo')) {
  failures.push('TypeScript cache paths must not recursively traverse node_modules');
}
requireText(ci, '  type-coverage:', 'type coverage must run independently from type checking');
requireText(ci, 'path: .type-coverage', 'CI must preserve incremental type-coverage analysis');
requireText(
  ci,
  '> apps/railway-executor/.tpmjs-release-provenance',
  'CI must create the executor provenance marker before building its image'
);

requireText(
  executorDockerfile,
  'COPY package.json deno.json deno.lock ./',
  'executor dependencies must be copied before source for stable image-layer caching'
);
requireText(
  executorDockerfile,
  'deno install --lock=deno.lock --frozen',
  'executor dependency installation must use the committed frozen lockfile'
);
requireText(
  executorDockerfile,
  'deno check --lock=deno.lock --frozen server.ts',
  'executor type checking must use the committed frozen lockfile'
);
if (executorDockerfile.includes('deno check --no-lock')) {
  failures.push('executor image builds must never disable dependency integrity locking');
}
if (/^import .*https:\/\/esm\.sh\//m.test(executorServer)) {
  failures.push(
    'executor build-time dependencies must use locked registry imports, not CDN imports'
  );
}
if (
  executorPackage.dependencies?.['zod-to-json-schema'] !== '3.25.0' ||
  executorPackage.dependencies?.zod !== '4.3.5'
) {
  failures.push('executor build-time dependency versions must remain explicitly pinned');
}
if (
  executorDenoLock.version !== '4' ||
  !executorDenoLock.specifiers?.['npm:zod-to-json-schema@3.25.0'] ||
  !executorDenoLock.specifiers?.['npm:zod@4.3.5']
) {
  failures.push('executor lockfile must cover every pinned build-time dependency');
}

const architectureJob = ci.slice(ci.indexOf('  architecture:'), ci.indexOf('  deadcode:'));
if (architectureJob.includes('pnpm build')) {
  failures.push('the architecture job must not repeat the full monorepo build');
}
requireText(
  architectureJob,
  'run: pnpm check-architecture',
  'the architecture job must run the ratchet gates directly'
);

const typeCheckJob = ci.slice(ci.indexOf('  type-check:'), ci.indexOf('  type-coverage:'));
if (typeCheckJob.includes('pnpm type-coverage')) {
  failures.push('type coverage must not serialize behind the complete type-check job');
}
requireText(typeCheckJob, '.turbo', 'the type-check job must preserve Turbo task artifacts');
requireText(typeCheckJob, 'fetch-depth: 0', 'affected type checking requires complete Git history');
requireText(
  typeCheckJob,
  'turbo run type-check --affected',
  'CI must type-check only the dependency-aware affected workspace graph'
);
requireText(
  typeCheckJob,
  'turbo ls --affected --output=json',
  'CI must skip type checking cleanly when no workspaces are affected'
);
requireText(
  typeCheckJob,
  'github.event.pull_request.base.sha || github.event.before',
  'affected type checking must compare exact event SHAs instead of a local branch name'
);
requireText(
  typeCheckJob,
  'name: pr-compiler-state-typescript',
  'successful pull requests must export reusable TypeScript state'
);
requireText(
  typeCheckJob,
  'include-hidden-files: true',
  'TypeScript state export must include the hidden Turbo cache explicitly'
);
requireText(
  typeCheckJob,
  'retention-days: 1',
  'TypeScript promotion artifacts must remain short-lived'
);

const buildJob = ci.slice(ci.indexOf('  build:'), ci.indexOf('  executor:'));
requireText(buildJob, '.turbo', 'the build job must preserve Turbo task artifacts');
requireText(buildJob, 'fetch-depth: 0', 'affected builds require complete Git history');
requireText(
  buildJob,
  'turbo run build --affected',
  'CI must build only the dependency-aware affected workspace graph'
);
requireText(
  buildJob,
  'turbo ls --affected --output=json',
  'CI must skip building cleanly when no workspaces are affected'
);
requireText(
  buildJob,
  'github.event.pull_request.base.sha || github.event.before',
  'affected builds must compare exact event SHAs instead of a local branch name'
);
requireText(
  buildJob,
  'name: pr-compiler-state-build',
  'successful pull requests must export reusable build state'
);
requireText(
  buildJob,
  'compiler-cache-delta.mjs snapshot',
  'build jobs must snapshot inherited Turbo state before compiling'
);
requireText(
  buildJob,
  'compiler-cache-delta.mjs collect',
  'build jobs must export only newly validated content-addressed cache entries'
);
const buildExport = buildJob.slice(buildJob.indexOf('- name: Export validated build state'));
requireText(
  buildExport,
  'path: .ci/compiler-state-build/',
  'build promotion artifacts must contain the bounded validated delta staging directory'
);
if (buildExport.includes('apps/web/.next/cache') || buildExport.includes('\n            .turbo')) {
  failures.push('build promotion artifacts must not re-export the inherited compiler baseline');
}
requireText(
  buildExport,
  'compression-level: 0',
  'already-compressed Turbo deltas must avoid redundant artifact compression'
);
requireText(buildJob, 'retention-days: 1', 'build promotion artifacts must remain short-lived');

if (sandboxTests.includes('run: pnpm build')) {
  failures.push('sandbox integration tests must not rebuild the unrelated monorepo');
}
const sandboxTestCommands = sandboxTests.match(
  /pnpm --dir apps\/web exec vitest run --config vitest\.integration\.config\.mjs/g
);
if (sandboxTestCommands?.length !== 2) {
  failures.push(
    'both sandbox jobs must execute Vitest directly instead of invoking a missing script'
  );
}

requireText(release, 'path: .turbo', 'release builds must preserve Turbo task artifacts');
requireText(
  release,
  'publish: pnpm changeset:publish:ci',
  'Changesets must use the candidate-aware CI publishing path'
);
if (/\n\s+- name: Build\n/.test(release) || release.includes('run: pnpm build')) {
  failures.push('the release workflow must not build the complete monorepo before Changesets');
}
if (/\n\s+- name: Build\n/.test(releasePreview) || releasePreview.includes('run: pnpm build')) {
  failures.push('release previews must audit source and registry state without compiling packages');
}
if (
  rootPackage.scripts?.['changeset:publish:ci'] !==
  'pnpm release:build --audit release-audit.json && changeset publish'
) {
  failures.push('CI publishing must build the audited release candidates exactly once');
}
requireText(
  releaseBuild,
  ['`--filter=$', '{candidate.name}...`'].join(''),
  'release builds must select each candidate and its complete workspace dependency graph'
);
requireText(
  releaseBuild,
  "'--output-logs=new-only'",
  'cached release tasks must not replay large historical logs'
);

if (failures.length > 0) {
  console.error('Build-performance contract failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Build-performance contract: incremental, CI-gated, and cache-preserving');
