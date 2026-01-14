# @tpmjs/sprites-list

List all sprites in your account with their current status and metadata.

## Installation

```bash
npm install @tpmjs/sprites-list
```

## Requirements

- `SPRITES_TOKEN` environment variable - Get your token from https://sprites.dev

## Usage

```typescript
import { spritesListTool } from '@tpmjs/sprites-list';

const result = await spritesListTool.execute({});

console.log(result);
// {
//   sprites: [
//     { name: 'my-sandbox', status: 'running', createdAt: '2024-01-15T10:30:00Z' },
//     { name: 'test-env', status: 'stopped', createdAt: '2024-01-14T08:00:00Z' }
//   ],
//   count: 2
// }
```

## Input Parameters

This tool takes no input parameters.

## Output

| Field | Type | Description |
|-------|------|-------------|
| `sprites` | `Sprite[]` | Array of sprites in the account |
| `count` | `number` | Total number of sprites |

### Sprite Object

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Unique name of the sprite |
| `status` | `'creating' \| 'running' \| 'stopped' \| 'error'` | Current status |
| `createdAt` | `string` | ISO 8601 timestamp of creation |
| `runtime` | `string?` | Optional runtime configuration |
| `metadata` | `object?` | Optional custom metadata |

## Error Handling

The tool throws errors in these cases:
- `SPRITES_TOKEN` environment variable is not set
- Invalid or expired API token (HTTP 401)
- Network timeout (30 second limit)
- API errors with descriptive messages

## License

MIT
