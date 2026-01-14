# @tpmjs/sprites-checkpoint-create

Create a point-in-time snapshot (checkpoint) of a sprite's filesystem state for later restoration.

## Installation

```bash
npm install @tpmjs/sprites-checkpoint-create
```

## Requirements

- `SPRITES_TOKEN` environment variable - Get your token from https://sprites.dev

## Usage

```typescript
import { spritesCheckpointCreateTool } from '@tpmjs/sprites-checkpoint-create';

const result = await spritesCheckpointCreateTool.execute({
  name: 'my-sandbox',
  checkpointName: 'before-experiment'
});

console.log(result);
// {
//   id: 'chk_abc123',
//   name: 'before-experiment',
//   createdAt: '2024-01-15T10:30:00Z',
//   size: 52428800
// }
```

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Name of the sprite to checkpoint |
| `checkpointName` | `string` | No | Optional human-readable name for the checkpoint |

## Output

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique checkpoint identifier (use this for restore) |
| `name` | `string?` | Human-readable checkpoint name if provided |
| `createdAt` | `string` | ISO 8601 timestamp of creation |
| `size` | `number?` | Checkpoint size in bytes |

## Use Cases

- Save state before risky operations
- Create restore points for experiments
- Backup filesystem before installing packages
- Version control for sprite state

## Error Handling

The tool throws errors in these cases:
- `SPRITES_TOKEN` environment variable is not set
- Sprite not found (HTTP 404)
- Invalid or expired API token (HTTP 401)
- Network timeout (120 second limit for large checkpoints)
- API errors with descriptive messages

## License

MIT
