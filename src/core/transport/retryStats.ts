/**
 * Retry Statistics Interface
 *
 * Provides statistical information about retry operations for monitoring
 * and observability purposes. Tracks attempt counts, delays, and success rates.
 *
 * @example Accessing retry statistics
 * ```typescript
 * const transport = new EnhancedHttpTransport(config);
 * const stats = transport.getRetryStats();
 *
 * console.log(`Total attempts: ${stats.totalAttempts}`);
 * console.log(`Successful retries: ${stats.successfulRetries}`);
 * console.log(`Average delay: ${stats.averageDelayMs}ms`);
 * ```
 */

/**
 * Interface for retry operation statistics.
 *
 * Provides metrics for monitoring retry behavior including attempt counts,
 * success rates, and timing information for observability and debugging.
 */
export interface RetryStats {
  /** Total number of retry attempts made across all requests */
  totalAttempts: number;

  /** Number of requests that succeeded after retrying */
  successfulRetries: number;

  /** Number of requests that failed after exhausting all retries */
  failedRetries: number;

  /** Average delay in milliseconds between retry attempts */
  averageDelayMs: number;

  /** Maximum delay in milliseconds encountered during retries */
  maxDelayMs: number;
}
