# Neon Compute Usage Optimization Strategy

Current usage: **100+ CU-hrs/month** (over free tier limit)

## Root Causes

### 1. Cron Jobs Hitting Database Too Frequently

Current schedule:
- `/api/sync/changes` - Every **2 minutes** (720 runs/day)
- `/api/sync/keyword` - Every **15 minutes** (96 runs/day)
- `/api/sync/metrics` - Every **hour** (24 runs/day)

Each run wakes up the Neon compute instance if it's scaled to zero, incurring cold start costs.

### 2. No Connection Pooling

Prisma creates new connections for each serverless function invocation. Neon recommends using their connection pooler with `?pgbouncer=true`.

### 3. API Endpoints Without Caching

Every `/api/tools` request hits the database directly. No Redis/memory caching layer.

### 4. Potentially Expensive Queries

- `prisma.tool.findMany()` with multiple includes and order by clauses
- No query result caching

---

## Optimization Strategy

### Phase 1: Immediate Fixes (High Impact)

#### 1.1 Reduce Cron Frequency

```json
// vercel.json - proposed changes
{
  "crons": [
    {
      "path": "/api/sync/changes",
      "schedule": "0 */4 * * *"  // Every 4 hours instead of 2 minutes
    },
    {
      "path": "/api/sync/keyword",
      "schedule": "0 */6 * * *"  // Every 6 hours instead of 15 minutes
    },
    {
      "path": "/api/sync/metrics",
      "schedule": "0 0 * * *"    // Once daily instead of hourly
    }
  ]
}
```

**Impact**: Reduces cron-triggered database wakeups from ~840/day to ~10/day

#### 1.2 Enable Neon Connection Pooling

Update `DATABASE_URL` in Vercel environment:

```
# Current (direct connection)
postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/db

# Optimized (pooled connection)
postgresql://user:pass@ep-xxx-pooler.us-east-1.aws.neon.tech/db?pgbouncer=true
```

Add to Prisma schema:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // For migrations only
}
```

**Impact**: Reduces connection overhead by 50-80%

#### 1.3 Reduce Auto-Suspend Timeout

In Neon console, set compute auto-suspend to **1 minute** (minimum) instead of 5 minutes.

**Impact**: Less idle compute time billed

### Phase 2: Caching Layer (Medium Impact)

#### 2.1 Add Vercel KV (Redis) for API Caching

```typescript
// apps/web/src/app/api/tools/route.ts
import { kv } from '@vercel/kv';

const CACHE_TTL = 300; // 5 minutes
const CACHE_KEY = 'tools:list';

export async function GET(request: NextRequest) {
  // Try cache first
  const cached = await kv.get(CACHE_KEY);
  if (cached) {
    return NextResponse.json(cached);
  }

  // Fetch from DB
  const tools = await prisma.tool.findMany({ ... });

  // Cache result
  await kv.set(CACHE_KEY, tools, { ex: CACHE_TTL });

  return NextResponse.json(tools);
}
```

**Impact**: 90%+ cache hit rate for browse/search operations

#### 2.2 Implement Stale-While-Revalidate Pattern

```typescript
// Return stale data immediately, refresh in background
const cached = await kv.get(CACHE_KEY);
if (cached) {
  // Async refresh if stale
  if (cached.timestamp < Date.now() - CACHE_TTL * 1000) {
    refreshCacheInBackground();
  }
  return NextResponse.json(cached.data);
}
```

### Phase 3: Query Optimization (Low-Medium Impact)

#### 3.1 Use Select Instead of Include

```typescript
// Before: Fetches all package fields
const tools = await prisma.tool.findMany({
  include: { package: true }
});

// After: Only fetch needed fields
const tools = await prisma.tool.findMany({
  select: {
    id: true,
    name: true,
    description: true,
    package: {
      select: {
        npmPackageName: true,
        npmVersion: true,
        category: true,
      }
    }
  }
});
```

#### 3.2 Add Database Indexes

Review slow queries in Neon console and add indexes:

```prisma
model Tool {
  // Composite index for common query pattern
  @@index([qualityScore(sort: Desc), createdAt(sort: Desc)])
}
```

#### 3.3 Paginate Large Result Sets

Current: `limit: 1000` in tool-search page
Proposed: `limit: 50` with infinite scroll

### Phase 4: Architecture Changes (High Impact, More Work)

#### 4.1 Static Generation for Tool Pages

Convert tool detail pages from `dynamic = 'force-dynamic'` to ISR:

```typescript
// apps/web/src/app/tool/[...slug]/page.tsx
export const revalidate = 3600; // Revalidate every hour
export const dynamicParams = true;

export async function generateStaticParams() {
  const tools = await prisma.tool.findMany({
    select: { name: true, package: { select: { npmPackageName: true } } },
    take: 100, // Pre-generate top 100 tools
  });
  return tools.map(t => ({ slug: [t.package.npmPackageName, t.name] }));
}
```

**Impact**: Zero database hits for cached pages

#### 4.2 Move Sync Jobs to GitHub Actions

Instead of Vercel Cron (which triggers serverless functions that connect to Neon), use GitHub Actions with a direct database connection:

```yaml
# .github/workflows/sync.yml
name: NPM Sync
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm --filter=@tpmjs/db db:generate
      - run: node scripts/sync-npm.js
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

**Impact**: Sync jobs don't wake Neon compute (uses direct connection from GitHub runner)

#### 4.3 Consider Neon Branching for Dev/Preview

Use Neon branching so preview deployments don't hit production database:

```
Production: main branch (ep-xxx-pooler...)
Preview: dev branch (ep-yyy-pooler...)
```

---

## Implementation Priority

| Priority | Task | Impact | Effort |
|----------|------|--------|--------|
| 🔴 P0 | Reduce cron frequency | High | 5 min |
| 🔴 P0 | Enable connection pooling | High | 10 min |
| 🟡 P1 | Add Vercel KV caching | High | 2 hrs |
| 🟡 P1 | Reduce auto-suspend timeout | Medium | 5 min |
| 🟢 P2 | Optimize queries with select | Medium | 1 hr |
| 🟢 P2 | Move to ISR for tool pages | High | 2 hrs |
| 🔵 P3 | Move sync to GitHub Actions | High | 3 hrs |

---

## Monitoring

After implementing changes, monitor in Neon console:
- **Compute hours**: Should drop 80%+ after P0 changes
- **Connections**: Should be more stable with pooling
- **Query performance**: Check slow query log

---

## Cost Projections

| Scenario | CU-hrs/month | Cost |
|----------|--------------|------|
| Current | 100+ | Over free tier |
| After P0 | ~20-30 | Free tier |
| After P1 | ~10-15 | Free tier |
| After all | ~5-10 | Free tier |

Free tier limit: **100 CU-hrs/month**

---

## Quick Start

1. **Right now**: Update `vercel.json` cron schedules
2. **Today**: Add `-pooler` to DATABASE_URL in Vercel
3. **This week**: Add Vercel KV caching
4. **Next week**: Convert to ISR

This should get you well under the 100 CU-hr limit.
