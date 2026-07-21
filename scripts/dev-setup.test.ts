import assert from 'node:assert/strict';
import test from 'node:test';
import { parseEnv } from 'node:util';
import {
  assertEnvironmentUsesLocalDatabase,
  DEFAULT_DEV_DB_PORT,
  DEFAULT_DEV_PROJECT_NAME,
  renderLocalWebEnvironment,
  resolveLocalDatabaseConfig,
} from './dev-setup-lib';

test('uses an isolated, loopback-only database configuration by default', () => {
  assert.deepEqual(resolveLocalDatabaseConfig({}), {
    port: DEFAULT_DEV_DB_PORT,
    projectName: DEFAULT_DEV_PROJECT_NAME,
    url: 'postgresql://tpmjs:tpmjs@127.0.0.1:55433/tpmjs',
  });
});

test('accepts a deliberate port and Compose project override', () => {
  assert.deepEqual(
    resolveLocalDatabaseConfig({
      TPMJS_DEV_DB_PORT: '55439',
      TPMJS_DEV_PROJECT_NAME: 'tpmjs-dev-alice',
    }),
    {
      port: 55439,
      projectName: 'tpmjs-dev-alice',
      url: 'postgresql://tpmjs:tpmjs@127.0.0.1:55439/tpmjs',
    }
  );
});

test('rejects invalid ports and unsafe project names before invoking Compose', () => {
  assert.throws(
    () => resolveLocalDatabaseConfig({ TPMJS_DEV_DB_PORT: 'not-a-port' }),
    /must be an integer/
  );
  assert.throws(
    () => resolveLocalDatabaseConfig({ TPMJS_DEV_DB_PORT: '80' }),
    /between 1024 and 65535/
  );
  assert.throws(
    () => resolveLocalDatabaseConfig({ TPMJS_DEV_PROJECT_NAME: 'TPMJS dev' }),
    /must start with/
  );
});

test('renders a complete local environment with generated secrets', () => {
  const database = resolveLocalDatabaseConfig({});
  const rendered = renderLocalWebEnvironment(database, {
    apiKeyEncryption: 'encryption-secret',
    auth: 'auth-secret',
    cron: 'cron-secret',
  });
  const parsed = parseEnv(rendered);

  assert.equal(parsed.DATABASE_URL, database.url);
  assert.equal(parsed.DATABASE_URL_UNPOOLED, database.url);
  assert.equal(parsed.BETTER_AUTH_SECRET, 'auth-secret');
  assert.equal(parsed.API_KEY_ENCRYPTION_SECRET, 'encryption-secret');
  assert.equal(parsed.CRON_SECRET, 'cron-secret');
  assert.equal(parsed.NEXT_PUBLIC_APP_URL, 'http://localhost:3000');
});

test('preserves compatible environments and rejects ambiguous database targets', () => {
  const database = resolveLocalDatabaseConfig({});
  assert.doesNotThrow(() =>
    assertEnvironmentUsesLocalDatabase(
      `DATABASE_URL=${database.url}\nDATABASE_URL_UNPOOLED=${database.url}\n`,
      database
    )
  );
  assert.throws(
    () =>
      assertEnvironmentUsesLocalDatabase(
        'DATABASE_URL=postgresql://remote.example/tpmjs\nDATABASE_URL_UNPOOLED=postgresql://remote.example/tpmjs\n',
        database
      ),
    /file was not changed/i
  );
  assert.throws(
    () => assertEnvironmentUsesLocalDatabase('', database),
    /DATABASE_URL, DATABASE_URL_UNPOOLED/
  );
});
