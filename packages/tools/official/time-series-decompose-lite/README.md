# Time Series Decompose Lite

Simple time series decomposition into trend, seasonal, and residual components using additive decomposition.

## Installation

```bash
npm install @tpmjs/tools-time-series-decompose-lite
```

## Usage

```typescript
import { timeSeriesDecomposeLiteTool } from '@tpmjs/tools-time-series-decompose-lite';

// Example: Monthly sales data with yearly seasonality
const result = await timeSeriesDecomposeLiteTool.execute({
  data: [112, 118, 132, 129, 121, 135, 148, 148, 136, 119, 104, 118, 115, 126, 141, 135, 125, 149],
  period: 12, // 12 months = 1 year
});

console.log(result);
// {
//   trend: [...],        // Long-term trend
//   seasonal: [...],     // Repeating seasonal pattern
//   residual: [...],     // Random noise
//   period: 12,
//   decompositionType: 'additive',
//   statistics: {
//     trendStrength: 0.85,
//     seasonalStrength: 0.72
//   }
// }
```

## API

### Input

- **data** (required): Time series values `number[]` in chronological order
- **period** (required): Seasonal period as integer (e.g., 12 for monthly data with yearly patterns, 7 for daily data with weekly patterns)

### Output

- **trend**: Long-term trend component
- **seasonal**: Repeating seasonal pattern (centered at 0)
- **residual**: Irregular/random component
- **period**: The seasonal period used
- **decompositionType**: Always 'additive'
- **statistics**: Strength of trend and seasonal components (0-1)

## Algorithm

Uses classical additive decomposition:

**Model**: `Y(t) = Trend(t) + Seasonal(t) + Residual(t)`

1. **Trend Extraction**: Centered moving average with window = period
2. **Detrending**: Subtract trend from original data
3. **Seasonal Extraction**: Average each position in the cycle, then center
4. **Residual**: What remains after removing trend and seasonal

## Use Cases

- Analyze sales patterns (monthly/quarterly/yearly cycles)
- Study weather data (daily/seasonal patterns)
- Economic indicators (business cycles)
- Web traffic analysis (weekly/daily patterns)

## Limitations

- Requires at least 2 complete periods of data
- Assumes additive model (for multiplicative, log-transform data first)
- Simple moving average (not robust to outliers)

## License

MIT
