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
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[] | undefined>;
    const failedKeys = Object.keys(fieldErrors);
    console.error(`[createEnv] Invalid environment variables: ${failedKeys.join(', ')}`);
    // Report the variable NAME and the failure reason only. NEVER log any part
    // of the value — environment variables are frequently secrets, and even a
    // short prefix leaks entropy into logs (issue #119). The Zod messages
    // describe the constraint that failed, not the offending value.
    for (const [key, messages] of Object.entries(fieldErrors)) {
      const rawValue = process.env[key];
      const presence = rawValue === undefined || rawValue === '' ? 'missing' : 'set but invalid';
      const reason = messages?.join('; ') ?? 'failed validation';
      console.error(`[createEnv]   ${key}: ${presence} (${reason})`);
    }
    throw new Error(`Invalid environment variables: ${failedKeys.join(', ')}`);
  }

  return parsed.data;
}
