
## Monorepo Setup

This project uses a Turborepo monorepo architecture with the following structure:

### Packages

**Published to npm (@tpmjs scope):**
- `@tpmjs/ui` - React component library with .ts-only components
- `@tpmjs/utils` - Utility functions (cn, format, etc.)
- `@tpmjs/types` - Shared TypeScript types and Zod schemas
- `@tpmjs/env` - Environment variable validation with Zod

**Internal tooling (private):**
- `@tpmjs/config` - Shared configurations (Biome, ESLint, Tailwind, TypeScript)
- `@tpmjs/eslint-config` - ESLint configuration with module boundary rules
- `@tpmjs/tailwind-config` - Tailwind configuration with design tokens
- `@tpmjs/tsconfig` - TypeScript configurations (base, nextjs, react-library)
- `@tpmjs/test` - Vitest shared configuration
- `@tpmjs/mocks` - MSW mock server for testing
- `@tpmjs/storybook` - Component documentation and showcase

### Applications

- `@tpmjs/web` - Next.js 16 App Router application (main website)

### Architecture Principles



#### 2. No Barrel Exports

Components are imported directly without `index.ts` files:

```typescript
// Good
import { Button } from '@tpmjs/ui/Button/Button';

// Bad (not allowed)
import { Button } from '@tpmjs/ui';
```

**Benefits:**
- Clearer dependency graphs
- Better tree-shaking
- Prevents circular dependencies
- Explicit imports

#### 3. Module Boundaries

ESLint enforces strict module boundaries:
- Apps can only import from published packages
- Packages cannot import from apps
- UI package cannot import from utils (stays dependency-free)

#### 4. Shared Configurations

All configuration is centralized in `packages/config/`:
- **Biome** - Formatting + basic linting
- **ESLint** - Semantic rules and module boundaries
- **Tailwind** - Design tokens and shared theme
- **TypeScript** - Multiple configs for different contexts

### Development Workflow

```bash
# Install dependencies
pnpm install

# Run development servers
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint and format
pnpm lint
pnpm format
```

### Detailed Development Commands

This section documents the complete testing, building, and development workflow used in this monorepo.

#### Testing Individual Packages

Use the `--filter` flag to target specific packages:

```bash
# Type-check a single package
pnpm --filter=@tpmjs/npm-client type-check
pnpm --filter=@tpmjs/ui type-check
pnpm --filter=@tpmjs/web type-check

# Run tests in a single package
pnpm --filter=@tpmjs/ui test
pnpm --filter=@tpmjs/web test

# Lint a single package
pnpm --filter=@tpmjs/web lint
```

#### Testing All Packages

Commands from the root run across all packages via Turborepo:

```bash
# Type-check all packages (runs via Turborepo)
pnpm type-check

# Lint all packages (runs via Turborepo)
pnpm lint

# Format all files with Biome
pnpm format

# Test all packages (runs via Turborepo)
pnpm test
```

#### Building Packages

Build commands respect dependency order automatically:

```bash
# Build a single package (and its dependencies)
pnpm --filter=@tpmjs/ui build
pnpm --filter=@tpmjs/types build

# Build all packages
pnpm build

# Build and watch for changes
pnpm --filter=@tpmjs/ui dev
```

#### Database Commands (Prisma)

The `@tpmjs/db` package uses Prisma for database management:

```bash
# Generate Prisma client (required after schema changes)
pnpm --filter=@tpmjs/db db:generate

# Push schema changes to database (dev)
pnpm --filter=@tpmjs/db db:push

# Create and apply migrations (production)
pnpm --filter=@tpmjs/db db:migrate

# Open Prisma Studio (database GUI)
pnpm --filter=@tpmjs/db db:studio

# Seed the database
pnpm --filter=@tpmjs/db db:seed
```

**Important:** Always run `pnpm --filter=@tpmjs/db db:generate` after modifying `schema.prisma` to regenerate the Prisma client. Without this, TypeScript will show errors for database types.

#### Development Servers

```bash
# Run Next.js dev server for web app
pnpm dev --filter=@tpmjs/web

# Run all dev servers (if multiple apps)
pnpm dev

# Run Storybook for component development
pnpm --filter=@tpmjs/storybook dev
```

