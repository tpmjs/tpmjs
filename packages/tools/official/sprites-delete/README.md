# @tpmjs/sprites-delete

Delete a sprite and all its associated data including checkpoints.

## Installation

```bash
npm install @tpmjs/sprites-delete
```

## Requirements

- `SPRITES_TOKEN` environment variable - Get your token from https://sprites.dev

## Usage

```typescript
import { spritesDeleteTool } from '@tpmjs/sprites-delete';

const result = await spritesDeleteTool.execute({
  name: 'my-sandbox'
});

console.log(result);
// {
//   deleted: true,
//   name: 'my-sandbox'
// }
```

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Name of the sprite to delete |

## Output

| Field | Type | Description |
|-------|------|-------------|
| `deleted` | `boolean` | Whether deletion was successful |
| `name` | `string` | Name of the deleted sprite |

## Warning

This action is **irreversible**. All data associated with the sprite, including:
- Filesystem contents
- All checkpoints
- Execution history

will be permanently deleted.

## Error Handling

The tool throws errors in these cases:
- `SPRITES_TOKEN` environment variable is not set
- Sprite not found (HTTP 404)
- Invalid or expired API token (HTTP 401)
- Network timeout (30 second limit)
- API errors with descriptive messages

## License

MIT
