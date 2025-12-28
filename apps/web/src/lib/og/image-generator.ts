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
    const response = await client.images.generate({
      model: 'gpt-image-1-mini',
      prompt,
      n: 1,
      size: '1536x1024', // Closest aspect ratio to 1200x630, will serve as-is
      quality: 'low', // Use low for faster generation and lower cost
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No data returned from OpenAI');
    }

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch generated image: ${imageResponse.status}`);
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('OpenAI image generation failed:', error);
    throw error;
  }
}
