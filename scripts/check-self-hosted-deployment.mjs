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
];

for (const path of forbiddenPaths) {
  if (existsSync(join(root, path))) errors.push(`${path} must not exist`);
}

const forbiddenPackages = new Set(['@vercel/analytics', '@vercel/blob', '@vercel/kv']);
for (const path of [
  'package.json',
  'apps/web/package.json',
  'apps/playground/package.json',
  'apps/tutorial/package.json',
]) {
  const manifest = JSON.parse(readFileSync(join(root, path), 'utf8'));
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies']) {
    for (const dependency of Object.keys(manifest[section] ?? {})) {
      if (forbiddenPackages.has(dependency)) {
        errors.push(`${path} ${section} contains ${dependency}`);
      }
    }
  }
}

const hostingRoots = ['apps/web', 'apps/playground', 'apps/tutorial'];
const sourceExtensions = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx']);
const forbiddenRuntimeTokens = [
  '@vercel/analytics',
  '@vercel/blob',
  '@vercel/kv',
  'VERCEL_GIT_COMMIT_SHA',
  'VERCEL_GIT_COMMIT_MESSAGE',
  'NEXT_PUBLIC_VERCEL_ENV',
  'NEXT_PUBLIC_VERCEL_URL',
];

const forbiddenWorkflowTokens = ['TURBO_TOKEN', 'TURBO_TEAM'];
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

function scan(directory) {
  for (const entry of readdirSync(directory)) {
    if (entry === 'node_modules' || entry === '.next') continue;
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      scan(path);
      continue;
    }
    if (!sourceExtensions.has(extname(path))) continue;

    const contents = readFileSync(path, 'utf8');
    for (const token of forbiddenRuntimeTokens) {
      if (contents.includes(token)) {
        errors.push(`${relative(root, path)} contains hosting token ${token}`);
      }
    }
  }
}

for (const directory of hostingRoots) scan(join(root, directory));

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
