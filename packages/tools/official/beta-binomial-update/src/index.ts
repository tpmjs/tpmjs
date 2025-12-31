/**
 * Beta-Binomial Update Tool for TPMJS
 * Implements Bayesian conjugate update for Beta-Binomial model
 */

import { jsonSchema, tool } from 'ai';

/**
 * Output interface for beta-binomial posterior
 */
export interface BetaBinomialPosterior {
  posteriorAlpha: number;
  posteriorBeta: number;
  posteriorMean: number;
  posteriorMode: number;
  posteriorVariance: number;
  credibleInterval: {
    lower: number;
    upper: number;
    level: number;
  };
  statistics: {
    effectiveSampleSize: number;
    priorMean: number;
    dataLikelihood: number;
  };
}

type BetaBinomialInput = {
  priorAlpha: number;
  priorBeta: number;
  successes: number;
  trials: number;
  credibleLevel?: number;
};

/**
 * Gamma function approximation using Stirling's formula
 * For large values, Γ(z) ≈ sqrt(2π/z) * (z/e)^z
 * For small positive integers, use factorial
 */
function gammaApprox(z: number): number {
  if (z < 0) {
    throw new Error('Gamma function not defined for negative values');
  }

  // Use factorial for small integers
  if (Number.isInteger(z) && z <= 20) {
    let result = 1;
    for (let i = 2; i < z; i++) {
      result *= i;
    }
    return result;
  }

  // Stirling's approximation
  const e = Math.E;
  const pi = Math.PI;
  return Math.sqrt((2 * pi) / z) * (z / e) ** z;
}

/**
 * Beta function: B(α, β) = Γ(α)Γ(β) / Γ(α + β)
 */
function betaFunction(alpha: number, beta: number): number {
  return (gammaApprox(alpha) * gammaApprox(beta)) / gammaApprox(alpha + beta);
}

/**
 * Incomplete beta function approximation for credible intervals
 * Uses continued fraction expansion
 */
function incompleteBeta(x: number, alpha: number, beta: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  // Use symmetry property to improve convergence
  const bt = Math.exp(
    alpha * Math.log(x) +
      beta * Math.log(1 - x) -
      Math.log(alpha) -
      Math.log(betaFunction(alpha, beta))
  );

  if (x < (alpha + 1) / (alpha + beta + 2)) {
    return (bt * betaContinuedFraction(x, alpha, beta)) / alpha;
  }
  return 1 - (bt * betaContinuedFraction(1 - x, beta, alpha)) / beta;
}

/**
 * Continued fraction for incomplete beta function
 */
