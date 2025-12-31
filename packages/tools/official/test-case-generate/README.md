# Test Case Generate Tool

Generates comprehensive test case outlines from function signatures, including normal cases, edge cases, and error cases.

## Installation

```bash
npm install @tpmjs/tools-test-case-generate
```

## Usage

```typescript
import { testCaseGenerateTool } from '@tpmjs/tools-test-case-generate';

const result = await testCaseGenerateTool.execute({
  functionName: 'calculateTotal',
  params: [
    { name: 'items', type: 'Array<number>' },
    { name: 'discount', type: 'number' },
    { name: 'taxRate', type: 'optional number' }
  ],
  returnType: 'number'
});

console.log(result);
// {
//   testCases: [
//     {
//       name: 'should handle valid inputs',
//       description: 'Test calculateTotal with standard valid inputs',
//       input: { items: [1, 2, 3], discount: 42, taxRate: 42 },
//       expectedBehavior: 'Should return number successfully',
//       category: 'normal'
//     },
//     // ... more test cases
//   ],
//   edgeCases: [
//     {
//       name: 'should handle items as empty array',
//       description: 'Test calculateTotal when items is empty array',
//       input: { items: [], discount: 42, taxRate: 42 },
//       expectedBehavior: 'Should handle gracefully and return number',
//       category: 'edge'
//     },
//     // ... more edge cases
//   ],
//   summary: {
//     totalCases: 25,
//     normalCases: 1,
//     edgeCases: 18,
//     errorCases: 6,
//     coverageAreas: [
//       'Happy path with valid inputs',
//       'Boundary values (min/max)',
//       'Array edge cases (empty, single element, large size)',
//       'Type validation and error handling'
//     ]
//   },
//   recommendations: [
//     'Verify immutability - ensure function does not mutate input arrays',
//     'Test floating-point precision edge cases (e.g., 0.1 + 0.2)',
//     'Use property-based testing for comprehensive coverage',
//     // ... more recommendations
//   ]
// }
```

## Features

- **Type-Aware Generation**: Automatically generates relevant test cases based on parameter types
- **Edge Case Detection**: Identifies boundary conditions, empty values, and special cases
- **Error Case Coverage**: Generates tests for invalid inputs and error conditions
- **Smart Recommendations**: Provides testing best practices based on function signature
- **Coverage Analysis**: Identifies areas of test coverage needed

## Supported Types

The tool intelligently generates test cases for:

- **Primitives**: `string`, `number`, `boolean`
- **Arrays**: `Array<T>`, `T[]`
- **Objects**: `object`, `Record<K,V>`, custom types
- **Dates**: `Date`, date strings
- **Async**: `Promise<T>`, async functions
- **Optional**: `optional T`, `T?`, `T | null | undefined`

## Input

```typescript
{
  functionName: string;          // Name of the function
  params: Array<{
    name: string;                // Parameter name
    type: string;                // Parameter type (TypeScript syntax)
  }>;
  returnType: string;            // Return type
}
```

## Output

```typescript
{
  testCases: Array<{
    name: string;                // Test case name
    description: string;         // Detailed description
    input: Record<string, any>;  // Test input values
    expectedBehavior: string;    // Expected outcome
    category: 'normal' | 'edge' | 'error';
  }>;
  edgeCases: TestCase[];         // Additional edge cases
  summary: {
    totalCases: number;
    normalCases: number;
    edgeCases: number;
    errorCases: number;
    coverageAreas: string[];     // Areas of coverage
  };
  recommendations: string[];     // Testing best practices
}
```

## Examples

### Simple Function

```typescript
const result = await testCaseGenerateTool.execute({
  functionName: 'isValidEmail',
  params: [
    { name: 'email', type: 'string' }
  ],
  returnType: 'boolean'
});
// Generates tests for:
// - Valid email
// - Empty string
// - Whitespace
// - Very long email
// - Unicode characters
```

### Async Function

```typescript
const result = await testCaseGenerateTool.execute({
  functionName: 'fetchUser',
  params: [
    { name: 'userId', type: 'string' }
  ],
  returnType: 'Promise<User>'
});
// Generates additional async tests:
// - Concurrent calls
// - Timeout scenarios
// - Promise rejection
```

### Complex Function

```typescript
const result = await testCaseGenerateTool.execute({
  functionName: 'processData',
  params: [
    { name: 'data', type: 'Array<Record<string, any>>' },
    { name: 'options', type: 'optional object' }
  ],
  returnType: 'object'
});
// Generates comprehensive coverage including:
// - Empty arrays
// - Large datasets
// - Nested objects
// - Missing optional params
// - Immutability tests
```

## Best Practices

1. **Use Generated Cases as Templates**: The tool provides outlines - add specific assertions and mocks
2. **Combine with Property-Based Testing**: Use tools like fast-check for exhaustive testing
3. **Review Edge Cases**: Some edge cases may not apply to your function's domain logic
4. **Add Integration Tests**: Generated tests focus on unit testing - add integration tests separately

## License

MIT
