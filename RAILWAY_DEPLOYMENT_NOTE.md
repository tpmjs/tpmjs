# Railway Executor - Deployment Status

## Issue Discovered

Node.js does not support HTTP(S) imports by default, even with `--experimental-network-imports` flag (that flag doesn't exist in current Node versions).

## Solutions Considered

1. **Custom ESM Loader** - Complex, requires Node.js 18.19+ with `--loader` flag
2. **fetch + eval** - Security concerns, doesn't handle ES modules properly
3. **Bundler approach** - Would defeat the purpose of dynamic imports
4. **Deno** - Supports HTTP imports natively, but different ecosystem

## Recommended Solution

Since the core issue is that we need truly dynamic runtime imports from HTTP URLs, and Node.js doesn't support this, we have **two viable paths**:

### Option A: Use Deno on Railway (RECOMMENDED)

Deno supports HTTP imports natively:

```typescript
// server.ts (Deno)
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const moduleCache = new Map();

async function loadTool(url: string, exportName: string) {
  if (moduleCache.has(url)) {
    return moduleCache.get(url);
  }

  // Deno supports this natively!
  const module = await import(url);
  const tool = module[exportName];
  moduleCache.set(url, tool);
  return tool;
}

serve(async (req) => {
  // ... handle requests
}, { port: 3002 });
```

**Deploy to Railway:**
```bash
# In Railway dashboard:
# - Set Start Command: deno run --allow-net --allow-env server.ts
# - Or use railway.json with deno runtime
```

### Option B: Pre-build Bundle Approach

Instead of truly dynamic imports, pre-fetch and cache tools:

1. Playground searches for tools
2. Backend fetches tool code once and caches it
3. Use `vm2` or similar to execute in sandbox
4. Not truly "dynamic" but works with Node.js

## Current Status

The Railway executor service is **created** but **not deployed** because Node.js doesn't support the required HTTP imports.

**Files created:**
- `apps/railway-executor/package.json`
- `apps/railway-executor/server.js` (incomplete - needs Deno or vm2 approach)
- `apps/railway-executor/README.md`

## Next Steps

**If using Deno (recommended):**
1. Rewrite server.js as server.ts for Deno
2. Deploy to Railway with Deno runtime
3. Test HTTP imports work
4. Update playground to use Railway URL

**If sticking with Node.js:**
1. Install `vm2` package for sandboxed execution
2. Implement fetch + vm2 approach
3. Deploy to Railway
4. Accept limitations (less dynamic, more complex)

## Alternative: Skip Railway, Use Different Architecture

Since the original issue is Next.js bundler limitations, consider:

**Web Workers in Browser** - Load tools client-side using native `import()`
- Pros: No server needed, truly dynamic
- Cons: Exposes API keys, security concerns

**Serverless Functions with Pre-installed Tools** - Deploy each tool as separate function
- Pros: Works with Vercel/Next.js
- Cons: Not truly dynamic, requires redeployment for new tools

---

**Recommendation**: Use Deno on Railway. It's designed for exactly this use case.
