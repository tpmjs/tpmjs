# Next.js 16 API Route Timeout Issue - Comprehensive Debug Report

**Date:** 2026-01-09
**Project:** TPMJS (tpmjs.com)
**Issue:** API routes at `/api/agents/[id]/conversation/[conversationId]` timeout without any Vercel function logs

---

## Table of Contents

1. [Problem Summary](#problem-summary)
2. [Environment Details](#environment-details)
3. [Symptoms](#symptoms)
4. [Working vs Non-Working Endpoints](#working-vs-non-working-endpoints)
5. [Directory Structure](#directory-structure)
6. [Configuration Files](#configuration-files)
7. [Route File Contents](#route-file-contents)
8. [Investigation Timeline](#investigation-timeline)
9. [Hypotheses Tested](#hypotheses-tested)
10. [Reproduction Steps](#reproduction-steps)
11. [Key Observations](#key-observations)
12. [Potential Causes](#potential-causes)

---

## Problem Summary

Requests to `/api/agents/[id]/conversation/[conversationId]` (both GET and POST) hang indefinitely and timeout after 30-60 seconds. **Critically, no logs appear in Vercel for these requests** - the requests never seem to reach the serverless function at all.

Other API routes work perfectly fine, including routes with similar structure like `/api/agents/[id]` and `/api/agents/[id]/conversations`.

---

## Environment Details

### Framework & Runtime
- **Next.js Version:** 16.0.8
- **Build System:** Turbopack (default in Next.js 16)
- **React Version:** 19.0.0
- **Node.js Runtime:** nodejs (specified in route)
- **TypeScript Version:** 5.9.3

### Deployment
- **Platform:** Vercel
- **Region:** Auto (Vercel default)
- **Monorepo:** Turborepo with pnpm

### Database
- **Database:** Neon PostgreSQL
- **ORM:** Prisma 6.19.0
- **Connection:** Working (verified via other endpoints)

### Key Dependencies (from apps/web/package.json)
```json
{
  "dependencies": {
    "@ai-sdk/anthropic": "^3.0.2",
    "@ai-sdk/google": "^3.0.2",
    "@ai-sdk/groq": "^3.0.2",
    "@ai-sdk/mistral": "^3.0.2",
    "@ai-sdk/openai": "3.0.1",
    "@modelcontextprotocol/sdk": "^1.25.1",
    "@prisma/client": "^6.19.0",
    "@vercel/analytics": "^1.6.1",
    "@vercel/blob": "^2.0.0",
    "@vercel/kv": "^3.0.0",
    "ai": "6.0.3",
    "better-auth": "^1.4.10",
    "next": "^16.0.8",
    "prisma": "^6.19.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^4.0.0"
  }
}
```

---

## Symptoms

1. **GET/POST requests timeout** - No response after 30-60 seconds
2. **No Vercel logs** - Requests don't appear in Vercel function logs at all
3. **No errors** - No build errors, no runtime errors, nothing
4. **Route appears in build output** - Listed as dynamic function (ƒ)
5. **Similar routes work** - `/api/agents/[id]` and `/api/agents/[id]/conversations` work perfectly

---

## Working vs Non-Working Endpoints

### Working Endpoints (respond in < 1 second)

| Endpoint | Response Time | Logs in Vercel |
|----------|--------------|----------------|
| `GET /api/health` | ~0.74s | ✅ Yes |
| `GET /api/agents/cmjx48ojx0001la04lbhn98pz` | ~0.40s | ✅ Yes |
| `GET /api/agents/cmjx48ojx0001la04lbhn98pz/conversations` | ~0.50s | ✅ Yes |
| `GET /api/tools` | ~0.80s | ✅ Yes |

### Non-Working Endpoints (timeout, no logs)

| Endpoint | Result | Logs in Vercel |
|----------|--------|----------------|
| `GET /api/agents/[id]/conversation/[conversationId]` | ❌ Timeout | ❌ No logs |
| `POST /api/agents/[id]/conversation/[conversationId]` | ❌ Timeout | ❌ No logs |
| `GET /api/agents/[username]/[uid]/conversation/[conversationId]` | ❌ Timeout | ❌ No logs |
| `POST /api/agents/[username]/[uid]/conversation/[conversationId]` | ❌ Timeout | ❌ No logs |

### Pattern Identified
All routes with the path pattern `*/conversation/[conversationId]` fail. Routes with `*/conversations` (plural, no nested param) work.

---

## Directory Structure

```
apps/web/src/app/api/agents/
├── route.ts                                    ✅ Works
├── [id]/
│   ├── route.ts                                ✅ Works
│   ├── like/route.ts                           ✅ Works
│   ├── tools/route.ts                          ✅ Works
│   ├── tools/[toolId]/route.ts                 ✅ Works (nested dynamic)
│   ├── logs/route.ts                           ✅ Works
│   ├── clone/route.ts                          ✅ Works
│   ├── conversations/route.ts                  ✅ Works
│   ├── collections/route.ts                    ✅ Works
│   ├── collections/[collectionId]/route.ts     ✅ Works (nested dynamic)
│   ├── stats/route.ts                          ✅ Works
│   └── conversation/
│       └── [conversationId]/
│           └── route.ts                        ❌ FAILS - No logs
└── [username]/
    └── [uid]/
        └── conversation/
            └── [conversationId]/
                └── route.ts                    ❌ FAILS - No logs
```

**Key Observation:** Other nested dynamic routes work (`[id]/tools/[toolId]`, `[id]/collections/[collectionId]`), but `[id]/conversation/[conversationId]` does not.

---

## Configuration Files

### Root vercel.json
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "pnpm run build:web",
  "outputDirectory": "apps/web/.next",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "git": {
    "deploymentEnabled": {
      "main": true
    }
  },
  "github": {
    "silent": false,
    "autoJobCancelation": true
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ],
  "crons": [
    {
      "path": "/api/sync/changes",
      "schedule": "0 */4 * * *"
    },
    {
      "path": "/api/sync/keyword",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/sync/metrics",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/sync/stats-snapshot",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/sync/cleanup-activity",
      "schedule": "0 3 * * *"
    }
  ]
}
```

### apps/web/vercel.json
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd ../.. && pnpm run build:web",
  "installCommand": "cd ../.. && pnpm install"
}
```

### apps/web/next.config.ts
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@tpmjs/ui', '@tpmjs/utils', '@tpmjs/db', '@tpmjs/types', '@tpmjs/env'],
  reactStrictMode: true,
  serverExternalPackages: ['@tpmjs/package-executor'],
  async redirects() {
    return [
      {
        source: '/tools-ideas',
        destination: '/tool-ideas',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
```

### apps/web/src/middleware.ts
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Protect /dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // Check for session token - better-auth uses __Secure- prefix for HTTPS cookies
    const sessionToken =
      request.cookies.get('__Secure-better-auth.session_token') ||
      request.cookies.get('better-auth.session_token');
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

**Note:** Middleware only matches `/dashboard/*` paths, not `/api/*` paths. Should not affect API routes.

---

## Route File Contents

### FAILING ROUTE: apps/web/src/app/api/agents/[id]/conversation/[conversationId]/route.ts

```typescript
/**
 * Agent Conversation Endpoint (ID-based version)
 *
 * POST: Send a message and stream the AI response
 * GET: Retrieve conversation history
 * DELETE: Delete a conversation
 *
 * This endpoint uses agent id directly for dashboard usage
 */

import { decryptApiKey } from '@/lib/crypto/api-keys';
import { Prisma, prisma } from '@tpmjs/db';
import type { AIProvider } from '@tpmjs/types/agent';
import { SendMessageSchema } from '@tpmjs/types/agent';
import type { LanguageModel, ModelMessage } from 'ai';
import { type NextRequest, NextResponse } from 'next/server';
import { type RateLimitConfig, checkRateLimit } from '~/lib/rate-limit';

/**
 * Rate limit for chat messages: 30 requests per minute
 * This is stricter than default because chat involves expensive LLM calls
 */
const CHAT_RATE_LIMIT: RateLimitConfig = {
  limit: 30,
  windowSeconds: 60,
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for long agentic runs

type RouteContext = {
  params: Promise<{ id: string; conversationId: string }>;
};

/**
 * Get AI provider SDK based on provider type
 */
async function getProviderModel(
  provider: AIProvider,
  modelId: string,
  apiKey: string
): Promise<LanguageModel> {
  switch (provider) {
    case 'OPENAI': {
      const { createOpenAI } = await import('@ai-sdk/openai');
      return createOpenAI({ apiKey })(modelId);
    }
    case 'ANTHROPIC': {
      const { createAnthropic } = await import('@ai-sdk/anthropic');
      return createAnthropic({ apiKey })(modelId);
    }
    case 'GOOGLE': {
      const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
      return createGoogleGenerativeAI({ apiKey })(modelId);
    }
    case 'GROQ': {
      const { createGroq } = await import('@ai-sdk/groq');
      return createGroq({ apiKey })(modelId);
    }
    case 'MISTRAL': {
      const { createMistral } = await import('@ai-sdk/mistral');
      return createMistral({ apiKey })(modelId);
    }
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * POST /api/agents/[id]/conversation/[conversationId]
 * Send a message and stream the AI response via SSE
 */
export async function POST(request: NextRequest, context: RouteContext): Promise<Response> {
  // Check rate limit first to prevent expensive LLM calls
  const rateLimitResponse = checkRateLimit(request, CHAT_RATE_LIMIT);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const { id: agentId, conversationId } = await context.params;

  try {
    const body = await request.json();
    const parsed = SendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Fetch agent with all tool relations using agent ID
    const { fetchAgentWithTools, buildAgentTools } = await import('@/lib/agents/build-tools');
    const agent = await fetchAgentWithTools(agentId);

    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }

    // ... rest of implementation (streaming SSE response)
  } catch (error) {
    console.error('Failed to process message:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process message',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agents/[id]/conversation/[conversationId]
 * Retrieve conversation history with pagination
 */
export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { id: agentId, conversationId } = await context.params;
  const { searchParams } = new URL(request.url);

  const limit = Math.min(Number.parseInt(searchParams.get('limit') || '50', 10), 100);
  const before = searchParams.get('before');
  const after = searchParams.get('after');

  try {
    // Fetch agent by ID
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { id: true },
    });

    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }

    // Fetch conversation
    const conversation = await prisma.conversation.findUnique({
      where: {
        agentId_slug: {
          agentId: agent.id,
          slug: conversationId,
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // ... rest of implementation (simple Prisma queries)
  } catch (error) {
    console.error('Failed to fetch conversation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agents/[id]/conversation/[conversationId]
 * Delete a conversation
 */
export async function DELETE(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { id: agentId, conversationId } = await context.params;

  try {
    // Fetch agent by ID
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { id: true },
    });

    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }

    // Delete conversation (messages cascade)
    await prisma.conversation.deleteMany({
      where: {
        agentId: agent.id,
        slug: conversationId,
      },
    });

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Failed to delete conversation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}
```

### WORKING ROUTE: apps/web/src/app/api/agents/[id]/conversations/route.ts (plural)

```typescript
/**
 * Agent Conversations List Endpoint
 *
 * GET: List all conversations for an agent
 */

import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/agents/[id]/conversations
 * List all conversations for an agent (accepts id or uid)
 */
export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { id: idOrUid } = await context.params;
  const { searchParams } = new URL(request.url);

  const limit = Math.min(Number.parseInt(searchParams.get('limit') || '20', 10), 100);
  const offset = Number.parseInt(searchParams.get('offset') || '0', 10);

  try {
    // Fetch agent by id or uid
    const agent = await prisma.agent.findFirst({
      where: {
        OR: [{ id: idOrUid }, { uid: idOrUid }],
      },
      select: { id: true },
    });

    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }

    // Fetch conversations with message count
    const conversations = await prisma.conversation.findMany({
      where: { agentId: agent.id },
      orderBy: { updatedAt: 'desc' },
      take: limit + 1,
      skip: offset,
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    const hasMore = conversations.length > limit;
    const data = hasMore ? conversations.slice(0, limit) : conversations;

    return NextResponse.json({
      success: true,
      data: data.map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        messageCount: c._count.messages,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      pagination: {
        limit,
        offset,
        hasMore,
      },
    });
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
```

### WORKING ROUTE: apps/web/src/app/api/health/route.ts

```typescript
import { type NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '~/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/health
 * Simple health check endpoint that doesn't touch the database
 */
export async function GET(request: NextRequest) {
  // Check rate limit
  const rateLimitResponse = checkRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    build: {
      // Vercel provides these at runtime
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
      commitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE || 'local',
      deploymentUrl: process.env.VERCEL_URL || 'localhost',
    },
    env: {
      hasDatabase: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
    },
  });
}
```

### WORKING ROUTE: apps/web/src/app/api/agents/[id]/route.ts

```typescript
import { Prisma, prisma } from '@tpmjs/db';
import { UpdateAgentSchema } from '@tpmjs/types/agent';
import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';

import { logActivity } from '~/lib/activity';
import {
  apiConflict,
  apiForbidden,
  apiInternalError,
  apiNotFound,
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
} from '~/lib/api-response';
import { auth } from '~/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/agents/[id]
 * Get a single agent's details
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const requestId = crypto.randomUUID();

  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const { id } = await context.params;

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        collections: {
          include: {
            collection: {
              select: {
                id: true,
                name: true,
                _count: { select: { tools: true } },
              },
            },
          },
          orderBy: { position: 'asc' },
          take: 50,
        },
        tools: {
          include: {
            tool: {
              select: {
                id: true,
                name: true,
                description: true,
                package: {
                  select: {
                    npmPackageName: true,
                    category: true,
                  },
                },
              },
            },
          },
          orderBy: { position: 'asc' },
          take: 100,
        },
        _count: {
          select: {
            tools: true,
            collections: true,
            conversations: true,
          },
        },
      },
    });

    if (!agent) {
      return apiNotFound('Agent', requestId);
    }

    // Check access - owner or public
    const isOwner = session?.user?.id === agent.userId;
    if (!isOwner && !agent.isPublic) {
      return apiForbidden('Access denied', requestId);
    }

    return apiSuccess(
      {
        ...agent,
        isOwner,
        toolCount: agent._count.tools,
        collectionCount: agent._count.collections,
        conversationCount: agent._count.conversations,
        // ... mapping
      },
      { requestId }
    );
  } catch (error) {
    console.error('Failed to get agent:', error);
    return apiInternalError('Failed to get agent', requestId);
  }
}

// PATCH and DELETE handlers also work fine
```

---

## Investigation Timeline

### Initial State
- Routes were working previously (before refactoring)
- User refactored code, issue started

### Fix Attempt 1: Rate Limiter Timeout
- **Hypothesis:** `checkRateLimitDistributed` using `@vercel/kv` was hanging
- **Action:** Added 2-second timeout to KV calls
- **Result:** ❌ Still timing out

### Fix Attempt 2: Switch to Sync Rate Limiter
- **Hypothesis:** Async KV rate limiter had connection issues
- **Action:** Changed from `checkRateLimitDistributed` to `checkRateLimit` (sync, in-memory)
- **Result:** ❌ Still timing out

### Current State
- Route builds successfully
- Route appears in Vercel build output as dynamic function
- Requests timeout with no logs
- Other similar routes work fine

---

## Hypotheses Tested

| # | Hypothesis | Test | Result |
|---|------------|------|--------|
| 1 | Rate limiter hanging | Added timeout | ❌ Failed |
| 2 | KV connection issue | Switched to sync limiter | ❌ Failed |
| 3 | Database connection | Tested with /api/health | ✅ DB works |
| 4 | Prisma cold start | Tested other Prisma routes | ✅ Other routes work |
| 5 | Build issue | Checked build output | ✅ Route is built |
| 6 | Middleware blocking | Checked middleware config | ✅ Only matches /dashboard/* |

---

## Reproduction Steps

### 1. Test Working Endpoint
```bash
curl -s 'https://tpmjs.com/api/health' -w "\nTime: %{time_total}s"
# Returns: {"status":"ok",...} in ~0.7s
```

### 2. Test Working Agent Endpoint
```bash
curl -s 'https://tpmjs.com/api/agents/cmjx48ojx0001la04lbhn98pz' -w "\nTime: %{time_total}s"
# Returns: Agent data in ~0.4s
```

### 3. Test Working Conversations (plural) Endpoint
```bash
curl -s 'https://tpmjs.com/api/agents/cmjx48ojx0001la04lbhn98pz/conversations' -w "\nTime: %{time_total}s"
# Returns: Conversations list in ~0.5s
```

### 4. Test Failing Conversation (singular) Endpoint - GET
```bash
curl -s 'https://tpmjs.com/api/agents/cmjx48ojx0001la04lbhn98pz/conversation/conv-1767892050799-rk8eaqwhr' \
  -w "\nTime: %{time_total}s" \
  --max-time 60

# Result: Hangs until timeout, no response
# Vercel logs: NO ENTRY for this request
```

### 5. Test Failing Conversation Endpoint - POST
```bash
curl 'https://tpmjs.com/api/agents/cmjx48ojx0001la04lbhn98pz/conversation/conv-1767892050799-rk8eaqwhr' \
  -H 'Content-Type: application/json' \
  --data-raw '{"message":"hi"}' \
  -w "\nTime: %{time_total}s" \
  --max-time 60

# Result: Hangs until timeout, no response
# Vercel logs: NO ENTRY for this request
```

---

## Key Observations

### 1. No Vercel Logs
The most critical observation: **requests to the failing route do not appear in Vercel logs at all**. This suggests the request is not reaching the serverless function.

### 2. Route Pattern Difference
- ❌ `/api/agents/[id]/conversation/[conversationId]` - Fails
- ✅ `/api/agents/[id]/conversations` - Works
- ✅ `/api/agents/[id]/collections/[collectionId]` - Works
- ✅ `/api/agents/[id]/tools/[toolId]` - Works

The pattern `conversation/[conversationId]` fails while similar patterns like `tools/[toolId]` work.

### 3. Build Output Shows Route
```
Route (app)
├ ƒ /api/agents/[id]/conversation/[conversationId]  ← Listed as dynamic function
```

### 4. Singular vs Plural
- `conversation` (singular) + nested param = ❌ Fails
- `conversations` (plural) = ✅ Works

### 5. Multiple Failing Routes
Both route variants fail:
- `/api/agents/[id]/conversation/[conversationId]/route.ts`
- `/api/agents/[username]/[uid]/conversation/[conversationId]/route.ts`

---

## Potential Causes

### 1. Next.js 16 / Turbopack Routing Bug
There may be a bug in Next.js 16 or Turbopack with:
- Specific path patterns
- Nested dynamic segments with certain names
- Routes with "conversation" in the path

### 2. Vercel Edge Routing Issue
Vercel's edge network might have issues routing to:
- Deeply nested dynamic routes
- Routes with specific naming patterns
- Routes with certain configurations

### 3. Build Artifact Corruption
The route might:
- Build successfully but not deploy correctly
- Have a corrupted manifest entry
- Be missing from the serverless function bundle

### 4. Route Conflict
There might be an internal conflict between:
- `conversation` (singular) and `conversations` (plural)
- The nested dynamic segment pattern
- Some internal Next.js routing logic

### 5. Framework Bug with Dynamic Imports
The route uses dynamic imports (`await import()`) which might cause issues with:
- Turbopack bundling
- Serverless function generation
- Module resolution

---

## Recent Commits

```
5bf4260 fix: use sync rate limiter for conversation routes
05ccdc6 fix: add timeout to Vercel KV rate limiter to prevent hanging
4db1522 fix: add ID-based conversation route for dashboard chat
7fe1027 fix: add root-level health and execute-tool routes for TPMJS compatibility
63d408b fix(executor): use correct Vercel Sandbox SDK API
```

---

## Questions for Further Investigation

1. Is this a known Next.js 16 / Turbopack issue?
2. Does the route name "conversation" conflict with any internal Next.js routing?
3. Is there a Vercel-specific issue with nested dynamic segments?
4. Why do other nested dynamic routes (`tools/[toolId]`, `collections/[collectionId]`) work?
5. Is there something specific about the combination of:
   - Multiple dynamic segments (`[id]` + `[conversationId]`)
   - The word "conversation"
   - The route file size/complexity

---

## Files Affected

- `apps/web/src/app/api/agents/[id]/conversation/[conversationId]/route.ts`
- `apps/web/src/app/api/agents/[username]/[uid]/conversation/[conversationId]/route.ts`

## Related Working Files (for comparison)

- `apps/web/src/app/api/agents/[id]/conversations/route.ts`
- `apps/web/src/app/api/agents/[id]/tools/[toolId]/route.ts`
- `apps/web/src/app/api/agents/[id]/collections/[collectionId]/route.ts`
- `apps/web/src/app/api/agents/[id]/route.ts`
- `apps/web/src/app/api/health/route.ts`
