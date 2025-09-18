/**
 * Cancellation Error Type Guard
 *
 * Type guard to check if an error is a CancellationError instance.
 */

import { CancellationError } from "./cancellationError";

/**
 * Type guard to check if an error is a CancellationError.
 *
 * @param error - Unknown error to check
 * @returns true if error is CancellationError instance
 */
export function isCancellationError(
  error: unknown,
): error is CancellationError {
  return error instanceof CancellationError;
}
