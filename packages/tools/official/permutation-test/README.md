# @tpmjs/tools-permutation-test

Perform a permutation test to assess the statistical significance of the difference in means between two groups.

## Installation

```bash
npm install @tpmjs/tools-permutation-test
```

## Usage

```typescript
import { permutationTestTool } from '@tpmjs/tools-permutation-test';

// Use with AI SDK
const result = await permutationTestTool.execute({
  group1: [23, 25, 27, 29, 31],
  group2: [18, 20, 22, 24, 26],
  iterations: 10000, // optional, default: 10000
});

console.log(result);
// {
//   pValue: 0.0234,
//   observedDiff: 5,
//   significant: true,
//   iterations: 10000,
//   metadata: {
//     group1Size: 5,
//     group2Size: 5,
//     group1Mean: 27,
//     group2Mean: 22,
//     alpha: 0.05
//   }
// }
```

## Parameters

- **group1** (number[], required): First group of numeric values
- **group2** (number[], required): Second group of numeric values
- **iterations** (number, optional): Number of permutations to perform (default: 10000, min: 100, max: 100000)

## Returns

```typescript
{
  pValue: number;              // Two-tailed p-value
  observedDiff: number;        // Absolute difference in means
  significant: boolean;        // Whether p < 0.05
  iterations: number;          // Number of permutations performed
  metadata: {
    group1Size: number;
    group2Size: number;
    group1Mean: number;
    group2Mean: number;
    alpha: number;             // Significance level (0.05)
  }
}
```

## How it works

The permutation test is a non-parametric method that doesn't assume normal distribution:

1. Calculate the observed difference in means between the two groups
2. Combine all values from both groups
3. Randomly shuffle the combined data and split into two groups
4. Calculate the difference in means for each permutation
5. Count how many permutations have a difference as extreme or more extreme than observed
6. Calculate p-value as the proportion of extreme permutations

## When to use

- When you can't assume normal distribution
- With small sample sizes
- When comparing means between two independent groups
- Alternative to t-test when assumptions aren't met

## License

MIT
