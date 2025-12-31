# Beta-Binomial Update

Bayesian beta-binomial conjugate posterior update for estimating probabilities from data with prior beliefs.

## Installation

```bash
npm install @tpmjs/tools-beta-binomial-update
```

## Usage

```typescript
import { betaBinomialUpdateTool } from '@tpmjs/tools-beta-binomial-update';

// Example: Estimate conversion rate with prior belief
// Prior: Beta(2, 2) = uniform-ish prior slightly favoring 0.5
// Data: 15 conversions out of 100 trials
const result = await betaBinomialUpdateTool.execute({
  priorAlpha: 2,
  priorBeta: 2,
  successes: 15,
  trials: 100,
  credibleLevel: 0.95, // 95% credible interval
});

console.log(result);
// {
//   posteriorAlpha: 17,      // 2 + 15
//   posteriorBeta: 87,       // 2 + (100 - 15)
//   posteriorMean: 0.163,    // Best estimate
//   posteriorMode: 0.157,    // Most likely value
//   posteriorVariance: 0.001,
//   credibleInterval: {
//     lower: 0.098,
//     upper: 0.239,
//     level: 0.95
//   },
//   statistics: {
//     effectiveSampleSize: 4,
//     priorMean: 0.5,
//     dataLikelihood: 0.15
//   }
// }
```

## API

### Input

- **priorAlpha** (required): Prior successes + 1 (e.g., 1 for uninformative, 2 for weak prior)
- **priorBeta** (required): Prior failures + 1
- **successes** (required): Number of successes observed
- **trials** (required): Total number of trials
- **credibleLevel** (optional): Credible interval level (default: 0.95)

### Output

- **posteriorAlpha**: Updated alpha parameter
- **posteriorBeta**: Updated beta parameter
- **posteriorMean**: Expected value of probability
- **posteriorMode**: Most likely probability value
- **posteriorVariance**: Uncertainty in estimate
- **credibleInterval**: Bayesian confidence interval
- **statistics**: Prior mean, likelihood, effective sample size

## Algorithm

Uses conjugate Beta-Binomial model:

**Prior**: `θ ~ Beta(α, β)`
**Likelihood**: `X ~ Binomial(n, θ)`
**Posterior**: `θ|X ~ Beta(α + k, β + (n - k))`

Where:
- k = successes
- n = trials
- θ = unknown probability

The Beta distribution is conjugate to the Binomial, making the update simple and exact.

## Common Priors

- **Uninformative**: `Beta(1, 1)` = Uniform[0, 1]
- **Jeffreys**: `Beta(0.5, 0.5)` = Uninformative invariant prior
- **Weak**: `Beta(2, 2)` = Slight preference for θ = 0.5
- **Strong**: `Beta(20, 20)` = Strong belief in θ = 0.5

## Use Cases

- A/B test analysis (conversion rates)
- Click-through rate estimation
- Medical test sensitivity/specificity
- Quality control (defect rates)
- Sports analytics (win probabilities)

## Credible Interval

The credible interval is the Bayesian analog of a confidence interval. A 95% credible interval means "there is a 95% probability that θ lies in this interval given the data."

## License

MIT
