import { createEnv } from '@tpmjs/env';
import { z } from 'zod';

export const env = createEnv({
  // Server-only
  OPENAI_API_KEY: z.string().min(1),
});
