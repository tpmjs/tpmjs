# @tpmjs/tools-markdown-lint-basic

Basic markdown linting to check for common issues.

## Features

- Checks for trailing whitespace
- Detects multiple consecutive blank lines
- Validates heading hierarchy (no skipping levels)
- Ensures blank lines around headings
- Checks for consistent list marker style
- Detects hard tabs (recommends spaces)
- Validates code block language specification
- Checks link formatting (no bare URLs, no empty links)

## Installation

```bash
npm install @tpmjs/tools-markdown-lint-basic
```

## Usage

```typescript
import { markdownLintBasicTool } from '@tpmjs/tools-markdown-lint-basic';

const result = await markdownLintBasicTool.execute({
  markdown: `
# Title
## Section 1
#### Subsection (skips h3)

Some text with trailing spaces

Bare URL: https://example.com
`,
});

console.log(result.passed); // false (has errors)
console.log(result.summary);
// {
//   errors: 1,
//   warnings: 2,
//   totalLines: 8,
//   rulesChecked: ['no-trailing-spaces', 'no-multiple-blanks', ...]
// }

console.log(result.issues);
// [
//   {
//     rule: 'heading-increment',
//     severity: 'error',
//     line: 4,
//     message: 'Heading level 4 skips level 3',
//     context: '#### Subsection (skips h3)'
//   },
//   ...
// ]
```

## API

### `markdownLintBasicTool.execute(input)`

#### Input

- `markdown` (string, required): The markdown content to lint

#### Output

Returns a `LintResult` object:

```typescript
interface LintResult {
  issues: LintIssue[];
  passed: boolean;           // true if no errors (warnings are OK)
  summary: {
    errors: number;
    warnings: number;
    totalLines: number;
    rulesChecked: string[];
  };
}

interface LintIssue {
  rule: string;              // Rule identifier
  severity: 'error' | 'warning';
  line: number;              // Line number where issue occurs
  column?: number;           // Optional column number
  message: string;           // Human-readable message
  context?: string;          // Code snippet showing the issue
}
```

## Rules

### Errors (must fix)

- **heading-increment**: Headings must not skip levels (e.g., h1 → h3)
- **no-hard-tabs**: Hard tabs are not allowed (use spaces)
- **no-empty-links**: Link text cannot be empty

### Warnings (should fix)

- **no-trailing-spaces**: Lines should not have trailing whitespace
- **no-multiple-blanks**: No more than 2 consecutive blank lines
- **blanks-around-headings**: Headings should have blank lines before/after
- **list-marker-style**: Use consistent list markers (-, *, or +)
- **fenced-code-language**: Code blocks should specify a language
- **no-bare-urls**: URLs should be formatted as markdown links

## Examples

### Check for Errors Only

```typescript
const result = await markdownLintBasicTool.execute({ markdown });

if (!result.passed) {
  const errors = result.issues.filter(i => i.severity === 'error');
  console.error(`Found ${errors.length} errors:`);
  for (const error of errors) {
    console.error(`Line ${error.line}: ${error.message}`);
  }
}
```

### Format Issue Report

```typescript
const result = await markdownLintBasicTool.execute({ markdown });

for (const issue of result.issues) {
  const icon = issue.severity === 'error' ? '❌' : '⚠️';
  console.log(`${icon} Line ${issue.line}: ${issue.message}`);
  if (issue.context) {
    console.log(`   ${issue.context}`);
  }
}
```

### Group by Rule

```typescript
const result = await markdownLintBasicTool.execute({ markdown });

const byRule = new Map<string, LintIssue[]>();
for (const issue of result.issues) {
  if (!byRule.has(issue.rule)) {
    byRule.set(issue.rule, []);
  }
  byRule.get(issue.rule)!.push(issue);
}

for (const [rule, issues] of byRule) {
  console.log(`${rule}: ${issues.length} issues`);
}
```

## Use Cases

- Pre-commit hooks for documentation
- CI/CD markdown validation
- Documentation quality checks
- Style guide enforcement
- Automated code review

## License

MIT
