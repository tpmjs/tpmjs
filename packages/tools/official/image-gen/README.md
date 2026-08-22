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
