# @tpmjs/tools-conventional-commit-suggest

Suggests conventional commit messages from descriptions or file changes following the Conventional Commits specification.

## Installation

```bash
npm install @tpmjs/tools-conventional-commit-suggest
```

## Usage

```typescript
import { conventionalCommitSuggest } from '@tpmjs/tools-conventional-commit-suggest';
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: {
    conventionalCommitSuggest,
  },
  prompt: 'Suggest a commit message for adding a new login feature',
});
```

## Tool Details

### conventionalCommitSuggest

Suggests a conventional commit message based on a description of changes and optionally a list of changed files.

**Parameters:**

- `description` (string, required) - Description of the changes made
- `files` (array of strings, optional) - Changed file paths to help determine scope

**Returns:**

```typescript
{
  message: string;        // The commit message subject line
  type: CommitType;       // feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
  scope: string | null;   // The scope (usually derived from files)
  breaking: boolean;      // Whether this is a breaking change
  body: string | null;    // Optional commit body
  fullMessage: string;    // Complete commit message with body
  explanation: string;    // Explanation of the commit type
}
```

## Example Output

**Input:**
```typescript
{
  description: "added dark mode toggle to settings page",
  files: ["src/components/settings/ThemeToggle.tsx", "src/components/settings/Settings.tsx"]
}
```

**Output:**
```typescript
{
  message: "feat(settings): add dark mode toggle to settings page",
  type: "feat",
  scope: "settings",
  breaking: false,
  body: "Files changed:\n- src/components/settings/ThemeToggle.tsx\n- src/components/settings/Settings.tsx",
  fullMessage: "feat(settings): add dark mode toggle to settings page\n\nFiles changed:\n- src/components/settings/ThemeToggle.tsx\n- src/components/settings/Settings.tsx",
  explanation: "A new feature"
}
```

## Conventional Commits Specification

This tool follows the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Commit Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, whitespace)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvement
- **test**: Adding or updating tests
- **build**: Changes to build system or dependencies
- **ci**: Changes to CI/CD configuration
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Breaking Changes

Breaking changes are indicated with `!` after the type/scope:

```
feat(api)!: remove deprecated endpoints
```

## Features

- Automatically determines commit type from description
- Extracts scope from file paths
- Detects breaking changes
- Generates commit body with file list
- Follows Conventional Commits specification
- Provides explanation for suggested type

## License

MIT
