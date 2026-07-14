/**
 * Auth headers for the internal (self-hosted) executor.
 *
 * When EXECUTOR_API_KEY is set, the Deno executor requires
 * `Authorization: Bearer <key>` on every endpoint except GET /health.
 * When unset (local dev), auth is disabled on both sides.
 */
export function executorAuthHeaders(): Record<string, string> {
  const key = process.env.EXECUTOR_API_KEY;
  return key ? { Authorization: `Bearer ${key}` } : {};
}
