/**
 * Retry Decision Interface
 *
 * Represents the outcome of retry decision logic including whether to retry,
 * how long to wait, and the reasoning behind the decision.
 *
 * @example Successful retry decision with exponential backoff
 * ```typescript
 * const decision: RetryDecision = {
 *   shouldRetry: true,
 *   delayMs: 2000,
 *   reason: "Retryable status code 503, exponential backoff delay"
 * };
 * ```
 *
 * @example No retry due to attempt limit
 * ```typescript
 * const decision: RetryDecision = {
 *   shouldRetry: false,
 *   delayMs: 0,
 *   reason: "Attempt limit exceeded (3/3)"
 * };
 * ```
 *
 * @example Retry with provider-specified delay
 * ```typescript
 * const decision: RetryDecision = {
 *   shouldRetry: true,
 *   delayMs: 60000,
 *   reason: "Retry-After header specified 60 seconds"
 * };
 * ```
 */

/**
 * Decision outcome for retry attempts.
 *
 * Contains the retry decision along with timing information and reasoning
 * to help with debugging and monitoring retry behavior.
 *
 * @property shouldRetry - Whether the request should be retried
 * @property delayMs - Delay in milliseconds before next attempt (0 if no retry)
 * @property reason - Human-readable explanation of the decision
 */
export interface RetryDecision {
  /** Whether the request should be retried */
  shouldRetry: boolean;

  /** Delay in milliseconds before next attempt (0 if no retry) */
  delayMs: number;

  /** Human-readable explanation of the decision */
  reason: string;
}
