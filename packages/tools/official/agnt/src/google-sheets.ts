/**
 * @tpmjs/official-agnt-google-sheets — Google Sheets Tools for AI Agents
 *
 * Read, write, append, and clear data in Google Sheets spreadsheets.
 *
 * @requires GOOGLE_SERVICE_ACCOUNT_KEY environment variable (JSON string of service account credentials)
 */

import { createSign } from 'node:crypto';
import { jsonSchema, tool } from 'ai';

const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

// ─── Client Infrastructure ──────────────────────────────────────────────────

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
}

function getServiceAccountCredentials(): ServiceAccountCredentials {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_KEY environment variable is required. Set it to the JSON string of your Google service account credentials. See https://cloud.google.com/iam/docs/creating-managing-service-account-keys'
    );
  }
  try {
    const parsed = JSON.parse(raw) as ServiceAccountCredentials;
    if (!parsed.client_email || !parsed.private_key) {
      throw new Error('Missing client_email or private_key in credentials');
    }
    return parsed;
  } catch (error) {
    if ((error as Error).message.includes('Missing client_email')) {
      throw error;
    }
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_KEY must be a valid JSON string containing client_email and private_key'
    );
  }
}

function base64urlEncode(data: string | Buffer): string {
  const buf = typeof data === 'string' ? Buffer.from(data) : data;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function createJwt(credentials: ServiceAccountCredentials): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const signer = createSign('RSA-SHA256');
  signer.update(signatureInput);
  const signature = signer.sign(credentials.private_key);
  const encodedSignature = base64urlEncode(signature);

  return `${signatureInput}.${encodedSignature}`;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const credentials = getServiceAccountCredentials();
  const jwt = createJwt(credentials);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${encodeURIComponent(jwt)}`,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to obtain access token: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return cachedToken.token;
}

async function sheetsRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await getAccessToken();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const options: RequestInit = { method, headers };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);

  if (!response.ok) {
    let errorMessage: string;
    try {
      const errorData = (await response.json()) as { error?: { message?: string } };
      errorMessage = errorData.error?.message || `HTTP ${response.status}`;
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }

    switch (response.status) {
      case 400:
        throw new Error(`Bad request: ${errorMessage}`);
      case 401:
        throw new Error(
          'Authentication failed: Invalid or expired credentials. Check GOOGLE_SERVICE_ACCOUNT_KEY.'
        );
      case 403:
        throw new Error(
          `Access forbidden: ${errorMessage}. Ensure the service account has access to the spreadsheet.`
        );
      case 404:
        throw new Error(`Spreadsheet or range not found: ${errorMessage}`);
      case 429:
        throw new Error(`Rate limit exceeded: ${errorMessage}`);
      default:
        throw new Error(`Google Sheets API error (${response.status}): ${errorMessage}`);
    }
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

// ─── Output Types ────────────────────────────────────────────────────────────

export interface ReadSheetResult {
  range: string;
  values: string[][];
  rowCount: number;
  columnCount: number;
}

export interface WriteSheetResult {
  updatedRange: string;
  updatedRows: number;
  updatedColumns: number;
  updatedCells: number;
}

export interface AppendSheetResult {
  updatedRange: string;
  updatedRows: number;
  updatedColumns: number;
  updatedCells: number;
}

export interface ClearSheetResult {
  clearedRange: string;
}

// ─── readSheet ───────────────────────────────────────────────────────────────

export interface ReadSheetInput {
  spreadsheetId: string;
  range: string;
}

export const readSheet = tool({
  description: 'Read data from a Google Sheets range. Returns the values as a 2D array of strings.',
  inputSchema: jsonSchema<ReadSheetInput>({
    type: 'object',
    properties: {
      spreadsheetId: {
        type: 'string',
        description: 'The ID of the spreadsheet to read from.',
      },
      range: {
        type: 'string',
        description:
          'The A1 notation range to read, e.g. "Sheet1!A1:B5" or "Sheet1" for the entire sheet.',
      },
    },
    required: ['spreadsheetId', 'range'],
    additionalProperties: false,
  }),
  async execute(input: ReadSheetInput): Promise<ReadSheetResult> {
    try {
      if (!input.spreadsheetId) {
        throw new Error('spreadsheetId is required and must be non-empty');
      }
      if (!input.range) {
        throw new Error('range is required and must be non-empty');
      }

      const encodedRange = encodeURIComponent(input.range);
      const data = await sheetsRequest<{ range: string; values?: string[][] }>(
        'GET',
        `/${input.spreadsheetId}/values/${encodedRange}`
      );

      const values = data.values || [];
      return {
        range: data.range || input.range,
        values,
        rowCount: values.length,
        columnCount: values.length > 0 ? Math.max(...values.map((row) => row.length)) : 0,
      };
    } catch (error) {
      throw new Error(`Failed to read sheet: ${(error as Error).message}`);
    }
  },
});

// ─── writeSheet ──────────────────────────────────────────────────────────────

export interface WriteSheetInput {
  spreadsheetId: string;
  range: string;
  values: string;
}

export const writeSheet = tool({
  description:
    'Write data to a Google Sheets range. Overwrites existing data in the specified range.',
  inputSchema: jsonSchema<WriteSheetInput>({
    type: 'object',
    properties: {
      spreadsheetId: {
        type: 'string',
        description: 'The ID of the spreadsheet to write to.',
      },
      range: {
        type: 'string',
        description: 'The A1 notation range to write to, e.g. "Sheet1!A1:B5".',
      },
      values: {
        type: 'string',
        description:
          'JSON array of arrays representing the rows and columns to write, e.g. \'[["Name","Age"],["Alice","30"]]\'.',
      },
    },
    required: ['spreadsheetId', 'range', 'values'],
    additionalProperties: false,
  }),
  async execute(input: WriteSheetInput): Promise<WriteSheetResult> {
    try {
      if (!input.spreadsheetId) {
        throw new Error('spreadsheetId is required and must be non-empty');
      }
      if (!input.range) {
        throw new Error('range is required and must be non-empty');
      }
      if (!input.values) {
        throw new Error('values is required and must be non-empty');
      }

      let parsedValues: string[][];
      try {
        parsedValues = JSON.parse(input.values) as string[][];
      } catch {
        throw new Error(
          'values must be a valid JSON array of arrays, e.g. \'[["Name","Age"],["Alice","30"]]\''
        );
      }

      if (!Array.isArray(parsedValues) || !parsedValues.every((row) => Array.isArray(row))) {
        throw new Error('values must be a JSON array of arrays');
      }

      const encodedRange = encodeURIComponent(input.range);
      const data = await sheetsRequest<{
        updatedRange: string;
        updatedRows: number;
        updatedColumns: number;
        updatedCells: number;
      }>('PUT', `/${input.spreadsheetId}/values/${encodedRange}?valueInputOption=USER_ENTERED`, {
        values: parsedValues,
      });

      return {
        updatedRange: data.updatedRange,
        updatedRows: data.updatedRows,
        updatedColumns: data.updatedColumns,
        updatedCells: data.updatedCells,
      };
    } catch (error) {
      throw new Error(`Failed to write sheet: ${(error as Error).message}`);
    }
  },
});

// ─── appendSheet ─────────────────────────────────────────────────────────────

export interface AppendSheetInput {
  spreadsheetId: string;
  range: string;
  values: string;
}

export const appendSheet = tool({
  description:
    'Append rows to the end of a Google Sheet. New data is added after the last row with content.',
  inputSchema: jsonSchema<AppendSheetInput>({
    type: 'object',
    properties: {
      spreadsheetId: {
        type: 'string',
        description: 'The ID of the spreadsheet to append to.',
      },
      range: {
        type: 'string',
        description:
          'The A1 notation range indicating where to start looking for data, e.g. "Sheet1!A1".',
      },
      values: {
        type: 'string',
        description:
          'JSON array of arrays representing the rows to append, e.g. \'[["Alice","30"],["Bob","25"]]\'.',
      },
    },
    required: ['spreadsheetId', 'range', 'values'],
    additionalProperties: false,
  }),
  async execute(input: AppendSheetInput): Promise<AppendSheetResult> {
    try {
      if (!input.spreadsheetId) {
        throw new Error('spreadsheetId is required and must be non-empty');
      }
      if (!input.range) {
        throw new Error('range is required and must be non-empty');
      }
      if (!input.values) {
        throw new Error('values is required and must be non-empty');
      }

      let parsedValues: string[][];
      try {
        parsedValues = JSON.parse(input.values) as string[][];
      } catch {
        throw new Error(
          'values must be a valid JSON array of arrays, e.g. \'[["Alice","30"],["Bob","25"]]\''
        );
      }

      if (!Array.isArray(parsedValues) || !parsedValues.every((row) => Array.isArray(row))) {
        throw new Error('values must be a JSON array of arrays');
      }

      const encodedRange = encodeURIComponent(input.range);
      const data = await sheetsRequest<{
        updates: {
          updatedRange: string;
          updatedRows: number;
          updatedColumns: number;
          updatedCells: number;
        };
      }>(
        'POST',
        `/${input.spreadsheetId}/values/${encodedRange}:append?valueInputOption=USER_ENTERED`,
        { values: parsedValues }
      );

      return {
        updatedRange: data.updates.updatedRange,
        updatedRows: data.updates.updatedRows,
        updatedColumns: data.updates.updatedColumns,
        updatedCells: data.updates.updatedCells,
      };
    } catch (error) {
      throw new Error(`Failed to append to sheet: ${(error as Error).message}`);
    }
  },
});

// ─── clearSheet ──────────────────────────────────────────────────────────────

export interface ClearSheetInput {
  spreadsheetId: string;
  range: string;
}

export const clearSheet = tool({
  description:
    'Clear all values from a Google Sheets range. The cells remain but their contents are removed.',
  inputSchema: jsonSchema<ClearSheetInput>({
    type: 'object',
    properties: {
      spreadsheetId: {
        type: 'string',
        description: 'The ID of the spreadsheet to clear.',
      },
      range: {
        type: 'string',
        description:
          'The A1 notation range to clear, e.g. "Sheet1!A1:B5" or "Sheet1" for the entire sheet.',
      },
    },
    required: ['spreadsheetId', 'range'],
    additionalProperties: false,
  }),
  async execute(input: ClearSheetInput): Promise<ClearSheetResult> {
    try {
      if (!input.spreadsheetId) {
        throw new Error('spreadsheetId is required and must be non-empty');
      }
      if (!input.range) {
        throw new Error('range is required and must be non-empty');
      }

      const encodedRange = encodeURIComponent(input.range);
      const data = await sheetsRequest<{ clearedRange: string }>(
        'POST',
        `/${input.spreadsheetId}/values/${encodedRange}:clear`
      );

      return {
        clearedRange: data.clearedRange,
      };
    } catch (error) {
      throw new Error(`Failed to clear sheet: ${(error as Error).message}`);
    }
  },
});
