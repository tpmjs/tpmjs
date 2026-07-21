# Tool health system

TPMJS health answers two different questions for every active tool:

1. **Import health:** can the pinned package version be loaded and can the named
   export be described?
2. **Execution health:** can that export be invoked through the production Deno
   executor boundary?

Each dimension is `UNKNOWN`, `HEALTHY`, or `BROKEN`. `UNKNOWN` is not a softer
form of `BROKEN`: it means the observation did not establish anything about the
tool. Transport failures, executor failures, malformed protocol responses, and
credential-free checks of configuration-dependent factories are all
indeterminate.

The central invariant is:

> Health decisions use the typed executor protocol. Human-readable error text
> is retained for operators, but is never parsed, matched, or classified.

## Current architecture

```text
package metadata
    │  sync + Zod validation
    ▼
tools.health_check_config
    │
    │                         ┌──────────────────────────────┐
systemd maintenance timer ──▶ │ POST /api/sync/health-check │
                              └──────────────┬───────────────┘
                                             │ lease a finite due slice
                                             ▼
                              ┌──────────────────────────────┐
                              │ TPMJS Deno executor          │
                              │ /load-and-describe           │
                              │ /execute-tool                │
                              └──────────────┬───────────────┘
                                             │ protocol 1.1 typed result
                                             ▼
                              ┌──────────────────────────────┐
                              │ health verdict policy        │
                              └──────────────┬───────────────┘
                                             │ one DB transaction
                                             ▼
                              current status + audit row
                              + next due time + lease release

ordinary executor calls ──▶ POST /api/tools/report-health
                              │ typed observation only
                              ▼
                         current execution status
```

The executor is hosted on the TPMJS box under Podman/systemd. Some paths,
service names, and environment variables still contain the legacy word
`railway` for compatibility; they do not describe the deployment platform.

The implementation lives in:

- `packages/types/src/executor.ts` — protocol schemas and failure taxonomy.
- `apps/railway-executor/server.ts` — the production Deno executor.
- `apps/web/src/lib/health-check/executor-health-verdict.ts` — the only verdict
  mapping.
- `apps/web/src/lib/health-check/health-check-service.ts` — import, execution,
  cleanup, and persistence.
- `apps/web/src/lib/maintenance/bounded-work.ts` — due times, leases, and work
  bounds.
- `apps/web/src/app/api/sync/health-check/route.ts` — scheduled bounded slice.
- `apps/web/src/app/api/tools/report-health/route.ts` — typed observations from
  ordinary executions.

## Executor protocol 1.1

A compliant production executor exposes:

- `GET /health`
- `POST /load-and-describe`
- `POST /execute-tool`

`GET /health` must report `protocolVersion: "1.1"` and an
`implementationVersion` matching the deployed Git revision. The deployment
workflow verifies both values before activation.

Successful execution has this shape:

```json
{
  "success": true,
  "output": { "text": "hello world" },
  "executionTimeMs": 42
}
```

Failure is a strict discriminated contract:

```json
{
  "success": false,
  "error": "Tool not found",
  "errorStage": "load",
  "errorCode": "TOOL_NOT_FOUND",
  "retryable": false,
  "executionTimeMs": 0
}
```

The schemas reject missing stage/code/retry metadata and impossible
stage/code combinations. `error` is operator-facing prose only.

### Failure stages

| Stage | Boundary described |
| --- | --- |
| `request` | The caller sent an invalid or unauthenticated request. |
| `load` | The package, export, factory, or schema could not be loaded. |
| `execute` | A callable tool was invoked and returned or threw an error. |
| `executor` | The executor itself was unavailable or failed internally. |

### Stable error codes

| Stage | Codes |
| --- | --- |
| `request` | `INVALID_REQUEST`, `AUTHENTICATION_REQUIRED` |
| `load` | `PACKAGE_IMPORT_FAILED`, `TOOL_NOT_FOUND`, `TOOL_CONFIGURATION_REQUIRED`, `INVALID_TOOL`, `SCHEMA_UNAVAILABLE` |
| `execute` | `TOOL_EXECUTION_FAILED`, `EXECUTION_TIMEOUT` |
| `executor` | `EXECUTOR_UNAVAILABLE`, `EXECUTOR_INTERNAL_ERROR` |

Add a new code only when it represents a durable machine-readable distinction,
then extend the shared Zod schema, executor, verdict policy, and tests together.
Never add a regex or provider-message lookup table.

## Verdict policy

The policy is intentionally conservative:

| Observation | Verdict | Reason |
| --- | --- | --- |
| Import or execution succeeds | `HEALTHY` | The checked boundary was proven. |
| Deterministic non-retryable `load` failure | `BROKEN` | The pinned package/export cannot satisfy the registry contract. |
| `TOOL_CONFIGURATION_REQUIRED` | `UNKNOWN` | The credential-free sweep cannot evaluate the configured factory. |
| Retryable `load` failure | `UNKNOWN` | A transient import dependency must not condemn the tool. |
| `TOOL_EXECUTION_FAILED` | `HEALTHY` | Invocation proves the package loaded and exposed a callable tool; input, credentials, or a downstream API may have rejected the call. |
| `EXECUTION_TIMEOUT` | `UNKNOWN` | The timeout does not identify whether the tool or infrastructure was responsible. |
| Any `request` or `executor` failure | `UNKNOWN` | The observation describes the caller or executor, not the tool. |
| Transport exception or invalid protocol payload | `UNKNOWN` | No trustworthy tool-level observation exists. |

