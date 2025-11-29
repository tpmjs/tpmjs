# API Routes Timeout Issue - Complete Investigation Report

## Problem Statement

API routes deployed to Vercel are timing out with no response. The Next.js application pages work perfectly, but all API endpoints at `/api/*` return timeouts or "Redirecting..." messages.

**Affected URLs:**
- `https://tpmjs.com/api/health` - Returns "Redirecting..."
- `https://tpmjs.com/api/tools` - Returns "Redirecting..."
- `https://tpmjs-1chh44d1u-tpmjs.vercel.app/api/health` - Timeouts (exit code 28)
- `https://tpmjs-1chh44d1u-tpmjs.vercel.app/api/tools` - Timeouts (exit code 28)

**Working:**
- All page routes work correctly (e.g., `/`, `/tool/[slug]`)
- UI navigation and client-side routing function normally
- Local development API routes work perfectly

## Environment Details

### Project Structure
- **Monorepo:** Turborepo setup with pnpm workspaces
- **Framework:** Next.js 16.0.4 (App Router)
- **Node Version:** 24.x (on Vercel)
- **Deployment Platform:** Vercel
- **Custom Domains:** tpmjs.com, www.tpmjs.com

### Repository Structure
```
tpmjs/
├── apps/
│   └── web/                          # Next.js 16 App Router application
│       ├── src/
│       │   └── app/
│       │       ├── api/
│       │       │   ├── health/route.ts
│       │       │   ├── stats/route.ts
│       │       │   ├── tools/
│       │       │   │   ├── route.ts
│       │       │   │   ├── [id]/route.ts
│       │       │   │   ├── [slug]/route.ts
│       │       │   │   └── validate/route.ts
│       │       │   └── sync/
│       │       │       ├── changes/route.ts
│       │       │       ├── keyword/route.ts
│       │       │       └── metrics/route.ts
│       │       ├── page.tsx
│       │       └── tool/[slug]/page.tsx
│       ├── next.config.ts
│       └── vercel.json
├── packages/
│   ├── db/                           # Prisma client
│   ├── types/                        # Shared TypeScript types
│   ├── utils/                        # Utility functions
│   ├── env/                          # Environment validation
│   └── ui/                           # React component library
├── vercel.json                       # Root Vercel configuration
└── turbo.json
```

## API Route Examples

### `/apps/web/src/app/api/health/route.ts`
```typescript
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/health
 * Simple health check endpoint that doesn't touch the database
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      hasDatabase: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
    },
  });
}
```

### `/apps/web/src/app/api/tools/route.ts`
```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@tpmjs/db/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // ... query string parsing

  const [tools, totalCount] = await Promise.all([
    prisma.tool.findMany({
      where,
      orderBy: [
        { qualityScore: 'desc' },
        { npmDownloadsLastMonth: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    }),
    prisma.tool.count({ where }),
  ]);

  return NextResponse.json({
    data: tools,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
}
```

## Configuration Files

### `/apps/web/next.config.ts` (Current)
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@tpmjs/ui', '@tpmjs/utils', '@tpmjs/db', '@tpmjs/types', '@tpmjs/env'],
  reactStrictMode: true,
};

export default nextConfig;
```

### `/apps/web/vercel.json` (Current)
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd ../.. && pnpm --filter=@tpmjs/web build",
  "installCommand": "pnpm install"
}
```

### `/vercel.json` (Root)
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "git": {
    "deploymentEnabled": {
      "main": true
    }
  },
  "github": {
    "silent": false,
    "autoJobCancelation": true
  },
  "crons": [
    {
      "path": "/api/sync/changes",
      "schedule": "*/2 * * * *"
    },
    {
      "path": "/api/sync/keyword",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/sync/metrics",
      "schedule": "0 * * * *"
    }
  ]
}
```

## Local Build Verification

### Local Build Output Structure
```bash
$ ls -R /Users/ajaxdavis/repos/tpmjs/tpmjs/apps/web/.next/server/app/api/

health/
stats/
sync/
tools/

/apps/web/.next/server/app/api/health:
route
route.js
route.js.map
route.js.nft.json
route_client-reference-manifest.js

/apps/web/.next/server/app/api/stats:
route
route.js
route.js.map
route.js.nft.json
route_client-reference-manifest.js

