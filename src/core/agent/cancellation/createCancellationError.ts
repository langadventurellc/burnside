/**
 * Cancellation Error Factory
 *
 * Factory method to create a standard cancellation error.
 */

import { CancellationError } from "./cancellationError";
import type { CancellationPhase } from "./cancellationPhase";

/**
 * Factory method to create a standard cancellation error.
 *
 * @param reason - Optional reason for cancellation
 * @param phase - Execution phase where cancellation occurred
 * @param cleanupCompleted - Whether cleanup completed successfully
 * @returns CancellationError instance
 */
export function createCancellationError(
  reason: string | undefined,
  phase: CancellationPhase,
  cleanupCompleted: boolean = false,
): CancellationError {
  const message = reason
    ? `Agent execution cancelled: ${reason}`
    : `Agent execution cancelled during ${phase} phase`;

  return new CancellationError(message, phase, cleanupCompleted, reason);
}