#### Pre-commit Hooks (Lefthook)

Git commits automatically trigger these checks via Lefthook:

1. **Format** - Biome formats all staged files
2. **Lint** - Runs `pnpm lint` across all packages
3. **Type-check** - Runs `pnpm type-check` across all packages

If any check fails, the commit is blocked. The hooks ensure code quality before changes reach CI.

**Note:** Pre-commit hooks run the same checks as CI, so if they pass locally, CI should pass too.

#### Turborepo Caching

Turborepo caches task outputs for faster rebuilds:

- **Cache hits**: Tasks show `cache hit, replaying logs` - no actual work done
- **Cache miss**: Tasks execute normally and outputs are cached
- **Invalidation**: Cache invalidates when inputs change (source files, dependencies, env vars)

```bash
# Clear Turborepo cache if needed
pnpm turbo clean

# Force rebuild without cache
pnpm build --force
```

#### Common Workflows

**After pulling new changes:**
```bash
pnpm install              # Install new dependencies
pnpm db:generate          # Regenerate Prisma client if schema changed
pnpm type-check           # Verify everything type-checks
pnpm dev --filter=@tpmjs/web  # Start dev server
```

**Creating a new package:**
```bash
# 1. Create package directory and files
mkdir -p packages/my-package/src
cd packages/my-package

# 2. Create package.json with proper name and workspace dependencies
# 3. Create tsconfig.json extending @tpmjs/tsconfig

# 4. Install dependencies from root
cd ../..
pnpm install

# 5. Type-check the new package
pnpm --filter=@tpmjs/my-package type-check
```

**Testing before committing:**
```bash
# Run the same checks that pre-commit hooks will run
pnpm format               # Format all files
pnpm lint                 # Lint all packages
pnpm type-check           # Type-check all packages

# Then commit - hooks should pass quickly
git add .
git commit -m "your message"
```

#### Troubleshooting

**"Cannot find module '@prisma/client'"**
- Run `pnpm --filter=@tpmjs/db db:generate` to generate the Prisma client
- The Prisma client must be generated after any schema changes or fresh installs

**"Type error in package that imports from another package"**
- Build the dependency first: `pnpm --filter=@tpmjs/types build`
- Or build all packages: `pnpm build`
- Turborepo handles this automatically when using `pnpm build`

**"Biome formatting errors in pre-commit"**
- Run `pnpm format` to auto-fix formatting issues
- Biome will format all files according to the config

**"ESLint warnings about module boundaries"**
- Check that you're not importing from apps in packages
- Check that imports follow the no-barrel-exports rule
- Example: Use `@tpmjs/ui/Button/Button` not `@tpmjs/ui`

**"Turborepo cache shows stale outputs"**
- Clear cache with `pnpm turbo clean`
- Force rebuild with `pnpm build --force`

**"Dev server won't start"**
- Check that all dependencies are installed: `pnpm install`
- Check that Prisma client is generated: `pnpm db:generate`
- Check for port conflicts (Next.js default: 3000)

### Publishing Flow

1. Make changes to packages
2. Create changeset: `pnpm changeset`
3. Version packages: `pnpm changeset:version`
4. Publish to npm: `pnpm changeset:publish`
5. Push with tags: `git push --follow-tags`

### Tech Stack

- **Build System:** Turborepo
- **Package Manager:** pnpm
- **TypeScript:** Strict mode, composite projects
- **React:** v19 
- **Next.js:** v16 App Router
- **Styling:** Tailwind CSS
- **Testing:** Vitest + Testing Library
- **Linting:** Biome + ESLint
- **Documentation:** Storybook
- **CI/CD:** GitHub Actions + Changesets
- **Git Hooks:** Lefthook

### Debugging CI/CD with CLI Tools

When debugging CI failures or deployment issues, use command-line tools for efficient investigation:

#### GitHub CLI (`gh`)

Debug GitHub Actions CI runs:

```bash
# List recent workflow runs
gh run list --limit 10

# View specific run details
gh run view <run-id>

# View failed job logs
gh run view <run-id> --log-failed

# View specific job logs
gh run view <run-id> --job <job-id> --log

# Rerun failed jobs
gh run rerun <run-id> --failed
```

