/**
 * @tpmjs/tools-image-gen — generate and describe images with whatever provider you have.
 *
 * Providers (auto-detected, or forced with IMAGE_PROVIDER): fal.ai and Replicate return
 * hosted URLs; OpenAI (gpt-image-1 / dall-e-3) and Gemini Imagen return base64. Because a
 * tool result full of base64 is useless to an agent, base64 results are delivered to
 * DISCORD_WEBHOOK_URL when configured and come back as durable Discord CDN URLs.
 *
 * @env OPENAI_API_KEY | GEMINI_API_KEY | FAL_KEY | REPLICATE_API_TOKEN, DISCORD_WEBHOOK_URL (optional), IMAGE_PROVIDER (optional)
 */

import { jsonSchema, tool } from 'ai';

type Provider = 'fal' | 'replicate' | 'openai' | 'gemini';
type Aspect = 'square' | 'landscape' | 'portrait';

function envValue(name: string): string | undefined {
  const value = globalThis.process?.env?.[name];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

const PROVIDER_KEYS: Array<[Provider, string]> = [
  ['fal', 'FAL_KEY'],
  ['replicate', 'REPLICATE_API_TOKEN'],
  ['openai', 'OPENAI_API_KEY'],
  ['gemini', 'GEMINI_API_KEY'],
];

function detectProvider(force?: string): Provider {
  const wanted = (force ?? envValue('IMAGE_PROVIDER'))?.toLowerCase() as Provider | undefined;
  if (wanted) {
    const hit = PROVIDER_KEYS.find(([p]) => p === wanted);
    if (!hit)
      throw new Error(`Unknown image provider "${wanted}" (fal | replicate | openai | gemini).`);
    if (!envValue(hit[1])) throw new Error(`${hit[1]} is not configured for provider ${wanted}.`);
    return wanted;
  }
  const first = PROVIDER_KEYS.find(([, key]) => envValue(key));
  if (!first) {
    throw new Error(
      'No image provider configured. Set FAL_KEY, REPLICATE_API_TOKEN, OPENAI_API_KEY or GEMINI_API_KEY.'
    );
  }
  return first[0];
}

async function fail(res: Response, provider: string): Promise<never> {
  const text = await res.text().catch(() => '');
  throw new Error(
    `${provider} image request failed: ${res.status}${text ? ` — ${text.slice(0, 300)}` : ''}`
  );
}

interface Generated {
  url?: string;
  b64?: string;
  mimeType: string;
}

// ─── providers ───────────────────────────────────────────────────────────────

async function viaFal(
  prompt: string,
  n: number,
  aspect: Aspect,
  model?: string
): Promise<Generated[]> {
  const size =
    aspect === 'landscape'
      ? 'landscape_16_9'
      : aspect === 'portrait'
        ? 'portrait_16_9'
        : 'square_hd';
  const res = await fetch(`https://fal.run/${model ?? 'fal-ai/flux/schnell'}`, {
    method: 'POST',
    headers: { Authorization: `Key ${envValue('FAL_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, image_size: size, num_images: n }),
  });
  if (!res.ok) await fail(res, 'fal.ai');
  const data = (await res.json()) as { images: Array<{ url: string; content_type?: string }> };
  return data.images.map((i) => ({ url: i.url, mimeType: i.content_type ?? 'image/jpeg' }));
}

async function viaReplicate(
  prompt: string,
  n: number,
  aspect: Aspect,
  model?: string
): Promise<Generated[]> {
  const ratio = aspect === 'landscape' ? '16:9' : aspect === 'portrait' ? '9:16' : '1:1';
  const res = await fetch(
    `https://api.replicate.com/v1/models/${model ?? 'black-forest-labs/flux-schnell'}/predictions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${envValue('REPLICATE_API_TOKEN')}`,
        'Content-Type': 'application/json',
        Prefer: 'wait=60',
      },
      body: JSON.stringify({
        input: { prompt, num_outputs: n, aspect_ratio: ratio, output_format: 'jpg' },
      }),
    }
  );
  if (!res.ok) await fail(res, 'Replicate');
  const data = (await res.json()) as { output?: string | string[]; status: string; error?: string };
  if (data.error) throw new Error(`Replicate: ${data.error}`);
  const urls = Array.isArray(data.output) ? data.output : data.output ? [data.output] : [];
  if (!urls.length) throw new Error(`Replicate prediction ${data.status} without output.`);
  return urls.map((url) => ({ url, mimeType: 'image/jpeg' }));
}

const OPENAI_SIZES: Record<'legacy' | 'modern', Record<Aspect, string>> = {
  legacy: { square: '1024x1024', landscape: '1792x1024', portrait: '1024x1792' },
  modern: { square: '1024x1024', landscape: '1536x1024', portrait: '1024x1536' },
};

async function viaOpenAI(
  prompt: string,
  n: number,
  aspect: Aspect,
  quality: string,
  model?: string
): Promise<Generated[]> {
  const m = model ?? 'gpt-image-1';
  const legacy = m.startsWith('dall-e');
  const size = OPENAI_SIZES[legacy ? 'legacy' : 'modern'][aspect];
  const body: Record<string, unknown> = legacy
    ? { model: m, prompt, n: 1, size, response_format: 'url' }
    : { model: m, prompt, n, size, quality, output_format: 'jpeg' };
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${envValue('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) await fail(res, 'OpenAI');
  const data = (await res.json()) as { data: Array<{ url?: string; b64_json?: string }> };
  return data.data.map((d) => ({
    url: d.url,
    b64: d.b64_json,
    mimeType: legacy ? 'image/png' : 'image/jpeg',
  }));
}

async function viaGemini(
  prompt: string,
  n: number,
  aspect: Aspect,
  model?: string
): Promise<Generated[]> {
  const ratio = aspect === 'landscape' ? '16:9' : aspect === 'portrait' ? '9:16' : '1:1';
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model ?? 'imagen-3.0-generate-002'}:predict?key=${envValue('GEMINI_API_KEY')}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: n, aspectRatio: ratio },
      }),
    }
  );
  if (!res.ok) await fail(res, 'Gemini Imagen');
  const data = (await res.json()) as {
    predictions?: Array<{ bytesBase64Encoded: string; mimeType?: string }>;
  };
  return (data.predictions ?? []).map((p) => ({
    b64: p.bytesBase64Encoded,
    mimeType: p.mimeType ?? 'image/png',
  }));
}

