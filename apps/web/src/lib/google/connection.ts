import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@tpmjs/db';
import { decryptApiKey, encryptApiKey } from '~/lib/crypto/api-keys';

export const GOOGLE_TOOLS = [
  {
    name: 'drive_search',
    description: 'Search files in Google Drive',
    scope: 'https://www.googleapis.com/auth/drive.readonly',
  },
  {
    name: 'drive_read',
    description: 'Read a Google Drive file or export a Google document',
    scope: 'https://www.googleapis.com/auth/drive.readonly',
  },
  {
    name: 'gmail_search',
    description: 'Search Gmail messages',
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
  },
  {
    name: 'gmail_read',
    description: 'Read one Gmail message',
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
  },
  {
    name: 'gmail_send',
    description: 'Send an email from Gmail',
    scope: 'https://www.googleapis.com/auth/gmail.send',
  },
] as const;

export const GOOGLE_COLLECTION_PREFIX = 'google:';
export const GOOGLE_PACKAGE = '@tpmjs/google-workspace';
export const GOOGLE_IDENTITY_SCOPES = ['openid', 'https://www.googleapis.com/auth/userinfo.email'];

export function googleConfig() {
  const clientId = process.env.GOOGLE_WORKSPACE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_WORKSPACE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Google Workspace OAuth is not configured');
  return { clientId, clientSecret, redirectUri: 'https://tpmjs.com/api/google/callback' };
}

export function randomVerifier() {
  return randomBytes(32).toString('base64url');
}

export function challenge(verifier: string) {
  return createHash('sha256').update(verifier).digest('base64url');
}

export async function googleToken(userId: string, connectionId: string, requiredScope: string) {
  const connection = await prisma.googleConnection.findFirst({
    where: { id: connectionId, userId },
  });
  if (!connection || !connection.scopes.includes(requiredScope))
    throw new Error('Google account or scope unavailable');
  const config = googleConfig();
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: decryptApiKey(connection.encryptedRefresh, connection.refreshIv),
      grant_type: 'refresh_token',
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Google token refresh failed (${response.status})`);
  const data = (await response.json()) as { access_token?: string; scope?: string };
  if (!data.access_token || (data.scope && !data.scope.split(' ').includes(requiredScope))) {
    throw new Error('Google did not grant the required scope');
  }
  return data.access_token;
}

export async function googleApi(accessToken: string, url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { authorization: `Bearer ${accessToken}`, ...init?.headers },
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  });
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Google returned no response body');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 2_000_000) {
      await reader.cancel();
      throw new Error('Google response exceeds the 2 MB tool limit');
    }
    chunks.push(value);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  if (!response.ok)
    throw new Error(`Google API returned ${response.status}: ${text.slice(0, 300)}`);
  return text;
}

export async function saveGoogleConnection(
  userId: string,
  data: {
    sub: string;
    email: string;
    refreshToken: string | undefined;
    scopes: string[];
  }
) {
  const previous = await prisma.googleConnection.findUnique({
    where: { userId_googleSubject: { userId, googleSubject: data.sub } },
  });
  const refreshToken =
    data.refreshToken ?? (previous && decryptApiKey(previous.encryptedRefresh, previous.refreshIv));
  if (!refreshToken)
    throw new Error(
      'Google did not issue an offline credential. Disconnect the app in Google and try again.'
    );
  const sealed = encryptApiKey(refreshToken);
  return prisma.googleConnection.upsert({
    where: { userId_googleSubject: { userId, googleSubject: data.sub } },
    create: {
      userId,
      googleSubject: data.sub,
      email: data.email,
      encryptedRefresh: sealed.encrypted,
      refreshIv: sealed.iv,
      scopes: data.scopes,
    },
    update: {
      email: data.email,
      encryptedRefresh: sealed.encrypted,
      refreshIv: sealed.iv,
      scopes: data.scopes,
    },
  });
}
