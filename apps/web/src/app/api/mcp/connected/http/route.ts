import { prisma } from '@tpmjs/db';
import type { TpmjsEnv } from '@tpmjs/types/tpmjs';
import { verifyAccessToken } from 'better-auth/oauth2';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkApiKeyRateLimit, createRateLimitResponse } from '~/lib/api-keys/rate-limit';
import { decryptApiKey } from '~/lib/crypto/api-keys';
import { executeWithExecutor } from '~/lib/executors';
import { negotiateProtocolVersion } from '~/lib/mcp/protocol';
import { searchTools } from '~/lib/search/tool-search';
import { trackExecution } from '~/lib/tracking/executions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const RESOURCE = 'https://tpmjs.com/api/mcp/connected/http';
const ISSUER = 'https://tpmjs.com/api/auth';
const SEARCH_LIMIT = 30;
const callSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]).nullable().optional(),
  method: z.string(),
  params: z.unknown().optional(),
});
const executeArgs = z.object({
  packageName: z.string().min(1).max(214),
  toolName: z.string().min(1).max(256),
  arguments: z.record(z.string(), z.unknown()).optional(),
});

function challenge() {
  return NextResponse.json(
    { error: 'Authorization required' },
    {
      status: 401,
      headers: {
        'WWW-Authenticate': `Bearer resource_metadata="https://tpmjs.com/.well-known/oauth-protected-resource"`,
        'Cache-Control': 'no-store',
      },
    }
  );
}

