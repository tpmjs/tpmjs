# @tpmjs/tools-postmortem-action-extractor

Extract action items from postmortem and incident review documents with automatic detection of owners, priorities, and due dates.

## Installation

```bash
npm install @tpmjs/tools-postmortem-action-extractor
```

## Usage

```typescript
import { postmortemActionExtractorTool } from '@tpmjs/tools-postmortem-action-extractor';

const postmortemText = `
## Incident Summary
Database outage on 2024-01-15 from 14:00 to 14:45 UTC

## Actions

- Add monitoring for connection pool exhaustion (@john) [P0] due: 2024-01-20
- Update runbook with connection reset procedure (@sarah) [P1]
- Review and increase connection pool limits (devops team) [P2] within 7 days
- Schedule architecture review to discuss scaling strategy

## Follow-up
TODO: Document the incident in knowledge base (@mike)
`;

const result = await postmortemActionExtractorTool.execute({
  text: postmortemText
});

console.log(result.actions);
// [
//   {
//     action: "Add monitoring for connection pool exhaustion",
//     owner: "john",
//     priority: "high",
//     dueDate: "2024-01-20",
//     context: "Actions"
//   },
//   ...
// ]
console.log(result.count); // 5
```

## Input

- `text` (string, required): Postmortem or incident review text to analyze

## Output

Returns an object with:

- `actions` (array): Array of extracted action items, each containing:
  - `action` (string): The action item text (cleaned)
  - `owner` (string, optional): Person assigned to the action
  - `priority` (string, optional): 'high', 'medium', or 'low'
  - `dueDate` (string, optional): Due date in YYYY-MM-DD format
  - `context` (string, optional): Section header where action was found
- `count` (number): Total number of actions extracted
- `metadata` (object):
  - `extractedAt`: ISO timestamp of extraction
  - `textLength`: Length of input text
  - `hasOwners`: Number of actions with assigned owners
  - `hasPriorities`: Number of actions with priorities
  - `hasDueDates`: Number of actions with due dates

## Detected Patterns

### Action Items
- `Action:`, `TODO:`, `Follow-up:`, `Next step:`
- `[action]`, `[todo]`, `[follow-up]`
- Bullet points in "Actions" or "Action Items" sections
- Phrases like "we should", "we need to", "team must"

### Owners
- `(@username)` or `@username`
- `assigned to username`
- `owner: username`
- `[owner: username]`

### Priorities
- `[P0]`, `[P1]`, `[P2]`, `[P3]` (high, high, medium, low)
- `priority: high/medium/low`
- Emoji indicators: 🔴 (high), ⚠️ (high)
- Keywords: critical, urgent (high)

### Due Dates
- `due: 2024-01-20`
- `by 2024-01-20`
- `[due: 2024-01-20]`
- `deadline: 2024-01-20`
- Relative: `within 3 days`, `in 2 weeks` (converted to absolute dates)

## Features

- **Multiple Detection Strategies**: Finds actions in both structured sections and inline throughout the document
- **Automatic Deduplication**: Removes duplicate action items
- **Priority Sorting**: Actions are sorted by priority (high → medium → low → none)
- **Flexible Formats**: Supports various postmortem formats and styles
- **Context Preservation**: Tracks which section an action came from

## Example Formats Supported

### Section-based
```markdown
## Actions
- Implement retry logic (@alice) [P1]
- Add integration tests (@bob)
```

### Inline
```markdown
Action: Update the deployment guide with new steps (@charlie) due: 2024-02-01
TODO: Review error handling in payment service [P0]
```

### Natural Language
```markdown
We should add monitoring for this metric within 7 days.
The team needs to review the architecture by 2024-03-15.
```

## License

MIT
