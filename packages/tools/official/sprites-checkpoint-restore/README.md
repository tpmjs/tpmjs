# @tpmjs/sprites-checkpoint-restore

Restore a sprite to a previous checkpoint state, reverting all filesystem changes.

## Installation

```bash
npm install @tpmjs/sprites-checkpoint-restore
```

## Requirements

- `SPRITES_TOKEN` environment variable - Get your token from https://sprites.dev

## Usage

```typescript
import { spritesCheckpointRestoreTool } from '@tpmjs/sprites-checkpoint-restore';

const result = await spritesCheckpointRestoreTool.execute({
  name: 'my-sandbox',
  checkpointId: 'chk_abc123'
});

console.log(result);
// {
//   restored: true,
//   checkpointId: 'chk_abc123',
//   sprite: {
//     name: 'my-sandbox',
//     status: 'running',
//     createdAt: '2024-01-15T10:30:00Z'
//   }
// }
```

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Name of the sprite to restore |
| `checkpointId` | `string` | Yes | ID of the checkpoint to restore to |

## Output

| Field | Type | Description |
|-------|------|-------------|
| `restored` | `boolean` | Whether restoration was successful |
| `checkpointId` | `string` | ID of the checkpoint that was restored |
| `sprite` | `Sprite` | Updated sprite details after restoration |

### Sprite Object

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Name of the sprite |
| `status` | `'creating' \| 'running' \| 'stopped' \| 'error'` | Current status |
| `createdAt` | `string` | ISO 8601 timestamp of creation |
| `runtime` | `string?` | Optional runtime configuration |
| `metadata` | `object?` | Optional custom metadata |

## Use Cases

- Undo changes after failed experiments
- Recover from errors or corrupted state
- Reset to a known good state
- Rollback after testing

## Warning

Restoring a checkpoint will **replace** the current filesystem state. Any changes made after the checkpoint was created will be lost.

## Error Handling

The tool throws errors in these cases:
- `SPRITES_TOKEN` environment variable is not set
- Sprite or checkpoint not found (HTTP 404)
- Invalid or expired API token (HTTP 401)
- Network timeout (120 second limit for large restorations)
- API errors with descriptive messages

## License

MIT
