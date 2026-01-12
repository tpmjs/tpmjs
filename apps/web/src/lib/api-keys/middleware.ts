import type { UserTier } from '@prisma/client';
import { prisma } from '@tpmjs/db';
import { headers } from 'next/headers';
import { auth } from '~/lib/auth';
import { type ApiKeyScope, hashApiKey, isValidApiKeyFormat } from './index';

/**
 * Result of authentication attempt
 */
export interface AuthResult {
  /** Whether the request is authenticated */
  authenticated: boolean;
  /** User ID if authenticated */
  userId?: string;
  /** API key ID if authenticated via API key */
  apiKeyId?: string;
  /** Scopes available to this authentication */
  scopes?: string[];
  /** User's tier for rate limiting */
  tier?: UserTier;
  /** Error message if authentication failed */
  error?: string;
  /** Whether this is a session-based auth (vs API key) */
  isSessionAuth?: boolean;
}

/**
 * Authenticates a request using either session or API key
 *
 * Session auth is checked first (for dashboard users).
 * If no session, API key auth is attempted.
 *
 * @returns AuthResult with authentication details
 *
 * @example
 * const auth = await authenticateRequest();
 * if (!auth.authenticated) {
 *   return NextResponse.json({ error: auth.error }, { status: 401 });
 * }
 * // Use auth.userId, auth.apiKeyId, auth.scopes, auth.tier
 */
export async function authenticateRequest(): Promise<AuthResult> {
  // 1. Try session auth first (for dashboard users)
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { tier: true },
      });
      return {
        authenticated: true,
        userId: session.user.id,
        tier: user?.tier || 'FREE',
        scopes: ['*'], // Session users have full access to their own resources
        isSessionAuth: true,
      };
    }
  } catch {
    // Session auth failed, try API key auth
  }

  // 2. Try API key auth
  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  if (!authHeader) {
    return { authenticated: false, error: 'Missing authorization header' };
  }

  if (!authHeader.startsWith('Bearer ')) {
    return {
      authenticated: false,
      error: 'Invalid authorization header format. Use: Bearer <api_key>',
    };
  }

  const rawKey = authHeader.slice(7);

  if (!rawKey) {
    return { authenticated: false, error: 'API key is empty' };
  }

  if (!isValidApiKeyFormat(rawKey)) {
    return {
      authenticated: false,
      error: 'Invalid API key format. Keys must start with tpmjs_sk_',
    };
  }

  const keyHash = hashApiKey(rawKey);

  const apiKey = await prisma.tpmjsApiKey.findUnique({
    where: { keyHash },
    include: { user: { select: { tier: true } } },
  });

  if (!apiKey) {
    return { authenticated: false, error: 'Invalid API key' };
  }

  if (!apiKey.isActive) {
    return { authenticated: false, error: 'API key is inactive' };
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { authenticated: false, error: 'API key has expired' };
  }

  // Update last used timestamp (fire and forget - non-blocking)
  prisma.tpmjsApiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {
      // Ignore errors - this is just for tracking
    });

  return {
    authenticated: true,
    userId: apiKey.userId,
    apiKeyId: apiKey.id,
    scopes: apiKey.scopes,
    tier: apiKey.user.tier,
    isSessionAuth: false,
  };
}

/**
 * Checks if an auth result has a required scope
 *
 * Session auth always has all scopes ('*').
 * API key auth checks the specific scopes granted.
 *
 * @param authResult - The authentication result
 * @param requiredScope - The scope to check
 * @returns True if the auth has the required scope
 *
 * @example
 * const auth = await authenticateRequest();
 * if (!hasScope(auth, 'mcp:execute')) {
 *   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
 * }
 */
export function hasScope(authResult: AuthResult, requiredScope: ApiKeyScope): boolean {
  if (!authResult.authenticated || !authResult.scopes) {
    return false;
  }

  // Session auth has full access
  if (authResult.scopes.includes('*')) {
    return true;
  }

  return authResult.scopes.includes(requiredScope);
}

/**
 * Requires authentication and optionally a specific scope
 *
 * This is a convenience wrapper that returns an error response if auth fails.
 *
 * @param requiredScope - Optional scope to require
 * @returns AuthResult if authenticated, or null with error details
 *
 * @example
 * const { auth, errorResponse } = await requireAuth('mcp:execute');
 * if (errorResponse) return errorResponse;
 * // auth is guaranteed to be valid here
 */
export async function requireAuth(
  requiredScope?: ApiKeyScope
): Promise<{ auth: AuthResult | null; errorResponse: Response | null }> {
  const authResult = await authenticateRequest();

  if (!authResult.authenticated) {
    return {
      auth: null,
      errorResponse: new Response(JSON.stringify({ error: authResult.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }

  if (requiredScope && !hasScope(authResult, requiredScope)) {
    return {
      auth: null,
      errorResponse: new Response(
        JSON.stringify({
          error: `Missing required scope: ${requiredScope}`,
          requiredScope,
          availableScopes: authResult.scopes,
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      ),
    };
  }

  return { auth: authResult, errorResponse: null };
}

/**
 * Extracts client metadata from request headers
 *
 * @returns Object with userAgent and ipAddress
 */
export async function getClientMetadata(): Promise<{
  userAgent: string | null;
  ipAddress: string | null;
}> {
  const headersList = await headers();

  return {
    userAgent: headersList.get('user-agent'),
    ipAddress:
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      null,
  };
}
