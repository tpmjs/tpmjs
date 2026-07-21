import { parseEnv } from 'node:util';

export const DEFAULT_DEV_DB_PORT = 55433;
export const DEFAULT_DEV_PROJECT_NAME = 'tpmjs-dev';

export type LocalDatabaseConfig = {
  port: number;
  projectName: string;
  url: string;
};

export type LocalSecrets = {
  apiKeyEncryption: string;
  auth: string;
  cron: string;
};

export function resolveLocalDatabaseConfig(environment: NodeJS.ProcessEnv): LocalDatabaseConfig {
  const rawPort = environment.TPMJS_DEV_DB_PORT?.trim() || String(DEFAULT_DEV_DB_PORT);
  if (!/^\d+$/.test(rawPort)) {
    throw new Error(`TPMJS_DEV_DB_PORT must be an integer; received ${JSON.stringify(rawPort)}`);
  }

  const port = Number(rawPort);
  if (!Number.isSafeInteger(port) || port < 1024 || port > 65535) {
    throw new Error(`TPMJS_DEV_DB_PORT must be between 1024 and 65535; received ${rawPort}`);
  }

  const projectName = environment.TPMJS_DEV_PROJECT_NAME?.trim() || DEFAULT_DEV_PROJECT_NAME;
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(projectName)) {
    throw new Error(
      'TPMJS_DEV_PROJECT_NAME must start with a lowercase letter or digit and contain only lowercase letters, digits, hyphens, or underscores'
    );
  }

  return {
    port,
    projectName,
    url: `postgresql://tpmjs:tpmjs@127.0.0.1:${port}/tpmjs`,
  };
}

function envLine(name: string, value: string): string {
  return `${name}=${JSON.stringify(value)}`;
}

export function renderLocalWebEnvironment(
  database: LocalDatabaseConfig,
  secrets: LocalSecrets
): string {
  return `${[
    '# Generated once by `pnpm dev:setup`. This file is gitignored.',
    '# Optional integrations can be added from the repository-root .env.example.',
    envLine('DATABASE_URL', database.url),
    envLine('DATABASE_URL_UNPOOLED', database.url),
    envLine('BETTER_AUTH_SECRET', secrets.auth),
    envLine('BETTER_AUTH_URL', 'http://localhost:3000'),
    envLine('API_KEY_ENCRYPTION_SECRET', secrets.apiKeyEncryption),
    envLine('CRON_SECRET', secrets.cron),
    envLine('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
    envLine('NEXT_PUBLIC_API_URL', 'http://localhost:3000/api'),
    envLine('NODE_ENV', 'development'),
  ].join('\n')}\n`;
}

export function assertEnvironmentUsesLocalDatabase(
  contents: string,
  database: LocalDatabaseConfig
): void {
  const environment = parseEnv(contents);
  const databaseVariables = ['DATABASE_URL', 'DATABASE_URL_UNPOOLED'] as const;
  const mismatches = databaseVariables.filter((name) => environment[name] !== database.url);

  if (mismatches.length > 0) {
    throw new Error(
      `apps/web/.env.local already exists and ${mismatches.join(', ')} does not point at the managed local database (${database.url}). The file was not changed. Reconcile it explicitly, then rerun pnpm dev:setup.`
    );
  }
}
