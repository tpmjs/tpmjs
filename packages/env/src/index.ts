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
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const failedKeys = Object.keys(fieldErrors);
    console.error(
      `[createEnv] Invalid environment variables: ${failedKeys.join(', ')}`,
      JSON.stringify(fieldErrors)
    );
    // Log which values failed (redact to first 4 chars for security)
    for (const key of failedKeys) {
      const raw = process.env[key];
      const preview = raw ? `${raw.slice(0, 4)}...` : '(undefined)';
      console.error(`[createEnv]   ${key} = ${preview}`);
    }
    throw new Error(`Invalid environment variables: ${failedKeys.join(', ')}`);
  }

  return parsed.data;
}
