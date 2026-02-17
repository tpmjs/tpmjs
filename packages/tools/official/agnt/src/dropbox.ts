/**
 * @tpmjs/official-agnt-dropbox — Dropbox API Tools for AI Agents
 *
 * Manage files and folders in Dropbox: list, upload, download, delete,
 * create folders, and generate shared links.
 *
 * @requires DROPBOX_ACCESS_TOKEN environment variable
 */

import { jsonSchema, tool } from 'ai';

const API_URL = 'https://api.dropboxapi.com/2';
const CONTENT_URL = 'https://content.dropboxapi.com/2';

// ─── Client Infrastructure ──────────────────────────────────────────────────

function getAccessToken(): string {
  const token = process.env.DROPBOX_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      'DROPBOX_ACCESS_TOKEN environment variable is required. Get your token from https://www.dropbox.com/developers/apps'
    );
  }
  return token;
}

async function apiRequest<T>(
  url: string,
  body?: unknown,
  headers?: Record<string, string>
): Promise<T> {
  const token = getAccessToken();

  const requestHeaders: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...headers,
  };

  if (body !== undefined && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const options: RequestInit = {
    method: 'POST',
    headers: requestHeaders,
  };

  if (body !== undefined) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const response = await fetch(url, options);

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
    const errorData = (await response.json()) as {
      error_summary?: string;
      error?: { [key: string]: unknown };
    };
    errorMessage = errorData.error_summary || `HTTP ${response.status}`;
  } catch {
    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
  }

  switch (response.status) {
    case 400:
      throw new Error(`Bad request: ${errorMessage}`);
    case 401:
      throw new Error(
        'Authentication failed: Invalid Dropbox access token. Check DROPBOX_ACCESS_TOKEN.'
      );
    case 403:
      throw new Error(`Access forbidden: ${errorMessage}`);
    case 404:
      throw new Error(`Not found: ${errorMessage}`);
    case 409:
      throw new Error(`Conflict: ${errorMessage}`);
    case 429:
      throw new Error(`Rate limit exceeded: ${errorMessage}`);
    default:
      throw new Error(`Dropbox API error (${response.status}): ${errorMessage}`);
  }
}

// ─── Output Types ────────────────────────────────────────────────────────────

interface DropboxEntry {
  '.tag': 'file' | 'folder';
  name: string;
  path_display: string;
  id?: string;
  size?: number;
  server_modified?: string;
  content_hash?: string;
}

interface DropboxListResult {
  entries: DropboxEntry[];
  has_more: boolean;
  cursor?: string;
}

interface DropboxFileMetadata {
  name: string;
  path_display: string;
  id: string;
  size: number;
  server_modified: string;
  content_hash: string;
}

interface DropboxDeleteResult {
  metadata: {
    '.tag': string;
    name: string;
    path_display: string;
  };
}

interface DropboxCreateFolderResult {
  metadata: {
    name: string;
    path_display: string;
    id: string;
  };
}

interface DropboxSharedLinkResult {
  url: string;
  name: string;
  path_lower: string;
}

export interface ListFolderOutput {
  entries: Array<{
    name: string;
    pathDisplay: string;
    tag: string;
    size: number | null;
    modified: string | null;
  }>;
  hasMore: boolean;
}

export interface UploadFileOutput {
  name: string;
  pathDisplay: string;
  size: number;
  modified: string;
  contentHash: string;
}

export interface DownloadFileOutput {
  name: string;
  path: string;
  content: string;
  size: number;
}

export interface DeleteFileOutput {
  name: string;
  pathDisplay: string;
  tag: string;
}

export interface CreateFolderOutput {
  name: string;
  pathDisplay: string;
}

export interface CreateSharedLinkOutput {
  url: string;
  name: string;
  pathDisplay: string;
}

// ─── listFolder ─────────────────────────────────────────────────────────────

export interface ListFolderInput {
  path: string;
}

export const listFolder = tool({
  description:
    'List files and folders in a Dropbox directory. Use empty string "" for root or a path like "/Documents".',
  inputSchema: jsonSchema<ListFolderInput>({
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description:
          'The Dropbox folder path to list. Use empty string "" for root or a path like "/Documents".',
      },
    },
    required: ['path'],
    additionalProperties: false,
  }),
  async execute(input: ListFolderInput): Promise<ListFolderOutput> {
    try {
      const result = await apiRequest<DropboxListResult>(`${API_URL}/files/list_folder`, {
        path: input.path,
        limit: 100,
      });

      return {
        entries: result.entries.map((entry) => ({
          name: entry.name,
          pathDisplay: entry.path_display,
          tag: entry['.tag'],
          size: entry.size ?? null,
          modified: entry.server_modified ?? null,
        })),
        hasMore: result.has_more,
      };
    } catch (error) {
      throw new Error(`Failed to list folder: ${(error as Error).message}`);
    }
  },
});

// ─── uploadFile ─────────────────────────────────────────────────────────────

export interface UploadFileInput {
  path: string;
  content: string;
}

