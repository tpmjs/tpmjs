# @tpmjs/tools-runbook-draft

Draft operational runbooks from procedure steps with commands and verification.

## Installation

```bash
npm install @tpmjs/tools-runbook-draft
```

## Usage

```typescript
import { runbookDraftTool } from '@tpmjs/tools-runbook-draft';

const result = await runbookDraftTool.execute({
  title: 'Database Migration Runbook',
  steps: [
    {
      action: 'Backup the database',
      command: 'pg_dump mydb > backup.sql',
      verification: 'Check that backup.sql exists and has content',
    },
    {
      action: 'Stop the application',
      command: 'systemctl stop myapp',
      verification: 'Run systemctl status myapp to confirm stopped',
    },
    {
      action: 'Run migrations',
      command: 'npm run migrate',
      verification: 'Check migration logs for errors',
    },
    {
      action: 'Start the application',
      command: 'systemctl start myapp',
      verification: 'Run systemctl status myapp to confirm running',
    },
  ],
});

console.log(result.runbook);
// Markdown-formatted runbook with all steps
console.log(`Steps: ${result.stepCount}`);
console.log(`Has commands: ${result.hasCommands}`);
```

## Features

- Generates structured markdown runbooks
- Supports optional command examples in code blocks
- Includes verification steps for each action
- Automatically adds prerequisites section when commands are present
- Timestamps generation for version tracking

## Input

### RunbookDraftInput

- `title` (string, required): Title of the runbook
- `steps` (array, required): Array of procedure steps

### RunbookStep

- `action` (string, required): Description of the action to perform
- `command` (string, optional): Command to execute
- `verification` (string, optional): Verification step to confirm success

## Output

### RunbookDraft

- `runbook` (string): Markdown-formatted runbook document
- `stepCount` (number): Number of steps in the runbook
- `hasCommands` (boolean): Whether any steps include commands

## License

MIT
