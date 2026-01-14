# @tpmjs/sprites-create

Create a new isolated Linux sandbox environment (sprite) with persistent filesystem.

## Installation

```bash
npm install @tpmjs/sprites-create
```

## Requirements

- `SPRITES_TOKEN` environment variable - Get your token from https://sprites.dev

## Usage

```typescript
import { spritesCreateTool } from '@tpmjs/sprites-create';

const result = await spritesCreateTool.execute({
  name: 'my-new-sandbox'
});

console.log(result);
// {
//   name: 'my-new-sandbox',
//   status: 'creating',
//   createdAt: '2024-01-15T10:30:00Z'
// }
```

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Unique name for the sprite (lowercase alphanumeric with hyphens, 3-63 characters) |

## Output

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Name of the created sprite |
| `status` | `'creating' \| 'running' \| 'stopped' \| 'error'` | Current status |
| `createdAt` | `string` | ISO 8601 timestamp of creation |
| `runtime` | `string?` | Optional runtime configuration |
| `metadata` | `object?` | Optional custom metadata |

## Name Validation

Sprite names must:
- Be 3-63 characters long
- Start and end with a lowercase letter or number
- Contain only lowercase letters, numbers, and hyphens

## Error Handling

The tool throws errors in these cases:
- `SPRITES_TOKEN` environment variable is not set
- Invalid sprite name format
- Sprite name already exists (HTTP 409)
- Invalid or expired API token (HTTP 401)
- Network timeout (60 second limit)
- API errors with descriptive messages

## License

MIT
