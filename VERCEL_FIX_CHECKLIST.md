# 🔥 Vercel API Routes Fix - Action Checklist

## Problem Summary

**API routes are not deploying because Vercel is not detecting your project as Next.js.**

When Vercel doesn't detect Next.js, it treats your deployment as a static site and **drops all App Router API routes** from the build output. Pages work because they're static files, but API routes require serverless function generation which only happens when Next.js is properly detected.

---

## ✅ Fix Checklist (Complete in Order)

### 1️⃣ Fix Root Directory

**Where:** Vercel Dashboard → Project `tpmjs-web` → Settings → General → Root Directory

**Current (likely):** Empty, `.`, or wrong path
**Required:** `apps/web` (exactly this, no leading/trailing slashes)

**Validation:**
```
✓ Must be exactly: apps/web
✗ NOT: /apps/web/
✗ NOT: ./apps/web
✗ NOT: tpmjs/apps/web
```

---

### 2️⃣ Set Framework Preset

**Where:** Vercel Dashboard → Project `tpmjs-web` → Settings → General → Framework Preset

**Current (likely):** "Other"
**Required:** "Next.js"

**Why this matters:**
- Framework = "Other" → Uses `@vercel/static-builder` → No API routes
- Framework = "Next.js" → Uses `@vercel/next` → API routes deployed

---

### 3️⃣ Remove Domain from Old Project

**Where:** Vercel Dashboard → Project `v0-tool-registry-page` → Settings → Domains

**Action:** Remove these domains:
- `tpmjs.com`
- `www.tpmjs.com`

**Then:** Verify both domains are ONLY assigned to the `tpmjs` project

**Why this matters:**
The "Redirecting..." message is coming from the old project. Having two projects with the same domain causes shadow routing and API requests hitting the wrong deployment.

---

### 4️⃣ Clear Custom Build Commands

**Where:** Vercel Dashboard → Project `tpmjs-web` → Settings → Build & Development Settings

**Set ALL to default/empty:**
```
Build Command:     (empty - let Vercel auto-detect)
Install Command:   (empty - let Vercel auto-detect)
Output Directory:  .next (default)
```

**Why this matters:**
Custom build commands bypass Vercel's Next.js detection. Vercel should automatically:
- Detect monorepo structure
- Run `pnpm install`
- Run `pnpm build` in the correct workspace
- Use `@vercel/next` builder

**If you must use custom commands, use:**
```
Build Command:     pnpm turbo run build --filter=@tpmjs/web
Install Command:   pnpm install
```

But try empty first.

---

## 🧪 Verification Steps

### Before Deploying

Run this locally to confirm Next.js detection:
```bash
cd apps/web
vercel build
```

**Expected output should include:**
```
● route (app) /api/health
● route (app) /api/tools
● route (app) /api/sync/changes
λ /api/health
λ /api/tools
λ /api/sync/changes
```

**If you DON'T see this, Vercel won't deploy API routes.**

### After Deploying

1. **Check Build Output:**
```bash
vercel inspect <deployment-url>
```

Should show:
```
Builds
  ├── λ api/health (XXX KB) [region]
  ├── λ api/tools (XXX KB) [region]
  ├── λ api/sync/changes (XXX KB) [region]
  ├── λ tool/[slug] (XXX KB) [region]
  ...
```

2. **Test API Routes:**
```bash
# Should return JSON (not timeout, not "Redirecting...")
curl https://tpmjs.com/api/health

# Should return tool data
curl https://tpmjs.com/api/tools
```

---

## 📋 Expected Results

### ✅ Success Indicators

- [ ] `vercel inspect` shows API routes as `λ` functions
- [ ] `curl https://tpmjs.com/api/health` returns JSON
- [ ] `curl https://tpmjs.com/api/tools` returns tool data
- [ ] No "Redirecting..." messages
- [ ] No timeouts on direct Vercel URLs
- [ ] Build logs show "route (app) /api/*"

### ❌ Failure Indicators (Need to revisit steps)

- [ ] Only pages listed in `vercel inspect`, no API routes
- [ ] API endpoints return "Redirecting..."
- [ ] API endpoints timeout (exit code 28)
- [ ] Build logs don't mention API routes
- [ ] Framework Preset still shows "Other"

---

## 🚨 Common Mistakes

### Mistake 1: Wrong Root Directory Format
```
✗ /apps/web/  (leading/trailing slashes)
✗ ./apps/web  (relative path notation)
✗ apps/web/   (trailing slash)
✓ apps/web    (correct)
```

