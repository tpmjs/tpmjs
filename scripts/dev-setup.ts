#!/usr/bin/env tsx

import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { constants, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertEnvironmentUsesLocalDatabase,
  type LocalDatabaseConfig,
  renderLocalWebEnvironment,
  resolveLocalDatabaseConfig,
} from './dev-setup-lib';

type ComposeCommand = {
  command: string;
  prefix: string[];
};

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const composeFile = path.join(repositoryRoot, 'compose.dev.yaml');
const webEnvironmentFile = path.join(repositoryRoot, 'apps/web/.env.local');

function commandResult(
  command: string,
  args: string[],
  environment: NodeJS.ProcessEnv,
  stdio: 'ignore' | 'inherit' | 'pipe' = 'inherit'
) {
  return spawnSync(command, args, {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env: environment,
    stdio,
  });
}

function run(command: string, args: string[], environment: NodeJS.ProcessEnv, label: string): void {
  const result = commandResult(command, args, environment);
  if (result.error) {
    throw new Error(`${label} could not start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status ?? 'unknown'}`);
  }
}

function detectCompose(environment: NodeJS.ProcessEnv): ComposeCommand {
  const candidates: ComposeCommand[] = [
    { command: 'docker', prefix: ['compose'] },
    { command: 'podman', prefix: ['compose'] },
  ];
  for (const candidate of candidates) {
    const composeResult = commandResult(
      candidate.command,
      [...candidate.prefix, 'version'],
      environment,
      'ignore'
    );
    const engineResult = commandResult(candidate.command, ['info'], environment, 'ignore');
    if (
      !composeResult.error &&
      composeResult.status === 0 &&
      !engineResult.error &&
      engineResult.status === 0
    ) {
      return candidate;
    }
  }
  throw new Error(
    'Docker Compose v2 or Podman Compose is required. Install one, start its container engine, and rerun pnpm dev:setup.'
  );
}

function generatedSecret(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

function ensureWebEnvironment(database: LocalDatabaseConfig): 'created' | 'preserved' {
  if (existsSync(webEnvironmentFile)) {
    assertEnvironmentUsesLocalDatabase(readFileSync(webEnvironmentFile, 'utf8'), database);
    return 'preserved';
  }

  const contents = renderLocalWebEnvironment(database, {
    apiKeyEncryption: generatedSecret(),
    auth: generatedSecret(),
    cron: randomBytes(32).toString('hex'),
  });
  try {
    writeFileSync(webEnvironmentFile, contents, { flag: 'wx', mode: 0o600 });
    return 'created';
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    assertEnvironmentUsesLocalDatabase(readFileSync(webEnvironmentFile, 'utf8'), database);
    return 'preserved';
  }
}

function composeArgs(compose: ComposeCommand, args: string[]): string[] {
  return [...compose.prefix, '--file', composeFile, ...args];
}

async function waitForDatabase(
  compose: ComposeCommand,
  environment: NodeJS.ProcessEnv
): Promise<void> {
  for (let attempt = 1; attempt <= 60; attempt += 1) {
    const result = commandResult(
      compose.command,
      composeArgs(compose, [
        'exec',
        '--no-TTY',
        'postgres',
        'pg_isready',
        '--username=tpmjs',
        '--dbname=tpmjs',
      ]),
      environment,
      'pipe'
    );
    if (!result.error && result.status === 0) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  commandResult(
    compose.command,
    composeArgs(compose, ['logs', '--no-color', '--tail=100', 'postgres']),
    environment
  );
  throw new Error('Local PostgreSQL did not become ready within 30 seconds');
}

async function main(): Promise<void> {
  if (process.argv.length > 2) {
    throw new Error('pnpm dev:setup does not accept positional arguments');
  }
  await access(path.join(repositoryRoot, 'node_modules'), constants.R_OK).catch(() => {
    throw new Error('Dependencies are not installed. Run pnpm install, then pnpm dev:setup.');
  });

  const database = resolveLocalDatabaseConfig(process.env);
  const childEnvironment = {
    ...process.env,
    DATABASE_URL: database.url,
    DATABASE_URL_UNPOOLED: database.url,
    TPMJS_DEV_DB_PORT: String(database.port),
    TPMJS_DEV_PROJECT_NAME: database.projectName,
  };
  const compose = detectCompose(childEnvironment);
  const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const environmentStatus = ensureWebEnvironment(database);

  console.log(`Local environment ${environmentStatus}: apps/web/.env.local`);
  console.log(`Starting PostgreSQL on 127.0.0.1:${database.port}...`);
  run(
    compose.command,
    composeArgs(compose, ['config', '--quiet']),
    childEnvironment,
    'Compose validation'
  );
  run(
    compose.command,
    composeArgs(compose, ['up', '--detach', 'postgres']),
    childEnvironment,
    'PostgreSQL startup'
  );
  await waitForDatabase(compose, childEnvironment);

  console.log('Applying the checked-in migration history...');
  run(
    pnpmCommand,
    ['--filter=@tpmjs/db', 'db:migrate:deploy'],
    childEnvironment,
    'Database migration'
  );
  run(
    pnpmCommand,
    ['--filter=@tpmjs/db', 'db:generate'],
    childEnvironment,
    'Prisma client generation'
  );
  console.log('Seeding the offline starter registry...');
  run(pnpmCommand, ['--filter=@tpmjs/db', 'db:seed'], childEnvironment, 'Database seed');
  run(
    pnpmCommand,
    ['--filter=@tpmjs/db', 'db:verify-counter-invariants'],
    childEnvironment,
    'Database invariant verification'
  );

  console.log('\nTPMJS development is ready.');
  console.log('Start the web app with: pnpm --filter=@tpmjs/web dev');
  console.log(`Local database: ${database.url}`);
  console.log(
    'Your database volume is persistent; rerunning pnpm dev:setup is safe and idempotent.'
  );
}

main().catch((error: unknown) => {
  console.error(`dev:setup failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
