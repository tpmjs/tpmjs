import assert from 'node:assert/strict';
import test from 'node:test';
import { generateImage } from '../dist/index.js';

const keys = [
  'FAL_KEY',
  'REPLICATE_API_TOKEN',
  'OPENAI_API_KEY',
  'GEMINI_API_KEY',
  'MAGIC_HOUR_API_KEY',
  'IMAGE_PROVIDER',
  'DISCORD_WEBHOOK_URL',
];
const ctx = { toolCallId: 'test-image', messages: [] };
function setup(t, configured, responses) {
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  for (const key of keys) delete process.env[key];
  Object.assign(process.env, configured);
  t.after(() => {
    for (const key of keys) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url: String(url), options });
    const next = responses.shift();
    if (next instanceof Error) throw next;
    assert.notEqual(next, undefined, 'Unexpected request');
    return new Response(JSON.stringify(next));
  });
  return calls;
}

const complete = {
  id: 'image_sdk',
  status: 'complete',
  downloads: [
    {
      url: 'https://output.example/image.png?signature=fixture',
      expires_at: new Date(Date.now() + 86_400_000).toISOString(),
    },
  ],
};

test('only Magic Hour configured: actual exported tool selects it', async (t) => {
  const calls = setup(t, { MAGIC_HOUR_API_KEY: 'fixture-key' }, [
    { id: 'image_sdk', credits_charged: 5 },
    complete,
  ]);
  const result = await generateImage.execute({ prompt: 'A mug' }, ctx);
  assert.equal(result.provider, 'magichour');
  assert.deepEqual(result.urls, [complete.downloads[0].url]);
  assert.equal(result.deliveredVia, 'provider');
  assert.equal(calls[0].url, 'https://api.magichour.ai/v1/ai-image-generator');
});

test('adding Magic Hour key preserves existing fal preference', async (t) => {
  const calls = setup(t, { FAL_KEY: 'fixture-fal', MAGIC_HOUR_API_KEY: 'fixture-mh' }, [
    { images: [{ url: 'https://output.example/fal.jpg' }] },
  ]);
  const result = await generateImage.execute({ prompt: 'A mug' }, ctx);
  assert.equal(result.provider, 'fal');
  assert.match(calls[0].url, /^https:\/\/fal.run\//);
});

test('explicit Magic Hour selection overrides a configured fal key', async (t) => {
  const calls = setup(t, { FAL_KEY: 'fixture-fal', MAGIC_HOUR_API_KEY: 'fixture-mh' }, [
    { id: 'image_sdk', credits_charged: 5 },
    complete,
  ]);
  const result = await generateImage.execute(
    { prompt: 'A mug', provider: 'magichour', aspect: 'portrait' },
    ctx
  );
  assert.equal(result.provider, 'magichour');
  assert.equal(JSON.parse(calls[0].options.body).aspect_ratio, '9:16');
});

test('project-ID recovery through the actual exported tool uses GET only', async (t) => {
  const calls = setup(t, { MAGIC_HOUR_API_KEY: 'fixture-key' }, [complete]);
  const result = await generateImage.execute(
    { prompt: 'A mug', provider: 'magichour', projectId: 'image_sdk' },
    ctx
  );
  assert.equal(result.provider, 'magichour');
  assert.ok(calls.every((c) => c.options.method === 'GET'));
});

test('resume fields cannot cause another provider to create a charged job', async (t) => {
  const calls = setup(t, { FAL_KEY: 'fixture-fal' }, []);
  await assert.rejects(
    generateImage.execute({ prompt: 'A mug', provider: 'fal', projectId: 'image_sdk' }, ctx),
    /only for provider=magichour/
  );
  assert.equal(calls.length, 0);
});
