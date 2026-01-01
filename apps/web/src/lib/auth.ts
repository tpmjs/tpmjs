import { prisma } from '@tpmjs/db';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { sendVerificationEmail } from './email';

// Determine base URL for auth - MUST match the domain users are browsing on
// VERCEL_URL is the deployment URL (e.g., tpmjs-xxx.vercel.app), not the custom domain
// So we prioritize BETTER_AUTH_URL or fall back to the production domain
const getBaseURL = () => {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  // In production, always use the custom domain, not VERCEL_URL
  if (process.env.VERCEL_ENV === 'production') return 'https://tpmjs.com';
  // For preview deployments, use the Vercel URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'https://tpmjs.com';
};

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: getBaseURL(),
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
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
  trustedOrigins: ['https://tpmjs.com'],
  advanced: {
    defaultCookieAttributes: {
      sameSite: 'lax',
      secure: true,
      httpOnly: true,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
