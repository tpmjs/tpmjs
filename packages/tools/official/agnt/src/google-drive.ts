/**
 * @tpmjs/official-agnt-google-drive — Google Drive API Tools for AI Agents
 *
 * Manage files and folders in Google Drive: list, upload, download,
 * create folders, and share files.
 *
 * @requires GOOGLE_SERVICE_ACCOUNT_KEY environment variable (JSON string)
 */

import crypto from 'node:crypto';
import { jsonSchema, tool } from 'ai';

const BASE_URL = 'https://www.googleapis.com/drive/v3';
const UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3';

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
      scope: 'https://www.googleapis.com/auth/drive',
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

async function apiRequest<T>(
  method: string,
  url: string,
  body?: unknown,
  headers?: Record<string, string>
): Promise<T> {
  const token = await getAccessToken();

  const requestHeaders: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...headers,
  };

  if (body !== undefined && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const options: RequestInit = { method, headers: requestHeaders };
  if (body !== undefined) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
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
          `Access forbidden: ${errorMessage}. Ensure the service account has access to the file or folder.`
        );
      case 404:
        throw new Error(`Not found: ${errorMessage}`);
      case 429:
        throw new Error(`Rate limit exceeded: ${errorMessage}`);
      default:
        throw new Error(`Google Drive API error (${response.status}): ${errorMessage}`);
    }
  }

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

// ─── Output Types ────────────────────────────────────────────────────────────

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

interface DriveFileList {
  files: DriveFile[];
  nextPageToken?: string;
}

interface DrivePermission {
  id: string;
  role: string;
  emailAddress?: string;
}

export interface ListDriveFilesOutput {
  files: Array<{
    id: string;
    name: string;
    mimeType: string;
    size: string | null;
    modifiedTime: string | null;
    webViewLink: string | null;
  }>;
  nextPageToken: string | null;
}

export interface UploadDriveFileOutput {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string | null;
}

export interface DownloadDriveFileOutput {
  content: string;
  fileId: string;
}

export interface CreateDriveFolderOutput {
  id: string;
  name: string;
  webViewLink: string | null;
}

export interface ShareDriveFileOutput {
  permissionId: string;
  role: string;
  email: string;
}

// ─── listDriveFiles ─────────────────────────────────────────────────────────

export interface ListDriveFilesInput {
  folderId?: string;
  pageSize?: number;
  query?: string;
}

export const listDriveFiles = tool({
  description:
    'List files in a Google Drive folder. Defaults to the root folder. Supports Drive search queries.',
  inputSchema: jsonSchema<ListDriveFilesInput>({
    type: 'object',
    properties: {
      folderId: {
        type: 'string',
        description: 'The ID of the folder to list files from (default: "root").',
      },
      pageSize: {
        type: 'number',
        description: 'Maximum number of files to return (default: 20).',
      },
      query: {
        type: 'string',
        description:
          'Additional Drive search query to filter results (e.g. "name contains \'report\'").',
      },
    },
    additionalProperties: false,
  }),
  async execute(input: ListDriveFilesInput): Promise<ListDriveFilesOutput> {
    try {
      const folderId = input.folderId || 'root';
      const pageSize = input.pageSize ?? 20;

      let q = `'${folderId}' in parents and trashed = false`;
      if (input.query) {
        q = `${q} and ${input.query}`;
      }

      const params = new URLSearchParams({
        q,
        pageSize: String(pageSize),
        fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink),nextPageToken',
      });

      const result = await apiRequest<DriveFileList>(
        'GET',
        `${BASE_URL}/files?${params.toString()}`
      );

      return {
        files: (result.files || []).map((f) => ({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          size: f.size ?? null,
          modifiedTime: f.modifiedTime ?? null,
          webViewLink: f.webViewLink ?? null,
        })),
        nextPageToken: result.nextPageToken ?? null,
      };
    } catch (error) {
      throw new Error(`Failed to list Drive files: ${(error as Error).message}`);
    }
  },
});

// ─── uploadDriveFile ────────────────────────────────────────────────────────

export interface UploadDriveFileInput {
  name: string;
  content: string;
  folderId?: string;
  mimeType?: string;
}

