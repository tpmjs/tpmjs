# @tpmjs/tools-decision-record-adr

Create Architecture Decision Records (ADR) from structured input following industry standards.

## Installation

```bash
npm install @tpmjs/tools-decision-record-adr
```

## Usage

```typescript
import { decisionRecordADRTool } from '@tpmjs/tools-decision-record-adr';

const result = await decisionRecordADRTool.execute({
  title: 'Use PostgreSQL for primary database',
  context: `We need to choose a database for our new application. Requirements include:
    ACID compliance, strong consistency, support for complex queries, and good TypeScript integration.
    Team has experience with both SQL and NoSQL databases.`,
  decision: `We will use PostgreSQL as our primary database with Prisma as the ORM.
    This provides strong typing, migrations, and excellent developer experience.`,
  consequences: [
    'Better type safety with Prisma client',
    'Strong consistency guarantees for critical data',
    'Team needs to learn Prisma migrations',
    'Increased complexity for horizontal scaling',
    'Excellent JSON support for flexible schemas',
  ],
});

console.log(result.adr);
// # Use PostgreSQL for primary database
//
// **Status:** Accepted
//
// **Date:** 2025-12-31
//
// **Filename:** `use-postgresql-for-primary-database.md`
//
// ## Context
//
// We need to choose a database for our new application...
//
// ## Decision
//
// We will use PostgreSQL as our primary database...
//
// ## Consequences
//
// ### Positive
//
// - Better type safety with Prisma client
// - Strong consistency guarantees for critical data
// - Excellent JSON support for flexible schemas
//
// ### Negative
//
// - Team needs to learn Prisma migrations
// - Increased complexity for horizontal scaling

console.log(result.date);   // '2025-12-31'
console.log(result.status); // 'Accepted'
```

## API

### `decisionRecordADRTool.execute(input)`

Creates an Architecture Decision Record (ADR) following the standard template.

#### Input

- `title` (string, required): Title of the decision
- `context` (string, required): Context and background for the decision
- `decision` (string, required): The decision that was made
- `consequences` (string[], required): Array of consequences (positive and negative)

#### Output

Returns a `Promise<DecisionRecord>` with:

- `adr` (string): The formatted ADR in markdown
- `date` (string): Date the ADR was created (YYYY-MM-DD)
- `status` (string): Status of the decision (default: "Accepted")

## Features

- **Standard ADR format**: Follows the widely-used ADR template structure
- **Smart categorization**: Automatically categorizes consequences as positive, negative, or neutral
- **Filename generation**: Creates a URL-friendly filename from the title
- **Markdown output**: Returns clean, readable markdown ready for version control
- **Date stamping**: Automatically includes creation date

## ADR Structure

The tool generates ADRs with this structure:

1. **Title**: Clear, concise decision statement
2. **Status**: Decision status (Accepted, Proposed, Deprecated, Superseded)
3. **Date**: When the decision was made
4. **Context**: Background and forces leading to the decision
5. **Decision**: What was decided
6. **Consequences**: Categorized outcomes (positive, negative, other)

## Use Cases

- Document architectural decisions in software projects
- Track technical choices and rationale over time
- Share decision context with team members
- Create decision history for future reference
- Support onboarding with decision background

## Best Practices

- Write context focusing on **why** the decision was needed
- State the decision clearly and unambiguously
- List both positive and negative consequences
- Include trade-offs and alternatives considered
- Version control ADRs alongside code

## License

MIT
