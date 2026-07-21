# API rate limiting

TPMJS protects public API routes with bounded, process-local rate limiters. This
matches the production topology: one self-hosted Next.js process behind
Cloudflare and Caddy. No remote platform service is required.

## Limits

- Default: 1,000 requests per 60 seconds.
- Strict: 200 requests per 60 seconds.
- AI generation: 50 requests per hour.
- API-key limits: an aligned hourly counter using the caller's account tier.
- Authenticated cron requests carrying the configured `CRON_SECRET` bypass the
  IP limiter.

Routes select a policy explicitly:

```typescript
import { STRICT_RATE_LIMIT, checkRateLimit } from '~/lib/rate-limit';

export async function GET(request: NextRequest) {
  const limited = checkRateLimit(request, STRICT_RATE_LIMIT);
  if (limited) return limited;

  // Handle the request.
}
```

`checkRateLimitDistributed` remains as an async-compatible function name for
existing handlers. It intentionally uses the same process-local store.

## Client identity

The limiter uses the first address in `x-forwarded-for`, then `x-real-ip`, then
`unknown`. Cloudflare and Caddy supply the forwarding headers in production.
Clients behind one NAT therefore share a limit.

## Memory bounds

The sliding-window store:

- removes expired timestamps every five minutes;
- holds at most 10,000 client keys;
- evicts the oldest 20% if the cap is exceeded.

The API-key counter performs the same five-minute cleanup and uses the same
10,000-key cap. State resets on an intentional web-process restart. That is an
accepted property of the current single-instance topology.

## Responses

A rejected request returns HTTP 429 with a JSON body and these headers:

- `Retry-After`
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Operations

Inspect limiter messages in the self-hosted service logs:

```bash
sudo podman logs --since 1h tpmjs-web | rg 'Rate Limit'
journalctl -u tpmjs-web --since -1h | rg 'Rate Limit'
```

If TPMJS deliberately moves to multiple web processes, replace this store with
a self-hosted shared counter before scaling out. Do not add a remote dependency
while production remains single-process.

## Related code

- `src/lib/rate-limit.ts` — IP sliding windows.
- `src/lib/api-keys/rate-limit.ts` — tiered API-key counters.
- `src/app/api/tools/route.ts` — bounded five-minute response cache.
