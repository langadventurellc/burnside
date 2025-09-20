import type { BackoffCalculator } from "./backoffCalculator";
import type { BackoffConfig } from "./backoffConfig";
import { ExponentialBackoffStrategy } from "./exponentialBackoffStrategy";
import { LinearBackoffStrategy } from "./linearBackoffStrategy";

/**
 * Factory function for creating backoff strategies
 * @param config - Backoff configuration
 * @returns Appropriate BackoffCalculator implementation
 */
export function createBackoffStrategy(
  config: BackoffConfig,
): BackoffCalculator {
  switch (config.strategy) {
    case "exponential":
      return new ExponentialBackoffStrategy(config);
    case "linear":
      return new LinearBackoffStrategy(config);
    default:
      throw new Error(
        `Unsupported backoff strategy: ${String(config.strategy)}`,
      );
  }
}