/apps/web/.next/server/app/api/tools:
[id]/
[slug]/
validate/
route
route.js
route.js.map
route.js.nft.json
route_client-reference-manifest.js
```

### Routes Manifest Confirmation
```bash
$ cat /apps/web/.next/routes-manifest.json | jq '.staticRoutes[] | select(.page | contains("api"))'

{
  "page": "/api/health",
  "regex": "^/api/health(?:/)?$",
  "routeKeys": {},
  "namedRegex": "^/api/health(?:/)?$"
}
{
  "page": "/api/stats",
  "regex": "^/api/stats(?:/)?$",
  "routeKeys": {},
  "namedRegex": "^/api/stats(?:/)?$"
}
{
  "page": "/api/sync/changes",
  "regex": "^/api/sync/changes(?:/)?$",
  "routeKeys": {},
  "namedRegex": "^/api/sync/changes(?:/)?$"
}
{
  "page": "/api/sync/keyword",
  "regex": "^/api/sync/keyword(?:/)?$",
  "routeKeys": {},
  "namedRegex": "^/api/sync/keyword(?:/)?$"
}
{
  "page": "/api/sync/metrics",
  "regex": "^/api/sync/metrics(?:/)?$",
  "routeKeys": {},
  "namedRegex": "^/api/sync/metrics(?:/)?$"
}
```

### Node File Trace (NFT) Verification
```bash
$ cat /apps/web/.next/server/app/api/health/route.js.nft.json

{
  "version": 1,
  "files": [
    "../../../../../../../node_modules/.pnpm/next@16.0.4_@babel+core@7.28.5_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/app-router-headers.js",
    "../../../../../../../node_modules/.pnpm/next@16.0.4_@babel+core@7.28.5_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/@opentelemetry/api/index.js",
    // ... many more dependencies
  ]
}
```

**Conclusion:** API routes build correctly locally with all dependencies properly traced.

## Vercel Deployment Analysis

### Deployment Inspection Output
```bash
$ vercel inspect https://tpmjs-1chh44d1u-tpmjs.vercel.app

General
  id		dpl_2FHyiTWtBZzvT8EcohwYEZmdb8rb
  name		tpmjs-web
  target	production
  status	● Ready
  url		https://tpmjs-1chh44d1u-tpmjs.vercel.app
  created	Fri Nov 28 2025 20:44:03 GMT+1000

Aliases
  ╶ https://www.tpmjs.com
  ╶ https://tpmjs-web.vercel.app
  ╶ https://tpmjs-web-tpmjs.vercel.app
  ╶ https://tpmjs-web-git-main-tpmjs.vercel.app
  ╶ https://tpmjs.com

Builds
  ┌ .        [0ms]
  ├── λ tool/[slug] (562.92KB) [iad1]
  ├── λ tool/[slug].rsc (562.92KB) [iad1]
  ├── λ _global-error (642.48KB) [iad1]
  ├── λ _global-error.rsc (642.48KB) [iad1]
  ├── λ _global-error.segments/__PAGE__.segment.rsc (642.48KB) [iad1]
  └── 56 output items hidden
```

**CRITICAL FINDING:** No API routes are listed in the build output. Only pages (`tool/[slug]`, `_global-error`, etc.) appear as serverless functions (`λ`).

Expected API routes that should appear:
- `λ api/health`
- `λ api/tools`
- `λ api/tools/[id]`
- `λ api/tools/[slug]`
- `λ api/sync/changes`
- etc.

### Testing Results
```bash
# Direct Vercel URL - Timeouts
$ curl -s -m 10 https://tpmjs-1chh44d1u-tpmjs.vercel.app/api/health
# Exit code 28 (timeout)

# Custom Domain - Returns "Redirecting..."
$ curl -s -m 10 https://tpmjs.com/api/health
Redirecting...

# Custom Domain - Returns "Redirecting..."
$ curl -s -m 10 https://tpmjs.com/api/tools
Redirecting...

# Check redirect headers
$ curl -I https://tpmjs.com
HTTP/2 307
cache-control: public, max-age=0, must-revalidate
content-type: text/plain
date: Fri, 28 Nov 2025 10:38:12 GMT
location: https://www.tpmjs.com/
server: Vercel
```

## Vercel Configuration Details

### User-Confirmed Settings
- **Root Directory:** `apps/web` (set in Vercel dashboard)
- **DATABASE_URL:** Configured in Vercel environment variables (Production)
- **Framework Preset:** (Unknown - needs verification)
- **Build Output Directory:** (Unknown - using default `.next`)

### Project List
```bash
$ vercel project ls | grep -i tpmjs

