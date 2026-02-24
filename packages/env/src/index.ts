import { z } from 'zod';

export function createEnv<T extends Record<string, z.ZodTypeAny>>(
  schema: T
): z.infer<z.ZodObject<T>> {
  const envSchema = z.object(schema);

  // Preprocess: convert empty strings to undefined so optional() works correctly.
  // Environment variables are always strings in Node.js, so an empty string
  // should be treated as "not set" for optional fields.
  const processedEnv: Record<string, string | undefined> = {};
  for (const key of Object.keys(schema)) {
    const val = process.env[key];
    processedEnv[key] = val === '' ? undefined : val;
  }

  const parsed = envSchema.safeParse(processedEnv);

  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}