function betaContinuedFraction(x: number, alpha: number, beta: number, maxIter = 100): number {
  const qab = alpha + beta;
  const qap = alpha + 1;
  const qam = alpha - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;

  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= maxIter; m++) {
    const m2 = 2 * m;
    let aa = (m * (beta - m) * x) / ((qam + m2) * (alpha + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    h *= d * c;

    aa = (-(alpha + m) * (qab + m) * x) / ((alpha + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;

    if (Math.abs(del - 1) < 1e-10) break;
  }

  return h;
}

/**
 * Find quantile of Beta distribution using bisection search
 */
function betaQuantile(p: number, alpha: number, beta: number): number {
  if (p <= 0) return 0;
  if (p >= 1) return 1;

  // Initial guess
  let low = 0;
  let high = 1;
  let mid = (alpha - 1) / (alpha + beta - 2); // mode as initial guess

  // Bisection search
  for (let iter = 0; iter < 100; iter++) {
    const cdf = incompleteBeta(mid, alpha, beta);

    if (Math.abs(cdf - p) < 1e-6) {
      break;
    }

    if (cdf < p) {
      low = mid;
    } else {
      high = mid;
    }

    mid = (low + high) / 2;
  }

  return mid;
}

/**
 * Calculate credible interval for Beta distribution
 */
function calculateCredibleInterval(
  alpha: number,
  beta: number,
  level: number
): { lower: number; upper: number; level: number } {
  const tail = (1 - level) / 2;
  const lower = betaQuantile(tail, alpha, beta);
  const upper = betaQuantile(1 - tail, alpha, beta);

  return { lower, upper, level };
}

/**
 * Validate input parameters
 */
function validateInput(
  priorAlpha: number,
  priorBeta: number,
  successes: number,
  trials: number,
  credibleLevel: number
): void {
  if (priorAlpha <= 0 || !Number.isFinite(priorAlpha)) {
    throw new Error('priorAlpha must be a positive number');
  }

  if (priorBeta <= 0 || !Number.isFinite(priorBeta)) {
    throw new Error('priorBeta must be a positive number');
  }

  if (!Number.isInteger(successes) || successes < 0) {
    throw new Error('successes must be a non-negative integer');
  }

  if (!Number.isInteger(trials) || trials < 0) {
    throw new Error('trials must be a non-negative integer');
  }

  if (successes > trials) {
    throw new Error(`successes (${successes}) cannot exceed trials (${trials})`);
  }

  if (credibleLevel <= 0 || credibleLevel >= 1) {
    throw new Error('credibleLevel must be between 0 and 1 (exclusive)');
  }
}

/**
 * Beta-Binomial Update Tool
 * Performs Bayesian conjugate update for Beta prior with Binomial likelihood
 */
export const betaBinomialUpdateTool = tool({
  description:
    'Perform Bayesian update of a Beta prior distribution given binomial data (successes out of trials). Returns the posterior Beta distribution with mean, mode, variance, and credible interval. Useful for estimating probabilities with prior beliefs.',
  inputSchema: jsonSchema<BetaBinomialInput>({
    type: 'object',
    properties: {
      priorAlpha: {
        type: 'number',
        description: 'Prior alpha parameter (represents prior successes + 1)',
      },
      priorBeta: {
        type: 'number',
        description: 'Prior beta parameter (represents prior failures + 1)',
      },
      successes: {
        type: 'number',
        description: 'Number of successes observed in the data',
      },
      trials: {
        type: 'number',
        description: 'Total number of trials conducted',
      },
      credibleLevel: {
        type: 'number',
        description: 'Credible interval level (default: 0.95 for 95% interval)',
      },
    },
    required: ['priorAlpha', 'priorBeta', 'successes', 'trials'],
    additionalProperties: false,
  }),
  async execute({
    priorAlpha,
    priorBeta,
    successes,
    trials,
    credibleLevel = 0.95,
  }): Promise<BetaBinomialPosterior> {
    // Validate inputs
    validateInput(priorAlpha, priorBeta, successes, trials, credibleLevel);

    const failures = trials - successes;

    // Conjugate update: Beta(α, β) + Binomial(k, n) = Beta(α + k, β + (n - k))
    const posteriorAlpha = priorAlpha + successes;
    const posteriorBeta = priorBeta + failures;

    // Calculate posterior statistics
    const posteriorMean = posteriorAlpha / (posteriorAlpha + posteriorBeta);

    // Mode: (α - 1) / (α + β - 2) for α, β > 1
    let posteriorMode: number;
    if (posteriorAlpha > 1 && posteriorBeta > 1) {
      posteriorMode = (posteriorAlpha - 1) / (posteriorAlpha + posteriorBeta - 2);
    } else if (posteriorAlpha <= 1 && posteriorBeta > 1) {
      posteriorMode = 0;
    } else if (posteriorAlpha > 1 && posteriorBeta <= 1) {
      posteriorMode = 1;
    } else {
      posteriorMode = posteriorMean; // Use mean when mode is undefined
    }

    const posteriorVariance =
      (posteriorAlpha * posteriorBeta) /
      ((posteriorAlpha + posteriorBeta) ** 2 * (posteriorAlpha + posteriorBeta + 1));

    // Calculate credible interval
    const credibleInterval = calculateCredibleInterval(
      posteriorAlpha,
      posteriorBeta,
      credibleLevel
    );

    // Calculate additional statistics
    const priorMean = priorAlpha / (priorAlpha + priorBeta);
    const effectiveSampleSize = priorAlpha + priorBeta;
    const dataLikelihood = trials > 0 ? successes / trials : 0;

    return {
      posteriorAlpha,
      posteriorBeta,
      posteriorMean,
      posteriorMode,
      posteriorVariance,
      credibleInterval,
      statistics: {
        effectiveSampleSize,
        priorMean,
        dataLikelihood,
      },
    };
  },
});

export default betaBinomialUpdateTool;