**Common debugging workflow:**
1. `gh run list` - Find the failed run ID
2. `gh run view <run-id> --log-failed` - See what failed
3. Fix the issue locally
4. Push and monitor: `gh run watch`

#### Vercel CLI

Debug deployments and preview environments:

```bash
# List deployments
vercel ls

# View deployment details
vercel inspect <deployment-url>

# View deployment logs
vercel logs <deployment-url>

# Pull environment variables
vercel env pull

# Link local project to Vercel project
vercel link
```

**Common debugging workflow:**
1. `vercel ls` - Find the deployment URL
2. `vercel inspect <url>` - Check deployment status and build logs
3. `vercel logs <url>` - View runtime logs
4. Compare env vars: `vercel env pull` and check `.env.local`

#### Tips

- Use `gh` and `vercel` CLIs to debug without leaving the terminal
- Check CI logs before making blind fixes
- Vercel deployments are blocked until GitHub Actions pass (configured in vercel.json)
- Pre-commit/pre-push hooks run the same checks as CI - if they pass locally, CI should pass too

---

## Case Study: Fixing API Route Timeouts on tpmjs.com

This is a detailed account of debugging and fixing API route timeouts in production. The investigation revealed critical insights about deploying Turborepo monorepos to Vercel with Prisma.

### The Problem

After deploying tpmjs.com to production, all API endpoints were timing out:

```bash
$ curl https://tpmjs.com/api/health
# Request timed out after 60 seconds

$ curl https://tpmjs.com/api/tools
# Request timed out after 60 seconds
```

The Next.js UI worked perfectly - pages loaded, navigation functioned - but every API route request resulted in a timeout. No errors appeared in Vercel logs, and the requests never even reached the serverless functions.

### Initial Investigation

**Step 1: Verify Build Output**

```bash
vercel inspect <deployment-url>
```

The build showed pages but **no API routes** listed as lambda functions:

```
Builds
  ├── ○ / (static page)
  ├── ○ /playground (static page)
  └── ○ /tool/[slug] (static page)

# Expected to see:
  ├── λ api/health
  ├── λ api/tools
  └── λ api/sync/changes
```

This confirmed Vercel wasn't treating the project as Next.js - it was using static site generation and dropping all API routes.

**Step 2: Check Vercel Configuration**

Examined `apps/web/vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd ../.. && turbo build --filter=@tpmjs/web",
  "installCommand": "pnpm install"
}
```

The build command looked correct, but the custom build command was bypassing Vercel's Next.js detection.

### Root Cause #1: Workspace Dependencies Not Built

Deployed the site and checked the build logs. Found this critical error:

```
Module not found: Can't resolve '@tpmjs/env'
Module not found: Can't resolve '@tpmjs/types/tpmjs'
Module not found: Can't resolve '@tpmjs/ui/Badge/Badge'
Package @prisma/client can't be external
```

**49 module resolution errors** - the workspace packages weren't being built before the web app tried to import them.

**The Fix:**

Changed the build command from:
```json
"buildCommand": "cd ../.. && turbo build --filter=@tpmjs/web"
```

To:
```json
"buildCommand": "cd ../.. && pnpm install && pnpm --filter=@tpmjs/web... build"
```

The `...` suffix in `--filter=@tpmjs/web...` tells pnpm to build ALL dependencies first:

1. Build `@tpmjs/env`
2. Build `@tpmjs/types`
3. Build `@tpmjs/ui`
4. Build `@tpmjs/utils`
5. Build `@tpmjs/db` (Prisma generate)
6. Finally build `@tpmjs/web`

After this change, the build succeeded and API routes appeared as lambda functions in `vercel inspect`.

### Root Cause #2: Prisma Cold Start Performance

With the build fixed, API routes were deployed but still timing out. Testing revealed:

```bash
# Health endpoint (no database) - WORKS
$ curl https://tpmjs.com/api/health
{"status":"ok","timestamp":"2025-11-28T11:32:29.295Z"}

# Tools endpoint (with database) - TIMEOUT
$ curl https://tpmjs.com/api/tools
# ...60 second timeout
```

