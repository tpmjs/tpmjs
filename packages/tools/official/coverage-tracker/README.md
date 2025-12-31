# Coverage Tracker

Tracks which tools have been used in a workflow and calculates coverage percentage. Useful for testing workflow completeness and analyzing tool utilization patterns.

## Installation

```bash
npm install @tpmjs/tools-coverage-tracker
```

## Usage

```typescript
import { coverageTrackerTool } from '@tpmjs/tools-coverage-tracker';
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: {
    trackCoverage: coverageTrackerTool,
  },
  prompt: 'Track tool usage coverage...',
});
```

## Direct Usage

```typescript
import { coverageTrackerTool } from '@tpmjs/tools-coverage-tracker';

const result = await coverageTrackerTool.execute({
  availableTools: ['searchWeb', 'fetchUrl', 'summarize', 'translateText', 'saveNote'],
  usedTools: ['searchWeb', 'fetchUrl', 'searchWeb', 'summarize'],
});

console.log(result);
// {
//   coverage: 0.6,
//   usedCount: 3,
//   totalCount: 5,
//   unusedTools: ['translateText', 'saveNote'],
//   usedTools: [
//     { name: 'searchWeb', used: true, usageCount: 2 },
//     { name: 'fetchUrl', used: true, usageCount: 1 },
//     { name: 'summarize', used: true, usageCount: 1 }
//   ],
//   coveragePercent: '60.0%',
//   summary: 'Coverage: 60.0% (3/5 tools) | Unused: translateText, saveNote'
// }
```

## Input Schema

```typescript
{
  availableTools: string[];  // All available tool names
  usedTools: string[];       // Tools that were actually used (can include duplicates)
}
```

## Output Schema

```typescript
{
  coverage: number;               // Coverage ratio (0-1)
  usedCount: number;              // Number of unique tools used
  totalCount: number;             // Total number of available tools
  unusedTools: string[];          // List of tools not used
  usedTools: Array<{              // List of used tools with stats
    name: string;                 // Tool name
    used: boolean;                // Always true for this array
    usageCount: number;           // How many times it was called
  }>;
  coveragePercent: string;        // Formatted percentage (e.g., "75.0%")
  summary: string;                // Human-readable summary
}
```

## Coverage Calculation

**Coverage** = `(Number of unique tools used) / (Total available tools)`

- Duplicate tool calls are counted separately in `usageCount`
- Coverage is based on unique tools used
- Tools used but not in `availableTools` trigger a warning

## Use Cases

### 1. Workflow Testing

Ensure your agent workflow exercises all available tools:

```typescript
const availableTools = ['search', 'analyze', 'summarize', 'report'];
const usedTools = ['search', 'analyze', 'report'];

const coverage = await coverageTrackerTool.execute({
  availableTools,
  usedTools,
});

if (coverage.coverage < 0.75) {
  console.warn('Low tool coverage - workflow may be incomplete');
}
```

### 2. Tool Utilization Analysis

Find which tools are being used most/least:

```typescript
const result = await coverageTrackerTool.execute({
  availableTools: ['tool1', 'tool2', 'tool3', 'tool4'],
  usedTools: ['tool1', 'tool1', 'tool1', 'tool2', 'tool2', 'tool3'],
});

// result.usedTools sorted by usage:
// [
//   { name: 'tool1', usageCount: 3 },
//   { name: 'tool2', usageCount: 2 },
//   { name: 'tool3', usageCount: 1 },
// ]
// result.unusedTools: ['tool4']
```

### 3. Integration Testing

Track tool coverage across test runs:

```typescript
const testRuns = [
  { name: 'Test 1', used: ['searchWeb', 'fetchUrl'] },
  { name: 'Test 2', used: ['searchWeb', 'summarize'] },
  { name: 'Test 3', used: ['translateText'] },
];

const allTools = ['searchWeb', 'fetchUrl', 'summarize', 'translateText'];

for (const run of testRuns) {
  const coverage = await coverageTrackerTool.execute({
    availableTools: allTools,
    usedTools: run.used,
  });
  console.log(`${run.name}: ${coverage.coveragePercent}`);
}
```

### 4. Finding Dead Code

Identify tools that are never used:

```typescript
const coverage = await coverageTrackerTool.execute({
  availableTools: ['common', 'rare', 'legacy', 'deprecated'],
  usedTools: ['common', 'common', 'common', 'rare'],
});

// coverage.unusedTools: ['legacy', 'deprecated']
// Consider removing these tools
```

## Advanced Features

### Duplicate Tracking

The tool tracks how many times each tool is called:

```typescript
const result = await coverageTrackerTool.execute({
  availableTools: ['api1', 'api2'],
  usedTools: ['api1', 'api1', 'api1', 'api2'],
});

// result.usedTools[0] = { name: 'api1', usageCount: 3 }
// result.usedTools[1] = { name: 'api2', usageCount: 1 }
```

### Unknown Tool Detection

Warns if tools are used that aren't in the available list:

```typescript
const result = await coverageTrackerTool.execute({
  availableTools: ['tool1', 'tool2'],
  usedTools: ['tool1', 'unknownTool'],
});

// result.summary: "... | Warning: 1 unknown tool(s) used"
```

## Examples

### Example 1: Full Coverage

```typescript
const result = await coverageTrackerTool.execute({
  availableTools: ['a', 'b', 'c'],
  usedTools: ['a', 'b', 'c'],
});
// coverage.coverage = 1.0
// coverage.coveragePercent = "100.0%"
// coverage.unusedTools = []
```

### Example 2: Partial Coverage

```typescript
const result = await coverageTrackerTool.execute({
  availableTools: ['search', 'fetch', 'save', 'analyze'],
  usedTools: ['search', 'fetch'],
});
// coverage.coverage = 0.5
// coverage.usedCount = 2
// coverage.unusedTools = ['save', 'analyze']
```

### Example 3: No Coverage

```typescript
const result = await coverageTrackerTool.execute({
  availableTools: ['tool1', 'tool2'],
  usedTools: [],
});
// coverage.coverage = 0
// coverage.unusedTools = ['tool1', 'tool2']
```

## License

MIT
