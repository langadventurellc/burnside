/**
 * Error thrown when conversation exceeds maximum iteration limit.
 *
 * Provides detailed context about iteration limits, conversation state,
 * and timing information for debugging runaway conversations.
 */

import type { MultiTurnState } from "./multiTurnState";
import type { ExecutionMetrics } from "./executionMetrics";
import { MultiTurnExecutionError } from "./multiTurnErrors";

/**
 * Error thrown when conversation exceeds maximum iteration limit.
 *
 * Provides detailed context about iteration limits, conversation state,
 * and timing information for debugging runaway conversations.
 */
export class MaxIterationsExceededError extends MultiTurnExecutionError {
  /**
   * Current iteration when limit was exceeded.
   */
  readonly currentIteration: number;

  /**
   * Maximum iterations that were configured.
   */
  readonly maxIterations: number;

  constructor(
    currentIteration: number,
    maxIterations: number,
    context: Partial<MultiTurnState>,
    options: {
      metrics?: ExecutionMetrics;
      debugContext?: Record<string, unknown>;
    } = {},
  ) {
    super(
      `Conversation exceeded maximum iterations: ${currentIteration}/${maxIterations}`,
      "termination_check",
      new Error(
        `Maximum iterations exceeded: ${currentIteration}/${maxIterations}`,
      ),
      context,
      {
        ...options,
        recoveryAction: "abort",
        debugContext: {
          errorType: "max_iterations_exceeded",
          iterationLimit: maxIterations,
          actualIterations: currentIteration,
          ...options.debugContext,
        },
      },
    );

    this.name = "MaxIterationsExceededError";
    this.currentIteration = currentIteration;
    this.maxIterations = maxIterations;
  }

  /**
   * Converts error to JSON with iteration-specific context.
   */
  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      currentIteration: this.currentIteration,
      maxIterations: this.maxIterations,
    };
  }
}
