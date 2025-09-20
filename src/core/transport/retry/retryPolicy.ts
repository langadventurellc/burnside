/**
 * Retry Policy Manager
 *
 * Implements comprehensive retry decision logic that determines when and how
 * to retry HTTP requests based on response status codes, headers, and configuration.
 * Integrates with backoff strategies for intelligent delay calculation.
 *
 * @example Basic usage with exponential backoff
 * ```typescript
 * const policy = new RetryPolicy({
 *   attempts: 3,
 *   backoff: "exponential",
 *   baseDelayMs: 1000,
 *   maxDelayMs: 30000,
 *   jitter: true,
 *   retryableStatusCodes: [429, 500, 502, 503, 504]
 * });
 *
 * const decision = policy.shouldRetry({
 *   attempt: 0,
 *   lastError: new Error("HTTP 503"),
 *   lastResponse: { status: 503, statusText: "Service Unavailable", headers: {}, body: null }
 * });
 * ```
 *
 * @example Handling Retry-After headers
 * ```typescript
 * const delaySeconds = policy.parseRetryAfter({ "retry-after": "120" });
 * // Returns 120000 (milliseconds)
 *
 * const delayDate = policy.parseRetryAfter({
 *   "retry-after": "Wed, 21 Oct 2015 07:28:00 GMT"
 * });
 * // Returns milliseconds until specified date
 * ```
 */

import type { RetryConfig } from "./retryConfig";
import type { RetryContext } from "./retryContext";
import type { RetryDecision } from "./retryDecision";
import type { BackoffCalculator } from "./backoffCalculator";
import { createBackoffStrategy } from "./createBackoffStrategy";

/**
 * Retry policy manager for determining retry behavior.
 *
 * Provides comprehensive retry decision logic including status code evaluation,
 * attempt limit enforcement, Retry-After header parsing, and delay calculation
 * using configurable backoff strategies.
 */
export class RetryPolicy {
  private readonly config: RetryConfig;
  private readonly backoffCalculator: BackoffCalculator;

  /**
   * Creates a new retry policy with the specified configuration.
   *
   * @param config - Retry configuration including attempts, backoff strategy, and timing
   * @throws Error if configuration is invalid (e.g., attempts > 10, negative delays)
   */
  constructor(config: RetryConfig) {
    // Validate configuration
    if (config.attempts < 0 || config.attempts > 10) {
      throw new Error("Retry attempts must be between 0 and 10");
    }
    if (config.baseDelayMs < 0) {
      throw new Error("Base delay must be non-negative");
    }
    if (config.maxDelayMs < config.baseDelayMs) {
      throw new Error("Max delay must be greater than or equal to base delay");
    }
    if (!Array.isArray(config.retryableStatusCodes)) {
      throw new Error("Retryable status codes must be an array");
    }

    this.config = { ...config };
    this.backoffCalculator = createBackoffStrategy({
      strategy: config.backoff,
      baseDelayMs: config.baseDelayMs,
      maxDelayMs: config.maxDelayMs,
      jitter: config.jitter,
      multiplier: 2, // Default multiplier for exponential backoff
    });
  }

