# @tpmjs/executor-test

Protocol compliance test suite for [TPMJS](https://tpmjs.com) tool executors.

[![npm version](https://img.shields.io/npm/v/@tpmjs/executor-test.svg)](https://www.npmjs.com/package/@tpmjs/executor-test)
[![License: MIT](https://img.shields.io/github/license/tpmjs/tpmjs)](https://github.com/tpmjs/tpmjs/blob/main/LICENSE)

If you build a service that implements the TPMJS Executor Protocol (an HTTP endpoint that runs tools), this suite verifies it conforms. It runs a sequence of live HTTP checks against your executor's URL — `GET /health`, `POST /execute-tool`, CORS/preflight, and the optional `GET /info` capabilities — and reports **Core** and **Standard** compliance. Use it as a CLI in CI, or import the runners programmatically.

## Installation

Run it directly with `npx` (no install needed), or add it as a dev dependency:

```bash
npx @tpmjs/executor-test https://my-executor.example.com

npm install --save-dev @tpmjs/executor-test
```

## Usage

Point it at your running executor:

```bash
# Basic run against a live executor
npx @tpmjs/executor-test https://my-executor.example.com

# With bearer-token auth
npx @tpmjs/executor-test https://my-executor.example.com --api-key sk-xxx

# Machine-readable output for CI
npx @tpmjs/executor-test https://my-executor.example.com --json
```

Options: `--api-key <key>` (Bearer auth), `--json` (emit the full `ComplianceResult` as JSON), `--verbose`, `--help`. The process exits `0` when Core compliance passes and `1` otherwise, so it drops straight into CI.

### Programmatic

```typescript
import { runCoreTests, runStandardTests } from '@tpmjs/executor-test';

const core = await runCoreTests('https://my-executor.example.com', apiKey);
const standard = await runStandardTests('https://my-executor.example.com', apiKey);

console.log(core.results.every((r) => r.passed) ? 'Core: PASS' : 'Core: FAIL');
```

## What it checks

- **Core** — `GET /health` returns 200 with `protocolVersion` + `implementationVersion`; `POST /execute-tool` accepts a valid request, returns a structured `{ success, executionTimeMs, output|error }` response, and errors on an unknown package; CORS headers and `OPTIONS` preflight.
- **Standard** — `GET /info` returns 200 with a valid `capabilities` block (`isolation`, `executionModes`, `maxExecutionTimeMs`, `maxRequestBodyBytes`), advertised protocol version, enforced authentication, a `maxExecutionTimeMs` of at least 60000, and standard structured error codes (`PACKAGE_NOT_FOUND`, `TOOL_NOT_FOUND`, `EXECUTION_TIMEOUT`, …).

## API

- `run(args: string[]): Promise<void>` — the CLI entry point (parses argv, prints results, exits).
- `runCoreTests(baseUrl: string, apiKey?: string): Promise<TestSuite>` — run the Core requirement suite.
- `runStandardTests(baseUrl: string, apiKey?: string): Promise<TestSuite>` — run the Standard requirement suite.
- Types: `ComplianceResult`, `TestSuite`, `TestResult`.

## Links

- Repository: [github.com/tpmjs/tpmjs](https://github.com/tpmjs/tpmjs) (`packages/executor-test`)
- Website: [tpmjs.com](https://tpmjs.com)

## License

MIT
