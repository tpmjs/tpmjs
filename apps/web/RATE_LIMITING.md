# API Rate Limiting

This document describes the rate limiting implementation for TPMJS.com's public API endpoints.

## Overview

Rate limiting has been implemented to protect the API from abuse and ensure fair usage across all clients. The implementation uses an in-memory sliding window algorithm suitable for Vercel's serverless architecture.

## Configuration

### Rate Limit Tiers

Two rate limit configurations are available:

**Default Rate Limit** (100 requests/minute):
```typescript
import { checkRateLimit } from '~/lib/rate-limit';

export async function GET(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  // ... rest of handler
}
```

**Strict Rate Limit** (20 requests/minute):
```typescript
import { checkRateLimit, STRICT_RATE_LIMIT } from '~/lib/rate-limit';

export async function GET(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request, STRICT_RATE_LIMIT);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  // ... rest of handler
}
```

### Custom Rate Limits

You can define custom rate limits:

```typescript
import { checkRateLimit, type RateLimitConfig } from '~/lib/rate-limit';

const customLimit: RateLimitConfig = {
  limit: 50,          // 50 requests
  windowSeconds: 60,  // per minute
};

const rateLimitResponse = checkRateLimit(request, customLimit);
```

## Protected Endpoints

### Default Rate Limit (100 req/min)

- `GET /api/health` - Health check endpoint
- `GET /api/tools` - List and filter tools
- `GET /api/tools/[...slug]` - Get specific tool/package details
- `POST /api/tools/[...slug]` - Trigger manual health check
- `GET /api/tools/broken` - List broken tools
- `GET /api/stats` - Get registry statistics
- `POST /api/tools/validate` - Validate tpmjs field
- `POST /api/tools/report-health` - Report tool execution results

### Strict Rate Limit (20 req/min)

- `GET /api/tools/search` - Expensive BM25 search operations

### Exempt from Rate Limiting

Cron jobs are automatically exempt when authenticated with `CRON_SECRET`:

- `POST /api/sync/changes` - NPM changes feed sync
- `POST /api/sync/keyword` - NPM keyword search sync
- `POST /api/sync/metrics` - Download stats and quality score updates

## How It Works

### IP-Based Tracking

Rate limits are tracked per client IP address using the following header priority:

1. `x-forwarded-for` (set by Vercel)
2. `x-real-ip`
3. Fallback to 'unknown' if neither is available

### Sliding Window Algorithm

The implementation uses a sliding window counter:

1. Each request timestamp is stored in memory
2. On each request, timestamps older than the window are removed
3. If remaining timestamps exceed the limit, request is rejected
4. Otherwise, current timestamp is added and request proceeds

### Memory Management

To prevent memory leaks in long-running serverless instances:

- Automatic cleanup runs every 5 minutes
- Entries older than 1 minute are removed
- Store size is capped at 10,000 entries
- If cap is exceeded, oldest 20% of entries are removed

### Cron Job Bypass

Requests with valid `Authorization: Bearer <CRON_SECRET>` header bypass rate limiting entirely. This is checked at the start of `checkRateLimit()`:

```typescript
const authHeader = request.headers.get('authorization');
const token = authHeader?.replace('Bearer ', '');
if (env.CRON_SECRET && token === env.CRON_SECRET) {
  return null; // Allow cron jobs to bypass
}
```

## Response Format

When rate limited, endpoints return HTTP 429 with the following format:

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

### Response Headers

Rate-limited responses include these headers:

- `Retry-After`: Seconds until rate limit resets
- `X-RateLimit-Limit`: Maximum requests allowed in window
- `X-RateLimit-Remaining`: Requests remaining (always 0 when rate limited)
- `X-RateLimit-Reset`: Unix timestamp when rate limit resets

## Testing Rate Limits

### Manual Testing

Test rate limiting with curl:

```bash
# Test basic rate limit
for i in {1..105}; do
  curl -i http://localhost:3000/api/health
  sleep 0.1
done

# Should see 429 responses after request 100
```

### Check Rate Limit Status

For debugging, you can check rate limit status (not exposed as public API):

```typescript
import { getRateLimitStatus } from '~/lib/rate-limit';

const status = getRateLimitStatus(request);
console.log({
  clientId: status.clientId,
  used: status.used,
  remaining: status.remaining,
  resetAt: status.resetAt,
});
```

