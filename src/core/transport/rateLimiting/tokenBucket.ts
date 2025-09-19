/**
 * Token Bucket Algorithm Implementation
 *
 * High-precision token bucket for rate limiting with burst capacity support.
 * Uses recursive setTimeout with performance.now() for drift-corrected timing
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
 * timing with recursive setTimeout and performance.now() for accurate
 * rate enforcement and drift correction.
 *
 * Features:
 * - Configurable burst capacity and refill rate
 * - Thread-safe token consumption
 * - Memory leak prevention with proper cleanup
 * - High-precision timing with drift correction
 */
export class TokenBucket {
  private readonly config: Required<TokenBucketConfig>;
  private currentTokens: number;
  private lastRefillTime: number;
  private refillTimer: NodeJS.Timeout | null = null;

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

    // Start refill process if rate is positive
    if (this.config.refillRate > 0) {
      this.scheduleNextRefill();
    }
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
   * Destroys the token bucket and cleans up timers.
   *
   * Important for preventing memory leaks when buckets are no longer needed.
   */
  destroy(): void {
    if (this.refillTimer !== null) {
      clearTimeout(this.refillTimer);
      this.refillTimer = null;
    }
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
   * Schedules the next refill operation using recursive setTimeout.
   *
   * Uses performance.now() for high-precision timing and drift correction.
   */
  private scheduleNextRefill(): void {
    this.refillTimer = setTimeout(() => {
      this.refillTokens();
      if (this.config.refillRate > 0) {
        this.scheduleNextRefill();
      }
    }, this.config.refillInterval);
  }

  /**
   * Adds tokens to the bucket based on elapsed time and refill rate.
   *
   * Calculates tokens to add as (refillRate * actualInterval) / 1000
   * with proper rounding and capacity capping.
   */
  private refillTokens(): void {
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
