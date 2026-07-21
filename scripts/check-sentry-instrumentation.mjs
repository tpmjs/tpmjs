import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const webRoot = join(root, 'apps', 'web');
const errors = [];
const sourceExtensions = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx']);
const approvedInitializers = new Set([
  'apps/web/sentry.edge.config.ts',
  'apps/web/sentry.server.config.ts',
  'apps/web/src/instrumentation-client.ts',
]);
const discoveredInitializers = new Set();

if (existsSync(join(webRoot, 'sentry.client.config.ts'))) {
  errors.push('apps/web/sentry.client.config.ts is obsolete; use src/instrumentation-client.ts');
}

function scan(directory) {
  for (const entry of readdirSync(directory)) {
    if (entry === '.next' || entry === 'node_modules' || entry === 'public') continue;

    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      scan(path);
      continue;
    }
    if (!sourceExtensions.has(extname(path))) continue;

    const contents = readFileSync(path, 'utf8');
    const repoPath = relative(root, path);

    if (contents.includes('js.sentry-cdn.com')) {
      errors.push(`${repoPath} loads the Sentry CDN in addition to the bundled SDK`);
    }
    if (contents.includes('Sentry.init(')) {
      discoveredInitializers.add(repoPath);
      if (!approvedInitializers.has(repoPath)) {
        errors.push(`${repoPath} adds an unapproved Sentry initializer`);
      }
    }
  }
}

scan(webRoot);

for (const path of approvedInitializers) {
  if (!discoveredInitializers.has(path)) errors.push(`${path} must initialize its Sentry runtime`);
}

if (errors.length > 0) {
  console.error('TPMJS Sentry instrumentation must have one initializer per runtime:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Sentry browser, server, and edge instrumentation: single-owner contract verified');
