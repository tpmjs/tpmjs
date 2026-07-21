# REST surface — `POST /api/registry/execute`

Run any registry tool over plain HTTP. This is the primary execution endpoint for external agents and
any client that can make a POST request. No SDK, no install.

- **Endpoint:** `POST https://tpmjs.com/api/registry/execute`
- **Auth:** optional. Unauthenticated is rate‑limited to 100 executions/hour (IP‑based). Add
  `Authorization: Bearer <TPMJS_API_KEY>` for higher, tier‑based limits.
- **Body:** `{ "toolId": "package::exportName", "params": { ... }, "env": { ... } }`
  - `toolId` — required, in the form `@scope/package::exportName`.
  - `params` — the tool's input object.
  - `env` — optional API keys the tool needs (not required for this key‑free tool).

## Run it with `curl`

```bash
curl -s -X POST https://tpmjs.com/api/registry/execute \
  -H 'Content-Type: application/json' \
  -d '{
    "toolId": "@tpmjs/official-base64-encode::base64EncodeTool",
    "params": { "data": "Hello, TPMJS!" }
  }'
```

### Expected response

Verified against the live endpoint on 2026‑07‑21 (`executionTimeMs` will vary):

```json
{
  "success": true,
  "toolId": "@tpmjs/official-base64-encode::base64EncodeTool",
  "result": { "base64": "SGVsbG8sIFRQTUpTIQ==", "byteLength": 13 },
  "executionTimeMs": 1129,
  "meta": {
    "package": "@tpmjs/official-base64-encode",
    "version": "0.1.1",
    "authenticated": false
  }
}
```

On failure the response is `{ "success": false, "toolId": ..., "error": { "code", "message" }, ... }`
with a 4xx/5xx status.

## Run it with `fetch` (Node 18+)

No dependencies — Node 18+ ships a global `fetch`:

```bash
node execute.mjs
```

See [`execute.mjs`](./execute.mjs).

## Notes

- To pass API keys for tools that need them, add an `env` object, e.g.
  `"env": { "FIRECRAWL_API_KEY": "fc-..." }`. Keys are injected into the sandbox per request and never
  stored.
- Endpoint source of truth: [`apps/web/src/app/api/registry/execute/route.ts`](../../apps/web/src/app/api/registry/execute/route.ts).
