# @tpmjs/tools-redact-secrets

Redact detected secrets from text by replacing them with `[REDACTED:type]` placeholders.

## Features

- **Automatic Detection**: Uses the same patterns as `@tpmjs/tools-secret-scan-text`
- **Custom Patterns**: Optionally provide additional regex patterns
- **Safe Output**: Replaces sensitive data with labeled placeholders
- **Detailed Report**: Returns information about what was redacted

## Installation

```bash
npm install @tpmjs/tools-redact-secrets
```

## Usage

### Basic Usage

```typescript
import { redactSecrets } from '@tpmjs/tools-redact-secrets';

const code = `
const AWS_KEY = "AKIAIOSFODNN7EXAMPLE";
const apiKey = "sk-proj-1234567890abcdef";
const dbUrl = "postgres://user:password123@localhost:5432/mydb";
`;

const result = await redactSecrets.execute({ text: code });

console.log(result.redacted);
// const AWS_KEY = "[REDACTED:aws-access-key]";
// const apiKey = "[REDACTED:openai-api-key]";
// const dbUrl = "[REDACTED:postgres-connection]";

console.log(result.redactions);
// [
//   {
//     type: 'aws-access-key',
//     originalLength: 20,
//     line: 2,
//     column: 18,
//     replacement: '[REDACTED:aws-access-key]'
//   },
//   {
//     type: 'openai-api-key',
//     originalLength: 24,
//     line: 3,
//     column: 17,
//     replacement: '[REDACTED:openai-api-key]'
//   },
//   {
//     type: 'postgres-connection',
//     originalLength: 50,
//     line: 4,
//     column: 17,
//     replacement: '[REDACTED:postgres-connection]'
//   }
// ]
```

### Custom Patterns

```typescript
const text = `
My email is user@example.com
My phone is 555-1234
`;

const result = await redactSecrets.execute({
  text,
  customPatterns: [
    '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', // Email
    '\\d{3}-\\d{4}', // Phone
  ],
});

console.log(result.redacted);
// My email is [REDACTED:custom-pattern]
// My phone is [REDACTED:custom-pattern]
```

### Using with Logs

```typescript
import { redactSecrets } from '@tpmjs/tools-redact-secrets';

function safelog(message: string) {
  const result = await redactSecrets.execute({ text: message });
  console.log(result.redacted);
}

// Safe to log - secrets automatically redacted
safelog('Error connecting to postgres://admin:secret@db.example.com/prod');
// Output: Error connecting to [REDACTED:postgres-connection]
```

## Detected Secret Types

The tool automatically redacts:

- AWS credentials (access keys, secret keys)
- GitHub tokens
- Slack tokens and webhooks
- OpenAI API keys
- Stripe API keys
- Generic API keys
- JWT tokens
- Private keys (RSA, EC, SSH)
- Database connection strings (PostgreSQL, MySQL, MongoDB)
- Hardcoded passwords
- Google API keys
- Twilio API keys
- SendGrid API keys
- Mailchimp API keys
- Bearer tokens

## Custom Pattern Format

Custom patterns can be provided as:

1. **Plain strings**: `"pattern"` - Treated as literal regex with global flag
2. **Regex format**: `"/pattern/flags"` - Parsed as regex with flags

Examples:
```typescript
customPatterns: [
  'CUSTOM-[A-Z0-9]{10}',           // Plain string
  '/SECRET_\\w+/gi',                // Regex with flags
  '[0-9]{3}-[0-9]{2}-[0-9]{4}',   // SSN pattern
]
```

## Use Cases

- **Log Sanitization**: Remove secrets from application logs before storage
- **Error Messages**: Redact credentials from error stack traces
- **Debugging Output**: Share debug output safely
- **Documentation**: Clean up example code that may contain real credentials
- **CI/CD**: Sanitize build outputs and test results

## Return Value

```typescript
interface RedactionResult {
  redacted: string;                    // Text with secrets replaced
  redactionCount: number;              // Total number of redactions
  redactions: Array<{                  // Details of each redaction
    type: string;
    originalLength: number;
    line: number;
    column: number;
    replacement: string;
  }>;
  metadata: {
    originalLength: number;
    redactedLength: number;
    linesProcessed: number;
  };
}
```

## Performance

- Processes text in a single pass per pattern
- Handles overlapping matches by keeping the first occurrence
- Efficient for large text inputs (logs, code files, etc.)

## License

MIT
