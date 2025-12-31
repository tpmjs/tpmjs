# Error Log Triage Tool

Triages error logs by severity and frequency, groups similar errors, and provides actionable recommendations for debugging.

## Installation

```bash
npm install @tpmjs/tools-error-log-triage
```

## Usage

```typescript
import { errorLogTriageTool } from '@tpmjs/tools-error-log-triage';

const result = await errorLogTriageTool.execute({
  logs: [
    {
      message: 'Database connection failed to postgres://localhost:5432',
      level: 'error',
      timestamp: '2025-01-15T10:30:00Z'
    },
    {
      message: 'Database connection failed to postgres://localhost:5433',
      level: 'error',
      timestamp: '2025-01-15T10:30:05Z'
    },
    {
      message: 'Null reference error at user.service.ts:45',
      level: 'error',
      timestamp: '2025-01-15T10:31:00Z'
    }
  ]
});

console.log(result);
// {
//   groups: [
//     {
//       pattern: 'Database connection failed to [URL]',
//       count: 2,
//       severity: 'error',
//       firstOccurrence: '2025-01-15T10:30:00Z',
//       lastOccurrence: '2025-01-15T10:30:05Z',
//       examples: [
//         'Database connection failed to postgres://localhost:5432',
//         'Database connection failed to postgres://localhost:5433'
//       ]
//     },
//     // ... more groups
//   ],
//   severityCounts: {
//     critical: 0,
//     error: 3,
//     warning: 0,
//     info: 0
//   },
//   recommendations: [
//     'Check network and database connectivity - 2 connection error(s) detected',
//     'Add null checks - 1 null/undefined reference error(s) detected'
//   ],
//   summary: {
//     totalLogs: 3,
//     uniquePatterns: 2,
//     timeRange: '2025-01-15T10:30:00Z to 2025-01-15T10:31:00Z'
//   }
// }
```

## Features

- **Pattern Recognition**: Groups similar errors by normalizing messages (removes IDs, paths, timestamps, URLs)
- **Severity Mapping**: Automatically maps log levels to standardized severities (critical, error, warning, info)
- **Time Tracking**: Tracks first and last occurrence of each error pattern
- **Smart Recommendations**: Generates actionable debugging recommendations based on error patterns
- **Frequency Analysis**: Identifies high-frequency errors that indicate systemic issues

## Input

```typescript
{
  logs: Array<{
    message: string;    // The error message or log text
    level: string;      // Log level (error, warning, info, critical, fatal, etc.)
    timestamp: string;  // ISO 8601 timestamp
  }>
}
```

## Output

```typescript
{
  groups: Array<{
    pattern: string;           // Normalized error pattern
    count: number;             // Number of occurrences
    severity: string;          // Mapped severity level
    firstOccurrence: string;   // ISO timestamp of first occurrence
    lastOccurrence: string;    // ISO timestamp of last occurrence
    examples: string[];        // Up to 3 example messages
  }>,
  severityCounts: {
    critical: number;
    error: number;
    warning: number;
    info: number;
  },
  recommendations: string[];   // Actionable debugging recommendations
  summary: {
    totalLogs: number;
    uniquePatterns: number;
    timeRange: string;
  }
}
```

## Pattern Normalization

The tool normalizes error messages to group similar errors:

- File paths → `[PATH]`
- UUIDs → `[UUID]`
- IDs → `[ID]`
- Timestamps → `[TIMESTAMP]`
- URLs → `[URL]`
- IP addresses → `[IP]`
- Line numbers → `[LINE]`
- Generic numbers → `[NUM]`

Example:
```
"Error in /app/user.service.ts:45 for user ID 12345"
→ "Error in [PATH]:[LINE] for user ID [ID]"
```

## License

MIT