function produce(
  provider: Provider,
  prompt: string,
  n: number,
  aspect: Aspect,
  quality: string,
  model?: string
): Promise<Generated[]> {
  switch (provider) {
    case 'fal':
      return viaFal(prompt, n, aspect, model);
    case 'replicate':
      return viaReplicate(prompt, n, aspect, model);
    case 'openai':
      return viaOpenAI(prompt, n, aspect, quality, model);
    default:
      return viaGemini(prompt, n, aspect, model);
  }
}

// ─── delivery ────────────────────────────────────────────────────────────────

function b64ToBlob(b64: string, mimeType: string): Blob {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

/** Post images to a Discord webhook and return their CDN URLs (durable, no base64 in the result). */
async function deliverToDiscord(images: Generated[], caption: string): Promise<string[]> {
  const webhook = envValue('DISCORD_WEBHOOK_URL');
  if (!webhook) throw new Error('DISCORD_WEBHOOK_URL is not configured for Discord delivery.');
  const form = new FormData();
  form.append('payload_json', JSON.stringify({ content: caption.slice(0, 1900) }));
  images.forEach((img, i) => {
    const ext = img.mimeType.includes('png') ? 'png' : 'jpg';
    if (img.b64)
      form.append(`files[${i}]`, b64ToBlob(img.b64, img.mimeType), `image-${i + 1}.${ext}`);
  });
  const res = await fetch(`${webhook}?wait=true`, { method: 'POST', body: form });
  if (!res.ok) await fail(res, 'Discord webhook');
  const m = (await res.json()) as { attachments?: Array<{ url: string }> };
  return (m.attachments ?? []).map((a) => a.url);
}

export interface GenerateImageInput {
  prompt: string;
  count?: number;
  aspect?: Aspect;
  quality?: 'low' | 'medium' | 'high';
  provider?: Provider;
  model?: string;
  deliver?: 'auto' | 'inline' | 'discord';
}

interface GenerateImageResult {
  provider: Provider;
  prompt: string;
  count: number;
  urls: string[];
  dataUrls?: string[];
  note?: string;
  deliveredVia: 'discord' | 'provider' | 'inline';
}

async function generate(input: GenerateImageInput): Promise<GenerateImageResult> {
  const {
    prompt,
    count = 1,
    aspect = 'square',
    quality = 'medium',
    provider,
    model,
    deliver = 'auto',
  } = input;
  const chosen = detectProvider(provider);
  const images = await produce(
    chosen,
    prompt,
    Math.min(4, Math.max(1, count)),
    aspect,
    quality,
    model
  );
  const hosted = images.filter((i) => i.url).map((i) => i.url as string);
  const pending = images.filter((i) => !i.url && i.b64);
  const useDiscord =
    deliver === 'discord' || (deliver === 'auto' && Boolean(envValue('DISCORD_WEBHOOK_URL')));
  if (pending.length && useDiscord) {
    const delivered = await deliverToDiscord(pending, `🎨 ${prompt}`);
    return {
      provider: chosen,
      prompt,
      count: images.length,
      urls: [...hosted, ...delivered],
      deliveredVia: 'discord',
    };
  }
  if (pending.length) {
    return {
      provider: chosen,
      prompt,
      count: images.length,
      urls: hosted,
      dataUrls: pending.map((i) => `data:${i.mimeType};base64,${i.b64}`),
      note: 'Inline base64 returned because no Discord webhook is configured; set DISCORD_WEBHOOK_URL to get URLs.',
      deliveredVia: 'inline',
    };
  }
  return { provider: chosen, prompt, count: images.length, urls: hosted, deliveredVia: 'provider' };
}

// ─── tools ───────────────────────────────────────────────────────────────────

export const generateImage = tool({
  description:
    'Generate one or more images from a prompt using the first configured provider (fal.ai, Replicate, OpenAI gpt-image-1/dall-e-3, Gemini Imagen). Returns image URLs — via the provider or Discord delivery — or inline data URLs when asked.',
  inputSchema: jsonSchema<GenerateImageInput>({
    type: 'object',
    properties: {
      prompt: { type: 'string', description: 'What to draw' },
      count: { type: 'integer', description: '1–4 images (default 1)', default: 1 },
      aspect: { type: 'string', enum: ['square', 'landscape', 'portrait'], default: 'square' },
      quality: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'OpenAI only (default medium)',
        default: 'medium',
      },
      provider: {
        type: 'string',
        enum: ['fal', 'replicate', 'openai', 'gemini'],
        description: 'Force a provider',
      },
      model: {
        type: 'string',
        description: 'Provider-specific model override (e.g. dall-e-3, fal-ai/flux-pro)',
      },
      deliver: {
        type: 'string',
        enum: ['auto', 'inline', 'discord'],
        description:
          'How to return base64 results: auto = Discord webhook if configured else inline data URL',
        default: 'auto',
      },
    },
    required: ['prompt'],
    additionalProperties: false,
  }),
  async execute(input): Promise<GenerateImageResult> {
    return generate(input);
  },
});

