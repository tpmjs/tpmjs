#!/usr/bin/env tsx

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { verifyContract, verifyManifest } from './vercel-contract-lib';

const DEFAULT_SPEC_URL = 'https://openapi.vercel.sh/';
const SOURCE_PATH = resolve('packages/tools/official/vercel/src/index.ts');
const PACKAGE_PATH = resolve('packages/tools/official/vercel/package.json');

interface PackageManifest {
  tpmjs?: { tools?: Array<{ name?: unknown }> };
}

async function fetchSpec(url: string): Promise<unknown> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < 3) await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 500));
    }
  }
  throw new Error(`Could not fetch ${url}: ${lastError?.message}`);
}

async function readSpec(input: string | undefined): Promise<unknown> {
  if (!input || input.startsWith('https://')) return fetchSpec(input ?? DEFAULT_SPEC_URL);
  return JSON.parse(readFileSync(resolve(input), 'utf8'));
}

async function main() {
  const source = readFileSync(SOURCE_PATH, 'utf8');
  const packageManifest = JSON.parse(readFileSync(PACKAGE_PATH, 'utf8')) as PackageManifest;
  const declarations = (packageManifest.tpmjs?.tools ?? []).map((tool) => {
    if (typeof tool.name !== 'string') throw new Error('Vercel package has a tool without a name');
    return tool.name;
  });
  const manifest = verifyManifest(source, declarations);
  const result = verifyContract(source, await readSpec(process.argv[2]));
  console.log(
    `Vercel API contract: ${result.matched.length} tools match current OpenAPI routes and ${declarations.length} manifest declarations were checked.`
  );
  if (result.deprecated.length > 0) {
    console.log(
      `Warning: ${result.deprecated.length} tools use deprecated but still documented routes.`
    );
    for (const tool of result.deprecated) {
      console.log(`  DEPRECATED ${tool.name}: ${tool.method} ${tool.path}`);
    }
  }
  for (const tool of result.missing) {
    console.error(`MISSING ${tool.name}: ${tool.method} ${tool.path}`);
  }
  for (const name of result.unresolved) {
    console.error(`UNRESOLVED ${name}: no statically identifiable HTTP operation`);
  }
  for (const name of manifest.duplicateDeclarations) {
    console.error(`DUPLICATE ${name}: package manifest declares the tool more than once`);
  }
  for (const name of manifest.missingImplementations) {
    console.error(`MISSING IMPLEMENTATION ${name}: declared in package manifest but not exported`);
  }
  for (const name of manifest.undeclaredImplementations) {
    console.error(`UNDECLARED IMPLEMENTATION ${name}: exported but absent from package manifest`);
  }
  if (
    result.missing.length > 0 ||
    result.unresolved.length > 0 ||
    manifest.duplicateDeclarations.length > 0 ||
    manifest.missingImplementations.length > 0 ||
    manifest.undeclaredImplementations.length > 0
  ) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
});
