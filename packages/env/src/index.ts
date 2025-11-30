import { z } from 'zod';

export function createEnv<T extends Record<string, z.ZodTypeAny>>(
  schema: T
): z.infer<z.ZodObject<T>> {
  const envSchema = z.object(schema);

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}
