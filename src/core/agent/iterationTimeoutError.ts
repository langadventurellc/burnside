/**
 * Error thrown when individual iteration exceeds timeout limit.
 *
 * Provides detailed timing information and iteration context for
 * debugging slow iterations or timeout configuration issues.
 */

import type { MultiTurnState } from "./multiTurnState";
import type { ExecutionMetrics } from "./executionMetrics";
import { MultiTurnExecutionError } from "./multiTurnErrors";

/**
 * Error thrown when individual iteration exceeds timeout limit.
 *
 * Provides detailed timing information and iteration context for
 * debugging slow iterations or timeout configuration issues.
 */
export class IterationTimeoutError extends MultiTurnExecutionError {
  /**
   * Iteration number that timed out.
   */
  readonly iteration: number;

  /**
   * Configured timeout in milliseconds.
   */
  readonly timeoutMs: number;

  /**
   * Actual execution time before timeout.
   */
  readonly actualExecutionTime: number;

  constructor(
    iteration: number,
    timeoutMs: number,
    actualExecutionTime: number,
    context: Partial<MultiTurnState>,
    options: {
      metrics?: ExecutionMetrics;
      debugContext?: Record<string, unknown>;
    } = {},
  ) {
    super(
      `Iteration ${iteration} exceeded timeout: ${actualExecutionTime}ms > ${timeoutMs}ms`,
      "iteration_start",
      new Error(`Iteration timeout: ${actualExecutionTime}ms > ${timeoutMs}ms`),
      context,
      {
        ...options,
        recoveryAction: "abort",
        debugContext: {
          errorType: "iteration_timeout",
          timeoutLimit: timeoutMs,
          actualTime: actualExecutionTime,
          iterationNumber: iteration,
          ...options.debugContext,
        },
      },
    );

    this.name = "IterationTimeoutError";
    this.iteration = iteration;
    this.timeoutMs = timeoutMs;
    this.actualExecutionTime = actualExecutionTime;
  }

  /**
   * Converts error to JSON with timeout-specific context.
   */
  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      iteration: this.iteration,
      timeoutMs: this.timeoutMs,
      actualExecutionTime: this.actualExecutionTime,
    };
  }
}
