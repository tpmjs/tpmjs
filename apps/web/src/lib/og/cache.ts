/**
 * Cache OG images in Vercel Blob storage
 */

import { head, put } from '@vercel/blob';
import { normalizePath } from './content-extractor';

/**
 * Cache TTL in seconds (30 days)
 */
const CACHE_TTL_SECONDS = 30 * 24 * 60 * 60;

/**
 * Build cache key from path
 */
export function buildCacheKey(path: string): string {
  const normalized = normalizePath(path);
  return `og/${normalized || 'home'}.png`;
}

/**
 * Check if a cached image exists and is still valid
 * @returns The blob URL if cached and valid, null otherwise
 */
export async function getCachedImage(path: string): Promise<string | null> {
  const key = buildCacheKey(path);

  try {
    const blob = await head(key);

    if (!blob) {
      return null;
    }

    // Check if cache is still valid (within TTL)
    const uploadedAt = new Date(blob.uploadedAt);
    const now = new Date();
    const ageSeconds = (now.getTime() - uploadedAt.getTime()) / 1000;

    if (ageSeconds > CACHE_TTL_SECONDS) {
      // Cache expired
      return null;
    }

    return blob.url;
  } catch {
    // Blob doesn't exist or error accessing it
    return null;
  }
}

/**
 * Cache an image in Vercel Blob storage
 * @returns The blob URL
 */
export async function cacheImage(path: string, imageBuffer: Buffer): Promise<string> {
  const key = buildCacheKey(path);

  const { url } = await put(key, imageBuffer, {
    access: 'public',
    contentType: 'image/png',
    cacheControlMaxAge: CACHE_TTL_SECONDS,
    addRandomSuffix: false, // Use exact key for predictable caching
  });

  return url;
}
