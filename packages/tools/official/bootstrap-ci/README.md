# @tpmjs/tools-bootstrap-ci

Calculate bootstrap confidence intervals for sample statistics using resampling methodology.

## Overview

The bootstrap is a powerful non-parametric statistical method for estimating confidence intervals without assuming any specific distribution (like normal distribution). It works by repeatedly resampling the data with replacement and calculating the statistic of interest for each resample.

This tool implements the **percentile method** for bootstrap confidence intervals, which directly uses the percentiles of the bootstrap distribution.

## Installation

```bash
npm install @tpmjs/tools-bootstrap-ci
```

## Usage with AI SDK

```typescript
import { bootstrapCITool } from '@tpmjs/tools-bootstrap-ci';
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: { bootstrapCI: bootstrapCITool },
  toolChoice: 'required',
  prompt: 'Calculate a 95% confidence interval for this sample: [23, 25, 28, 22, 24, 26, 29, 27, 25, 24]',
});
```

## Direct Usage

```typescript
import { bootstrapCITool } from '@tpmjs/tools-bootstrap-ci';

const result = await bootstrapCITool.execute({
  data: [23, 25, 28, 22, 24, 26, 29, 27, 25, 24],
  confidenceLevel: 0.95,
  iterations: 1000,
});

console.log(result);
// {
//   mean: 25.3,
//   lower: 24.1,
//   upper: 26.5,
//   confidenceLevel: 0.95,
//   iterations: 1000,
//   sampleSize: 10
// }
```

## Parameters

- `data` (required): Array of numeric values to analyze (minimum 2 values)
- `confidenceLevel` (optional): Confidence level as decimal (default: 0.95 for 95% CI, range: 0.5-0.999)
- `iterations` (optional): Number of bootstrap resamples (default: 1000, range: 100-100,000)

## Returns

```typescript
{
  mean: number;           // Original sample mean
  lower: number;          // Lower bound of confidence interval
  upper: number;          // Upper bound of confidence interval
  confidenceLevel: number; // Confidence level used
  iterations: number;     // Number of bootstrap iterations performed
  sampleSize: number;     // Size of original sample
}
```

## When to Use Bootstrap CI

The bootstrap method is particularly useful when:

- Your sample size is small to moderate
- You don't know the underlying distribution of your data
- The traditional parametric methods (t-test) assumptions might be violated
- You want a robust, assumption-free confidence interval

## Algorithm

1. Calculate the mean of the original sample
2. Generate N bootstrap samples by randomly sampling with replacement
3. Calculate the mean for each bootstrap sample
4. Sort all bootstrap means
5. Use percentiles to determine confidence interval bounds

For 95% CI: lower bound = 2.5th percentile, upper bound = 97.5th percentile

## Example Use Cases

**Small sample analysis:**
```typescript
const clinicalTrialData = [5.2, 6.1, 4.8, 5.9, 6.3, 5.5];
const ci = await bootstrapCITool.execute({ data: clinicalTrialData });
```

**Different confidence levels:**
```typescript
// 99% confidence interval
const ci99 = await bootstrapCITool.execute({
  data: measurements,
  confidenceLevel: 0.99,
});

// 90% confidence interval
const ci90 = await bootstrapCITool.execute({
  data: measurements,
  confidenceLevel: 0.90,
});
```

**High precision analysis:**
```typescript
// Use more iterations for more precise estimates
const preciseCI = await bootstrapCITool.execute({
  data: sampleData,
  iterations: 10000,
});
```

## Limitations

- Computational intensity increases with iterations (trade-off between precision and speed)
- Results may vary slightly between runs due to random sampling (use more iterations for stability)
- Best suited for estimating means; other statistics may require modified approaches

## References

- Efron, B., & Tibshirani, R. J. (1994). *An Introduction to the Bootstrap*
- DiCiccio, T. J., & Efron, B. (1996). Bootstrap confidence intervals. *Statistical Science*, 11(3), 189-228

## License

MIT
