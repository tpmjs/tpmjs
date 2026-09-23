import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(
    {
      resource: 'https://tpmjs.com/api/mcp/connected/http',
      authorization_servers: ['https://tpmjs.com/api/auth'],
      scopes_supported: ['mcp:read', 'mcp:execute', 'offline_access'],
    },
    { headers: { 'Cache-Control': 'public, max-age=300' } }
  );
}
