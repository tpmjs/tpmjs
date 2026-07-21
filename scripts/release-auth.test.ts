import assert from 'node:assert/strict';
import test from 'node:test';
import {
  authorizeNpmPackage,
  authorizeNpmPackages,
  githubOidcUrl,
  npmOidcExchangeUrl,
  releaseCandidates,
  requestGitHubOidcToken,
} from './release-auth-lib';

const audit = {
  summary: { safe: true, publishCount: 2 },
  packages: [
    { name: '@tpmjs/current', version: '1.0.0', state: 'current', safe: true },
    { name: '@tpmjs/existing', version: '1.1.0', state: 'publish', safe: true },
    { name: '@tpmjs/new', version: '0.1.0', state: 'new-package', safe: true },
  ],
};

test('extracts only safe publish candidates and preserves their state', () => {
  assert.deepEqual(releaseCandidates(audit), [
    { name: '@tpmjs/existing', version: '1.1.0', state: 'publish' },
    { name: '@tpmjs/new', version: '0.1.0', state: 'new-package' },
  ]);
});

test('fails closed on an unsafe audit or inconsistent publish count', () => {
  assert.throws(
    () => releaseCandidates({ ...audit, summary: { safe: false, publishCount: 2 } }),
    /not safe/
  );
  assert.throws(
    () => releaseCandidates({ ...audit, summary: { safe: true, publishCount: 1 } }),
    /publish count mismatch/
  );
});

test('constructs exact GitHub audience and encoded npm package URLs', () => {
  assert.equal(
    githubOidcUrl('https://actions.example/token?api-version=1'),
    'https://actions.example/token?api-version=1&audience=npm%3Aregistry.npmjs.org'
  );
  assert.equal(
    npmOidcExchangeUrl('@tpmjs/tools-vercel'),
    'https://registry.npmjs.org/-/npm/v1/oidc/token/exchange/package/%40tpmjs%2Ftools-vercel'
  );
});

test('requests the npm audience without exposing the GitHub bearer token', async () => {
  let request: { url: string; authorization: string | null } | null = null;
  const fetcher: typeof fetch = async (input, init) => {
    request = {
      url: String(input),
      authorization: new Headers(init?.headers).get('authorization'),
    };
    return Response.json({ value: 'short-lived-github-identity' });
  };
  const token = await requestGitHubOidcToken(
    { requestUrl: 'https://actions.example/token', requestToken: 'runner-secret' },
    fetcher
  );
  assert.equal(token, 'short-lived-github-identity');
  assert.deepEqual(request, {
    url: 'https://actions.example/token?audience=npm%3Aregistry.npmjs.org',
    authorization: 'Bearer runner-secret',
  });
});

test('verifies package-scoped npm exchange and retains no registry token', async () => {
  let request: { url: string; method: string | undefined; authorization: string | null } | null =
    null;
  const fetcher: typeof fetch = async (input, init) => {
    request = {
      url: String(input),
      method: init?.method,
      authorization: new Headers(init?.headers).get('authorization'),
    };
    return Response.json(
      { token_type: 'oidc', token: 'discard-me', expires: '2026-07-21T11:00:00.000Z' },
      { status: 201 }
    );
  };
  const authorization = await authorizeNpmPackage(
    { name: '@tpmjs/tools-vercel', version: '0.3.0', state: 'publish' },
    'github-identity',
    fetcher
  );
  assert.deepEqual(authorization, {
    name: '@tpmjs/tools-vercel',
    version: '0.3.0',
    expires: '2026-07-21T11:00:00.000Z',
  });
  assert.deepEqual(request, {
    url: 'https://registry.npmjs.org/-/npm/v1/oidc/token/exchange/package/%40tpmjs%2Ftools-vercel',
    method: 'POST',
    authorization: 'Bearer github-identity',
  });
});

test('reports package identity and HTTP status when npm rejects trust', async () => {
  const fetcher: typeof fetch = async () =>
    Response.json({ message: 'trusted publisher not configured' }, { status: 401 });
  await assert.rejects(
    authorizeNpmPackage(
      { name: '@tpmjs/tools-vercel', version: '0.3.0', state: 'publish' },
      'github-identity',
      fetcher
    ),
    /@tpmjs\/tools-vercel@0\.3\.0.*HTTP 401.*trusted publisher not configured/
  );
});

test('checks every publish candidate and reports all denied trust grants', async () => {
  const attempted: string[] = [];
  const fetcher: typeof fetch = async (input) => {
    const packageName = decodeURIComponent(String(input).split('/').at(-1) ?? '');
    attempted.push(packageName);
    return Response.json({ message: 'trusted publisher not configured' }, { status: 404 });
  };
  const report = await authorizeNpmPackages(
    [
      { name: '@tpmjs/tools-unsandbox', version: '0.1.5', state: 'publish' },
      { name: '@tpmjs/tools-vercel', version: '0.3.0', state: 'publish' },
    ],
    'github-identity',
    fetcher
  );

  assert.deepEqual(attempted, ['@tpmjs/tools-unsandbox', '@tpmjs/tools-vercel']);
  assert.deepEqual(report.authorized, []);
  assert.equal(report.denied.length, 2);
  assert.match(report.denied[0].error, /@tpmjs\/tools-unsandbox@0\.1\.5.*HTTP 404/);
  assert.match(report.denied[1].error, /@tpmjs\/tools-vercel@0\.3\.0.*HTTP 404/);
});
