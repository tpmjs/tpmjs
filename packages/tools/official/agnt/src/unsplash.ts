/**
 * @tpmjs/official-agnt-unsplash — Unsplash Photo Tools for AI Agents
 *
 * Search and retrieve photos from the Unsplash API.
 *
 * @requires UNSPLASH_ACCESS_KEY environment variable
 */

import { jsonSchema, tool } from 'ai';

const BASE_URL = 'https://api.unsplash.com';

// ─── Client Infrastructure ──────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) {
    throw new Error(
      'UNSPLASH_ACCESS_KEY environment variable is required. Get your access key from https://unsplash.com/developers'
    );
  }
  return key;
}

async function unsplashRequest<T>(method: string, path: string): Promise<T> {
  const key = getApiKey();

  const headers: Record<string, string> = {
    Authorization: `Client-ID ${key}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(`${BASE_URL}${path}`, { method, headers });

  if (!response.ok) {
    await handleApiError(response);
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

async function handleApiError(response: Response): Promise<never> {
  let errorMessage: string;
  try {
    const errorData = (await response.json()) as { errors?: string[] };
    errorMessage = errorData.errors?.join(', ') || `HTTP ${response.status}`;
  } catch {
    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
  }

  switch (response.status) {
    case 401:
      throw new Error(
        'Authentication failed: Invalid Unsplash access key. Check UNSPLASH_ACCESS_KEY.'
      );
    case 403:
      throw new Error(`Rate limit exceeded or access forbidden: ${errorMessage}`);
    case 404:
      throw new Error(`Not found: ${errorMessage}`);
    case 429:
      throw new Error(`Rate limit exceeded: ${errorMessage}`);
    default:
      throw new Error(`Unsplash API error (${response.status}): ${errorMessage}`);
  }
}

function buildQueryString(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  if (entries.length === 0) return '';
  return (
    '?' +
    entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')
  );
}

// ─── Output Types ────────────────────────────────────────────────────────────

export interface UnsplashPhotoUrls {
  raw: string;
  full: string;
  regular: string;
  small: string;
  thumb: string;
}

export interface UnsplashPhotoUser {
  name: string;
  username: string;
}

export interface UnsplashPhotoLinks {
  self: string;
  html: string;
  download: string;
}

export interface UnsplashPhoto {
  id: string;
  description: string | null;
  alt_description: string | null;
  urls: UnsplashPhotoUrls;
  width: number;
  height: number;
  user: UnsplashPhotoUser;
  links: UnsplashPhotoLinks;
}

export interface SearchPhotosResult {
  totalResults: number;
  totalPages: number;
  results: {
    id: string;
    description: string | null;
    alt_description: string | null;
    urls: UnsplashPhotoUrls;
    width: number;
    height: number;
    user: UnsplashPhotoUser;
    links: UnsplashPhotoLinks;
  }[];
}

export interface GetPhotoResult {
  id: string;
  description: string | null;
  alt_description: string | null;
  urls: UnsplashPhotoUrls;
  width: number;
  height: number;
  user: UnsplashPhotoUser;
  links: UnsplashPhotoLinks;
  downloads: number;
  likes: number;
  views: number;
  created_at: string;
}

// ─── Raw API types ───────────────────────────────────────────────────────────

interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

// ─── searchPhotos ────────────────────────────────────────────────────────────

export interface SearchPhotosInput {
  query: string;
  page?: number;
  perPage?: number;
  orientation?: string;
  orderBy?: string;
}

export const searchPhotos = tool({
  description:
    'Search for photos on Unsplash by keyword query. Returns photo URLs, dimensions, and photographer info.',
  inputSchema: jsonSchema<SearchPhotosInput>({
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query to find photos.' },
      page: { type: 'number', description: 'Page number for pagination (default: 1).' },
      perPage: {
        type: 'number',
        description: 'Number of results per page (1-30, default: 10).',
      },
      orientation: {
        type: 'string',
        description: 'Photo orientation filter: "landscape", "portrait", or "squarish".',
      },
      orderBy: {
        type: 'string',
        description: 'Sort order: "latest" or "relevant" (default: "relevant").',
      },
    },
    required: ['query'],
    additionalProperties: false,
  }),
  async execute(input: SearchPhotosInput): Promise<SearchPhotosResult> {
    try {
      if (!input.query || input.query.trim() === '') {
        throw new Error('query is required and must be non-empty');
      }
      if (input.perPage !== undefined && (input.perPage < 1 || input.perPage > 30)) {
        throw new Error('perPage must be between 1 and 30');
      }
      if (
        input.orientation !== undefined &&
        !['landscape', 'portrait', 'squarish'].includes(input.orientation)
      ) {
        throw new Error('orientation must be "landscape", "portrait", or "squarish"');
      }
      if (input.orderBy !== undefined && !['latest', 'relevant'].includes(input.orderBy)) {
        throw new Error('orderBy must be "latest" or "relevant"');
      }

      const qs = buildQueryString({
        query: input.query,
        page: input.page,
        per_page: input.perPage,
        orientation: input.orientation,
        order_by: input.orderBy,
      });

      const data = await unsplashRequest<UnsplashSearchResponse>('GET', `/search/photos${qs}`);

      return {
        totalResults: data.total,
        totalPages: data.total_pages,
        results: data.results.map((photo) => ({
          id: photo.id,
          description: photo.description,
          alt_description: photo.alt_description,
          urls: photo.urls,
          width: photo.width,
          height: photo.height,
          user: { name: photo.user.name, username: photo.user.username },
          links: photo.links,
        })),
      };
    } catch (error) {
      throw new Error(`Failed to search photos: ${(error as Error).message}`);
    }
  },
});

// ─── getRandomPhoto ──────────────────────────────────────────────────────────

export interface GetRandomPhotoInput {
  query?: string;
  orientation?: string;
  count?: number;
}

export const getRandomPhoto = tool({
  description:
    'Get one or more random photos from Unsplash, optionally filtered by a keyword query or orientation.',
  inputSchema: jsonSchema<GetRandomPhotoInput>({
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Optional topic or keyword to filter random photos.' },
      orientation: {
        type: 'string',
        description: 'Photo orientation filter: "landscape", "portrait", or "squarish".',
      },
      count: {
        type: 'number',
        description: 'Number of random photos to return (1-30, default: 1).',
      },
    },
    additionalProperties: false,
  }),
  async execute(input: GetRandomPhotoInput): Promise<UnsplashPhoto[]> {
    try {
      if (input.count !== undefined && (input.count < 1 || input.count > 30)) {
        throw new Error('count must be between 1 and 30');
      }
      if (
        input.orientation !== undefined &&
        !['landscape', 'portrait', 'squarish'].includes(input.orientation)
      ) {
        throw new Error('orientation must be "landscape", "portrait", or "squarish"');
      }

      const qs = buildQueryString({
        query: input.query,
        orientation: input.orientation,
        count: input.count ?? 1,
      });

      const data = await unsplashRequest<UnsplashPhoto | UnsplashPhoto[]>(
        'GET',
        `/photos/random${qs}`
      );

      // Unsplash returns a single object when count=1, array otherwise
      const photos = Array.isArray(data) ? data : [data];

      return photos.map((photo) => ({
        id: photo.id,
        description: photo.description,
        alt_description: photo.alt_description,
        urls: photo.urls,
        width: photo.width,
        height: photo.height,
        user: { name: photo.user.name, username: photo.user.username },
        links: photo.links,
      }));
    } catch (error) {
      throw new Error(`Failed to get random photo: ${(error as Error).message}`);
    }
  },
});

// ─── getPhoto ────────────────────────────────────────────────────────────────

export interface GetPhotoInput {
  photoId: string;
}

export const getPhoto = tool({
  description:
    'Get detailed information about a specific Unsplash photo by its ID, including download count, likes, and views.',
  inputSchema: jsonSchema<GetPhotoInput>({
    type: 'object',
    properties: {
      photoId: { type: 'string', description: 'The Unsplash photo ID to retrieve.' },
    },
    required: ['photoId'],
    additionalProperties: false,
  }),
  async execute(input: GetPhotoInput): Promise<GetPhotoResult> {
    try {
      if (!input.photoId || input.photoId.trim() === '') {
        throw new Error('photoId is required and must be non-empty');
      }

      const data = await unsplashRequest<
        UnsplashPhoto & { downloads: number; likes: number; views: number; created_at: string }
      >('GET', `/photos/${input.photoId}`);

      return {
        id: data.id,
        description: data.description,
        alt_description: data.alt_description,
        urls: data.urls,
        width: data.width,
        height: data.height,
        user: { name: data.user.name, username: data.user.username },
        links: data.links,
        downloads: data.downloads,
        likes: data.likes,
        views: data.views,
        created_at: data.created_at,
      };
    } catch (error) {
      throw new Error(`Failed to get photo: ${(error as Error).message}`);
    }
  },
});
