import { createEnv } from '@tpmjs/env';
import { z } from 'zod';

export const env = createEnv({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  CRON_SECRET: z.string().min(32).optional(), // Authenticates scheduled endpoint calls
  RAILWAY_EXECUTOR_URL: z
    .string()
    .url()
    .default('https://endearing-commitment-production.up.railway.app'), // Railway service for health checks

  // Better Auth
  BETTER_AUTH_SECRET: z.string().min(32).optional(), // Required for session encryption
  BETTER_AUTH_URL: z.string().url().optional(), // Base URL for auth callbacks

  // Resend (Email)
  RESEND_API_KEY: z.string().startsWith('re_').optional(), // Resend API key for sending emails

  // Discord
  DISCORD_SUMMARY_AGENT_ID: z.string().optional(), // Agent ID for Discord summary cron
  DISCORD_GUILD_ID: z.string().optional(), // Discord server ID to summarize
  DISCORD_SUMMARY_CHANNEL_ID: z.string().optional(), // Channel to post summaries to
  DISCORD_SIGNUP_WEBHOOK_URL: z.string().optional(), // Webhook URL for new user signup notifications

  // Sentry
  SENTRY_DSN: z.string().url().optional(), // Sentry DSN for server-side error reporting
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(), // Sentry DSN for client-side error reporting
  SENTRY_ORG: z.string().optional(), // Sentry organization slug
  SENTRY_PROJECT: z.string().optional(), // Sentry project slug
  SENTRY_AUTH_TOKEN: z.string().optional(), // Sentry auth token for source map uploads
});
