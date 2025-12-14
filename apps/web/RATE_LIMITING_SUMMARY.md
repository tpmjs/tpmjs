# Rate Limiting Implementation Summary

## Overview

Added comprehensive rate limiting to all public API endpoints in TPMJS.com to prevent abuse and ensure fair usage.

## Files Created

### `/apps/web/src/lib/rate-limit.ts`
Core rate limiting implementation featuring:
- In-memory sliding window algorithm
- IP-based request tracking
- Automatic memory cleanup (prevents leaks)
- Cron job bypass (authenticated with CRON_SECRET)
- Configurable rate limits
- Proper 429 responses with Retry-After headers

## Files Modified

### Protected Endpoints (Default: 100 req/min)

1. **`/apps/web/src/app/api/health/route.ts`**
   - GET endpoint for health checks

2. **`/apps/web/src/app/api/tools/route.ts`**
   - GET endpoint for listing and filtering tools

3. **`/apps/web/src/app/api/tools/[...slug]/route.ts`**
   - GET endpoint for fetching specific tool/package
   - POST endpoint for triggering health checks

4. **`/apps/web/src/app/api/tools/broken/route.ts`**
   - GET endpoint for listing broken tools

5. **`/apps/web/src/app/api/stats/route.ts`**
   - GET endpoint for registry statistics

6. **`/apps/web/src/app/api/tools/validate/route.ts`**
   - POST endpoint for validating tpmjs fields

7. **`/apps/web/src/app/api/tools/report-health/route.ts`**
   - POST endpoint for reporting tool health

### Protected Endpoints (Strict: 20 req/min)

8. **`/apps/web/src/app/api/tools/search/route.ts`**
   - GET endpoint for BM25 search (expensive operation)
   - Uses STRICT_RATE_LIMIT for lower threshold

### Exempt Endpoints (Cron Jobs)

These endpoints already have CRON_SECRET authentication and bypass rate limiting:
- `/api/sync/changes` - NPM changes feed sync
- `/api/sync/keyword` - NPM keyword search sync
- `/api/sync/metrics` - Download stats updates

### Already Protected

- `/api/tools/execute/[...slug]` - Already has database-backed rate limiting (10 executions/hour)

## Implementation Pattern

All protected endpoints follow this pattern:

```typescript
import { checkRateLimit } from '~/lib/rate-limit';

export async function GET(request: NextRequest) {
  // Check rate limit
  const rateLimitResponse = checkRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // ... rest of endpoint logic
}
```

## Rate Limit Configurations

### DEFAULT_RATE_LIMIT
- **Limit**: 100 requests per minute
- **Use case**: Standard read/write operations
- **Endpoints**: Most public endpoints

### STRICT_RATE_LIMIT
- **Limit**: 20 requests per minute
- **Use case**: Expensive operations (search, analytics)
- **Endpoints**: `/api/tools/search`

## Response Format

When rate limited (HTTP 429):

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again in 45 seconds.",
  "retryAfter": 45,
  "limit": 100,
  "window": 60
}
```

**Headers**:
- `Retry-After`: Seconds until reset
- `X-RateLimit-Limit`: Max requests in window
- `X-RateLimit-Remaining`: Always 0 when rate limited
- `X-RateLimit-Reset`: Unix timestamp of reset time

## Key Features

### 1. IP-Based Tracking
Uses `x-forwarded-for` header (set by Vercel) to identify clients

### 2. Sliding Window Algorithm
Tracks individual request timestamps for accurate rate limiting

### 3. Memory Management
- Automatic cleanup every 5 minutes
- Removes entries older than 1 minute
- Caps store at 10,000 entries
- Evicts oldest 20% when cap exceeded

### 4. Cron Job Bypass
Automatically bypasses rate limiting for requests with valid CRON_SECRET:
```typescript
if (env.CRON_SECRET && token === env.CRON_SECRET) {
  return null; // Allow cron jobs
}
```

### 5. Per-Endpoint Configuration
Different endpoints can use different limits based on operation cost

## Testing

### Manual Testing
```bash
# Test rate limit
for i in {1..105}; do
  curl http://localhost:3000/api/health
done

# Should see 429 after request 100
```

### Verify Cron Jobs Work
```bash
curl -X POST https://tpmjs.com/api/sync/changes \
  -H "Authorization: Bearer $CRON_SECRET"

# Should succeed regardless of rate limits
```

## Architecture Considerations

### Serverless-Friendly
- Works with Vercel's serverless architecture
- No external dependencies (Redis, etc.)
- Minimal performance impact

### Limitations
- **Per-instance state**: Each serverless instance has its own rate limit store
- **Not globally consistent**: Under high load, effective limit may be higher
- **Cold start resets**: State lost when instance scales down

### Production Upgrade Path
For stricter enforcement, consider:
- **Upstash Redis**: Distributed rate limiting with @upstash/ratelimit
- **Vercel KV**: Built-in key-value store for rate limit counters

## Monitoring

Check rate limit logs:
```bash
vercel logs <deployment-url> | grep "Rate limit"
```

## Security

- ✅ Cannot spoof IP headers (Vercel controls them)
- ✅ Server-side enforcement (cannot bypass)
- ✅ Cron jobs properly authenticated
- ✅ Basic DDoS protection (not a substitute for WAF/CDN)

## Documentation

See `/apps/web/RATE_LIMITING.md` for comprehensive documentation including:
- Detailed configuration options
- Troubleshooting guide
- Production upgrade recommendations
- Monitoring and analytics
- Future improvements

## Verification

All changes verified:
- ✅ Type-checking passes (`pnpm type-check`)
- ✅ No new dependencies added
- ✅ Cron jobs unaffected (bypass implemented)
- ✅ Public endpoints protected
- ✅ Proper error responses
- ✅ Memory management implemented

## Next Steps

Optional enhancements:
1. Add rate limit monitoring/analytics
2. Implement per-user rate limits (for authenticated requests)
3. Add allowlist for trusted IPs
4. Upgrade to distributed rate limiting (Upstash/KV) for high traffic
5. Add burst allowance for bursty traffic patterns
