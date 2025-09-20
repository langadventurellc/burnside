import type { BackoffCalculator } from "./backoffCalculator";
import type { BackoffConfig } from "./backoffConfig";

/**
 * Linear backoff strategy implementation
 *
 * Calculates delays using the formula: baseDelay * (attempt + 1)
 * with optional jitter and maximum delay capping.
 */
export class LinearBackoffStrategy implements BackoffCalculator {
  private readonly config: BackoffConfig;

  constructor(config: BackoffConfig) {
    this.validateConfig(config);
    this.config = config;
  }

  calculateDelay(attempt: number): number {
    if (attempt < 0) {
      throw new Error("Attempt number must be non-negative");
    }

    // Calculate base delay: baseDelay * (attempt + 1)
    const baseDelay = this.config.baseDelayMs * (attempt + 1);

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
  }
}
