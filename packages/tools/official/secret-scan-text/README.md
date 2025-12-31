# @tpmjs/tools-secret-scan-text

Scan text for potential secrets using regex patterns.

## Features

Detects the following types of secrets:

- **AWS Credentials**: Access keys, secret keys, account IDs
- **GitHub Tokens**: Personal access tokens, OAuth tokens
- **Slack Tokens**: Bot tokens, webhooks
- **OpenAI API Keys**: API keys for OpenAI services
- **Stripe API Keys**: Live and restricted keys
- **Generic API Keys**: Common API key patterns
- **JWT Tokens**: JSON Web Tokens
- **Private Keys**: RSA, EC, DSA, OpenSSH, PGP
- **Database Credentials**: PostgreSQL, MySQL, MongoDB connection strings
- **Hardcoded Passwords**: Password assignments in code
- **Google API Keys**: Google Cloud API keys
- **Twilio API Keys**: Twilio service keys
- **SendGrid API Keys**: SendGrid API tokens
- **Mailchimp API Keys**: Mailchimp API tokens
- **Bearer Tokens**: Authorization bearer tokens

## Installation

```bash
npm install @tpmjs/tools-secret-scan-text
```

## Usage

```typescript
import { secretScanText } from '@tpmjs/tools-secret-scan-text';

const code = `
const AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE";
const apiKey = "sk-proj-1234567890abcdef";
const dbUrl = "postgres://user:password123@localhost:5432/mydb";
`;

const result = await secretScanText.execute({ text: code });

console.log(result);
// {
//   secrets: [
//     {
//       type: 'aws-access-key',
//       value: 'AKIAIOSFODNN7EXAMPLE',
//       line: 2,
//       column: 24,
//       context: '...const AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE";...',
//       severity: 'critical'
//     },
//     {
//       type: 'openai-api-key',
//       value: 'sk-proj-1234567890abcdef',
//       line: 3,
//       column: 17,
//       context: '...const apiKey = "sk-proj-1234567890abcdef";...',
//       severity: 'critical'
//     },
//     {
//       type: 'postgres-connection',
//       value: 'postgres://user:password123@localhost:5432/mydb',
//       line: 4,
//       column: 17,
//       context: '...const dbUrl = "postgres://user:password123@localhost:5432/mydb";...',
//       severity: 'critical'
//     }
//   ],
//   secretCount: 3,
//   patterns: [
//     { type: 'aws-access-key', count: 1 },
//     { type: 'openai-api-key', count: 1 },
//     { type: 'postgres-connection', count: 1 }
//   ],
//   metadata: {
//     linesScanned: 5,
//     scanDurationMs: 2
//   }
// }
```

## Severity Levels

- **critical**: Immediate security risk (AWS keys, private keys, database credentials)
- **high**: Serious risk (API keys, tokens, hardcoded passwords)
- **medium**: Moderate risk (account IDs, less sensitive tokens)
- **low**: Minor concerns

## Use Cases

- **Pre-commit Hooks**: Scan code before committing
- **CI/CD Pipelines**: Detect secrets in build artifacts
- **Code Reviews**: Identify hardcoded credentials
- **Log Analysis**: Find accidentally logged secrets
- **Configuration Audits**: Check config files for sensitive data

## License

MIT
