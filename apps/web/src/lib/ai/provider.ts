/**
 * Text-generation model provider for the skills / use-cases generators.
 *
 * The provider is swappable via environment variables so generation can run on
 * a flat/prepaid OpenAI-compatible lane instead of per-token OpenAI (the site's
 * OpenAI key is unfunded, so every generator currently falls straight through
 * to its registry-metadata fallback — see issue #96):
 *
 *   AI_TEXT_BASE_URL  OpenAI-compatible base URL (e.g. a coding-subscription
 *                     gateway). When unset, the standard OpenAI provider is used.
 *   AI_TEXT_API_KEY   Key for that lane. Falls back to OPENAI_API_KEY.
 *   AI_TEXT_MODEL     Default model id for that lane (default: gpt-4.1-mini).
 *
 * Point these at a funded lane and the AI-enhanced documentation comes back
 * with no code change. Providers that ignore JSON `response_format` still work:
 * the generators drive structured output via required tool calls and degrade
 * gracefully if a lane can't honor them.
 *
 * Embeddings are intentionally NOT routed through here — they stay on OpenAI's
 * embedding models (most coding-subscription lanes don't expose an embeddings
 * endpoint). See memory-embedding.ts / skills-embedding.ts.
 */

import { createOpenAI, openai } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';

const customBaseUrl = process.env.AI_TEXT_BASE_URL;

const provider = customBaseUrl
  ? createOpenAI({
      baseURL: customBaseUrl,
      apiKey: process.env.AI_TEXT_API_KEY || process.env.OPENAI_API_KEY,
    })
  : openai;

export const DEFAULT_TEXT_MODEL = process.env.AI_TEXT_MODEL || 'gpt-4.1-mini';

/**
 * The text model for a skills/use-cases generation call. Pass an explicit model
 * id only when a call genuinely needs a different one; otherwise rely on the
 * env-configured default so a single AI_TEXT_MODEL controls the subsystem.
 */
export function textModel(modelId: string = DEFAULT_TEXT_MODEL): LanguageModel {
  return provider(modelId);
}