### Mistake 2: Leaving Custom Build Commands
If you have:
```json
{
  "buildCommand": "cd ../.. && turbo build --filter=@tpmjs/web"
}
```

This MIGHT work, but can break Next.js detection. Start with empty and only add if needed.

### Mistake 3: Not Removing Domain from Old Project
If `v0-tool-registry-page` still has `tpmjs.com`, your requests will route to the wrong project randomly based on:
- DNS propagation
- Edge cache
- Vercel's routing priority

### Mistake 4: Not Verifying Framework Preset
"Other" is Vercel's default when it can't detect a framework. This is the #1 cause of missing API routes in monorepos.

---

## 🔧 Troubleshooting

### If API routes STILL don't deploy after all 4 steps:

1. **Check Build Logs:**
   - Does it say "Detected Next.js"?
   - Does it list "route (app) /api/*"?
   - Does it show `@vercel/next` builder?

2. **Check package.json location:**
   ```
   ✓ Should exist: apps/web/package.json
   ✗ Should NOT be at root ONLY
   ```

3. **Check next.config.ts location:**
   ```
   ✓ Should exist: apps/web/next.config.ts
   ```

4. **Verify pnpm workspace:**
   ```bash
   # Should show @tpmjs/web
   pnpm list --depth 0 --filter @tpmjs/web
   ```

5. **Test local build with Vercel CLI:**
   ```bash
   cd apps/web
   vercel build --debug
   ```
   Look for "Framework: nextjs" in output.

---

## 📞 When to Contact Vercel Support

If after completing all 4 steps:
- Build logs show "Detected Next.js"
- Build logs show "route (app) /api/*"
- BUT `vercel inspect` still doesn't list API functions

Then you have a Vercel platform bug. Contact support with:
- This checklist
- Build logs
- `vercel inspect` output
- Link to `API_ROUTES_TIMEOUT_INVESTIGATION.md`

---

## 🎯 Quick Win Test

**Don't want to change production settings yet?**

1. Create a NEW Vercel project
2. Import the SAME repo
3. Set Root Directory to `apps/web`
4. Set Framework Preset to "Next.js"
5. Deploy

If API routes work in the new project → confirms the fix
If API routes still fail → deeper issue (contact support)

---

## ✨ Post-Fix Cleanup

Once API routes are working:

### Optional: Re-add www redirect

Now that API routes work, you can safely add the www redirect back:

**Option A - Vercel Project Settings:**
Vercel Dashboard → Domains → tpmjs.com → Redirect www to apex

**Option B - Next.js config:**
```typescript
// apps/web/next.config.ts
async redirects() {
  return [
    {
      source: '/:path((?!api).*)*', // Exclude /api/*
      has: [{ type: 'host', value: 'www.tpmjs.com' }],
      destination: 'https://tpmjs.com/:path*',
      permanent: true,
    },
  ];
}
```

**Option C - vercel.json (not recommended):**
Only use if you understand the implications.

### Optional: Remove maxDuration exports

The `export const maxDuration = 60;` in your route files isn't needed unless you actually need longer timeouts. Default is 10s (Hobby) or 15s (Pro).

---

## 📊 Summary

| Issue | Root Cause | Fix |
|-------|------------|-----|
| API routes timeout | Vercel doesn't detect Next.js | Set Framework Preset to "Next.js" |
| No λ functions in build | Wrong Root Directory | Set to `apps/web` exactly |
| "Redirecting..." on API calls | Domain on two projects | Remove from old project |
| Build doesn't find API routes | Custom build commands break detection | Clear custom commands |

**Time to fix:** 5 minutes (just changing dashboard settings)
**Deployments needed:** 1 (changes take effect on next deploy)
**Code changes needed:** 0 (this is pure configuration)

---

## 🎉 When It Works

You'll know it's fixed when:

```bash
$ curl https://tpmjs.com/api/health
{"status":"ok","timestamp":"2025-11-28T...","env":{"hasDatabase":true,"nodeEnv":"production"}}

$ curl https://tpmjs.com/api/tools
{"data":[...],"pagination":{...}}
```

And `vercel inspect <url>` shows:
```
Builds
  ├── λ api/health
  ├── λ api/tools
  ├── λ api/stats
  ... (ALL your API routes)
```

**That's it. No code changes. Just fix the Vercel project configuration.**
