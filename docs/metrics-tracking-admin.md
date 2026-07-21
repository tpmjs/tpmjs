# Metrics, Tracking & Admin Dashboard

## What Changed

This release adds comprehensive metrics tracking, search analytics, cleanup automation, and a full admin dashboard.

### New Database Models & Fields

| Change | Location |
|--------|----------|
| `SearchLog` model | `packages/db/prisma/schema.prisma` |
| `UserRole` enum (`USER`, `ADMIN`) | `packages/db/prisma/schema.prisma` |
| `User.role` field | `packages/db/prisma/schema.prisma` |
| `User.signupSource` field | `packages/db/prisma/schema.prisma` |
| `StatsSnapshot` new fields: `dauCount`, `wauCount`, `mauCount`, `searchCount`, `avgSearchLatencyMs`, `topSearchQueries`, `mcpUniqueClients` | `packages/db/prisma/schema.prisma` |

### New Files

| File | Purpose |
|------|---------|
| `apps/web/src/lib/tracking/search.ts` | Fire-and-forget search query tracking + cleanup function |
| `apps/web/src/lib/admin.ts` | `isAdmin()` and `requireAdmin()` helpers |
| `apps/web/src/app/api/admin/stats/route.ts` | Admin stats API (latest snapshot + 30-day trends) |
| `apps/web/src/app/api/admin/users/route.ts` | Admin user list API (paginated, searchable) |
| `apps/web/src/app/api/admin/search-logs/route.ts` | Admin search analytics API |
| `apps/web/src/app/api/sync/cleanup-executions/route.ts` | Cron: cleanup execution events >90d |
| `apps/web/src/app/api/sync/cleanup-api-usage/route.ts` | Cron: cleanup API usage records >30d |
| `apps/web/src/app/api/sync/cleanup-search-logs/route.ts` | Cron: cleanup search logs >90d |
| `apps/web/src/app/dashboard/admin/page.tsx` | Admin overview dashboard page |
| `apps/web/src/app/dashboard/admin/users/page.tsx` | Admin user management page |

### Modified Files

| File | What Changed |
|------|-------------|
| `apps/web/src/app/api/tools/search/route.ts` | Added search tracking with latency measurement |
| `apps/web/src/app/api/sync/stats-snapshot/route.ts` | Added DAU/WAU/MAU, search metrics, MCP client queries |
| `apps/web/src/components/dashboard/DashboardLayout.tsx` | Added conditional Admin nav section in sidebar |
| `apps/web/src/lib/auth.ts` | Added `databaseHooks` to track signup source on user creation |
| `apps/web/src/app/api/activity/public/route.ts` | Added more event types to public activity feed |
| Scheduled cleanup jobs | Added three authenticated cleanup schedules (now run by self-hosted automation) |

---

## How To Use

### Promote a User to Admin

```sql
-- Connect to the database
psql "$DATABASE_URL"

-- Or via Prisma Studio
pnpm --filter=@tpmjs/db db:studio

-- Promote by email
UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com';
```

Once promoted, the "Admin" section appears in the dashboard sidebar at `/dashboard/admin`.

### Admin Dashboard

- **Overview**: `/dashboard/admin` -- Key metrics (users, DAU/WAU/MAU), registry stats, activity stats, health status, 30-day trend charts, top search queries
- **Users**: `/dashboard/admin/users` -- Searchable paginated table with user details, roles, tiers, signup sources, and activity counts

### Admin API Routes

All require an authenticated session with `role = ADMIN`.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/stats` | GET | Latest stats snapshot + 30-day trend + total users/sessions |
| `/api/admin/users` | GET | Paginated user list. Params: `page`, `limit`, `search`, `sortBy`, `sortOrder` |
| `/api/admin/search-logs` | GET | Recent searches, top queries, daily volume chart data |

### Search Tracking

Every search query to `/api/tools/search` is now tracked with:
- Query text (truncated to 500 chars)
- Result count
- Latency in ms

Tracking is fire-and-forget -- never blocks the response. Logs are in the `search_logs` table.

### Stats Snapshot Enhancements

The daily stats snapshot (`/api/sync/stats-snapshot`) now captures:
- **DAU/WAU/MAU** -- distinct active users for 1d/7d/30d from `UserActivity`
- **Search volume** -- count, average latency, top 10 queries
- **MCP unique clients** -- distinct sessions from execution events in last 7d

### Cleanup Crons

Three new daily crons keep the database tidy:

| Cron | Schedule | Retention |
|------|----------|-----------|
| `/api/sync/cleanup-executions` | 3:15 UTC daily | 90 days |
| `/api/sync/cleanup-api-usage` | 3:30 UTC daily | 30 days |
| `/api/sync/cleanup-search-logs` | 3:45 UTC daily | 90 days |

**Manual trigger** (from repo root):
```bash
source .env.local
curl -X POST https://tpmjs.com/api/sync/cleanup-executions -H "Authorization: Bearer $CRON_SECRET"
curl -X POST https://tpmjs.com/api/sync/cleanup-api-usage -H "Authorization: Bearer $CRON_SECRET"
curl -X POST https://tpmjs.com/api/sync/cleanup-search-logs -H "Authorization: Bearer $CRON_SECRET"
```

### Signup Source Tracking

New users automatically get their `signupSource` field set based on the auth provider used (e.g., `credential`, `github`, `google`). This is set via a `databaseHooks.user.create.after` hook in `apps/web/src/lib/auth.ts`.

### Public Activity Feed

The public activity feed (`/api/activity/public`) now includes:
- `TOOL_EXECUTED`
- `COLLECTION_TOOLS_BULK_ADDED`
- `AGENT_CONVERSATION_STARTED`

---

## Architecture Notes

- **No migration files** -- this project uses `pnpm --filter=@tpmjs/db db:push` for schema changes (no Prisma migration history)
- **Admin check in sidebar** -- `DashboardLayout` makes a lightweight `fetch('/api/admin/stats')` to check if the user is admin, avoiding the need to extend the better-auth session type
- **Admin auth pattern** -- API routes call `requireAdmin()` which throws `Response` objects (caught by Next.js) for 401/403
- **Search tracking pattern** -- follows the fire-and-forget pattern from `apps/web/src/lib/tracking/executions.ts`
- **Cleanup cron pattern** -- follows the pattern from `apps/web/src/app/api/sync/cleanup-activity/route.ts` with `SyncLog` + `SyncCheckpoint`