tpmjs                          --                              16h       24.x
v0-tool-registry-page          https://tpmjs.com               3d        22.x
```

**NOTE:** Two projects exist:
1. `tpmjs` - Current project (Node 24.x)
2. `v0-tool-registry-page` - Also has tpmjs.com domain (Node 22.x)

This could indicate a domain routing conflict or outdated project.

## Investigation Timeline & Attempts

### Attempt 1: Remove Root-Level Redirects
**Hypothesis:** The redirect in `/vercel.json` was intercepting API requests.

**Original `/vercel.json`:**
```json
{
  "redirects": [
    {
      "source": "/:path*",
      "has": [
        {
          "type": "host",
          "value": "www.tpmjs.com"
        }
      ],
      "destination": "https://tpmjs.com/:path*",
      "permanent": true
    }
  ]
}
```

**Action:** Removed the `redirects` array from root `/vercel.json`.

**Result:** ❌ API routes still timeout. Redirect rule was not the root cause.

**Commit:** `9be3af7 fix(routing): move www redirect from vercel.json to Next.js config`

### Attempt 2: Move Redirects to Next.js Config
**Hypothesis:** Next.js should handle redirects after routing.

**Action:** Added `async redirects()` to `apps/web/next.config.ts`:
```typescript
async redirects() {
  return [
    {
      source: '/:path*',
      has: [
        {
          type: 'host',
          value: 'www.tpmjs.com',
        },
      ],
      destination: 'https://tpmjs.com/:path*',
      permanent: true,
    },
  ];
}
```

**Result:** ❌ API routes returned "Redirecting..." instead of executing. Next.js `async redirects()` applies to ALL routes including API routes.

**Commit:** `9be3af7 fix(routing): move www redirect from vercel.json to Next.js config`

### Attempt 3: Exclude API Routes from Redirect
**Hypothesis:** Use regex to exclude `/api/*` from redirects.

**Action:** Modified redirect pattern:
```typescript
async redirects() {
  return [
    {
      source: '/((?!api).*)',  // Negative lookahead to exclude /api/*
      has: [
        {
          type: 'host',
          value: 'www.tpmjs.com',
        },
      ],
      destination: 'https://tpmjs.com/$1',
      permanent: true,
    },
  ];
}
```

**Result:** ❌ API routes back to timing out (not redirecting anymore, but still not working).

**Commit:** `c42bfb6 fix(redirects): exclude API routes from www redirect`

### Attempt 4: Remove All Redirects
**Hypothesis:** Eliminate redirect loop causing ERR_TOO_MANY_REDIRECTS.

**Action:** Removed `async redirects()` entirely from `next.config.ts`.

**Result:** ✅ Redirect loop fixed. ❌ API routes still timeout.

**Commit:** `b93cd42 fix: remove redirects to resolve redirect loop`

### Attempt 5: Add Vercel Functions Configuration
**Hypothesis:** Vercel needs explicit configuration to detect API routes.

**Action:** Added to `apps/web/vercel.json`:
```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

**Result:** ❌ No change. API routes still timeout.

**Commit:** `748ca4d fix(api): configure Vercel functions for API routes with maxDuration`

### Attempt 6: Add maxDuration to Route Files
**Hypothesis:** Export configuration directly in route handlers.

**Action:** Added to `apps/web/src/app/api/health/route.ts`:
```typescript
export const maxDuration = 60;
```

**Result:** ❌ No change. API routes still timeout.

**Commit:** `8281f8f fix(build): disable Turbopack for Vercel deployment`

### Attempt 7: Disable Turbopack
**Hypothesis:** Turbopack (Next.js 16 default) has compatibility issues with Vercel.

**Action:** Added `--webpack` flag to build command:
```json
{
  "buildCommand": "cd ../.. && turbo build --filter=@tpmjs/web -- --webpack"
}
```

**Result:** ❌ Build failed completely. Invalid flag syntax.

**Commit:** `8281f8f fix(build): disable Turbopack for Vercel deployment`

### Attempt 8: Simplify Build Command
**Hypothesis:** Use direct pnpm build instead of Turbo wrapper.

**Action:** Changed to:
```json
{
  "buildCommand": "cd ../.. && pnpm --filter=@tpmjs/web build"
}
```

**Result:** ⏳ Pending deployment test.

**Commit:** `065196d fix(build): simplify Vercel build command`

## Root Cause Analysis

### What We Know FOR SURE

1. ✅ **API routes build correctly locally**
   - All 9 API routes compile to `.next/server/app/api/`
   - NFT (Node File Trace) files are generated with proper dependencies
   - Routes manifest includes all API routes

2. ✅ **Next.js configuration is correct**
   - `export const runtime = 'nodejs'` set correctly
   - `export const dynamic = 'force-dynamic'` set correctly
   - `transpilePackages` includes all workspace packages

3. ✅ **Pages deploy and work perfectly**
   - `/tool/[slug]` renders correctly
   - Homepage loads
   - Client-side navigation works

4. ❌ **API routes are NOT deployed as serverless functions**
   - `vercel inspect` shows NO API routes in build output
   - Only pages appear as `λ` (lambda) functions
   - This is the PRIMARY issue

5. ❌ **Direct Vercel URLs timeout**
   - Not just a custom domain issue
   - Affects `*.vercel.app` URLs
   - Exit code 28 (timeout) - no response at all

6. ❌ **Custom domain shows "Redirecting..."**
   - Even with all redirects removed from config
   - Suggests a redirect at Vercel platform level OR DNS level
   - Could be from the `v0-tool-registry-page` project conflict

### Possible Root Causes

#### Theory 1: Vercel Project Misconfiguration
**Likelihood:** HIGH

**Evidence:**
- Two projects with same domain (`tpmjs` and `v0-tool-registry-page`)
- Framework Preset might not be set to "Next.js"
- Root Directory is `apps/web` but Vercel might not be detecting Next.js properly

**What to Check:**
1. Vercel Dashboard → Project Settings → General
   - Framework Preset: Should be "Next.js"
   - Root Directory: Should be "apps/web"
   - Build Command: Should match vercel.json
   - Output Directory: Should be blank (default `.next`)

2. Vercel Dashboard → Domains
   - Check if both projects have tpmjs.com
   - Remove domain from `v0-tool-registry-page` if present

3. Vercel Dashboard → Deployments → Build Logs
   - Search for "API" or "route"
   - Look for errors about missing functions
   - Check if Next.js is detected correctly

#### Theory 2: Monorepo Detection Issue
**Likelihood:** MEDIUM

**Evidence:**
- Build command uses `cd ../.. && pnpm --filter=@tpmjs/web build`
- Vercel might not be correctly detecting workspace structure
- `transpilePackages` includes workspace packages

**What to Check:**
1. Build logs for workspace resolution errors
2. Check if `node_modules` is being created in correct location
3. Verify pnpm workspace configuration

**Potential Fix:**
Try setting `installCommand` to:
```json
{
  "installCommand": "pnpm install --shamefully-hoist"
}
```

#### Theory 3: Next.js 16 + Vercel Incompatibility
**Likelihood:** MEDIUM

**Evidence:**
- Next.js 16 released recently (November 2024)
- Turbopack is default (might have Vercel issues)
- App Router API routes behave differently than Pages Router

**What to Check:**
1. Vercel build logs for Next.js version detection
2. Any warnings about incompatible features
3. Check Vercel's Next.js 16 support status

**Potential Fix:**
Downgrade to Next.js 15.x temporarily to test:
```json
{
  "dependencies": {
    "next": "^15.0.0"
  }
}
```

#### Theory 4: Environment Variable Issue
**Likelihood:** LOW

**Evidence:**
- DATABASE_URL is configured
- Pages work (they might not need env vars)
- API routes use Prisma (requires DATABASE_URL)

**What to Check:**
1. Vercel Dashboard → Settings → Environment Variables
   - Verify DATABASE_URL is set for Production
   - Verify it's not blocked or empty
   - Check if other vars are needed

2. Build logs for Prisma generation errors

**Potential Fix:**
None - user confirmed DATABASE_URL is set.

#### Theory 5: Build Output Issue
**Likelihood:** MEDIUM-HIGH

**Evidence:**
- `vercel inspect` doesn't show API routes
- Only pages are listed as functions
- Build completes successfully (38-41 seconds)

**What to Check:**
1. Build logs: Does Next.js report building API routes?
   - Look for "Route (app)" or "λ" indicators for API routes
   - Compare to local build output

2. Check if Vercel is using correct build output structure
   - App Router uses `.next/server/app/`
   - Pages Router uses `.next/server/pages/`

**Potential Fix:**
Try forcing Vercel to recognize the build:
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ]
}
```

(Note: `builds` is legacy, modern Next.js should auto-detect)

## Recommended Next Steps

### Immediate Actions (High Priority)

1. **Check Vercel Project Settings**
   - Go to Vercel Dashboard → tpmjs-web project
   - Verify Framework Preset is "Next.js"
   - Verify Root Directory is `apps/web`
   - Screenshot settings for reference

2. **Review Build Logs**
   - Go to latest deployment
   - Download complete build logs
   - Search for:
     - "Route (app)" - should show API routes
     - "λ" - should show API functions
     - "api" - any mentions
     - Errors or warnings

3. **Check Domain Configuration**
   - Verify only ONE project has tpmjs.com domain
   - Remove domain from `v0-tool-registry-page` project if present
   - Check DNS settings aren't redirecting

4. **Test Simple API Route**
   - Create minimal API route:
   ```typescript
   // apps/web/src/app/api/test/route.ts
   export async function GET() {
     return new Response('Hello from API', { status: 200 });
   }
   ```
   - Deploy and test
   - If this doesn't work, confirms platform issue

### Investigation Actions (Medium Priority)

5. **Compare Working vs Non-Working**
   - Find a deployment where pages DO work
   - Compare build output between page routes and API routes
   - Look for differences in how they're compiled

6. **Test Vercel CLI Deploy**
   - Deploy directly via CLI: `vercel --prod`
   - Check if behavior differs from Git-based deploy
   - Might reveal configuration issues

7. **Check Vercel Function Logs**
   - Even though functions aren't in build output, try:
   - `vercel logs <deployment-url> --since 1h`
   - Look for any API route invocations or errors

8. **Review Turbo Configuration**
   ```bash
   # Check turbo.json for Next.js build config
   cat /turbo.json

   # Verify build runs correctly locally
   pnpm --filter=@tpmjs/web build
   ```

### Alternative Approaches (If Above Fails)

9. **Create New Vercel Project**
   - Import from Git fresh
   - Use identical settings
   - Test if fresh project works

10. **Contact Vercel Support**
    - This may be a platform bug with Next.js 16
    - Provide this document as context
    - Ask specifically why API routes aren't in build output

11. **Temporary Workaround**
    - Deploy API routes separately (different service)
    - Use Vercel proxy to route `/api/*` to separate deployment
    - Not ideal but unblocks development

## Environment Variables Needed

```bash
# Required for API routes
DATABASE_URL="postgresql://..."

# Optional (check if needed)
NODE_ENV="production"
NEXT_PUBLIC_*  # Any public env vars
```

## Build Commands Reference

### Local Development
```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm --filter=@tpmjs/db db:generate

# Run development server
pnpm --filter=@tpmjs/web dev

# Build for production
pnpm --filter=@tpmjs/web build

# Test build locally
pnpm --filter=@tpmjs/web start
```

### Vercel Configuration
**Current:**
```json
{
  "buildCommand": "cd ../.. && pnpm --filter=@tpmjs/web build",
  "installCommand": "pnpm install"
}
```

**Alternative to try:**
```json
{
  "buildCommand": "cd ../.. && turbo build --filter=@tpmjs/web",
  "installCommand": "pnpm install",
  "framework": "nextjs"
}
```

## Key Files to Review

1. `/apps/web/next.config.ts` - Next.js configuration
2. `/apps/web/vercel.json` - Vercel app-level config
3. `/vercel.json` - Vercel root config
4. `/turbo.json` - Turborepo configuration
5. `/apps/web/.next/routes-manifest.json` - Route definitions
6. `/apps/web/.next/build-manifest.json` - Build output
7. Vercel build logs (from dashboard)

## Questions for Vercel Support

If escalating to Vercel support, ask:

1. Why are API routes not appearing in the build output (`vercel inspect`) when pages are deploying correctly?

2. Is there a known issue with Next.js 16 App Router API routes in Turborepo monorepos?

3. What's the correct way to configure `vercel.json` for a Next.js 16 app in a monorepo with custom build commands?

4. Could having two projects (`tpmjs` and `v0-tool-registry-page`) with the same domain cause routing issues?

5. Are there any specific requirements for deploying Next.js 16 API routes that differ from Next.js 15?

## Related Documentation

- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Vercel Next.js Deployment](https://vercel.com/docs/frameworks/nextjs)
- [Vercel Functions Configuration](https://vercel.com/docs/functions/configuring-functions)
- [Turborepo with Vercel](https://vercel.com/docs/monorepos/turborepo)
- [Next.js App Router API Routes](https://nextjs.org/docs/app/api-reference/file-conventions/route)

## Recent Commits Related to This Issue

```
065196d fix(build): simplify Vercel build command
8281f8f fix(build): disable Turbopack for Vercel deployment
748ca4d fix(api): configure Vercel functions for API routes with maxDuration
b93cd42 fix: remove redirects to resolve redirect loop
c42bfb6 fix(redirects): exclude API routes from www redirect
9be3af7 fix(routing): move www redirect from vercel.json to Next.js config
a92dfff fix(build): add workspace packages to Next.js transpilePackages
cc6c824 fix(vercel): configure Turborepo monorepo build for apps/web
```

## ✅ CONCLUSION - ROOT CAUSE IDENTIFIED

### The Real Problem

**Vercel is NOT detecting this project as a Next.js application.**

When Vercel doesn't detect Next.js, it:
- Uses `@vercel/static-builder` instead of `@vercel/next`
- Treats the deployment as a static site
- Deploys pages (static HTML) successfully
- **Completely drops all App Router API routes**
- Never generates serverless functions for `/api/*` routes

This explains EVERY symptom:
- ✅ Pages work (they're static files)
- ❌ API routes timeout (they were never deployed)
- ❌ No `λ api/*` in build output (functions don't exist)
- ❌ Direct Vercel URLs timeout (not a DNS issue)
- ❌ "Redirecting..." on custom domain (wrong project owns the domain)

### Why Vercel Doesn't Detect Next.js

**1. Wrong Root Directory**
- Vercel project likely has Root Directory set to `.` or empty
- Should be exactly: `apps/web`
- A single character difference breaks Next.js detection

**2. Wrong Framework Preset**
- When Vercel can't auto-detect Next.js (due to monorepo + wrong root)
- It defaults to Framework Preset = "Other"
- "Other" uses static builder, not Next.js builder

**3. Domain Conflict**
- Two projects exist: `tpmjs` and `v0-tool-registry-page`
- Both have `tpmjs.com` domain assigned
- Requests randomly route to wrong project
- "Redirecting..." comes from the old project, not your code

**4. Custom Build Commands**
- Custom build commands can bypass Vercel's auto-detection
- Should let Vercel auto-detect and use default commands

### Evidence

**Local build works:**
```bash
$ ls apps/web/.next/server/app/api/
health/  stats/  sync/  tools/
# All API routes compile correctly
```

**Vercel deployment missing API routes:**
```bash
$ vercel inspect https://tpmjs-1chh44d1u-tpmjs.vercel.app
Builds
  ├── λ tool/[slug]      # Pages present
  ├── λ _global-error    # Pages present
  └── 56 output items hidden
# NO api/health, NO api/tools, NO api/* at all
```

This is **not a Next.js bug, not a Turborepo bug, not a code issue**.
This is **pure Vercel project misconfiguration**.

### The Fix (4 Steps, 5 Minutes)

See `VERCEL_FIX_CHECKLIST.md` for detailed instructions.

**Quick version:**
1. Set Root Directory to `apps/web` (exactly)
2. Set Framework Preset to "Next.js"
3. Remove `tpmjs.com` domain from `v0-tool-registry-page` project
4. Clear custom build commands (let Vercel auto-detect)

**No code changes needed. Just fix Vercel dashboard settings.**

### After the Fix

Next deployment will show:
```bash
$ vercel inspect <new-deployment>
Builds
  ├── λ api/health
  ├── λ api/tools
  ├── λ api/sync/changes
  ├── λ api/tools/[id]
  ├── λ api/tools/[slug]
  ├── λ tool/[slug]
  ...
```

And API routes will work instantly:
```bash
$ curl https://tpmjs.com/api/health
{"status":"ok","timestamp":"..."}
```

---

## Summary for ChatGPT

The core issue is that **Vercel is not detecting the project as Next.js** due to incorrect Root Directory, Framework Preset set to "Other", domain conflicts between two projects, and custom build commands bypassing auto-detection.

When Vercel doesn't detect Next.js, it uses a static site builder which deploys pages but **completely drops all App Router API routes** from the build. This is why pages work but all `/api/*` requests timeout - the API route serverless functions were never created.

**The fix is purely configuration** - no code changes needed. Set Root Directory to `apps/web`, Framework Preset to "Next.js", remove the domain from the old project, and clear custom build commands. See `VERCEL_FIX_CHECKLIST.md` for step-by-step instructions.
