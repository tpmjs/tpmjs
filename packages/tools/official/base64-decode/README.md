# @tpmjs/official-base64-decode

Decode base64 encoded data to string with support for multiple output encodings.

## Installation

```bash
npm install @tpmjs/official-base64-decode
```

## Usage

```typescript
import { base64DecodeTool } from '@tpmjs/official-base64-decode';
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: {
    base64Decode: base64DecodeTool,
  },
  prompt: 'Decode the base64 string "SGVsbG8sIFdvcmxkIQ=="',
});
```

## Parameters

- `base64` (string, required): The base64 encoded data to decode
- `encoding` (string, optional): Character encoding for the output data
  - Options: `'utf8'` (default), `'binary'`, `'hex'`

## Returns

```typescript
{
  decoded: string;       // The decoded string
  byteLength: number;    // The byte length of the decoded data
}
```

## Examples

### Decode to UTF-8 text (default)

```typescript
const result = await base64DecodeTool.execute({
  base64: 'SGVsbG8sIFdvcmxkIQ==',
});
// { decoded: 'Hello, World!', byteLength: 13 }
```

### Decode to hex string

```typescript
const result = await base64DecodeTool.execute({
  base64: '3q2+7w==',
  encoding: 'hex',
});
// { decoded: 'deadbeef', byteLength: 4 }
```

### Decode to binary

```typescript
const result = await base64DecodeTool.execute({
  base64: 'AAECAw==',
  encoding: 'binary',
});
// { decoded: '\x00\x01\x02\x03', byteLength: 4 }
```

## Use Cases

- Decoding base64-encoded API responses
- Extracting data from data URIs
- Decoding authentication tokens
- Processing base64-encoded file content
- Converting base64 images back to binary

## Error Handling

The tool throws an error if:
- The base64 string is invalid
- The encoding parameter is not one of the supported values

## License

MIT
