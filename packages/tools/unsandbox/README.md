# @tpmjs/unsandbox

AI SDK tools for secure code execution in 42+ programming languages via [unsandbox.com](https://unsandbox.com).

## Installation

```bash
npm install @tpmjs/unsandbox
# or
pnpm add @tpmjs/unsandbox
```

## Setup

Get an API key at [unsandbox.com/api-keys](https://unsandbox.com/api-keys) and set it as an environment variable:

```bash
export UNSANDBOX_API_KEY=your-api-key
```

## Usage

```typescript
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { executeCode, listLanguages } from '@tpmjs/unsandbox';

const result = streamText({
  model: anthropic('claude-sonnet-4-20250514'),
  tools: {
    executeCode,
    listLanguages,
  },
  system: 'You can execute code in 42+ programming languages using a secure sandbox.',
  prompt: 'Write and run a Python script that calculates the first 10 Fibonacci numbers',
});
```

## Tools

### executeCode

Execute code synchronously in a secure sandbox.

```typescript
import { executeCode } from '@tpmjs/unsandbox';

const result = await executeCode.execute({
  language: 'python',
  code: 'print("Hello, World!")',
});
// { stdout: "Hello, World!\n", stderr: "", exit_code: 0 }
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `language` | string | Yes | Programming language (python, javascript, go, rust, etc.) |
| `code` | string | Yes | Source code to execute |
| `input_files` | array | No | Files to make available in /tmp/input/ |
| `network_mode` | string | No | 'zerotrust' (default) or 'semitrusted' |
| `ttl` | number | No | Timeout in seconds (1-900, default 60) |
| `return_artifact` | boolean | No | Return compiled binary for compiled languages |
| `return_wasm_artifact` | boolean | No | Compile to WebAssembly (C, C++, Rust, Zig, Go) |

### executeCodeAsync

Execute code asynchronously, returning a job_id for tracking.

```typescript
import { executeCodeAsync, getJob } from '@tpmjs/unsandbox';

const job = await executeCodeAsync.execute({
  language: 'rust',
  code: 'fn main() { println!("Hello from Rust!"); }',
});

// Check status later
const result = await getJob.execute({ job_id: job.job_id });
```

### runCode

Execute code with automatic language detection from shebang.

```typescript
import { runCode } from '@tpmjs/unsandbox';

const result = await runCode.execute({
  code: `#!/usr/bin/env python3
print("Auto-detected Python!")`,
});
```

### runCodeAsync

Async version of runCode.

### listJobs

List all active jobs for your API key.

```typescript
import { listJobs } from '@tpmjs/unsandbox';

const jobs = await listJobs.execute({});
```

### getJob

Get status and results of a specific async job.

```typescript
import { getJob } from '@tpmjs/unsandbox';

const result = await getJob.execute({ job_id: 'abc123' });
// { status: 'completed', stdout: '...', stderr: '...' }
```

### cancelJob

Cancel a running or pending async job.

```typescript
import { cancelJob } from '@tpmjs/unsandbox';

await cancelJob.execute({ job_id: 'abc123' });
```

### listLanguages

List all 42+ supported programming languages.

```typescript
import { listLanguages } from '@tpmjs/unsandbox';

const languages = await listLanguages.execute({});
```

## Supported Languages

42+ languages including:

- **Interpreted:** Python, JavaScript, TypeScript, Ruby, Perl, PHP, Lua, Bash, R, Elixir, Erlang, Tcl, Scheme, PowerShell, Clojure, Common Lisp, Crystal, Groovy, Deno, AWK, Raku
- **Compiled:** C, C++, Go, Rust, Java, Kotlin, COBOL, Fortran, D, Zig, Nim, V, Objective-C, Dart
- **Functional:** Julia, Haskell, OCaml, F#, C#, Prolog, Forth

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `UNSANDBOX_API_KEY` | Yes | API key from unsandbox.com |

## Related

- [unsandbox.com](https://unsandbox.com) - Secure code execution API
- [TPMJS Registry](https://tpmjs.com) - Browse all available AI SDK tools

## License

MIT
