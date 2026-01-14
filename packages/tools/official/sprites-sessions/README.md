# @tpmjs/sprites-sessions

List active execution sessions for a sprite.

## Installation

```bash
npm install @tpmjs/sprites-sessions
```

## Requirements

- `SPRITES_TOKEN` environment variable - Get your token from https://sprites.dev

## Usage

```typescript
import { spritesSessionsTool } from '@tpmjs/sprites-sessions';

const result = await spritesSessionsTool.execute({
  name: 'my-sandbox'
});

console.log(result);
// {
//   sessions: [
//     { id: 'sess_123', status: 'active', startedAt: '2024-01-15T10:30:00Z', command: 'python server.py' },
//     { id: 'sess_124', status: 'completed', startedAt: '2024-01-15T10:25:00Z' }
//   ],
//   count: 2
// }
```

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Name of the sprite to list sessions for |

## Output

| Field | Type | Description |
|-------|------|-------------|
| `sessions` | `ExecSession[]` | Array of execution sessions |
| `count` | `number` | Total number of sessions |

### ExecSession Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique session identifier |
| `status` | `'active' \| 'completed' \| 'terminated'` | Session status |
| `startedAt` | `string` | ISO 8601 timestamp when session started |
| `command` | `string?` | Optional command that started the session |

## Use Cases

- Monitor running commands in a sprite
- Check if long-running processes are still active
- Debug execution issues by reviewing session history

## Error Handling

The tool throws errors in these cases:
- `SPRITES_TOKEN` environment variable is not set
- Sprite not found (HTTP 404)
- Invalid or expired API token (HTTP 401)
- Network timeout (30 second limit)
- API errors with descriptive messages

## License

MIT
