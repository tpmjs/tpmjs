# Difference-in-Differences (DiD)

Causal inference estimator for measuring treatment effects using before/after comparison with a control group.

## Installation

```bash
npm install @tpmjs/tools-diff-in-diff
```

## Usage

```typescript
import { diffInDiffTool } from '@tpmjs/tools-diff-in-diff';

// Example: Evaluate impact of a policy intervention
// Treatment group: Cities that implemented the policy
// Control group: Cities that did not implement the policy
const result = await diffInDiffTool.execute({
  treatmentBefore: [100, 105, 98, 102],   // Before policy
  treatmentAfter: [120, 125, 118, 122],    // After policy
  controlBefore: [95, 100, 92, 98],        // Before (no policy)
  controlAfter: [98, 103, 95, 101],        // After (no policy)
  confidenceLevel: 0.95,
});

console.log(result);
// {
//   effect: 17.5,              // Treatment caused 17.5 unit increase
//   standardError: 2.1,
//   tStatistic: 8.33,
//   pValue: 0.0001,
//   significant: true,
//   confidenceInterval: {
//     lower: 13.2,
//     upper: 21.8,
//     level: 0.95
//   },
//   interpretation: "The treatment effect is 17.5 (increased by 17.5 units)...",
//   groupMeans: {
//     treatmentBefore: 101.25,
//     treatmentAfter: 121.25,
//     controlBefore: 96.25,
//     controlAfter: 99.25
//   },
//   differences: {
//     treatmentDiff: 20.0,     // Treatment group change
//     controlDiff: 3.0         // Control group change
//   }
// }
```

## API

### Input

- **treatmentBefore** (required): Treatment group values before intervention
- **treatmentAfter** (required): Treatment group values after intervention
- **controlBefore** (required): Control group values before intervention
- **controlAfter** (required): Control group values after intervention
- **confidenceLevel** (optional): Confidence level (default: 0.95)

### Output

- **effect**: Estimated causal treatment effect (DiD estimator)
- **standardError**: Standard error of the estimate
- **tStatistic**: Test statistic for significance testing
- **pValue**: Two-tailed p-value
- **significant**: Whether effect is statistically significant
- **confidenceInterval**: Confidence interval for the effect
- **interpretation**: Plain English interpretation
- **groupMeans**: Mean values for all four groups
- **differences**: Within-group changes over time

## Algorithm

The DiD estimator removes time-invariant confounders by differencing:

**Formula**: `DiD = (T_after - T_before) - (C_after - C_before)`

Where:
- T = Treatment group
- C = Control group

This double-differencing removes:
1. Time trends (via control group)
2. Group differences (via before/after comparison)

**Key Assumption**: Parallel trends - Without treatment, both groups would have changed similarly.

## Use Cases

- **Policy evaluation**: Measure impact of new regulations
- **Marketing**: Test effectiveness of campaigns
- **Medicine**: Clinical trials with before/after measurements
- **Economics**: Evaluate economic interventions
- **Education**: Assess program effectiveness

## Example: Minimum Wage Study

```typescript
// States that raised minimum wage (treatment)
// vs states that didn't (control)
const result = await diffInDiffTool.execute({
  treatmentBefore: [5.2, 5.5, 5.1, 5.4], // Employment before
  treatmentAfter: [5.1, 5.3, 5.0, 5.2],  // Employment after
  controlBefore: [5.3, 5.4, 5.2, 5.5],
  controlAfter: [5.4, 5.5, 5.3, 5.6],
});

// Effect tells us the causal impact on employment
```

## Interpretation

A **positive effect** means treatment increased the outcome.
A **negative effect** means treatment decreased the outcome.

**Statistical significance** (p < 0.05) suggests the effect is real, not due to chance.

## Limitations

- Requires parallel trends assumption
- Can't control for time-varying confounders
- Sensitive to outliers
- Needs sufficient sample size

## License

MIT
