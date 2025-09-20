/**
 * Retry Context Interface
 *
 * Provides context information for retry decision making including current
 * attempt number, error details, response data, and cancellation signals.
 *
 * @example Creating retry context for first attempt
 * ```typescript
 * const context: RetryContext = {
 *   attempt: 0,
 *   lastError: new Error("Connection timeout"),
 *   lastResponse: undefined,
 *   abortSignal: controller.signal
 * };
 * ```
 *
 * @example Context with HTTP response details
 * ```typescript
 * const context: RetryContext = {
 *   attempt: 1,
 *   lastError: new Error("HTTP 503"),
 *   lastResponse: {
 *     status: 503,
 *     statusText: "Service Unavailable",
 *     headers: { "retry-after": "30" },
 *     body: null
 *   },
 *   abortSignal: controller.signal
 * };
 * ```
 */

import type { ProviderHttpResponse } from "../providerHttpResponse";

/**
 * Context information for retry decision making.
 *
 * Provides all necessary information for determining whether to retry a failed
 * request including attempt history, error details, and cancellation state.
 *
 * @property attempt - Current attempt number (0-based, 0 = first retry)
 * @property lastError - Error from the last failed attempt
 * @property lastResponse - HTTP response from last attempt (if available)
 * @property abortSignal - Cancellation signal for early termination
 */
export interface RetryContext {
  /** Current attempt number (0-based, 0 = first retry) */
  attempt: number;

  /** Error from the last failed attempt */
  lastError: Error;

  /** HTTP response from last attempt (if available) */
  lastResponse?: ProviderHttpResponse;

  /** Cancellation signal for early termination */
  abortSignal?: AbortSignal;
}
