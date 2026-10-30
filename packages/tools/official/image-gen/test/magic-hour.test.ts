import assert from 'node:assert/strict';
import test from 'node:test';
import { generateMagicHourImages, MagicHourProjectError } from '../src/magic-hour.ts';

const expires = new Date(Date.now() + 86_400_000).toISOString();
const signedUrl = 'https://output.example/image.png?sig=keep%2Bexact';
const input = {
  token: 'test-key',
  prompt: 'A mug',
  count: 1,
  aspect: 'square' as const,
  intervalMs: 0,
};
function sequence(values: unknown[]) {
  const calls: Array<{ url: string; options?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    const next = values.shift();
    if (next instanceof Error) throw next;
    assert.notEqual(next, undefined, 'Unexpected request');
    return new Response(JSON.stringify(next));
  };
  return { calls, fetchImpl };
}

test('submits current request shape and preserves the exact signed result', async () => {
  const f = sequence([
    { id: 'image_1', credits_charged: 5 },
    { id: 'image_1', status: 'complete', downloads: [{ url: signedUrl, expires_at: expires }] },
  ]);
  assert.deepEqual(await generateMagicHourImages({ ...input, ...f }), [
    { url: signedUrl, mimeType: 'image/png' },
  ]);
  assert.deepEqual(JSON.parse(String(f.calls[0].options?.body)), {
    image_count: 1,
    model: 'z-image-turbo',
    aspect_ratio: '1:1',
    resolution: '640px',
    style: { prompt: 'A mug' },
  });
  assert.equal(f.calls[0].options?.redirect, 'error');
  assert.equal(f.calls.filter((c) => c.options?.method === 'POST').length, 1);
});

test('status failure preserves accepted ID, then resume is GET-only', async () => {
  const f = sequence([{ id: 'image_2', credits_charged: 5 }, new Error('network')]);
  await assert.rejects(generateMagicHourImages({ ...input, ...f }), (e) => {
    assert.ok(e instanceof MagicHourProjectError);
    assert.equal(e.projectId, 'image_2');
    assert.ok(e.message.includes('projectId=image_2'));
    return true;
  });
  const resumed = sequence([
    { id: 'image_2', status: 'complete', downloads: [{ url: signedUrl, expires_at: expires }] },
  ]);
  await generateMagicHourImages({ ...input, ...resumed, projectId: 'image_2' });
  assert.ok(resumed.calls.every((c) => c.options?.method === 'GET'));
});

test('ambiguous submit never retries or exposes the key', async () => {
  const f = sequence([new Error('network')]);
  await assert.rejects(generateMagicHourImages({ ...input, ...f }), (e) => {
    assert.ok(e instanceof MagicHourProjectError);
    assert.equal(e.projectId, undefined);
    assert.ok(!e.message.includes('test-key'));
    assert.match(e.message, /unknown/);
    return true;
  });
  assert.equal(f.calls.length, 1);
});

for (const status of ['error', 'canceled', 'draft', 'new-unknown-status']) {
  test(`terminal or unknown status ${status} retains ID`, async () => {
    const f = sequence([{ id: 'image_3', status }]);
    await assert.rejects(
      generateMagicHourImages({ ...input, ...f, projectId: 'image_3' }),
      (e) => e instanceof MagicHourProjectError && e.projectId === 'image_3'
    );
  });
}

test('missing or expired outputs are not successful', async () => {
  for (const downloads of [
    [],
    [{ url: signedUrl, expires_at: '2020-01-01T00:00:00Z' }],
    [{ url: 'http://output.example/image.png', expires_at: expires }],
  ]) {
    const f = sequence([{ id: 'image_4', status: 'complete', downloads }]);
    await assert.rejects(
      generateMagicHourImages({ ...input, ...f, projectId: 'image_4' }),
      MagicHourProjectError
    );
  }
});

test('wrong or missing project identity is rejected', async () => {
  for (const response of [null, { id: 'another', status: 'complete' }]) {
    const f = sequence([response]);
    await assert.rejects(
      generateMagicHourImages({ ...input, ...f, projectId: 'image_4' }),
      MagicHourProjectError
    );
  }
});

test('invalid input is rejected before a charged call', async () => {
  const f = sequence([]);
  for (const count of [0, 1.5, 5])
    await assert.rejects(generateMagicHourImages({ ...input, ...f, count }));
  await assert.rejects(generateMagicHourImages({ ...input, ...f, projectId: '../another' }));
  assert.equal(f.calls.length, 0);
});

test('malformed creation receipt is not silently resubmitted', async () => {
  const f = sequence([null]);
  await assert.rejects(generateMagicHourImages({ ...input, ...f }), MagicHourProjectError);
  assert.equal(f.calls.length, 1);
});

test('bounded waiting retains ID for recovery', async () => {
  const f = sequence([{ id: 'image_5', status: 'rendering' }]);
  await assert.rejects(
    generateMagicHourImages({ ...input, ...f, projectId: 'image_5', waitMs: 1, intervalMs: 5 }),
    (e) => e instanceof MagicHourProjectError && e.projectId === 'image_5'
  );
  assert.ok(f.calls.every((c) => c.options?.method === 'GET'));
});
