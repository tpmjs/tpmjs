/**
 * OG Image Generation Library
 *
 * Generates unique OpenGraph images for each page using OpenAI. Generated
 * assets are committed to public/og and served by the self-hosted web app.
 */

export { extractPageContent, normalizePath } from './content-extractor';
export { generateOGImage } from './image-generator';
export { buildOGPrompt } from './prompt-builder';
export * from './types';
