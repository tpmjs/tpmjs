import { oauthProvider } from '@better-auth/oauth-provider';
import { prisma } from '@tpmjs/db';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { jwt } from 'better-auth/plugins';
import { sendResetPasswordEmail, sendVerificationEmail } from './email';

// The configured URL must match the domain users are browsing on. Production
// has one canonical self-hosted origin; local development keeps its own URL.
const getBaseURL = () => {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  if (process.env.NODE_ENV === 'development') return 'http://localhost:3000';
  return 'https://tpmjs.com';
};

export const auth: ReturnType<typeof betterAuth> = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: getBaseURL(),
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  plugins: [
    jwt({ jwt: { issuer: 'https://tpmjs.com/api/auth' } }),
    oauthProvider({
      loginPage: '/sign-in',
      consentPage: '/consent',
      scopes: ['openid', 'profile', 'email', 'offline_access', 'mcp:read', 'mcp:execute'],
      validAudiences: ['https://tpmjs.com/api/mcp/connected/http'],
      grantTypes: ['authorization_code', 'refresh_token'],
      accessTokenExpiresIn: 900,
      allowDynamicClientRegistration: true,
      allowUnauthenticatedClientRegistration: true,
      clientRegistrationDefaultScopes: ['mcp:read'],
      clientRegistrationAllowedScopes: [
        'openid',
        'profile',
        'email',
        'offline_access',
        'mcp:read',
        'mcp:execute',
      ],
    }),
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail(user.email, url);
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url);
    },
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  trustedOrigins: ['https://tpmjs.com', 'http://localhost:3000', 'http://localhost:3002'],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Update signup source after user creation
          // The provider is determined by the account that was just created
          try {
            const account = await prisma.account.findFirst({
              where: { userId: user.id },
              orderBy: { createdAt: 'desc' },
              select: { providerId: true },
            });
            const source = account?.providerId || 'direct';
            await prisma.user.update({
              where: { id: user.id },
              data: { signupSource: source },
            });
          } catch (error) {
            console.error('[auth] Failed to set signup source:', error);
          }

          // Post new signup notification to Discord
          const webhookUrl = process.env.DISCORD_SIGNUP_WEBHOOK_URL;
          if (webhookUrl) {
            try {
              await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  content: `New user signed up: **${user.email}**`,
                }),
              });
            } catch (error) {
              console.error('[auth] Failed to send Discord signup notification:', error);
            }
          }
        },
      },
    },
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: 'lax',
      secure: process.env.NODE_ENV !== 'development',
      httpOnly: true,
    },
  },
}) as unknown as ReturnType<typeof betterAuth>;
