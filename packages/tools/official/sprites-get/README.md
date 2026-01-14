# @tpmjs/sprites-get

Retrieve details of a specific sprite by name including status and configuration.

## Installation

```bash
npm install @tpmjs/sprites-get
```

## Requirements

- `SPRITES_TOKEN` environment variable - Get your token from https://sprites.dev

## Usage

```typescript
import { spritesGetTool } from '@tpmjs/sprites-get';

const result = await spritesGetTool.execute({
  name: 'my-sandbox'
});

console.log(result);
// {
//   name: 'my-sandbox',
//   status: 'running',
//   createdAt: '2024-01-15T10:30:00Z',
//   runtime: 'node:20'
// }
```

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Name of the sprite to retrieve |

## Output

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Name of the sprite |
| `status` | `'creating' \| 'running' \| 'stopped' \| 'error'` | Current status |
| `createdAt` | `string` | ISO 8601 timestamp of creation |
| `runtime` | `string?` | Optional runtime configuration |
| `metadata` | `object?` | Optional custom metadata |

## Error Handling

The tool throws errors in these cases:
- `SPRITES_TOKEN` environment variable is not set
- Sprite not found (HTTP 404)
- Invalid or expired API token (HTTP 401)
- Network timeout (30 second limit)
- API errors with descriptive messages

## License

MIT
