# @tpmjs/tools-dependency-audit-lite

Lightweight audit of package.json dependencies for common issues.

## Installation

```bash
npm install @tpmjs/tools-dependency-audit-lite
```

## Usage

```typescript
import { dependencyAuditLite } from '@tpmjs/tools-dependency-audit-lite';
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: { dependencyAuditLite },
  prompt: 'Audit my package.json for issues: ...',
});
```

## Features

- Detects deprecated packages (e.g., node-sass, moment, tslint)
- Identifies unstable versions with caret (^0.x.x)
- Flags wildcard and 'latest' versions
- Warns about unbounded version ranges (>=x.x.x)
- Detects misplaced dependencies (build tools, test frameworks)
- Identifies git URLs and local file dependencies
- Provides actionable recommendations
- Categorizes issues by severity (error, warning, info)

## Input

- `packageJson` (string | object): The package.json content as a JSON string or parsed object

## Output

Returns an object with:

- `issues` (array): List of dependency issues found
  - `type`: Issue type (e.g., 'deprecated-package', 'unstable-version')
  - `severity`: 'error' | 'warning' | 'info'
  - `package`: Package name
  - `version`: Version string
  - `message`: Description of the issue
  - `suggestion`: Recommended fix
- `recommendations` (array): General recommendations
  - `category`: Recommendation category
  - `message`: Recommendation text
  - `priority`: 'high' | 'medium' | 'low'
- `dependencyCount`: Counts by type
  - `total`: Total dependencies
  - `dependencies`: Production dependencies count
  - `devDependencies`: Dev dependencies count
  - `peerDependencies`: Peer dependencies count
- `summary`: Issue counts by severity
  - `errors`: Number of errors
  - `warnings`: Number of warnings
  - `info`: Number of info items

## Example

```typescript
const packageJson = {
  "name": "my-app",
  "dependencies": {
    "express": "^4.18.0",
    "moment": "^2.29.0",      // Deprecated
    "react": "^0.14.0"         // Unstable version with caret
  },
  "devDependencies": {
    "jest": "*"                // Wildcard version
  }
};

const audit = await dependencyAuditLite.execute({ packageJson });

console.log(audit.summary);
// { errors: 1, warnings: 2, info: 0 }

console.log(audit.issues);
// [
//   {
//     type: 'deprecated-package',
//     severity: 'warning',
//     package: 'moment',
//     version: '^2.29.0',
//     message: "Package 'moment' is deprecated",
//     suggestion: 'Consider migrating to date-fns, dayjs, or luxon'
//   },
//   ...
// ]
```

## Detected Issues

### Deprecated Packages
- node-sass → sass (Dart Sass)
- request → axios, node-fetch, or native fetch
- moment → date-fns, dayjs, or luxon
- tslint → eslint with @typescript-eslint
- And more...

### Version Patterns
- `^0.x.x` - Unstable versions with caret allow breaking changes
- `*` - Wildcard versions are not reproducible
- `>=x.x.x` - Unbounded ranges may break with major updates
- `latest` - Latest tag is not reproducible
- Git URLs - May cause lock file issues
- File/link protocols - Won't work in production

### Misplaced Dependencies
- Build tools in dependencies → should be devDependencies
- Test frameworks in dependencies → should be devDependencies

## License

MIT
