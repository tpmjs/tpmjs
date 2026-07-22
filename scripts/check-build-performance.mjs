import { readFileSync } from 'node:fs';

const failures = [];

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

function requireText(source, expected, message) {
  if (!source.includes(expected)) failures.push(message);
}

const nextConfig = read('apps/web/next.config.ts');
const deploy = read('scripts/deploy-on-box.sh');
const executorDockerfile = read('apps/railway-executor/Dockerfile');
const executorServer = read('apps/railway-executor/server.ts');
const executorPackage = JSON.parse(read('apps/railway-executor/package.json'));
const executorDenoLock = JSON.parse(read('apps/railway-executor/deno.lock'));
const webDockerfile = read('Dockerfile');
const ci = read('.github/workflows/ci.yml');

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

const buildJob = ci.slice(ci.indexOf('  build:'), ci.indexOf('  executor:'));
requireText(buildJob, '.turbo', 'the build job must preserve Turbo task artifacts');
requireText(buildJob, 'fetch-depth: 0', 'affected builds require complete Git history');
requireText(
  buildJob,
  'turbo run build --affected',
  'CI must build only the dependency-aware affected workspace graph'
);

if (failures.length > 0) {
  console.error('Build-performance contract failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Build-performance contract: incremental, CI-gated, and cache-preserving');
