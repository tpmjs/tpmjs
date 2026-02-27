# Comprehensive Test Suite for Sandbox Shell Tools & Executor

## Context

The sandbox system (shell tools + executor logic) was recently built with robustness fixes but has **zero unit tests**. Only one E2E integration test exists. The user wants bulletproof test coverage. This plan adds ~80+ test cases across 2 test suites covering every function, edge case, and error path.

## Current State

- **No unit tests** exist for `packages/tools/official/sandbox-shell/`
- **No unit tests** exist for `apps/web/src/lib/executors/index.ts`
- **One E2E integration test** exists at `apps/web/src/test/integration/sandbox/sandbox-shell-e2e.integration.test.ts`
- Internal helper functions (`resolveSandboxPath`, `truncate`, `collectStream`) are not exported — need to export them for testing

---

## Suite 1: Sandbox Shell Tools Unit Tests

**Location:** `packages/tools/official/sandbox-shell/src/__tests__/`

### Step 1.0: Setup vitest in sandbox-shell package

**Files to modify:**
- `packages/tools/official/sandbox-shell/package.json` — add vitest devDep, test script
- Create `packages/tools/official/sandbox-shell/vitest.config.ts` — simple node config

### Step 1.1: Export internal helpers for testability

**File:** `packages/tools/official/sandbox-shell/src/index.ts`

