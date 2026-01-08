/**
 * Health Check Endpoint (Deno Runtime)
 *
 * GET /api/health
 * Returns the health status of the executor
 */

interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  version?: string;
  info?: Record<string, unknown>;
}

export default function handler(_req: Request): Response {
  const response: HealthResponse = {
    status: 'ok',
    version: '1.0.0',
    info: {
      runtime: 'deno',
      httpImports: true,
      timestamp: new Date().toISOString(),
    },
  };

  return Response.json(response, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
