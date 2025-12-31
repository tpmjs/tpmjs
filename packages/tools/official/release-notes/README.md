# @tpmjs/tools-release-notes

Generate release notes from structured changes. Groups changes by type and formats them as markdown.

## Installation

```bash
npm install @tpmjs/tools-release-notes ai
```

## Usage

```typescript
import { releaseNotesTool } from '@tpmjs/tools-release-notes';

const result = await releaseNotesTool.execute({
  version: 'v1.2.0',
  changes: [
    {
      type: 'feature',
      description: 'Add dark mode support',
      issue: '123',
    },
    {
      type: 'fix',
      description: 'Fix memory leak in cache manager',
      issue: '456',
    },
    {
      type: 'breaking',
      description: 'Remove deprecated API methods',
    },
    {
      type: 'docs',
      description: 'Update installation guide',
    },
  ],
});

console.log(result.notes);
```

### Output

```markdown
# v1.2.0 (2025-12-31)

⚠️ **This release contains breaking changes!**

**Changes:** 4 total (1 feature, 1 fix, 1 breaking, 1 other)

---

## 💥 BREAKING CHANGES

- Remove deprecated API methods

## ✨ Features

- Add dark mode support ([#123](../../issues/123))

## 🐛 Bug Fixes

- Fix memory leak in cache manager ([#456](../../issues/456))

## 📝 Documentation

- Update installation guide
```

## Features

- Groups changes by type with emojis
- Highlights breaking changes at the top
- Generates summary statistics
- Links to GitHub issues (if provided)
- Clean markdown formatting
- Automatic date generation

## Parameters

- `version` (string, required) - Version number (e.g., "1.2.0", "v2.0.0-beta.1")
- `changes` (array, required) - Array of change objects:
  - `type` (string) - One of: `feature`, `fix`, `breaking`, `docs`, `chore`, `perf`, `refactor`, `test`, `other`
  - `description` (string) - Description of the change
  - `issue` (string, optional) - Issue number (e.g., "123")

## Returns

```typescript
{
  notes: string;           // Formatted markdown
  version: string;         // Version number
  date: string;           // ISO date (YYYY-MM-DD)
  summary: {
    features: number;
    fixes: number;
    breaking: number;
    other: number;
    total: number;
  };
}
```

## Change Types

The tool supports the following change types:

- `feature` - New features
- `fix` - Bug fixes
- `breaking` - Breaking changes
- `docs` - Documentation updates
- `chore` - Maintenance tasks
- `perf` - Performance improvements
- `refactor` - Code refactoring
- `test` - Test updates
- `other` - Other changes

## License

MIT
