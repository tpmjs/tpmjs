# @tpmjs/tools-env-var-docs-generate

Generates documentation for environment variables from .env files.

## Installation

```bash
npm install @tpmjs/tools-env-var-docs-generate
```

## Usage

```typescript
import { envVarDocsGenerate } from '@tpmjs/tools-env-var-docs-generate';
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: { envVarDocsGenerate },
  prompt: 'Generate documentation for this .env file: ...',
});
```

## Features

- Parses .env file format with variable assignments
- Extracts descriptions from comments (both above and inline)
- Supports REQUIRED/OPTIONAL markers in comments
- Detects default values and examples
- Generates markdown documentation with tables
- Provides statistics (total, required, optional counts)

## Input

- `envContent` (string): The content of the .env file to parse

## Output

Returns an object with:

- `variables` (array): List of environment variables with metadata
  - `name`: Variable name
  - `description`: Description from comments
  - `required`: Whether the variable is required
  - `default`: Default value if present
  - `example`: Example value if present
- `markdown` (string): Generated markdown documentation
- `totalVariables` (number): Total count of variables
- `requiredCount` (number): Count of required variables
- `optionalCount` (number): Count of optional variables

## Example

```typescript
const envContent = `
# REQUIRED: Database connection URL
DATABASE_URL=postgresql://localhost:5432/mydb

# API key for external service
API_KEY=your-api-key-here

# OPTIONAL: Port number
PORT=3000
`;

const docs = await envVarDocsGenerate.execute({ envContent });

console.log(docs.markdown);
// # Environment Variables
//
// Total: 3 variables (2 required, 1 optional)
//
// ## Required Variables
// ...
```

## Supported Comment Formats

- `# Comment above variable`
- `# REQUIRED: Description`
- `# OPTIONAL: Description`
- `VAR_NAME=value # inline comment`

## License

MIT
