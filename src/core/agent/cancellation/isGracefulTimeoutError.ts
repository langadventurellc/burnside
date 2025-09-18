/**
 * Graceful Timeout Error Type Guard
 *
 * Type guard to check if an error is a GracefulCancellationTimeoutError instance.
 */

import { GracefulCancellationTimeoutError } from "./gracefulCancellationTimeoutError";

/**
 * Type guard to check if an error is a GracefulCancellationTimeoutError.
 *
 * @param error - Unknown error to check
 * @returns true if error is GracefulCancellationTimeoutError instance
 */
export function isGracefulTimeoutError(
  error: unknown,
): error is GracefulCancellationTimeoutError {
  return error instanceof GracefulCancellationTimeoutError;
}