## Limitations

### Serverless Architecture Considerations

1. **Per-Instance State**: Rate limits are tracked per serverless instance, not globally
   - Multiple concurrent instances don't share state
   - Under high load, effective rate limit may be higher than configured
   - For production-grade global rate limiting, consider Upstash Redis or Vercel KV

2. **Cold Starts**: Rate limit state is lost when serverless instance scales down
   - This is acceptable for moderate traffic
   - Persistent storage would be needed for strict enforcement

3. **IP Spoofing**: Relies on headers set by Vercel
   - Headers cannot be spoofed by clients (Vercel sets them)
   - But multiple users behind same NAT share one IP and one rate limit

## Production Recommendations

For high-traffic production use, consider upgrading to a distributed solution:

### Option 1: Upstash Redis

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
});

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }
  // ... rest of handler
}
```

### Option 2: Vercel KV

```typescript
import { kv } from '@vercel/kv';

async function checkRateLimit(ip: string) {
  const key = `ratelimit:${ip}`;
  const count = await kv.incr(key);

  if (count === 1) {
    await kv.expire(key, 60); // 1 minute window
  }

  return count <= 100;
}
```

## Monitoring

### Vercel Logs

Rate limit events are logged automatically. Monitor with:

```bash
vercel logs <deployment-url> | grep "Rate limit"
```

### Analytics

Consider adding analytics to track:

- Rate limit hit rate
- Most rate-limited IPs
- Rate limit effectiveness

Example implementation:

```typescript
if (entry.timestamps.length >= config.limit) {
  console.log(`[Rate Limit] Blocked request from ${clientId} (${entry.timestamps.length}/${config.limit})`);

  // Optional: Send to analytics
  // await analytics.track('rate_limit_exceeded', {
  //   ip: clientId,
  //   endpoint: request.url,
  //   limit: config.limit,
  // });
}
```

## Future Improvements

Potential enhancements:

- [ ] Add rate limit status endpoint for debugging (`GET /api/rate-limit/status`)
- [ ] Implement user-based rate limiting (for authenticated requests)
- [ ] Add configurable rate limits per endpoint via environment variables
- [ ] Implement exponential backoff suggestions in error messages
- [ ] Add Prometheus metrics for rate limit monitoring
- [ ] Support for allowlisting trusted IPs
- [ ] Implement burst allowance (e.g., allow 120 req/min with 100 sustained)

## Troubleshooting

### "Rate limit exceeded" for legitimate traffic

If users report false positives:

1. Check if multiple users are behind same NAT/proxy
2. Consider increasing limits for that endpoint
3. Implement user authentication to enable per-user limits
4. Use distributed rate limiting (Upstash/KV) for accurate counts

### Rate limiting not working

1. Verify `checkRateLimit()` is called before request processing
2. Check that Vercel is setting `x-forwarded-for` header
3. Ensure serverless instances are staying warm (check Vercel logs)
4. Test with unique IP addresses (use different VPN endpoints)

### Cron jobs being rate limited

1. Verify `CRON_SECRET` is set in Vercel environment variables
2. Check that cron requests include `Authorization: Bearer <CRON_SECRET>` header
3. Vercel Cron automatically adds this header - manual testing requires adding it

```bash
# Test cron endpoint with auth
curl -X POST https://tpmjs.com/api/sync/changes \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Security Considerations

1. **DDoS Protection**: This rate limiter provides basic protection but is not a substitute for proper DDoS mitigation (use Cloudflare, Vercel's built-in protection, etc.)

2. **IP Spoofing**: Cannot spoof `x-forwarded-for` header - Vercel controls it

3. **Bypass Attempts**: Rate limit is enforced server-side, cannot be bypassed by clients

4. **CRON_SECRET**: Keep this secret secure - anyone with it can bypass rate limits

## Related Files

- `/apps/web/src/lib/rate-limit.ts` - Core rate limiting implementation
- `/apps/web/src/env.ts` - Environment configuration (CRON_SECRET)
- `/apps/web/src/app/api/**/*.ts` - Protected API endpoints

## References

- [Vercel Edge Network Headers](https://vercel.com/docs/edge-network/headers)
- [Upstash Rate Limiting](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview)
- [Rate Limiting Algorithms](https://en.wikipedia.org/wiki/Rate_limiting)
