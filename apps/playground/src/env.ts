import { createEnv } from '@tpmjs/env';
import { z } from 'zod';

export const env = createEnv({
  // Server-only (optional for playground - can be provided by client UI)
  OPENAI_API_KEY: z.string().min(1).optional(),
});
