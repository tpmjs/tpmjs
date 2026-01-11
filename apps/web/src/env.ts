import { createEnv } from '@tpmjs/env';
import { z } from 'zod';

export const env = createEnv({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  CRON_SECRET: z.string().min(32).optional(), // Required for Vercel Cron security
  RAILWAY_EXECUTOR_URL: z
    .string()
    .url()
    .default('https://endearing-commitment-production.up.railway.app'), // Railway service for health checks

  // Better Auth
  BETTER_AUTH_SECRET: z.string().min(32).optional(), // Required for session encryption
  BETTER_AUTH_URL: z.string().url().optional(), // Base URL for auth callbacks

  // Resend (Email)
  RESEND_API_KEY: z.string().startsWith('re_').optional(), // Resend API key for sending emails

  // Discord Summary Agent
  DISCORD_SUMMARY_AGENT_ID: z.string().optional(), // Agent ID for Discord summary cron
  DISCORD_GUILD_ID: z.string().optional(), // Discord server ID to summarize
  DISCORD_SUMMARY_CHANNEL_ID: z.string().optional(), // Channel to post summaries to
});
