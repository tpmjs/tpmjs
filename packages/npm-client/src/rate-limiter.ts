/**
 * Simple rate limiter utility
 * Helps avoid overwhelming NPM API with too many requests
 */

/**
 * Delays execution for a specified number of milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Rate limiter class that enforces a maximum number of requests per time period
 */
export class RateLimiter {
  private queue: Array<() => void> = [];
  private running = 0;

  constructor(
    private maxConcurrent = 10,
    private minDelayMs = 100
  ) {}

  /**
   * Executes a function with rate limiting
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Wait if we're at max concurrent requests
    while (this.running >= this.maxConcurrent) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }

    this.running++;

    try {
      const result = await fn();
      await delay(this.minDelayMs); // Enforce minimum delay between requests
      return result;
    } finally {
      this.running--;
      const next = this.queue.shift();
      if (next) {
        next();
      }
    }
  }

  /**
   * Executes multiple functions with rate limiting
   */
  async executeAll<T>(fns: Array<() => Promise<T>>): Promise<T[]> {
    return Promise.all(fns.map((fn) => this.execute(fn)));
  }
}

/**
 * Default rate limiter instance for NPM API calls
 * - Max 10 concurrent requests
 * - Min 100ms delay between requests
 */
export const npmRateLimiter = new RateLimiter(10, 100);

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelayMs = 1000
): Promise<T> {
  let lastError: Error | unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Check if it's a 429 (rate limit) error
      const is429 =
        error instanceof Error && (error.message.includes('429') || error.message.includes('rate'));

      if (is429) {
        // Exponential backoff: 1s, 2s, 4s, 8s, etc.
        const delayMs = initialDelayMs * 2 ** attempt;
        console.warn(
          `Rate limited, retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`
        );
        await delay(delayMs);
      } else {
        // For other errors, just use a short delay
        await delay(500);
      }
    }
  }

  throw lastError;
}
