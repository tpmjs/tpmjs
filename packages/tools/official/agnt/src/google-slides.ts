/**
 * @tpmjs/official-agnt-google-slides — Google Slides API Tools for AI Agents
 *
 * Create and manage Google Slides presentations: create presentations,
 * get presentation details, and add slides with content.
 *
 * @requires GOOGLE_SERVICE_ACCOUNT_KEY environment variable (JSON string)
 */

import crypto from 'node:crypto';
import { jsonSchema, tool } from 'ai';

const BASE_URL = 'https://slides.googleapis.com/v1/presentations';

// ─── Auth Infrastructure ────────────────────────────────────────────────────

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
}

function getServiceAccountKey(): ServiceAccountKey {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_KEY environment variable is required. Provide the JSON string of your Google service account key.'
    );
  }
  try {
    const parsed = JSON.parse(keyJson) as ServiceAccountKey;
    if (!parsed.client_email || !parsed.private_key) {
      throw new Error('Invalid service account key: missing client_email or private_key');
    }
    return parsed;
  } catch (error) {
    if ((error as Error).message.includes('Invalid service account')) {
      throw error;
    }
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON. Provide the full service account key JSON string.'
    );
  }
}

function base64url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getAccessToken(): Promise<string> {
  const sa = getServiceAccountKey();
  const now = Math.floor(Date.now() / 1000);

  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/presentations https://www.googleapis.com/auth/drive',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    })
  );

  const signInput = `${header}.${payload}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signInput);
  const signature = base64url(signer.sign(sa.private_key));

  const jwt = `${signInput}.${signature}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Failed to obtain access token: ${errorText}`);
  }

  const tokenData = (await tokenResponse.json()) as { access_token: string };
  return tokenData.access_token;
}

// ─── API Request Helper ─────────────────────────────────────────────────────

async function apiRequest<T>(method: string, url: string, body?: unknown): Promise<T> {
  const token = await getAccessToken();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const options: RequestInit = { method, headers };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    let errorMessage: string;
    try {
      const errorData = (await response.json()) as { error?: { message?: string } };
      errorMessage = errorData.error?.message || `HTTP ${response.status}`;
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }

    switch (response.status) {
      case 401:
        throw new Error(
          `Authentication failed: ${errorMessage}. Check GOOGLE_SERVICE_ACCOUNT_KEY.`
        );
      case 403:
        throw new Error(
          `Access forbidden: ${errorMessage}. Ensure the service account has access to the presentation.`
        );
      case 404:
        throw new Error(`Not found: ${errorMessage}`);
      case 429:
        throw new Error(`Rate limit exceeded: ${errorMessage}`);
      default:
        throw new Error(`Google Slides API error (${response.status}): ${errorMessage}`);
    }
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface SlidesPage {
  objectId: string;
  pageType?: string;
  pageElements?: unknown[];
}

interface SlidesPresentation {
  presentationId: string;
  title: string;
  slides?: SlidesPage[];
}

interface BatchUpdateResponse {
  presentationId: string;
  replies: Array<{
    createSlide?: {
      objectId: string;
    };
  }>;
}

export interface CreatePresentationOutput {
  presentationId: string;
  title: string;
  slidesCount: number;
  url: string;
}

export interface GetPresentationOutput {
  presentationId: string;
  title: string;
  slidesCount: number;
  slides: Array<{ objectId: string; pageType: string }>;
  url: string;
}

export interface AddSlideOutput {
  slideId: string;
  presentationId: string;
}

// ─── createPresentation ─────────────────────────────────────────────────────

export interface CreatePresentationInput {
  title: string;
}

export const createPresentation = tool({
  description: 'Create a new Google Slides presentation with the given title.',
  inputSchema: jsonSchema<CreatePresentationInput>({
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'The title for the new presentation.',
      },
    },
    required: ['title'],
    additionalProperties: false,
  }),
  async execute(input: CreatePresentationInput): Promise<CreatePresentationOutput> {
    try {
      if (!input.title) {
        throw new Error('title is required and must be non-empty');
      }

      const result = await apiRequest<SlidesPresentation>('POST', BASE_URL, {
        title: input.title,
      });

      return {
        presentationId: result.presentationId,
        title: result.title,
        slidesCount: result.slides?.length ?? 0,
        url: `https://docs.google.com/presentation/d/${result.presentationId}`,
      };
    } catch (error) {
      throw new Error(`Failed to create presentation: ${(error as Error).message}`);
    }
  },
});

// ─── getPresentation ────────────────────────────────────────────────────────

export interface GetPresentationInput {
  presentationId: string;
}