function rpc(id: string | number | null, result: unknown, isError = false) {
  return NextResponse.json(
    {
      jsonrpc: '2.0',
      id,
      result: isError
        ? {
            content: [{ type: 'text', text: String(result) }],
            isError: true,
          }
        : result,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

function fault(id: string | number | null, code: number, message: string, status = 200) {
  return NextResponse.json({ jsonrpc: '2.0', id, error: { code, message } }, { status });
}

async function delegatedUser(request: Request) {
  const token = /^Bearer\s+(\S+)$/i.exec(request.headers.get('authorization') ?? '')?.[1];
  if (!token) return null;
  try {
    const claims = await verifyAccessToken(token, {
      jwksUrl: 'https://tpmjs.com/api/auth/jwks',
      verifyOptions: { issuer: ISSUER, audience: RESOURCE },
      scopes: ['mcp:read'],
    });
    if (typeof claims.sub !== 'string' || typeof claims.azp !== 'string') return null;
    const scopes = new Set(typeof claims.scope === 'string' ? claims.scope.split(/\s+/) : []);
    if (!scopes.has('mcp:read')) return null;
    return { userId: claims.sub, clientId: claims.azp, scopes };
  } catch {
    return null;
  }
}

async function availableTools(userId: string, clientId: string) {
  const grant = await prisma.oAuthToolGrant.findUnique({
    where: { userId_clientId: { userId, clientId } },
  });
  if (!grant) return [];
  const selected = new Set(grant.toolIds);
  const collections = await prisma.collection.findMany({
    where: { id: { in: grant.collectionIds }, userId },
    select: {
      id: true,
      name: true,
      envVars: true,
      credentialBindings: {
        where: { userId },
        select: { packageName: true, envName: true, keyName: true },
      },
      tools: { select: { tool: { include: { package: true } } } },
    },
  });
  return collections.flatMap((collection) =>
    collection.tools
      .filter(
        ({ tool }) => tool.isActive && selected.has(`${tool.package.npmPackageName}::${tool.name}`)
      )
      .map(({ tool }) => ({ collection, tool }))
  );
}

async function boundEnvironment(userId: string, bindings: { envName: string; keyName: string }[]) {
  if (bindings.length === 0) return {};
  const keys = await prisma.userApiKey.findMany({
    where: { userId, keyName: { in: bindings.map((binding) => binding.keyName) } },
    select: { keyName: true, encryptedKey: true, keyIv: true },
  });
  const byName = new Map(keys.map((key) => [key.keyName, key]));
  return Object.fromEntries(
    bindings.flatMap((binding) => {
      const key = byName.get(binding.keyName);
      return key ? [[binding.envName, decryptApiKey(key.encryptedKey, key.keyIv)]] : [];
    })
  );
}

function envFor(packageEnv: unknown, collectionEnv: unknown, accountEnv: Record<string, string>) {
  // Never hand a tool unrelated secrets. Packages without declared env receive none.
  const declared = new Set(
    Array.isArray(packageEnv)
      ? (packageEnv as TpmjsEnv[])
          .filter((item) => typeof item?.name === 'string')
          .map((item) => item.name)
      : []
  );
  const values =
    collectionEnv && typeof collectionEnv === 'object' && !Array.isArray(collectionEnv)
      ? Object.fromEntries(
          Object.entries(collectionEnv).filter(
            (entry): entry is [string, string] =>
              declared.has(entry[0]) && typeof entry[1] === 'string'
          )
        )
      : {};
  return {
    ...values,
    ...Object.fromEntries(Object.entries(accountEnv).filter(([name]) => declared.has(name))),
  };
}

function configured(packageEnv: unknown, env: Record<string, string>) {
  if (!Array.isArray(packageEnv)) return true;
  return (packageEnv as TpmjsEnv[]).every(
    (item) =>
      item &&
      typeof item.name === 'string' &&
      (item.required === false || Boolean(item.default) || Boolean(env[item.name]))
  );
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: MCP dispatch keeps authentication, grant checks, and execution in one fail-closed route.
export async function POST(request: Request) {
  const user = await delegatedUser(request);
  if (!user) return challenge();
  const parsed = callSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fault(null, -32700, 'Invalid JSON-RPC request', 400);
  const { method } = parsed.data;
  const id = parsed.data.id ?? null;
  if (method === 'notifications/initialized') return new Response(null, { status: 202 });
  if (method === 'ping') return rpc(id, {});
  if (method === 'initialize') {
    const requested = (parsed.data.params as { protocolVersion?: unknown } | null)?.protocolVersion;
    return rpc(id, {
      protocolVersion: negotiateProtocolVersion(requested),
      serverInfo: { name: 'TPMJS Connected Tools', version: '1.0.0' },
      capabilities: { tools: {} },
    });
  }
  if (method === 'tools/list') {
    return rpc(id, {
      tools: [
        {
          name: 'search_tools',
          description:
            'Search only tools you allowed for this application in TPMJS. Results say whether a required API key is configured.',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              limit: { type: 'integer', minimum: 1, maximum: SEARCH_LIMIT },
            },
            required: ['query'],
          },
          annotations: { readOnlyHint: true },
        },
        ...(user.scopes.has('mcp:execute')
          ? [
              {
                name: 'execute_tool',
                description:
                  'Run an allowed TPMJS tool using credentials stored in TPMJS. Select a tool with search_tools first.',
                inputSchema: {
                  type: 'object',
                  properties: {
                    packageName: { type: 'string' },
                    toolName: { type: 'string' },
                    arguments: { type: 'object' },
                  },
                  required: ['packageName', 'toolName'],
                },
              },
            ]
          : []),
      ],
    });
  }
  if (method !== 'tools/call') return fault(id, -32601, 'Method not found');
  const params = z
    .object({ name: z.string(), arguments: z.unknown().optional() })
    .safeParse(parsed.data.params);
  if (!params.success) return fault(id, -32602, 'Invalid tool call');
  const allowed = await availableTools(user.userId, user.clientId);
  if (params.data.name === 'search_tools') {
    const args = z
      .object({
        query: z.string().min(1).max(500),
        limit: z.number().int().min(1).max(SEARCH_LIMIT).optional(),
      })
      .safeParse(params.data.arguments);
    if (!args.success) return fault(id, -32602, 'Invalid search arguments');
    const bindings = allowed.flatMap(({ collection, tool }) =>
      collection.credentialBindings.filter(
        (binding) => binding.packageName === tool.package.npmPackageName
      )
    );
    const [results, existingKeys] = await Promise.all([
      searchTools({ query: args.data.query, candidateLimit: 2000 }),
      prisma.userApiKey.findMany({
        where: { userId: user.userId, keyName: { in: bindings.map((binding) => binding.keyName) } },
        select: { keyName: true },
      }),
    ]);
    const keyNames = new Set(existingKeys.map((key) => key.keyName));
    const byId = new Map(allowed.map((item) => [item.tool.id, item]));
    const tools = results
      .flatMap(({ tool }) => {
        const owner = byId.get(tool.id);
        return owner
          ? [
              {
                packageName: tool.package.npmPackageName,
                toolName: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema,
                collection: owner.collection.name,
                ready: configured(
                  tool.package.env,
                  envFor(
                    tool.package.env,
                    owner.collection.envVars,
                    Object.fromEntries(
                      owner.collection.credentialBindings
                        .filter(
                          (binding) =>
                            binding.packageName === tool.package.npmPackageName &&
                            keyNames.has(binding.keyName)
                        )
                        .map((binding) => [binding.envName, 'configured'])
                    )
                  )
                ),
              },
            ]
          : [];
      })
      .slice(0, args.data.limit ?? 20);
    return rpc(id, { content: [{ type: 'text', text: JSON.stringify({ tools }) }] });
  }
  if (params.data.name !== 'execute_tool') return fault(id, -32602, 'Unknown tool');
  if (!user.scopes.has('mcp:execute')) return fault(id, -32003, 'Missing mcp:execute scope', 403);
  const args = executeArgs.safeParse(params.data.arguments);
  if (!args.success) return fault(id, -32602, 'Invalid execution arguments');
  const candidate = allowed.find(
    ({ tool }) =>
      tool.package.npmPackageName === args.data.packageName && tool.name === args.data.toolName
  );
  if (!candidate) return fault(id, -32003, 'Tool is outside this application grant', 403);
  const rate = await checkApiKeyRateLimit(`oauth:${user.userId}:${user.clientId}`, 'FREE', 120);
  if (!rate.allowed) return createRateLimitResponse(rate);
  const env = envFor(
    candidate.tool.package.env,
    candidate.collection.envVars,
    await boundEnvironment(
      user.userId,
      candidate.collection.credentialBindings.filter(
        (binding) => binding.packageName === candidate.tool.package.npmPackageName
      )
    )
  );
  if (!configured(candidate.tool.package.env, env)) {
    return rpc(id, 'Required API keys are not configured in TPMJS', true);
  }
  const started = Date.now();
  const result = await executeWithExecutor(null, {
    packageName: candidate.tool.package.npmPackageName,
    name: candidate.tool.name,
    version: candidate.tool.package.npmVersion,
    params: args.data.arguments ?? {},
    env: Object.keys(env).length ? env : undefined,
  });
  trackExecution({
    eventType: 'tool_call',
    source: 'mcp_http',
    userId: user.userId,
    toolId: candidate.tool.id,
    toolName: candidate.tool.name,
    packageName: candidate.tool.package.npmPackageName,
    status: result.success ? 'success' : 'error',
    durationMs: Date.now() - started,
    inputArgs: args.data.arguments,
    ...(result.success ? { outputSummary: result.output } : { errorMessage: String(result.error) }),
  });
  const output = result.success ? result.output : result.error;
  const text = typeof output === 'string' ? output : JSON.stringify(output);
  return rpc(id, {
    content: [{ type: 'text', text: text.slice(0, 1_000_000) }],
    ...(result.success ? {} : { isError: true }),
  });
}