  /**
   * Determines whether to retry a failed request and calculates delay.
   *
   * Evaluates retry eligibility based on:
   * 1. Attempt limit not exceeded
   * 2. Status code is retryable
   * 3. Request not cancelled via AbortSignal
   * 4. Retry-After header parsing and delay calculation
   *
   * @param context - Current retry context with attempt info and error details
   * @returns Retry decision with timing and reasoning
   */
  shouldRetry(context: RetryContext): RetryDecision {
    // Check if request was cancelled
    if (context.abortSignal?.aborted) {
      return {
        shouldRetry: false,
        delayMs: 0,
        reason: "Request cancelled via AbortSignal",
      };
    }

    // Check attempt limit
    if (context.attempt >= this.config.attempts) {
      return {
        shouldRetry: false,
        delayMs: 0,
        reason: `Attempt limit exceeded (${context.attempt}/${this.config.attempts})`,
      };
    }

    // Check if status code is retryable (if response available)
    if (context.lastResponse) {
      const isRetryable = this.config.retryableStatusCodes.includes(
        context.lastResponse.status,
      );
      if (!isRetryable) {
        return {
          shouldRetry: false,
          delayMs: 0,
          reason: `Non-retryable status code: ${context.lastResponse.status}`,
        };
      }

      // Check for Retry-After header
      const retryAfterDelay = this.parseRetryAfter(
        context.lastResponse.headers,
      );
      if (retryAfterDelay !== null) {
        const cappedDelay = Math.min(retryAfterDelay, this.config.maxDelayMs);
        return {
          shouldRetry: true,
          delayMs: cappedDelay,
          reason: `Retry-After header specified ${retryAfterDelay}ms (capped at ${cappedDelay}ms)`,
        };
      }
    }

    // Calculate backoff delay
    const backoffDelay = this.backoffCalculator.calculateDelay(context.attempt);
    const delayMs = Math.min(backoffDelay, this.config.maxDelayMs);

    return {
      shouldRetry: true,
      delayMs,
      reason: `Retryable error, ${this.config.backoff} backoff delay: ${delayMs}ms`,
    };
  }

  /**
   * Parses Retry-After header value to milliseconds.
   *
   * Supports two standard formats:
   * - Numeric seconds: "120" -> 120000ms
   * - HTTP date: "Wed, 21 Oct 2015 07:28:00 GMT" -> milliseconds until date
   *
   * @param headers - HTTP response headers
   * @returns Delay in milliseconds, or null if header is missing/invalid
   */
  parseRetryAfter(headers: Record<string, string>): number | null {
    const retryAfter = headers["retry-after"] || headers["Retry-After"];
    if (!retryAfter) {
      return null;
    }

    // Try parsing as seconds (numeric format)
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds)) {
      if (seconds >= 0) {
        return seconds * 1000; // Convert to milliseconds
      } else {
        return null; // Negative values are invalid
      }
    }

    // Try parsing as HTTP date
    const date = new Date(retryAfter);
    if (!isNaN(date.getTime())) {
      const delayMs = date.getTime() - Date.now();
      return delayMs > 0 ? delayMs : 0; // Don't return negative delays
    }

    // Invalid format
    return null;
  }

  /**
   * Updates retry configuration at runtime.
   *
   * Recreates the backoff strategy if timing parameters change.
   * Validates new configuration before applying changes.
   *
   * @param config - Partial configuration to update
   * @throws Error if updated configuration is invalid
   */
  updateConfig(config: Partial<RetryConfig>): void {
    const newConfig = { ...this.config, ...config };

    // Validate updated configuration
    if (newConfig.attempts < 0 || newConfig.attempts > 10) {
      throw new Error("Retry attempts must be between 0 and 10");
    }
    if (newConfig.baseDelayMs < 0) {
      throw new Error("Base delay must be non-negative");
    }
    if (newConfig.maxDelayMs < newConfig.baseDelayMs) {
      throw new Error("Max delay must be greater than or equal to base delay");
    }
    if (
      newConfig.retryableStatusCodes &&
      !Array.isArray(newConfig.retryableStatusCodes)
    ) {
      throw new Error("Retryable status codes must be an array");
    }

    // Update configuration
    Object.assign(this.config, config);

    // Recreate backoff strategy if timing parameters changed
    if (
      config.backoff !== undefined ||
      config.baseDelayMs !== undefined ||
      config.maxDelayMs !== undefined ||
      config.jitter !== undefined
    ) {
      const newBackoffCalculator = createBackoffStrategy({
        strategy: this.config.backoff,
        baseDelayMs: this.config.baseDelayMs,
        maxDelayMs: this.config.maxDelayMs,
        jitter: this.config.jitter,
        multiplier: 2,
      });
      Object.defineProperty(this, "backoffCalculator", {
        value: newBackoffCalculator,
        writable: false,
      });
    }
  }
}
