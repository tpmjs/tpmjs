# @tpmjs/sprites-checkpoint-list

List all checkpoints for a sprite ordered by creation time.

## Installation

```bash
npm install @tpmjs/sprites-checkpoint-list
```

## Requirements

- `SPRITES_TOKEN` environment variable - Get your token from https://sprites.dev

## Usage

```typescript
import { spritesCheckpointListTool } from '@tpmjs/sprites-checkpoint-list';

const result = await spritesCheckpointListTool.execute({
  name: 'my-sandbox'
});

console.log(result);
// {
//   checkpoints: [
//     { id: 'chk_abc123', name: 'before-experiment', createdAt: '2024-01-15T10:30:00Z', size: 52428800 },
//     { id: 'chk_def456', name: 'initial-setup', createdAt: '2024-01-14T08:00:00Z', size: 10485760 }
//   ],
//   count: 2
// }
```

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Name of the sprite to list checkpoints for |

## Output

| Field | Type | Description |
|-------|------|-------------|
| `checkpoints` | `Checkpoint[]` | Array of checkpoints ordered by creation time |
| `count` | `number` | Total number of checkpoints |

### Checkpoint Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique checkpoint identifier (use this for restore) |
| `name` | `string?` | Optional human-readable name |
| `createdAt` | `string` | ISO 8601 timestamp of creation |
| `size` | `number?` | Checkpoint size in bytes |

## Use Cases

- Find checkpoint IDs for restoration
- Review available restore points
- Audit checkpoint history
- Clean up old checkpoints

## Error Handling

The tool throws errors in these cases:
- `SPRITES_TOKEN` environment variable is not set
- Sprite not found (HTTP 404)
- Invalid or expired API token (HTTP 401)
- Network timeout (30 second limit)
- API errors with descriptive messages

## License

MIT