**Local Database Performance Test:**

```javascript
// Test the exact queries used in production
const count = await prisma.tool.count();        // 3.244s ⚠️
const tools = await prisma.tool.findMany({
  orderBy: [
    { qualityScore: 'desc' },
    { npmDownloadsLastMonth: 'desc' },
    { createdAt: 'desc' },
  ],
  take: 20,
});                                             // 593ms ⚠️
```

The parallel `count()` + `findMany()` queries were taking **3.8 seconds** due to Prisma cold start in serverless environments.

**The Fix:**

Optimized the endpoint in two ways:

1. **Removed expensive count query** - Using `count()` in every request is slow and usually unnecessary:

```typescript
// Before: Slow parallel queries
const [tools, totalCount] = await Promise.all([
  prisma.tool.findMany({ where, take: limit, skip: offset }),
  prisma.tool.count({ where }),  // ← 3+ seconds!
]);

// After: Fast single query with limit+1 technique
const tools = await prisma.tool.findMany({
  where,
  take: limit + 1,  // Fetch one extra to check if more exist
  skip: offset,
});

const hasMore = tools.length > limit;
const actualTools = hasMore ? tools.slice(0, limit) : tools;
```

2. **Reduced max page size** from 100 to 50 items for better performance

**Results:**

```bash
$ curl https://tpmjs.com/api/tools
{
  "success": true,
  "data": [...],  # Returns in <1 second
  "pagination": {
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

### Additional Optimizations Applied

**Added maxDuration to all API routes:**

```typescript
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;  // ← Prevent premature timeouts
```

**Verified database indexes exist:**

```prisma
model Tool {
  // ... fields ...

  @@index([category])
  @@index([isOfficial])
  @@index([qualityScore])
  @@index([npmDownloadsLastMonth])
  @@index([createdAt])
}
```

All necessary indexes were present - the issue was cold start latency, not missing indexes.

### Key Lessons Learned

**1. Monorepo Build Order Matters**

When deploying Turborepo monorepos to Vercel, workspace dependencies MUST be built first:

```bash
# ❌ Wrong - only builds the web app
pnpm --filter=@tpmjs/web build

# ✅ Correct - builds dependencies first
pnpm --filter=@tpmjs/web... build
```

**2. Prisma in Serverless = Slow First Request**

Prisma Client initialization in serverless environments adds 1-3 seconds of latency on cold starts. Strategies to mitigate:

- Use connection pooling (Neon, PlanetScale)
- Eliminate unnecessary queries (especially `count()`)
- Cache query results when possible
- Consider Prisma Accelerate for critical paths

**3. Progressive Debugging Approach**

Start simple and progressively add complexity:

```typescript
// Step 1: Does endpoint respond at all?
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}

// Step 2: Can we connect to database?
export async function GET() {
  return NextResponse.json({
    hasDatabase: !!process.env.DATABASE_URL,
  });
}

// Step 3: Can we query the database?
export async function GET() {
  const count = await prisma.tool.count();
  return NextResponse.json({ count });
}

// Step 4: Full implementation with optimizations
```

**4. Use Vercel CLI for Debugging**

```bash
# Check what's actually deployed
vercel inspect <deployment-url>

# Look for lambda functions (λ)
Builds
  ├── λ api/health ✅
  ├── λ api/tools ✅

# If you see only static pages (○), API routes aren't deployed
```

### Final Configuration

**`apps/web/vercel.json`:**
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd ../.. && pnpm install && pnpm --filter=@tpmjs/web... build",
  "installCommand": "pnpm install"
}
```

