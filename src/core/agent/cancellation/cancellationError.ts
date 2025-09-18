/**
 * Core Cancellation Error
 *
 * Core cancellation error for agent execution cancellation scenarios.
 * Provides detailed context about where cancellation occurred, cleanup status,
 * and original cancellation reason for debugging and monitoring.
 */

import type { CancellationPhase } from "./cancellationPhase";

/**
 * Core cancellation error for agent execution cancellation scenarios.
 *
 * Provides detailed context about where cancellation occurred, cleanup status,
 * and original cancellation reason for debugging and monitoring.
 */
export class CancellationError extends Error {
  /**
   * Error code identifying this as a cancellation error.
   */
  readonly code: "CANCELLATION_ERROR" | "GRACEFUL_CANCELLATION_TIMEOUT" =
    "CANCELLATION_ERROR";

  /**
   * Optional reason for cancellation from external signal.
   */
  readonly reason?: string;

  /**
   * Execution phase where cancellation occurred.
   */
  readonly phase: CancellationPhase;

  /**
   * Whether cleanup operations completed successfully.
   */
  readonly cleanupCompleted: boolean;

  /**
   * Timestamp when cancellation was detected (milliseconds since epoch).
   */
  readonly timestamp: number;

  constructor(
    message: string,
    phase: CancellationPhase,
    cleanupCompleted: boolean,
    reason?: string,
    timestamp: number = Date.now(),
  ) {
    super(message);
    this.name = this.constructor.name;
    this.phase = phase;
    this.cleanupCompleted = cleanupCompleted;
    this.reason = reason;
    this.timestamp = timestamp;

    // Maintain proper stack trace for V8-based engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Custom JSON serialization for error objects.
   * Ensures all cancellation context is included in JSON.stringify().
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      reason: this.reason,
      phase: this.phase,
      cleanupCompleted: this.cleanupCompleted,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}
