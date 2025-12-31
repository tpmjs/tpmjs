# @tpmjs/tools-effect-size-suite

Calculate multiple effect size measures (Cohen's d, Hedge's g, Glass's delta) for comparing two groups.

## Overview

Effect sizes quantify the **magnitude of difference** between two groups in standardized units. Unlike p-values (which tell you if a difference exists), effect sizes tell you **how large** the difference is, making them essential for practical significance and meta-analysis.

This tool calculates three common effect size measures:

- **Cohen's d**: Uses pooled standard deviation from both groups
- **Hedge's g**: Bias-corrected version of Cohen's d for small samples
- **Glass's delta**: Uses only the control group's standard deviation (useful when variances differ)

## Installation

```bash
npm install @tpmjs/tools-effect-size-suite
```

## Usage with AI SDK

```typescript
import { effectSizeSuiteTool } from '@tpmjs/tools-effect-size-suite';
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: { effectSize: effectSizeSuiteTool },
  toolChoice: 'required',
  prompt: 'Compare treatment group [78, 82, 85, 79, 88] vs control [72, 68, 70, 65, 71]',
});
```

## Direct Usage

```typescript
import { effectSizeSuiteTool } from '@tpmjs/tools-effect-size-suite';

const result = await effectSizeSuiteTool.execute({
  group1: [78, 82, 85, 79, 88], // Treatment group
  group2: [72, 68, 70, 65, 71], // Control group
});

console.log(result);
// {
//   cohensD: 2.156,
//   hedgesG: 1.942,
//   glassDelta: 2.289,
//   interpretation: {
//     cohensD: 'large',
//     hedgesG: 'large',
//     glassDelta: 'large'
//   },
//   groupStats: {
//     group1: { mean: 82.4, sd: 3.975, n: 5 },
//     group2: { mean: 69.2, sd: 2.863, n: 5 },
//     meanDifference: 13.2
//   }
// }
```

## Parameters

- `group1` (required): Array of numeric values for first group (minimum 2 values)
- `group2` (required): Array of numeric values for second group (minimum 2 values)

Note: Group 2 is treated as the "control" for Glass's delta calculation.

## Returns

```typescript
{
  cohensD: number;        // Cohen's d effect size
  hedgesG: number;        // Hedge's g (bias-corrected)
  glassDelta: number;     // Glass's delta
  interpretation: {
    cohensD: string;      // 'negligible' | 'small' | 'medium' | 'large'
    hedgesG: string;
    glassDelta: string;
  };
  groupStats: {
    group1: { mean, sd, n };
    group2: { mean, sd, n };
    meanDifference: number;
  };
}
```

## Effect Size Interpretation

Following Cohen's (1988) conventions:

| Effect Size | Interpretation |
|------------|----------------|
| \|d\| < 0.2  | Negligible     |
| 0.2 ≤ \|d\| < 0.5 | Small    |
| 0.5 ≤ \|d\| < 0.8 | Medium   |
| \|d\| ≥ 0.8  | Large          |

## Which Effect Size to Use?

### Cohen's d
**Best for**: Most common use case, balanced designs with similar sample sizes

**Formula**: `d = (M₁ - M₂) / SDpooled`

**Use when**:
- Sample sizes are similar
- Variances are roughly equal
- Standard choice for meta-analysis

### Hedge's g
**Best for**: Small samples (n < 20 per group)

**Formula**: `g = d × correction_factor`

**Use when**:
- Small sample sizes (provides unbiased estimate)
- Otherwise same as Cohen's d

### Glass's delta
**Best for**: Different variances, experimental vs control comparison

**Formula**: `Δ = (M₁ - M₂) / SD₂`

**Use when**:
- Treatment may change variance
- Clear control group exists
- Comparing to a standard/baseline

## Example Use Cases

**Clinical trial comparison:**
```typescript
const trial = await effectSizeSuiteTool.execute({
  group1: [145, 138, 142, 149, 140], // Blood pressure after treatment
  group2: [158, 162, 155, 160, 157], // Blood pressure control group
});
// Large negative effect = treatment reduced blood pressure
```

**Educational intervention:**
```typescript
const education = await effectSizeSuiteTool.execute({
  group1: [88, 92, 85, 90, 87], // Test scores with new method
  group2: [78, 82, 80, 79, 81], // Test scores traditional method
});
// Positive effect = new method improved scores
```

**A/B testing with different variances:**
```typescript
const abTest = await effectSizeSuiteTool.execute({
  group1: [5.2, 8.1, 6.4, 9.2, 7.1], // Version B (high variance)
  group2: [4.1, 4.3, 4.0, 4.2, 4.1], // Version A (stable baseline)
});
// Use Glass's delta when treatment changes variance
```

## Important Notes

1. **Direction matters**: Positive effect size means group1 > group2
2. **Small samples**: Use Hedge's g for n < 20 per group
3. **Assumptions**:
   - Data should be reasonably continuous
   - Extreme outliers can distort effect sizes
   - Groups should be independent
4. **Statistical significance**: Effect size ≠ statistical significance
   - Large effect with small n may not be significant (p > 0.05)
   - Small effect with large n may be significant but not meaningful

## Formulas

**Pooled Standard Deviation:**
```
SDpooled = √[((n₁-1)×SD₁² + (n₂-1)×SD₂²) / (n₁+n₂-2)]
```

**Cohen's d:**
```
d = (M₁ - M₂) / SDpooled
```

**Hedge's g:**
```
g = d × [1 - 3/(4N - 9)]
where N = n₁ + n₂
```

**Glass's delta:**
```
Δ = (M₁ - M₂) / SD₂
```

## References

- Cohen, J. (1988). *Statistical Power Analysis for the Behavioral Sciences* (2nd ed.)
- Hedges, L. V. (1981). Distribution theory for Glass's estimator of effect size. *Journal of Educational Statistics*, 6(2), 107-128
- Lakens, D. (2013). Calculating and reporting effect sizes. *Frontiers in Psychology*, 4, 863

## License

MIT
