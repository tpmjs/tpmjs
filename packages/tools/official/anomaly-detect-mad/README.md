# @tpmjs/tools-anomaly-detect-mad

Detect anomalies (outliers) in numeric data using the Median Absolute Deviation (MAD) method.

## Overview

The Median Absolute Deviation (MAD) is a **robust statistic** for detecting outliers. Unlike standard deviation-based methods (which are themselves influenced by outliers), MAD is resistant to extreme values, making it more reliable for anomaly detection.

### Why MAD?

**Traditional approach (standard deviation):**
- Outliers inflate the standard deviation
- This makes it harder to detect those same outliers
- Assumes normal distribution

**MAD approach:**
- Uses median (not mean) - resistant to outliers
- MAD itself is calculated from medians - doubly robust
- No distribution assumptions
- More reliable in real-world data with extreme values

## Installation

```bash
npm install @tpmjs/tools-anomaly-detect-mad
```

## Usage with AI SDK

```typescript
import { anomalyDetectMADTool } from '@tpmjs/tools-anomaly-detect-mad';
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: { detectAnomalies: anomalyDetectMADTool },
  toolChoice: 'required',
  prompt: 'Find anomalies in this data: [10, 12, 11, 13, 10, 95, 12, 11, 14, 10]',
});
```

## Direct Usage

```typescript
import { anomalyDetectMADTool } from '@tpmjs/tools-anomaly-detect-mad';

const result = await anomalyDetectMADTool.execute({
  data: [10, 12, 11, 13, 10, 95, 12, 11, 14, 10],
  threshold: 3.5, // Optional, defaults to 3.5
});

console.log(result);
// {
//   anomalies: [
//     {
//       value: 95,
//       index: 5,
//       deviation: 83.5,
//       zScore: 28.177
//     }
//   ],
//   anomalyIndices: [5],
//   statistics: {
//     median: 11.5,
//     mad: 2,
//     threshold: 3.5,
//     totalPoints: 10,
//     anomalyCount: 1,
//     anomalyPercentage: 10
//   }
// }
```

## Parameters

- `data` (required): Array of numeric values to analyze (minimum 3 values)
- `threshold` (optional): Modified z-score threshold for anomaly detection
  - Default: `3.5` (recommended, equivalent to ±3σ in normal distribution)
  - Range: `0.1` to `10`
  - Lower values = more sensitive (detects more anomalies)
  - Higher values = more conservative (detects fewer, more extreme anomalies)

### Threshold Guidelines

| Threshold | Sensitivity | Use Case |
|-----------|-------------|----------|
| 2.5 | High | Detect subtle anomalies, exploratory analysis |
| 3.0 | Moderate-High | Balanced detection |
| **3.5** | **Balanced (default)** | **General purpose, recommended** |
| 4.0 | Moderate-Low | More conservative |
| 4.5+ | Low | Only extreme outliers |

## Returns

```typescript
{
  anomalies: Array<{
    value: number;      // The anomalous value
    index: number;      // Position in original array
    deviation: number;  // Absolute deviation from median
    zScore: number;     // Modified z-score (based on MAD)
  }>;
  anomalyIndices: number[];  // Quick array of anomaly positions
  statistics: {
    median: number;            // Median of dataset
    mad: number;               // Median Absolute Deviation
    threshold: number;         // Threshold used
    totalPoints: number;       // Total data points
    anomalyCount: number;      // Number of anomalies found
    anomalyPercentage: number; // Percentage of data that are anomalies
  };
}
```

Anomalies are sorted by absolute z-score (most extreme first).

## Algorithm

The MAD method works as follows:

1. **Calculate Median**: `M = median(data)`
2. **Calculate Absolute Deviations**: `|x_i - M|` for each data point
3. **Calculate MAD**: `MAD = median(|x_i - M|)`
4. **Calculate Modified Z-Score**: `z_i = 0.6745 × (x_i - M) / MAD`
5. **Flag Anomalies**: Points where `|z_i| > threshold`

The constant `0.6745` is the 75th percentile of the standard normal distribution, which makes the MAD-based z-score comparable to traditional z-scores.

## Example Use Cases

**Server response times:**
```typescript
const responseTimes = [120, 115, 130, 125, 118, 3500, 122, 119, 128, 121];
const result = await anomalyDetectMADTool.execute({ data: responseTimes });
// Detects the 3500ms outlier
```

**Sensor readings with noise:**
```typescript
const temperatures = [20.1, 20.3, 19.9, 20.2, 45.0, 20.0, 19.8, 20.4];
const result = await anomalyDetectMADTool.execute({
  data: temperatures,
  threshold: 3.0, // More sensitive for safety-critical applications
});
// Detects the 45.0 degree spike
```

**Financial transactions:**
```typescript
const transactions = [25.50, 32.10, 28.75, 31.20, 2500.00, 29.80];
const result = await anomalyDetectMADTool.execute({ data: transactions });
// Flags the unusual $2500 transaction
```

**Quality control:**
```typescript
const measurements = [10.02, 10.01, 9.99, 10.00, 10.02, 10.50, 10.01];
const result = await anomalyDetectMADTool.execute({
  data: measurements,
  threshold: 2.5, // Sensitive to detect quality issues early
});
// Detects measurements outside acceptable tolerance
```

## Edge Cases

**All values identical:**
```typescript
const data = [5, 5, 5, 5, 5];
const result = await anomalyDetectMADTool.execute({ data });
// Returns: anomalyCount: 0, mad: 0
```

**MAD = 0 with variation:**
```typescript
const data = [10, 10, 10, 10, 15]; // Median = 10, but one different value
const result = await anomalyDetectMADTool.execute({ data });
// Special handling: flags the 15 as anomaly with zScore: Infinity
```

## Comparison: MAD vs Standard Deviation

Consider the dataset: `[10, 12, 11, 13, 10, 95, 12, 11, 14, 10]`

**Standard Deviation Method:**
- Mean = 19.8
- StdDev = 25.4 (inflated by the outlier!)
- Z-score of 95 = (95-19.8)/25.4 = 2.96
- May **not** flag as outlier (typically use threshold = 3)

**MAD Method:**
- Median = 11.5
- MAD = 2 (robust!)
- Modified Z-score of 95 = 28.2
- **Clearly** flags as outlier (threshold = 3.5)

## When to Use MAD

**Use MAD when:**
- Data may contain outliers (most real-world data)
- Distribution is unknown or non-normal
- Need robust detection resistant to contamination
- Small to medium sample sizes

**Consider alternatives when:**
- Data is known to be normally distributed
- Very large datasets (computational efficiency matters)
- Need parametric statistical inference

## Performance Considerations

- **Time Complexity**: O(n log n) due to sorting for median calculation
- **Space Complexity**: O(n) for storing sorted arrays
- **Recommended**: Works well for datasets up to 100,000+ points

## References

- Leys, C., et al. (2013). Detecting outliers: Do not use standard deviation around the mean, use absolute deviation around the median. *Journal of Experimental Social Psychology*, 49(4), 764-766
- Rousseeuw, P. J., & Croux, C. (1993). Alternatives to the median absolute deviation. *Journal of the American Statistical Association*, 88(424), 1273-1283
- Iglewicz, B., & Hoaglin, D. C. (1993). *How to Detect and Handle Outliers*. ASQC Quality Press

## License

MIT