Export `resolveSandboxPath`, `truncate`, `collectStream` as named exports (they're currently file-scoped functions). This is the minimum change to make them testable.

### Step 1.2: Create Deno mock infrastructure

**File:** `packages/tools/official/sandbox-shell/src/__tests__/deno-mocks.ts`

Since these tools use Deno APIs (Command, readTextFile, writeTextFile, readDir, stat, mkdir, realPath) but tests run in Node/vitest, create a mock setup that:
- Stubs `globalThis.Deno` with vi.fn() mocks for each API
- Provides helper functions to configure mock behavior per test
- Resets all mocks in afterEach

### Step 1.3: Helper function tests

**File:** `packages/tools/official/sandbox-shell/src/__tests__/helpers.test.ts`

**`resolveSandboxPath` (~15 tests):**
- Resolves relative path correctly: `resolveSandboxPath('/work', 'foo.txt')` → `/work/foo.txt`
- Strips leading slashes from relative path
- Handles nested paths: `a/b/c.txt`
- Normalizes double slashes
- Blocks `../` escape: `../../etc/passwd` → throws
- Blocks `../` in the middle: `a/../../b` → throws if escapes
- Allows `../` that stays within workspace: `a/b/../c` → `/work/a/c`
- Empty relative path resolves to workspace root
- Handles workspace dir with trailing slash
- Handles workspace dir without leading slash

**`truncate` (~6 tests):**
- Returns text unchanged when under limit
- Sets truncated=false when under limit
- Truncates at byte limit and appends marker
- Sets truncated=true when over limit
- Handles multi-byte UTF-8 characters
- Handles empty string

**`collectStream` (~6 tests):**
- Collects small stream completely
- Respects maxBytes limit
- Returns empty Uint8Array for empty stream
- Handles multiple chunks
- Stops reading when exceeding maxBytes (OOM protection)
- Handles stream that errors

### Step 1.4: shellExec tool tests

**File:** `packages/tools/official/sandbox-shell/src/__tests__/shell-exec.test.ts`

**~12 tests:**
- Throws when `_sandboxWorkDir` is missing
- Calls `Deno.Command` with correct args (`sh -c <command>`)
- Sets cwd to `_sandboxWorkDir`
- Returns stdout, stderr, exitCode, durationMs
- Truncates stdout at 100KB
- Truncates stderr at 100KB
- Default timeout is 30s
- Respects custom timeout (clamped to 1s–300s range)
- Sets exitCode to 137 and prepends [TIMEOUT] on timeout
- Kills process with SIGTERM then SIGKILL on timeout
- Handles process execution failure (spawn error)
- Sets truncated=true when output is truncated

### Step 1.5: readFile tool tests

**File:** `packages/tools/official/sandbox-shell/src/__tests__/read-file.test.ts`

**~10 tests:**
- Throws when `_sandboxWorkDir` is missing
- Reads file at resolved path
- Returns content, path (original relative), size, truncated
- Truncates at 500KB
- Rejects symlink that escapes workspace
- Allows symlink within workspace
- Ignores realPath error for non-existent file (stat will fail)
- Re-throws sandbox escape error from realPath check
- Blocks path traversal (`../../etc/passwd`)

### Step 1.6: writeFile tool tests

**File:** `packages/tools/official/sandbox-shell/src/__tests__/write-file.test.ts`

**~8 tests:**
- Throws when `_sandboxWorkDir` is missing
- Writes content to resolved path
- Creates parent directories when createDirs=true (default)
- Skips mkdir when createDirs=false
- Returns success, path, bytesWritten
- Calculates bytesWritten correctly for UTF-8
- Blocks path traversal
- Handles write failure (throws)

### Step 1.7: listFiles tool tests

**File:** `packages/tools/official/sandbox-shell/src/__tests__/list-files.test.ts`

**~10 tests:**
- Throws when `_sandboxWorkDir` is missing
- Lists entries in directory
- Returns name, type (file/directory/symlink), size
- Gets file size via stat
- Handles stat failure gracefully (size=null)
- Recursive listing with depth limit
- Default maxDepth is 3
- Truncates at 1000 entries
- Skips symlinks that escape workspace
- Skips broken symlinks
- Default path is '.'

---

## Suite 2: Executor Unit Tests

**Location:** `apps/web/src/lib/executors/__tests__/`

These tests run within the existing `apps/web` vitest config (already includes `src/**/*.test.ts`).

### Step 2.1: resolveExecutorConfig tests

**File:** `apps/web/src/lib/executors/__tests__/resolve-config.test.ts`

**~8 tests:**
- Agent config takes precedence over collection config
- Falls back to collection config when agent is null
- Falls back to collection config when agent is `{ type: 'default' }`
- Returns `{ type: 'default' }` when both are null
- Returns `{ type: 'default' }` when both are `{ type: 'default' }`
- Preserves custom_url config shape
- Preserves sandbox config shape
- Handles undefined inputs

### Step 2.2: parseExecutorConfig tests

**File:** `apps/web/src/lib/executors/__tests__/parse-config.test.ts`

**~12 tests:**
- Returns null when executorType is null/undefined
- Returns `{ type: 'default' }` for executorType='default'
- Parses custom_url with url and apiKey
- Parses custom_url with url only (no apiKey)
- Returns null for custom_url without url
- Returns null for custom_url with non-string url
- Parses sandbox with url and apiKey
- Parses sandbox without config object (defaults)
- Parses sandbox with partial config
- Returns null for unknown executorType
- Returns null for custom_url with non-object config
- Handles empty string executorType (returns null)

### Step 2.3: resolveSandboxUrl tests

**File:** `apps/web/src/lib/executors/__tests__/resolve-sandbox-url.test.ts`

**~5 tests:**
- Returns config.url when provided
- Falls back to AGENT_SANDBOX_URL env var
- Returns null when neither config nor env is set
- Config.url takes precedence over env var
- Returns null for empty config

### Step 2.4: getExecutorDescription tests

**File:** `apps/web/src/lib/executors/__tests__/get-description.test.ts`

**~7 tests:**
- Returns 'TPMJS Default Executor' for null config
- Returns 'TPMJS Default Executor' for `{ type: 'default' }`
- Returns 'Custom: hostname' for custom_url with valid URL
- Returns 'Custom Executor' for custom_url with invalid URL
- Returns 'Sandbox: hostname' for sandbox with URL
- Returns 'Agent Sandbox' for sandbox with invalid URL
- Returns 'TPMJS Agent Sandbox' for sandbox without URL
- Returns 'Unknown Executor' for unknown type

### Step 2.5: createSandboxSession tests (with fetch mocking)

**File:** `apps/web/src/lib/executors/__tests__/sandbox-sessions.test.ts`

**~10 tests:**
- Sends POST to `{url}/sessions` with correct body
- Includes auth header when apiKey provided
- Returns parsed CreateSessionResponse on success
- Retries on 429 status
- Retries on ECONNREFUSED
- Retries on fetch failed
- Retries on timeout
- Throws after max retries exhausted
- Passes timeoutSeconds in body
- Abort on timeout (15s limit)

### Step 2.6: destroySandboxSession tests

**File:** `apps/web/src/lib/executors/__tests__/destroy-session.test.ts`

**~6 tests:**
- Sends DELETE to `{url}/sessions/{sessionId}`
- URL-encodes sessionId
- Returns `{ destroyed: true }` on success
- Returns `{ destroyed: false }` on non-404 error
- Returns `{ destroyed: false }` on network error (fire-and-forget)
- Ignores 404 status (already destroyed)

### Step 2.7: executeWithExecutor tests

**File:** `apps/web/src/lib/executors/__tests__/execute-with-executor.test.ts`

**~10 tests:**
- Routes to custom_url executor when config.type='custom_url'
- Routes to sandbox executor when config.type='sandbox' and sessionId provided
- Routes to default (package-executor) when config.type='default'
- Falls back to default when config is null
- Sandbox returns error when URL not configured
- Sandbox executor does not run without sessionId (falls through to default)
- Custom URL executor sends correct headers with apiKey
- Custom URL executor handles timeout (AbortError)
- Custom URL executor handles non-ok response
- Custom URL executor handles network error

---

## Implementation Order

| # | What | Files |
|---|------|-------|
| 1 | Export helpers from sandbox-shell | `packages/tools/official/sandbox-shell/src/index.ts` |
| 2 | Add vitest to sandbox-shell | `package.json`, `vitest.config.ts` |
| 3 | Create Deno mocks | `src/__tests__/deno-mocks.ts` |
| 4 | Helper tests | `src/__tests__/helpers.test.ts` |
| 5 | shellExec tests | `src/__tests__/shell-exec.test.ts` |
| 6 | readFile tests | `src/__tests__/read-file.test.ts` |
| 7 | writeFile tests | `src/__tests__/write-file.test.ts` |
| 8 | listFiles tests | `src/__tests__/list-files.test.ts` |
| 9 | Executor config tests | `__tests__/resolve-config.test.ts`, `parse-config.test.ts`, `resolve-sandbox-url.test.ts`, `get-description.test.ts` |
| 10 | Executor session tests | `__tests__/sandbox-sessions.test.ts`, `destroy-session.test.ts` |
| 11 | Executor execution tests | `__tests__/execute-with-executor.test.ts` |
| 12 | Run all tests, fix failures | `pnpm test` in both packages |

## Verification

1. `cd packages/tools/official/sandbox-shell && pnpm test` — all shell tool unit tests pass
2. `cd apps/web && pnpm test` — all executor unit tests pass (plus existing tests)
3. `pnpm type-check` — no type errors
4. `pnpm build` — clean build
