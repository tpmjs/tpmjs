/**
 * Generate OG images using OpenAI gpt-image-1-mini
 */

import OpenAI from 'openai';

// Lazy initialization to avoid build-time errors
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

/**
 * Generate an OG image using OpenAI's image generation API
 * @param prompt - The prompt describing the image to generate
 * @returns Buffer containing the generated PNG image
 */
export async function generateOGImage(prompt: string): Promise<Buffer> {
  try {
    const client = getOpenAIClient();
    console.log('[OG] Calling OpenAI image generation...');

    const response = await client.images.generate({
      model: 'gpt-image-1-mini',
      prompt,
      n: 1,
      size: '1536x1024', // Landscape format, closest to 1200x630 OG ratio
      quality: 'medium',
    });

    console.log('[OG] OpenAI response received');

    if (!response.data || response.data.length === 0) {
      throw new Error('No data returned from OpenAI');
    }

    // gpt-image-1-mini returns base64 encoded image
    const b64 = response.data[0]?.b64_json;
    if (!b64) {
      throw new Error('No base64 image data returned from OpenAI');
    }

    console.log(`[OG] Got base64 image (${b64.length} chars)`);
    return Buffer.from(b64, 'base64');
  } catch (error) {
    console.error('[OG] OpenAI image generation failed:', error);
    throw error;
  }
}
