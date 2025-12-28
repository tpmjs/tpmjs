/**
 * OG Image API Route
 *
 * GET /api/og/[...path]
 *
 * Serves pre-generated OG images from public/og/ directory.
 * Images are generated at build time using: pnpm --filter=@tpmjs/web generate-og
 *
 * Examples:
 *   /api/og/home -> public/og/home.png
 *   /api/og/docs -> public/og/docs.png
 *   /api/og/tool/@tpmjs/hello/helloWorld -> public/og/tool/tpmjs-hello-helloworld.png
 */

import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Convert a path to the corresponding OG image filename
 * /home -> home.png
 * /tool/@tpmjs/hello/helloWorld -> tool/tpmjs-hello-helloworld.png
 */
function pathToFilename(pagePath: string): string {
  // Remove leading slash
  const cleanPath = pagePath.replace(/^\//, '');

  // Handle tool pages specially
  if (cleanPath.startsWith('tool/')) {
    // Extract package and tool name from path like tool/@scope/package/toolName
    const toolPath = cleanPath.replace('tool/', '');
    const slug = toolPath
      .replace(/^@/, '')
      .replace(/\//g, '-')
      .replace(/[^a-zA-Z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();
    return `tool/${slug}.png`;
  }

  return `${cleanPath}.png`;
}

/**
 * Serve an image file with proper headers
 */
function serveImage(buffer: Buffer): NextResponse {
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=2592000, stale-while-revalidate=86400', // 30 days
    },
  });
}

/**
 * Serve the static fallback OG image
 */
async function serveFallbackImage(): Promise<NextResponse> {
  try {
    const fallbackPath = path.join(process.cwd(), 'public', 'og-image.png');
    const buffer = await readFile(fallbackPath);
    return serveImage(buffer);
  } catch {
    return new NextResponse('Fallback image not found', { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const { path: pathSegments } = await params;
  const pagePath = `/${pathSegments.join('/')}`;

  try {
    // Convert path to filename
    const filename = pathToFilename(pagePath);
    const imagePath = path.join(process.cwd(), 'public', 'og', filename);

    // Check if file exists
    try {
      await stat(imagePath);
    } catch {
      // File doesn't exist, serve fallback
      console.log(`[OG] Image not found: ${imagePath}, serving fallback`);
      return serveFallbackImage();
    }

    // Read and serve the image
    const buffer = await readFile(imagePath);
    return serveImage(buffer);
  } catch (error) {
    console.error(`[OG] Error serving image for ${pagePath}:`, error);
    return serveFallbackImage();
  }
}
