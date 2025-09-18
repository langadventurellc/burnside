/**
 * Timeout Error Factory
 *
 * Factory method to create a timeout-specific cancellation error.
 */

import { GracefulCancellationTimeoutError } from "./gracefulCancellationTimeoutError";
import type { CancellationPhase } from "./cancellationPhase";

/**
 * Factory method to create a timeout-specific cancellation error.
 *
 * @param timeoutMs - Timeout value that was exceeded
 * @param cleanupAttempted - Whether cleanup was attempted
 * @param phase - Execution phase where timeout occurred
 * @param reason - Optional cancellation reason
 * @returns GracefulCancellationTimeoutError instance
 */
export function createTimeoutError(
  timeoutMs: number,
  cleanupAttempted: boolean,
  phase: CancellationPhase = "cleanup",
  reason?: string,
): GracefulCancellationTimeoutError {
  const message = `Graceful cancellation timeout after ${timeoutMs}ms during ${phase} phase`;

  return new GracefulCancellationTimeoutError(
    message,
    phase,
    timeoutMs,
    cleanupAttempted,
    reason,
  );
}
