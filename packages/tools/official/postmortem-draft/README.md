# @tpmjs/tools-postmortem-draft

Draft postmortem documents from incident details with timeline and action items.

## Installation

```bash
npm install @tpmjs/tools-postmortem-draft
```

## Usage

```typescript
import { postmortemDraftTool } from '@tpmjs/tools-postmortem-draft';

const result = await postmortemDraftTool.execute({
  title: 'Database Connection Pool Exhaustion',
  timeline: [
    {
      time: '2025-01-15T14:23:00Z',
      event: 'First alerts for elevated error rates',
    },
    {
      time: '2025-01-15T14:25:00Z',
      event: 'Connection pool exhaustion confirmed',
    },
    {
      time: '2025-01-15T14:30:00Z',
      event: 'Emergency pool size increase deployed',
    },
    {
      time: '2025-01-15T14:35:00Z',
      event: 'Service restored, errors subsiding',
    },
    {
      time: '2025-01-15T14:45:00Z',
      event: 'Incident resolved, monitoring continues',
    },
  ],
  rootCause:
    'Database connection pool size was set to 10 connections, which was insufficient for peak traffic. A code deployment earlier that day introduced a connection leak that slowly exhausted the pool.',
  actionItems: [
    'Increase connection pool size from 10 to 50',
    'Add connection pool monitoring and alerting',
    'Review code for connection leaks and add tests',
    'Implement circuit breaker pattern for database calls',
  ],
});

console.log(result.postmortem);
// Markdown-formatted postmortem document
console.log(`Severity: ${result.severity}`);
console.log(`Duration: ${result.duration}`);
```

## Features

- Generates structured markdown postmortem documents
- Automatically calculates incident duration from timeline
- Assesses severity based on incident characteristics
- Includes timeline, root cause, and action items
- Follows SRE postmortem best practices
- Adds placeholder sections for team review

## Input

### PostmortemDraftInput

- `title` (string, required): Title of the incident
- `timeline` (array, required): Array of timeline events
- `rootCause` (string, required): Root cause analysis
- `actionItems` (array, required): Array of action items

### TimelineEvent

- `time` (string, required): Timestamp of the event (ISO 8601 recommended)
- `event` (string, required): Description of what happened

## Output

### PostmortemDraft

- `postmortem` (string): Markdown-formatted postmortem document
- `severity` (string): Assessed severity ('low' | 'medium' | 'high' | 'critical')
- `duration` (string | null): Calculated incident duration

## Severity Assessment

The tool automatically assesses severity based on keywords and timeline:

- **Critical**: Complete outage, data loss, security breach
- **High**: Major outage, service down, significant customer impact
- **Medium**: Degraded performance, partial outage
- **Low**: Minor issues, minimal impact

## License

MIT
