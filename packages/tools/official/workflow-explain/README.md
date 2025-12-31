# @tpmjs/tools-workflow-explain

Explains what a workflow does in plain language. Analyzes workflow steps and generates human-readable explanations with complexity assessments.

## Installation

```bash
npm install @tpmjs/tools-workflow-explain
```

## Usage

```typescript
import { workflowExplainTool } from '@tpmjs/tools-workflow-explain';

const result = await workflowExplainTool.execute({
  workflow: {
    name: 'User Onboarding',
    description: 'Onboards new users to the platform',
    steps: [
      {
        tool: 'validateEmail',
        inputs: { email: 'string' },
        outputs: { isValid: 'boolean' },
        description: 'Validates user email address',
      },
      {
        tool: 'createAccount',
        inputs: { email: 'string', password: 'string' },
        outputs: { userId: 'string', accountId: 'string' },
      },
      {
        tool: 'sendWelcomeEmail',
        inputs: { userId: 'string', email: 'string' },
        outputs: { sent: 'boolean' },
      },
    ],
  },
});

console.log(result);
// {
//   explanation: 'This workflow "User Onboarding" onboards new users...',
//   stepSummaries: [
//     {
//       stepNumber: 1,
//       tool: 'validateEmail',
//       action: 'Validates user email address',
//       inputSummary: 'using email',
//       outputSummary: 'producing isValid'
//     },
//     ...
//   ],
//   complexity: 'simple',
//   metrics: {
//     totalSteps: 3,
//     uniqueTools: 3,
//     estimatedDuration: '< 1 minute',
//     hasConditionals: false,
//     hasLoops: false
//   }
// }
```

## Features

- **Plain Language**: Converts technical workflow definitions into readable explanations
- **Step Analysis**: Breaks down each step with action descriptions and I/O summaries
- **Complexity Assessment**: Automatically categorizes workflows as simple, moderate, complex, or very-complex
- **Pattern Detection**: Identifies conditionals, loops, and other advanced patterns
- **Duration Estimation**: Estimates workflow execution time based on step count

## Input Schema

```typescript
{
  workflow: {
    name: string;              // Workflow name
    steps: Array<{             // Workflow steps
      tool: string;            // Tool name
      inputs?: object;         // Input parameters
      outputs?: object;        // Output values
      description?: string;    // Optional step description
    }>;
    description?: string;      // Optional workflow description
    metadata?: object;         // Optional metadata
  };
}
```

## Output Schema

```typescript
{
  explanation: string;         // Overall workflow explanation
  stepSummaries: Array<{       // Summary for each step
    stepNumber: number;
    tool: string;
    action: string;            // What the step does
    inputSummary: string;      // Human-readable input summary
    outputSummary: string;     // Human-readable output summary
  }>;
  complexity: 'simple' | 'moderate' | 'complex' | 'very-complex';
  metrics: {
    totalSteps: number;
    uniqueTools: number;
    estimatedDuration: string;
    hasConditionals: boolean;
    hasLoops: boolean;
  };
}
```

## Complexity Levels

- **Simple**: 1-3 steps, no conditionals or loops
- **Moderate**: 4-7 steps, up to 5 unique tools
- **Complex**: 8-15 steps or has conditionals/loops
- **Very Complex**: 15+ steps

## License

MIT
