# @tpmjs/tools-prd-outline

Create PRD (Product Requirements Document) outlines from problem statements and features.

## Installation

```bash
npm install @tpmjs/tools-prd-outline
```

## Usage

```typescript
import { prdOutlineTool } from '@tpmjs/tools-prd-outline';

const result = await prdOutlineTool.execute({
  title: 'Real-time Collaboration Feature',
  problem:
    'Users currently cannot work together on documents in real-time, leading to version conflicts and inefficient workflows. Teams waste time merging changes and resolving conflicts.',
  goals: [
    'Enable multiple users to edit documents simultaneously',
    'Reduce version conflicts by 90%',
    'Improve team collaboration efficiency',
    'Support up to 50 concurrent users per document',
  ],
  features: [
    'Real-time cursor tracking',
    'Presence indicators showing active users',
    'Conflict-free collaborative editing',
    'Change history and rollback',
    'Comments and annotations',
  ],
});

console.log(result.prd);
// Markdown-formatted PRD document
console.log(`Sections: ${result.sections.join(', ')}`);
console.log(`Feature count: ${result.featureCount}`);
```

## Features

- Generates comprehensive PRD outlines
- Includes all standard PRD sections
- Provides structured feature templates
- Adds placeholder sections for team input
- Follows product management best practices
- Includes timeline and success metrics sections

## Input

### PrdOutlineInput

- `title` (string, required): Title of the product or feature
- `problem` (string, required): Problem statement describing what needs to be solved
- `goals` (array, required): Array of goals for the product or feature
- `features` (array, required): Array of features to include

## Output

### PrdOutline

- `prd` (string): Markdown-formatted PRD document
- `sections` (array): List of standard sections included
- `featureCount` (number): Number of features in the PRD

## Standard Sections

The generated PRD includes these sections:

1. **Overview** - High-level summary
2. **Problem Statement** - What problem are we solving?
3. **Goals** - What do we want to achieve?
4. **Features** - What will we build?
5. **User Stories** - Who will use this and how?
6. **Success Metrics** - How will we measure success?
7. **Technical Considerations** - Architecture, security, performance
8. **Timeline** - Key milestones and dates
9. **Open Questions** - Items to be resolved

## License

MIT
