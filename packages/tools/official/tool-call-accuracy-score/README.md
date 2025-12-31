# Tool Call Accuracy Score

Scores the accuracy of actual tool calls against expected tool calls in agent workflows. Useful for testing and evaluating agent behavior.

## Installation

```bash
npm install @tpmjs/tools-tool-call-accuracy-score
```

## Usage

```typescript
import { toolCallAccuracyScoreTool } from '@tpmjs/tools-tool-call-accuracy-score';
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: {
    scoreToolCalls: toolCallAccuracyScoreTool,
  },
  prompt: 'Score these tool calls...',
});
```

## Direct Usage

```typescript
import { toolCallAccuracyScoreTool } from '@tpmjs/tools-tool-call-accuracy-score';

const result = await toolCallAccuracyScoreTool.execute({
  expected: [
    { tool: 'searchWeb', args: { query: 'AI news' } },
    { tool: 'summarize', args: { text: 'long article...' } },
  ],
  actual: [
    { tool: 'searchWeb', args: { query: 'AI news' } },
    { tool: 'summarize', args: { text: 'different text' } },
    { tool: 'translateText', args: { text: 'hello', to: 'es' } },
  ],
});

console.log(result);
// {
//   score: 0.667,
//   totalExpected: 2,
//   totalActual: 3,
//   correctCalls: [{ expected: {...}, actual: {...}, status: 'correct', argsMatch: true }],
//   incorrectCalls: [{ expected: {...}, actual: {...}, status: 'incorrect', argsMatch: false }],
//   missedCalls: [],
//   extraCalls: [{ tool: 'translateText', args: {...} }],
//   summary: 'Accuracy Score: 66.7% | Correct: 1/2 | Incorrect: 1 | Missed: 0 | Extra: 1'
// }
```

## Input Schema

```typescript
{
  expected: Array<{
    tool: string;      // Name of the tool
    args: object;      // Arguments passed to the tool
  }>;
  actual: Array<{
    tool: string;      // Name of the tool
    args: object;      // Arguments passed to the tool
  }>;
}
```

## Output Schema

```typescript
{
  score: number;                    // F1 score (0-1) based on precision and recall
  totalExpected: number;            // Number of expected tool calls
  totalActual: number;              // Number of actual tool calls made
  correctCalls: Array<{             // Calls that matched perfectly
    expected: ToolCall;
    actual: ToolCall;
    status: 'correct';
    argsMatch: true;
  }>;
  incorrectCalls: Array<{           // Calls with correct tool but wrong args
    expected: ToolCall;
    actual: ToolCall;
    status: 'incorrect';
    argsMatch: false;
    details: string;
  }>;
  missedCalls: Array<{              // Expected calls that weren't made
    expected: ToolCall;
    status: 'missed';
    argsMatch: false;
    details: string;
  }>;
  extraCalls: ToolCall[];           // Unexpected calls that were made
  summary: string;                  // Human-readable summary
}
```

## Scoring Algorithm

The tool uses an **F1 score** approach:

- **Precision**: `correctCalls / totalActual` - How many actual calls were correct?
- **Recall**: `correctCalls / totalExpected` - How many expected calls were made?
- **F1 Score**: `2 * (precision * recall) / (precision + recall)` - Harmonic mean

This balances both making the right calls and avoiding extra/incorrect calls.

### Matching Logic

1. **Perfect Match**: Tool name and arguments match exactly → `correctCalls`
2. **Partial Match**: Tool name matches but arguments differ → `incorrectCalls`
3. **No Match**: Expected call not found in actual → `missedCalls`
4. **Extra**: Actual call not matched to any expected → `extraCalls`

Arguments are compared using deep equality (recursive object comparison).

## Use Cases

- **Agent Testing**: Validate that agents make the correct tool calls
- **Workflow Evaluation**: Score agent workflows against expected behavior
- **Regression Testing**: Ensure agent behavior doesn't degrade over time
- **A/B Testing**: Compare different agent configurations
- **Quality Metrics**: Track agent accuracy over time

## Example: Testing a Research Agent

```typescript
const expected = [
  { tool: 'searchWeb', args: { query: 'latest AI research 2024' } },
  { tool: 'fetchUrl', args: { url: 'https://arxiv.org/...' } },
  { tool: 'summarize', args: { maxLength: 500 } },
];

const actual = [
  { tool: 'searchWeb', args: { query: 'latest AI research 2024' } },
  { tool: 'fetchUrl', args: { url: 'https://arxiv.org/...' } },
  // Agent forgot to call summarize
];

const score = await toolCallAccuracyScoreTool.execute({ expected, actual });
// score.score = 0.8 (missed one expected call)
// score.missedCalls.length = 1
```

## License

MIT
