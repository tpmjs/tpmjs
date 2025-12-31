# @tpmjs/tools-acceptance-criteria

Format acceptance criteria from requirements using Given/When/Then (Gherkin) format.

## Installation

```bash
npm install @tpmjs/tools-acceptance-criteria
```

## Usage

```typescript
import { acceptanceCriteriaTool } from '@tpmjs/tools-acceptance-criteria';

const result = await acceptanceCriteriaTool.execute({
  story: `As a user, I want to reset my password so that I can regain access to my account
    if I forget my credentials.`,
  criteria: [
    {
      given: 'I am on the login page',
      when: 'I click "Forgot Password"',
      then: 'I should see a password reset form',
    },
    {
      given: 'I have entered my email address',
      when: 'I submit the password reset form',
      then: 'I should receive a password reset email',
    },
    {
      given: 'I have clicked the reset link in my email',
      when: 'I enter a new password and confirm it',
      then: 'my password should be updated and I should be logged in',
    },
  ],
});

console.log(result.formatted);
// # Acceptance Criteria
//
// ## As a user, I want to reset my password so that I can regain access to my account
//
// As a user, I want to reset my password so that I can regain access to my account
// if I forget my credentials.
//
// ---
//
// ## Scenarios
//
// ### Scenario 1
//
// **Given** I am on the login page
// **When** I click "Forgot Password"
// **Then** I should see a password reset form
//
// ### Scenario 2
//
// **Given** I have entered my email address
// **When** I submit the password reset form
// **Then** I should receive a password reset email
//
// ### Scenario 3
//
// **Given** I have clicked the reset link in my email
// **When** I enter a new password and confirm it
// **Then** my password should be updated and I should be logged in

console.log(result.criteriaCount); // 3
```

## API

### `acceptanceCriteriaTool.execute(input)`

Formats acceptance criteria using the Given/When/Then (Gherkin) format.

#### Input

- `story` (string, required): The user story or feature description
- `criteria` (Criterion[], required): Array of criteria objects with:
  - `given` (string): The initial context or precondition
  - `when` (string): The action or event that occurs
  - `then` (string): The expected outcome or result

#### Output

Returns a `Promise<AcceptanceCriteria>` with:

- `formatted` (string): The formatted acceptance criteria in markdown
- `criteriaCount` (number): Number of scenarios included

## Features

- **Gherkin format**: Uses industry-standard Given/When/Then structure
- **Clear scenarios**: Each criterion becomes a numbered scenario
- **Markdown output**: Returns clean, readable markdown
- **Validation**: Ensures all criteria have required fields
- **BDD-ready**: Output is ready for BDD testing frameworks

## Gherkin Structure

Each criterion follows the Gherkin format:

- **Given**: Describes the initial context or state
- **When**: Describes the action or event
- **Then**: Describes the expected outcome

This structure makes requirements:
- Testable
- Unambiguous
- Readable by non-technical stakeholders

## Use Cases

- Define acceptance criteria for user stories
- Create testable requirements for features
- Document expected behavior for QA
- Generate scenarios for BDD testing frameworks
- Communicate requirements between team members

## Best Practices

- Keep each scenario focused on a single path
- Use active voice ("I click", "the system displays")
- Be specific about expected outcomes
- Include both happy path and edge cases
- Write from the user's perspective

## Integration with BDD Tools

The formatted output works well with BDD frameworks like:
- Cucumber
- SpecFlow
- Behave
- JBehave

Simply copy the scenarios into your `.feature` files.

## License

MIT
