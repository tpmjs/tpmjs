# @tpmjs/tools-image-gen

Generate and describe images with whichever AI provider you have a key for — OpenAI, Gemini/Imagen, fal.ai or Replicate — and deliver results as URLs (Discord) instead of megabytes of base64.

Part of the **ajax weapons** set: task-level, provider-agnostic tools that an agent can pick up without learning a vendor API. Credentials come from the environment; on tpmjs add them as collection env vars (the collection owner's calls get them injected, everyone else supplies their own).

## Installation

```bash
npm install @tpmjs/tools-image-gen
```

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | no | OpenAI key (gpt-image-1 / dall-e-3 and vision) |
| `GEMINI_API_KEY` | no | Google AI Studio key (Imagen 3 and Gemini vision) |
| `FAL_KEY` | no | fal.ai key (FLUX models; returns hosted URLs) |
| `REPLICATE_API_TOKEN` | no | Replicate token (FLUX models; returns hosted URLs) |
| `DISCORD_WEBHOOK_URL` | no | If set, generated images are posted there and returned as durable Discord CDN URLs |
| `IMAGE_PROVIDER` | no | Force a provider: openai | gemini | fal | replicate (default: first configured, preferring URL-returning providers) |

## Tools

| Export | What it does |
| --- | --- |
| `generateImage` | Generate one or more images from a prompt using the first configured provider, returning URLs (via Discord delivery or the provider) or inline data. |
| `describeImage` | Describe an image or answer a question about it using a vision model (OpenAI or Gemini). |

## Usage

```typescript
import { generateImage, describeImage } from '@tpmjs/tools-image-gen';

const ctx = { toolCallId: 'c1', messages: [] };
const { urls } = await generateImage.execute({ prompt: 'a pig in a spacesuit, film still', aspect: 'landscape' }, ctx);
console.log(await describeImage.execute({ imageUrl: urls[0] }, ctx));
```

Every tool throws a readable error on provider failures (status code + provider message), so agents can react instead of guessing.

## License

MIT

## Magic Hour provider

Set `MAGIC_HOUR_API_KEY` and pass `provider: 'magichour'` (or set
`IMAGE_PROVIDER=magichour`). Existing automatic provider priority is unchanged; Magic Hour
is selected automatically only when no earlier provider key is configured.

```ts
const result = await generateImage.execute({
  prompt: 'A matte blue mug on a neutral background',
  provider: 'magichour',
  count: 1,
  aspect: 'square',
}, { toolCallId: 'image-1', messages: [] });
```

The default is `z-image-turbo` at `640px`; use a supported Magic Hour model ID to override.
The `quality` option remains OpenAI-only. Generation uses credits according to the selected
model and account. Output URLs are signed and expire: use them promptly or copy approved
assets into storage you control. They are not permanent CDN links.

The provider submits once and waits up to 60 seconds. If a request was accepted but a status
read fails or the wait ends, the error includes `projectId`. Keep that ID and call again
with `provider: 'magichour'` and the returned `projectId`; that path uses GET only. An unknown
submission outcome needs account-history reconciliation, not an automatic POST retry.

```ts
const recovered = await generateImage.execute({
  prompt: 'A matte blue mug on a neutral background',
  provider: 'magichour',
  projectId: 'THE_ACCEPTED_PROJECT_ID',
}, { toolCallId: 'recover-1', messages: [] });
```

References: [image creation](https://docs.magichour.ai/api-reference/image-projects/ai-image-generator),
[project details](https://docs.magichour.ai/api-reference/image-projects/get-image-details),
[pricing](https://magichour.ai/pricing).
