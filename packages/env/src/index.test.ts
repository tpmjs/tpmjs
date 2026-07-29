import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createEnv } from './index.js';

const TEST_KEYS = ['TPMJS_ENV_TEST_OK', 'TPMJS_ENV_TEST_SECRET', 'TPMJS_ENV_TEST_MISSING'] as const;

function captureConsoleError() {
  return vi.spyOn(console, 'error').mockImplementation(() => {});
}

function loggedOutput(spy: ReturnType<typeof captureConsoleError>): string {
  return spy.mock.calls.map((call) => call.map(String).join(' ')).join('\n');
}

afterEach(() => {
  vi.restoreAllMocks();
  for (const key of TEST_KEYS) {
    delete process.env[key];
  }
});

describe('createEnv', () => {
  it('returns validated values when the environment is valid', () => {
    process.env.TPMJS_ENV_TEST_OK = 'hello';
    const env = createEnv({ TPMJS_ENV_TEST_OK: z.string() });
    expect(env.TPMJS_ENV_TEST_OK).toBe('hello');
  });

  it('never logs any part of a secret value on validation failure (issue #119)', () => {
    const SECRET = 'sk-live-SUPERSECRET-abcdef1234567890';
    process.env.TPMJS_ENV_TEST_SECRET = SECRET;
    const errorSpy = captureConsoleError();

    // A too-short constraint fails without the Zod message echoing the value.
    expect(() => createEnv({ TPMJS_ENV_TEST_SECRET: z.string().min(100) })).toThrow(
      /Invalid environment variables/
    );

    const output = loggedOutput(errorSpy);
    // The variable NAME must be reported so operators know what to fix...
    expect(output).toContain('TPMJS_ENV_TEST_SECRET');
    // ...but NO part of the value may appear — not the full value, and crucially
    // not the 4-char prefix the old `slice(0, 4)` preview leaked.
    expect(output).not.toContain(SECRET);
    expect(output).not.toContain(SECRET.slice(0, 4)); // 'sk-l'
    expect(output).not.toContain('sk-');
  });

  it('reports a missing variable by name without inventing a value', () => {
    delete process.env.TPMJS_ENV_TEST_MISSING;
    const errorSpy = captureConsoleError();

    expect(() => createEnv({ TPMJS_ENV_TEST_MISSING: z.string() })).toThrow(
      /Invalid environment variables/
    );

    const output = loggedOutput(errorSpy);
    expect(output).toContain('TPMJS_ENV_TEST_MISSING');
    expect(output).toContain('missing');
  });
});
