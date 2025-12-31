# @tpmjs/tools-linear-regression-ols

Perform simple linear regression using Ordinary Least Squares (OLS) to find the best-fit line for your data.

## Installation

```bash
npm install @tpmjs/tools-linear-regression-ols
```

## Usage

```typescript
import { linearRegressionOLSTool } from '@tpmjs/tools-linear-regression-ols';

// Use with AI SDK
const result = await linearRegressionOLSTool.execute({
  x: [1, 2, 3, 4, 5],
  y: [2, 4, 5, 4, 5],
});

console.log(result);
// {
//   slope: 0.6,
//   intercept: 2.2,
//   rSquared: 0.581,
//   residuals: [-0.8, 0.6, 0.4, -0.6, 0.4],
//   predictions: [2.8, 3.4, 4.0, 4.6, 5.2],
//   metadata: {
//     n: 5,
//     meanX: 3,
//     meanY: 4,
//     sst: 5,
//     sse: 2.096
//   }
// }
```

## Parameters

- **x** (number[], required): Independent variable values (predictor). Minimum 2 values.
- **y** (number[], required): Dependent variable values (response). Minimum 2 values. Must have same length as x.

## Returns

```typescript
{
  slope: number;              // Slope of the regression line (β₁)
  intercept: number;          // Y-intercept (β₀)
  rSquared: number;           // Coefficient of determination (0-1)
  residuals: number[];        // Residuals (y - ŷ) for each point
  predictions: number[];      // Predicted values (ŷ) for each x
  metadata: {
    n: number;                // Number of observations
    meanX: number;            // Mean of x values
    meanY: number;            // Mean of y values
    sst: number;              // Total sum of squares
    sse: number;              // Sum of squared errors
  }
}
```

## How it works

The tool implements simple linear regression using the OLS method:

1. **Model**: ŷ = β₀ + β₁x
2. **Slope**: β₁ = Σ((x - x̄)(y - ȳ)) / Σ((x - x̄)²)
3. **Intercept**: β₀ = ȳ - β₁x̄
4. **R-squared**: R² = 1 - (SSE / SST)

Where:
- ŷ = predicted value
- x̄ = mean of x
- ȳ = mean of y
- SSE = sum of squared errors
- SST = total sum of squares

## Interpreting R-squared

R² measures the proportion of variance in y explained by x:

- **1.0**: Perfect fit (all points on the line)
- **0.8-0.99**: Strong relationship
- **0.5-0.79**: Moderate relationship
- **0.2-0.49**: Weak relationship
- **0.0-0.19**: Very weak relationship

## Example: Predicting new values

```typescript
const result = await linearRegressionOLSTool.execute({
  x: [1, 2, 3, 4, 5],
  y: [2.1, 3.9, 6.2, 7.8, 10.1],
});

// Use slope and intercept to predict new values
const predictY = (x: number) => result.intercept + result.slope * x;

console.log(predictY(6));  // Predict y for x=6
// Output: ~12.0
```

## When to use

- Modeling linear relationships between variables
- Making predictions based on historical data
- Understanding the strength of relationships (via R²)
- Identifying trends in data
- Simple forecasting

## Limitations

- Assumes a linear relationship
- Sensitive to outliers
- Doesn't handle multiple independent variables (use multiple regression)
- Assumes independence of observations
- Best with normally distributed residuals

## License

MIT
