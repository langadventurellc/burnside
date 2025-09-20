/**
 * Token Bucket Algorithm Implementation
 *
 * High-precision token bucket for rate limiting with burst capacity support.
 * Uses on-demand calculation with performance.now() for accurate timing
 * and thread-safe token consumption.
 *
 * @example Basic usage with 5 RPS and burst capacity of 10
 * ```typescript
 * const bucket = new TokenBucket({
 *   maxTokens: 10,
 *   refillRate: 5,
 *   refillInterval: 100
 * });
 *
 * if (bucket.consume(1)) {
 *   // Request allowed
 *   makeApiCall();
 * } else {
 *   // Rate limited, wait for refill
 *   throw new RateLimitError("Rate limit exceeded");
 * }
 * ```
 *
 * @example Zero refill rate (static bucket)
 * ```typescript
 * const staticBucket = new TokenBucket({
 *   maxTokens: 100,
 *   refillRate: 0 // Never refills
 * });
 * ```
 */

import type { TokenBucketConfig } from "./tokenBucketConfig";

/**
 * Token bucket implementation for rate limiting with burst capacity.
 *
 * Implements a sliding window token bucket algorithm using high-precision
 * timing with on-demand calculation and performance.now() for accurate
 * rate enforcement without background timers.
 *
 * Features:
 * - Configurable burst capacity and refill rate
 * - Thread-safe token consumption
 * - On-demand token refill calculation
 * - High-precision timing without background timers
 */
export class TokenBucket {
  private readonly config: Required<TokenBucketConfig>;
  private currentTokens: number;
  private lastRefillTime: number;

  /**
   * Creates a new token bucket with the specified configuration.
   *
   * @param config - Token bucket configuration
   * @throws Error if configuration is invalid
   */
  constructor(config: TokenBucketConfig) {
    this.validateConfig(config);

    this.config = {
      maxTokens: config.maxTokens,
      refillRate: config.refillRate,
      refillInterval: config.refillInterval ?? 100,
    };

    // Initialize bucket to full capacity
    this.currentTokens = this.config.maxTokens;
    this.lastRefillTime = performance.now();
  }

  /**
   * Attempts to consume the specified number of tokens.
   *
   * @param tokens - Number of tokens to consume (default: 1)
   * @returns true if tokens were successfully consumed, false if insufficient tokens
   */
  consume(tokens: number = 1): boolean {
    if (tokens < 0) {
      return false;
    }

    if (tokens > this.config.maxTokens) {
      return false;
    }

    // Calculate available tokens based on elapsed time
    this.refillToCurrentTime();

    if (this.currentTokens >= tokens) {
      this.currentTokens -= tokens;
      return true;
    }

    return false;
  }

  /**
   * Gets the current number of available tokens.
   *
   * @returns Current token count
   */
  getAvailableTokens(): number {
    // Calculate available tokens based on elapsed time
    this.refillToCurrentTime();
    return this.currentTokens;
  }

  /**
   * Resets the bucket to full capacity.
   */
  reset(): void {
    this.currentTokens = this.config.maxTokens;
    this.lastRefillTime = performance.now();
  }

  /**
   * Destroys the token bucket and cleans up resources.
   *
   * Since timers are no longer used, this method is a no-op but
   * maintained for API compatibility.
   */
  destroy(): void {
    // No cleanup needed since we no longer use timers
  }

  /**
   * Validates the token bucket configuration.
   *
   * @param config - Configuration to validate
   * @throws Error if configuration is invalid
   */
  private validateConfig(config: TokenBucketConfig): void {
    if (config.maxTokens <= 0) {
      throw new Error("Max tokens must be greater than 0");
    }

    if (config.refillRate < 0) {
      throw new Error("Refill rate must be non-negative");
    }

    if (config.refillInterval !== undefined && config.refillInterval <= 0) {
      throw new Error("Refill interval must be greater than 0");
    }
  }

  /**
   * Calculates and adds tokens based on elapsed time since last refill.
   *
   * Performs on-demand token refill calculation using elapsed time
   * and the configured refill rate. Only adds tokens if time has passed
   * and refill rate is positive.
   */
  private refillToCurrentTime(): void {
    const now = performance.now();
    const actualInterval = now - this.lastRefillTime;
    this.lastRefillTime = now;

    const tokensToAdd = Math.floor(
      (this.config.refillRate * actualInterval) / 1000,
    );

    if (tokensToAdd > 0) {
      this.currentTokens = Math.min(
        this.config.maxTokens,
        this.currentTokens + tokensToAdd,
      );
    }
  }
}
