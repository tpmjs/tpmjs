# @tpmjs/official-hash-text

Hash text using cryptographic algorithms (MD5, SHA-1, SHA-256, SHA-512).

## Installation

```bash
npm install @tpmjs/official-hash-text
```

## Usage

```typescript
import { hashTextTool } from '@tpmjs/official-hash-text';
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: {
    hashText: hashTextTool,
  },
  prompt: 'Hash "Hello, World!" using SHA-256',
});
```

## Parameters

- `text` (string, required): The text to hash
- `algorithm` (string, required): Hash algorithm to use
  - Options: `'md5'`, `'sha1'`, `'sha256'`, `'sha512'`

## Returns

```typescript
{
  hash: string;          // The hexadecimal hash digest
  algorithm: string;     // The algorithm used
  inputLength: number;   // The length of the input text
}
```

## Examples

### SHA-256 hash

```typescript
const result = await hashTextTool.execute({
  text: 'Hello, World!',
  algorithm: 'sha256',
});
// {
//   hash: 'dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f',
//   algorithm: 'sha256',
//   inputLength: 13
// }
```

### MD5 hash

```typescript
const result = await hashTextTool.execute({
  text: 'Hello, World!',
  algorithm: 'md5',
});
// {
//   hash: '65a8e27d8879283831b664bd8b7f0ad4',
//   algorithm: 'md5',
//   inputLength: 13
// }
```

### SHA-512 hash

```typescript
const result = await hashTextTool.execute({
  text: 'password123',
  algorithm: 'sha512',
});
// Returns 128-character hexadecimal hash
```

## Use Cases

- Generating content fingerprints for deduplication
- Creating checksums for data integrity verification
- Hashing user input for comparison (note: use proper password hashing for credentials)
- Generating cache keys
- Creating unique identifiers from content
- File integrity checks

## Algorithm Guide

| Algorithm | Output Length | Use Case |
|-----------|--------------|----------|
| `md5`     | 32 hex chars (128 bits) | Legacy systems, checksums (not cryptographically secure) |
| `sha1`    | 40 hex chars (160 bits) | Git commits, legacy systems (weakened security) |
| `sha256`  | 64 hex chars (256 bits) | General purpose, recommended for most use cases |
| `sha512`  | 128 hex chars (512 bits) | High security requirements, larger hash space |

**Note:** MD5 and SHA-1 are not recommended for security-critical applications. Use SHA-256 or SHA-512 for cryptographic purposes.

## License

MIT
