# @tpmjs/sprites-exec

Execute a command inside a sprite and return the output.

## Installation

```bash
npm install @tpmjs/sprites-exec
```

## Requirements

- `SPRITES_TOKEN` environment variable - Get your token from https://sprites.dev

## Usage

```typescript
import { spritesExecTool } from '@tpmjs/sprites-exec';

// Run a simple command
const result = await spritesExecTool.execute({
  name: 'my-sandbox',
  cmd: 'ls -la /home'
});

console.log(result);
// {
//   exitCode: 0,
//   stdout: 'total 4\ndrwxr-xr-x 2 root root 4096 Jan 15 10:30 .\n...',
//   stderr: '',
//   duration: 45
// }

// Run with stdin input
const pythonResult = await spritesExecTool.execute({
  name: 'my-sandbox',
  cmd: 'python3',
  stdin: 'print("Hello from stdin!")'
});

// For shell features (pipes, redirects, etc), use bash -c
const shellResult = await spritesExecTool.execute({
  name: 'my-sandbox',
  cmd: 'bash -c "echo hello > /tmp/test.txt && cat /tmp/test.txt"'
});
```

## Shell Commands

Commands are executed directly (like `exec.Command` in Go), not through a shell. This means shell operators like `|`, `>`, `>>`, `&&` won't work directly.

For shell features, wrap your command with `bash -c`:
```typescript
// Won't work: cmd: 'echo hello > file.txt'
// Use instead:
cmd: 'bash -c "echo hello > file.txt"'
```

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Name of the sprite to execute command in |
| `cmd` | `string` | Yes | Command to execute (e.g., 'ls -la', 'python script.py') |
| `stdin` | `string` | No | Optional stdin input to pass to the command |
| `timeoutMs` | `number` | No | Execution timeout in milliseconds (default: 60000) |

## Output

| Field | Type | Description |
|-------|------|-------------|
| `exitCode` | `number` | Command exit code (0 = success) |
| `stdout` | `string` | Standard output from the command |
| `stderr` | `string` | Standard error from the command |
| `duration` | `number` | Execution duration in milliseconds |

## Error Handling

The tool throws errors in these cases:
- `SPRITES_TOKEN` environment variable is not set
- Sprite not found (HTTP 404)
- Command execution timeout
- Invalid or expired API token (HTTP 401)
- Network errors with descriptive messages

## License

MIT
