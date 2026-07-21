import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import {
  buySingleDomain,
  inviteTeamMembers,
  listProjects,
  stageRedirects,
  toggleAttackMode,
} from '../packages/tools/official/vercel/src/index';

interface CapturedRequest {
  url: string;
  method: string;
  body: unknown;
}

const originalFetch = globalThis.fetch;
const originalToken = process.env.VERCEL_TOKEN;
const originalTeamId = process.env.VERCEL_TEAM_ID;
let requests: CapturedRequest[];

function requestUrl(input: string | URL | Request): string {
  if (typeof input === 'string') return input;
  return input instanceof URL ? input.toString() : input.url;
}

function parseBody(body: BodyInit | null | undefined): unknown {
  return typeof body === 'string' ? JSON.parse(body) : null;
}

beforeEach(() => {
  requests = [];
  process.env.VERCEL_TOKEN = 'test-token';
  delete process.env.VERCEL_TEAM_ID;
  globalThis.fetch = async (input, init) => {
    requests.push({
      url: requestUrl(input),
      method: init?.method ?? 'GET',
      body: parseBody(init?.body),
    });
    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalToken === undefined) delete process.env.VERCEL_TOKEN;
  else process.env.VERCEL_TOKEN = originalToken;
  if (originalTeamId === undefined) delete process.env.VERCEL_TEAM_ID;
  else process.env.VERCEL_TEAM_ID = originalTeamId;
});

test('uses the current projects API version', async () => {
  await listProjects.execute?.({}, { toolCallId: 'test', messages: [] });
  assert.deepEqual(requests, [
    { url: 'https://api.vercel.com/v10/projects', method: 'GET', body: null },
  ]);
});

test('sends team invitations as the array required by the v2 endpoint', async () => {
  await inviteTeamMembers.execute?.(
    { teamId: 'team_123', email: 'maintainer@example.com', role: 'MEMBER' },
    { toolCallId: 'test', messages: [] }
  );
  assert.deepEqual(requests, [
    {
      url: 'https://api.vercel.com/v2/teams/team_123/members',
      method: 'POST',
      body: [{ email: 'maintainer@example.com', role: 'MEMBER' }],
    },
  ]);
});

test('maps the stable tool input to Vercel attack-mode field names', async () => {
  await toggleAttackMode.execute?.(
    { projectId: 'prj_123', enabled: true, activeUntil: 1_800_000_000 },
    { toolCallId: 'test', messages: [] }
  );
  assert.deepEqual(requests[0], {
    url: 'https://api.vercel.com/v1/security/attack-mode',
    method: 'POST',
    body: {
      projectId: 'prj_123',
      attackModeEnabled: true,
      attackModeActiveUntil: 1_800_000_000,
    },
  });
});

test('sends bulk redirects to the current endpoint with project and team provenance', async () => {
  await stageRedirects.execute?.(
    {
      projectId: 'prj_123',
      teamId: 'team_123',
      redirects: [{ source: '/old', destination: '/new', statusCode: 308 }],
    },
    { toolCallId: 'test', messages: [] }
  );
  assert.deepEqual(requests[0], {
    url: 'https://api.vercel.com/v1/bulk-redirects',
    method: 'PUT',
    body: {
      projectId: 'prj_123',
      teamId: 'team_123',
      redirects: [{ source: '/old', destination: '/new', statusCode: 308 }],
    },
  });
});

test('places the registrar domain in the path and sends the required purchase contract', async () => {
  const contactInformation = {
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    phone: '+12025550123',
    address1: '1 Computing Way',
    city: 'London',
    state: 'London',
    zip: 'SW1A 1AA',
    country: 'GB',
  };
  await buySingleDomain.execute?.(
    {
      name: 'example.com',
      expectedPrice: 12,
      years: 1,
      autoRenew: true,
      contactInformation,
    },
    { toolCallId: 'test', messages: [] }
  );
  assert.deepEqual(requests[0], {
    url: 'https://api.vercel.com/v1/registrar/domains/example.com/buy',
    method: 'POST',
    body: { expectedPrice: 12, years: 1, autoRenew: true, contactInformation },
  });
});
