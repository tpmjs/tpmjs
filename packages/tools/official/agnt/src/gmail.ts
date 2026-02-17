/**
 * @tpmjs/official-agnt-gmail — Gmail API Tools for AI Agents
 *
 * Search, read, send, and manage Gmail emails using Google service account
 * with domain-wide delegation.
 *
 * @requires GOOGLE_SERVICE_ACCOUNT_KEY environment variable (JSON string)
 * @requires GMAIL_USER_EMAIL environment variable (email to impersonate)
 */

import crypto from 'node:crypto';
import { jsonSchema, tool } from 'ai';

const BASE_URL = 'https://gmail.googleapis.com/gmail/v1/users/me';

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

function getUserEmail(): string {
  const email = process.env.GMAIL_USER_EMAIL;
  if (!email) {
    throw new Error(
      'GMAIL_USER_EMAIL environment variable is required. Set it to the email address of the user to impersonate via domain-wide delegation.'
    );
  }
  return email;
}

function base64url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getAccessToken(): Promise<string> {
  const sa = getServiceAccountKey();
  const userEmail = getUserEmail();
  const now = Math.floor(Date.now() / 1000);

  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(
    JSON.stringify({
      iss: sa.client_email,
      sub: userEmail,
      scope: 'https://www.googleapis.com/auth/gmail.modify',
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
  path: string,
  body?: unknown,
  contentType?: string
): Promise<T> {
  const token = await getAccessToken();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  if (contentType) {
    headers['Content-Type'] = contentType;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const options: RequestInit = { method, headers };
  if (body !== undefined) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
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
          `Authentication failed: ${errorMessage}. Check GOOGLE_SERVICE_ACCOUNT_KEY and GMAIL_USER_EMAIL.`
        );
      case 403:
        throw new Error(
          `Access forbidden: ${errorMessage}. Ensure domain-wide delegation is configured for the service account.`
        );
      case 404:
        throw new Error(`Not found: ${errorMessage}`);
      case 429:
        throw new Error(`Rate limit exceeded: ${errorMessage}`);
      default:
        throw new Error(`Gmail API error (${response.status}): ${errorMessage}`);
    }
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getHeader(headers: Array<{ name: string; value: string }>, name: string): string {
  const header = headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
  return header?.value || '';
}

function extractBody(payload: GmailPayload): string {
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }

  if (payload.parts) {
    // Prefer text/plain, fall back to text/html
    const textPart = payload.parts.find((p) => p.mimeType === 'text/plain');
    if (textPart?.body?.data) {
      return Buffer.from(textPart.body.data, 'base64').toString('utf-8');
    }

    const htmlPart = payload.parts.find((p) => p.mimeType === 'text/html');
    if (htmlPart?.body?.data) {
      return Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
    }

    // Recursively check nested multipart
    for (const part of payload.parts) {
      if (part.parts) {
        const nested = extractBody(part);
        if (nested) return nested;
      }
    }
  }

  return '';
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface GmailPayload {
  mimeType?: string;
  headers?: Array<{ name: string; value: string }>;
  body?: { data?: string; size?: number };
  parts?: GmailPayload[];
}

interface GmailMessage {
  id: string;
  threadId: string;
  snippet?: string;
  labelIds?: string[];
  payload?: GmailPayload;
}

interface GmailMessageList {
  messages?: Array<{ id: string; threadId: string }>;
  resultSizeEstimate?: number;
}

export interface SearchEmailsResult {
  messages: Array<{
    id: string;
    threadId: string;
    from: string;
    to: string;
    subject: string;
    date: string;
    snippet: string;
  }>;
  resultCount: number;
}

export interface ReadEmailResult {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  body: string;
  snippet: string;
  labels: string[];
}

export interface SendGmailResult {
  messageId: string;
  threadId: string;
}

// ─── searchEmails ───────────────────────────────────────────────────────────

export interface SearchEmailsInput {
  query: string;
  maxResults?: number;
}

export const searchEmails = tool({
  description:
    'Search Gmail emails using Gmail search syntax (e.g. "from:user@example.com is:unread", "subject:invoice after:2024/01/01").',
  inputSchema: jsonSchema<SearchEmailsInput>({
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'Gmail search query using Gmail search syntax (e.g. "from:user@example.com is:unread").',
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results to return (default: 10).',
      },
    },
    required: ['query'],
    additionalProperties: false,
  }),
  async execute(input: SearchEmailsInput): Promise<SearchEmailsResult> {
    try {
      if (!input.query) {
        throw new Error('query is required and must be non-empty');
      }
      const maxResults = input.maxResults ?? 10;

      const listResult = await apiRequest<GmailMessageList>(
        'GET',
        `/messages?q=${encodeURIComponent(input.query)}&maxResults=${maxResults}`
      );

      if (!listResult.messages || listResult.messages.length === 0) {
        return { messages: [], resultCount: 0 };
      }

      const messages = await Promise.all(
        listResult.messages.map(async (msg) => {
          const detail = await apiRequest<GmailMessage>(
            'GET',
            `/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`
          );

          const headers = detail.payload?.headers || [];
          return {
            id: detail.id,
            threadId: detail.threadId,
            from: getHeader(headers, 'From'),
            to: getHeader(headers, 'To'),
            subject: getHeader(headers, 'Subject'),
            date: getHeader(headers, 'Date'),
            snippet: detail.snippet || '',
          };
        })
      );

      return {
        messages,
        resultCount: listResult.resultSizeEstimate || messages.length,
      };
    } catch (error) {
      throw new Error(`Failed to search emails: ${(error as Error).message}`);
    }
  },
});

// ─── readEmail ──────────────────────────────────────────────────────────────

export interface ReadEmailInput {
  messageId: string;
}

export const readEmail = tool({
  description:
    'Read the full content of a specific Gmail email including body text, headers, and labels.',
  inputSchema: jsonSchema<ReadEmailInput>({
    type: 'object',
    properties: {
      messageId: {
        type: 'string',
        description: 'The Gmail message ID to read.',
      },
    },
    required: ['messageId'],
    additionalProperties: false,
  }),
  async execute(input: ReadEmailInput): Promise<ReadEmailResult> {
    try {
      if (!input.messageId) {
        throw new Error('messageId is required and must be non-empty');
      }

      const message = await apiRequest<GmailMessage>(
        'GET',
        `/messages/${input.messageId}?format=full`
      );

      const headers = message.payload?.headers || [];
      const body = message.payload ? extractBody(message.payload) : '';

      return {
        id: message.id,
        threadId: message.threadId,
        from: getHeader(headers, 'From'),
        to: getHeader(headers, 'To'),
        subject: getHeader(headers, 'Subject'),
        date: getHeader(headers, 'Date'),
        body,
        snippet: message.snippet || '',
        labels: message.labelIds || [],
      };
    } catch (error) {
      throw new Error(`Failed to read email: ${(error as Error).message}`);
    }
  },
});

// ─── sendGmail ──────────────────────────────────────────────────────────────

export interface SendGmailInput {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
}

export const sendGmail = tool({
  description:
    'Send an email via Gmail using the configured service account and impersonated user.',
  inputSchema: jsonSchema<SendGmailInput>({
    type: 'object',
    properties: {
      to: {
        type: 'string',
        description: 'Recipient email address.',
      },
      subject: {
        type: 'string',
        description: 'Email subject line.',
      },
      body: {
        type: 'string',
        description: 'Email body content (plain text or HTML).',
      },
      isHtml: {
        type: 'boolean',
        description: 'Whether the body is HTML content (default: false).',
      },
    },
    required: ['to', 'subject', 'body'],
    additionalProperties: false,
  }),
  async execute(input: SendGmailInput): Promise<SendGmailResult> {
    try {
      if (!input.to || !input.subject || !input.body) {
        throw new Error('to, subject, and body are required and must be non-empty');
      }

      const userEmail = getUserEmail();
      const contentType = input.isHtml ? 'text/html' : 'text/plain';

      const emailLines = [
        `From: ${userEmail}`,
        `To: ${input.to}`,
        `Subject: ${input.subject}`,
        `Content-Type: ${contentType}; charset=utf-8`,
        '',
        input.body,
      ];
      const rawMessage = emailLines.join('\r\n');

      const encoded = Buffer.from(rawMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const result = await apiRequest<{ id: string; threadId: string }>('POST', '/messages/send', {
        raw: encoded,
      });

      return {
        messageId: result.id,
        threadId: result.threadId,
      };
    } catch (error) {
      throw new Error(`Failed to send email: ${(error as Error).message}`);
    }
  },
});
