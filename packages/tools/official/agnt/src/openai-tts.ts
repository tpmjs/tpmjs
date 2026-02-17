/**
 * @tpmjs/official-agnt-openai-tts — OpenAI Text-to-Speech Tools for AI Agents
 *
 * Convert text to speech audio using OpenAI's TTS API. Returns base64-encoded
 * audio content in MP3 format.
 *
 * @requires OPENAI_API_KEY environment variable
 */

import { jsonSchema, tool } from 'ai';

const TTS_URL = 'https://api.openai.com/v1/audio/speech';

// ─── Client Infrastructure ──────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error(
      'OPENAI_API_KEY environment variable is required. Get your API key from https://platform.openai.com/api-keys'
    );
  }
  return key;
}

// ─── Output Types ────────────────────────────────────────────────────────────

export interface TextToSpeechResult {
  audioContent: string;
  contentType: string;
  textLength: number;
  voice: string;
}

// ─── Text-to-Speech Tool ────────────────────────────────────────────────────

const VALID_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
const VALID_MODELS = ['tts-1', 'tts-1-hd'];

export interface TextToSpeechInput {
  text: string;
  voice?: string;
  speed?: number;
  model?: string;
}

export const textToSpeech = tool({
  description:
    'Convert text to speech audio using OpenAI TTS API. Returns base64-encoded MP3 audio. Supports multiple voices and adjustable speed.',
  inputSchema: jsonSchema<TextToSpeechInput>({
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to convert to speech (maximum 4096 characters).',
      },
      voice: {
        type: 'string',
        description: 'Voice to use: alloy, echo, fable, onyx, nova, or shimmer (default: alloy).',
      },
      speed: {
        type: 'number',
        description: 'Playback speed from 0.25 to 4.0 (default: 1.0).',
      },
      model: {
        type: 'string',
        description:
          'TTS model: "tts-1" for standard quality or "tts-1-hd" for high definition (default: tts-1).',
      },
    },
    required: ['text'],
    additionalProperties: false,
  }),
  async execute(input: TextToSpeechInput): Promise<TextToSpeechResult> {
    try {
      if (!input.text || input.text.trim().length === 0) {
        throw new Error('text is required and must be non-empty');
      }

      if (input.text.length > 4096) {
        throw new Error('text must be 4096 characters or less');
      }

      const voice = input.voice ?? 'alloy';
      if (!VALID_VOICES.includes(voice)) {
        throw new Error(`voice must be one of: ${VALID_VOICES.join(', ')}`);
      }

      const speed = input.speed ?? 1.0;
      if (speed < 0.25 || speed > 4.0) {
        throw new Error('speed must be between 0.25 and 4.0');
      }

      const model = input.model ?? 'tts-1';
      if (!VALID_MODELS.includes(model)) {
        throw new Error(`model must be one of: ${VALID_MODELS.join(', ')}`);
      }

      const apiKey = getApiKey();

      const response = await fetch(TTS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: input.text,
          voice,
          speed,
          response_format: 'mp3',
        }),
      });

      if (!response.ok) {
        let errorMessage: string;
        try {
          const errorData = (await response.json()) as {
            error?: { message?: string; type?: string; code?: string };
          };
          errorMessage = errorData.error?.message || `HTTP ${response.status}`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }

        switch (response.status) {
          case 400:
            throw new Error(`Bad request: ${errorMessage}`);
          case 401:
            throw new Error('Authentication failed: Invalid API key. Check OPENAI_API_KEY.');
          case 429:
            throw new Error(`Rate limit exceeded: ${errorMessage}`);
          case 500:
          case 503:
            throw new Error(`OpenAI service error: ${errorMessage}`);
          default:
            throw new Error(`OpenAI TTS API error (${response.status}): ${errorMessage}`);
        }
      }

      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Convert to base64
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]!);
      }
      const audioContent = btoa(binary);

      return {
        audioContent,
        contentType: 'audio/mpeg',
        textLength: input.text.length,
        voice,
      };
    } catch (error) {
      throw new Error(`Failed to convert text to speech: ${(error as Error).message}`);
    }
  },
});
