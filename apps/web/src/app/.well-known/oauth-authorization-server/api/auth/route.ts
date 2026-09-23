import { oauthProviderAuthServerMetadata } from '@better-auth/oauth-provider';
import { auth } from '~/lib/auth';

export const dynamic = 'force-dynamic';

const handler = oauthProviderAuthServerMetadata(
  auth as unknown as Parameters<typeof oauthProviderAuthServerMetadata>[0]
);

export const GET = handler;
