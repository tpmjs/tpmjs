/**
 * OG Image Generation API Route
 *
 * GET /api/og/[...path]
 *
 * Generates unique OpenGraph images for each page using OpenAI gpt-image-1-mini.
 * Images are cached in Vercel Blob storage for 30 days.
 *
 * Examples:
 *   /api/og/home -> Homepage OG image
 *   /api/og/docs -> Docs page OG image
 *   /api/og/tool/@tpmjs/hello/helloWorld -> Tool-specific OG image
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { type NextRequest, NextResponse } from 'next/server';
import {
  buildOGPrompt,
  cacheImage,
  extractPageContent,
  generateOGImage,
  getCachedImage,
} from '~/lib/og';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Serve the static fallback OG image
 */
async function serveFallbackImage(): Promise<NextResponse> {
  try {
    const fallbackPath = path.join(process.cwd(), 'public', 'og-image.png');
    const buffer = await readFile(fallbackPath);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch {
    // If even the fallback fails, return a simple error
    return new NextResponse('Fallback image not found', { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const startTime = Date.now();
  const { path: pathSegments } = await params;
  const pagePath = `/${pathSegments.join('/')}`;

  console.log(`[OG] Generating image for: ${pagePath}`);

  try {
    // 1. Check cache first
    const cachedUrl = await getCachedImage(pagePath);
    if (cachedUrl) {
      console.log(`[OG] Cache hit for: ${pagePath} (${Date.now() - startTime}ms)`);
      // Redirect to the cached blob URL
      return NextResponse.redirect(cachedUrl, { status: 302 });
    }

    console.log(`[OG] Cache miss for: ${pagePath}, generating...`);

    // 2. Extract page content
    const content = await extractPageContent(pagePath);
    console.log(`[OG] Content extracted: ${content.pageType} - ${content.title}`);

    // 3. Build prompt
    const prompt = buildOGPrompt(content);

    // 4. Generate image with OpenAI
    const imageBuffer = await generateOGImage(prompt);
    console.log(`[OG] Image generated (${imageBuffer.length} bytes)`);

    // 5. Cache the image in Vercel Blob
    const blobUrl = await cacheImage(pagePath, imageBuffer);
    console.log(`[OG] Cached to: ${blobUrl} (${Date.now() - startTime}ms)`);

    // 6. Redirect to the blob URL
    return NextResponse.redirect(blobUrl, { status: 302 });
  } catch (error) {
    console.error(`[OG] Generation failed for ${pagePath}:`, error);

    // Fall back to static image
    return serveFallbackImage();
  }
}
