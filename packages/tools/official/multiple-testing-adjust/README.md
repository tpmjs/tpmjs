# @tpmjs/tools-multiple-testing-adjust

Adjust p-values for multiple testing using Bonferroni, Benjamini-Hochberg (BH), or Holm methods to control family-wise error rate or false discovery rate.

## Installation

```bash
npm install @tpmjs/tools-multiple-testing-adjust
```

## Usage

```typescript
import { multipleTestingAdjustTool } from '@tpmjs/tools-multiple-testing-adjust';

// Use with AI SDK
const result = await multipleTestingAdjustTool.execute({
  pValues: [0.001, 0.02, 0.03, 0.15, 0.8],
  method: 'bh', // 'bonferroni', 'bh', or 'holm'
  alpha: 0.05,
});

console.log(result);
// {
//   adjusted: [0.005, 0.05, 0.05, 0.1875, 0.8],
//   significant: [0, 1, 2],  // Indices of significant tests
//   method: 'bh',
//   alpha: 0.05,
//   metadata: {
//     totalTests: 5,
//     significantCount: 3,
//     originalSignificant: 3
//   }
// }
```

## Parameters

- **pValues** (number[], required): Array of p-values to adjust (each between 0 and 1)
- **method** (string, optional): Adjustment method - 'bonferroni', 'bh', or 'holm' (default: 'bonferroni')
- **alpha** (number, optional): Significance level (default: 0.05)

## Returns

```typescript
{
  adjusted: number[];        // Adjusted p-values in original order
  significant: number[];     // Indices of tests that remain significant
  method: string;            // Method used
  alpha: number;             // Significance level
  metadata: {
    totalTests: number;
    significantCount: number;      // Count after adjustment
    originalSignificant: number;   // Count before adjustment
  }
}
```

## Methods

### Bonferroni
- Most conservative method
- Controls family-wise error rate (FWER)
- Multiplies each p-value by the number of tests
- Use when you need strict control over false positives

### Benjamini-Hochberg (BH)
- Controls false discovery rate (FDR)
- Less conservative than Bonferroni
- Better power for large numbers of tests
- Recommended for exploratory analyses

### Holm
- Step-down procedure
- Controls FWER like Bonferroni but more powerful
- Good middle ground between Bonferroni and BH
- Use when you want FWER control with better power

## When to use

- When performing multiple hypothesis tests simultaneously
- To avoid inflated Type I error rates
- In genomics, neuroimaging, A/B testing with multiple variants
- Any study with multiple comparisons

## Example: Comparing methods

```typescript
const pValues = [0.001, 0.01, 0.02, 0.03, 0.05, 0.1];

// Bonferroni (most strict)
const bonf = await multipleTestingAdjustTool.execute({
  pValues,
  method: 'bonferroni',
});
// significant: [0] - only the smallest p-value survives

// Holm (moderate)
const holm = await multipleTestingAdjustTool.execute({
  pValues,
  method: 'holm',
});
// significant: [0, 1] - two tests survive

// BH (least strict)
const bh = await multipleTestingAdjustTool.execute({
  pValues,
  method: 'bh',
});
// significant: [0, 1, 2, 3] - four tests survive
```

## License

MIT
