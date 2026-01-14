# @tpmjs/sprites-policy-get

Retrieve the current network policy for a sprite including allowed domains.

## Installation

```bash
npm install @tpmjs/sprites-policy-get
```

## Requirements

- `SPRITES_TOKEN` environment variable - Get your token from https://sprites.dev

## Usage

```typescript
import { spritesPolicyGetTool } from '@tpmjs/sprites-policy-get';

const result = await spritesPolicyGetTool.execute({
  name: 'my-sandbox'
});

console.log(result);
// {
//   mode: 'allow',
//   domains: ['api.github.com', 'registry.npmjs.org'],
//   rules: []
// }
```

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Name of the sprite to get policy for |

## Output

| Field | Type | Description |
|-------|------|-------------|
| `mode` | `'allow' \| 'deny'` | Policy mode |
| `domains` | `string[]` | List of domains affected by the policy |
| `rules` | `object[]?` | Optional additional filtering rules |

## Policy Modes

- **`allow` mode**: Blocks all outbound traffic EXCEPT to listed domains
- **`deny` mode**: Allows all outbound traffic EXCEPT to listed domains

## Use Cases

- Audit current network access for a sprite
- Verify security policies are correctly applied
- Debug connectivity issues
- Review allowed domains before running sensitive code

## Error Handling

The tool throws errors in these cases:
- `SPRITES_TOKEN` environment variable is not set
- Sprite not found (HTTP 404)
- Invalid or expired API token (HTTP 401)
- Network timeout (30 second limit)
- API errors with descriptive messages

## License

MIT
