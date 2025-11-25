import { createEnv } from '@tpmjs/env';
import { z } from 'zod';

export const env = createEnv({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
});
