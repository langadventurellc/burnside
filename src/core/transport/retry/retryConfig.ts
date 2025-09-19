/**
 * Retry Configuration Interface
 *
 * Defines configuration options for HTTP request retry behavior including
 * attempt limits, backoff strategies, timing parameters, and retryable conditions.
 *
 * @example Basic exponential backoff configuration
 * ```typescript
 * const config: RetryConfig = {
 *   attempts: 3,
 *   backoff: "exponential",
 *   baseDelayMs: 1000,
 *   maxDelayMs: 30000,
 *   jitter: true,
 *   retryableStatusCodes: [429, 500, 502, 503, 504]
 * };
 * ```
 *
 * @example Linear backoff with custom status codes
 * ```typescript
 * const config: RetryConfig = {
 *   attempts: 2,
 *   backoff: "linear",
 *   baseDelayMs: 2000,
 *   maxDelayMs: 10000,
 *   jitter: false,
 *   retryableStatusCodes: [429, 503]
 * };
 * ```
 */

/**
 * Configuration interface for retry behavior and policies.
 *
 * @property attempts - Maximum number of retry attempts (0-10 range)
 * @property backoff - Backoff strategy type for delay calculation
 * @property baseDelayMs - Base delay in milliseconds for backoff calculation
 * @property maxDelayMs - Maximum delay cap in milliseconds
 * @property jitter - Whether to apply random jitter to prevent thundering herd
 * @property retryableStatusCodes - HTTP status codes that should trigger retries
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (0-10 range, default: 2) */
  attempts: number;

  /** Backoff strategy type for delay calculation (default: "exponential") */
  backoff: "exponential" | "linear";

  /** Base delay in milliseconds for backoff calculation (default: 1000) */
  baseDelayMs: number;

  /** Maximum delay cap in milliseconds (default: 30000) */
  maxDelayMs: number;

  /** Whether to apply random jitter to prevent thundering herd (default: true) */
  jitter: boolean;

  /** HTTP status codes that should trigger retries (default: [429, 500, 502, 503, 504]) */
  retryableStatusCodes: number[];
}
