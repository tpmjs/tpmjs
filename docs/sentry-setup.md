# Sentry Setup

Configuration guide for Sentry error monitoring on TPMJS.

## 1. Create Sentry Project

1. Go to [sentry.io](https://sentry.io) and create a new project
2. Select **Next.js** as the platform
3. Note the **DSN** from Project Settings → Client Keys

## 2. Configure Environment Variables

Set these in Vercel (Settings → Environment Variables):

| Variable | Where | Description |
|----------|-------|-------------|
| `SENTRY_DSN` | Server | DSN for server-side error capture |
| `NEXT_PUBLIC_SENTRY_DSN` | Client | DSN for client-side error capture (same value as SENTRY_DSN) |
| `SENTRY_ORG` | Build | Organization slug from your Sentry URL |
| `SENTRY_PROJECT` | Build | Project slug from your Sentry URL |
| `SENTRY_AUTH_TOKEN` | Build | Auth token for source map uploads |

### Getting an Auth Token

1. Go to [sentry.io/settings/auth-tokens/](https://sentry.io/settings/auth-tokens/)
2. Create a new token with scopes: `project:releases`, `org:read`
3. Add to Vercel as `SENTRY_AUTH_TOKEN`

## 3. Install GitHub Integration

1. In Sentry, go to Settings → Integrations → GitHub
2. Install the integration and connect the `tpmjs/tpmjs` repo
3. This enables Sentry to link errors to commits and create issues

## 4. Configure Alert Rules

### New Issue Alert (recommended)

Creates a GitHub issue when Sentry detects a new error:

1. Go to Alerts → Create Alert Rule
2. **Conditions:** "A new issue is created"
3. **Filters:** Event level is `error` or `fatal`
4. **Actions:** Create a GitHub issue
   - Repository: `tpmjs/tpmjs`
   - Assignee: (leave blank for auto-fix)
   - Labels: `auto-fix`, `production-error`
5. **Rate limit:** 1 alert per issue per hour

### Regression Alert

Creates an issue when a previously resolved error comes back:

1. Go to Alerts → Create Alert Rule
2. **Conditions:** "An issue changes state from resolved to unresolved"
3. **Actions:** Create a GitHub issue with same settings as above

## 5. Verify Setup

### Test client-side error capture

Deploy to production, then in the browser console:

```js
throw new Error('Sentry test error');
```

Check Sentry dashboard — the error should appear within seconds.

### Test server-side error capture

Create a test API route or visit a route that throws. Check Sentry for the server-side error with mapped source lines.

### Test the auto-fix flow

1. Create a test issue using the Sentry Auto-Fix template
2. Fill in a real error from Sentry
3. Verify the `claude-auto-fix.yml` workflow triggers
4. Verify Claude posts a comment and creates a PR (or escalates)

## Architecture

```
Browser → sentry.client.config.ts → Sentry (via /monitoring tunnel)
Server  → sentry.server.config.ts → Sentry (direct)
Edge    → sentry.edge.config.ts   → Sentry (direct)

Next.js instrumentation.ts → loads server/edge config at startup
error.tsx                   → captures client-side React errors
global-error.tsx            → captures root layout errors
```

### Tunnel Route

Client events are proxied through `/monitoring` to bypass ad-blockers. This is configured in `next.config.ts` via `tunnelRoute`.

### Sampling Rates

| Runtime | Traces | Replays |
|---------|--------|---------|
| Client | 10% | Error-only |
| Server | 10% | N/A |
| Edge | 5% | N/A |
