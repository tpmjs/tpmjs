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
});
