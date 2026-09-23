import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { googleConfig, saveGoogleConnection } from '~/lib/google/connection';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const destination = new URL('https://tpmjs.com/dashboard/settings/google');
  const flowCookie = (await cookies()).get('google_oauth_flow')?.value;
  const session = await auth.api.getSession({ headers: await headers() });
  const finish = (message: string) => {
    destination.searchParams.set('error', message);
    const response = NextResponse.redirect(destination);
    response.cookies.set('google_oauth_flow', '', { path: '/api/google/callback', maxAge: 0 });
    return response;
  };
  let flow: { state: string; verifier: string; userId: string };
  try {
    flow = JSON.parse(flowCookie ?? 'null');
  } catch {
    return finish('Invalid OAuth state');
  }
  if (
    !flow ||
    !session?.user?.id ||
    flow.userId !== session.user.id ||
    flow.state !== url.searchParams.get('state')
  )
    return finish('Invalid OAuth state');
  const code = url.searchParams.get('code');
  if (!code) return finish('Google authorization was cancelled');
  try {
    const config = googleConfig();
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code',
        code,
        code_verifier: flow.verifier,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) return finish(`Google token exchange failed (${response.status})`);
    const token = (await response.json()) as {
      access_token?: string;
      refresh_token?: string;
      scope?: string;
    };
    if (!token.access_token) return finish('Google returned no access token');
    const identityResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { authorization: `Bearer ${token.access_token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
    if (!identityResponse.ok) return finish('Could not verify Google account');
    const identity = (await identityResponse.json()) as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
    };
    if (!identity.sub || !identity.email || !identity.email_verified)
      return finish('Google account identity was not verified');
    await saveGoogleConnection(session.user.id, {
      sub: identity.sub,
      email: identity.email,
      refreshToken: token.refresh_token,
      scopes: (token.scope ?? '').split(' ').filter(Boolean),
    });
    const done = NextResponse.redirect(destination);
    done.cookies.set('google_oauth_flow', '', { path: '/api/google/callback', maxAge: 0 });
    return done;
  } catch {
    return finish('Could not connect Google account');
  }
}
