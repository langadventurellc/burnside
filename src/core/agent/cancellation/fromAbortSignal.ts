/**
 * AbortSignal Error Factory
 *
 * Factory method to create cancellation error from AbortSignal.
 */

import { CancellationError } from "./cancellationError";
import type { CancellationPhase } from "./cancellationPhase";

/**
 * Safely extracts reason from AbortSignal with proper type checking.
 *
 * @param signal - AbortSignal to extract reason from
 * @returns string reason or default message
 */
function extractReasonFromSignal(signal: AbortSignal): string {
  if (typeof signal.reason === "string") {
    return signal.reason;
  }

  if (
    signal.reason &&
    typeof signal.reason === "object" &&
    "toString" in signal.reason
  ) {
    try {
      const result = (signal.reason as { toString(): string }).toString();
      return typeof result === "string" ? result : "AbortSignal triggered";
    } catch {
      return "AbortSignal triggered";
    }
  }

  return "AbortSignal triggered";
}

/**
 * Factory method to create cancellation error from AbortSignal.
 *
 * @param signal - AbortSignal that triggered cancellation
 * @param phase - Execution phase where cancellation was detected
 * @param cleanupCompleted - Whether cleanup completed successfully
 * @returns CancellationError instance
 */
export function fromAbortSignal(
  signal: AbortSignal,
  phase: CancellationPhase,
  cleanupCompleted: boolean = false,
): CancellationError {
  const reason = extractReasonFromSignal(signal);
  const message = `Agent execution cancelled via AbortSignal during ${phase} phase`;

  return new CancellationError(message, phase, cleanupCompleted, reason);
}