A full check is `BROKEN` if either dimension is definitively broken, `HEALTHY`
only if both are healthy, and otherwise `UNKNOWN`.

An `UNKNOWN` observation never overwrites a prior definitive tool status. It is
still written to the full-check audit history so operators can distinguish
"last known state" from "latest observation."

## Author-declared health checks

Package authors may place a `healthCheck` contract on a tool definition. The
contract is Zod-validated during sync and validated again when read from the
database.

```json
{
  "name": "createThing",
  "healthCheck": {
    "testParams": {
      "name": "tpmjs-health-{{timestamp}}"
    },
    "cleanup": [
      {
        "tool": "deleteThing",
        "mapping": {
          "id": "id"
        }
      }
    ]
  }
}
```

The supported fields are:

- `skipExecution`: import and describe the tool without invoking it. This
  cannot be combined with test parameters or cleanup.
- `testParams`: known-safe parameters. String values may contain the tiny
  `{{timestamp}}` template.
- `cleanup`: at most three ordered, best-effort calls to exports from the same
  package. A step may contain literal `params` and may map cleanup parameters
  from dot-separated paths in the checked tool's output.

Cleanup limits side effects; it does not prove that an execution is safe and it
does not rewrite the verdict if cleanup fails. `skipExecution` is the only
declaration that guarantees the scheduled check will not call the tool.

If no explicit `testParams` exist, the checker derives a minimal value for each
required parameter. JSON Schema defaults and enum members are preferred before
type-based fallback values.

Scheduled checks never send package environment descriptors as credentials.
The executor receives an empty environment map. A tool that genuinely needs
configuration should return the typed `TOOL_CONFIGURATION_REQUIRED` boundary
and remain `UNKNOWN` under the registry sweep.

## Scheduling and concurrency

Health maintenance is a bounded queue, not a daily full-registry sweep.

- `tpmjs-health-maintenance.timer` requests a slice every five minutes with
  small randomized delay.
- The production request uses `limit=20`; the route hard-caps any request at
  100 tools.
- Due rows are claimed with `FOR UPDATE SKIP LOCKED` and a 20-minute expiring
  lease, so workers may run concurrently without duplicate ownership.
- One slice runs batches of five with a brief delay between batches.
- The audit row, current status, next due time, and lease release commit in one
  transaction. A worker that lost its lease cannot publish stale state.

The next due time is deterministic per tool with stable jitter:

| Latest full-check verdict | Base interval | Jitter window |
| --- | ---: | ---: |
| `HEALTHY` | 7 days | 12 hours |
| `BROKEN` | 1 day | 6 hours |
| `UNKNOWN` | 15 minutes | 15 minutes |

Worker exceptions release the lease and schedule a retry after roughly 30–45
minutes. New or materially changed tools are made due immediately by the sync
lifecycle.

## Persistence model

`tools` carries the current operational projection:

- `import_health`
- `execution_health`
- `health_check_error`
- `last_health_check`
- `health_check_next_at`
- `health_check_lease_until`
- `health_check_leased_by`
- consecutive import-failure visibility fields

`health_checks` is the append-only audit history for full checks. It stores the
trigger source, both observations, both timings, generated test parameters,
overall verdict, errors, and timestamp.

The passive `/api/tools/report-health` path validates the same typed failure
contract and updates the current execution projection. It is intentionally
non-blocking from the executor's perspective, so failure to report health never
changes the result of a user's tool call.

## Manual checks

A manual full check is a `POST` to the tool's canonical API path:

```bash
curl --fail-with-body --request POST \
  'https://tpmjs.com/api/tools/@tpmjs/tools-normalize-whitespace/normalizeWhitespaceTool'
```

Manual checks have a five-minute per-tool cooldown. The response contains
separate import, execution, and overall verdicts with timings.

## Production verification

Verify deployed provenance and both service boundaries without changing state:

```bash
scripts/deploy-on-box.sh verify
```

Inspect the bounded scheduler:

```bash
sudo systemctl status tpmjs-health-maintenance.timer
sudo journalctl -u tpmjs-health-maintenance.service -n 50 --no-pager
```

Inspect recent full-check evidence:

```sql
SELECT
  p.npm_package_name,
  t.name,
  h.trigger_source,
  h.import_status,
  h.execution_status,
  h.overall_status,
  h.import_error,
  h.execution_error,
  h.created_at
FROM health_checks AS h
JOIN tools AS t ON t.id = h.tool_id
JOIN packages AS p ON p.id = t.package_id
ORDER BY h.created_at DESC
LIMIT 50;
```

## Debugging rules

When a tool appears broken:

1. Read the latest `health_checks` row and compare it with the current `tools`
   projection.
2. Inspect `errorStage`, `errorCode`, and `retryable` at the executor boundary.
3. Reproduce the pinned package version and named export, not `latest`.
4. Trigger one manual check after the cooldown.
5. If the observation is `UNKNOWN`, investigate executor transport, protocol,
   capacity, or missing author configuration before changing the tool.

Do not:

- classify by exception wording;
- add error-message regexes or string lists;
- turn timeouts or malformed executor responses into tool breakage;
- overwrite a definitive status with infrastructure uncertainty;
- run an unbounded all-tools sweep;
- bypass the shared schemas at an executor or persistence boundary;
- manually edit current health without preserving the reason and evidence.

The correct fix for a new failure mode is a better typed boundary, a better
author health contract, or a better executor observation—not another prose
heuristic.