**API Route Template:**
```typescript
import { prisma } from '@tpmjs/db';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  try {
    // Avoid count() - use limit+1 technique instead
    const items = await prisma.tool.findMany({
      orderBy: { qualityScore: 'desc' },
      take: 21,  // Request 1 more than needed
    });

    const hasMore = items.length > 20;
    const data = hasMore ? items.slice(0, 20) : items;

    return NextResponse.json({
      success: true,
      data,
      pagination: { hasMore },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### Performance Metrics

**Before Optimization:**
- `/api/health`: Timeout (60s+)
- `/api/tools`: Timeout (60s+)
- Build: Failed (module resolution errors)

**After Optimization:**
- `/api/health`: ~50ms ✅
- `/api/tools`: ~800ms ✅
- Build: Success (all deps built) ✅

### Conclusion

API timeouts in serverless environments often stem from build configuration issues or database cold starts. For Turborepo + Vercel + Prisma:

1. Use `pnpm --filter=package...` to build dependencies
2. Avoid `count()` queries in hot paths
3. Add `maxDuration` to API routes
4. Use `vercel inspect` to verify lambda deployment
5. Test database performance locally before deploying

The full working implementation is live at [tpmjs.com](https://tpmjs.com).

---

## NPM Package Syncing System

TPMJS.com automatically mirrors npm packages with the `tpmjs-tool` keyword to keep the tool registry up-to-date. This section documents how the syncing system works.

### Overview

The sync system uses three automated strategies running on Vercel Cron to discover and update TPMJS tools:

1. **Changes Feed** - Monitors npm's real-time changes feed for all package updates
2. **Keyword Search** - Actively searches npm for packages with the `tpmjs-tool` keyword
3. **Metrics Sync** - Updates download stats and calculates quality scores

### Sync Endpoints

All sync endpoints are located in `apps/web/src/app/api/sync/`:

#### 1. Changes Feed Sync (`/api/sync/changes`)

**Purpose:** Monitors npm's changes feed to catch new packages and updates in real-time.

**Schedule:** Every 2 minutes (`*/2 * * * *`)

**How it works:**
1. Fetches the last checkpoint sequence number from the database
2. Calls npm's `/_changes` endpoint with `since=<lastSeq>` (limit 100 per run)
3. For each changed package, fetches full metadata with `fetchLatestPackageWithMetadata()`
4. Validates that the package has a valid `tpmjs` field using `validateTpmjsField()`
5. Upserts the tool to the database with `discoveryMethod: 'changes-feed'`
6. Updates the checkpoint with the new sequence number for next run

**Key Features:**
- Uses checkpoints to track progress and avoid reprocessing
- Processes up to 100 changes per run to avoid timeouts
- Logs all sync operations to `syncLog` table
- Requires `Authorization: Bearer <CRON_SECRET>` header

**Example Response:**
```json
{
  "success": true,
  "data": {
    "processed": 5,
    "skipped": 93,
    "errors": 0,
    "lastSeq": "12345678",
    "pending": 1250,
    "durationMs": 2834
  }
}
```

#### 2. Keyword Search Sync (`/api/sync/keyword`)

**Purpose:** Actively searches npm for packages with the `tpmjs-tool` keyword.

**Schedule:** Every 15 minutes (`*/15 * * * *`)

**How it works:**
1. Searches npm registry for packages with keyword `tpmjs-tool` (up to 250 results)
2. Fetches full metadata for each package
3. Validates the `tpmjs` field
4. Upserts tools with `discoveryMethod: 'keyword'`
5. Updates checkpoint with last run timestamp

**Key Features:**
- Catches packages that might be missed by changes feed
- Useful for backfilling existing packages
- Processes up to 250 packages per run

**Example Response:**
```json
{
  "success": true,
  "data": {
    "processed": 12,
    "skipped": 3,
    "errors": 0,
    "packagesFound": 15,
    "durationMs": 4521
  }
}
```

#### 3. Metrics Sync (`/api/sync/metrics`)

**Purpose:** Updates download statistics and calculates quality scores for all tools.

**Schedule:** Every hour (`0 * * * *`)

**How it works:**
1. Fetches all tools from the database
2. For each tool, calls `fetchDownloadStats()` to get last 30 days of downloads
3. Calculates quality score based on:
   - Tier (rich = 0.6, minimal = 0.4)
   - Downloads (logarithmic scale, max 0.3)
   - GitHub stars (logarithmic scale, max 0.1)
4. Updates `npmDownloadsLastMonth` and `qualityScore` fields

**Quality Score Formula:**
```typescript
function calculateQualityScore(params: {
  tier: string;
  downloads: number;
  githubStars: number;
}): number {
  const tierScore = tier === 'rich' ? 0.6 : 0.4;
  const downloadsScore = Math.min(0.3, Math.log10(downloads + 1) / 10);
  const starsScore = Math.min(0.1, Math.log10(githubStars + 1) / 10);
  return Math.min(1.0, tierScore + downloadsScore + starsScore);
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "processed": 25,
    "skipped": 0,
    "errors": 0,
    "totalTools": 25,
    "durationMs": 8234
  }
}
```

### Automated Sync Configuration

The sync system can run via two methods:

#### Option 1: Vercel Cron (Primary)

Cron jobs are configured in `vercel.json` at the repository root:

```json
{
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

**Pros:**
- Native Vercel integration
- Automatic authentication with `CRON_SECRET`
- Same infrastructure as the app
- No setup required (works automatically on deploy)

#### Option 2: GitHub Actions (Backup)

A GitHub Actions workflow (`.github/workflows/sync.yml`) provides redundancy:

```yaml
name: NPM Package Sync

on:
  schedule:
    - cron: '*/2 * * * *'   # Changes feed
    - cron: '*/15 * * * *'  # Keyword search
    - cron: '0 * * * *'     # Metrics
  workflow_dispatch:        # Manual trigger
```

**Pros:**
- Redundancy if Vercel Cron fails
- Manual trigger via GitHub UI
- Free on GitHub (included in free tier)
- Runs from GitHub's infrastructure

**Setup:**

1. Add secrets to GitHub repository settings:
   - `VERCEL_PRODUCTION_URL` - Your production URL (e.g., `https://tpmjs.com`)
   - `CRON_SECRET` - Same secret used in Vercel environment variables

2. Enable GitHub Actions in repository settings

3. The workflow will run automatically on schedule OR manually via:
   - GitHub Actions tab → NPM Package Sync → Run workflow → Select sync type

**Schedule Breakdown:**
- Changes feed: Every 2 minutes (30 times per hour)
- Keyword search: Every 15 minutes (4 times per hour)
- Metrics: Every hour (once per hour)

**Recommendation:** Use Vercel Cron as primary and GitHub Actions as backup. Both can run simultaneously - the sync endpoints are idempotent.

### Database Schema

The sync system uses these Prisma models:

**`Tool` - The main tool registry:**
```prisma
model Tool {
  id                   String   @id @default(cuid())
  npmPackageName       String   @unique
  npmVersion           String
  npmDownloadsLastMonth Int     @default(0)
  qualityScore         Float?
  discoveryMethod      String   // 'changes-feed' | 'keyword'
  tier                 String   // 'minimal' | 'rich'
  // ... other fields

  @@index([qualityScore])
  @@index([npmDownloadsLastMonth])
}
```

**`SyncCheckpoint` - Tracks sync progress:**
```prisma
model SyncCheckpoint {
  id         String @id @default(cuid())
  source     String @unique // 'changes-feed' | 'keyword-search' | 'metrics'
  checkpoint Json   // { lastSeq: string, lastRun: string, ... }
}
```

**`SyncLog` - Records all sync operations:**
```prisma
model SyncLog {
  id        String   @id @default(cuid())
  source    String
  status    String   // 'success' | 'partial' | 'error'
  processed Int
  skipped   Int
  errors    Int
  message   String?
  metadata  Json?
  createdAt DateTime @default(now())
}
```

### Manual Sync Triggers

To manually trigger a sync (useful for testing or debugging):

```bash
# Trigger changes feed sync
curl -X POST https://tpmjs.com/api/sync/changes \
  -H "Authorization: Bearer $CRON_SECRET"

# Trigger keyword search
curl -X POST https://tpmjs.com/api/sync/keyword \
  -H "Authorization: Bearer $CRON_SECRET"

# Trigger metrics update
curl -X POST https://tpmjs.com/api/sync/metrics \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Note:** You need the `CRON_SECRET` environment variable set in Vercel. The endpoints return 401 Unauthorized without it.

### Monitoring Sync Health

Check sync logs in the database:

```typescript
// Get recent sync operations
const recentSyncs = await prisma.syncLog.findMany({
  orderBy: { createdAt: 'desc' },
  take: 20,
});

// Check last successful sync for each source
const checkpoints = await prisma.syncCheckpoint.findMany();
```

**Sync Log Example:**
```json
{
  "id": "clx...",
  "source": "changes-feed",
  "status": "success",
  "processed": 5,
  "skipped": 93,
  "errors": 0,
  "message": "Successfully processed 5 packages",
  "metadata": {
    "durationMs": 2834,
    "lastSeq": "12345678",
    "pending": 1250
  },
  "createdAt": "2025-11-30T12:00:00Z"
}
```

### Error Handling

All sync endpoints follow this error handling pattern:

1. **Partial Success:** If some packages fail but others succeed, status is `partial`
2. **Complete Failure:** If the entire sync fails, status is `error`
3. **Error Messages:** First 3 errors are included in the response
4. **Logging:** All operations are logged to `syncLog` regardless of success

**Example Partial Failure:**
```json
{
  "success": true,
  "data": {
    "processed": 5,
    "skipped": 2,
    "errors": 3,
    "durationMs": 5234
  }
}
```

The sync log will contain:
```json
{
  "status": "partial",
  "message": "Processed with errors: Failed to process pkg1: Network timeout; Failed to process pkg2: Invalid tpmjs field; ..."
}
```

### Configuration

Required environment variables in Vercel:

```bash
# Database connection
DATABASE_URL="postgresql://..."

# Cron job authentication
CRON_SECRET="your-secret-key"
```

**Important:** Vercel Cron automatically adds the `Authorization: Bearer $CRON_SECRET` header when calling the endpoints. No manual configuration needed.

### Performance Considerations

**Timeouts:**
- All sync routes have `maxDuration: 300` (5 minutes)
- Changes feed processes max 100 packages per run to avoid timeouts
- Keyword search processes max 250 packages per run
- Metrics sync processes all tools but runs only once per hour

**Rate Limiting:**
- npm API has rate limits - be cautious when testing manually
- Vercel Cron jobs run from Vercel's infrastructure (different IP than dev)
- Consider implementing exponential backoff for npm API errors

**Cold Starts:**
- First request to each sync endpoint may be slow due to Prisma initialization
- Subsequent requests are faster with warm Prisma Client
- This is acceptable for background cron jobs

### Debugging Sync Issues

**Check if cron jobs are running:**

```bash
# View recent deployments
vercel ls

# Check logs for a specific deployment
vercel logs <deployment-url>

# Filter for sync-related logs
vercel logs <deployment-url> | grep sync
```

**Common issues:**

1. **"Unauthorized" errors:** Check that `CRON_SECRET` is set in Vercel environment variables
2. **Timeouts:** Reduce batch size in changes feed (currently 100)
3. **Missing packages:** Check `syncLog` for errors during processing
4. **Stale data:** Verify metrics sync is running every hour

**Test sync locally:**

```bash
# Start dev server
pnpm dev --filter=@tpmjs/web

# Trigger sync (requires CRON_SECRET in .env.local)
curl -X POST http://localhost:3000/api/sync/changes \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Package Discovery Flow

Here's how a new TPMJS tool gets discovered:

1. **Developer publishes package to npm** with `tpmjs-tool` keyword and `tpmjs` field in package.json
2. **Within 2 minutes:** Changes feed sync picks it up from npm's `/_changes` endpoint
3. **Validation:** `validateTpmjsField()` checks that the `tpmjs` field meets requirements
4. **Database Insert:** Tool is upserted with initial data
5. **Within 1 hour:** Metrics sync updates download stats and calculates quality score
6. **Visible on tpmjs.com:** Tool appears in search results and category pages

**Backup Discovery:** If changes feed misses a package, the keyword search (every 15 minutes) will catch it.

### Future Improvements

Potential enhancements to the sync system:

- [ ] Add webhook endpoint for instant npm package notifications
- [ ] Implement exponential backoff for npm API rate limits
- [ ] Add Slack/Discord notifications for sync failures
- [ ] Create admin dashboard to monitor sync health
- [ ] Support GitHub stars syncing (requires GitHub API integration)
- [ ] Add sync metrics to Vercel Analytics
- [ ] Implement differential sync to reduce database writes