# @tpmjs/sprites-policy-set

Update the network policy for a sprite to control outbound network access.

## Installation

```bash
npm install @tpmjs/sprites-policy-set
```

## Requirements

- `SPRITES_TOKEN` environment variable - Get your token from https://sprites.dev

## Usage

```typescript
import { spritesPolicySetTool } from '@tpmjs/sprites-policy-set';

// Allow only specific domains (block everything else)
const result = await spritesPolicySetTool.execute({
  name: 'my-sandbox',
  mode: 'allow',
  domains: ['api.github.com', 'registry.npmjs.org', 'pypi.org']
});

console.log(result);
// {
//   policy: {
//     mode: 'allow',
//     domains: ['api.github.com', 'registry.npmjs.org', 'pypi.org']
//   },
//   applied: true
// }

// Block specific domains (allow everything else)
const blockResult = await spritesPolicySetTool.execute({
  name: 'my-sandbox',
  mode: 'deny',
  domains: ['malicious-site.com', 'tracking.example.com']
});
```

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Name of the sprite to update policy for |
| `mode` | `'allow' \| 'deny'` | Yes | Policy mode |
| `domains` | `string[]` | Yes | List of domains to allow or deny based on mode |

## Output

| Field | Type | Description |
|-------|------|-------------|
| `policy` | `NetworkPolicy` | The applied network policy |
| `applied` | `boolean` | Whether the policy was successfully applied |

### NetworkPolicy Object

| Field | Type | Description |
|-------|------|-------------|
| `mode` | `'allow' \| 'deny'` | Policy mode |
| `domains` | `string[]` | List of domains affected by the policy |
| `rules` | `object[]?` | Optional additional filtering rules |

## Policy Modes

- **`allow` mode**: Blocks all outbound traffic EXCEPT to listed domains
  - Use for maximum security when you know exactly which APIs are needed

- **`deny` mode**: Allows all outbound traffic EXCEPT to listed domains
  - Use to block known-bad domains while allowing general access

## Use Cases

- Restrict sprite to only access required APIs
- Block access to potentially harmful domains
- Implement defense-in-depth security
- Ensure code can only communicate with trusted services

## Error Handling

The tool throws errors in these cases:
- `SPRITES_TOKEN` environment variable is not set
- Invalid mode (must be 'allow' or 'deny')
- Domains must be an array
- Sprite not found (HTTP 404)
- Invalid or expired API token (HTTP 401)
- Network timeout (30 second limit)
- API errors with descriptive messages

## License

MIT
