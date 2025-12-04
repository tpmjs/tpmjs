# Running `ai-sdk-tool-code-execution` in Deno - Compatibility Issue

## Problem Summary

We need to run the npm package `ai-sdk-tool-code-execution` in a Deno runtime environment on Railway. The package requires Node.js built-ins (`node:sqlite`, `undici`) that don't exist in Deno, and we're looking for a solution to make it work.

## Environment

- **Runtime:** Deno 1.39.0 on Railway
- **Package:** `ai-sdk-tool-code-execution@0.0.2`
- **Import Method:** Dynamic imports via esm.sh CDN
- **Use Case:** Remote code execution for AI SDK tools

## What We're Trying to Do

We have a Deno server that dynamically imports npm packages at runtime to provide AI SDK tools. The workflow is:

1. User requests a tool (e.g., `executeCode`)
2. Deno server fetches the package from esm.sh or npm
3. Server loads the tool's schema and execution function
4. Server executes the tool with user-provided parameters

## The Package We Need

**Package:** `ai-sdk-tool-code-execution`
**Version:** `0.0.2`
**Description:** Execute Python code in a sandboxed environment using Vercel Sandbox
**npm URL:** https://www.npmjs.com/package/ai-sdk-tool-code-execution
**CDN URLs:**
- esm.sh: `https://esm.sh/ai-sdk-tool-code-execution@0.0.2`
- jsdelivr: `https://cdn.jsdelivr.net/npm/ai-sdk-tool-code-execution@0.0.2/+esm`

**Dependencies (from package.json):**
```json
{
  "dependencies": {
    "ai": "^4.0.18",
    "better-sqlite3": "^11.8.1",
    "undici": "^7.16.0"
  }
}
```

**Key Issue:** The package depends on:
- `better-sqlite3` → which requires `node:sqlite` (Node.js built-in)
- `undici` → HTTP client that uses Node.js internals

## What We've Tried

### Attempt 1: Deno npm: Specifier (Node.js Compatibility Mode)

**Code:**
```typescript
const npmUrl = `npm:ai-sdk-tool-code-execution@0.0.2`;
const module = await import(npmUrl);
```

**Error:**
```
Loading unprepared module: npm:ai-sdk-tool-code-execution@0.0.2
```

**Why it failed:** Deno's npm compatibility requires the package to be "prepared" (downloaded/cached) before import. Dynamic imports of unprepared npm packages fail.

### Attempt 2: esm.sh with Node.js Target

**Code:**
```typescript
const esmUrl = `https://esm.sh/ai-sdk-tool-code-execution@0.0.2?target=esnext`;
const module = await import(esmUrl);
```

**Error:**
```
Module not found "https://esm.sh/node:sqlite?target=esnext"
    at https://esm.sh/undici@^7.16.0?target=esnext:25:8
```

**Why it failed:** The package code imports `node:sqlite` which esm.sh tries to load from `https://esm.sh/node:sqlite?target=esnext`, but `node:sqlite` is a Node.js built-in, not an npm package.

### Attempt 3: Multi-Strategy with Fallback