export const uploadDriveFile = tool({
  description:
    'Upload a file to Google Drive with the given name and content. Supports specifying a target folder and MIME type.',
  inputSchema: jsonSchema<UploadDriveFileInput>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'The name for the uploaded file.',
      },
      content: {
        type: 'string',
        description: 'The file content to upload.',
      },
      folderId: {
        type: 'string',
        description: 'The ID of the destination folder (default: "root").',
      },
      mimeType: {
        type: 'string',
        description: 'The MIME type of the file (default: "text/plain").',
      },
    },
    required: ['name', 'content'],
    additionalProperties: false,
  }),
  async execute(input: UploadDriveFileInput): Promise<UploadDriveFileOutput> {
    try {
      if (!input.name || !input.content) {
        throw new Error('name and content are required and must be non-empty');
      }

      const token = await getAccessToken();
      const folderId = input.folderId || 'root';
      const mimeType = input.mimeType || 'text/plain';
      const boundary = `---tpmjs-boundary-${Date.now()}`;

      const metadata = JSON.stringify({
        name: input.name,
        parents: [folderId],
      });

      const multipartBody = [
        `--${boundary}`,
        'Content-Type: application/json; charset=UTF-8',
        '',
        metadata,
        `--${boundary}`,
        `Content-Type: ${mimeType}`,
        '',
        input.content,
        `--${boundary}--`,
      ].join('\r\n');

      const response = await fetch(
        `${UPLOAD_URL}/files?uploadType=multipart&fields=id,name,mimeType,webViewLink`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartBody,
        }
      );

      if (!response.ok) {
        let errorMessage: string;
        try {
          const errorData = (await response.json()) as { error?: { message?: string } };
          errorMessage = errorData.error?.message || `HTTP ${response.status}`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(`Google Drive upload error (${response.status}): ${errorMessage}`);
      }

      const result = (await response.json()) as DriveFile;

      return {
        id: result.id,
        name: result.name,
        mimeType: result.mimeType,
        webViewLink: result.webViewLink ?? null,
      };
    } catch (error) {
      throw new Error(`Failed to upload Drive file: ${(error as Error).message}`);
    }
  },
});

// ─── downloadDriveFile ──────────────────────────────────────────────────────

export interface DownloadDriveFileInput {
  fileId: string;
}

export const downloadDriveFile = tool({
  description:
    'Download a file from Google Drive and return its content as text. Works with text-based files.',
  inputSchema: jsonSchema<DownloadDriveFileInput>({
    type: 'object',
    properties: {
      fileId: {
        type: 'string',
        description: 'The ID of the file to download.',
      },
    },
    required: ['fileId'],
    additionalProperties: false,
  }),
  async execute(input: DownloadDriveFileInput): Promise<DownloadDriveFileOutput> {
    try {
      if (!input.fileId) {
        throw new Error('fileId is required and must be non-empty');
      }

      const token = await getAccessToken();

      const response = await fetch(`${BASE_URL}/files/${input.fileId}?alt=media`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorMessage: string;
        try {
          const errorData = (await response.json()) as { error?: { message?: string } };
          errorMessage = errorData.error?.message || `HTTP ${response.status}`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(`Google Drive download error (${response.status}): ${errorMessage}`);
      }

      const content = await response.text();

      return {
        content,
        fileId: input.fileId,
      };
    } catch (error) {
      throw new Error(`Failed to download Drive file: ${(error as Error).message}`);
    }
  },
});

// ─── createDriveFolder ──────────────────────────────────────────────────────

export interface CreateDriveFolderInput {
  name: string;
  parentId?: string;
}

export const createDriveFolder = tool({
  description: 'Create a new folder in Google Drive with an optional parent folder.',
  inputSchema: jsonSchema<CreateDriveFolderInput>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'The name for the new folder.',
      },
      parentId: {
        type: 'string',
        description: 'The ID of the parent folder (default: "root").',
      },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute(input: CreateDriveFolderInput): Promise<CreateDriveFolderOutput> {
    try {
      if (!input.name) {
        throw new Error('name is required and must be non-empty');
      }

      const parentId = input.parentId || 'root';

      const result = await apiRequest<DriveFile>(
        'POST',
        `${BASE_URL}/files?fields=id,name,webViewLink`,
        {
          name: input.name,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentId],
        }
      );

      return {
        id: result.id,
        name: result.name,
        webViewLink: result.webViewLink ?? null,
      };
    } catch (error) {
      throw new Error(`Failed to create Drive folder: ${(error as Error).message}`);
    }
  },
});

// ─── shareDriveFile ─────────────────────────────────────────────────────────

export interface ShareDriveFileInput {
  fileId: string;
  email: string;
  role?: string;
}

export const shareDriveFile = tool({
  description:
    'Share a Google Drive file or folder with another user by email. Supports reader, writer, and commenter roles.',
  inputSchema: jsonSchema<ShareDriveFileInput>({
    type: 'object',
    properties: {
      fileId: {
        type: 'string',
        description: 'The ID of the file or folder to share.',
      },
      email: {
        type: 'string',
        description: 'The email address of the user to share with.',
      },
      role: {
        type: 'string',
        description: 'The permission role: "reader", "writer", or "commenter" (default: "reader").',
      },
    },
    required: ['fileId', 'email'],
    additionalProperties: false,
  }),
  async execute(input: ShareDriveFileInput): Promise<ShareDriveFileOutput> {
    try {
      if (!input.fileId || !input.email) {
        throw new Error('fileId and email are required and must be non-empty');
      }

      const role = input.role || 'reader';
      const validRoles = ['reader', 'writer', 'commenter'];
      if (!validRoles.includes(role)) {
        throw new Error(`Invalid role "${role}". Must be one of: ${validRoles.join(', ')}`);
      }

      const result = await apiRequest<DrivePermission>(
        'POST',
        `${BASE_URL}/files/${input.fileId}/permissions`,
        {
          type: 'user',
          role,
          emailAddress: input.email,
        }
      );

      return {
        permissionId: result.id,
        role: result.role,
        email: input.email,
      };
    } catch (error) {
      throw new Error(`Failed to share Drive file: ${(error as Error).message}`);
    }
  },
});