async function describeWithOpenAI(imageUrl: string, question: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${envValue('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: question },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 600,
    }),
  });
  if (!res.ok) await fail(res, 'OpenAI vision');
  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message.content ?? '';
}

async function describeWithGemini(imageUrl: string, question: string): Promise<string> {
  const download = await fetch(imageUrl);
  if (!download.ok) throw new Error(`Could not download ${imageUrl}: ${download.status}`);
  const mime = download.headers.get('content-type') ?? 'image/jpeg';
  const bytes = new Uint8Array(await download.arrayBuffer());
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${envValue('GEMINI_API_KEY')}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: question }, { inline_data: { mime_type: mime, data: btoa(bin) } }] },
        ],
      }),
    }
  );
  if (!res.ok) await fail(res, 'Gemini vision');
  const data = (await res.json()) as {
    candidates?: Array<{ content: { parts: Array<{ text?: string }> } }>;
  };
  return data.candidates?.[0]?.content.parts.map((p) => p.text ?? '').join('') ?? '';
}

export const describeImage = tool({
  description:
    'Describe an image or answer a question about it using a vision model (OpenAI gpt-4.1-mini or Gemini).',
  inputSchema: jsonSchema<{ imageUrl: string; question?: string; provider?: 'openai' | 'gemini' }>({
    type: 'object',
    properties: {
      imageUrl: { type: 'string', description: 'Public image URL (or data URL)' },
      question: {
        type: 'string',
        description: 'What to ask about the image (default: describe it in detail)',
      },
      provider: { type: 'string', enum: ['openai', 'gemini'] },
    },
    required: ['imageUrl'],
    additionalProperties: false,
  }),
  async execute({
    imageUrl,
    question = 'Describe this image in detail: subjects, setting, text, style, anything notable.',
    provider,
  }) {
    const use =
      provider ??
      (envValue('OPENAI_API_KEY') ? 'openai' : envValue('GEMINI_API_KEY') ? 'gemini' : null);
    if (!use) throw new Error('describeImage needs OPENAI_API_KEY or GEMINI_API_KEY.');
    const answer =
      use === 'openai'
        ? await describeWithOpenAI(imageUrl, question)
        : await describeWithGemini(imageUrl, question);
    return { provider: use, answer };
  },
});
