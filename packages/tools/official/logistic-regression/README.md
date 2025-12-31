# Logistic Regression Tool

Simple binary logistic regression implementation using gradient descent optimization.

## Installation

```bash
npm install @tpmjs/tools-logistic-regression
```

## Usage

```typescript
import { logisticRegressionTool } from '@tpmjs/tools-logistic-regression';

// Example: Predict binary outcome from features
const result = await logisticRegressionTool.execute({
  x: [
    [1.0, 2.0],
    [2.0, 3.0],
    [3.0, 4.0],
    [4.0, 5.0],
  ],
  y: [0, 0, 1, 1],
  iterations: 1000,
});

console.log(result);
// {
//   coefficients: [0.5, 0.3, -0.2], // [intercept, feature1, feature2]
//   predictions: [0, 0, 1, 1],
//   accuracy: 1.0,
//   iterations: 1000,
//   convergence: {
//     finalLoss: 0.123,
//     converged: true
//   }
// }
```

## API

### Input

- **x** (required): Feature matrix `number[][]` where each row is a sample
- **y** (required): Binary labels `number[]` (must be 0 or 1)
- **iterations** (optional): Number of gradient descent iterations (default: 1000)
- **learningRate** (optional): Learning rate (default: 0.1)

### Output

- **coefficients**: Model weights including intercept
- **predictions**: Binary predictions for each sample
- **accuracy**: Classification accuracy (0 to 1)
- **iterations**: Number of iterations performed
- **convergence**: Loss and convergence status

## Algorithm

Uses gradient descent to minimize binary cross-entropy loss:

1. Initialize coefficients to zero
2. For each iteration:
   - Calculate predictions using sigmoid function
   - Compute gradient of loss function
   - Update coefficients: θ = θ - α∇L
3. Return fitted model

The sigmoid function maps linear combinations to probabilities [0, 1].

## License

MIT