**Code:**
```typescript
let module;
let importError;

// Strategy 1: npm: specifier
try {
  const npmUrl = `npm:${packageName}@${version}`;
  module = await import(npmUrl);
} catch (error) {
  importError = error;

  // Strategy 2: esm.sh with esnext target
  try {
    const esmUrl = `https://esm.sh/${packageName}@${version}?target=esnext`;
    module = await import(esmUrl);
  } catch (esmError) {
    return { success: false, error: esmError.message };
  }
}
```

**Result:** Both strategies fail with the same errors as above.

## Current Deno Configuration

**`deno.json`:**
```json
{
  "compilerOptions": {
    "allowJs": true,
    "lib": ["deno.window"],
    "strict": true
  },
  "nodeModulesDir": true,
  "unstable": ["byonm"],
  "imports": {
    "zod-to-json-schema": "https://esm.sh/zod-to-json-schema@3.25.0"
  }
}
```

**Key Settings:**
- `nodeModulesDir: true` - Creates `node_modules` directory for npm packages
- `unstable: ["byonm"]` - Enables "Bring Your Own Node Modules" mode

## Full Error Details

### npm: Strategy Error
```json
{
  "success": false,
  "error": "Failed to import package: ...",
  "details": {
    "npmError": "Loading unprepared module: npm:ai-sdk-tool-code-execution@0.0.2, imported from: file:///app/server.ts"
  }
}
```

### esm.sh Strategy Error
```json
{
  "success": false,
  "error": "Failed to import package: Module not found \"https://esm.sh/node:sqlite?target=esnext\"",
  "details": {
    "esmError": "Module not found \"https://esm.sh/node:sqlite?target=esnext\".\n    at https://esm.sh/undici@^7.16.0?target=esnext:25:8"
  }
}
```

## Technical Deep Dive

### Why This Package Needs Node.js

1. **better-sqlite3** - Native Node.js addon for SQLite
   - Uses `node:sqlite` built-in
   - Compiled C++ bindings
   - Not available in Deno without Node compatibility layer

2. **undici** - Modern HTTP client for Node.js
   - Uses Node.js streams and buffer APIs
   - Optimized for Node.js internals
   - May work in Deno with polyfills, but blocked by sqlite dependency

### Deno's Node.js Compatibility

Deno supports many Node.js built-ins via `node:*` imports:
- `node:fs`, `node:path`, `node:http`, `node:crypto`, etc.

**BUT** it does NOT support:
- `node:sqlite` (not a standard Node.js built-in)
- Native addons (`.node` files)
- Some advanced internal APIs

### The Import Flow

1. **Deno tries to import** `npm:ai-sdk-tool-code-execution@0.0.2`
2. **Package resolves to** esm.sh or npm registry
3. **Package imports** `better-sqlite3`
4. **better-sqlite3 imports** `node:sqlite`
5. **FAILURE:** `node:sqlite` doesn't exist in Deno or esm.sh

## Questions for ChatGPT

1. **Can Deno's npm compatibility layer handle `better-sqlite3` or `node:sqlite`?**
   - Is there a Deno-compatible SQLite library we could alias?
   - Can we use import maps to redirect `node:sqlite` to a Deno polyfill?

2. **Can we "prepare" the npm module in Deno before dynamic import?**
   - Is there a way to pre-cache npm packages in Deno?
   - Can we use `deno vendor` or similar to prepare the package?

3. **Can esm.sh or other CDNs provide Node.js built-in polyfills?**
   - Does esm.sh have a mode that bundles Node.js built-ins?
   - Are there CDN parameters we're missing?

4. **Could we use Deno's `--node-modules-dir` flag differently?**
   - Should we install the package via npm/pnpm first?
   - Can we point Deno to pre-installed node_modules?

5. **Is there a way to patch/bundle the package to remove Node.js dependencies?**
   - Could we create a Deno-compatible fork?
   - Are there tools to transpile Node.js packages to Deno?

6. **Alternative: Different code execution package?**
   - Are there Deno-native code execution tools?
   - Could we use WebAssembly or browser-based sandboxing?

## What Would Success Look Like

**Ideal outcome:**
```typescript
// This should work in Deno:
const module = await import('npm:ai-sdk-tool-code-execution@0.0.2');
const { executeCode } = module;

// And this should execute:
const result = await executeCode.execute({
  code: 'print(fibonacci(10))',
  language: 'python'
});
```

**Acceptable outcome:**
```typescript
// Some preparation step, then:
const module = await import('https://esm.sh/ai-sdk-tool-code-execution@0.0.2');
// Works without errors
```

## Repository Context

**Project:** TPMJS - Tool Package Manager for AI SDK
**Server:** `apps/railway-executor/server.ts`
**Config:** `apps/railway-executor/deno.json`
**Deployment:** Railway with Deno runtime

**Server Code (Simplified):**
```typescript
async function loadAndDescribe(req: Request): Promise<Response> {
  const { packageName, exportName, version, importUrl } = await req.json();

  // Try npm: specifier first
  try {
    const npmUrl = `npm:${packageName}@${version}`;
    const module = await import(npmUrl);
    const tool = module[exportName];
    return Response.json({ success: true, tool });
  } catch (error) {
    // Try esm.sh fallback
    const esmUrl = `https://esm.sh/${packageName}@${version}?target=esnext`;
    const module = await import(esmUrl);
    const tool = module[exportName];
    return Response.json({ success: true, tool });
  }
}

Deno.serve({ port: 3001 }, handler);
```

## Live Error Logs

**Request:**
```bash
curl -X POST https://endearing-commitment-production.up.railway.app/load-and-describe \
  -H "Content-Type: application/json" \
  -d '{
    "packageName": "ai-sdk-tool-code-execution",
    "exportName": "executeCode",
    "version": "0.0.2",
    "importUrl": "https://esm.sh/ai-sdk-tool-code-execution@0.0.2"
  }'
```

**Response:**
```json
{
  "success": false,
  "error": "Failed to import package: Module not found \"https://esm.sh/node:sqlite?target=esnext\"",
  "details": {
    "npmError": "Loading unprepared module: npm:ai-sdk-tool-code-execution@0.0.2",
    "esmError": "Module not found \"https://esm.sh/node:sqlite?target=esnext\""
  }
}
```

## Additional Context

- We successfully load other packages (e.g., `@tpmjs/hello`, `zod-to-json-schema`)
- Only packages with Node.js built-in dependencies fail
- Switching to Node.js would work, but we prefer Deno's security model
- This is for a production tool registry serving AI SDK tools to users

## Related Resources

- **Deno npm compatibility:** https://deno.com/manual/node/npm_specifiers
- **Deno Node built-ins:** https://deno.com/manual/node/node_specifiers
- **esm.sh documentation:** https://esm.sh/
- **Package source:** https://www.npmjs.com/package/ai-sdk-tool-code-execution
- **Deno SQLite libraries:** https://deno.land/x/sqlite@v3.8

---

**Question for ChatGPT:** Is there any way to make `ai-sdk-tool-code-execution` work in Deno, given these constraints? If not, what's the closest alternative that would work in Deno's runtime?