export const uploadFile = tool({
  description:
    'Upload a file to Dropbox. Provide the destination path and the file content as a string.',
  inputSchema: jsonSchema<UploadFileInput>({
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The destination path in Dropbox (e.g. "/test.txt").',
      },
      content: {
        type: 'string',
        description: 'The file content to upload.',
      },
    },
    required: ['path', 'content'],
    additionalProperties: false,
  }),
  async execute(input: UploadFileInput): Promise<UploadFileOutput> {
    try {
      if (!input.path || !input.content) {
        throw new Error('path and content are required and must be non-empty');
      }

      const token = getAccessToken();
      const dropboxArg = JSON.stringify({
        path: input.path,
        mode: 'overwrite',
        autorename: false,
        mute: false,
      });

      const response = await fetch(`${CONTENT_URL}/files/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': dropboxArg,
        },
        body: input.content,
      });

      if (!response.ok) {
        await handleApiError(response);
      }

      const result = (await response.json()) as DropboxFileMetadata;

      return {
        name: result.name,
        pathDisplay: result.path_display,
        size: result.size,
        modified: result.server_modified,
        contentHash: result.content_hash,
      };
    } catch (error) {
      throw new Error(`Failed to upload file: ${(error as Error).message}`);
    }
  },
});

// ─── downloadFile ───────────────────────────────────────────────────────────

export interface DownloadFileInput {
  path: string;
}

export const downloadFile = tool({
  description: 'Download a file from Dropbox and return its content as text.',
  inputSchema: jsonSchema<DownloadFileInput>({
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The Dropbox file path to download (e.g. "/test.txt").',
      },
    },
    required: ['path'],
    additionalProperties: false,
  }),
  async execute(input: DownloadFileInput): Promise<DownloadFileOutput> {
    try {
      if (!input.path) {
        throw new Error('path is required and must be non-empty');
      }

      const token = getAccessToken();
      const dropboxArg = JSON.stringify({ path: input.path });

      const response = await fetch(`${CONTENT_URL}/files/download`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Dropbox-API-Arg': dropboxArg,
        },
      });

      if (!response.ok) {
        await handleApiError(response);
      }

      const apiResultHeader = response.headers.get('Dropbox-API-Result');
      const metadata = apiResultHeader
        ? (JSON.parse(apiResultHeader) as DropboxFileMetadata)
        : { name: '', path_display: input.path, size: 0 };

      const content = await response.text();

      return {
        name: metadata.name,
        path: metadata.path_display,
        content,
        size: metadata.size,
      };
    } catch (error) {
      throw new Error(`Failed to download file: ${(error as Error).message}`);
    }
  },
});

// ─── deleteFile ─────────────────────────────────────────────────────────────

export interface DeleteFileInput {
  path: string;
}

export const deleteFile = tool({
  description: 'Delete a file or folder from Dropbox. This action is permanent.',
  inputSchema: jsonSchema<DeleteFileInput>({
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The Dropbox file or folder path to delete.',
      },
    },
    required: ['path'],
    additionalProperties: false,
  }),
  async execute(input: DeleteFileInput): Promise<DeleteFileOutput> {
    try {
      if (!input.path) {
        throw new Error('path is required and must be non-empty');
      }

      const result = await apiRequest<DropboxDeleteResult>(`${API_URL}/files/delete_v2`, {
        path: input.path,
      });

      return {
        name: result.metadata.name,
        pathDisplay: result.metadata.path_display,
        tag: result.metadata['.tag'],
      };
    } catch (error) {
      throw new Error(`Failed to delete file: ${(error as Error).message}`);
    }
  },
});

// ─── createFolder ───────────────────────────────────────────────────────────

export interface CreateFolderInput {
  path: string;
}

export const createFolder = tool({
  description: 'Create a new folder in Dropbox at the specified path.',
  inputSchema: jsonSchema<CreateFolderInput>({
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The path for the new folder (e.g. "/NewFolder").',
      },
    },
    required: ['path'],
    additionalProperties: false,
  }),
  async execute(input: CreateFolderInput): Promise<CreateFolderOutput> {
    try {
      if (!input.path) {
        throw new Error('path is required and must be non-empty');
      }

      const result = await apiRequest<DropboxCreateFolderResult>(
        `${API_URL}/files/create_folder_v2`,
        { path: input.path }
      );

      return {
        name: result.metadata.name,
        pathDisplay: result.metadata.path_display,
      };
    } catch (error) {
      throw new Error(`Failed to create folder: ${(error as Error).message}`);
    }
  },
});

// ─── createSharedLink ───────────────────────────────────────────────────────

export interface CreateSharedLinkInput {
  path: string;
}

export const createSharedLink = tool({
  description:
    'Create a shared link for a Dropbox file or folder. Returns a publicly accessible URL.',
  inputSchema: jsonSchema<CreateSharedLinkInput>({
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The Dropbox file or folder path to share.',
      },
    },
    required: ['path'],
    additionalProperties: false,
  }),
  async execute(input: CreateSharedLinkInput): Promise<CreateSharedLinkOutput> {
    try {
      if (!input.path) {
        throw new Error('path is required and must be non-empty');
      }

      const result = await apiRequest<DropboxSharedLinkResult>(
        `${API_URL}/sharing/create_shared_link_with_settings`,
        { path: input.path }
      );

      return {
        url: result.url,
        name: result.name,
        pathDisplay: result.path_lower,
      };
    } catch (error) {
      throw new Error(`Failed to create shared link: ${(error as Error).message}`);
    }
  },
});
