import type { BackoffCalculator } from "./backoffCalculator";
import type { BackoffConfig } from "./backoffConfig";

/**
 * Exponential backoff strategy implementation
 *
 * Calculates delays using the formula: baseDelay * (multiplier ^ attempt)
 * with optional jitter and maximum delay capping.
 */
export class ExponentialBackoffStrategy implements BackoffCalculator {
  private readonly config: Required<BackoffConfig>;

  constructor(config: BackoffConfig) {
    this.validateConfig(config);
    this.config = {
      ...config,
      multiplier: config.multiplier ?? 2,
    };
  }

  calculateDelay(attempt: number): number {
    if (attempt < 0) {
      throw new Error("Attempt number must be non-negative");
    }

    // Prevent overflow by capping attempt number
    const cappedAttempt = Math.min(attempt, 32);

    // Calculate base delay: baseDelay * (multiplier ^ attempt)
    const baseDelay =
      this.config.baseDelayMs * Math.pow(this.config.multiplier, cappedAttempt);

    // Apply maximum delay cap before jitter
    const cappedDelay = Math.min(baseDelay, this.config.maxDelayMs);

    // Apply jitter if enabled: delay * (0.5 + Math.random() * 0.5)
    if (this.config.jitter) {
      const jitteredDelay = cappedDelay * (0.5 + Math.random() * 0.5);
      // Ensure jittered delay doesn't exceed maximum
      return Math.min(jitteredDelay, this.config.maxDelayMs);
    }

    return cappedDelay;
  }

  reset(): void {
    // Stateless implementation - no internal state to reset
  }

  private validateConfig(config: BackoffConfig): void {
    if (config.baseDelayMs < 0) {
      throw new Error("Base delay must be non-negative");
    }
    if (config.maxDelayMs < 0) {
      throw new Error("Maximum delay must be non-negative");
    }
    if (config.multiplier !== undefined && config.multiplier <= 0) {
      throw new Error("Multiplier must be positive");
    }
  }
}
