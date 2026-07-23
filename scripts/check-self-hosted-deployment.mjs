import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const errors = [];

const forbiddenPaths = [
  '.vercel',
  '.vercelignore',
  'vercel.json',
  'apps/web/vercel.json',
  'apps/playground/vercel.json',
  'apps/tutorial/vercel.json',
  'templates/vercel-executor',
  'apps/web/src/app/docs/executors/vercel',
  'docs/history/vercel-deployment.md',
  '.github/workflows/vercel-api-contract.yml',
  'packages/tools/official/vercel',
  'scripts/archive/sync-vercel-ai-registry.ts',
  'scripts/vercel-contract-lib.ts',
  'scripts/vercel-contract.test.ts',
  'scripts/vercel-tools.test.ts',
  'scripts/verify-vercel-api.ts',
];

for (const path of forbiddenPaths) {
  if (existsSync(join(root, path))) errors.push(`${path} must not exist`);
}

const forbiddenPackageNames = new Set(['@tpmjs/tools-vercel']);
const packageManifestPaths = ['package.json'];

function collectPackageManifests(directory) {
  for (const entry of readdirSync(directory)) {
    if (entry === 'node_modules' || entry === '.next' || entry === 'dist') continue;
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      collectPackageManifests(path);
      continue;
    }
    if (entry === 'package.json') packageManifestPaths.push(relative(root, path));
  }
}

for (const directory of ['apps', 'packages', 'services', 'templates']) {
  collectPackageManifests(join(root, directory));
}

for (const path of packageManifestPaths) {
  const manifest = JSON.parse(readFileSync(join(root, path), 'utf8'));
  if (forbiddenPackageNames.has(manifest.name)) {
    errors.push(`${path} declares retired package ${manifest.name}`);
  }
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies']) {
    for (const dependency of Object.keys(manifest[section] ?? {})) {
      if (dependency.startsWith('@vercel/')) {
        errors.push(`${path} ${section} contains ${dependency}`);
      }
    }
  }
}

const runtimeRoots = ['apps', 'packages', 'scripts', 'services', 'templates'];
const sourceExtensions = new Set([
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.sh',
  '.py',
  '.rs',
  '.yml',
  '.yaml',
]);
const forbiddenRuntimeTokens = [
  '@vercel/analytics',
  '@vercel/blob',
  '@vercel/kv',
  'VERCEL_GIT_COMMIT_SHA',
  'VERCEL_GIT_COMMIT_MESSAGE',
  'NEXT_PUBLIC_VERCEL_ENV',
  'NEXT_PUBLIC_VERCEL_URL',
  'VERCEL_TOKEN',
  'VERCEL_TEAM_ID',
  'VERCEL_OIDC_TOKEN',
  'AI_GATEWAY_API_KEY',
  'VERCEL_AI_GATEWAY',
  '@ai-sdk/gateway',
  'https://api.vercel.com',
  'https://openapi.vercel.sh',
  'ops.vercel',
];

const forbiddenWorkflowTokens = [
  'TURBO_TOKEN',
  'TURBO_TEAM',
  '@vercel/',
  'api.vercel.com',
  'VERCEL_TOKEN',
  'VERCEL_TEAM_ID',
  'verify:vercel',
];
const workflowRoot = join(root, '.github', 'workflows');

for (const entry of readdirSync(workflowRoot)) {
  const path = join(workflowRoot, entry);
  if (statSync(path).isDirectory()) continue;

  const contents = readFileSync(path, 'utf8');
  for (const token of forbiddenWorkflowTokens) {
    if (contents.includes(token)) {
      errors.push(`${relative(root, path)} contains remote-cache token ${token}`);
    }
  }
}

function scanRuntime(directory) {
  for (const entry of readdirSync(directory)) {
    if (entry === 'node_modules' || entry === '.next') continue;
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      scanRuntime(path);
      continue;
    }
    if (!sourceExtensions.has(extname(path))) continue;
    if (relative(root, path) === 'scripts/check-self-hosted-deployment.mjs') continue;

    const contents = readFileSync(path, 'utf8');
    for (const token of forbiddenRuntimeTokens) {
      if (contents.includes(token)) {
        errors.push(`${relative(root, path)} contains hosting token ${token}`);
      }
    }
  }
}

for (const directory of runtimeRoots) scanRuntime(join(root, directory));

const productRoots = [
  'apps/web/src',
  'apps/tutorial/src',
  'apps/playground/src',
  'templates/railway-executor',
  'templates/unsandbox-executor',
];
const productExtensions = new Set([...sourceExtensions, '.md']);
const staleProductPhrases = ['Vercel AI SDK', 'Vercel Sandbox', 'deployed on Vercel', 'vercel.app'];

function scanProductContent(directory) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      scanProductContent(path);
      continue;
    }
    if (!productExtensions.has(extname(path))) continue;

    const contents = readFileSync(path, 'utf8');
    for (const phrase of staleProductPhrases) {
      if (contents.includes(phrase)) {
        errors.push(`${relative(root, path)} contains retired product copy ${phrase}`);
      }
    }
  }
}

for (const directory of productRoots) scanProductContent(join(root, directory));

if (errors.length > 0) {
  console.error('TPMJS production must remain self-hosted and remote-cache independent:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Self-hosted deployment and local-only build cache: verified');
