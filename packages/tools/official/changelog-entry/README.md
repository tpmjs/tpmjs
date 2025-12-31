# @tpmjs/tools-changelog-entry

Generate changelog entries in Keep a Changelog format.

## Features

- Follows [Keep a Changelog](https://keepachangelog.com/) format
- Supports all standard change types: Added, Changed, Deprecated, Removed, Fixed, Security
- Validates semantic versioning
- Auto-formats dates in YYYY-MM-DD format
- Groups changes by type automatically

## Installation

```bash
npm install @tpmjs/tools-changelog-entry
```

## Usage

```typescript
import { changelogEntryTool } from '@tpmjs/tools-changelog-entry';

const result = await changelogEntryTool.execute({
  version: '1.2.0',
  changes: [
    { type: 'Added', description: 'New user authentication system' },
    { type: 'Added', description: 'Support for OAuth providers' },
    { type: 'Fixed', description: 'Memory leak in background worker' },
    { type: 'Changed', description: 'Improved error messages' },
    { type: 'Security', description: 'Updated dependencies to fix CVE-2024-1234' },
  ],
});

console.log(result.entry);
// ## [1.2.0] - 2025-12-31
//
// ### Added
//
// - New user authentication system
// - Support for OAuth providers
//
// ### Changed
//
// - Improved error messages
//
// ### Fixed
//
// - Memory leak in background worker
//
// ### Security
//
// - Updated dependencies to fix CVE-2024-1234

console.log(result.types); // ['Added', 'Changed', 'Fixed', 'Security']
console.log(result.date);  // '2025-12-31'
```

## API

### `changelogEntryTool.execute(input)`

#### Input

- `version` (string, required): Version number (e.g., '1.2.0', 'v1.2.0', or 'Unreleased')
- `changes` (array, required): Array of change objects
  - `type` (string, required): One of: Added, Changed, Deprecated, Removed, Fixed, Security
  - `description` (string, required): Description of the change
- `date` (string, optional): Release date in YYYY-MM-DD format. Defaults to today.

#### Output

Returns a `ChangelogEntry` object:

```typescript
interface ChangelogEntry {
  entry: string;      // Formatted markdown entry
  date: string;       // Release date (YYYY-MM-DD)
  types: string[];    // Change types used
  version: string;    // Version (normalized, without 'v' prefix)
}
```

## Change Types

Following [Keep a Changelog](https://keepachangelog.com/) guidelines:

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security fixes

## Examples

### Basic Release

```typescript
const result = await changelogEntryTool.execute({
  version: '2.0.0',
  changes: [
    { type: 'Added', description: 'Dark mode support' },
    { type: 'Removed', description: 'Legacy API endpoints' },
  ],
});
```

### Unreleased Changes

```typescript
const result = await changelogEntryTool.execute({
  version: 'Unreleased',
  changes: [
    { type: 'Added', description: 'Work in progress feature' },
  ],
});
```

### Custom Date

```typescript
const result = await changelogEntryTool.execute({
  version: '1.1.0',
  date: '2024-01-15',
  changes: [
    { type: 'Fixed', description: 'Critical bug in production' },
  ],
});
```

### Multiple Changes of Same Type

```typescript
const result = await changelogEntryTool.execute({
  version: '1.3.0',
  changes: [
    { type: 'Added', description: 'User profiles' },
    { type: 'Added', description: 'Settings page' },
    { type: 'Added', description: 'Email notifications' },
  ],
});

// ### Added
//
// - User profiles
// - Settings page
// - Email notifications
```

### From Commit Messages

```typescript
// Example: Parse commit messages and create changelog
const commits = [
  'feat: add dark mode toggle',
  'fix: resolve memory leak',
  'feat: implement user search',
];

const changes = commits.map(msg => {
  if (msg.startsWith('feat:')) {
    return { type: 'Added', description: msg.replace('feat: ', '') };
  }
  if (msg.startsWith('fix:')) {
    return { type: 'Fixed', description: msg.replace('fix: ', '') };
  }
  return null;
}).filter(Boolean);

const result = await changelogEntryTool.execute({
  version: '1.4.0',
  changes,
});
```

## Use Cases

- Automated changelog generation from commits
- Release notes creation
- Version documentation
- CI/CD changelog updates
- Project documentation automation

## Validation

The tool validates:

- Version format (semantic versioning or 'Unreleased')
- Change types (must be one of the 6 standard types)
- Change descriptions (must be non-empty strings)
- Date format (must be valid date)

Invalid inputs will throw descriptive errors.

## License

MIT
