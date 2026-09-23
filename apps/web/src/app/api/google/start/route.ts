import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import {
  challenge,
  GOOGLE_IDENTITY_SCOPES,
  GOOGLE_TOOLS,
  googleConfig,
  randomVerifier,
} from '~/lib/google/connection';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  let config: ReturnType<typeof googleConfig>;
  try {
    config = googleConfig();
  } catch {
    return NextResponse.json({ error: 'Google OAuth is not configured' }, { status: 503 });
  }
  const requested = new URL(request.url).searchParams.getAll('scope');
  const scopes = [
    ...new Set(
      requested.flatMap((name) =>
        GOOGLE_TOOLS.filter((tool) => tool.name === name).map((tool) => tool.scope)
      )
    ),
  ];
  if (!scopes.length)
    return NextResponse.json({ error: 'Select at least one Google capability' }, { status: 400 });
  const state = randomVerifier();
  const verifier = randomVerifier();
  const authorization = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authorization.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: [...GOOGLE_IDENTITY_SCOPES, ...scopes].join(' '),
    access_type: 'offline',
    include_granted_scopes: 'true',
    prompt: 'consent',
    state,
    code_challenge: challenge(verifier),
    code_challenge_method: 'S256',
  }).toString();
  const response = NextResponse.redirect(authorization);
  response.cookies.set(
    'google_oauth_flow',
    JSON.stringify({ state, verifier, userId: session.user.id }),
    {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 600,
      path: '/api/google/callback',
    }
  );
  return response;
}