export const getPresentation = tool({
  description:
    'Get information about a Google Slides presentation including slide count and slide details.',
  inputSchema: jsonSchema<GetPresentationInput>({
    type: 'object',
    properties: {
      presentationId: {
        type: 'string',
        description: 'The ID of the presentation to retrieve.',
      },
    },
    required: ['presentationId'],
    additionalProperties: false,
  }),
  async execute(input: GetPresentationInput): Promise<GetPresentationOutput> {
    try {
      if (!input.presentationId) {
        throw new Error('presentationId is required and must be non-empty');
      }

      const result = await apiRequest<SlidesPresentation>(
        'GET',
        `${BASE_URL}/${input.presentationId}`
      );

      return {
        presentationId: result.presentationId,
        title: result.title,
        slidesCount: result.slides?.length ?? 0,
        slides: (result.slides || []).map((slide) => ({
          objectId: slide.objectId,
          pageType: slide.pageType || 'SLIDE',
        })),
        url: `https://docs.google.com/presentation/d/${result.presentationId}`,
      };
    } catch (error) {
      throw new Error(`Failed to get presentation: ${(error as Error).message}`);
    }
  },
});

// ─── addSlide ───────────────────────────────────────────────────────────────

export interface AddSlideInput {
  presentationId: string;
  layoutType?: string;
  title?: string;
  body?: string;
}

const VALID_LAYOUTS = [
  'BLANK',
  'TITLE',
  'TITLE_AND_BODY',
  'TITLE_AND_TWO_COLUMNS',
  'TITLE_ONLY',
  'ONE_COLUMN_TEXT',
  'MAIN_POINT',
  'SECTION_HEADER',
  'SECTION_TITLE_AND_DESCRIPTION',
  'BIG_NUMBER',
  'CAPTION_ONLY',
];

export const addSlide = tool({
  description:
    'Add a new slide to a Google Slides presentation with an optional layout, title text, and body text.',
  inputSchema: jsonSchema<AddSlideInput>({
    type: 'object',
    properties: {
      presentationId: {
        type: 'string',
        description: 'The ID of the presentation to add a slide to.',
      },
      layoutType: {
        type: 'string',
        description:
          'The slide layout type: "BLANK", "TITLE", "TITLE_AND_BODY", etc. (default: "BLANK").',
      },
      title: {
        type: 'string',
        description: 'Optional title text to insert on the slide.',
      },
      body: {
        type: 'string',
        description: 'Optional body text to insert on the slide.',
      },
    },
    required: ['presentationId'],
    additionalProperties: false,
  }),
  async execute(input: AddSlideInput): Promise<AddSlideOutput> {
    try {
      if (!input.presentationId) {
        throw new Error('presentationId is required and must be non-empty');
      }

      const layoutType = input.layoutType || 'BLANK';
      if (!VALID_LAYOUTS.includes(layoutType)) {
        throw new Error(
          `Invalid layoutType "${layoutType}". Must be one of: ${VALID_LAYOUTS.join(', ')}`
        );
      }

      const slideObjectId = `slide_${Date.now()}`;

      const requests: unknown[] = [
        {
          createSlide: {
            objectId: slideObjectId,
            slideLayoutReference: {
              predefinedLayout: layoutType,
            },
          },
        },
      ];

      // Create the slide first to get its placeholders
      const createResult = await apiRequest<BatchUpdateResponse>(
        'POST',
        `${BASE_URL}/${input.presentationId}:batchUpdate`,
        { requests }
      );

      const createdSlideId = createResult.replies?.[0]?.createSlide?.objectId || slideObjectId;

      // If title or body text is provided, we need to find placeholder IDs
      if (input.title || input.body) {
        // Get the presentation to find placeholder element IDs on the new slide
        const presentation = await apiRequest<SlidesPresentation>(
          'GET',
          `${BASE_URL}/${input.presentationId}`
        );

        const newSlide = presentation.slides?.find((s) => s.objectId === createdSlideId);

        if (newSlide?.pageElements) {
          const textRequests: unknown[] = [];

          for (const element of newSlide.pageElements as Array<{
            objectId: string;
            shape?: {
              placeholder?: { type: string };
            };
          }>) {
            if (element.shape?.placeholder?.type === 'TITLE' && input.title) {
              textRequests.push({
                insertText: {
                  objectId: element.objectId,
                  text: input.title,
                  insertionIndex: 0,
                },
              });
            } else if (element.shape?.placeholder?.type === 'BODY' && input.body) {
              textRequests.push({
                insertText: {
                  objectId: element.objectId,
                  text: input.body,
                  insertionIndex: 0,
                },
              });
            } else if (
              element.shape?.placeholder?.type === 'SUBTITLE' &&
              input.body &&
              layoutType === 'TITLE'
            ) {
              textRequests.push({
                insertText: {
                  objectId: element.objectId,
                  text: input.body,
                  insertionIndex: 0,
                },
              });
            }
          }

          if (textRequests.length > 0) {
            await apiRequest<BatchUpdateResponse>(
              'POST',
              `${BASE_URL}/${input.presentationId}:batchUpdate`,
              { requests: textRequests }
            );
          }
        }
      }

      return {
        slideId: createdSlideId,
        presentationId: input.presentationId,
      };
    } catch (error) {
      throw new Error(`Failed to add slide: ${(error as Error).message}`);
    }
  },
});
