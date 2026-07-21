# TPMJS Dynamic Executor

The production TPMJS executor dynamically loads exact npm package versions and
invokes AI SDK tools. Despite the historical directory name, it is built and
run on the TPMJS host as a Podman service; it is not deployed on Railway or
Vercel.

`server.ts` is the only implementation. The image build runs `deno check`
before producing an artifact, so the same source that CI checks is the source
the container executes.

## Protocol

All endpoints except `GET /health` require
`Authorization: Bearer $EXECUTOR_API_KEY`.

### `POST /load-and-describe`

```json
{
  "packageName": "@tpmjs/tools-normalize-whitespace",
  "name": "normalizeWhitespaceTool",
  "version": "0.2.0",
  "env": {}
}
```

### `POST /execute-tool`

```json
{
  "packageName": "@tpmjs/tools-normalize-whitespace",
  "name": "normalizeWhitespaceTool",
  "version": "0.2.0",
  "params": { "text": "hello   world" },
  "env": {}
}
```

Successful executions return `success`, `output`, and `executionTimeMs`.
Failures retain a human-readable `error` for operators and always include the
machine-readable fields below:

```json
{
  "success": false,
  "error": "Tool not found",
  "errorStage": "load",
  "errorCode": "TOOL_NOT_FOUND",
  "retryable": false,
  "executionTimeMs": 42
}
```

Consumers must classify failures using `errorStage`, `errorCode`, and
`retryable`; they must never infer meaning from the wording of `error`. The
canonical Zod contract lives in `@tpmjs/types/executor`.

## Local verification

```bash
podman build -t tpmjs-railway-executor:local apps/railway-executor
podman run --rm -p 3002:3002 \
  -e EXECUTOR_API_KEY=local-test \
  tpmjs-railway-executor:local
curl http://127.0.0.1:3002/health
```

The live unit is `tpmjs-railway-executor.service`; its container binds to
`127.0.0.1:3210` on the host.
