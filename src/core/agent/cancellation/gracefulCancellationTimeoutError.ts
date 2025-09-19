/**
 * Graceful Cancellation Timeout Error
 *
 * Timeout-specific cancellation error for graceful cancellation timeout scenarios.
 * Extends CancellationError with timeout context for scenarios where graceful
 * cancellation exceeded configured timeout limits.
 */

import { CancellationError } from "./cancellationError";
import type { CancellationPhase } from "./cancellationPhase";

/**
 * Timeout-specific cancellation error for graceful cancellation timeout scenarios.
 *
 * Extends CancellationError with timeout context for scenarios where graceful
 * cancellation exceeded configured timeout limits.
 */
export class GracefulCancellationTimeoutError extends CancellationError {
  /**
   * Error code identifying this as a graceful cancellation timeout.
   */
  readonly code = "GRACEFUL_CANCELLATION_TIMEOUT" as const;

  /**
   * Timeout value that was exceeded (milliseconds).
   */
  readonly timeoutMs: number;

  /**
   * Whether cleanup was attempted before timeout.
   */
  readonly cleanupAttempted: boolean;

  constructor(
    message: string,
    phase: CancellationPhase,
    timeoutMs: number,
    cleanupAttempted: boolean,
    reason?: string,
    timestamp: number = Date.now(),
  ) {
    super(message, phase, false, reason, timestamp);
    this.name = this.constructor.name;
    this.timeoutMs = timeoutMs;
    this.cleanupAttempted = cleanupAttempted;
    // Set the specific code after construction
    Object.defineProperty(this, "code", {
      value: "GRACEFUL_CANCELLATION_TIMEOUT",
      writable: false,
      enumerable: true,
      configurable: false,
    });
  }

  /**
   * Custom JSON serialization including timeout context.
   */
  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      timeoutMs: this.timeoutMs,
      cleanupAttempted: this.cleanupAttempted,
    };
  }
}
